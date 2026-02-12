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

    // Prepare the updated ICP profile data — include ALL form fields
    const icpData: Record<string, any> = {
      name: body.name,
      description: body.description || '',
      campaign_name: body.campaign_name || '',
      // Job & Contact Filters
      job_titles: body.job_titles || [],
      exclude_job_titles: body.exclude_job_titles || [],
      seniority_levels: body.seniority_levels || [],
      departments: body.departments || [],
      lead_names: body.lead_names || [],
      // Company Filters
      industries: body.industries || [],
      industry_keywords: body.industry_keywords || [],
      exclude_industry_keywords: body.exclude_industry_keywords || [],
      company_sizes: body.company_sizes || [],
      company_domain_names: body.company_domain_names || [],
      company_domain_exact_match: body.company_domain_exact_match || false,
      exclude_company_domains: body.exclude_company_domains || [],
      exclude_domains_exact_match: body.exclude_domains_exact_match || false,
      technologies: body.technologies || [],
      currently_hiring_for: body.currently_hiring_for || [],
      // Location Filters
      locations: body.locations || [],
      contact_locations: body.contact_locations || [],
      exclude_contact_locations: body.exclude_contact_locations || [],
      company_hq_locations: body.company_hq_locations || [],
      // Company Metrics
      employee_count_min: body.employee_count_min || null,
      employee_count_max: body.employee_count_max || null,
      revenue_min: body.revenue_min || null,
      revenue_max: body.revenue_max || null,
      yearly_headcount_growth_min: body.yearly_headcount_growth_min || null,
      yearly_headcount_growth_max: body.yearly_headcount_growth_max || null,
      // Funding Filters
      funding_types: body.funding_types || [],
      funding_amount_min: body.funding_amount_min || null,
      funding_amount_max: body.funding_amount_max || null,
      // Advanced Filters
      intent_signals: body.intent_signals || [],
      verified_emails_only: body.verified_emails_only || false,
      keywords: body.keywords || [],
      updated_at: new Date().toISOString()
    };

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
