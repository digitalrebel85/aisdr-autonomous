import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Fetch ICP profiles for the user
    const { data: profiles, error } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ICP profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch ICP profiles' }, { status: 500 });
    }

    return NextResponse.json({ profiles: profiles || [] });
  } catch (error) {
    console.error('Error in GET /api/icp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Prepare the ICP profile data
    // Append pain points to description since icp_profiles table may not have pain_points column
    let description = body.description || '';
    if (body.pain_points?.length > 0) {
      const painPointsText = `\n\nPain Points: ${body.pain_points.join(', ')}`;
      description += painPointsText;
    }
    
    const icpData: Record<string, any> = {
      user_id: user.id,
      name: body.name,
      description: description.trim(),
      status: 'draft'
    };

    // Only add array fields if they have values
    if (body.industries?.length > 0) icpData.industries = body.industries;
    if (body.company_sizes?.length > 0) icpData.company_sizes = body.company_sizes;
    if (body.locations?.length > 0) icpData.locations = body.locations;
    if (body.job_titles?.length > 0) icpData.job_titles = body.job_titles;
    if (body.seniority_levels?.length > 0) icpData.seniority_levels = body.seniority_levels;
    if (body.departments?.length > 0) icpData.departments = body.departments;
    if (body.technologies?.length > 0) icpData.technologies = body.technologies;
    if (body.funding_stages?.length > 0) icpData.funding_stages = body.funding_stages;
    if (body.keywords?.length > 0) icpData.keywords = body.keywords;
    // Note: pain_points may not exist in all database schemas - will be added to description if column doesn't exist
    // if (body.pain_points?.length > 0) icpData.pain_points = body.pain_points;
    if (body.employee_count_min) icpData.employee_count_min = body.employee_count_min;
    if (body.employee_count_max) icpData.employee_count_max = body.employee_count_max;
    if (body.revenue_min) icpData.revenue_min = body.revenue_min;
    if (body.revenue_max) icpData.revenue_max = body.revenue_max;

    // Insert the ICP profile
    const { data: profile, error } = await supabase
      .from('icp_profiles')
      .insert(icpData)
      .select()
      .single();

    if (error) {
      console.error('Error creating ICP profile:', error);
      return NextResponse.json({ 
        error: 'Failed to create ICP profile', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/icp:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
