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
    const { icp_profile_id, lead_ids } = body;

    if (!icp_profile_id) {
      return NextResponse.json({ error: 'ICP profile ID is required' }, { status: 400 });
    }

    // Verify the ICP profile belongs to the user
    const { data: icpProfile, error: icpError } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('id', icp_profile_id)
      .eq('user_id', user.id)
      .single();

    if (icpError || !icpProfile) {
      return NextResponse.json({ error: 'ICP profile not found' }, { status: 404 });
    }

    // Call the database function to score leads
    const { data: scoredLeads, error: scoringError } = await supabase
      .rpc('score_leads_with_icp', {
        icp_profile_id_param: icp_profile_id,
        user_id_param: user.id
      });

    if (scoringError) {
      console.error('Error scoring leads:', scoringError);
      return NextResponse.json({ 
        error: 'Failed to score leads',
        details: scoringError.message 
      }, { status: 500 });
    }

    // Filter by specific lead IDs if provided
    let leadsToUpdate = scoredLeads;
    if (lead_ids && Array.isArray(lead_ids) && lead_ids.length > 0) {
      leadsToUpdate = scoredLeads.filter((lead: any) => lead_ids.includes(lead.lead_id));
    }

    // Update the leads table with scores
    const updatePromises = leadsToUpdate.map(async (scoredLead: any) => {
      return supabase
        .from('leads')
        .update({
          icp_score: scoredLead.score,
          icp_profile_id: icp_profile_id,
          icp_match_details: scoredLead.match_details,
          icp_scored_at: new Date().toISOString()
        })
        .eq('id', scoredLead.lead_id)
        .eq('user_id', user.id);
    });

    const updateResults = await Promise.all(updatePromises);
    
    // Check for errors
    const failedUpdates = updateResults.filter(result => result.error);
    if (failedUpdates.length > 0) {
      console.error('Some leads failed to update:', failedUpdates);
    }

    // Update ICP profile statistics
    const { error: statsError } = await supabase
      .from('icp_profiles')
      .update({
        leads_scored: (icpProfile.leads_scored || 0) + leadsToUpdate.length,
        last_used_at: new Date().toISOString()
      })
      .eq('id', icp_profile_id);

    if (statsError) {
      console.error('Error updating ICP stats:', statsError);
    }

    // Calculate score distribution
    const scoreDistribution = {
      high: leadsToUpdate.filter((l: any) => l.score >= 80).length,
      medium: leadsToUpdate.filter((l: any) => l.score >= 50 && l.score < 80).length,
      low: leadsToUpdate.filter((l: any) => l.score < 50).length
    };

    return NextResponse.json({
      success: true,
      total_scored: leadsToUpdate.length,
      score_distribution: scoreDistribution,
      average_score: Math.round(
        leadsToUpdate.reduce((sum: number, l: any) => sum + l.score, 0) / leadsToUpdate.length
      ),
      scored_leads: leadsToUpdate.map((l: any) => ({
        lead_id: l.lead_id,
        score: l.score,
        match_details: l.match_details
      }))
    });

  } catch (error) {
    console.error('Error in POST /api/icp/score-leads:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve scoring results for leads
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const icp_profile_id = searchParams.get('icp_profile_id');
    const min_score = searchParams.get('min_score');
    const max_score = searchParams.get('max_score');

    let query = supabase
      .from('leads')
      .select('id, first_name, last_name, email, company, title, icp_score, icp_match_details, icp_scored_at')
      .eq('user_id', user.id)
      .not('icp_score', 'is', null)
      .order('icp_score', { ascending: false });

    if (icp_profile_id) {
      query = query.eq('icp_profile_id', icp_profile_id);
    }

    if (min_score) {
      query = query.gte('icp_score', parseInt(min_score));
    }

    if (max_score) {
      query = query.lte('icp_score', parseInt(max_score));
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching scored leads:', error);
      return NextResponse.json({ error: 'Failed to fetch scored leads' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leads: leads || []
    });

  } catch (error) {
    console.error('Error in GET /api/icp/score-leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
