import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the tools the agent can use
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_icp_profiles',
      description: 'Fetch all active ICP (Ideal Customer Profile) profiles. Use this to see what targeting profiles are available.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_offers',
      description: 'Fetch all available offers/value propositions. Use this to see what offers can be attached to a campaign.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_leads',
      description: 'Fetch leads from the database with optional filters. Returns lead details including name, email, company, ICP score, and status.',
      parameters: {
        type: 'object',
        properties: {
          min_icp_score: { type: 'number', description: 'Minimum ICP score filter (0-100)' },
          enrichment_status: { type: 'string', enum: ['completed', 'pending', 'enriching'], description: 'Filter by enrichment status' },
          limit: { type: 'number', description: 'Maximum number of leads to return (default 50)' },
          company_filter: { type: 'string', description: 'Filter leads by company name (partial match)' },
          industry_filter: { type: 'string', description: 'Filter leads by industry (partial match)' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_campaign_history',
      description: 'Fetch recent campaign history and performance stats to inform strategy decisions.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a complete campaign with the specified configuration. Only call this when you have confirmed all details with the user.',
      parameters: {
        type: 'object',
        properties: {
          campaign_name: { type: 'string', description: 'Name for the campaign' },
          objective: { type: 'string', enum: ['meetings', 'demos', 'trials', 'sales', 'awareness'], description: 'Campaign objective' },
          icp_profile_id: { type: 'number', description: 'ID of the ICP profile to target' },
          offer_id: { type: 'number', description: 'ID of the offer to use' },
          lead_ids: { type: 'array', items: { type: 'number' }, description: 'Array of lead IDs to include' },
          framework: { type: 'string', enum: ['AIDA', 'PAS', 'BAB', '4Ps', 'FAB'], description: 'Messaging framework' },
          num_touches: { type: 'number', description: 'Number of email touches in the sequence (2-7)' },
          target_persona: { type: 'string', description: 'Description of the target persona' }
        },
        required: ['campaign_name', 'objective', 'lead_ids', 'framework', 'num_touches']
      }
    }
  }
];

// Tool execution functions
async function executeGetIcpProfiles(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('icp_profiles')
    .select('id, name, description, leads_scored, status, industries, company_sizes, job_titles')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) return { error: error.message };
  return { profiles: data || [], count: data?.length || 0 };
}

async function executeGetOffers(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('offers')
    .select('id, name, description, value_proposition, call_to_action, hook_snippet')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) return { error: error.message };
  return { offers: data || [], count: data?.length || 0 };
}

async function executeGetLeads(supabase: any, userId: string, params: any) {
  let query = supabase
    .from('leads')
    .select('id, first_name, last_name, email, company, title, icp_score, lead_status, enrichment_status, industry, location')
    .eq('user_id', userId)
    .order('icp_score', { ascending: false });

  if (params.min_icp_score) {
    query = query.gte('icp_score', params.min_icp_score);
  }
  if (params.enrichment_status) {
    query = query.eq('enrichment_status', params.enrichment_status);
  }
  if (params.company_filter) {
    query = query.ilike('company', `%${params.company_filter}%`);
  }
  if (params.industry_filter) {
    query = query.ilike('industry', `%${params.industry_filter}%`);
  }

  // Exclude leads that shouldn't be contacted
  query = query.not('lead_status', 'in', '("unsubscribed","spam_reported","do_not_contact","bounced")');

  const limit = params.limit || 50;
  query = query.limit(limit);

  const { data, error } = await query;
  if (error) return { error: error.message };

  // Get total count for context
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('lead_status', 'in', '("unsubscribed","spam_reported","do_not_contact","bounced")');

  return {
    leads: data || [],
    returned: data?.length || 0,
    total_eligible: count || 0
  };
}

