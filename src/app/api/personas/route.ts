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

    // Fetch user's personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching personas:', error);
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
    }

    // If no personas exist, create default persona
    if (!personas || personas.length === 0) {
      const { data: defaultPersona, error: createError } = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: 'Default Business Professional',
          description: 'Generic persona for leads that don\'t match specific criteria',
          title_patterns: ['Manager', 'Director', 'VP', 'Executive', 'Owner', 'Founder'],
          industries: ['Technology', 'Business Services', 'Professional Services'],
          pain_points: ['Manual processes', 'Time constraints', 'Resource limitations', 'Efficiency challenges'],
          messaging_hooks: ['Improve efficiency', 'Save time', 'Increase ROI', 'Streamline operations'],
          tone: 'professional',
          is_default: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating default persona:', createError);
        return NextResponse.json({ error: 'Failed to create default persona' }, { status: 500 });
      }

      return NextResponse.json({ personas: [defaultPersona] });
    }

    return NextResponse.json({ personas });
  } catch (error) {
    console.error('Personas API error:', error);
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
    const {
      name,
      description,
      title_patterns,
      company_size_min,
      company_size_max,
      company_size_text,
      industries,
      pain_points,
      messaging_hooks,
      tone
    } = body;

    // Validate required fields
    if (!name || !title_patterns || !industries) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, title_patterns, industries' 
      }, { status: 400 });
    }

    // Create new persona
    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        user_id: user.id,
        name,
        description,
        title_patterns,
        company_size_min,
        company_size_max,
        company_size_text,
        industries,
        pain_points: pain_points || [],
        messaging_hooks: messaging_hooks || [],
        tone: tone || 'professional',
        is_default: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating persona:', error);
      return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
    }

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error) {
    console.error('Personas POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
