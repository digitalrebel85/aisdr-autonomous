import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user's data for context
    const userId = session.user.id;
    
    // Fetch user's campaign stats
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId);

    const { data: replies, error: repliesError } = await supabase
      .from('replies')
      .select('*')
      .eq('user_id', userId);

    const { data: offers, error: offersError } = await supabase
      .from('offers')
      .select('*')
      .eq('user_id', userId);

    // Build context for the AI
    const context = {
      totalLeads: leads?.length || 0,
      enrichedLeads: leads?.filter((l: any) => l.enrichment_status === 'completed').length || 0,
      totalReplies: replies?.length || 0,
      positiveReplies: replies?.filter((r: any) => r.sentiment === 'interested' || r.sentiment === 'positive').length || 0,
      activeOffers: offers?.length || 0,
      recentLeads: leads?.slice(0, 5) || [],
      recentReplies: replies?.slice(0, 5) || [],
    };

    // Create system prompt
    const systemPrompt = `You are an AI SDR Copilot, an expert assistant for sales development representatives. You help users analyze their campaigns, find leads, optimize outreach, and make data-driven decisions.

Current User Context:
- Total Leads: ${context.totalLeads}
- Enriched Leads: ${context.enrichedLeads}
- Total Replies: ${context.totalReplies}
- Positive Replies: ${context.positiveReplies}
- Active Offers: ${context.activeOffers}

Your capabilities:
1. Analyze campaign performance and provide insights
2. Suggest lead research strategies
3. Recommend outreach optimizations
4. Answer questions about the user's data
5. Provide actionable next steps

Be concise, friendly, and actionable. Use data to support your recommendations. When appropriate, suggest specific actions the user can take.`;

    // Build messages array for OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limit to last 10 messages to save tokens)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Copilot API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

