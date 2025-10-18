import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { icp_criteria } = await request.json();

    // Validate required fields
    if (!icp_criteria || !icp_criteria.industries || !icp_criteria.job_titles) {
      return NextResponse.json({ 
        error: 'Missing required fields: industries and job_titles are required' 
      }, { status: 400 });
    }

    // Call Python CrewAI service for Apollo discovery
    const crewServiceUrl = process.env.CREW_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${crewServiceUrl}/apollo/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        icp_criteria: {
          industries: icp_criteria.industries,
          job_titles: icp_criteria.job_titles,
          locations: icp_criteria.locations || [],
          company_sizes: icp_criteria.company_sizes || []
        },
        max_results: icp_criteria.max_results || 100,
        session_id: session.user.id
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apollo discovery service error:', errorText);
      return NextResponse.json({ 
        error: 'Lead discovery failed',
        details: errorText 
      }, { status: response.status });
    }

    const discoveryResults = await response.json();

    // Transform Apollo results to match our interface
    const transformedResults = {
      success: discoveryResults.success,
      total_discovered: discoveryResults.total_discovered || 0,
      organizations_found: discoveryResults.organizations_found || 0,
      leads: (discoveryResults.leads || []).map((lead: any) => ({
        id: `apollo_${lead.id || Math.random().toString(36).substr(2, 9)}`,
        name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        first_name: lead.first_name || lead.name?.split(' ')[0] || '',
        last_name: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
        email: lead.email,
        title: lead.title || lead.job_title || '',
        company: lead.company || lead.organization?.name || '',
        company_domain: lead.company_domain || lead.organization?.domain || '',
        phone: lead.phone,
        linkedin_url: lead.linkedin_url,
        location: lead.location || lead.city || '',
        organization: {
          name: lead.organization?.name || lead.company || '',
          domain: lead.organization?.domain || lead.company_domain || '',
          industry: lead.organization?.industry || '',
          employees_range: lead.organization?.employees_range || lead.organization?.company_size || '',
          location: lead.organization?.location || lead.organization?.city || ''
        },
        verified: lead.verified || false
      })),
      query_details: {
        industries: icp_criteria.industries,
        job_titles: icp_criteria.job_titles,
        locations: icp_criteria.locations || [],
        company_sizes: icp_criteria.company_sizes || []
      }
    };

    return NextResponse.json(transformedResults);

  } catch (error) {
    console.error('Apollo discovery error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
