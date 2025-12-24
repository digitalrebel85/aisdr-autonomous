// API endpoint to create a campaign and generate personalized emails for leads
// This allows Research/Trial users to create campaigns without a connected inbox

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      sequenceId,
      sequenceName,
      sequenceDescription,
      leadIds,
      sequenceSteps,
      framework,
      objective,
      icpProfile,
      offer
    } = body;

    // Validate required fields
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }

    if (!sequenceSteps || !Array.isArray(sequenceSteps) || sequenceSteps.length === 0) {
      return NextResponse.json({ error: 'No sequence steps provided' }, { status: 400 });
    }

    // Get or create a default offer for the campaign
    let offerId: number;
    const { data: existingOffer } = await supabase
      .from('offers')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (existingOffer) {
      offerId = existingOffer.id;
    } else {
      // Create a default offer
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert({
          user_id: user.id,
          name: 'Default Offer',
          description: sequenceDescription || 'Generated campaign offer',
          value_proposition: 'Our solution helps you achieve your goals',
          call_to_action: 'Book a call'
        })
        .select()
        .single();
      
      if (offerError || !newOffer) {
        console.error('Offer creation error:', offerError);
        return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
      }
      offerId = newOffer.id;
    }

    // Create the campaign (status must be one of: queued, running, paused, completed, failed)
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .insert({
        user_id: user.id,
        name: sequenceName || 'New Campaign',
        offer_id: offerId,
        status: 'paused', // Use 'paused' instead of 'draft' - can be resumed when inbox connected
        total_leads: leadIds.length
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return NextResponse.json({ error: 'Failed to create campaign', details: campaignError.message }, { status: 500 });
    }

    // Fetch lead data for personalization
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', user.id);

    if (leadsError || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Generate emails for each lead and each step
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:8000';
    const generatedEmails: any[] = [];
    const errors: string[] = [];
    let aiServiceAvailable = true;

    // Check if Python service is available
    try {
      const healthCheck = await fetch(`${pythonServiceUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      aiServiceAvailable = healthCheck.ok;
    } catch {
      console.log('Python AI service not available, using template-based emails');
      aiServiceAvailable = false;
    }

    for (const lead of leads) {
      const enrichedData = lead.enriched_data || {};
      
      for (let stepIndex = 0; stepIndex < sequenceSteps.length; stepIndex++) {
        const step = sequenceSteps[stepIndex];
        const stepNumber = step.step_number || stepIndex + 1;
        const isFirstEmail = stepNumber === 1;

        try {
          let subject = '';
          let body = '';

          if (aiServiceAvailable) {
            // Determine endpoint based on step
            const endpoint = isFirstEmail 
              ? '/generate-cold-email'
              : '/generate-strategic-followup';

            // Prepare payload
            let pythonPayload;

            if (isFirstEmail) {
              pythonPayload = {
                name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email,
                title: lead.title || enrichedData.title || '',
                company: lead.company || '',
                email: lead.email,
                offer: offer?.value_proposition || sequenceDescription || 'Our solution',
                hook_snippet: `Using ${framework || 'AIDA'} framework for ${objective || 'meetings'}`,
                lead_context: JSON.stringify({
                  framework: framework || 'AIDA',
                  objective: objective || 'meetings',
                  icp_profile: icpProfile?.name,
                  industry: lead.industry || enrichedData.industry,
                  company_size: lead.company_size || enrichedData.company_size,
                  enriched_data: enrichedData
                }),
                pain_points: icpProfile?.pain_points?.join(', ') || enrichedData.pain_points?.join(', ') || ''
              };
            } else {
              pythonPayload = {
                lead_name: lead.first_name || lead.email.split('@')[0],
                lead_email: lead.email,
                company: lead.company || '',
                engagement_level: 'cold',
                follow_up_reason: 'no_reply_initial',
                follow_up_number: stepNumber,
                pain_points: icpProfile?.pain_points || enrichedData.pain_points || [],
                offer: offer?.value_proposition || sequenceDescription || 'Our solution',
                cta: offer?.call_to_action || `Book a ${objective || 'meeting'}`,
                previous_context: generatedEmails
                  .filter(e => e.lead_id === lead.id)
                  .map(e => e.subject)
                  .join(', ')
              };
            }

            // Call Python service
            const response = await fetch(`${pythonServiceUrl}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pythonPayload),
              signal: AbortSignal.timeout(30000) // 30 second timeout
            });

            if (response.ok) {
              const aiResult = await response.json();
              subject = aiResult.subject || aiResult.subject_line || '';
              body = aiResult.body || aiResult.email_body || '';
            } else {
              console.error(`AI generation failed for lead ${lead.id}, step ${stepNumber}`);
            }
          }

          // Fallback to template-based if AI didn't generate
          if (!subject || !body) {
            const firstName = lead.first_name || lead.email.split('@')[0];
            const company = lead.company || 'your company';
            
            if (isFirstEmail) {
              subject = step.subject_line || `Quick question for ${firstName}`;
              body = step.email_body_template || 
                `Hi ${firstName},\n\nI noticed ${company} and thought you might be interested in how we help similar companies.\n\nWould you be open to a quick chat?\n\nBest regards`;
            } else {
              subject = step.subject_line || `Following up - ${firstName}`;
              body = step.email_body_template || 
                `Hi ${firstName},\n\nJust wanted to follow up on my previous message.\n\nLet me know if you'd like to connect.\n\nBest regards`;
            }
          }

          generatedEmails.push({
            campaign_id: campaign.id,
            user_id: user.id,
            lead_id: lead.id,
            sequence_id: sequenceId ? parseInt(sequenceId) : null,
            step_number: stepNumber,
            subject,
            body,
            framework_used: framework || 'AIDA',
            ai_model: aiServiceAvailable ? 'crewai' : 'template',
            lead_snapshot: {
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              company: lead.company,
              title: lead.title,
              enriched_data: enrichedData
            },
            status: 'generated'
          });

        } catch (err) {
          console.error(`Error generating email for lead ${lead.id}, step ${stepNumber}:`, err);
          errors.push(`Lead ${lead.email} step ${stepNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }

    // Insert generated emails in batches
    let emailsInserted = 0;
    if (generatedEmails.length > 0) {
      console.log(`Inserting ${generatedEmails.length} generated emails for campaign ${campaign.id}`);
      const batchSize = 50;
      for (let i = 0; i < generatedEmails.length; i += batchSize) {
        const batch = generatedEmails.slice(i, i + batchSize);
        const { data: insertedData, error: insertError } = await supabase
          .from('campaign_generated_emails')
          .insert(batch)
          .select();

        if (insertError) {
          console.error('Error inserting generated emails:', insertError);
          console.error('Insert error details:', JSON.stringify(insertError, null, 2));
          // If table doesn't exist, log it clearly
          if (insertError.message?.includes('relation') && insertError.message?.includes('does not exist')) {
            errors.push('campaign_generated_emails table does not exist - please run migration');
          }
        } else {
          emailsInserted += insertedData?.length || batch.length;
        }
      }
      console.log(`Successfully inserted ${emailsInserted} emails`);
    }

    // Create sequence executions for tracking (status must be: active, completed, stopped, failed)
    const executions = leadIds.map((leadId: number) => ({
      user_id: user.id,
      lead_id: leadId,
      campaign_id: campaign.id,
      sequence_id: sequenceId ? parseInt(sequenceId) : null,
      sequence_type: 'initial',
      sequence_number: 1,
      status: 'active' // Will be paused at campaign level
    }));

    const { error: execError } = await supabase
      .from('sequence_executions')
      .insert(executions);
    
    if (execError) {
      console.error('Error creating sequence executions:', execError);
      // Continue anyway - campaign is created
    }

    // Update leads status
    await supabase
      .from('leads')
      .update({ lead_status: 'in_sequence' })
      .in('id', leadIds);

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        total_leads: leadIds.length
      },
      emails_generated: emailsInserted,
      emails_prepared: generatedEmails.length,
      total_expected: leadIds.length * sequenceSteps.length,
      ai_service_used: aiServiceAvailable,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error creating campaign with emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
