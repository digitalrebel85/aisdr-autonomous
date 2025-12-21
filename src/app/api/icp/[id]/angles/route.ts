import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Plan limits for angles per ICP
const PLAN_ANGLE_LIMITS: Record<string, number> = {
  starter: 2,
  pro: 5,
  scale: Infinity,
  enterprise: Infinity
};

// GET - Fetch all angles for an ICP
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: icpId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ICP belongs to user
    const { data: icp, error: icpError } = await supabase
      .from('icp_profiles')
      .select('id, name')
      .eq('id', icpId)
      .eq('user_id', user.id)
      .single();

    if (icpError || !icp) {
      return NextResponse.json({ error: 'ICP not found' }, { status: 404 });
    }

    // Fetch angles for this ICP
    const { data: angles, error } = await supabase
      .from('icp_angles')
      .select('*')
      .eq('icp_profile_id', icpId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching angles:', error);
      return NextResponse.json({ error: 'Failed to fetch angles' }, { status: 500 });
    }

    // Get user's plan to determine limit
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const plan = profile?.preferences?.plan || 'starter';
    const limit = PLAN_ANGLE_LIMITS[plan] || 2;

    return NextResponse.json({ 
      angles: angles || [],
      icp,
      limit,
      remaining: Math.max(0, limit - (angles?.length || 0))
    });
  } catch (error) {
    console.error('Error in GET /api/icp/[id]/angles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new angle for an ICP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: icpId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ICP belongs to user
    const { data: icp, error: icpError } = await supabase
      .from('icp_profiles')
      .select('id')
      .eq('id', icpId)
      .eq('user_id', user.id)
      .single();

    if (icpError || !icp) {
      return NextResponse.json({ error: 'ICP not found' }, { status: 404 });
    }

    // Check plan limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const plan = profile?.preferences?.plan || 'starter';
    const limit = PLAN_ANGLE_LIMITS[plan] || 2;

    // Count existing angles
    const { count } = await supabase
      .from('icp_angles')
      .select('*', { count: 'exact', head: true })
      .eq('icp_profile_id', icpId)
      .eq('is_active', true);

    if ((count || 0) >= limit) {
      return NextResponse.json({ 
        error: `You've reached your limit of ${limit} angles per ICP on the ${plan} plan. Upgrade to add more.`,
        limit,
        current: count
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.value_proposition) {
      return NextResponse.json({ 
        error: 'Name and value proposition are required' 
      }, { status: 400 });
    }

    // Create the angle
    const { data: angle, error } = await supabase
      .from('icp_angles')
      .insert({
        icp_profile_id: icpId,
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        value_proposition: body.value_proposition,
        pain_points: body.pain_points || [],
        hooks: body.hooks || [],
        proof_points: body.proof_points || [],
        objection_handlers: body.objection_handlers || [],
        tone: body.tone || 'professional',
        is_active: true,
        is_control: body.is_control || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating angle:', error);
      return NextResponse.json({ error: 'Failed to create angle' }, { status: 500 });
    }

    return NextResponse.json({ angle }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/icp/[id]/angles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
