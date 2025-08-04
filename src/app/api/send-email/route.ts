import { createClient } from '@/utils/supabase/server';

import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Parse the request body first
    const { to, subject, body, sender_email, lead_id, grantId, fromEmail, bookingId } = await request.json();
    
    // 2. Get the authenticated user (optional for system usage)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Allow system usage without authentication if grantId is provided
    const isSystemUsage = !user && grantId;
    
    if (!user && !isSystemUsage) {
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }
    
    // Support both old and new parameter formats
    const recipientEmail = to;
    const senderEmail = sender_email || fromEmail;
    const grantIdToUse = grantId;
    
    if (!recipientEmail || !subject || !body || (!senderEmail && !grantIdToUse)) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields: to, subject, body, and either sender_email or grantId' }), { status: 400 });
    }

    // 3. Look up the sender's inbox credentials from Supabase
    let inbox;
    let selectError;
    
    if (grantIdToUse) {
      // Use grant ID directly (for system/cron job usage)
      const { data, error } = await supabase
        .from('connected_inboxes')
        .select('access_token, grant_id, email_address')
        .eq('grant_id', grantIdToUse)
        .single();
      inbox = data;
      selectError = error;
    } else {
      // Look up by sender email (for user-initiated emails)
      if (!user) {
        return new NextResponse(JSON.stringify({ error: 'User authentication required for sender email lookup' }), { status: 401 });
      }
      const { data, error } = await supabase
        .from('connected_inboxes')
        .select('access_token, grant_id, email_address')
        .eq('user_id', user.id)
        .eq('email_address', senderEmail)
        .single();
      inbox = data;
      selectError = error;
    }

    if (selectError || !inbox) {
      return new NextResponse(JSON.stringify({ error: 'Sender email not found or not connected for this user.' }), { status: 404 });
    }

    // 4. Construct and send the email using the Nylas API
    // Use the grant_id and the application's NYLAS_API_KEY for robust server-to-server auth
    const nylasApiUrl = `https://api.us.nylas.com/v3/grants/${inbox.grant_id}/messages/send`;

    const emailPayload = {
      to: [{ email: recipientEmail }],
      subject: subject,
      body: body,
      tracking: { opens: true, bounces: true },
    };

    const nylasResponse = await fetch(nylasApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await nylasResponse.json();

    if (!nylasResponse.ok) {
      console.error('Nylas API error:', responseData);
      return new NextResponse(JSON.stringify({ error: 'Failed to send email via Nylas', details: responseData }), { status: nylasResponse.status });
    }

    // 5. Return the Nylas response
    // Also log the sent email to our database
    // The message ID is nested inside the 'data' object in the Nylas response
    const messageId = responseData.data?.id;

    if (!messageId) {
      // Log the error but don't fail the request, as the email was still sent
      console.error('Failed to get message_id from Nylas response:', responseData);
      // Still return a success response to the client
      return new NextResponse(JSON.stringify({ message: 'Email sent but failed to log message ID.' }), { status: 200 });
    }

    const { error: insertError } = await supabase
      .from('sent_emails')
      .insert({
        message_id: messageId,
        grant_id: inbox.grant_id,
        user_id: user?.id || null,
        lead_id: lead_id,
        booking_id: bookingId || null,
      });

    if (insertError) {
      // Log the error but don't fail the request, as the email was still sent
      console.error('Failed to log sent email to DB:', insertError);
    }

    return new NextResponse(JSON.stringify({ messageId: messageId }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending email:', message);
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
