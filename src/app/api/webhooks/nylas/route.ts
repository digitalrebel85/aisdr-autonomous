import { NextResponse, type NextRequest } from 'next/server';
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

          // In a real scenario, you would fetch the message details from Nylas
          // using the delta.object_data.id to get the body and subject.
          // For now, we'll use mock data to test the connection.
          const mockEmailData = {
            subject: 'Mock Subject: Follow-up on our meeting',
            body: 'This is a mock email body to test the CrewAI service connection.',
          };

          try {
            // Call the Python CrewAI service
            const analysisResponse = await fetch('http://localhost:8000/analyze-reply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(mockEmailData),
            });

            if (!analysisResponse.ok) {
              const errorBody = await analysisResponse.text();
              throw new Error(`CrewAI service failed: ${analysisResponse.status} ${errorBody}`);
            }

            const analysisResult = await analysisResponse.json();
            console.log('Received analysis from CrewAI service:', analysisResult);

            // TODO: Save analysisResult to the Supabase 'replies' table.

          } catch (e) {
            console.error('Error calling CrewAI service:', e);
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