async function executeGetCampaignHistory(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('outreach_campaigns')
    .select('id, name, objective, status, total_leads, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return { error: error.message };
  return { campaigns: data || [], count: data?.length || 0 };
}

async function executeCreateCampaign(supabase: any, userId: string, params: any) {
  try {
    // Step 1: Create campaign sequence
    const { data: sequence, error: seqError } = await supabase
      .from('campaign_sequences')
      .insert({
        user_id: userId,
        name: `${params.campaign_name} - Sequence`,
        description: `AI Agent created sequence for ${params.objective}`,
        objective: params.objective,
        icp_profile_id: params.icp_profile_id || null,
        offer_id: params.offer_id || null,
        messaging_framework: params.framework,
        total_touches: params.num_touches,
        status: 'active'
      })
      .select()
      .single();

    if (seqError) return { error: `Failed to create sequence: ${seqError.message}` };

    // Step 2: Create the campaign
    const { data: campaign, error: campError } = await supabase
      .from('outreach_campaigns')
      .insert({
        user_id: userId,
        name: params.campaign_name,
        objective: params.objective,
        sequence_id: sequence.id,
        status: 'active',
        total_leads: params.lead_ids.length
      })
      .select()
      .single();

    if (campError) return { error: `Failed to create campaign: ${campError.message}` };

    return {
      success: true,
      campaign_id: campaign.id,
      campaign_name: params.campaign_name,
      sequence_id: sequence.id,
      leads_count: params.lead_ids.length,
      framework: params.framework,
      touches: params.num_touches,
      objective: params.objective,
      url: `/dashboard/campaigns/${campaign.id}`
    };
  } catch (err: any) {
    return { error: `Campaign creation failed: ${err.message}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Build system prompt
    const systemPrompt = `You are an autonomous AI SDR Campaign Agent. You help users create outreach campaigns through natural conversation. You have access to tools that let you look up their data and create campaigns.

Your workflow:
1. Understand what the user wants to achieve (objective, target audience, messaging approach)
2. Use your tools to fetch their available ICPs, offers, and leads
3. Make smart recommendations based on their data
4. Confirm the plan with the user before creating anything
5. Create the campaign when they approve

Key behaviors:
- Be conversational and proactive — suggest things, don't just ask questions
- When you fetch data, summarize it concisely and make recommendations
- If the user is vague, make smart assumptions based on their data and explain your reasoning
- Always confirm before calling create_campaign — show them a summary first
- Use markdown formatting for readability (bold, lists, etc.)
- Keep responses focused and actionable — you're a sales expert, not a chatbot

Available messaging frameworks:
- AIDA: Attention → Interest → Desire → Action (best for cold outreach)
- PAS: Problem → Agitate → Solution (best for pain-point selling)
- BAB: Before → After → Bridge (best for transformation stories)
- 4Ps: Picture → Promise → Prove → Push (best for aspirational selling)
- FAB: Features → Advantages → Benefits (best for product-led)

Campaign objectives: meetings, demos, trials, sales, awareness

When recommending leads, prioritize by ICP score (higher is better) and enrichment status (completed is best).
When you present a campaign plan for confirmation, format it clearly with all key details.`;

    // Build messages
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-20);
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: message });

    // Run the agent loop (handle multiple tool calls)
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
    });

    let assistantMessage = response.choices[0]?.message;
    const toolCallResults: any[] = [];
    let iterations = 0;
    const maxIterations = 5;

    // Agent loop: keep processing tool calls until we get a text response
    while (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++;

      // Add assistant message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');

        let result: any;
        switch (functionName) {
          case 'get_icp_profiles':
            result = await executeGetIcpProfiles(supabase, userId);
            break;
          case 'get_offers':
            result = await executeGetOffers(supabase, userId);
            break;
          case 'get_leads':
            result = await executeGetLeads(supabase, userId, args);
            break;
          case 'get_campaign_history':
            result = await executeGetCampaignHistory(supabase, userId);
            break;
          case 'create_campaign':
            result = await executeCreateCampaign(supabase, userId, args);
            break;
          default:
            result = { error: `Unknown function: ${functionName}` };
        }

        toolCallResults.push({
          function: functionName,
          args,
          result
        });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500,
      });

      assistantMessage = response.choices[0]?.message;
    }

    const textResponse = assistantMessage?.content || 'I encountered an issue processing your request. Please try again.';

    // Check if a campaign was created
    const campaignCreated = toolCallResults.find(
      r => r.function === 'create_campaign' && r.result?.success
    );

    return NextResponse.json({
      response: textResponse,
      toolCalls: toolCallResults,
      campaignCreated: campaignCreated?.result || null
    });

  } catch (error) {
    console.error('Campaign Agent API Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
