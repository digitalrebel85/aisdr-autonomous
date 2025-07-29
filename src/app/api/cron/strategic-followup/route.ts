// Strategic Follow-up Processor
// This endpoint runs daily to identify and schedule strategic follow-ups

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Strategic Follow-up Processor Started ===');
    console.log('Time:', new Date().toISOString());

    const supabase = await createClient();

    // Get all leads that might need follow-up analysis
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        user_id,
        email,
        name,
        company,
        engagement_level,
        call_booked,
        call_completed,
        follow_up_count,
        next_follow_up_date,
        follow_up_reason,
        timezone,
        do_not_follow_up,
        last_outreach_date,
        last_reply_date
      `)
      .eq('do_not_follow_up', false)
      .order('last_outreach_date', { ascending: false });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    console.log(`Found ${leads?.length || 0} leads to analyze for follow-up`);

    const followUpResults = {
      analyzed: 0,
      scheduled: 0,
      skipped: 0,
      errors: 0
    };

    // Process each lead for strategic follow-up
    for (const lead of leads || []) {
      try {
        followUpResults.analyzed++;
        
        console.log(`\n--- Analyzing Lead: ${lead.email} (ID: ${lead.id}) ---`);
        console.log(`Current engagement: ${lead.engagement_level}`);
        console.log(`Last outreach: ${lead.last_outreach_date}`);
        console.log(`Last reply: ${lead.last_reply_date}`);
        console.log(`Follow-up count: ${lead.follow_up_count}`);

        // Call the strategic follow-up calculation function
        const { data: followUpAnalysis, error: analysisError } = await supabase
          .rpc('calculate_strategic_follow_up', { lead_id: lead.id });

        if (analysisError) {
          console.error(`Error analyzing lead ${lead.id}:`, analysisError);
          followUpResults.errors++;
          continue;
        }

        const analysis = followUpAnalysis?.[0];
        if (!analysis) {
          console.log('No follow-up analysis returned');
          followUpResults.skipped++;
          continue;
        }

        console.log(`Follow-up needed: ${analysis.should_follow_up}`);
        console.log(`Reason: ${analysis.reason}`);
        console.log(`Priority: ${analysis.priority}`);
        console.log(`Scheduled for: ${analysis.follow_up_date}`);

        if (analysis.should_follow_up) {
          // Update the lead with next follow-up date and reason
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              next_follow_up_date: analysis.follow_up_date,
              follow_up_reason: analysis.reason
            })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Error updating lead ${lead.id}:`, updateError);
            followUpResults.errors++;
            continue;
          }

          // Log the follow-up event
          const { error: eventError } = await supabase
            .from('follow_up_events')
            .insert({
              user_id: lead.user_id,
              lead_id: lead.id,
              event_type: 'follow_up_scheduled',
              reason: analysis.reason,
              follow_up_number: lead.follow_up_count + 1,
              scheduled_for: analysis.follow_up_date,
              context: {
                engagement_level: lead.engagement_level,
                priority: analysis.priority,
                last_outreach_date: lead.last_outreach_date,
                last_reply_date: lead.last_reply_date
              }
            });

          if (eventError) {
            console.error(`Error logging follow-up event for lead ${lead.id}:`, eventError);
            // Don't count as error since the main update succeeded
          }

          followUpResults.scheduled++;
          console.log(`✅ Follow-up scheduled for ${analysis.follow_up_date}`);
        } else {
          followUpResults.skipped++;
          console.log(`⏭️ No follow-up needed: ${analysis.reason}`);
        }

      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        followUpResults.errors++;
      }
    }

    console.log('\n=== Strategic Follow-up Analysis Complete ===');
    console.log(`Analyzed: ${followUpResults.analyzed}`);
    console.log(`Scheduled: ${followUpResults.scheduled}`);
    console.log(`Skipped: ${followUpResults.skipped}`);
    console.log(`Errors: ${followUpResults.errors}`);

    // Now process any follow-ups that are due to be sent today
    await processScheduledFollowUps(supabase);

    return NextResponse.json({
      success: true,
      message: 'Strategic follow-up analysis completed',
      results: followUpResults
    });

  } catch (error) {
    console.error('Strategic follow-up processor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processScheduledFollowUps(supabase: any) {
  console.log('\n=== Processing Scheduled Follow-ups ===');

  // Get leads with follow-ups due today
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const { data: dueFollowUps, error: dueError } = await supabase
    .from('leads')
    .select(`
      id,
      user_id,
      email,
      name,
      company,
      engagement_level,
      follow_up_reason,
      follow_up_count,
      timezone,
      offer,
      cta,
      pain_points
    `)
    .not('next_follow_up_date', 'is', null)
    .lte('next_follow_up_date', today.toISOString())
    .eq('do_not_follow_up', false);

  if (dueError) {
    console.error('Error fetching due follow-ups:', dueError);
    return;
  }

  console.log(`Found ${dueFollowUps?.length || 0} follow-ups due today`);

  const sendResults = {
    sent: 0,
    failed: 0
  };

  for (const lead of dueFollowUps || []) {
    try {
      console.log(`\n--- Processing follow-up for: ${lead.email} ---`);
      console.log(`Reason: ${lead.follow_up_reason}`);
      console.log(`Follow-up #: ${lead.follow_up_count + 1}`);

      // Get user's connected inbox for sending
      const { data: inbox, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('grant_id, email_address')
        .eq('user_id', lead.user_id)
        .limit(1)
        .single();

      if (inboxError || !inbox) {
        console.error(`No connected inbox for user ${lead.user_id}`);
        sendResults.failed++;
        continue;
      }

      // Generate strategic follow-up email using AI
      const followUpContent = await generateStrategicFollowUp(lead);
      
      if (!followUpContent) {
        console.error('Failed to generate follow-up content');
        sendResults.failed++;
        continue;
      }

      // Send the follow-up email
      const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: lead.email,
          subject: followUpContent.subject,
          body: followUpContent.body,
          sender_email: inbox.email_address,
          lead_id: lead.id,
          campaign_type: 'strategic_follow_up'
        }),
      });

      if (sendResponse.ok) {
        const sendResult = await sendResponse.json();
        
        // Update lead follow-up tracking
        await supabase
          .from('leads')
          .update({
            follow_up_count: lead.follow_up_count + 1,
            next_follow_up_date: null, // Clear until next analysis
            last_outreach_date: new Date().toISOString()
          })
          .eq('id', lead.id);

        // Log the follow-up event
        await supabase
          .from('follow_up_events')
          .insert({
            user_id: lead.user_id,
            lead_id: lead.id,
            event_type: 'follow_up_sent',
            reason: lead.follow_up_reason,
            follow_up_number: lead.follow_up_count + 1,
            message_id: sendResult.message_id,
            scheduled_for: new Date().toISOString(),
            context: {
              subject: followUpContent.subject,
              inbox_used: inbox.email_address
            }
          });

        sendResults.sent++;
        console.log(`✅ Follow-up sent successfully (Message ID: ${sendResult.message_id})`);
      } else {
        console.error('Failed to send follow-up email:', await sendResponse.text());
        sendResults.failed++;
      }

    } catch (error) {
      console.error(`Error sending follow-up to ${lead.email}:`, error);
      sendResults.failed++;
    }
  }

  console.log('\n=== Follow-up Sending Complete ===');
  console.log(`Sent: ${sendResults.sent}`);
  console.log(`Failed: ${sendResults.failed}`);
}

async function generateStrategicFollowUp(lead: any): Promise<{ subject: string; body: string } | null> {
  try {
    // Call Python service to generate strategic follow-up content
    const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-strategic-followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead_name: lead.name,
        lead_email: lead.email,
        company: lead.company,
        engagement_level: lead.engagement_level,
        follow_up_reason: lead.follow_up_reason,
        follow_up_number: lead.follow_up_count + 1,
        pain_points: lead.pain_points,
        offer: lead.offer,
        cta: lead.cta
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        subject: result.subject,
        body: result.email_content
      };
    } else {
      console.error('Python service error:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error generating follow-up content:', error);
    return null;
  }
}
