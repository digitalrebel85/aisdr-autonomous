import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
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
    const { id: profileId } = await params;

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prepare the updated ICP profile data
    const icpData = {
      name: body.name,
      description: body.description || '',
      industries: body.industries || [],
      company_sizes: body.company_sizes || [],
      locations: body.locations || [],
      job_titles: body.job_titles || [],
      seniority_levels: body.seniority_levels || [],
      departments: body.departments || [],
      technologies: body.technologies || [],
      funding_stages: body.funding_stages || [],
      keywords: body.keywords || [],
      employee_count_min: body.employee_count_min || null,
      employee_count_max: body.employee_count_max || null,
      revenue_min: body.revenue_min || null,
      revenue_max: body.revenue_max || null,
      updated_at: new Date().toISOString()
    };

    // Create Apollo filters object
    const apolloFilters: any = {};
    
    if (icpData.industries.length > 0) {
      apolloFilters.organization_industry_tag_ids = icpData.industries;
    }
    
    if (icpData.company_sizes.length > 0) {
      apolloFilters.organization_num_employees_ranges = icpData.company_sizes;
    }
    
    if (icpData.locations.length > 0) {
      apolloFilters.person_locations = icpData.locations;
    }
    
    if (icpData.job_titles.length > 0) {
      apolloFilters.person_titles = icpData.job_titles;
    }
    
    if (icpData.seniority_levels.length > 0) {
      apolloFilters.person_seniorities = icpData.seniority_levels;
    }
    
    if (icpData.departments.length > 0) {
      apolloFilters.person_departments = icpData.departments;
    }
    
    if (icpData.technologies.length > 0) {
      apolloFilters.organization_technology_names = icpData.technologies;
    }
    
    if (icpData.keywords.length > 0) {
      apolloFilters.q_keywords = icpData.keywords.join(' ');
    }

    (icpData as any).apollo_filters = apolloFilters;

    // Update the ICP profile
    const { data: profile, error } = await supabase
      .from('icp_profiles')
      .update(icpData)
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ICP profile:', error);
      return NextResponse.json({ error: 'Failed to update ICP profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'ICP profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in PUT /api/icp/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: profileId } = await params;

    // Delete the ICP profile
    const { error } = await supabase
      .from('icp_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting ICP profile:', error);
      return NextResponse.json({ error: 'Failed to delete ICP profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/icp/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
