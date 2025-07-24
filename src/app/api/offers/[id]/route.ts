// src/app/api/offers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offerId = parseInt(params.id);
    if (isNaN(offerId)) {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, value_proposition, call_to_action, hook_snippet } = body;

    if (!name || !value_proposition || !call_to_action) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, value_proposition, call_to_action' 
      }, { status: 400 });
    }

    // First check if the offer exists and belongs to the user
    const { data: existingOffer, error: fetchError } = await supabase
      .from('offers')
      .select('id')
      .eq('id', offerId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Update the offer
    const { data: offer, error } = await supabase
      .from('offers')
      .update({
        name,
        description: description || '',
        value_proposition,
        call_to_action,
        hook_snippet: hook_snippet || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating offer:', error);
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
    }

    return NextResponse.json({ offer });

  } catch (error) {
    console.error('Offer PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offerId = parseInt(params.id);
    if (isNaN(offerId)) {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    // First check if the offer exists and belongs to the user
    const { data: existingOffer, error: fetchError } = await supabase
      .from('offers')
      .select('id')
      .eq('id', offerId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if the offer is being used in any active campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('id, name')
      .eq('offer_id', offerId)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (campaignError) {
      console.error('Error checking campaigns:', campaignError);
      return NextResponse.json({ error: 'Failed to check campaign usage' }, { status: 500 });
    }

    if (campaigns && campaigns.length > 0) {
      const campaignNames = campaigns.map(c => c.name).join(', ');
      return NextResponse.json({ 
        error: `Cannot delete offer. It is being used in active campaigns: ${campaignNames}` 
      }, { status: 400 });
    }

    // Delete the offer
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting offer:', error);
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Offer deleted successfully' });

  } catch (error) {
    console.error('Offer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
