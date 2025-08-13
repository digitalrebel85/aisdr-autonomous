import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { personaMatchingService } from '@/services/personaMatching';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lead, autoAssign = false } = body;

    if (!lead) {
      return NextResponse.json({ error: 'Lead data is required' }, { status: 400 });
    }

    // Fetch user's personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id);

    if (personasError) {
      console.error('Error fetching personas:', personasError);
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
    }

    if (!personas || personas.length === 0) {
      return NextResponse.json({ 
        error: 'No personas found. Please create personas first.' 
      }, { status: 400 });
    }

    // Perform persona matching
    const match = await personaMatchingService.assignPersonaToLead(lead, personas);

    // If autoAssign is true and we have a lead ID, update the lead with the persona
    if (autoAssign && lead.id && match.confidence >= 0.6) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          persona_id: match.persona.id,
          persona_match_status: match.confidence >= 0.8 ? 'confirmed' : 'tentative',
          persona_confidence: match.confidence,
          persona_assigned_at: new Date().toISOString()
        })
        .eq('id', lead.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating lead with persona:', updateError);
        // Don't fail the request, just log the error
      }
    }

    // If confidence is low, add to review queue
    if (personaMatchingService.shouldRequireManualReview(match)) {
      const { error: queueError } = await supabase
        .from('persona_review_queue')
        .insert({
          user_id: user.id,
          lead_id: lead.id || null,
          suggested_persona_id: match.persona.id,
          confidence: match.confidence,
          match_reasons: match.matchReasons,
          status: 'pending'
        });

      if (queueError) {
        console.error('Error adding to review queue:', queueError);
      }
    }

    return NextResponse.json({
      match: {
        persona: match.persona,
        confidence: match.confidence,
        matchReasons: match.matchReasons,
        matchType: match.matchType,
        requiresReview: personaMatchingService.shouldRequireManualReview(match)
      }
    });

  } catch (error) {
    console.error('Persona matching API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch matching endpoint for multiple leads
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leads, autoAssign = false } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Leads array is required' }, { status: 400 });
    }

    // Fetch user's personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id);

    if (personasError || !personas || personas.length === 0) {
      return NextResponse.json({ error: 'No personas available' }, { status: 400 });
    }

    const results = [];
    const reviewQueueItems = [];
    const leadUpdates = [];

    // Process each lead
    for (const lead of leads) {
      try {
        const match = await personaMatchingService.assignPersonaToLead(lead, personas);
        
        results.push({
          leadId: lead.id,
          match: {
            persona: match.persona,
            confidence: match.confidence,
            matchReasons: match.matchReasons,
            matchType: match.matchType,
            requiresReview: personaMatchingService.shouldRequireManualReview(match)
          }
        });

        // Prepare for batch updates if autoAssign is enabled
        if (autoAssign && lead.id && match.confidence >= 0.6) {
          leadUpdates.push({
            id: lead.id,
            persona_id: match.persona.id,
            persona_match_status: match.confidence >= 0.8 ? 'confirmed' : 'tentative',
            persona_confidence: match.confidence,
            persona_assigned_at: new Date().toISOString()
          });
        }

        // Add to review queue if needed
        if (personaMatchingService.shouldRequireManualReview(match)) {
          reviewQueueItems.push({
            user_id: user.id,
            lead_id: lead.id || null,
            suggested_persona_id: match.persona.id,
            confidence: match.confidence,
            match_reasons: match.matchReasons,
            status: 'pending'
          });
        }

      } catch (error) {
        console.error(`Error matching lead ${lead.id}:`, error);
        results.push({
          leadId: lead.id,
          error: 'Failed to match persona'
        });
      }
    }

    // Batch update leads if autoAssign is enabled
    if (leadUpdates.length > 0) {
      for (const update of leadUpdates) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            persona_id: update.persona_id,
            persona_match_status: update.persona_match_status,
            persona_confidence: update.persona_confidence,
            persona_assigned_at: update.persona_assigned_at
          })
          .eq('id', update.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error(`Error updating lead ${update.id}:`, updateError);
        }
      }
    }

    // Batch insert review queue items
    if (reviewQueueItems.length > 0) {
      const { error: queueError } = await supabase
        .from('persona_review_queue')
        .insert(reviewQueueItems);

      if (queueError) {
        console.error('Error adding items to review queue:', queueError);
      }
    }

    return NextResponse.json({
      results,
      summary: {
        total: leads.length,
        matched: results.filter(r => !r.error).length,
        errors: results.filter(r => r.error).length,
        requireReview: reviewQueueItems.length,
        autoAssigned: leadUpdates.length
      }
    });

  } catch (error) {
    console.error('Batch persona matching API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
