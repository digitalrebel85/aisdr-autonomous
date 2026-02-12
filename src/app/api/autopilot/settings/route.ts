// Autopilot settings API — GET/PUT for user's autonomous agent configuration

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create default settings
    let { data: settings, error } = await supabase
      .from('autopilot_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!settings) {
      // Create default settings
      const { data: newSettings, error: createError } = await supabase
        .from('autopilot_settings')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to create settings', details: createError.message }, { status: 500 });
      }
      settings = newSettings;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist allowed fields
    const allowedFields = [
      'enabled',
      'auto_discover_leads',
      'discovery_icp_profile_id',
      'max_leads_per_discovery',
      'discovery_frequency_hours',
      'auto_create_campaigns',
      'default_offer_id',
      'icp_score_threshold',
      'max_leads_per_campaign',
      'max_active_campaigns',
      'default_touches',
      'default_objective',
      'sequence_spacing_days',
      'max_new_leads_per_day',
      'max_emails_per_day',
      'booking_link',
      'auto_send_booking_link'
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Validate required references if provided
    if (updateData.discovery_icp_profile_id) {
      const { data: icp } = await supabase
        .from('icp_profiles')
        .select('id')
        .eq('id', updateData.discovery_icp_profile_id)
        .eq('user_id', user.id)
        .single();
      if (!icp) {
        return NextResponse.json({ error: 'ICP profile not found' }, { status: 400 });
      }
    }

    if (updateData.default_offer_id) {
      const { data: offer } = await supabase
        .from('offers')
        .select('id')
        .eq('id', updateData.default_offer_id)
        .eq('user_id', user.id)
        .single();
      if (!offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 400 });
      }
    }

    // Validate that enabling requires ICP + offer
    if (updateData.enabled === true) {
      const { data: currentSettings } = await supabase
        .from('autopilot_settings')
        .select('discovery_icp_profile_id, default_offer_id')
        .eq('user_id', user.id)
        .single();

      const icpId = updateData.discovery_icp_profile_id || currentSettings?.discovery_icp_profile_id;
      const offerId = updateData.default_offer_id || currentSettings?.default_offer_id;

      if (!icpId || !offerId) {
        return NextResponse.json({ 
          error: 'Cannot enable autopilot without selecting an ICP profile and an offer' 
        }, { status: 400 });
      }

      // Check user has at least one connected inbox
      const { data: inboxes } = await supabase
        .from('connected_inboxes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!inboxes || inboxes.length === 0) {
        return NextResponse.json({ 
          error: 'Cannot enable autopilot without a connected inbox' 
        }, { status: 400 });
      }
    }

    // Upsert settings
    const { data: settings, error: updateError } = await supabase
      .from('autopilot_settings')
      .upsert({ user_id: user.id, ...updateData }, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update settings', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
