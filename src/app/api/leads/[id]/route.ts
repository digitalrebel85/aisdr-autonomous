import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== LEAD API ROUTE V3 - WITH LEAD_ID FIX ==='); // Version marker - updated 14:39
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    // Fetch lead data with all tracking fields
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', numericId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch outreach queue items for this lead (emails sent/scheduled)
    // Note: outreach_queue stores email content in generated_email JSONB, not subject/body columns
    let { data: outreachItems, error: outreachError } = await supabase
      .from('outreach_queue')
      .select(`
        id,
        status,
        scheduled_at,
        sent_at,
        sequence_step,
        campaign_id,
        error_message,
        lead_data,
        generated_email,
        outreach_campaigns (
          id,
          name
        )
      `)
      .eq('lead_id', numericId)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false });

    console.log(`[Lead ${numericId}] Outreach items by lead_id:`, outreachItems?.length || 0, outreachError || '');

    // If no outreach found by lead_id, try by lead email in lead_data JSONB
    if ((!outreachItems || outreachItems.length === 0) && lead.email) {
      const { data: outreachByEmail, error: outreachByEmailError } = await supabase
        .from('outreach_queue')
        .select(`
          id,
          status,
          scheduled_at,
          sent_at,
          sequence_step,
          campaign_id,
          error_message,
          lead_data,
          generated_email,
          outreach_campaigns (
            id,
            name
          )
        `)
        .eq('lead_data->>email', lead.email)
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false });
      
      console.log(`[Lead ${numericId}] Outreach by lead_data email (${lead.email}):`, outreachByEmail?.length || 0, outreachByEmailError || '');
      
      if (outreachByEmail && outreachByEmail.length > 0) {
        outreachItems = outreachByEmail;
      }
    }

    // Fetch replies from this lead - use the EXACT same query as test-replies endpoint
    // which we know works
    const { data: replies, error: repliesError } = await supabase
      .from('replies')
      .select(`
        id,
        lead_id,
        summary,
        sentiment,
        action,
        is_read,
        lead_temperature,
        original_campaign_id,
        sender_email,
        raw_email_data,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log(`[Lead ${numericId}] ALL replies for user:`, replies?.length || 0, 'Error:', repliesError);
    
    // Filter replies for this lead by sender_email or lead_id
    const leadReplies = (replies || []).filter(r => 
      r.sender_email === lead.email || 
      r.lead_id === String(numericId) || 
      r.lead_id === numericId
    );
    
    console.log(`[Lead ${numericId}] Filtered replies for lead (email=${lead.email}):`, leadReplies.length);

    // Fetch bookings for this lead
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        meeting_type,
        booking_notes,
        created_at,
        booking_links (
          title
        )
      `)
      .eq('lead_id', numericId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch sequence executions for this lead (for open/click tracking)
    const { data: sequenceExecutions } = await supabase
      .from('sequence_executions')
      .select(`
        id,
        sequence_type,
        sequence_number,
        status,
        stop_reason,
        started_at,
        completed_at,
        emails_sent,
        emails_opened,
        emails_clicked,
        emails_replied,
        campaign_id
      `)
      .eq('lead_id', numericId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false });

    // Build activity timeline
    const activities: Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      metadata?: any;
    }> = [];

    // Add lead creation
    activities.push({
      id: 'created',
      type: 'created',
      description: 'Lead added to database',
      timestamp: lead.created_at
    });

    // Add enrichment if completed
    if (lead.enrichment_status === 'completed' && lead.enriched_data) {
      activities.push({
        id: 'enriched',
        type: 'enrichment',
        description: `Lead enriched via ${lead.enriched_data.primary_source || 'AI'}`,
        timestamp: lead.enriched_data.enrichment_timestamp || lead.updated_at
      });
    }

    // Add first reply timestamp from lead if exists
    if (lead.first_reply_at) {
      activities.push({
        id: 'first_reply',
        type: 'milestone',
        description: 'First reply received from lead',
        timestamp: lead.first_reply_at
      });
    }

    // Add meeting booked timestamp from lead if exists
    if (lead.meeting_booked_at) {
      activities.push({
        id: 'meeting_booked_milestone',
        type: 'meeting_booked',
        description: 'Meeting booked with lead',
        timestamp: lead.meeting_booked_at
      });
    }

    // Add outreach activities
    if (outreachItems) {
      for (const item of outreachItems) {
        // Extract subject from generated_email JSONB
        const emailSubject = (item.generated_email as any)?.subject || 'No subject';
        const campaignName = (item.outreach_campaigns as any)?.name || 'Campaign';
        
        if (item.status === 'sent' && item.sent_at) {
          activities.push({
            id: `email_sent_${item.id}`,
            type: 'email_sent',
            description: `Email sent: "${emailSubject}" (Step ${item.sequence_step || 1})`,
            timestamp: item.sent_at,
            metadata: {
              campaign_id: item.campaign_id,
              campaign_name: campaignName,
              step: item.sequence_step,
              subject: emailSubject
            }
          });
        } else if (item.status === 'queued' && item.scheduled_at) {
          activities.push({
            id: `email_scheduled_${item.id}`,
            type: 'email_scheduled',
            description: `Email scheduled: "${emailSubject}" (Step ${item.sequence_step || 1})`,
            timestamp: item.scheduled_at,
            metadata: {
              campaign_id: item.campaign_id,
              step: item.sequence_step,
              subject: emailSubject
            }
          });
        } else if (item.status === 'cancelled' || item.status === 'skipped') {
          activities.push({
            id: `email_stopped_${item.id}`,
            type: 'email_stopped',
            description: `Sequence stopped: ${item.error_message || item.status}`,
            timestamp: item.scheduled_at || item.sent_at,
            metadata: {
              reason: item.error_message || item.status
            }
          });
        }
      }
    }

    // Add reply activities
    if (leadReplies && leadReplies.length > 0) {
      for (const reply of leadReplies) {
        // Extract subject from raw_email_data if available, otherwise use summary
        const emailData = reply.raw_email_data as any;
        const replySubject = emailData?.data?.subject || reply.summary?.substring(0, 50) || 'Reply received';
        
        activities.push({
          id: `reply_${reply.id}`,
          type: 'reply_received',
          description: `Reply: "${replySubject}"`,
          timestamp: reply.created_at,
          metadata: {
            sentiment: reply.sentiment,
            action: reply.action,
            temperature: reply.lead_temperature,
            is_read: reply.is_read,
            summary: reply.summary
          }
        });
      }
    }

    // Add booking activities
    if (bookings) {
      for (const booking of bookings) {
        const bookingTitle = (booking.booking_links as any)?.title || 'Meeting';
        activities.push({
          id: `booking_${booking.id}`,
          type: 'call_booked',
          description: `${bookingTitle} scheduled for ${new Date(booking.start_time).toLocaleString()}`,
          timestamp: booking.created_at,
          metadata: {
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
            meeting_type: booking.meeting_type
          }
        });
      }
    }

    // Sort activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Get campaigns this lead is part of
    const campaignIds = [...new Set(outreachItems?.map(item => item.campaign_id).filter(Boolean) || [])];
    let campaigns: any[] = [];
    
    if (campaignIds.length > 0) {
      const { data: campaignData } = await supabase
        .from('outreach_campaigns')
        .select('id, name, status, created_at')
        .in('id', campaignIds);
      
      if (campaignData) {
        campaigns = campaignData.map(campaign => {
          const campaignOutreach = outreachItems?.filter(item => item.campaign_id === campaign.id) || [];
          const sentCount = campaignOutreach.filter(item => item.status === 'sent').length;
          const queuedCount = campaignOutreach.filter(item => item.status === 'queued').length;
          const replyCount = leadReplies?.filter(r => r.original_campaign_id === campaign.id).length || 0;
          
          // Get sequence execution stats for this campaign
          const execution = sequenceExecutions?.find(e => e.campaign_id === campaign.id);
          
          return {
            ...campaign,
            stats: {
              sent: sentCount,
              queued: queuedCount,
              replies: replyCount,
              opens: execution?.emails_opened || 0,
              clicks: execution?.emails_clicked || 0
            }
          };
        });
      }
    }

    return NextResponse.json({ 
      lead,
      activities,
      outreach: outreachItems || [],
      replies: leadReplies || [],
      bookings: bookings || [],
      campaigns,
      sequenceExecutions: sequenceExecutions || []
    });

  } catch (error) {
    console.error('Lead GET error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
