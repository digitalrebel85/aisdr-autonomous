import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { aiPersonalizationService } from '@/services/aiPersonalization';
import { dynamicAIPersonalizationService } from '@/services/dynamicAIPersonalization';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    const body = await request.json();
    const { 
      lead_id, 
      user_id, 
      original_email_content, 
      personalization_mode = 'dynamic', // 'persona' | 'dynamic' | 'hybrid'
      force_offer_id = null 
    } = body;

    if (!lead_id || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: lead_id, user_id' 
      }, { status: 400 });
    }

    console.log(`🎯 AI Personalization Mode: ${personalization_mode}`);

    // Fetch lead data
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
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch offers
    let offersQuery = supabase
      .from('offers')
      .select('id, name, value_proposition, call_to_action, hook_snippet')
      .eq('user_id', user_id);

    if (force_offer_id) {
      offersQuery = offersQuery.eq('id', force_offer_id);
    }

    const { data: offersData, error: offersError } = await offersQuery.limit(5);

    if (offersError) {
      console.error('Error fetching offers:', offersError);
    }

    let result;

    switch (personalization_mode) {
      case 'dynamic':
        // Fully AI-generated personalization - no personas required
        console.log('🧠 Using Dynamic AI Personalization');
        result = await dynamicAIPersonalizationService.generateDynamicPersonalization(
          {
            id: leadData.id,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            job_title: leadData.job_title,
            company: leadData.company,
            industry: leadData.industry,
            company_size: leadData.company_size,
            email_content: original_email_content
          },
          offersData || [],
          {
            originalContent: original_email_content || '',
            sentiment: leadData.sentiment,
            intent: leadData.ai_analysis?.intent
          }
        );
        break;

      case 'persona':
        // Persona-based personalization (existing system)
        if (!leadData.personas) {
          return NextResponse.json({ 
            error: 'No persona assigned to this lead. Use dynamic mode or assign a persona first.' 
          }, { status: 400 });
        }
        
        console.log('👤 Using Persona-Based Personalization');
        const personaResult = await aiPersonalizationService.generatePersonalizedReply({
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
          offers: offersData || [],
          emailContext: {
            subject: '',
            originalContent: original_email_content || '',
            sentiment: leadData.sentiment,
            intent: leadData.ai_analysis?.intent
          }
        });

        result = {
          painPoints: leadData.personas.pain_points,
          personalizationHooks: personaResult.hooks,
          messageAngles: personaResult.angles,
          emotionalTriggers: personaResult.triggers.filter((t: string) => 
            t.toLowerCase().includes('advantage') || t.toLowerCase().includes('behind')
          ),
          logicalTriggers: personaResult.triggers.filter((t: string) => 
            t.toLowerCase().includes('roi') || t.toLowerCase().includes('%')
          ),
          selectedOffer: personaResult.selectedOffer,
          personalizationScore: personaResult.personalizationScore,
          generatedEmail: {
            subject: personaResult.subject,
            body: personaResult.body
          }
        };
        break;

      case 'hybrid':
        // Use persona as foundation, enhance with AI
        console.log('🔄 Using Hybrid Personalization');
        
        // First get dynamic AI insights
        const dynamicInsights = await dynamicAIPersonalizationService.generateDynamicPersonalization(
          {
            id: leadData.id,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            job_title: leadData.job_title,
            company: leadData.company,
            industry: leadData.industry,
            company_size: leadData.company_size,
            email_content: original_email_content
          },
          offersData || [],
          {
            originalContent: original_email_content || '',
            sentiment: leadData.sentiment,
            intent: leadData.ai_analysis?.intent
          }
        );

        // Combine with persona data if available
        const hybridPainPoints = leadData.personas ? 
          [...leadData.personas.pain_points, ...dynamicInsights.painPoints].slice(0, 4) :
          dynamicInsights.painPoints;

        const hybridHooks = leadData.personas ?
          [...leadData.personas.messaging_hooks, ...dynamicInsights.personalizationHooks].slice(0, 4) :
          dynamicInsights.personalizationHooks;

        result = {
          ...dynamicInsights,
          painPoints: [...new Set(hybridPainPoints)], // Remove duplicates
          personalizationHooks: [...new Set(hybridHooks)],
          personalizationScore: Math.min(dynamicInsights.personalizationScore + 10, 100) // Bonus for hybrid
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid personalization_mode' }, { status: 400 });
    }

    // Log the personalization results
    console.log(`✨ Personalization Complete:`);
    console.log(`📊 Score: ${result.personalizationScore}%`);
    console.log(`🎯 Pain Points: ${result.painPoints?.slice(0, 2).join(', ')}`);
    console.log(`🪝 Hooks: ${result.personalizationHooks?.slice(0, 2).join(', ')}`);
    console.log(`📧 Selected Offer: ${result.selectedOffer?.name || 'None'}`);

    return NextResponse.json({
      success: true,
      mode: personalization_mode,
      lead: {
        id: leadData.id,
        name: `${leadData.first_name} ${leadData.last_name}`,
        company: leadData.company,
        title: leadData.job_title
      },
      personalization: result
    });

  } catch (error) {
    console.error('AI Personalization API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
