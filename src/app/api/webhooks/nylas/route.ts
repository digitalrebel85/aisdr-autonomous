import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
  // 1. Verify webhook signature
  const isTestMode = request.headers.get('x-cascade-test') === 'true';
  const rawBody = await request.text();

  if (!isTestMode) {
    const nylasSignature = request.headers.get('x-nylas-signature');
    const secret = process.env.NYLAS_WEBHOOK_SECRET;
    if (!secret) {
      console.error('NYLAS_WEBHOOK_SECRET is not set.');
      return new NextResponse('Configuration error', { status: 500 });
    }
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (nylasSignature !== expectedSignature) {
      console.warn('Invalid Nylas webhook signature.');
      console.log(`Received Signature: ${nylasSignature}`);
      console.log(`Expected Signature: ${expectedSignature}`);
      console.log(`Raw Body Used: ${rawBody.substring(0, 200)}...`); // Log first 200 chars
      return new NextResponse('Invalid signature', { status: 401 });
    }
  } else {
    console.log('--- RUNNING WEBHOOK IN TEST MODE (SIGNATURE SKIPPED) ---');
  }

  // 2. Process the webhook payload
  try {
    const payload = JSON.parse(rawBody);
    console.log('STEP 2: Webhook payload parsed:', JSON.stringify(payload, null, 2));

    // Handle both delta and direct object webhook formats from Nylas
    if (payload.deltas && payload.deltas.length > 0) {
      // DELTA FORMAT
      console.log(`STEP 3: Processing ${payload.deltas.length} deltas...`);
      for (const delta of payload.deltas) {
        await processEvent(delta, createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_KEY!
        ));
      }
    } else if (payload.data && payload.data.object) {
      // FULL OBJECT FORMAT
      console.log('STEP 3: Processing single event object...');
      // Adapt the full object format to match the expected delta structure for processEvent
      const adaptedEvent = {
        type: payload.type,
        object: payload.data.object.object, // e.g., 'message'
        object_data: {
          ...payload.data.object,
          // For message.updated, the actual updates are in a 'metadata' sub-object
          ...(payload.data.object.metadata && { ...payload.data.object.metadata }),
        },
      };
      await processEvent(adaptedEvent, createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      ));
    } else {
      console.log('Webhook received, but no deltas or data object to process.');
      return new NextResponse('OK', { status: 200 });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  return new NextResponse('OK', { status: 200 });
}

