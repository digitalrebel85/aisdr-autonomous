// New lead detail endpoint with working replies query
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
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    }

    // Fetch lead data with linked company
    // Use linked_company alias to avoid overwriting the company name field
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        linked_company:companies (
          id,
          domain,
          name,
          description,
          industry,
          industries,
          estimated_num_employees,
          annual_revenue,
          annual_revenue_printed,
          founded_year,
          keywords,
          technologies,
          website_url,
          linkedin_url,
          twitter_url,
          facebook_url,
          phone,
          address,
          city,
          state,
          country,
          logo_url,
          enrichment_status,
          enrichment_source,
          enriched_at
        )
      `)
      .eq('id', numericId)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch outreach queue items
    const { data: outreachItems } = await supabase
      .from('outreach_queue')
      .select(`
        id,
        status,
        scheduled_at,
        sent_at,
        sequence_step,
        campaign_id,
        thread_id,
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

    // Fetch ALL replies for user - try without user_id filter first to see if data exists
    const { data: allRepliesNoFilter, error: noFilterError } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, user_id, created_at')
      .limit(10);
    
    console.log('[lead-detail] Replies WITHOUT user_id filter:', allRepliesNoFilter?.length || 0, 'Error:', noFilterError);
    console.log('[lead-detail] Current user.id:', user.id);
    if (allRepliesNoFilter && allRepliesNoFilter.length > 0) {
      console.log('[lead-detail] First reply user_id:', allRepliesNoFilter[0].user_id);
    }

    // Now try with user_id filter
    const { data: allReplies, error: repliesError } = await supabase
      .from('replies')
      .select('id, lead_id, sender_email, created_at, summary, sentiment, action, is_read, lead_temperature, original_campaign_id, thread_id, raw_email_data')
      .eq('user_id', user.id);
    
    console.log('[lead-detail] Replies WITH user_id filter:', allReplies?.length || 0, 'Error:', repliesError);

    // Filter replies for this lead
    const leadReplies = (allReplies || []).filter(r => 
      r.sender_email === lead.email || 
      r.lead_id === String(numericId) || 
      r.lead_id === numericId
    );

    // Fetch bookings
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

    // Build activities array
    const activities: any[] = [];

    // Add lead created activity
    activities.push({
      id: 'created',
      type: 'created',
      description: 'Lead added to database',
      timestamp: lead.created_at
    });

    // Add enrichment activity if enriched
    if (lead.enriched_data?.enrichment_timestamp) {
      activities.push({
        id: 'enriched',
        type: 'enrichment',
        description: `Lead enriched via ${lead.enriched_data.primary_source || 'unknown'}`,
        timestamp: lead.enriched_data.enrichment_timestamp
      });
    }

    // Add outreach activities
    if (outreachItems) {
      for (const item of outreachItems) {
        const emailContent = item.generated_email as any;
        const subject = emailContent?.subject || 'No subject';
        const campaignName = (item.outreach_campaigns as any)?.name || 'Unknown Campaign';

        if (item.status === 'sent' && item.sent_at) {
          activities.push({
            id: `email_sent_${item.id}`,
            type: 'email_sent',
            description: `Email sent: "${subject}" (Step ${item.sequence_step || 1})`,
            timestamp: item.sent_at,
            metadata: {
              campaign_id: item.campaign_id,
              campaign_name: campaignName,
              step: item.sequence_step,
              subject,
              body: emailContent?.body || null
            }
          });
        } else if (item.status === 'queued') {
          activities.push({
            id: `email_scheduled_${item.id}`,
            type: 'email_scheduled',
            description: `Email scheduled: "${subject}" (Step ${item.sequence_step || 1})`,
            timestamp: item.scheduled_at,
            metadata: {
              campaign_id: item.campaign_id,
              step: item.sequence_step,
              subject,
              body: emailContent?.body || null
            }
          });
        }
      }
    }

    // Add reply activities
    for (const reply of leadReplies) {
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
          summary: reply.summary,
          raw_email_data: reply.raw_email_data
        }
      });
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

    // Get campaigns
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
          
          // Get thread_ids for this campaign's outreach emails
          const campaignThreadIds = campaignOutreach
            .map(item => item.thread_id)
            .filter(Boolean);
          
          // Count replies: match by original_campaign_id OR by thread_id (fallback for existing data)
          const replyCount = leadReplies.filter(r => 
            r.original_campaign_id === campaign.id || 
            (r.thread_id && campaignThreadIds.includes(r.thread_id))
          ).length;
          
          return {
            ...campaign,
            stats: {
              sent: sentCount,
              queued: queuedCount,
              replies: replyCount,
              opens: 0,
              clicks: 0
            }
          };
        });
      }
    }

    return NextResponse.json({ 
      lead,
      activities,
      outreach: outreachItems || [],
      replies: leadReplies,
      bookings: bookings || [],
      campaigns,
      debug: {
        allRepliesCount: allReplies?.length || 0,
        filteredRepliesCount: leadReplies.length,
        leadEmail: lead.email
      }
    });

  } catch (error) {
    console.error('Lead detail error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
