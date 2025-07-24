// src/app/api/cron/process-outreach/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get queued emails that are ready to be sent (scheduled_at <= now)
    // We'll check business hours per lead's timezone instead of global UTC check

    const { data: queuedEmails, error: queueError } = await supabase
      .from('outreach_queue')
      .select(`
        *,
        outreach_campaigns (id, name, status),
        leads (name, email, company, pain_points),
        connected_inboxes (email_address, grant_id)
      `)
      .eq('status', 'queued')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5); // Smaller batches for better rate limiting

    if (queueError) {
      console.error('Error fetching queued emails:', queueError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!queuedEmails?.length) {
      return NextResponse.json({ 
        message: 'No emails ready for processing',
        processed: 0 
      });
    }

    const results = [];

    for (const queueItem of queuedEmails) {
      try {
        // Check if it's business hours in the lead's timezone
        const leadTimezone = queueItem.lead_data?.timezone || 'America/New_York';
        const { data: isBusinessHours } = await supabase.rpc('is_business_hours_in_timezone', {
          tz: leadTimezone,
          check_time: new Date().toISOString()
        });

        if (!isBusinessHours) {
          console.log(`Not business hours in ${leadTimezone} for lead ${queueItem.lead_data?.email}. Rescheduling.`);
          
          // Get next business hour in lead's timezone
          const { data: nextBusinessHour } = await supabase.rpc('get_next_business_hour_in_timezone', {
            tz: leadTimezone,
            from_time: new Date().toISOString()
          });
          
          await supabase
            .from('outreach_queue')
            .update({ 
              scheduled_at: nextBusinessHour,
              status: 'queued' // Keep as queued for next business hour
            })
            .eq('id', queueItem.id);
            
          results.push({
            queueId: queueItem.id,
            leadEmail: queueItem.lead_data?.email || 'unknown',
            status: 'rescheduled',
            message: `Rescheduled for business hours in ${leadTimezone}`
          });
          
          continue; // Skip to next email
        }

        // Check if this inbox can still send emails today (15/day limit)
        const { data: canSend } = await supabase.rpc('can_inbox_send_today', {
          p_inbox_id: queueItem.inbox_id,
          p_user_id: queueItem.user_id
        });

        if (!canSend) {
          console.log(`Inbox ${queueItem.sender_email} has reached daily limit (15 emails). Skipping.`);
          
          // Reschedule for tomorrow at a random time during business hours
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setUTCHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
          
          await supabase
            .from('outreach_queue')
            .update({ 
              scheduled_at: tomorrow.toISOString(),
              status: 'queued' // Keep as queued for tomorrow
            })
            .eq('id', queueItem.id);
            
          results.push({
            queueId: queueItem.id,
            leadEmail: queueItem.lead_data?.email || 'unknown',
            status: 'rescheduled',
            message: 'Inbox daily limit reached, rescheduled for tomorrow'
          });
          
          continue; // Skip to next email
        }

        // Mark as processing
        await supabase
          .from('outreach_queue')
          .update({ status: 'processing' })
          .eq('id', queueItem.id);

        // Generate email using Python service
        const emailResponse = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-cold-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_name: queueItem.lead_data.name,
            lead_email: queueItem.lead_data.email,
            company_name: queueItem.lead_data.company,
            pain_points: Array.isArray(queueItem.lead_data.pain_points) 
              ? queueItem.lead_data.pain_points.join(', ')
              : queueItem.lead_data.pain_points || '',
            value_proposition: queueItem.offer_data.value_proposition,
            call_to_action: queueItem.offer_data.call_to_action,
            hook_snippet: queueItem.offer_data.hook_snippet || '',
            offer_name: queueItem.offer_data.name
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Failed to generate email: ${emailResponse.status}`);
        }

        const emailData = await emailResponse.json();
        
        // Send email using Nylas
        const sendResponse = await fetch(`https://api.us.nylas.com/v3/grants/${queueItem.grant_id}/messages/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: [{ email: queueItem.lead_data.email, name: queueItem.lead_data.name }],
            from: { email: queueItem.sender_email },
            subject: emailData.subject || `Re: ${queueItem.offer_data.name}`,
            body: emailData.draft,
            tracking: { opens: true }
          }),
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          throw new Error(`Failed to send email: ${sendResponse.status} - ${errorText}`);
        }

        const sendResult = await sendResponse.json();

        // Update queue item as sent
        await supabase
          .from('outreach_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            message_id: sendResult.data?.id,
            generated_email: emailData
          })
          .eq('id', queueItem.id);

        // Log to sent_emails table
        await supabase
          .from('sent_emails')
          .insert({
            user_id: queueItem.user_id,
            lead_id: queueItem.lead_id,
            message_id: sendResult.data?.id,
            sender_email: queueItem.sender_email,
            recipient_email: queueItem.lead_data.email,
            subject: emailData.subject || `Re: ${queueItem.offer_data.name}`,
            body: emailData.draft,
            campaign_type: 'automated_outreach',
            campaign_id: queueItem.campaign_id
          });

        // Update campaign sent count
        await supabase.rpc('increment_campaign_sent_count', {
          campaign_id: queueItem.campaign_id
        });

        // Increment daily inbox count
        await supabase.rpc('increment_inbox_daily_count', {
          p_inbox_id: queueItem.inbox_id,
          p_user_id: queueItem.user_id
        });

        results.push({
          queueId: queueItem.id,
          leadEmail: queueItem.lead_data.email,
          status: 'sent',
          messageId: sendResult.data?.id
        });

        // Human-like delays: 2-8 minutes between sends during business hours
        const minDelay = 2 * 60 * 1000; // 2 minutes
        const maxDelay = 8 * 60 * 1000; // 8 minutes
        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        
        console.log(`Email sent successfully. Waiting ${Math.round(delay / 1000 / 60)} minutes before next send...`);
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Failed to process queue item ${queueItem.id}:`, error);

        // Mark as failed
        await supabase
          .from('outreach_queue')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', queueItem.id);

        // Update campaign failed count
        await supabase.rpc('increment_campaign_failed_count', {
          campaign_id: queueItem.campaign_id
        });

        results.push({
          queueId: queueItem.id,
          leadEmail: queueItem.lead_data?.email || 'unknown',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check if any campaigns are completed
    await checkAndUpdateCompletedCampaigns(supabase);

    return NextResponse.json({
      message: 'Outreach processing completed',
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Outreach processor error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to check and update completed campaigns
async function checkAndUpdateCompletedCampaigns(supabase: any) {
  try {
    // Get campaigns that might be completed
    const { data: campaigns } = await supabase
      .from('outreach_campaigns')
      .select(`
        id, total_leads, sent_count, failed_count,
        outreach_queue (status)
      `)
      .in('status', ['queued', 'running']);

    for (const campaign of campaigns || []) {
      const totalProcessed = campaign.sent_count + campaign.failed_count;
      const hasQueuedItems = campaign.outreach_queue?.some((item: any) => 
        ['queued', 'processing'].includes(item.status)
      );

      if (totalProcessed >= campaign.total_leads && !hasQueuedItems) {
        // Campaign is completed
        await supabase
          .from('outreach_campaigns')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', campaign.id);
      } else if (totalProcessed > 0 && campaign.status === 'queued') {
        // Campaign has started
        await supabase
          .from('outreach_campaigns')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', campaign.id);
      }
    }
  } catch (error) {
    console.error('Error updating campaign statuses:', error);
  }
}
