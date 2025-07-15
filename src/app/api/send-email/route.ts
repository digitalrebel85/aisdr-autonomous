import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    // 1. Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    // 2. Parse the request body
    const { to, subject, body, sender_email } = await request.json();
    if (!to || !subject || !body || !sender_email) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields: to, subject, body, sender_email' }), { status: 400 });
    }

    // 3. Look up the sender's inbox credentials from Supabase
    const { data: inbox, error: selectError } = await supabase
      .from('connected_inboxes')
      .select('access_token') // We only need the access token now
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
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Send email error:', error);
    return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred.' }), { status: 500 });
  }
}
