import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
  if (!pythonServiceUrl) {
    console.error('PYTHON_SERVICE_URL is not set');
    return new NextResponse(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  try {
    const lead = await request.json();

    // Prepare comprehensive lead context for AI agent
    const leadContext = {
      // Basic lead info
      name: lead.name,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      title: lead.title,
      company: lead.company,
      company_domain: lead.company_domain,
      
      // Enriched data
      linkedin_url: lead.linkedin_url,
      phone: lead.phone,
      location: lead.location,
      industry: lead.industry,
      company_size: lead.company_size,
      pain_points: lead.pain_points,
      
      // Full enriched data from APIs
      enriched_data: lead.enriched_data,
      enrichment_status: lead.enrichment_status
    };

    const response = await fetch(`${pythonServiceUrl}/generate-cold-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Lead info
        name: lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        title: lead.title || '',
        company: lead.company,
        email: lead.email,
        
        // Offer & messaging
        offer: lead.offer || '',
        hook_snippet: lead.hook_snippet || '',
        pain_points: Array.isArray(lead.pain_points) 
          ? lead.pain_points.join(', ')
          : lead.pain_points || '',
        
        // Sequence context - CRITICAL for unique emails per step
        step_number: lead.step_number || 1,
        total_steps: lead.total_steps || 3,
        objective: lead.objective || 'meetings',
        framework: lead.framework || '',
        
        // Full lead context for AI
        lead_context: JSON.stringify(leadContext),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Python service:', errorData);
      return new NextResponse(JSON.stringify({ error: 'Failed to generate draft' }), { status: response.status });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: 200 });

  } catch (error) {
    console.error('Error calling Python service:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
