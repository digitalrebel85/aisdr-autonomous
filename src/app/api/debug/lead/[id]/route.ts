// Debug endpoint to check lead data
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numericId = parseInt(id, 10);

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', numericId)
      .single();

    // Get outreach by lead_id
    const { data: outreachByLeadId, error: outreachError1 } = await supabase
      .from('outreach_queue')
      .select('id, status, lead_id, lead_data, generated_email, sent_at, scheduled_at, campaign_id')
      .eq('lead_id', numericId);

    // Get outreach by lead_data email (if lead exists)
    let outreachByEmail = null;
    let outreachError2 = null;
    if (lead?.email) {
      const result = await supabase
        .from('outreach_queue')
        .select('id, status, lead_id, lead_data, generated_email, sent_at, scheduled_at, campaign_id')
        .eq('lead_data->>email', lead.email);
      outreachByEmail = result.data;
      outreachError2 = result.error;
    }

    // Get replies by lead_id (string) - use created_at since received_at may not exist
    const { data: repliesByLeadIdString, error: repliesError1String } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, summary, created_at, sentiment, raw_email_data, user_id')
      .eq('lead_id', String(numericId))
      .eq('user_id', user.id);

    // Get replies by lead_id (number)
    const { data: repliesByLeadIdNumber, error: repliesError1Number } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, summary, created_at, sentiment, raw_email_data, user_id')
      .eq('lead_id', numericId)
      .eq('user_id', user.id);

    // Get replies by lead_id without user_id filter (to debug)
    const { data: repliesByLeadIdNoUserFilter, error: repliesError1NoFilter } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, summary, created_at, sentiment, raw_email_data, user_id')
      .eq('lead_id', String(numericId));

    // Get replies by sender_email (if lead exists)
    let repliesByEmail = null;
    let repliesError2 = null;
    if (lead?.email) {
      const result = await supabase
        .from('replies')
        .select('id, lead_id, sender_email, summary, created_at, sentiment, raw_email_data')
        .eq('sender_email', lead.email);
      repliesByEmail = result.data;
      repliesError2 = result.error;
    }

    // Get all outreach for this user to see what lead_ids exist
    const { data: allOutreach } = await supabase
      .from('outreach_queue')
      .select('id, lead_id, lead_data, status')
      .eq('user_id', user.id)
      .limit(20);

    // Get all replies for this user
    const { data: allReplies } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email')
      .eq('user_id', user.id)
      .limit(20);

    return NextResponse.json({
      currentUserId: user.id,
      lead: {
        data: lead,
        error: leadError
      },
      outreach: {
        byLeadId: {
          count: outreachByLeadId?.length || 0,
          data: outreachByLeadId,
          error: outreachError1
        },
        byEmail: {
          count: outreachByEmail?.length || 0,
          data: outreachByEmail,
          error: outreachError2
        }
      },
      replies: {
        byLeadIdString: {
          count: repliesByLeadIdString?.length || 0,
          data: repliesByLeadIdString,
          error: repliesError1String
        },
        byLeadIdNumber: {
          count: repliesByLeadIdNumber?.length || 0,
          data: repliesByLeadIdNumber,
          error: repliesError1Number
        },
        byLeadIdNoUserFilter: {
          count: repliesByLeadIdNoUserFilter?.length || 0,
          data: repliesByLeadIdNoUserFilter,
          error: repliesError1NoFilter
        },
        byEmail: {
          count: repliesByEmail?.length || 0,
          data: repliesByEmail,
          error: repliesError2
        }
      },
      allData: {
        outreachLeadIds: allOutreach?.map(o => ({ id: o.id, lead_id: o.lead_id, email: o.lead_data?.email })),
        repliesLeadIds: allReplies?.map(r => ({ id: r.id, lead_id: r.lead_id, sender_email: r.sender_email }))
      }
    });

  } catch (error) {
    console.error('Debug lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
