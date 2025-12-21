import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch a single angle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; angleId: string }> }
) {
  try {
    const { id: icpId, angleId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: angle, error } = await supabase
      .from('icp_angles')
      .select('*')
      .eq('id', angleId)
      .eq('icp_profile_id', icpId)
      .eq('user_id', user.id)
      .single();

    if (error || !angle) {
      return NextResponse.json({ error: 'Angle not found' }, { status: 404 });
    }

    return NextResponse.json({ angle });
  } catch (error) {
    console.error('Error in GET /api/icp/[id]/angles/[angleId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an angle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; angleId: string }> }
) {
  try {
    const { id: icpId, angleId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify angle belongs to user
    const { data: existing, error: existingError } = await supabase
      .from('icp_angles')
      .select('id')
      .eq('id', angleId)
      .eq('icp_profile_id', icpId)
      .eq('user_id', user.id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Angle not found' }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.value_proposition !== undefined) updateData.value_proposition = body.value_proposition;
    if (body.pain_points !== undefined) updateData.pain_points = body.pain_points;
    if (body.hooks !== undefined) updateData.hooks = body.hooks;
    if (body.proof_points !== undefined) updateData.proof_points = body.proof_points;
    if (body.objection_handlers !== undefined) updateData.objection_handlers = body.objection_handlers;
    if (body.tone !== undefined) updateData.tone = body.tone;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.is_control !== undefined) updateData.is_control = body.is_control;

    const { data: angle, error } = await supabase
      .from('icp_angles')
      .update(updateData)
      .eq('id', angleId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating angle:', error);
      return NextResponse.json({ error: 'Failed to update angle' }, { status: 500 });
    }

    return NextResponse.json({ angle });
  } catch (error) {
    console.error('Error in PUT /api/icp/[id]/angles/[angleId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an angle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; angleId: string }> }
) {
  try {
    const { id: icpId, angleId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by setting is_active to false (preserves history)
    const { error } = await supabase
      .from('icp_angles')
      .update({ is_active: false })
      .eq('id', angleId)
      .eq('icp_profile_id', icpId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting angle:', error);
      return NextResponse.json({ error: 'Failed to delete angle' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/icp/[id]/angles/[angleId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
