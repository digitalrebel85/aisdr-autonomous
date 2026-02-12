// Auto-Enrichment + Auto-Scoring Cron
// Runs periodically to:
// 1. Find new unenriched leads
// 2. Enrich them via Python crew service (no user auth needed)
// 3. Score them against the user's ICP profile
// This closes the gap between "lead enters system" and "AI has full context"

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const BATCH_SIZE = 8;
const BATCH_DELAY_MS = 1000; // 1s between batches

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const crewServiceUrl = process.env.CREW_SERVICE_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

  const results = {
    enriched: 0,
    enrichFailed: 0,
    scored: 0,
    scoreFailed: 0,
    skipped: 0,
    details: [] as any[]
  };

  try {
    // 1. Find unenriched leads (pending or null status, created in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: unenrichedLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id, email, first_name, last_name, company, company_domain, linkedin_url, user_id')
      .or('enrichment_status.is.null,enrichment_status.eq.pending')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50); // High throughput for bulk imports

    if (fetchError) {
      console.error('Error fetching unenriched leads:', fetchError);
      return NextResponse.json({ error: 'Database error', details: fetchError.message }, { status: 500 });
    }

    if (!unenrichedLeads || unenrichedLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unenriched leads to process',
        ...results
      });
    }

    console.log(`Auto-enrich cron: found ${unenrichedLeads.length} unenriched leads`);

    // 2. Process in batches
    for (let i = 0; i < unenrichedLeads.length; i += BATCH_SIZE) {
      const batch = unenrichedLeads.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (lead) => {
        try {
          // Get user's API keys for this lead's owner
          const { data: userApiKeys } = await supabase
            .from('user_api_keys')
            .select('provider, api_key')
            .eq('user_id', lead.user_id)
            .eq('is_active', true);

          const apiKeys: Record<string, string> = {};
          userApiKeys?.forEach(key => {
            apiKeys[key.provider] = key.api_key;
          });

          // Mark as enriching
          await supabase
            .from('leads')
            .update({
              enrichment_status: 'enriching',
              enrichment_started_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          // Call Python enrichment service
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const enrichResponse = await fetch(`${crewServiceUrl}/enrich-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: lead.email,
              company_domain: lead.company_domain,
              lead_id: lead.id,
              user_id: lead.user_id,
              name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
              company: lead.company,
              first_name: lead.first_name,
              last_name: lead.last_name,
              linkedin_url: lead.linkedin_url,
              api_keys: apiKeys
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!enrichResponse.ok) {
            throw new Error(`Enrichment failed: ${enrichResponse.status}`);
          }

          const enrichedData = await enrichResponse.json();

          // Update lead with enriched data
          const updateData: any = {
            enrichment_status: 'completed',
            enrichment_completed_at: new Date().toISOString(),
            enriched_data: enrichedData,
          };

          // Extract key fields
          if (enrichedData.title) updateData.title = enrichedData.title;
          if (enrichedData.company) updateData.company = enrichedData.company;
          if (enrichedData.linkedin_url) updateData.linkedin_url = enrichedData.linkedin_url;
          if (enrichedData.phone) updateData.phone = enrichedData.phone;
          if (enrichedData.location) updateData.location = enrichedData.location;
          if (enrichedData.industry) updateData.industry = enrichedData.industry;
          if (enrichedData.company_size) updateData.company_size = enrichedData.company_size;

          await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

          results.enriched++;
          results.details.push({
            leadId: lead.id,
            email: lead.email,
            action: 'enriched',
            source: enrichedData.primary_source || 'unknown'
          });

          console.log(`Auto-enriched: ${lead.email} (source: ${enrichedData.primary_source})`);

        } catch (err) {
          console.error(`Auto-enrich failed for ${lead.email}:`, err);

          // Mark as failed
          await supabase
            .from('leads')
            .update({
              enrichment_status: 'failed',
              enrichment_error: err instanceof Error ? err.message : 'Unknown error',
              enrichment_completed_at: new Date().toISOString()
            })
            .eq('id', lead.id);

          results.enrichFailed++;
          results.details.push({
            leadId: lead.id,
            email: lead.email,
            action: 'enrich_failed',
            error: err instanceof Error ? err.message : 'Unknown'
          });
        }
      });

      await Promise.all(batchPromises);

      // Rate limit between batches
      if (i + BATCH_SIZE < unenrichedLeads.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // 3. Auto-score newly enriched leads against their user's ICP profiles
    // Group enriched leads by user_id
    const enrichedByUser = new Map<string, string[]>();
    for (const detail of results.details) {
      if (detail.action === 'enriched') {
        const lead = unenrichedLeads.find(l => l.id === detail.leadId);
        if (lead) {
          if (!enrichedByUser.has(lead.user_id)) {
            enrichedByUser.set(lead.user_id, []);
          }
          enrichedByUser.get(lead.user_id)!.push(lead.id);
        }
      }
    }

    // Score each user's newly enriched leads
    for (const [userId, leadIds] of enrichedByUser) {
      try {
        // Get user's ICP profile — prefer autopilot ICP, then most recently used
        let icpProfileId: string | null = null;

        // Check autopilot settings first
        const { data: autopilotSettings } = await supabase
          .from('autopilot_settings')
          .select('discovery_icp_profile_id')
          .eq('user_id', userId)
          .eq('enabled', true)
          .single();

        if (autopilotSettings?.discovery_icp_profile_id) {
          icpProfileId = autopilotSettings.discovery_icp_profile_id;
        }

        // Fallback to most recently used active ICP
        if (!icpProfileId) {
          const { data: icpProfile } = await supabase
            .from('icp_profiles')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('last_used_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .single();
          icpProfileId = icpProfile?.id || null;
        }

        if (!icpProfileId) {
          console.log(`No active ICP profile for user ${userId}, skipping scoring`);
          results.skipped += leadIds.length;
          continue;
        }

        const icpProfile = { id: icpProfileId };

        // Call the scoring RPC
        const { data: scoredLeads, error: scoringError } = await supabase
          .rpc('score_leads_with_icp', {
            icp_profile_id_param: icpProfile.id,
            user_id_param: userId
          });

        if (scoringError) {
          console.error(`Scoring failed for user ${userId}:`, scoringError);
          results.scoreFailed += leadIds.length;
          continue;
        }

        // Filter to only our newly enriched leads and update scores
        const relevantScores = scoredLeads?.filter(
          (s: any) => leadIds.includes(s.lead_id)
        ) || [];

        for (const scored of relevantScores) {
          await supabase
            .from('leads')
            .update({
              icp_score: scored.score,
              icp_profile_id: icpProfile.id,
              icp_match_details: scored.match_details,
              icp_scored_at: new Date().toISOString()
            })
            .eq('id', scored.lead_id);

          results.scored++;
        }

        console.log(`Auto-scored ${relevantScores.length} leads for user ${userId} (ICP: ${icpProfile.id})`);

      } catch (scoreErr) {
        console.error(`Auto-scoring failed for user ${userId}:`, scoreErr);
        results.scoreFailed += leadIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${unenrichedLeads.length} leads`,
      ...results
    });

  } catch (error) {
    console.error('Auto-enrich cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
