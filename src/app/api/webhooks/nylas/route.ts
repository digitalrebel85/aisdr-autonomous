import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

/**
 * Handles the initial webhook verification challenge from Nylas.
 * When you register a webhook, Nylas sends a GET request with a 'challenge' parameter.
 * You must respond with that same value to prove ownership of the endpoint.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    console.log('Nylas webhook challenge received. Responding...');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse(JSON.stringify({ error: 'Missing challenge parameter' }), {
    status: 400,
  });
}

/**
 * Handles incoming webhook notifications from Nylas.
 */
export async function POST(request: NextRequest) {
  console.log('Nylas webhook POST request received.');

  // 1. Verify the webhook signature to ensure it's from Nylas
  const nylasSignature = request.headers.get('x-nylas-signature');
  const rawBody = await request.text();
  const secret = process.env.NYLAS_WEBHOOK_SECRET;

  if (!secret) {
    console.error('NYLAS_WEBHOOK_SECRET is not set in environment variables.');
    return new NextResponse('Configuration error', { status: 500 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (nylasSignature !== expectedSignature) {
    console.warn('Invalid Nylas webhook signature received.');
    return new NextResponse('Invalid signature', { status: 401 });
  }

  // 2. Process the webhook payload
  try {
    const payload = JSON.parse(rawBody);
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Check if the webhook is for a message creation event
    if (payload.deltas && payload.deltas.length > 0) {
      for (const delta of payload.deltas) {
        if (delta.type === 'message.created') {
          console.log('Processing message.created event...');

          const { grant_id, id: message_id } = delta.object_data;
          console.log(`Fetching message ${message_id} for grant ${grant_id}`);

          try {
            const supabase = await createClient(cookies());

            // 1. Get the user's access token for this grant
            const { data: inbox, error: inboxError } = await supabase
              .from('connected_inboxes')
              .select('access_token, user_id')
              .eq('grant_id', grant_id)
              .single();

            if (inboxError || !inbox) {
              throw new Error(`Could not find inbox for grant_id: ${grant_id}`);
            }

            // 2. Fetch the full message from Nylas
            const nylasApiServer = process.env.NYLAS_API_SERVER;
            const messageResponse = await fetch(
              `${nylasApiServer}/v3/grants/${grant_id}/messages/${message_id}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${inbox.access_token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!messageResponse.ok) {
              throw new Error('Failed to fetch message from Nylas');
            }

            const messageData = await messageResponse.json();

            // 3. Call the Python CrewAI service for analysis
            const analysisResponse = await fetch('http://localhost:8000/analyze-reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                subject: messageData.subject, 
                body: messageData.body 
              }),
            });

            if (!analysisResponse.ok) {
              throw new Error('CrewAI service analysis failed');
            }

            const analysisResult = await analysisResponse.json();
            console.log('Received analysis from CrewAI service:', analysisResult);

            // 4. Save the analysis to the Supabase 'replies' table
            const { error: insertError } = await supabase.from('replies').insert({
              lead_id: messageData.id, // Using message ID as lead_id
              user_id: inbox.user_id,
              sentiment: analysisResult.sentiment,
              action_required: analysisResult.action_required,
              summary: analysisResult.summary,
            });

            if (insertError) {
              throw new Error(`Failed to save reply to Supabase: ${insertError.message}`);
            }

            console.log('Successfully saved reply analysis to Supabase.');

          } catch (e) {
            console.error('Error processing webhook delta:', e);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error processing webhook payload:', error);
    return new NextResponse('Error processing payload', { status: 500 });
  }

  // 3. Acknowledge receipt of the webhook
  return new NextResponse('Webhook received', { status: 200 });
}
