// src/app/api/test-usage/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { usageTester } from '@/lib/usageTesting';
import { tokenTracker } from '@/lib/tokenTracking';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'current-usage':
        const currentUsage = await usageTester.getCurrentUsage(user.id);
        return NextResponse.json({ usage: currentUsage });

      case 'token-usage':
        const days = parseInt(url.searchParams.get('days') || '30');
        const tokenUsage = await tokenTracker.getUserTokenUsage(
          user.id,
          new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          new Date()
        );
        return NextResponse.json({ tokenUsage });

      case 'monthly-tokens':
        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
        const monthlyTokens = await tokenTracker.getMonthlyTokenUsage(user.id, year, month - 1);
        return NextResponse.json({ monthlyTokens });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Test usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'test-leads':
        const leadCount = params.count || 1;
        const leadResult = await usageTester.testLeadUsage(user.id, leadCount);
        return NextResponse.json({ result: leadResult });

      case 'test-emails':
        const emailCount = params.count || 1;
        const emailResult = await usageTester.testEmailUsage(user.id, emailCount);
        return NextResponse.json({ result: emailResult });

      case 'simulate-scenario':
        const scenario = params.scenario || 'light';
        const scenarioResults = await usageTester.simulateUsageScenario(user.id, scenario);
        return NextResponse.json({ results: scenarioResults });

      case 'track-tokens':
        const {
          operationType,
          provider,
          model,
          inputTokens,
          outputTokens,
          metadata
        } = params;

        if (!operationType || !provider || !model || inputTokens === undefined || outputTokens === undefined) {
          return NextResponse.json({ 
            error: 'Missing required fields: operationType, provider, model, inputTokens, outputTokens' 
          }, { status: 400 });
        }

        const trackingId = await tokenTracker.trackTokenUsage(
          user.id,
          operationType,
          provider,
          model,
          inputTokens,
          outputTokens,
          metadata
        );

        return NextResponse.json({ 
          success: true, 
          trackingId,
          cost: tokenTracker.calculateCost(provider, model, inputTokens, outputTokens)
        });

      case 'reset-usage':
        const metric = params.metric;
        if (!metric) {
          return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
        }
        
        const resetResult = await usageTester.resetUsage(user.id, metric);
        return NextResponse.json({ success: resetResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Test usage POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
