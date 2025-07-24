// src/app/api/debug/queue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get current time info
    const now = new Date();
    const utcNow = now.toISOString();
    
    // Get ALL emails in queue (any status) to see what's there
    const { data: allQueueEmails, error: queueError } = await supabase
      .from('outreach_queue')
      .select(`
        *,
        outreach_campaigns (id, name, status),
        leads (name, email, company, timezone, country, city),
        connected_inboxes (email_address, grant_id)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get only queued emails for processing logic
    const queuedEmails = allQueueEmails?.filter(email => email.status === 'queued') || [];

    // Get recent campaigns
    const { data: recentCampaigns, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (queueError) {
      return NextResponse.json({ 
        error: 'Failed to fetch queue', 
        details: queueError 
      }, { status: 500 });
    }

    // Get emails that should be ready for processing (scheduled_at <= now)
    const readyEmails = queuedEmails?.filter(email => 
      new Date(email.scheduled_at) <= now
    ) || [];

    // Check business hours for each email
    const emailsWithBusinessHours = await Promise.all(
      (queuedEmails || []).map(async (email) => {
        const leadTimezone = email.lead_data?.timezone || email.leads?.timezone || 'America/New_York';
        
        // Check if it's currently business hours in the lead's timezone
        const { data: isBusinessHours, error: timezoneError } = await supabase
          .rpc('is_business_hours_in_timezone', {
            tz: leadTimezone,
            check_time: utcNow
          });

        return {
          ...email,
          leadTimezone,
          isBusinessHours: isBusinessHours || false,
          timezoneError: timezoneError?.message || null,
          isScheduledTimeReady: new Date(email.scheduled_at) <= now,
          scheduledAt: email.scheduled_at,
          currentTime: utcNow
        };
      })
    );

    // Check daily limits for inboxes
    const inboxIds = [...new Set(queuedEmails?.map(e => e.inbox_id) || [])];
    const dailyLimits = await Promise.all(
      inboxIds.map(async (inboxId) => {
        const { data: canSend, error } = await supabase
          .rpc('can_inbox_send_today', { inbox_uuid: inboxId });
        
        return {
          inboxId,
          canSend: canSend || false,
          error: error?.message || null
        };
      })
    );

    // Count by status
    const statusCounts: Record<string, number> = {};
    allQueueEmails?.forEach(email => {
      statusCounts[email.status] = (statusCounts[email.status] || 0) + 1;
    });

    return NextResponse.json({
      currentTime: utcNow,
      totalInQueue: allQueueEmails?.length || 0,
      totalQueued: queuedEmails?.length || 0,
      readyToProcess: readyEmails.length,
      statusCounts,
      recentCampaigns: recentCampaigns || [],
      allQueueEmails: allQueueEmails?.map(email => ({
        id: email.id,
        status: email.status,
        scheduled_at: email.scheduled_at,
        created_at: email.created_at,
        lead_email: email.lead_data?.email || email.leads?.email,
        campaign_name: email.outreach_campaigns?.name,
        sender_email: email.sender_email
      })) || [],
      queuedEmails: emailsWithBusinessHours,
      dailyLimits,
      summary: {
        waitingForScheduledTime: emailsWithBusinessHours.filter(e => !e.isScheduledTimeReady).length,
        waitingForBusinessHours: emailsWithBusinessHours.filter(e => e.isScheduledTimeReady && !e.isBusinessHours).length,
        readyToSend: emailsWithBusinessHours.filter(e => e.isScheduledTimeReady && e.isBusinessHours).length,
        inboxLimitReached: dailyLimits.filter(l => !l.canSend).length
      }
    });

  } catch (error) {
    console.error('Debug queue error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
