// Learning Loop Cron — The system's brain that gets smarter over time
// Runs daily. For each autopilot user:
// 1. Aggregates per-angle performance metrics
// 2. Updates angle performance_stats in DB
// 3. Identifies winners/losers with statistical confidence
// 4. Auto-pauses losing angles, increases traffic to winners
// 5. AI generates new test angles based on what's working
// 6. Stores insights for user dashboard

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

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
    angles_analyzed: 0,
    angles_paused: 0,
    angles_created: 0,
    insights_generated: 0,
    errors: [] as string[]
  };

  try {
    // Get all users with autopilot enabled (they have angles + active campaigns)
    const { data: autopilotUsers } = await supabase
      .from('autopilot_settings')
      .select('user_id, discovery_icp_profile_id, default_offer_id')
      .eq('enabled', true);

    if (!autopilotUsers || autopilotUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No autopilot users', ...results });
    }

    for (const settings of autopilotUsers) {
      try {
        await processUserLearning(supabase, settings, crewServiceUrl, results);
        results.users_processed++;
      } catch (err) {
        const msg = `User ${settings.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.error(`[learning-loop] ${msg}`);
        results.errors.push(msg);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[learning-loop] Done in ${elapsed}ms — analyzed: ${results.angles_analyzed}, paused: ${results.angles_paused}, created: ${results.angles_created}, insights: ${results.insights_generated}`);

    return NextResponse.json({ success: true, elapsed_ms: elapsed, ...results });

  } catch (error) {
    console.error('[learning-loop] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processUserLearning(
  supabase: any,
  settings: any,
  crewServiceUrl: string,
  results: any
) {
  const userId = settings.user_id;

  // ─── PHASE 1: Analyze angle performance ────────────────────────────────

  console.log(`[learning-loop] User ${userId}: analyzing angle performance...`);

  const analyzeResponse = await fetch(`${crewServiceUrl}/learning-agent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });

  if (!analyzeResponse.ok) {
    console.error(`[learning-loop] User ${userId}: analyze failed (${analyzeResponse.status})`);
    return;
  }

  const analysis = await analyzeResponse.json();
  if (!analysis.success) {
    console.log(`[learning-loop] User ${userId}: ${analysis.error || 'no data'}`);
    return;
  }

  const metrics = analysis.metrics;
  const angles = metrics?.angles || [];
  results.angles_analyzed += angles.length;

  // ─── PHASE 2: Update angle performance_stats in DB ─────────────────────

  for (const angle of angles) {
    const stats = {
      emails_sent: angle.emails_sent,
      opens: angle.opens,
      replies: angle.replies,
      positive_replies: angle.positive_replies,
      meetings_booked: angle.meetings_booked,
      open_rate: angle.open_rate,
      reply_rate: angle.reply_rate,
      positive_rate: angle.positive_rate,
      meeting_rate: angle.meeting_rate,
      composite_score: angle.composite_score,
      status: angle.status,
      last_analyzed: new Date().toISOString()
    };

    await supabase
      .from('icp_angles')
      .update({ performance_stats: stats })
      .eq('id', angle.angle_id);
  }

  // ─── PHASE 3: Auto-pause losing angles ─────────────────────────────────

  const losers = angles.filter((a: any) => a.status === 'loser' && a.has_enough_data);
  for (const loser of losers) {
    console.log(`[learning-loop] User ${userId}: pausing losing angle "${loser.name}" (reply rate: ${loser.reply_rate}%)`);

    await supabase
      .from('icp_angles')
      .update({ is_active: false })
      .eq('id', loser.angle_id);

    results.angles_paused++;
  }

  // ─── PHASE 4: Store traffic weights ────────────────────────────────────

  const weights = analysis.traffic_weights || {};
  if (Object.keys(weights).length > 0) {
    await supabase
      .from('autopilot_settings')
      .update({ 
        angle_traffic_weights: weights,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  // ─── PHASE 5: Generate new angles if we have enough data ───────────────

  const activeAngles = angles.filter((a: any) => a.status !== 'loser');
  const hasEnoughData = angles.some((a: any) => a.has_enough_data);

  // Only generate new angles if:
  // - We have performance data to learn from
  // - We have fewer than 5 active angles
  // - We have ICP + offer configured
  if (hasEnoughData && activeAngles.length < 5 && settings.discovery_icp_profile_id && settings.default_offer_id) {

    // Fetch ICP and offer for context
    const { data: icpProfile } = await supabase
      .from('icp_profiles')
      .select('name, industries, job_titles, company_sizes, seniority_levels')
      .eq('id', settings.discovery_icp_profile_id)
      .single();

    const { data: offer } = await supabase
      .from('offers')
      .select('name, pain_points, benefits, proof_points')
      .eq('id', settings.default_offer_id)
      .single();

    if (icpProfile && offer) {
      try {
        const genResponse = await fetch(`${crewServiceUrl}/learning-agent/generate-angles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            icp_profile: icpProfile,
            offer: offer
          })
        });

        if (genResponse.ok) {
          const genResult = await genResponse.json();
          const newAngles = genResult.angles || [];

          for (const angle of newAngles) {
            const { error: insertError } = await supabase
              .from('icp_angles')
              .insert({
                user_id: userId,
                icp_profile_id: settings.discovery_icp_profile_id,
                name: angle.name,
                description: angle.description || angle.rationale || '',
                value_proposition: angle.value_proposition,
                pain_points: angle.pain_points || [],
                hooks: angle.hooks || [],
                proof_points: angle.proof_points || [],
                tone: angle.tone || 'professional',
                is_active: true,
                is_control: false
              });

            if (!insertError) {
              results.angles_created++;
              console.log(`[learning-loop] User ${userId}: created new angle "${angle.name}"`);
            }
          }
        }
      } catch (genErr) {
        console.warn(`[learning-loop] User ${userId}: angle generation failed:`, genErr);
      }
    }
  }

  // ─── PHASE 6: Generate and store insights ──────────────────────────────

  try {
    const insightsResponse = await fetch(`${crewServiceUrl}/learning-agent/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (insightsResponse.ok) {
      const insightsResult = await insightsResponse.json();
      const insights = insightsResult.insights || {};

      await supabase
        .from('ai_insights')
        .insert({
          user_id: userId,
          insight_type: 'learning_loop',
          summary: insights.key_finding || '',
          recommendations: insights.recommendations || [],
          metadata: {
            whats_working: insights.whats_working,
            whats_not_working: insights.whats_not_working,
            confidence: insights.confidence,
            suggested_actions: insights.suggested_actions,
            angles_analyzed: angles.length,
            winners: metrics?.winners?.length || 0,
            losers: metrics?.losers?.length || 0,
            averages: metrics?.averages || {}
          },
          created_at: new Date().toISOString()
        });

      results.insights_generated++;
      console.log(`[learning-loop] User ${userId}: stored insight (confidence: ${insights.confidence})`);
    }
  } catch (insightErr) {
    console.warn(`[learning-loop] User ${userId}: insight generation failed:`, insightErr);
  }
}
