// src/app/api/cron/campaign-performance-loop/route.ts
// Daily autonomous performance loop:
// 1. Checks all active campaigns for performance issues
// 2. Auto-pauses campaigns with high bounce/spam rates
// 3. Runs AI strategic reflection for insights
// 4. Stores insights for user dashboard

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Thresholds for auto-pause
const BOUNCE_RATE_THRESHOLD = 0.15; // 15% bounce rate = auto-pause
const SPAM_REPORT_THRESHOLD = 0.02; // 2% spam reports = auto-pause
const MIN_EMAILS_FOR_EVAL = 10; // Need at least 10 sent emails to evaluate
const LOW_OPEN_RATE_THRESHOLD = 0.05; // 5% open rate after 50+ emails = warning
const MIN_EMAILS_FOR_OPEN_EVAL = 50;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: any[] = [];

  try {
    // 1. Get all active campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('id, name, user_id, status, created_at')
      .eq('status', 'active');

    if (campaignError || !campaigns || campaigns.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active campaigns to evaluate',
        processed: 0 
      });
    }

    console.log(`Performance loop: evaluating ${campaigns.length} active campaigns`);

    for (const campaign of campaigns) {
      try {
        // 2. Get campaign metrics from sent_emails and email_events
        const { data: sentEmails, error: sentError } = await supabase
          .from('sent_emails')
          .select('id, message_id, lead_id, sent_at')
          .eq('campaign_id', campaign.id);

        if (sentError || !sentEmails) continue;

        const totalSent = sentEmails.length;
        if (totalSent < MIN_EMAILS_FOR_EVAL) {
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            action: 'skipped',
            reason: `Only ${totalSent} emails sent (need ${MIN_EMAILS_FOR_EVAL})`
          });
          continue;
        }

        // Get events for this campaign's emails
        const messageIds = sentEmails.map(e => e.message_id).filter(Boolean);
        
        let bounceCount = 0;
        let openCount = 0;

        if (messageIds.length > 0) {
          const { data: events } = await supabase
            .from('email_events')
            .select('event_type, message_id')
            .in('message_id', messageIds);

          if (events) {
            bounceCount = events.filter(e => e.event_type === 'bounced').length;
            openCount = events.filter(e => e.event_type === 'opened').length;
          }
        }

        // Get spam reports (leads that marked as spam)
        const leadIds = sentEmails.map(e => e.lead_id).filter(Boolean);
        let spamCount = 0;
        
        if (leadIds.length > 0) {
          const { data: spamLeads } = await supabase
            .from('leads')
            .select('id')
            .in('id', leadIds)
            .eq('lead_status', 'spam_reported');
          
          spamCount = spamLeads?.length || 0;
        }

        // Get reply count
        let replyCount = 0;
        if (leadIds.length > 0) {
          const { data: replies } = await supabase
            .from('replies')
            .select('id')
            .in('lead_id', leadIds)
            .eq('original_campaign_id', campaign.id);
          
          replyCount = replies?.length || 0;
        }

        // Calculate rates
        const bounceRate = totalSent > 0 ? bounceCount / totalSent : 0;
        const spamRate = totalSent > 0 ? spamCount / totalSent : 0;
        const openRate = totalSent > 0 ? openCount / totalSent : 0;
        const replyRate = totalSent > 0 ? replyCount / totalSent : 0;

        const metrics = {
          totalSent,
          bounceCount,
          openCount,
          spamCount,
          replyCount,
          bounceRate: Math.round(bounceRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
          replyRate: Math.round(replyRate * 100) / 100,
          spamRate: Math.round(spamRate * 100) / 100,
        };

        // 3. Auto-pause checks
        let autoPaused = false;
        let pauseReason = '';

        if (bounceRate >= BOUNCE_RATE_THRESHOLD) {
          autoPaused = true;
          pauseReason = `High bounce rate: ${(bounceRate * 100).toFixed(1)}% (threshold: ${BOUNCE_RATE_THRESHOLD * 100}%)`;
        } else if (spamRate >= SPAM_REPORT_THRESHOLD) {
          autoPaused = true;
          pauseReason = `High spam report rate: ${(spamRate * 100).toFixed(1)}% (threshold: ${SPAM_REPORT_THRESHOLD * 100}%)`;
        }

        if (autoPaused) {
          // Pause the campaign
          await supabase
            .from('outreach_campaigns')
            .update({ 
              status: 'paused',
              updated_at: new Date().toISOString()
            })
            .eq('id', campaign.id);

          // Cancel remaining queued emails
          await supabase
            .from('outreach_queue')
            .update({ 
              status: 'cancelled',
              error_message: `Auto-paused: ${pauseReason}`
            })
            .eq('campaign_id', campaign.id)
            .eq('status', 'queued');

          console.log(`AUTO-PAUSED campaign "${campaign.name}": ${pauseReason}`);
        }

        // 4. Generate warnings (non-blocking)
        const warnings: string[] = [];
        
        if (totalSent >= MIN_EMAILS_FOR_OPEN_EVAL && openRate < LOW_OPEN_RATE_THRESHOLD) {
          warnings.push(`Very low open rate: ${(openRate * 100).toFixed(1)}% — consider changing subject lines`);
        }

        if (replyRate === 0 && totalSent >= 20) {
          warnings.push(`Zero replies after ${totalSent} emails — review messaging and targeting`);
        }

        // 5. Store performance insight
        await supabase
          .from('campaign_performance_history')
          .upsert({
            campaign_id: campaign.id,
            user_id: campaign.user_id,
            recorded_at: new Date().toISOString(),
            metrics: metrics,
            auto_paused: autoPaused,
            pause_reason: pauseReason || null,
            warnings: warnings,
          }, {
            onConflict: 'campaign_id,recorded_at'
          })
          .select();

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          action: autoPaused ? 'auto_paused' : 'evaluated',
          pauseReason: pauseReason || null,
          warnings,
          metrics
        });

      } catch (campaignErr) {
        console.error(`Error evaluating campaign ${campaign.id}:`, campaignErr);
        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          action: 'error',
          error: campaignErr instanceof Error ? campaignErr.message : 'Unknown error'
        });
      }
    }

    // 6. Run AI strategic reflection per user (for users with enough data)
    const userIds = [...new Set(campaigns.map(c => c.user_id))];
    const aiInsights: any[] = [];

    for (const userId of userIds) {
      try {
        const reflectionResponse = await fetch(`${process.env.PYTHON_SERVICE_URL}/strategic-reflection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });

        if (reflectionResponse.ok) {
          const insight = await reflectionResponse.json();
          aiInsights.push({ userId, insight });

          // Store AI insight for user dashboard
          await supabase
            .from('ai_insights')
            .insert({
              user_id: userId,
              insight_type: 'daily_performance_review',
              summary: insight.summary || '',
              recommendations: insight.recommendations || [],
              created_at: new Date().toISOString()
            });
        }
      } catch (reflectionErr) {
        console.warn(`AI reflection failed for user ${userId}:`, reflectionErr);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      autoPaused: results.filter(r => r.action === 'auto_paused').length,
      results,
      aiInsights: aiInsights.length
    });

  } catch (error) {
    console.error('Campaign performance loop error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
