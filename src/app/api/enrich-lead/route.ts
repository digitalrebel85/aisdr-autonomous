import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { leadId, email, companyDomain, name, company, firstName, lastName, linkedinUrl } = await request.json();
    
    if (!leadId || !email) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing required fields: leadId, email' 
      }), { status: 400 });
    }

    // Get user's API keys
    const { data: userApiKeys, error: apiKeysError } = await supabase
      .from('user_api_keys')
      .select('provider, api_key')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (apiKeysError) {
      console.error('Error fetching API keys:', apiKeysError);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch API keys' }), { status: 500 });
    }

    // Convert to key-value map
    const apiKeys: Record<string, string> = {};
    userApiKeys?.forEach(key => {
      apiKeys[key.provider] = key.api_key;
    });

    // Check if user has at least one API key
    if (Object.keys(apiKeys).length === 0) {
      return new NextResponse(JSON.stringify({ 
        error: 'No API keys configured. Please add enrichment provider API keys in Settings.' 
      }), { status: 400 });
    }

    // 1. Update lead status to "enriching"
    await supabase
      .from('leads')
      .update({ 
        enrichment_status: 'enriching',
        enrichment_started_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('user_id', user.id);

    // 2. Call Python crew service for enrichment
    const crewServiceUrl = process.env.CREW_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Call the Python crew service with user's API keys
      const enrichmentResponse = await fetch(`${crewServiceUrl}/enrich-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          company_domain: companyDomain,
          lead_id: leadId,
          user_id: user.id,
          name: name,
          company: company,
          first_name: firstName,
          last_name: lastName,
          linkedin_url: linkedinUrl,
          api_keys: apiKeys  // Pass user's API keys
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!enrichmentResponse.ok) {
        throw new Error(`Enrichment service error: ${enrichmentResponse.status}`);
      }

      const enrichedData = await enrichmentResponse.json();

      // 3. Update lead with enriched data
      const updateData: any = {
        enrichment_status: 'completed',
        enrichment_completed_at: new Date().toISOString(),
        enriched_data: enrichedData,
      };

      // Extract key fields from enriched data for easier querying
      if (enrichedData.title) updateData.title = enrichedData.title;
      if (enrichedData.company) updateData.company = enrichedData.company;
      if (enrichedData.linkedin_url) updateData.linkedin_url = enrichedData.linkedin_url;
      if (enrichedData.phone) updateData.phone = enrichedData.phone;
      if (enrichedData.location) updateData.location = enrichedData.location;
      if (enrichedData.industry) updateData.industry = enrichedData.industry;
      if (enrichedData.company_size) updateData.company_size = enrichedData.company_size;
      if (enrichedData.pain_points) updateData.pain_points = enrichedData.pain_points;

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating lead with enriched data:', updateError);
        return new NextResponse(JSON.stringify({ 
          error: 'Failed to save enriched data' 
        }), { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Lead enriched successfully',
        enrichedData
      });

    } catch (enrichmentError) {
      console.error('Enrichment service error:', enrichmentError);
      
      const errorMessage = enrichmentError instanceof Error ? enrichmentError.message : 'Unknown error';
      
      // Update lead status to failed
      await supabase
        .from('leads')
        .update({ 
          enrichment_status: 'failed',
          enrichment_error: errorMessage,
          enrichment_completed_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('user_id', user.id);

      return new NextResponse(JSON.stringify({ 
        error: 'Enrichment service unavailable',
        details: errorMessage
      }), { status: 503 });
    }

  } catch (error) {
    console.error('Error in enrich-lead endpoint:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error' 
    }), { status: 500 });
  }
}

// GET endpoint to check enrichment status
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!leadId) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing leadId parameter' 
      }), { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('enrichment_status, enrichment_started_at, enrichment_completed_at, enrichment_error, enriched_data')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (error || !lead) {
      return new NextResponse(JSON.stringify({ 
        error: 'Lead not found' 
      }), { status: 404 });
    }

    return NextResponse.json({
      status: lead.enrichment_status || 'pending',
      startedAt: lead.enrichment_started_at,
      completedAt: lead.enrichment_completed_at,
      error: lead.enrichment_error,
      hasEnrichedData: !!lead.enriched_data
    });

  } catch (error) {
    console.error('Error checking enrichment status:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error' 
    }), { status: 500 });
  }
}
