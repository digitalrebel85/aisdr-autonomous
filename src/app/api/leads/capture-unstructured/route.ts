import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * 🚀 AI-Powered Unstructured Lead Capture API
 * 
 * Transforms natural language input into structured lead data
 * Example: "Met Mike Jones from ABC Tech at trade show. Needs help with lead gen."
 * → Structured lead + Auto-enrichment + Personalized follow-up
 */

interface UnstructuredLeadInput {
  raw_text: string;
  source?: string;
  context?: {
    event?: string;
    location?: string;
    date?: string;
    urgency?: 'low' | 'medium' | 'high';
    follow_up_timing?: string;
  };
  user_notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UnstructuredLeadInput = await request.json();
    const { raw_text, source = 'unstructured_input', context = {}, user_notes = '' } = body;

    if (!raw_text?.trim()) {
      return NextResponse.json({ error: 'Raw text is required' }, { status: 400 });
    }

    // Step 1: Send to AI agent for structured extraction
    console.log('🤖 Processing unstructured lead data with AI...');
    
    const aiResponse = await fetch(`${process.env.PYTHON_SERVICE_URL}/process-unstructured-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw_data: raw_text,
        metadata: {
          source,
          context,
          user_notes,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI processing failed: ${aiResponse.statusText}`);
    }

    const processedLead = await aiResponse.json();
    console.log('✅ AI extracted structured data:', processedLead);

    // Step 2: Prepare lead data for database
    const leadData = {
      user_id: user.id,
      
      // Core fields from AI extraction
      first_name: processedLead.first_name,
      last_name: processedLead.last_name,
      name: processedLead.full_name || `${processedLead.first_name || ''} ${processedLead.last_name || ''}`.trim(),
      email: processedLead.email,
      phone: processedLead.phone,
      title: processedLead.title,
      company: processedLead.company,
      company_domain: processedLead.company_domain,
      location: processedLead.location,
      industry: processedLead.industry,
      company_size: processedLead.company_size,
      linkedin_url: processedLead.linkedin_url,
      
      // Default values
      offer: 'To be customized based on conversation',
      cta: 'Would you like to schedule a brief call to discuss this further?',
      enrichment_status: 'pending',
      
      // Store all AI-extracted data in enriched_data
      enriched_data: {
        unstructured_capture: {
          source: 'unstructured_input',
          timestamp: new Date().toISOString(),
          raw_input: raw_text,
          context: context,
          user_notes: user_notes,
          ai_extracted: {
            pain_points: processedLead.pain_points || [],
            interests: processedLead.interests || [],
            lead_temperature: processedLead.lead_temperature || 'warm',
            tech_stack: processedLead.tech_stack || [],
            funding_stage: processedLead.funding_stage,
            business_context: processedLead.business_context || {},
            email_context: processedLead.email_context || {},
            confidence_score: processedLead.confidence_score || 0.0,
            extracted_fields: processedLead.extracted_fields || [],
            missing_fields: processedLead.missing_fields || [],
            processing_notes: processedLead.processing_notes || []
          }
        }
      }
    };

    // Step 3: Insert lead into database
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
    }

    console.log('✅ Lead saved to database:', insertedLead.id);

    // Step 4: Auto-trigger enrichment if we have enough data
    let enrichmentTriggered = false;
    if (insertedLead.email || (insertedLead.company && insertedLead.name)) {
      try {
        console.log('🔍 Triggering auto-enrichment...');
        
        const enrichResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/enrich-lead`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            leadId: insertedLead.id
          }),
        });

        if (enrichResponse.ok) {
          enrichmentTriggered = true;
          console.log('✅ Auto-enrichment triggered successfully');
        }
      } catch (enrichError) {
        console.log('⚠️ Auto-enrichment failed, but lead was saved:', enrichError);
      }
    }

    // Step 5: Generate follow-up suggestions
    const followUpSuggestions = generateFollowUpSuggestions(processedLead, context);

    return NextResponse.json({
      success: true,
      lead: insertedLead,
      ai_extraction: {
        confidence_score: processedLead.confidence_score,
        extracted_fields: processedLead.extracted_fields,
        missing_fields: processedLead.missing_fields,
        processing_notes: processedLead.processing_notes
      },
      enrichment_triggered: enrichmentTriggered,
      follow_up_suggestions: followUpSuggestions,
      next_steps: [
        enrichmentTriggered ? 'Enrichment in progress' : 'Consider manual enrichment',
        'Review and customize offer/CTA',
        'Schedule follow-up based on context',
        'Generate personalized email when ready'
      ]
    });

  } catch (error) {
    console.error('Unstructured lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process unstructured lead data' },
      { status: 500 }
    );
  }
}

function generateFollowUpSuggestions(processedLead: any, context: any) {
  const suggestions = [];
  
  // Timing suggestions based on context
  if (context.urgency === 'high') {
    suggestions.push('Follow up within 24 hours - high urgency indicated');
  } else if (context.event?.toLowerCase().includes('trade show') || context.event?.toLowerCase().includes('conference')) {
    suggestions.push('Follow up within 2-3 days while event is fresh in memory');
  } else if (processedLead.lead_temperature === 'hot') {
    suggestions.push('Follow up within 1-2 days - hot lead detected');
  } else {
    suggestions.push('Follow up within 1 week');
  }
  
  // Content suggestions based on pain points
  if (processedLead.pain_points?.length > 0) {
    suggestions.push(`Reference specific pain points: ${processedLead.pain_points.join(', ')}`);
  }
  
  // Context-specific suggestions
  if (context.event) {
    suggestions.push(`Mention meeting at ${context.event} for personal connection`);
  }
  
  if (processedLead.interests?.length > 0) {
    suggestions.push(`Align with their interests: ${processedLead.interests.join(', ')}`);
  }
  
  return suggestions;
}
