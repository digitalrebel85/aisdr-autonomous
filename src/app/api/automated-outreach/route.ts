// src/app/api/automated-outreach/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignName, leadIds, offerId, delayMinutes = 5 } = body;

    if (!campaignName || !leadIds?.length || !offerId) {
      return NextResponse.json({ 
        error: 'Missing required fields: campaignName, leadIds, offerId' 
      }, { status: 400 });
    }

    // Get user's available inboxes (under daily sending limit)
    const { data: availableInboxes, error: inboxError } = await supabase
      .rpc('get_available_inboxes_for_sending', { p_user_id: user.id });

    if (inboxError || !availableInboxes?.length) {
      return NextResponse.json({ 
        error: 'No available inboxes found. All inboxes may have reached their daily sending limit (15 emails/day).' 
      }, { status: 400 });
    }

    console.log(`Found ${availableInboxes.length} available inboxes for sending:`, 
      availableInboxes.map(inbox => `${inbox.email_address} (${inbox.remaining_sends} remaining)`));

    // Get offer details
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .eq('user_id', user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ 
        error: 'Offer not found' 
      }, { status: 404 });
    }

    // Get leads details
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', user.id);

    if (leadsError || !leads?.length) {
      return NextResponse.json({ 
        error: 'No valid leads found' 
      }, { status: 404 });
    }

    // Create outreach campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .insert({
        user_id: user.id,
        name: campaignName,
        offer_id: offerId,
        status: 'queued',
        total_leads: leads.length,
        delay_minutes: delayMinutes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ 
        error: 'Failed to create campaign' 
      }, { status: 500 });
    }

    // Queue emails for automated sending with timezone-based scheduling
    const emailQueue = [];
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const selectedInbox = availableInboxes[i % availableInboxes.length];
      
      // Get lead's timezone (default to Eastern Time if not specified)
      const leadTimezone = lead.timezone || 'America/New_York';
      
      // Calculate base scheduling time with delay
      const baseDelayMs = delayMinutes * 60 * 1000;
      const randomVariationMs = Math.floor(Math.random() * baseDelayMs * 0.5); // Up to 50% variation
      const totalDelayMs = baseDelayMs + randomVariationMs;
      
      let scheduledTime = new Date(Date.now() + (i * totalDelayMs));
      
      // Get next business hour in the lead's timezone
      const { data: nextBusinessHour, error: timezoneError } = await supabase
        .rpc('get_next_business_hour_in_timezone', {
          tz: leadTimezone,
          from_time: scheduledTime.toISOString()
        });
      
      if (timezoneError) {
        console.error(`Error getting business hours for timezone ${leadTimezone}:`, timezoneError);
        // Fallback to original scheduling if timezone function fails
      } else if (nextBusinessHour) {
        scheduledTime = new Date(nextBusinessHour);
      }
      
      emailQueue.push({
        campaign_id: campaign.id,
        user_id: user.id,
        lead_id: lead.id,
        inbox_id: selectedInbox.inbox_id,
        grant_id: selectedInbox.grant_id,
        sender_email: selectedInbox.email_address,
        status: 'queued',
        scheduled_at: scheduledTime.toISOString(),
        lead_data: { ...lead, timezone: leadTimezone }, // Ensure timezone is included
        offer_data: offer
      });
    }

    const { error: queueError } = await supabase
      .from('outreach_queue')
      .insert(emailQueue);

    if (queueError) {
      console.error('Failed to queue emails:', queueError);
      return NextResponse.json({ 
        error: 'Failed to queue emails for sending' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      queuedEmails: emailQueue.length,
      inboxRotation: availableInboxes.map(inbox => `${inbox.email_address} (${inbox.remaining_sends} remaining today)`),
      estimatedCompletionTime: new Date(Date.now() + (leads.length * delayMinutes * 60 * 1000)).toISOString()
    });

  } catch (error) {
    console.error('Automated outreach error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET endpoint to check campaign status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (campaignId) {
      // Get specific campaign status
      const { data: campaign, error } = await supabase
        .from('outreach_campaigns')
        .select(`
          *,
          outreach_queue (
            id, status, scheduled_at, sent_at, error_message,
            leads (name, email, company)
          )
        `)
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }

      return NextResponse.json({ campaign });
    } else {
      // Get all user campaigns
      const { data: campaigns, error } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
      }

      return NextResponse.json({ campaigns });
    }

  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
