// Simple test endpoint to debug replies query
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authError }, { status: 401 });
    }

    // Test 1: Get all replies for this user with all fields needed for display
    const { data: allReplies, error: allRepliesError } = await supabase
      .from('replies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Test 2: Query by sender_email
    const testEmail = 'chris@summitleadgeneration.com';
    const { data: repliesByEmail, error: emailError } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, created_at')
      .eq('sender_email', testEmail)
      .eq('user_id', user.id);

    // Test 3: Query by lead_id as string
    const { data: repliesByLeadIdString, error: stringError } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, created_at')
      .eq('lead_id', '16')
      .eq('user_id', user.id);

    // Test 4: Query by lead_id as number
    const { data: repliesByLeadIdNumber, error: numberError } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, created_at')
      .eq('lead_id', 16)
      .eq('user_id', user.id);

    return NextResponse.json({
      currentUserId: user.id,
      tests: {
        allRepliesForUser: {
          count: allReplies?.length || 0,
          data: allReplies,
          error: allRepliesError
        },
        byEmail: {
          email: testEmail,
          count: repliesByEmail?.length || 0,
          data: repliesByEmail,
          error: emailError
        },
        byLeadIdString: {
          leadId: '16',
          count: repliesByLeadIdString?.length || 0,
          data: repliesByLeadIdString,
          error: stringError
        },
        byLeadIdNumber: {
          leadId: 16,
          count: repliesByLeadIdNumber?.length || 0,
          data: repliesByLeadIdNumber,
          error: numberError
        }
      }
    });

  } catch (error) {
    console.error('Test replies error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
