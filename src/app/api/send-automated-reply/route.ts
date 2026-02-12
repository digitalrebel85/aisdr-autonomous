import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { aiPersonalizationService } from '@/services/aiPersonalization';

export async function POST(request: NextRequest) {
  // Use service key for admin access (no user auth required for automated replies)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    // 1. Parse the request body
    const { to, subject, body, sender_email, lead_id, user_id, grant_id, reply_to_message_id, thread_id, original_email_content } = await request.json();
    if (!to || !sender_email || !lead_id || !user_id || !grant_id) {
      return new NextResponse(JSON.stringify({ 
        error: 'Missing required fields: to, sender_email, lead_id, user_id, grant_id' 
      }), { status: 400 });
    }

    console.log(`🤖 Generating AI-personalized reply for lead ${lead_id}`);

    // 2. Fetch lead data with persona information
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        personas (
          id, name, description, title_patterns, industries, 
          pain_points, messaging_hooks, tone, is_default
        )
      `)
      .eq('id', lead_id)
      .eq('user_id', user_id)
      .single();

    if (leadError || !leadData) {
      console.error('Error fetching lead data:', leadError);
      // Fallback to original behavior if lead data not found
    }

    // 3. Fetch user's offers
    const { data: offersData, error: offersError } = await supabase
      .from('offers')
      .select('id, name, value_proposition, call_to_action, hook_snippet')
      .eq('user_id', user_id)
      .limit(5); // Get top 5 offers

    if (offersError) {
      console.error('Error fetching offers:', offersError);
    }

    // 4. Generate AI-personalized content if we have the necessary data
    let personalizedSubject = subject;
    let personalizedBody = body;
    
    if (leadData && leadData.personas && offersData && offersData.length > 0) {
      try {
        const personalizationContext = {
          lead: {
            id: leadData.id,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            job_title: leadData.job_title,
            company: leadData.company,
            industry: leadData.industry,
            email_content: original_email_content
          },
          persona: leadData.personas,
          offers: offersData,
          emailContext: {
            subject: subject || '',
            originalContent: original_email_content || body || '',
            sentiment: leadData.sentiment,
            intent: leadData.ai_analysis?.intent
          }
        };

        const personalizedResponse = await aiPersonalizationService.generatePersonalizedReply(personalizationContext);
        
        personalizedSubject = personalizedResponse.subject;
        personalizedBody = personalizedResponse.body;
        
        console.log(`✨ AI Personalization applied - Score: ${personalizedResponse.personalizationScore}%`);
        console.log(`📧 Selected offer: ${personalizedResponse.selectedOffer?.name || 'None'}`);
        console.log(`🎯 Hooks: ${personalizedResponse.hooks.join(', ')}`);
        
      } catch (personalizationError) {
        console.error('AI personalization failed, using fallback:', personalizationError);
        // Continue with original subject/body if personalization fails
      }
    } else {
      console.log('⚠️ Missing persona or offers data, using original content');
    }

    console.log(`Sending automated reply with threading: reply_to=${reply_to_message_id}, thread_id=${thread_id}`);

    // 2. Construct and send the email using the Nylas API with the provided grant_id
    const nylasApiUrl = `https://api.us.nylas.com/v3/grants/${grant_id}/messages/send`;

    // 5. Build email payload with personalized content and proper threading support
    const emailPayload: any = {
      to: [{ email: to }],
      subject: personalizedSubject,
      body: personalizedBody,
      tracking: { opens: false, links: false, thread_replies: true },
    };

    // 2.2. Add threading information if available (for proper reply threading)
    if (reply_to_message_id) {
      emailPayload.reply_to_message_id = reply_to_message_id;
      console.log(`Adding reply_to_message_id: ${reply_to_message_id}`);
    }
    
    if (thread_id) {
      emailPayload.thread_id = thread_id;
      console.log(`Adding thread_id: ${thread_id}`);
    }

    console.log('Final email payload:', JSON.stringify(emailPayload, null, 2));

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
        // Add threading information for tracking
        reply_to_message_id: reply_to_message_id || null,
        thread_id: thread_id || null,
        campaign_type: 'automated_reply'
      });

    if (insertError) {
      console.error('Failed to log automated reply to DB:', insertError);
      // Don't fail the request - email was still sent
    }

    // CRITICAL FIX: Update the original reply to mark it as auto-replied
    console.log('Updating original reply to mark as auto-replied...');
    const { error: updateError } = await supabase
      .from('replies')
      .update({
        auto_reply_sent: true,
        auto_reply_sent_at: new Date().toISOString(),
        auto_reply_message_id: messageId
      })
      .eq('lead_id', lead_id)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Failed to update reply auto_reply_sent status:', updateError);
      // Don't fail the request - email was still sent
    } else {
      console.log('Successfully marked reply as auto-replied');
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
