// Autopilot Cron — The autonomous AI SDR agent
// Runs every 30 minutes. For each user with autopilot enabled:
// 1. Discovers new leads via Apollo (based on ICP profile)
// 2. Auto-enriches + scores them (handled by separate cron)
// 3. Auto-creates campaigns for high-scoring leads
// 4. Queues outreach emails with inbox rotation + business hour scheduling
// The user only defines ICP + Offer. The agent does everything else.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const SEQUENCE_SCHEDULES: Record<string, number[]> = {
  'meetings': [0, 3, 7],
  'demos': [0, 3, 7],
  'trials': [0, 3, 7],
  'sales': [0, 3, 7],
  'awareness': [0, 7, 14]
};

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const crewServiceUrl = process.env.CREW_SERVICE_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  const startTime = Date.now();

  const results = {
    users_processed: 0,
    leads_discovered: 0,
    leads_imported: 0,
    campaigns_created: 0,
    emails_queued: 0,
    errors: [] as string[]
  };

  try {
    // 1. Get all users with autopilot enabled
    const { data: autopilotUsers, error: fetchError } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('enabled', true);

    if (fetchError || !autopilotUsers || autopilotUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No autopilot users', ...results });
    }

    console.log(`[autopilot] Processing ${autopilotUsers.length} users`);

    for (const settings of autopilotUsers) {
      try {
        await processUserAutopilot(supabase, settings, crewServiceUrl, results);
        results.users_processed++;
      } catch (err) {
        const msg = `User ${settings.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.error(`[autopilot] ${msg}`);
        results.errors.push(msg);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[autopilot] Done in ${elapsed}ms — discovered: ${results.leads_discovered}, imported: ${results.leads_imported}, campaigns: ${results.campaigns_created}, queued: ${results.emails_queued}`);

    return NextResponse.json({ success: true, elapsed_ms: elapsed, ...results });

  } catch (error) {
    console.error('[autopilot] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processUserAutopilot(
  supabase: any,
  settings: any,
  crewServiceUrl: string,
  results: any
) {
  const userId = settings.user_id;
  const today = new Date().toISOString().split('T')[0];

  // Reset daily counter if new day
  if (settings.leads_discovered_today_date !== today) {
    await supabase
      .from('autopilot_settings')
      .update({ leads_discovered_today: 0, leads_discovered_today_date: today })
      .eq('user_id', userId);
    settings.leads_discovered_today = 0;
  }

  // Check daily cap
  if (settings.leads_discovered_today >= settings.max_new_leads_per_day) {
    console.log(`[autopilot] User ${userId}: daily lead cap reached (${settings.max_new_leads_per_day})`);
    return;
  }

  // PHASE 1: Auto-discover leads via Apollo
  if (settings.auto_discover_leads && settings.discovery_icp_profile_id) {
    await discoverLeads(supabase, settings, crewServiceUrl, results);
  }

  // PHASE 2: Auto-create campaigns for scored leads without active campaigns
  if (settings.auto_create_campaigns && settings.default_offer_id) {
    await createAutoCampaigns(supabase, settings, results);
  }
}

// ─── PHASE 1: Lead Discovery ────────────────────────────────────────────────

async function discoverLeads(
  supabase: any,
  settings: any,
  crewServiceUrl: string,
  results: any
) {
  const userId = settings.user_id;

  // Check if enough time has passed since last discovery
  if (settings.last_discovery_at) {
    const hoursSinceLastDiscovery = (Date.now() - new Date(settings.last_discovery_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastDiscovery < settings.discovery_frequency_hours) {
      console.log(`[autopilot] User ${userId}: skipping discovery (last run ${hoursSinceLastDiscovery.toFixed(1)}h ago, frequency: ${settings.discovery_frequency_hours}h)`);
      return;
    }
  }

  // Get ICP profile criteria
  const { data: icpProfile, error: icpError } = await supabase
    .from('icp_profiles')
    .select('*')
    .eq('id', settings.discovery_icp_profile_id)
    .eq('user_id', userId)
    .single();

  if (icpError || !icpProfile) {
    console.error(`[autopilot] User ${userId}: ICP profile not found`);
    return;
  }

  // Get ALL user API keys for multi-provider discovery
  const { data: userApiKeys } = await supabase
    .from('user_api_keys')
    .select('provider, api_key')
    .eq('user_id', userId)
    .eq('is_active', true);

  const apiKeys: Record<string, string> = {};
  userApiKeys?.forEach((k: any) => { apiKeys[k.provider] = k.api_key; });

  // Build ICP criteria for lead search
  const icpCriteria: Record<string, any> = {};
  if (icpProfile.job_titles) icpCriteria.job_titles = icpProfile.job_titles;
  if (icpProfile.industries) icpCriteria.industries = icpProfile.industries;
  if (icpProfile.company_sizes) icpCriteria.company_sizes = icpProfile.company_sizes;
  if (icpProfile.locations) icpCriteria.locations = icpProfile.locations;
  if (icpProfile.seniority_levels) icpCriteria.seniority_levels = icpProfile.seniority_levels;
  if (icpProfile.departments) icpCriteria.departments = icpProfile.departments;
  if (icpProfile.technologies) icpCriteria.technologies = icpProfile.technologies;
  if (icpProfile.funding_stages) icpCriteria.funding_stages = icpProfile.funding_stages;
  if (icpProfile.keywords) icpCriteria.keywords = icpProfile.keywords;
  if (icpProfile.employee_count_min) icpCriteria.employee_count_min = icpProfile.employee_count_min;
  if (icpProfile.employee_count_max) icpCriteria.employee_count_max = icpProfile.employee_count_max;

  const remainingToday = settings.max_new_leads_per_day - settings.leads_discovered_today;
  const maxResults = Math.min(settings.max_leads_per_discovery, remainingToday);

  if (maxResults <= 0) return;

  console.log(`[autopilot] User ${userId}: discovering up to ${maxResults} leads for ICP "${icpProfile.name}"`);

  try {
    // Call Python service for multi-provider lead discovery
    const discoveryResponse = await fetch(`${crewServiceUrl}/discover-leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        icp_criteria: icpCriteria,
        api_keys: apiKeys,
        max_results: maxResults,
        user_id: userId
      })
    });

    if (!discoveryResponse.ok) {
      console.error(`[autopilot] User ${userId}: lead discovery failed (${discoveryResponse.status})`);
      return;
    }

    const discoveryResult = await discoveryResponse.json();
    const discoveredLeads = discoveryResult.leads || [];

    if (discoveredLeads.length === 0) {
      console.log(`[autopilot] User ${userId}: no new leads found`);
      await supabase
        .from('autopilot_settings')
        .update({ last_discovery_at: new Date().toISOString() })
        .eq('user_id', userId);
      return;
    }

    results.leads_discovered += discoveredLeads.length;
    console.log(`[autopilot] User ${userId}: discovered ${discoveredLeads.length} leads`);

    // Import leads — dedup against existing leads by email and apollo_id
    let importedCount = 0;

    for (const lead of discoveredLeads) {
      if (!lead.email) continue;

      // Check if already exists (by email)
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', lead.email.toLowerCase())
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Check if already discovered (by apollo_id)
      if (lead.apollo_id) {
        const { data: alreadyDiscovered } = await supabase
          .from('autopilot_discovered_leads')
          .select('id')
          .eq('user_id', userId)
          .eq('apollo_id', lead.apollo_id)
          .limit(1);

        if (alreadyDiscovered && alreadyDiscovered.length > 0) continue;
      }

      // Insert new lead
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          email: lead.email.toLowerCase(),
          first_name: lead.first_name || '',
          last_name: lead.last_name || '',
          name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          company: lead.company || '',
          company_domain: lead.company_domain?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || '',
          title: lead.title || '',
          linkedin_url: lead.linkedin_url || '',
          phone: lead.phone || '',
          location: lead.location || '',
          industry: lead.company_industry || '',
          company_size: lead.company_size?.toString() || '',
          lead_status: 'new',
          enrichment_status: 'pending',
          source: 'autopilot_apollo'
        })
        .select('id')
        .single();

      if (insertError || !newLead) {
        console.warn(`[autopilot] Failed to import lead ${lead.email}:`, insertError?.message);
        continue;
      }

      // Track discovery for dedup
      await supabase
        .from('autopilot_discovered_leads')
        .insert({
          user_id: userId,
          lead_id: newLead.id,
          icp_profile_id: settings.discovery_icp_profile_id,
          discovery_source: 'apollo',
          apollo_id: lead.apollo_id || null
        });

      importedCount++;
    }

    results.leads_imported += importedCount;

    // Update settings
    await supabase
      .from('autopilot_settings')
      .update({
        last_discovery_at: new Date().toISOString(),
        leads_discovered_today: settings.leads_discovered_today + importedCount,
        total_leads_discovered: (settings.total_leads_discovered || 0) + importedCount
      })
      .eq('user_id', userId);

    // Update ICP profile usage
    await supabase
      .from('icp_profiles')
      .update({
        usage_count: (icpProfile.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        leads_discovered: (icpProfile.leads_discovered || 0) + importedCount
      })
      .eq('id', icpProfile.id);

    console.log(`[autopilot] User ${userId}: imported ${importedCount} new leads (${discoveredLeads.length - importedCount} duplicates skipped)`);

  } catch (err) {
    console.error(`[autopilot] User ${userId}: discovery error:`, err);
  }
}

// ─── PHASE 2: Auto-Create Campaigns ─────────────────────────────────────────

async function createAutoCampaigns(
  supabase: any,
  settings: any,
  results: any
) {
  const userId = settings.user_id;

  // Check how many active auto-campaigns exist
  const { data: activeCampaigns, error: campError } = await supabase
    .from('outreach_campaigns')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'autopilot')
    .in('status', ['queued', 'running'])
    .limit(settings.max_active_campaigns + 1);

  if (campError) return;

  if (activeCampaigns && activeCampaigns.length >= settings.max_active_campaigns) {
    console.log(`[autopilot] User ${userId}: max active campaigns reached (${settings.max_active_campaigns})`);
    return;
  }

  // Find scored leads that are NOT in any active campaign
  const { data: eligibleLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, email, first_name, last_name, company, title, icp_score, timezone')
    .eq('user_id', userId)
    .gte('icp_score', settings.icp_score_threshold)
    .eq('enrichment_status', 'completed')
    .in('lead_status', ['new', 'enriched'])
    .not('lead_status', 'in', '("in_sequence","sequence_completed","replied","meeting_booked","unsubscribed","bounced","do_not_contact")')
    .order('icp_score', { ascending: false })
    .limit(settings.max_leads_per_campaign);

  if (leadsError || !eligibleLeads || eligibleLeads.length === 0) {
    console.log(`[autopilot] User ${userId}: no eligible leads for auto-campaign (threshold: ${settings.icp_score_threshold})`);
    return;
  }

  // Filter out leads already in active campaigns
  const leadIds = eligibleLeads.map((l: any) => l.id);
  const { data: alreadyQueued } = await supabase
    .from('outreach_queue')
    .select('lead_id')
    .in('lead_id', leadIds)
    .in('status', ['queued', 'processing', 'sent']);

  const alreadyQueuedIds = new Set((alreadyQueued || []).map((q: any) => q.lead_id));
  const newLeads = eligibleLeads.filter((l: any) => !alreadyQueuedIds.has(l.id));

  if (newLeads.length === 0) {
    console.log(`[autopilot] User ${userId}: all eligible leads already in campaigns`);
    return;
  }

  // Get the offer
  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', settings.default_offer_id)
    .eq('user_id', userId)
    .single();

  if (offerError || !offer) {
    console.error(`[autopilot] User ${userId}: default offer not found`);
    return;
  }

  // Get available inboxes
  const { data: availableInboxes } = await supabase
    .rpc('get_available_inboxes_for_sending', { p_user_id: userId });

  if (!availableInboxes || availableInboxes.length === 0) {
    console.log(`[autopilot] User ${userId}: no available inboxes`);
    return;
  }

  // Get active angles for this ICP (for A/B testing)
  const { data: activeAngles } = await supabase
    .from('icp_angles')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('icp_profile_id', settings.discovery_icp_profile_id || 0);

  // Build weighted angle picker from learning loop weights
  const trafficWeights: Record<string, number> = settings.angle_traffic_weights || {};
  const anglePool: number[] = [];
  if (activeAngles && activeAngles.length > 0) {
    for (const angle of activeAngles) {
      const weight = trafficWeights[String(angle.id)] || 10; // default 10% if no weight
      const slots = Math.max(1, Math.round(weight / 10)); // 1 slot per 10%
      for (let i = 0; i < slots; i++) {
        anglePool.push(angle.id);
      }
    }
  }

  // Create the campaign
  const campaignName = `Autopilot — ${offer.name} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const campaignAngleIds = activeAngles?.map((a: any) => a.id) || [];

  const { data: campaign, error: campaignError } = await supabase
    .from('outreach_campaigns')
    .insert({
      user_id: userId,
      name: campaignName,
      offer_id: settings.default_offer_id,
      status: 'running',
      source: 'autopilot',
      total_leads: newLeads.length,
      auto_stop_enabled: true,
      ab_test_enabled: anglePool.length > 1,
      angle_ids: campaignAngleIds
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    console.error(`[autopilot] User ${userId}: failed to create campaign:`, campaignError?.message);
    return;
  }

  results.campaigns_created++;
  console.log(`[autopilot] User ${userId}: created campaign "${campaignName}" with ${newLeads.length} leads`);

  // Generate sequence schedule
  const touches = settings.default_touches || 3;
  const objective = settings.default_objective || 'meetings';
  const schedule = (settings.sequence_spacing_days && settings.sequence_spacing_days.length >= touches)
    ? settings.sequence_spacing_days.slice(0, touches)
    : (SEQUENCE_SCHEDULES[objective] || SEQUENCE_SCHEDULES['meetings']).slice(0, touches);

  // Queue emails for each lead
  const queueItems: any[] = [];

  for (const lead of newLeads) {
    // Assign angle to this lead (consistent across all touches for same lead)
    const assignedAngleId = anglePool.length > 0
      ? anglePool[Math.floor(Math.random() * anglePool.length)]
      : null;

    for (let step = 0; step < touches; step++) {
      // Round-robin inbox assignment
      const inbox = availableInboxes[step % availableInboxes.length];

      // Calculate scheduled time using smart scheduling
      const delayDays = schedule[step] || step * 3;
      const baseTime = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
      const leadTz = lead.timezone || 'America/New_York';

      // Try optimal send time, fallback to business hour with jitter
      let scheduledTime = baseTime;
      try {
        const { data: optimalTime } = await supabase.rpc('get_optimal_send_time', {
          p_user_id: userId,
          p_timezone: leadTz,
          p_from_time: baseTime.toISOString()
        });
        if (optimalTime) {
          scheduledTime = new Date(optimalTime);
        }
      } catch {
        // Fallback: add random jitter within business hours
        const jitterMs = Math.floor(Math.random() * 2 * 60 * 60 * 1000);
        scheduledTime = new Date(baseTime.getTime() + jitterMs);
      }

      queueItems.push({
        campaign_id: campaign.id,
        user_id: userId,
        lead_id: lead.id,
        inbox_id: inbox.inbox_id,
        grant_id: inbox.grant_id,
        sender_email: inbox.email_address,
        sequence_step: step + 1,
        status: 'queued',
        scheduled_at: scheduledTime.toISOString(),
        lead_data: lead,
        offer_data: offer,
        ...(assignedAngleId ? { angle_id: assignedAngleId } : {})
      });
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({ lead_status: 'in_sequence' })
      .eq('id', lead.id);

    // Link to autopilot discovery record
    await supabase
      .from('autopilot_discovered_leads')
      .update({ auto_campaign_id: campaign.id })
      .eq('lead_id', lead.id)
      .eq('user_id', userId);
  }

  // Batch insert queue items
  if (queueItems.length > 0) {
    const { error: queueError } = await supabase
      .from('outreach_queue')
      .insert(queueItems);

    if (queueError) {
      console.error(`[autopilot] User ${userId}: failed to queue emails:`, queueError.message);
    } else {
      results.emails_queued += queueItems.length;
      console.log(`[autopilot] User ${userId}: queued ${queueItems.length} emails (${touches} touches × ${newLeads.length} leads)`);
    }
  }

  // Update autopilot stats
  await supabase
    .from('autopilot_settings')
    .update({
      total_campaigns_created: (settings.total_campaigns_created || 0) + 1
    })
    .eq('user_id', userId);
}
