import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      icp_profile_id,
      min_score = 80,
      max_leads,
      exclude_recently_contacted = true,
      exclude_low_engagement = true,
      days_since_contact = 30
    } = body;

    // Build query for smart lead selection
    let query = supabase
      .from('leads')
      .select('id, first_name, last_name, email, company, title, icp_score, icp_match_details, enrichment_status, last_contacted, created_at')
      .eq('user_id', user.id)
      .gte('icp_score', min_score)
      .order('icp_score', { ascending: false });

    // Filter by specific ICP profile if provided
    if (icp_profile_id) {
      query = query.eq('icp_profile_id', icp_profile_id);
    }

    // Exclude recently contacted leads
    if (exclude_recently_contacted) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days_since_contact);
      query = query.or(`last_contacted.is.null,last_contacted.lt.${cutoffDate.toISOString()}`);
    }

    // Only include enriched leads for better personalization
    if (exclude_low_engagement) {
      query = query.eq('enrichment_status', 'completed');
    }

    // Limit results if specified
    if (max_leads) {
      query = query.limit(max_leads);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching smart leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Calculate selection statistics
    const stats = {
      total_selected: leads?.length || 0,
      average_score: leads && leads.length > 0
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.icp_score || 0), 0) / leads.length)
        : 0,
      score_distribution: {
        excellent: leads?.filter(l => (l.icp_score || 0) >= 90).length || 0,
        high: leads?.filter(l => (l.icp_score || 0) >= 80 && (l.icp_score || 0) < 90).length || 0,
        medium: leads?.filter(l => (l.icp_score || 0) >= 50 && (l.icp_score || 0) < 80).length || 0,
      },
      enrichment_status: {
        completed: leads?.filter(l => l.enrichment_status === 'completed').length || 0,
        pending: leads?.filter(l => l.enrichment_status === 'pending').length || 0,
      }
    };

    return NextResponse.json({
      success: true,
      leads: leads || [],
      stats,
      selection_criteria: {
        min_score,
        icp_profile_id,
        exclude_recently_contacted,
        exclude_low_engagement,
        days_since_contact
      }
    });

  } catch (error) {
    console.error('Error in POST /api/icp/smart-select:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve available ICP profiles for selection
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active ICP profiles
    const { data: profiles, error } = await supabase
      .from('icp_profiles')
      .select('id, name, description, leads_scored, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('leads_scored', { ascending: false });

    if (error) {
      console.error('Error fetching ICP profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Get count of high-scoring leads for each profile
    const profilesWithCounts = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('icp_profile_id', profile.id)
          .gte('icp_score', 80);

        return {
          ...profile,
          high_score_count: count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      profiles: profilesWithCounts
    });

  } catch (error) {
    console.error('Error in GET /api/icp/smart-select:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