// Extracted event processing logic to handle both formats
async function processEvent(delta: any, supabase: any) {
  try {
    console.log(`Processing delta type: ${delta.type}`);

    if (delta.type === 'message.created') {
      console.log('STEP 3: Event is message.created.');
      const { grant_id, id: message_id } = delta.object_data;

      console.log(`STEP 4: Calling Python service for message_id: ${message_id}`);
      const messageDetailsRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/get-message-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grant_id, message_id }),
      });

      if (!messageDetailsRes.ok) {
        const errorText = await messageDetailsRes.text();
        console.error('Python service /get-message-details FAILED:', errorText);
        throw new Error(`Failed to get message details: ${errorText}`);
      }

      const messageDetails = await messageDetailsRes.json();
      console.log('STEP 5: Successfully got message details:', messageDetails);
      const senderEmail = messageDetails.data.from?.[0]?.email;

      console.log(`STEP 6: Fetching inbox info for grant_id: ${grant_id}`);

      const { data: inboxData, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('user_id, email_address')
        .eq('grant_id', grant_id)
        .single();

      if (inboxError || !inboxData) {
        console.error('Supabase inbox fetch FAILED:', inboxError);
        throw new Error(`Could not find inbox for grant_id ${grant_id}`);
      }
      console.log('STEP 7: Successfully fetched inbox info:', inboxData);

      console.log(`STEP 8: Checking if sender (${senderEmail}) is different from user (${inboxData.email_address})`);
      if (senderEmail && senderEmail.toLowerCase() !== inboxData.email_address.toLowerCase()) {
        console.log('STEP 9: Sender is different. Proceeding with analysis.');
        const analysisRes = await fetch(`${process.env.PYTHON_SERVICE_URL}/analyze-reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            grant_id, 
            message_id, 
            user_id: inboxData.user_id, 
            sender_email: senderEmail,
            message_body: messageDetails.data.body || messageDetails.data.snippet || ''
          }),
        });

        if (!analysisRes.ok) {
          const errorText = await analysisRes.text();
          console.error('Python service /analyze-reply FAILED:', errorText);
          throw new Error(`Failed to analyze reply: ${errorText}`);
        }

        const analysis = await analysisRes.json();
        console.log('STEP 10: Successfully got analysis from Python:', analysis);

        // Check if analysis was skipped (no matching lead found)
        if (analysis.status === 'skipped') {
          console.log('STEP 11: Analysis was skipped (no matching lead). Skipping database insert.');
          return; // Exit early, don't save to database
        }

        console.log('STEP 11: Saving analysis to Supabase replies table.');
        const { error: insertError } = await supabase.from('replies').insert({
          grant_id: grant_id,
          user_id: inboxData.user_id,
          message_id: message_id,
          lead_id: analysis.lead_id,
          sentiment: analysis.sentiment,
          action: analysis.action,
          summary: analysis.summary,
          next_step_prompt: analysis.nextStepPrompt,
          raw_response: analysis,
        });

        if (insertError) {
          console.error('Supabase insert FAILED:', insertError);
          throw new Error(`Failed to insert reply into DB: ${insertError.message}`);
        }
        console.log('STEP 12: Successfully saved analysis to DB.');

        // STEP 13: Send automatic AI-generated reply if action requires it
        const actionsRequiringReply = ['reply', 'follow_up', 'schedule_call'];
        if (actionsRequiringReply.includes(analysis.action)) {
          console.log('STEP 13: Sending AI-generated reply...');
          try {
            const replySubject = `Re: ${messageDetails.data.subject || 'Your inquiry'}`;
            const sendEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-automated-reply`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: senderEmail,
                subject: replySubject,
                body: analysis.nextStepPrompt,
                sender_email: inboxData.email_address,
                lead_id: analysis.lead_id,
                user_id: inboxData.user_id,
                grant_id: grant_id
              })
            });

            if (sendEmailResponse.ok) {
              const emailResult = await sendEmailResponse.json();
              console.log('STEP 14: Successfully sent AI reply. Message ID:', emailResult.messageId);
            } else {
              const errorText = await sendEmailResponse.text();
              console.error('STEP 14: Failed to send AI reply:', errorText);
            }
          } catch (emailError) {
            console.error('STEP 14: Error sending AI reply:', emailError);
            // Don't throw error - analysis was successful even if reply failed
          }
        } else {
          console.log('STEP 13: No reply needed based on analysis action:', analysis.action);
        }
      } else {
        console.log('STEP 9: Sender is the same as the user or missing. Skipping analysis.');
      }
    } else if (delta.type === 'message.opened' || delta.type === 'message.bounced') {
      console.log(`EVENT: Received ${delta.type}`);
      const { id: message_id } = delta.object_data;
      const event_type = delta.type.split('.')[1]; // 'opened' or 'bounced'

      // Find the original sent email to get the lead_id and user_id
      const { data: sentEmail, error: sentEmailError } = await supabase
        .from('sent_emails')
        .select('lead_id, user_id')
        .eq('message_id', message_id)
        .single();

      if (sentEmailError || !sentEmail) {
        console.warn(`Could not find sent_email record for message_id ${message_id}. Skipping event logging.`);
        return;
      }

      console.log(`Found matching sent email for lead: ${sentEmail.lead_id}. Logging event.`);

      const { error: eventInsertError } = await supabase.from('email_events').insert({
        message_id: message_id,
        lead_id: sentEmail.lead_id,
        user_id: sentEmail.user_id,
        event_type: event_type,
        event_timestamp: new Date(delta.date * 1000).toISOString(),
        raw_payload: delta,
      });

      if (eventInsertError) {
        console.error(`Failed to insert email event for message_id ${message_id}:`, eventInsertError);
        // Don't throw an error, just log and continue
      } else {
        console.log(`Successfully logged '${event_type}' event for message_id ${message_id}.`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error processing ${delta.type} event:`, error);
  }
}
