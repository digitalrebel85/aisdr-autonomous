// src/app/api/leads/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { planManager } from '@/lib/plans';

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
        error: 'No leads provided. Expected an array of lead objects.' 
      }, { status: 400 });
    }

    // Check if user can add this many prospects - skip if planManager fails
    let usageCheck = { allowed: true, usage: 0, limit: -1 };
    try {
      usageCheck = await planManager.checkUsageLimit(user.id, 'prospects_per_month', leads.length);
      if (!usageCheck.allowed) {
        return NextResponse.json({ 
          error: `Monthly prospect limit exceeded. You can add ${usageCheck.limit - usageCheck.usage} more leads this month.`,
          usage: usageCheck.usage,
          limit: usageCheck.limit,
          upgrade_url: '/pricing'
        }, { status: 429 });
      }
    } catch (planError) {
      console.warn('Plan check failed, allowing bulk lead creation:', planError);
    }

    // Prepare leads for insertion
    const leadsToInsert = leads.map(lead => {
      const fullName = lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
      
      return {
        user_id: user.id,
        name: fullName,
        first_name: lead.first_name || fullName.split(' ')[0] || '',
        last_name: lead.last_name || fullName.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        company: lead.company || '',
        title: lead.title || '',
        phone: lead.phone || '',
        linkedin_url: lead.linkedin_url || '',
        location: lead.location || '',
        industry: lead.industry || '',
        company_size: lead.company_size || '',
        enrichment_status: 'pending',
        created_at: new Date().toISOString()
      };
    }).filter(lead => lead.email && lead.name); // Filter out invalid leads

    if (leadsToInsert.length === 0) {
      return NextResponse.json({ 
        error: 'No valid leads found. Each lead must have at least an email and name.' 
      }, { status: 400 });
    }

    // Insert leads in batches to avoid timeout
    const batchSize = 100;
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('leads')
        .insert(batch)
        .select();

      if (error) {
        console.error('Error inserting batch:', error);
        failedCount += batch.length;
        errors.push(error.message);
      } else {
        successCount += data?.length || 0;
      }
    }

    return NextResponse.json({ 
      success: successCount,
      failed: failedCount,
      total: leads.length,
      errors: errors.length > 0 ? errors : undefined,
      usage: {
        current: usageCheck.usage + successCount,
        limit: usageCheck.limit,
        remaining: usageCheck.limit === -1 ? -1 : usageCheck.limit - (usageCheck.usage + successCount)
      }
    });

  } catch (error) {
    console.error('Leads bulk POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
