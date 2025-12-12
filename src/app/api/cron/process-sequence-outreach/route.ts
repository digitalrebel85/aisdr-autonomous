// Enhanced cron job for processing multi-touch sequences with smart stop logic
// Implements auto-stop conditions and uses strategic follow-up agent

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    // Debug: Check current time
    const now = new Date().toISOString();
    console.log('Current time:', now);
    
    // Get queued emails with sequence information
    const { data: queuedEmails, error: queueError } = await supabase
      .from('outreach_queue')
      .select(`
        *,
        outreach_campaigns (id, name, status),
        leads (
          id, name, email, company, title, first_name, last_name, company_domain,
          linkedin_url, phone, location, industry, company_size,
          enriched_data, lead_status
        ),
        connected_inboxes (email_address, grant_id)
      `)
      .eq('status', 'queued')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (queueError) {
      console.error('Error fetching queued emails:', queueError);
      console.error('Queue error details:', JSON.stringify(queueError, null, 2));
      return NextResponse.json({ error: 'Database error', details: queueError.message }, { status: 500 });
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      return NextResponse.json({ 
        message: 'No emails to process',
        processed: 0 
      });
    }

    // Sort by ICP score (highest first)
    queuedEmails.sort((a, b) => {
      const scoreA = a.leads?.icp_score || 0;
      const scoreB = b.leads?.icp_score || 0;
      return scoreB - scoreA;
    });

    const results = [];

    for (const queueItem of queuedEmails) {
      try {
        // CHECK STOP CONDITIONS FIRST
        const lead = queueItem.leads;
        const campaign = queueItem.outreach_campaigns;

        // Check if lead should be stopped based on status
        const shouldStop = await checkStopConditions(supabase, lead, queueItem);
        
        if (shouldStop.stop) {
          console.log(`Auto-stopping sequence for lead ${lead.id}: ${shouldStop.reason}`);
          
          // Mark queue item as skipped
          await supabase
            .from('outreach_queue')
            .update({ status: 'skipped', error_message: shouldStop.reason })
            .eq('id', queueItem.id);

          results.push({
            queueId: queueItem.id,
            leadEmail: lead.email,
            status: 'auto_stopped',
            reason: shouldStop.reason
          });
          
          continue; // Skip to next email
        }

        // Skip daily limit check for now - can be added back with proper RPC function
        // Just proceed with sending

        // Mark as processing
        await supabase
          .from('outreach_queue')
          .update({ status: 'processing' })
          .eq('id', queueItem.id);

        // Determine which agent to use based on sequence step
        const sequenceStep = queueItem.sequence_step || 1;
        const isFirstEmail = sequenceStep === 1;

        let emailData;

        if (isFirstEmail) {
          // Use email copywriter for first touch
          emailData = await generateInitialEmail(queueItem);
        } else {
          // Use strategic follow-up agent for subsequent touches
          emailData = await generateFollowUpEmail(queueItem, sequenceStep);
        }

        if (!emailData) {
          throw new Error('Failed to generate email content');
        }

        // Send email using Nylas
        const sendResponse = await fetch(`https://api.us.nylas.com/v3/grants/${queueItem.grant_id}/messages/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email: lead.email, name: lead.name }],
            from: [{ email: queueItem.sender_email }],
            subject: emailData.subject,
            body: emailData.body,
            reply_to: [{ email: queueItem.sender_email }]
          }),
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          throw new Error(`Nylas send failed: ${errorText}`);
        }

        const sendResult = await sendResponse.json();

        // Update queue status
        await supabase
          .from('outreach_queue')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString(),
            thread_id: sendResult.data?.id
          })
          .eq('id', queueItem.id);

        // Update lead's sequence count (if column exists)
        await supabase
          .from('leads')
          .update({
            last_contacted_at: new Date().toISOString()
          })
          .eq('id', lead.id);

        // Record sent email
        await supabase
          .from('sent_emails')
          .insert({
            user_id: queueItem.user_id,
            campaign_id: queueItem.campaign_id,
            lead_id: lead.id,
            inbox_id: queueItem.inbox_id,
            subject: emailData.subject,
            body: emailData.body,
            sent_at: new Date().toISOString(),
            thread_id: sendResult.data?.id,
            sequence_step: sequenceStep
          });

        // Check if this was the last step in sequence
        const { data: remainingSteps } = await supabase
          .from('outreach_queue')
          .select('id')
          .eq('campaign_id', queueItem.campaign_id)
          .eq('lead_id', lead.id)
          .eq('status', 'queued');

        if (!remainingSteps || remainingSteps.length === 0) {
          // Sequence completed - update lead status
          await supabase
            .from('leads')
            .update({ lead_status: 'sequence_completed' })
            .eq('id', lead.id);
        }

        results.push({
          queueId: queueItem.id,
          leadEmail: lead.email,
          status: 'sent',
          sequenceStep: sequenceStep,
          messageId: sendResult.data?.id
        });

      } catch (error) {
        console.error(`Error processing queue item ${queueItem.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('outreach_queue')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', queueItem.id);

        results.push({
          queueId: queueItem.id,
          leadEmail: queueItem.leads?.email || 'unknown',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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
async function generateInitialEmail(queueItem: any) {
  const lead = queueItem.leads;
  const offer = queueItem.offer_data;

  const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-cold-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: lead.name || `${lead.first_name} ${lead.last_name}`.trim(),
      title: lead.title || '',
      company: lead.company,
      email: lead.email,
      offer: offer.value_proposition,
      hook_snippet: offer.hook_snippet || '',
      lead_context: JSON.stringify({
        ...lead,
        campaign_name: queueItem.outreach_campaigns?.name,
        offer_name: offer.name
      }),
      pain_points: Array.isArray(lead.pain_points) 
        ? lead.pain_points.join(', ')
        : lead.pain_points || ''
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate email: ${response.status}`);
  }

  return await response.json();
}

// Generate follow-up email using strategic follow-up agent
async function generateFollowUpEmail(queueItem: any, stepNumber: number) {
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
      pain_points: lead.pain_points || [],
      offer: offer.value_proposition,
      cta: offer.cta || 'Book a quick call'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate follow-up: ${response.status}`);
  }

  return await response.json();
}
