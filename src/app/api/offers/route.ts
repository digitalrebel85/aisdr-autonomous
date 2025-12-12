// src/app/api/offers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      // Temporarily show all offers for testing
      // .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }

    return NextResponse.json({ offers: offers || [] });

  } catch (error) {
    console.error('Offers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, value_proposition, call_to_action, hook_snippet, proof_points, benefits, sales_assets } = body;

    if (!name || !value_proposition || !call_to_action) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, value_proposition, call_to_action' 
      }, { status: 400 });
    }

    // Build offer data, only including fields that exist in the database
    const offerData: Record<string, any> = {
      user_id: user.id,
      name,
      description: description || '',
      value_proposition,
      call_to_action,
      hook_snippet: hook_snippet || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add optional AI strategy fields if they have values
    if (proof_points?.length > 0) offerData.proof_points = proof_points;
    if (benefits?.length > 0) offerData.benefits = benefits;
    if (sales_assets?.length > 0) offerData.sales_assets = sales_assets;

    const { data: offer, error } = await supabase
      .from('offers')
      .insert(offerData)
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    return NextResponse.json({ offer });

  } catch (error) {
    console.error('Offers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
