import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { icp_profile_id, max_results = 100 } = body;

    if (!icp_profile_id) {
      return NextResponse.json({ error: 'ICP profile ID is required' }, { status: 400 });
    }

    // Fetch the ICP profile
    const { data: icpProfile, error: icpError } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('id', icp_profile_id)
      .eq('user_id', user.id)
      .single();

    if (icpError || !icpProfile) {
      return NextResponse.json({ error: 'ICP profile not found' }, { status: 404 });
    }

    // Create a discovery session
    const { data: session, error: sessionError } = await supabase
      .from('icp_discovery_sessions')
      .insert({
        user_id: user.id,
        icp_profile_id: icp_profile_id,
        session_name: `Discovery for ${icpProfile.name}`,
        apollo_query: icpProfile.apollo_filters || {},
        status: 'running'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating discovery session:', sessionError);
      return NextResponse.json({ error: 'Failed to create discovery session' }, { status: 500 });
    }

    // Prepare ICP criteria for the Python service
    const icpCriteria = {
      industries: icpProfile.industries || [],
      company_sizes: icpProfile.company_sizes || [],
      locations: icpProfile.locations || [],
      job_titles: icpProfile.job_titles || [],
      seniority_levels: icpProfile.seniority_levels || [],
      departments: icpProfile.departments || [],
      technologies: icpProfile.technologies || [],
      funding_stages: icpProfile.funding_stages || [],
      keywords: icpProfile.keywords || [],
      employee_count_min: icpProfile.employee_count_min,
      employee_count_max: icpProfile.employee_count_max,
      revenue_min: icpProfile.revenue_min,
      revenue_max: icpProfile.revenue_max
    };

    // Call the Python service for Apollo discovery
    try {
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
      const discoveryResponse = await fetch(`${pythonServiceUrl}/apollo/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icp_criteria: icpCriteria,
          max_results: max_results,
          session_id: session.id
        })
      });

      if (!discoveryResponse.ok) {
        throw new Error(`Python service error: ${discoveryResponse.status}`);
      }

      const discoveryResult = await discoveryResponse.json();

      if (discoveryResult.success) {
        // Update session with results
        await supabase
          .from('icp_discovery_sessions')
          .update({
            status: 'completed',
            total_results: discoveryResult.total_discovered,
            leads_imported: discoveryResult.total_discovered,
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id);

        // Import leads into the leads table
        if (discoveryResult.leads && discoveryResult.leads.length > 0) {
          const leadsToInsert = discoveryResult.leads.map((lead: any) => ({
            user_id: user.id,
            first_name: lead.first_name || '',
            last_name: lead.last_name || '',
            email: lead.email,
            company: lead.company || '',
            company_domain: lead.company_domain || '',
            title: lead.title || '',
            linkedin_url: lead.linkedin_url || '',
            phone: lead.phone || '',
            location: lead.location || '',
            enriched_data: {
              apollo_discovery: {
                session_id: session.id,
                apollo_id: lead.apollo_id,
                discovery_date: new Date().toISOString(),
                icp_profile_id: icp_profile_id,
                company_industry: lead.company_industry,
                company_size: lead.company_size,
                seniority: lead.seniority,
                departments: lead.departments,
                apollo_data: lead.apollo_data
              }
            }
          }));

          const { error: insertError } = await supabase
            .from('leads')
            .insert(leadsToInsert);

          if (insertError) {
            console.error('Error inserting discovered leads:', insertError);
            // Update session status to indicate partial failure
            await supabase
              .from('icp_discovery_sessions')
              .update({
                status: 'completed',
                error_message: 'Some leads could not be imported'
              })
              .eq('id', session.id);
          }
        }

        // Update ICP profile usage statistics
        await supabase
          .from('icp_profiles')
          .update({
            usage_count: (icpProfile.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
            leads_discovered: (icpProfile.leads_discovered || 0) + discoveryResult.total_discovered
          })
          .eq('id', icp_profile_id);

        return NextResponse.json({
          success: true,
          session_id: session.id,
          total_discovered: discoveryResult.total_discovered,
          leads_imported: discoveryResult.total_discovered,
          search_summary: discoveryResult.search_summary,
          query_used: discoveryResult.query_used
        });

      } else {
        // Update session with error
        await supabase
          .from('icp_discovery_sessions')
          .update({
            status: 'failed',
            error_message: discoveryResult.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', session.id);

        return NextResponse.json({
          success: false,
          error: discoveryResult.error,
          session_id: session.id
        }, { status: 500 });
      }

    } catch (pythonError: any) {
      console.error('Error calling Python service:', pythonError);
      
      // Update session with error
      await supabase
        .from('icp_discovery_sessions')
        .update({
          status: 'failed',
          error_message: `Python service error: ${pythonError?.message || 'Unknown error'}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id);

      return NextResponse.json({
        success: false,
        error: 'Failed to connect to discovery service',
        session_id: session.id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in POST /api/apollo/discover:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
