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
      sequence_id, 
      step_number, 
      framework, 
      objective, 
      prompt,
      previous_emails 
    } = body;

    // Validate required fields
    if (!sequence_id || !step_number) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Fetch sequence details
    const { data: sequence, error: seqError } = await supabase
      .from('campaign_sequences')
      .select('*, icp_profiles(*)')
      .eq('id', sequence_id)
      .single();

    if (seqError || !sequence) {
      return NextResponse.json(
        { error: 'Sequence not found' }, 
        { status: 404 }
      );
    }

    // Determine which Python service endpoint to use
    const isFirstEmail = step_number === 1;
    const endpoint = isFirstEmail 
      ? '/generate-cold-email'
      : '/generate-strategic-followup';

    // Prepare request payload based on step type
    let pythonPayload;

    if (isFirstEmail) {
      // First email - use copywriter agent
      pythonPayload = {
        name: '{{first_name}} {{last_name}}',
        title: '{{title}}',
        company: '{{company}}',
        email: '{{email}}',
        offer: sequence.description || 'Our solution',
        hook_snippet: `Using ${framework} framework for ${objective}`,
        lead_context: JSON.stringify({
          framework,
          objective,
          icp_profile: sequence.icp_profiles?.name,
          sequence_name: sequence.name
        }),
        pain_points: sequence.icp_profiles?.pain_points?.join(', ') || ''
      };
    } else {
      // Follow-up email - use strategic follow-up agent
      pythonPayload = {
        lead_name: '{{first_name}}',
        lead_email: '{{email}}',
        company: '{{company}}',
        engagement_level: 'cold',
        follow_up_reason: 'no_reply_initial',
        follow_up_number: step_number,
        pain_points: sequence.icp_profiles?.pain_points || [],
        offer: sequence.description || 'Our solution',
        cta: `Book a ${objective}`,
        previous_context: previous_emails?.map((e: any) => e.subject).join(', ') || ''
      };
    }

    // Call Python CrewAI service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pythonPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python service error:', errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiResult = await response.json();

    // Return generated email
    return NextResponse.json({
      subject: aiResult.subject || aiResult.subject_line || '',
      body: aiResult.body || aiResult.email_body || '',
      framework_used: framework,
      step_number,
      metadata: {
        generated_at: new Date().toISOString(),
        ai_model: 'crewai',
        endpoint: endpoint
      }
    });

  } catch (error) {
    console.error('Error generating sequence email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
