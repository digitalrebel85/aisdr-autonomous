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

    // 3. Handle company data - check if exists, create if not, link to lead
    let companyId: number | null = null;
    
    // Get company data from multiple sources:
    // 1. company_profile (from Apollo org enrichment)
    // 2. organization_data (from Apollo person enrichment)
    // 3. all_sources.apollo.organization (raw Apollo data)
    const companyProfile = enrichedData.company_profile || {};
    const orgData = enrichedData.organization_data || 
      enrichedData.all_sources?.apollo?.organization ||
      enrichedData.all_sources?.apollo?.person?.organization || {};
    
    // Merge company profile and org data
    const companyData = {
      name: companyProfile.name || orgData.name || enrichedData.company,
      description: companyProfile.description || orgData.short_description,
      industry: companyProfile.industry || orgData.industry,
      industries: companyProfile.industries || [],
      estimated_num_employees: companyProfile.estimated_num_employees || orgData.estimated_num_employees,
      annual_revenue: companyProfile.annual_revenue || orgData.annual_revenue,
      annual_revenue_printed: companyProfile.annual_revenue_printed,
      founded_year: companyProfile.founded_year || orgData.founded_year,
      keywords: companyProfile.keywords || orgData.keywords || [],
      technologies: companyProfile.technologies || companyProfile.techStack || [],
      website_url: companyProfile.website_url || orgData.website_url,
      linkedin_url: companyProfile.linkedin_url || orgData.linkedin_url,
      twitter_url: companyProfile.twitter_url || orgData.twitter_url,
      facebook_url: companyProfile.facebook_url || orgData.facebook_url,
      phone: companyProfile.phone || orgData.phone,
      address: companyProfile.address || orgData.raw_address,
      city: companyProfile.city || orgData.city,
      state: companyProfile.state || orgData.state,
      country: companyProfile.country || orgData.country,
      logo_url: companyProfile.logo_url || orgData.logo_url,
      primary_domain: orgData.primary_domain,
    };
    
    // Extract domain from enriched data or email
    const enrichedDomain = companyDomain || 
      companyData.primary_domain ||
      companyData.website_url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ||
      email.split('@')[1];
    
    console.log('Company data extraction:', { 
      enrichedDomain, 
      hasCompanyProfile: !!enrichedData.company_profile,
      hasOrgData: !!orgData.name,
      companyName: companyData.name 
    });
    
    // Create/update company if we have domain and some useful data
    const hasUsefulData = companyData.name || companyData.description || companyData.industry;
    
    if (enrichedDomain && hasUsefulData) {
      try {
        // Check if company already exists for this user
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .eq('domain', enrichedDomain.toLowerCase())
          .single();
        
        if (existingCompany) {
          // Company exists - update it with new data and link lead
          companyId = existingCompany.id;
          console.log(`Company already exists (id: ${companyId}), updating...`);
          
          await supabase
            .from('companies')
            .update({
              name: companyData.name,
              description: companyData.description,
              industry: companyData.industry,
              industries: companyData.industries,
              estimated_num_employees: companyData.estimated_num_employees,
              annual_revenue: companyData.annual_revenue,
              annual_revenue_printed: companyData.annual_revenue_printed,
              founded_year: companyData.founded_year,
              keywords: companyData.keywords,
              technologies: companyData.technologies,
              website_url: companyData.website_url,
              linkedin_url: companyData.linkedin_url,
              twitter_url: companyData.twitter_url,
              facebook_url: companyData.facebook_url,
              phone: companyData.phone,
              address: companyData.address,
              city: companyData.city,
              state: companyData.state,
              country: companyData.country,
              logo_url: companyData.logo_url,
              enriched_data: { ...companyProfile, organization_data: orgData },
              enrichment_status: 'enriched',
              enrichment_source: companyProfile.primary_source || enrichedData.primary_source || 'apollo',
              enriched_at: new Date().toISOString(),
            })
            .eq('id', companyId);
            
        } else {
          // Company doesn't exist - create it
          console.log(`Creating new company for domain: ${enrichedDomain}`);
          
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              domain: enrichedDomain.toLowerCase(),
              name: companyData.name,
              description: companyData.description,
              industry: companyData.industry,
              industries: companyData.industries,
              estimated_num_employees: companyData.estimated_num_employees,
              annual_revenue: companyData.annual_revenue,
              annual_revenue_printed: companyData.annual_revenue_printed,
              founded_year: companyData.founded_year,
              keywords: companyData.keywords,
              technologies: companyData.technologies,
              website_url: companyData.website_url,
              linkedin_url: companyData.linkedin_url,
              twitter_url: companyData.twitter_url,
              facebook_url: companyData.facebook_url,
              phone: companyData.phone,
              address: companyData.address,
              city: companyData.city,
              state: companyData.state,
              country: companyData.country,
              logo_url: companyData.logo_url,
              enriched_data: { ...companyProfile, organization_data: orgData },
              enrichment_status: 'enriched',
              enrichment_source: companyProfile.primary_source || enrichedData.primary_source || 'apollo',
              enriched_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          
          if (companyError) {
            console.error('Error creating company:', companyError);
          } else {
            companyId = newCompany?.id;
            console.log(`Created new company with id: ${companyId}`);
          }
        }
      } catch (companyErr) {
        console.error('Error handling company data:', companyErr);
        // Continue with lead update even if company handling fails
      }
    }

    // 4. Update lead with enriched data and company link
    const updateData: any = {
      enrichment_status: 'completed',
      enrichment_completed_at: new Date().toISOString(),
      enriched_data: enrichedData,
    };

    // Link lead to company if we have one
    if (companyId) {
      updateData.company_id = companyId;
    }

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
      enrichedData,
      companyId
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
