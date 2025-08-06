// src/app/api/leads/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { planManager } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    return NextResponse.json({ leads: leads || [] });

  } catch (error) {
    console.error('Leads GET error:', error);
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

    // Check if user can add more prospects (leads)
    const usageCheck = await planManager.checkUsageLimit(user.id, 'prospects_per_month', 1);
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: 'Monthly prospect limit exceeded',
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        upgrade_url: '/pricing'
      }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, company, title, pain_points, offer, cta, timezone, country, city } = body;

    if (!email || !name) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, email' 
      }, { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        user_id: user.id,
        name,
        email,
        company: company || '',
        title: title || '',
        pain_points: pain_points || [],
        offer: offer || '',
        cta: cta || '',
        timezone: timezone || 'America/New_York',
        country: country || '',
        city: city || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    // Note: Usage was already incremented by the checkUsageLimit call above
    // Return success with current usage info
    return NextResponse.json({ 
      lead,
      usage: {
        current: usageCheck.usage + 1,
        limit: usageCheck.limit,
        remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - (usageCheck.usage + 1)
      }
    });

  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
