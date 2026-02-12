// High-velocity outreach cron — processes queued emails in parallel batches
// Features: multi-inbox rotation, daily limit enforcement, parallel AI generation,
// QA gate, ICP-prioritized sending, tracking disabled for deliverability

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { generateUnsubToken } from '@/app/api/unsubscribe/route';

const QUEUE_FETCH_LIMIT = 50;  // Max emails to pull per cron run
const SEND_BATCH_SIZE = 10;    // Concurrent sends per batch
const GENERATE_BATCH_SIZE = 5; // Concurrent AI generations per batch

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const startTime = Date.now();
    console.log(`[outreach-cron] Started at ${new Date().toISOString()}`);
    
    // 1. Get queued emails — high limit for volume
    const { data: queuedEmails, error: queueError } = await supabase
      .from('outreach_queue')
      .select(`
        *,
        outreach_campaigns (id, name, status),
        leads (
          id, name, email, company, title, first_name, last_name, company_domain,
          linkedin_url, phone, location, industry, company_size,
          enriched_data, lead_status, icp_score
        ),
        connected_inboxes (id, email_address, grant_id)
      `)
      .eq('status', 'queued')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(QUEUE_FETCH_LIMIT);

    if (queueError) {
      console.error('[outreach-cron] Queue fetch error:', queueError);
      return NextResponse.json({ error: 'Database error', details: queueError.message }, { status: 500 });
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return NextResponse.json({ message: 'No emails to process', processed: 0 });
    }

    // Sort by ICP score (highest first) for priority sending
    queuedEmails.sort((a, b) => {
      const scoreA = a.leads?.icp_score || 0;
      const scoreB = b.leads?.icp_score || 0;
      return scoreB - scoreA;
    });

    console.log(`[outreach-cron] Fetched ${queuedEmails.length} queued emails`);

    // 2. Build per-user inbox availability map (multi-inbox rotation)
    const userInboxMap = new Map<string, Array<{ inbox_id: string; email_address: string; grant_id: string; remaining_sends: number }>>();

    const uniqueUserIds = [...new Set(queuedEmails.map(q => q.user_id))];
    await Promise.all(uniqueUserIds.map(async (userId) => {
      try {
        const { data: inboxes } = await supabase.rpc('get_available_inboxes_for_sending', { p_user_id: userId });
        if (inboxes && inboxes.length > 0) {
          userInboxMap.set(userId, inboxes.map((ib: any) => ({
            inbox_id: ib.inbox_id,
            email_address: ib.email_address,
            grant_id: ib.grant_id,
            remaining_sends: ib.remaining_sends
          })));
        }
      } catch (err) {
        console.warn(`[outreach-cron] Failed to get inboxes for user ${userId}:`, err);
      }
    }));

    // 3. Filter + assign inboxes — skip leads that should stop, enforce daily limits
    const readyToProcess: Array<{ queueItem: any; assignedInbox: { inbox_id: string; email_address: string; grant_id: string } }> = [];
    const results: any[] = [];

    for (const queueItem of queuedEmails) {
      const lead = queueItem.leads;
      if (!lead) {
        results.push({ queueId: queueItem.id, status: 'skipped', reason: 'no_lead_data' });
        continue;
      }

      // Check stop conditions
      const shouldStop = await checkStopConditions(supabase, lead, queueItem);
      if (shouldStop.stop) {
        await supabase.from('outreach_queue').update({ status: 'skipped', error_message: shouldStop.reason }).eq('id', queueItem.id);
        results.push({ queueId: queueItem.id, leadEmail: lead.email, status: 'auto_stopped', reason: shouldStop.reason });
        continue;
      }

      // Get available inbox for this user (round-robin with remaining capacity)
      const userInboxes = userInboxMap.get(queueItem.user_id);
      if (!userInboxes || userInboxes.length === 0) {
        results.push({ queueId: queueItem.id, leadEmail: lead.email, status: 'skipped', reason: 'no_available_inbox_or_daily_limit_reached' });
        continue;
      }

      // Pick inbox with most remaining sends (load balancing)
      userInboxes.sort((a, b) => b.remaining_sends - a.remaining_sends);
      const bestInbox = userInboxes[0];

      if (bestInbox.remaining_sends <= 0) {
        results.push({ queueId: queueItem.id, leadEmail: lead.email, status: 'skipped', reason: 'all_inboxes_at_daily_limit' });
        continue;
      }

      // Decrement local counter so next iteration picks a different inbox
      bestInbox.remaining_sends--;

      readyToProcess.push({
        queueItem,
        assignedInbox: { inbox_id: bestInbox.inbox_id, email_address: bestInbox.email_address, grant_id: bestInbox.grant_id }
      });
    }

    console.log(`[outreach-cron] ${readyToProcess.length} emails ready after filtering (${queuedEmails.length - readyToProcess.length} skipped)`);

    // 4. Mark all as processing in one batch
    if (readyToProcess.length > 0) {
      const processingIds = readyToProcess.map(r => r.queueItem.id);
      await supabase.from('outreach_queue').update({ status: 'processing' }).in('id', processingIds);
    }

    // 5. Pre-fetch angle data for queue items that have angle_id
    const angleIds = [...new Set(readyToProcess.map(i => i.queueItem.angle_id).filter(Boolean))];
    const angleMap: Record<number, any> = {};
    if (angleIds.length > 0) {
      const { data: angles } = await supabase
        .from('icp_angles')
        .select('id, name, value_proposition, pain_points, hooks, proof_points, tone')
        .in('id', angleIds);
      for (const a of (angles || [])) {
        angleMap[a.id] = a;
      }
    }

    // 6. Generate emails in parallel batches (AI is the bottleneck)
    for (let i = 0; i < readyToProcess.length; i += GENERATE_BATCH_SIZE) {
      const genBatch = readyToProcess.slice(i, i + GENERATE_BATCH_SIZE);
      await Promise.all(genBatch.map(async (item) => {
        try {
          const sequenceStep = item.queueItem.sequence_step || 1;
          const isFirstEmail = sequenceStep === 1;
          const angle = item.queueItem.angle_id ? angleMap[item.queueItem.angle_id] : null;
          item.queueItem._generatedEmail = isFirstEmail
            ? await generateInitialEmail(item.queueItem, angle)
            : await generateFollowUpEmail(item.queueItem, sequenceStep, angle);
        } catch (err) {
          console.error(`[outreach-cron] Email generation failed for ${item.queueItem.leads?.email}:`, err);
          item.queueItem._generatedEmail = null;
          item.queueItem._genError = err instanceof Error ? err.message : 'Generation failed';
        }
      }));
    }

    // 7. QA check in parallel batches
    await Promise.all(readyToProcess.map(async (item) => {
      if (!item.queueItem._generatedEmail) return;
      try {
        const lead = item.queueItem.leads;
        const sequenceStep = item.queueItem.sequence_step || 1;
        const qaResponse = await fetch(`${process.env.PYTHON_SERVICE_URL}/email-qa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: item.queueItem._generatedEmail.subject,
            body: item.queueItem._generatedEmail.body,
            step_number: sequenceStep,
            lead_name: lead.name || lead.first_name || '',
            company: lead.company || '',
            skip_ai_review: true
          })
        });
        if (qaResponse.ok) {
          const qaResult = await qaResponse.json();
          if (!qaResult.passed) {
            if (qaResult.rewritten_subject && qaResult.rewritten_body) {
              item.queueItem._generatedEmail.subject = qaResult.rewritten_subject;
              item.queueItem._generatedEmail.body = qaResult.rewritten_body;
            } else {
              item.queueItem._qaBlocked = true;
              item.queueItem._qaIssues = qaResult.issues?.join('; ') || 'QA failed';
              item.queueItem._qaScore = qaResult.score;
            }
          }
        }
      } catch {
        // QA service down — fail-open, proceed with send
      }
    }));

    // 8. Send emails in parallel batches
    for (let i = 0; i < readyToProcess.length; i += SEND_BATCH_SIZE) {
      const sendBatch = readyToProcess.slice(i, i + SEND_BATCH_SIZE);
      const batchResults = await Promise.all(sendBatch.map(async (item) => {
        const { queueItem, assignedInbox } = item;
        const lead = queueItem.leads;
        const sequenceStep = queueItem.sequence_step || 1;

        // Check suppression list before sending
        const { data: isSuppressed } = await supabase.rpc('is_email_suppressed', {
          p_user_id: queueItem.user_id,
          p_email: lead.email
        });
        if (isSuppressed) {
          await supabase.from('outreach_queue').update({ status: 'cancelled', error_message: 'Email suppressed (unsubscribed/DNC)' }).eq('id', queueItem.id);
          return { queueId: queueItem.id, leadEmail: lead.email, status: 'suppressed' };
        }

        // Handle generation failures
        if (!queueItem._generatedEmail) {
          await supabase.from('outreach_queue').update({ status: 'failed', error_message: queueItem._genError || 'Email generation failed' }).eq('id', queueItem.id);
          return { queueId: queueItem.id, leadEmail: lead.email, status: 'failed', error: queueItem._genError };
        }

        // Handle QA blocks
        if (queueItem._qaBlocked) {
          await supabase.from('outreach_queue').update({ status: 'qa_failed', error_message: `QA blocked (score: ${queueItem._qaScore}): ${queueItem._qaIssues}` }).eq('id', queueItem.id);
          return { queueId: queueItem.id, leadEmail: lead.email, status: 'qa_failed', reason: queueItem._qaIssues };
        }

        try {
          const emailData = queueItem._generatedEmail;

          // Build unsubscribe link + headers
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.connectlead.io';
          const unsubToken = generateUnsubToken(queueItem.user_id, lead.email);
          const unsubUrl = `${siteUrl}/api/unsubscribe?token=${unsubToken}`;

          // Append unsubscribe footer to email body
          const bodyWithUnsub = emailData.body + `\n\n<p style="font-size:11px;color:#999;margin-top:30px;"><a href="${unsubUrl}" style="color:#999;text-decoration:underline;">Unsubscribe</a></p>`;

          // Send via Nylas using assigned inbox (may differ from original)
          const sendResponse = await fetch(`https://api.us.nylas.com/v3/grants/${assignedInbox.grant_id}/messages/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: [{ email: lead.email, name: lead.name }],
              from: [{ email: assignedInbox.email_address }],
              subject: emailData.subject,
              body: bodyWithUnsub,
              reply_to: [{ email: assignedInbox.email_address }],
              tracking: { opens: false, links: false, thread_replies: true },
              headers: {
                'List-Unsubscribe': `<${unsubUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
              }
            }),
          });

          if (!sendResponse.ok) {
            const errorText = await sendResponse.text();
            throw new Error(`Nylas send failed: ${errorText}`);
          }

          const sendResult = await sendResponse.json();

          // Increment inbox daily count + record send time stats
          try {
            await Promise.all([
              supabase.rpc('increment_inbox_daily_count', {
                p_inbox_id: assignedInbox.inbox_id,
                p_user_id: queueItem.user_id
              }),
              supabase.rpc('record_send_event', {
                p_user_id: queueItem.user_id,
                p_timezone: lead.timezone || 'America/New_York',
                p_sent_at: new Date().toISOString()
              })
            ]);
          } catch (limitErr) {
            console.warn(`[outreach-cron] Failed to increment daily count / record send:`, limitErr);
          }

          // Update queue + lead + record sent email in parallel
          await Promise.all([
            supabase.from('outreach_queue').update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              thread_id: sendResult.data?.id
            }).eq('id', queueItem.id),

            supabase.from('leads').update({
              last_contacted_at: new Date().toISOString()
            }).eq('id', lead.id),

            supabase.from('sent_emails').insert({
              user_id: queueItem.user_id,
              campaign_id: queueItem.campaign_id,
              lead_id: lead.id,
              inbox_id: assignedInbox.inbox_id,
              subject: emailData.subject,
              body: emailData.body,
              sent_at: new Date().toISOString(),
              thread_id: sendResult.data?.id,
              sequence_step: sequenceStep,
              ...(queueItem.angle_id ? { angle_id: queueItem.angle_id } : {})
            })
          ]);

          // Check if sequence completed
          const { data: remainingSteps } = await supabase
            .from('outreach_queue')
            .select('id')
            .eq('campaign_id', queueItem.campaign_id)
            .eq('lead_id', lead.id)
            .eq('status', 'queued');

          if (!remainingSteps || remainingSteps.length === 0) {
            await supabase.from('leads').update({ lead_status: 'sequence_completed' }).eq('id', lead.id);
          }

          return { queueId: queueItem.id, leadEmail: lead.email, status: 'sent', sequenceStep, messageId: sendResult.data?.id, inbox: assignedInbox.email_address };

        } catch (error) {
          await supabase.from('outreach_queue').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Unknown error' }).eq('id', queueItem.id);
          return { queueId: queueItem.id, leadEmail: lead.email, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }));

      results.push(...batchResults);
    }

    const elapsed = Date.now() - startTime;
    const sent = results.filter(r => r.status === 'sent').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => ['auto_stopped', 'skipped', 'qa_failed'].includes(r.status)).length;

    console.log(`[outreach-cron] Done in ${elapsed}ms — sent: ${sent}, failed: ${failed}, skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      sent,
      failed,
      skipped,
      elapsed_ms: elapsed,
      results
    });

  } catch (error) {
    console.error('[outreach-cron] Fatal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Vercel crons send GET requests — delegate to POST handler
export async function GET(request: NextRequest) {
  return POST(request);
}

// Check if sequence should be stopped
async function checkStopConditions(supabase: any, lead: any, queueItem: any) {
  // Check for do-not-contact statuses
  if (['unsubscribed', 'spam_reported', 'do_not_contact', 'bounced'].includes(lead.lead_status)) {
    return { stop: true, reason: lead.lead_status };
  }

  // Check if lead replied
  if (lead.lead_status === 'replied') {
    return { stop: true, reason: 'replied' };
  }

  // Check if meeting booked
  if (lead.lead_status === 'meeting_booked') {
    return { stop: true, reason: 'meeting_booked' };
  }

  // Check if lead has recent replies in database
  const { data: recentReplies } = await supabase
    .from('replies')
    .select('id')
    .eq('sender_email', lead.email)
    .gte('received_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(1);

  if (recentReplies && recentReplies.length > 0) {
    return { stop: true, reason: 'replied' };
  }

  // No stop conditions met
  return { stop: false };
}

// Generate initial email using copywriter agent
async function generateInitialEmail(queueItem: any, angle?: any) {
  const lead = queueItem.leads;
  const offer = queueItem.offer_data;

  // If angle exists, prefer angle's pain points/proof points over offer defaults
  const anglePainPoints = Array.isArray(angle?.pain_points) ? angle.pain_points : [];
  const offerPainPoints = Array.isArray(offer?.pain_points) ? offer.pain_points : [];
  const leadPainPoints = Array.isArray(lead?.pain_points) ? lead.pain_points : [];
  const combinedPainPoints = [...(anglePainPoints.length > 0 ? anglePainPoints : offerPainPoints), ...leadPainPoints].filter(Boolean);

  // Get proof points — angle overrides offer if present
  const proofPoints = Array.isArray(angle?.proof_points) && angle.proof_points.length > 0
    ? angle.proof_points
    : (Array.isArray(offer?.proof_points) ? offer.proof_points : []);
  
  // Get benefits from offer
  const benefits = Array.isArray(offer?.benefits) ? offer.benefits : [];
  
  // Get sales assets/lead magnets from offer
  const salesAssets = Array.isArray(offer?.sales_assets) ? offer.sales_assets : [];

  const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-cold-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: lead.name || `${lead.first_name} ${lead.last_name}`.trim(),
      title: lead.title || '',
      company: lead.company,
      email: lead.email,
      offer: angle?.value_proposition || offer?.value_proposition || '',
      hook_snippet: (angle?.hooks && angle.hooks.length > 0 ? angle.hooks[Math.floor(Math.random() * angle.hooks.length)] : '') || offer?.hook_snippet || '',
      // Pass combined pain points for R.P.I.C Role Reality
      pain_points: combinedPainPoints.join(', '),
      // Enhanced lead context with ALL offer enrichment data
      lead_context: JSON.stringify({
        // Lead data
        ...lead,
        // Campaign context
        campaign_name: queueItem.outreach_campaigns?.name,
        // Offer data for R.P.I.C framework
        offer_name: offer?.name,
        offer_value_proposition: offer?.value_proposition,
        offer_call_to_action: offer?.call_to_action,
        // Pain points for Role Reality
        offer_pain_points: offerPainPoints,
        lead_pain_points: leadPainPoints,
        // Proof points for Credible Use Case
        proof_points: proofPoints,
        // Benefits for Intervention
        benefits: benefits,
        // Sales assets for value adds
        sales_assets: salesAssets,
        // Company description for context
        company_description: offer?.company_description,
        // Excluded terms to avoid
        excluded_terms: offer?.excluded_terms,
        // Angle context for A/B testing
        ...(angle ? {
          angle_name: angle.name,
          angle_value_proposition: angle.value_proposition,
          angle_tone: angle.tone,
          angle_hooks: angle.hooks,
          angle_pain_points: anglePainPoints,
          angle_proof_points: angle.proof_points
        } : {})
      }),
      // Sequence context
      step_number: 1,
      total_steps: queueItem.total_steps || 3,
      objective: queueItem.objective || 'meetings'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate email: ${response.status}`);
  }

  return await response.json();
}

// Generate follow-up email using strategic follow-up agent
async function generateFollowUpEmail(queueItem: any, stepNumber: number, angle?: any) {
  const lead = queueItem.leads;
  const offer = queueItem.offer_data;

  // Determine engagement level based on lead status
  const engagementLevel = lead.lead_status === 'warm' ? 'warm' : 'cold';

  const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-strategic-followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_name: lead.name || lead.first_name,
      lead_email: lead.email,
      company: lead.company,
      engagement_level: engagementLevel,
      follow_up_reason: 'no_reply_initial',
      follow_up_number: stepNumber,
      pain_points: (angle?.pain_points?.length > 0 ? angle.pain_points : lead.pain_points) || [],
      offer: angle?.value_proposition || offer.value_proposition,
      cta: offer.cta || 'Book a quick call',
      ...(angle ? {
        angle_tone: angle.tone,
        angle_hooks: angle.hooks,
        angle_proof_points: angle.proof_points
      } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate follow-up: ${response.status}`);
  }

  return await response.json();
}
