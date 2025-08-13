import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

// Basic enrichment function for when no API keys are configured
async function performBasicEnrichment(data: {
  email: string;
  name?: string;
  company?: string;
  companyDomain?: string;
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
}) {
  const { email, name, company, companyDomain, firstName, lastName, linkedinUrl } = data;
  
  // Extract domain from email for basic company info
  const emailDomain = email.split('@')[1];
  
  // Basic enrichment data structure
  const enrichedData = {
    source: 'basic_enrichment',
    primary_source: 'basic_enrichment',
    enrichment_timestamp: new Date().toISOString(),
    input_data: {
      email,
      name: name || `${firstName || ''} ${lastName || ''}`.trim(),
      company,
      company_domain: companyDomain
    },
    // Inferred data
    email: email.toLowerCase(),
    first_name: firstName || name?.split(' ')[0] || '',
    last_name: lastName || name?.split(' ').slice(1).join(' ') || '',
    company: company || emailDomain.split('.')[0].charAt(0).toUpperCase() + emailDomain.split('.')[0].slice(1),
    company_domain: companyDomain || emailDomain,
    linkedin_url: linkedinUrl || '',
    // Basic inferences
    industry: inferIndustryFromDomain(emailDomain),
    company_size: inferCompanySizeFromDomain(emailDomain),
    location: '',
    phone: '',
    title: '',
    pain_points: [],
    confidence_score: 0.3, // Low confidence for basic enrichment
    enrichment_method: 'basic_inference',
    note: 'Basic enrichment performed without external APIs. Configure API keys in Settings for comprehensive enrichment.'
  };
  
  return enrichedData;
}

// Helper function to infer industry from email domain
function inferIndustryFromDomain(domain: string): string {
  const domainLower = domain.toLowerCase();
  
  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('dev')) {
    return 'Technology';
  } else if (domainLower.includes('health') || domainLower.includes('medical') || domainLower.includes('pharma')) {
    return 'Healthcare';
  } else if (domainLower.includes('finance') || domainLower.includes('bank') || domainLower.includes('invest')) {
    return 'Financial Services';
  } else if (domainLower.includes('edu') || domainLower.includes('university') || domainLower.includes('school')) {
    return 'Education';
  } else if (domainLower.includes('retail') || domainLower.includes('shop') || domainLower.includes('store')) {
    return 'Retail';
  } else if (domainLower.includes('consulting') || domainLower.includes('advisory')) {
    return 'Consulting';
  }
  
  return 'Other';
}

// Helper function to infer company size from email domain
function inferCompanySizeFromDomain(domain: string): string {
  const domainLower = domain.toLowerCase();
  
  // Well-known large companies
  const largeCompanyDomains = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'facebook.com', 'meta.com', 'netflix.com', 'salesforce.com', 'oracle.com', 'ibm.com'];
  
  if (largeCompanyDomains.some(largeDomain => domainLower.includes(largeDomain.split('.')[0]))) {
    return '10,000+ employees';
  }
  
  // Generic email providers suggest smaller companies
  const genericProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  if (genericProviders.includes(domainLower)) {
    return '1-10 employees';
  }
  
  // Default to medium size
  return '11-50 employees';
}

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

    // 1. Update lead status to "enriching"
    await supabase
      .from('leads')
      .update({ 
        enrichment_status: 'enriching',
        enrichment_started_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('user_id', user.id);

    // 2. Always try Python crew service first (even without API keys)
    const crewServiceUrl = process.env.CREW_SERVICE_URL || 'http://localhost:8000';
    let enrichedData: any;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      console.log('Calling Python crew service for lead enrichment...');
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
          api_keys: apiKeys // Pass API keys (may be empty object)
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!enrichmentResponse.ok) {
        const errorText = await enrichmentResponse.text();
        throw new Error(`Enrichment service error: ${enrichmentResponse.status} - ${errorText}`);
      }

      enrichedData = await enrichmentResponse.json();
      console.log('Python crew service enrichment successful');
      
    } catch (error) {
      console.error('Python service enrichment failed, falling back to basic enrichment:', error);
      
      // Fallback to basic enrichment only if Python service is completely unavailable
      enrichedData = await performBasicEnrichment({
        email,
        name,
        company,
        companyDomain,
        firstName,
        lastName,
        linkedinUrl
      });
    }

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

  } catch (error) {
    console.error('Error in enrich-lead endpoint:', error);
    
    // Try to update lead status to failed if we have the leadId
    try {
      const { leadId } = await request.json();
      if (leadId) {
        await supabase
          .from('leads')
          .update({ 
            enrichment_status: 'failed',
            enrichment_error: error instanceof Error ? error.message : 'Unknown error',
            enrichment_completed_at: new Date().toISOString()
          })
          .eq('id', leadId);
      }
    } catch (updateError) {
      console.error('Failed to update lead status to failed:', updateError);
    }
    
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
      .select('enrichment_status, enrichment_started_at, enrichment_completed_at, enrichment_error')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching lead enrichment status:', error);
      return new NextResponse(JSON.stringify({ error: 'Lead not found' }), { status: 404 });
    }

    return NextResponse.json({
      leadId,
      status: lead.enrichment_status || 'pending',
      startedAt: lead.enrichment_started_at,
      completedAt: lead.enrichment_completed_at,
      error: lead.enrichment_error
    });

  } catch (error) {
    console.error('Error in GET enrich-lead endpoint:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error' 
    }), { status: 500 });
  }
}
