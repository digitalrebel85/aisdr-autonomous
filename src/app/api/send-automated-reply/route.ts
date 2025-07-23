import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Use service key for admin access (no user auth required for automated replies)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    // 1. Parse the request body
    const { to, subject, body, sender_email, lead_id, user_id, grant_id } = await request.json();
    if (!to || !subject || !body || !sender_email || !lead_id || !user_id || !grant_id) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing required fields: to, subject, body, sender_email, lead_id, user_id, grant_id' 
      }), { status: 400 });
    }

    // 2. Construct and send the email using the Nylas API with the provided grant_id
    const nylasApiUrl = `https://api.us.nylas.com/v3/grants/${grant_id}/messages/send`;

    const emailPayload = {
      to: [{ email: to }],
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
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to send automated reply via Nylas', 
        details: responseData 
      }), { status: nylasResponse.status });
    }

    // 3. Log the sent email to our database
    const messageId = responseData.data?.id;

    if (!messageId) {
      console.error('Failed to get message_id from Nylas response:', responseData);
      return new NextResponse(JSON.stringify({ 
        message: 'Email sent but failed to log message ID.' 
      }), { status: 200 });
    }

    const { error: insertError } = await supabase
      .from('sent_emails')
      .insert({
        message_id: messageId,
        grant_id: grant_id,
        user_id: user_id,
        lead_id: lead_id,
      });

    if (insertError) {
      console.error('Failed to log automated reply to DB:', insertError);
      // Don't fail the request - email was still sent
    }

    return new NextResponse(JSON.stringify({ 
      messageId: messageId,
      status: 'automated_reply_sent' 
    }), { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error sending automated reply:', message);
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}
