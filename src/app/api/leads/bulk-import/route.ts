// src/app/api/leads/bulk-import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { planManager } from '@/lib/plans';

interface LeadInput {
  // Legacy format
  name?: string;
  email: string;
  company?: string;
  title?: string;
  pain_points?: string[];
  offer?: string;
  cta?: string;
  timezone?: string;
  country?: string;
  city?: string;
  
  // New Apollo discovery format
  first_name?: string;
  last_name?: string;
  company_domain?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  enrichment_status?: string;
  enriched_data?: any;
}

interface LeadRecord {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title?: string;
  company_domain?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  enrichment_status?: string;
  enriched_data?: any;
  pain_points?: string[];
  offer?: string;
  cta?: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ 
        error: 'Missing or invalid leads array' 
      }, { status: 400 });
    }

    // Check if user can import this many leads
    const usageCheck = await planManager.checkUsageLimit(user.id, 'prospects_per_month', leads.length);
    if (!usageCheck.allowed) {
      // Calculate how many they can still import
      const remaining = usageCheck.limit === -1 ? leads.length : usageCheck.limit - usageCheck.usage;
      
      return NextResponse.json({ 
        error: 'Monthly prospect limit would be exceeded',
        requested: leads.length,
        usage: usageCheck.usage,
        limit: usageCheck.limit,
        remaining: remaining,
        upgrade_url: '/pricing',
        suggestion: remaining > 0 ? `You can import up to ${remaining} more prospects this month.` : 'Please upgrade your plan to import more prospects.'
      }, { status: 429 });
    }

    // Validate and prepare leads for insertion
    const validLeads: LeadRecord[] = [];
    const errors: Array<{index: number; error: string; lead: any}> = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      // Handle both legacy (name) and new (first_name/last_name) formats
      const firstName = lead.first_name || lead.name?.split(' ')[0] || '';
      const lastName = lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '';
      
      if (!lead.email || (!firstName && !lead.name)) {
        errors.push({
          index: i,
          error: 'Missing required fields: email and name/first_name',
          lead: lead
        });
        continue;
      }

      // Check for duplicate email in this batch
      const duplicateInBatch = validLeads.find(l => l.email === lead.email);
      if (duplicateInBatch) {
        errors.push({
          index: i,
          error: 'Duplicate email in batch',
          lead: lead
        });
        continue;
      }

      validLeads.push({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: lead.email,
        company: lead.company || '',
        title: lead.title,
        company_domain: lead.company_domain,
        phone: lead.phone,
        linkedin_url: lead.linkedin_url,
        location: lead.location,
        industry: lead.industry,
        company_size: lead.company_size,
        enrichment_status: lead.enrichment_status || 'pending',
        enriched_data: lead.enriched_data,
        pain_points: Array.isArray(lead.pain_points) ? lead.pain_points : [],
        offer: lead.offer,
        cta: lead.cta,
        created_at: new Date().toISOString()
      });
    }

    if (validLeads.length === 0) {
      return NextResponse.json({ 
        error: 'No valid leads to import',
        errors: errors
      }, { status: 400 });
    }

    // Check for existing leads with same emails
    const existingEmails = await supabase
      .from('leads')
      .select('email')
      .eq('user_id', user.id)
      .in('email', validLeads.map(l => l.email));

    if (existingEmails.data && existingEmails.data.length > 0) {
      const existingEmailSet = new Set(existingEmails.data.map(e => e.email));
      const duplicateLeads = validLeads.filter(l => existingEmailSet.has(l.email));
      
      // Remove duplicates from validLeads
      const uniqueLeads = validLeads.filter(l => !existingEmailSet.has(l.email));
      
      // Add duplicate errors
      duplicateLeads.forEach((lead, index) => {
        errors.push({
          index: validLeads.indexOf(lead),
          error: 'Email already exists in your leads',
          lead: lead
        });
      });

      if (uniqueLeads.length === 0) {
        return NextResponse.json({ 
          error: 'All leads already exist in your database',
          errors: errors,
          duplicates: duplicateLeads.length
        }, { status: 400 });
      }

      // Update validLeads to only unique ones
      validLeads.splice(0, validLeads.length, ...uniqueLeads);
    }

    // Insert the valid leads
    const { data: insertedLeads, error: insertError } = await supabase
      .from('leads')
      .insert(validLeads)
      .select();

    if (insertError) {
      console.error('Error inserting leads:', insertError);
      return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 });
    }

    // Note: Usage was already incremented by the checkUsageLimit call above
    const finalUsage = usageCheck.usage + validLeads.length;

    return NextResponse.json({ 
      success: true,
      imported: insertedLeads?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      usage: {
        current: finalUsage,
        limit: usageCheck.limit,
        remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - finalUsage
      },
      summary: {
        total_requested: leads.length,
        successfully_imported: insertedLeads?.length || 0,
        errors: errors.length,
        duplicates: errors.filter(e => e.error.includes('already exists')).length
      }
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
