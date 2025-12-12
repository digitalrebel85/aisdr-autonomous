// API endpoint to create multi-touch sequence campaigns
// Implements industry best practices: 5 touches max, smart stop logic

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
    const { 
      campaignName, 
      leadIds, 
      offerId, 
      sequenceId,
      objective,
      framework,
      touches = 5,
      delayMinutes = 5 
    } = body;

    if (!campaignName || !leadIds?.length || !offerId) {
      return NextResponse.json({ 
        error: 'Missing required fields: campaignName, leadIds, offerId' 
      }, { status: 400 });
    }

    // Get sequence rules for user (or use defaults)
    const { data: rules } = await supabase
      .from('sequence_rules')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const sequenceRules = rules || {
      initial_max_touches: 5,
      initial_duration_days: 14,
      auto_stop_on_reply: true,
      auto_stop_on_meeting: true
    };

    // Validate touches against rules
    const maxTouches = Math.min(touches, sequenceRules.initial_max_touches);

    // Get user's available inboxes
    const { data: availableInboxes, error: inboxError } = await supabase
      .rpc('get_available_inboxes_for_sending', { p_user_id: user.id });

    if (inboxError || !availableInboxes?.length) {
      return NextResponse.json({ 
        error: 'No available inboxes found' 
      }, { status: 400 });
    }

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

    // Check each lead eligibility for sequences
    const eligibleLeads = [];
    const ineligibleLeads = [];

    for (const lead of leads) {
      const { data: canStart } = await supabase
        .rpc('can_start_new_sequence', {
          p_lead_id: lead.id,
          p_user_id: user.id
        });

      if (canStart?.allowed) {
        eligibleLeads.push(lead);
      } else {
        ineligibleLeads.push({
          lead_id: lead.id,
          email: lead.email,
          reason: canStart?.reason || 'unknown'
        });
      }
    }

    if (eligibleLeads.length === 0) {
      return NextResponse.json({
        error: 'No eligible leads for sequence',
        ineligible_leads: ineligibleLeads
      }, { status: 400 });
    }

    // Create outreach campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .insert({
        user_id: user.id,
        name: campaignName,
        offer_id: offerId,
        sequence_id: sequenceId,
        sequence_type: 'initial',
        status: 'queued',
        total_leads: eligibleLeads.length,
        delay_minutes: delayMinutes,
        auto_stop_enabled: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json({ 
        error: 'Failed to create campaign' 
      }, { status: 500 });
    }

    // Generate sequence for each lead
    const allQueueItems = [];
    const sequenceExecutions = [];

    for (const lead of eligibleLeads) {
      // Create sequence execution record
      sequenceExecutions.push({
        user_id: user.id,
        lead_id: lead.id,
        campaign_id: campaign.id,
        sequence_id: sequenceId,
        sequence_type: 'initial',
        sequence_number: (lead.sequence_count || 0) + 1,
        status: 'active',
        started_at: new Date().toISOString()
      });

      // Generate sequence schedule based on objective
      const schedule = generateSequenceSchedule(objective, maxTouches);

      // Queue all touches for this lead
      for (let step = 0; step < maxTouches; step++) {
        const selectedInbox = availableInboxes[step % availableInboxes.length];
        const leadTimezone = lead.timezone || 'America/New_York';
        
        // Calculate scheduled time
        const delayDays = schedule[step];
        const baseDelayMs = delayMinutes * 60 * 1000;
        const daysDelayMs = delayDays * 24 * 60 * 60 * 1000;
        const randomVariationMs = Math.floor(Math.random() * baseDelayMs * 0.5);
        
        let scheduledTime = new Date(Date.now() + daysDelayMs + randomVariationMs);

        // Get next business hour in the lead's timezone
        const { data: nextBusinessHour } = await supabase
          .rpc('get_next_business_hour_in_timezone', {
            tz: leadTimezone,
            from_time: scheduledTime.toISOString()
          });

        if (nextBusinessHour) {
          scheduledTime = new Date(nextBusinessHour);
        }

        allQueueItems.push({
          campaign_id: campaign.id,
          user_id: user.id,
          lead_id: lead.id,
          inbox_id: selectedInbox.inbox_id,
          grant_id: selectedInbox.grant_id,
          sender_email: selectedInbox.email_address,
          sequence_step: step + 1,
          sequence_id: sequenceId,
          status: 'queued',
          scheduled_at: scheduledTime.toISOString(),
          lead_data: { ...lead, timezone: leadTimezone },
          offer_data: offer
        });
      }

      // Update lead status
      await supabase
        .from('leads')
        .update({
          lead_status: 'in_sequence',
          sequence_count: (lead.sequence_count || 0) + 1,
          last_sequence_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
    }

    // Insert all queue items
    const { error: queueError } = await supabase
      .from('outreach_queue')
      .insert(allQueueItems);

    if (queueError) {
      console.error('Failed to queue emails:', queueError);
      return NextResponse.json({ 
        error: 'Failed to queue emails for sending' 
      }, { status: 500 });
    }

    // Insert sequence execution records
    const { error: execError } = await supabase
      .from('sequence_executions')
      .insert(sequenceExecutions);

    if (execError) {
      console.error('Failed to create sequence executions:', execError);
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      total_leads: eligibleLeads.length,
      total_emails_queued: allQueueItems.length,
      touches_per_lead: maxTouches,
      ineligible_leads: ineligibleLeads,
      message: `Campaign created successfully with ${maxTouches} touches for ${eligibleLeads.length} leads`
    });

  } catch (error) {
    console.error('Error creating sequence campaign:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Generate sequence schedule based on objective
function generateSequenceSchedule(objective: string, touches: number): number[] {
  const schedules: Record<string, number[]> = {
    'meetings': [0, 3, 7, 12, 14],
    'demos': [0, 3, 7, 10, 14],
    'trials': [0, 3, 7, 12, 14],
    'sales': [0, 3, 7, 12, 14],
    'awareness': [0, 7, 14, 21, 28]
  };

  const baseSchedule = schedules[objective] || schedules['meetings'];
  return baseSchedule.slice(0, touches);
}
