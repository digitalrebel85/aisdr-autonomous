import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, icp_id, offer_id } = body;

    if (!lead_id) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Optionally fetch ICP for context
    let icpPainPoints: string[] = [];
    if (icp_id) {
      const { data: icp } = await supabase
        .from('icp_profiles')
        .select('pain_points')
        .eq('id', icp_id)
        .single();
      
      if (icp?.pain_points) {
        icpPainPoints = icp.pain_points;
      }
    }

    // Optionally fetch offer for context
    let offerName = '';
    let offerValueProp = '';
    if (offer_id) {
      const { data: offer } = await supabase
        .from('offers')
        .select('name, value_proposition')
        .eq('id', offer_id)
        .single();
      
      if (offer) {
        offerName = offer.name || '';
        offerValueProp = offer.value_proposition || '';
      }
    }

    // Call Python AI service
    const enrichmentRequest = {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      title: lead.title || '',
      company: lead.company || '',
      industry: lead.industry || '',
      company_size: lead.company_size || '',
      location: lead.location || '',
      enriched_data: lead.enriched_data || {},
      icp_pain_points: icpPainPoints,
      offer_name: offerName,
      offer_value_proposition: offerValueProp
    };

    console.log('Enriching pain points for lead:', lead.email);

    const response = await fetch(`${PYTHON_SERVICE_URL}/enrich-pain-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichmentRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pain point enrichment failed:', errorText);
      return NextResponse.json({ error: 'AI enrichment failed', details: errorText }, { status: 500 });
    }

    const enrichmentResult = await response.json();

    // Update lead with pain points
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        pain_points: enrichmentResult.pain_points,
        pain_points_source: 'ai_enriched',
        pain_points_enriched_at: new Date().toISOString()
      })
      .eq('id', lead_id);

    if (updateError) {
      console.error('Failed to update lead:', updateError);
      return NextResponse.json({ error: 'Failed to save pain points', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lead_id,
      pain_points: enrichmentResult.pain_points,
      confidence: enrichmentResult.confidence,
      reasoning: enrichmentResult.reasoning
    });

  } catch (error) {
    console.error('Error in pain point enrichment:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Bulk enrichment endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_ids, icp_id, offer_id } = body;

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: 'lead_ids array is required' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const lead_id of lead_ids) {
      try {
        // Call the single enrichment endpoint internally
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leads/enrich-pain-points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id, icp_id, offer_id })
        });

        if (response.ok) {
          const result = await response.json();
          results.push(result);
        } else {
          errors.push({ lead_id, error: 'Enrichment failed' });
        }
      } catch (err) {
        errors.push({ lead_id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      enriched: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk pain point enrichment:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
