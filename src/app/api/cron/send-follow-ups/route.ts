import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is the main function that will be triggered by the cron job.
export async function POST(request: NextRequest) {
  // 1. Authenticate the cron job request
  const authToken = (request.headers.get('authorization') || '').split('Bearer ').at(1);
  if (authToken !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('CRON JOB: Starting to process follow-ups...');

  // Use the admin client to have full access for this backend process
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    // 2. Find leads that need a follow-up
    // Logic: Find leads where next_follow_up_date is today or in the past,
    // and who haven't replied since the last contact.
    const today = new Date().toISOString().split('T')[0];
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*, connected_inboxes(email_address, grant_id)')
      .lte('next_follow_up_date', today)
      .not('last_contacted_at', 'is', null);

    if (leadsError) {
      console.error('CRON ERROR: Failed to fetch leads.', leadsError);
      throw new Error('Failed to fetch leads.');
    }

    if (!leads || leads.length === 0) {
      console.log('CRON JOB: No leads due for follow-up today.');
      return new NextResponse('No leads to process.', { status: 200 });
    }

    console.log(`CRON JOB: Found ${leads.length} leads to follow up with.`);

    // 3. Process each lead
    for (const lead of leads) {
      // Simple check: has this lead ever replied? For a more robust check,
      // we'd compare reply dates with last_contacted_at.
      const { data: replies, error: replyError } = await supabase
        .from('replies')
        .select('id')
        .eq('lead_id', lead.id)
        .limit(1);

      if (replyError) {
        console.error(`CRON ERROR: Failed to check replies for lead ${lead.id}.`, replyError);
        continue; // Skip to next lead
      }

      if (replies && replies.length > 0) {
        console.log(`CRON JOB: Lead ${lead.id} has already replied. Skipping.`);
        continue;
      }

      console.log(`CRON JOB: Processing follow-up for lead ${lead.id} (${lead.email}).`);

      // 4. Generate the follow-up email content via Python service
      // For now, we'll pass a simplified context. A real implementation would fetch thread history.
      const followUpRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/generate-follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_context: `Lead Name: ${lead.name}, Company: ${lead.company}, Offer: ${lead.offer_description}`,
          thread_history: 'Initial email was sent, but no reply yet.',
        }),
      });

      if (!followUpRes.ok) {
        console.error(`CRON ERROR: Failed to generate follow-up for lead ${lead.id}.`);
        continue;
      }
      const followUpContent = await followUpRes.json();

      // 5. Send the follow-up email directly via Nylas API
      const { data: inbox, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('access_token, grant_id, email_address')
        .eq('user_id', lead.user_id)
        .single();

      if (inboxError || !inbox) {
        console.error(`CRON ERROR: Could not find inbox for lead ${lead.id}.`, inboxError);
        continue;
      }

      const nylasApiUrl = `https://api.us.nylas.com/v3/grants/${inbox.grant_id}/messages/send`;
      const nylasResponse = await fetch(nylasApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${inbox.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          to: [{ email: lead.email }],
          subject: followUpContent.subject,
          body: followUpContent.body,
          tracking: { opens: true, bounces: true },
        }),
      });

      const responseData = await nylasResponse.json();

      if (!nylasResponse.ok) {
        console.error(`CRON ERROR: Nylas API failed to send follow-up for lead ${lead.id}.`, responseData);
        continue;
      }

      console.log(`CRON JOB: Follow-up email sent successfully to lead ${lead.id}. Logging to DB.`);

      // Log the sent email to our database
      const { error: insertError } = await supabase.from('sent_emails').insert({
        message_id: responseData.id,
        grant_id: inbox.grant_id,
        user_id: lead.user_id,
        lead_id: lead.id,
      });

      if (insertError) {
        console.error(`CRON ERROR: Failed to log sent email for lead ${lead.id}.`, insertError);
      }

      // 6. Update the lead's follow-up status
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 7); // Schedule next one in 7 days

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          follow_up_count: (lead.follow_up_count || 0) + 1,
          last_contacted_at: new Date().toISOString(),
          next_follow_up_date: nextFollowUp.toISOString().split('T')[0],
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`CRON ERROR: Failed to update lead ${lead.id} status.`, updateError);
      }
    }

    return new NextResponse('Follow-up processing complete.', { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('CRON JOB FAILED:', message);
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
