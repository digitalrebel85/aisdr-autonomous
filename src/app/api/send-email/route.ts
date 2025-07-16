import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    // 2. Parse the request body
    const { to, subject, body, sender_email, lead_id } = await request.json();
    if (!to || !subject || !body || !sender_email || !lead_id) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields: to, subject, body, sender_email, lead_id' }), { status: 400 });
    }

    // 3. Look up the sender's inbox credentials from Supabase
    const { data: inbox, error: selectError } = await supabase
      .from('connected_inboxes')
      .select('access_token, grant_id') // We only need the access token and grant_id now
      .eq('user_id', user.id)
      .eq('email_address', sender_email)
      .single();

    if (selectError || !inbox) {
      return new NextResponse(JSON.stringify({ error: 'Sender email not found or not connected for this user.' }), { status: 404 });
    }

    // 4. Construct and send the email using the Nylas API
    // Per Nylas docs, use '/me/' in the path when authenticating with a user's access token.
    const nylasApiUrl = `https://api.us.nylas.com/v3/grants/me/messages/send`;

    const emailPayload = {
      to: [{ email: to }],
      subject: subject,
      body: body,
      tracking: { opens: true, bounces: true },
    };

    const nylasResponse = await fetch(nylasApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${inbox.access_token}`,
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
    const { error: insertError } = await supabase
      .from('sent_emails')
      .insert({
        message_id: responseData.id,
        grant_id: inbox.grant_id,
        user_id: user.id,
        lead_id: lead_id,
      });

    if (insertError) {
      // Log the error but don't fail the request, as the email was still sent
      console.error('Failed to log sent email to DB:', insertError);
    }

    return new NextResponse(JSON.stringify({ messageId: responseData.id }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending email:', message);
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
