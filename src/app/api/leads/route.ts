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

    // Check if user can add more prospects (leads) - skip if planManager fails
    let usageCheck = { allowed: true, usage: 0, limit: -1 };
    try {
      usageCheck = await planManager.checkUsageLimit(user.id, 'prospects_per_month', 1);
      if (!usageCheck.allowed) {
        return NextResponse.json({ 
          error: 'Monthly prospect limit exceeded',
          usage: usageCheck.usage,
          limit: usageCheck.limit,
          upgrade_url: '/pricing'
        }, { status: 429 });
      }
    } catch (planError) {
      console.warn('Plan check failed, allowing lead creation:', planError);
    }

    const body = await request.json();
    const { 
      name, first_name, last_name, email, company, title, 
      phone, linkedin_url, location, industry, company_size,
      pain_points, offer, cta, timezone, country, city 
    } = body;

    // Support both name formats
    const fullName = name || `${first_name || ''} ${last_name || ''}`.trim();

    if (!email || !fullName) {
      return NextResponse.json({ 
        error: 'Missing required fields: name/first_name+last_name, email' 
      }, { status: 400 });
    }

    // Build insert object with only fields that exist in the database
    const leadData: Record<string, any> = {
      user_id: user.id,
      name: fullName,
      email,
      company: company || '',
      title: title || '',
      created_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (first_name) leadData.first_name = first_name;
    if (last_name) leadData.last_name = last_name;
    if (phone) leadData.phone = phone;
    if (linkedin_url) leadData.linkedin_url = linkedin_url;
    if (location) leadData.location = location;
    if (industry) leadData.industry = industry;
    if (company_size) leadData.company_size = company_size;
    if (pain_points?.length > 0) leadData.pain_points = pain_points;
    if (offer) leadData.offer = offer;
    if (cta) leadData.cta = cta;
    if (timezone) leadData.timezone = timezone;
    if (country) leadData.country = country;
    if (city) leadData.city = city;

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ 
        error: 'Failed to create lead', 
        details: error.message 
      }, { status: 500 });
    }

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
