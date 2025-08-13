import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch review queue items with related data
    const { data: reviewItems, error } = await supabase
      .from('persona_review_queue')
      .select(`
        *,
        personas:suggested_persona_id (
          id,
          name,
          description,
          title_patterns,
          industries,
          tone
        )
      `)
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching review queue:', error);
      return NextResponse.json({ error: 'Failed to fetch review queue' }, { status: 500 });
    }

    return NextResponse.json({ reviewItems: reviewItems || [] });
  } catch (error) {
    console.error('Review queue GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, action, personaId } = body;

    if (!reviewId || !action) {
      return NextResponse.json({ 
        error: 'Review ID and action are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject', 'modify'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be approve, reject, or modify' 
      }, { status: 400 });
    }

    // Get the review item
    const { data: reviewItem, error: fetchError } = await supabase
      .from('persona_review_queue')
      .select('*')
      .eq('id', reviewId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !reviewItem) {
      return NextResponse.json({ error: 'Review item not found' }, { status: 404 });
    }

    let updateData: any = {
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'modified',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    };

    // Handle different actions
    if (action === 'approve') {
      // Update the lead with the suggested persona
      if (reviewItem.lead_id) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            persona_id: reviewItem.suggested_persona_id,
            persona_match_status: 'confirmed',
            persona_confidence: reviewItem.confidence,
            persona_assigned_at: new Date().toISOString()
          })
          .eq('id', reviewItem.lead_id)
          .eq('user_id', user.id);

        if (leadUpdateError) {
          console.error('Error updating lead:', leadUpdateError);
          return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
        }
      }
    } else if (action === 'modify' && personaId) {
      // Update the lead with a different persona
      if (reviewItem.lead_id) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({
            persona_id: personaId,
            persona_match_status: 'confirmed',
            persona_confidence: 1.0, // Manual assignment gets full confidence
            persona_assigned_at: new Date().toISOString()
          })
          .eq('id', reviewItem.lead_id)
          .eq('user_id', user.id);

        if (leadUpdateError) {
          console.error('Error updating lead with modified persona:', leadUpdateError);
          return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
        }
      }
    }

    // Update the review item status
    const { error: updateError } = await supabase
      .from('persona_review_queue')
      .update(updateData)
      .eq('id', reviewId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating review item:', updateError);
      return NextResponse.json({ error: 'Failed to update review item' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Review item ${action}d successfully`,
      action,
      reviewId 
    });

  } catch (error) {
    console.error('Review queue POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch review actions
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewIds, action } = body;

    if (!reviewIds || !Array.isArray(reviewIds) || !action) {
      return NextResponse.json({ 
        error: 'Review IDs array and action are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Batch action must be approve or reject' 
      }, { status: 400 });
    }

    const results = [];

    for (const reviewId of reviewIds) {
      try {
        // Get the review item
        const { data: reviewItem, error: fetchError } = await supabase
          .from('persona_review_queue')
          .select('*')
          .eq('id', reviewId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !reviewItem) {
          results.push({ reviewId, error: 'Review item not found' });
          continue;
        }

        // Handle approval
        if (action === 'approve' && reviewItem.lead_id) {
          const { error: leadUpdateError } = await supabase
            .from('leads')
            .update({
              persona_id: reviewItem.suggested_persona_id,
              persona_match_status: 'confirmed',
              persona_confidence: reviewItem.confidence,
              persona_assigned_at: new Date().toISOString()
            })
            .eq('id', reviewItem.lead_id)
            .eq('user_id', user.id);

          if (leadUpdateError) {
            results.push({ reviewId, error: 'Failed to update lead' });
            continue;
          }
        }

        // Update review item status
        const { error: updateError } = await supabase
          .from('persona_review_queue')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', reviewId)
          .eq('user_id', user.id);

        if (updateError) {
          results.push({ reviewId, error: 'Failed to update review item' });
        } else {
          results.push({ reviewId, success: true });
        }

      } catch (error) {
        console.error(`Error processing review ${reviewId}:`, error);
        results.push({ reviewId, error: 'Processing failed' });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => r.error).length;

    return NextResponse.json({
      results,
      summary: {
        total: reviewIds.length,
        successful,
        failed,
        action
      }
    });

  } catch (error) {
    console.error('Batch review API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
