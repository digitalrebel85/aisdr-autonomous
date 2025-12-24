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

    // Extract offer data if provided
    const offer = lead.offer_data || {};
    
    // Combine pain points from offer AND lead (offer pain points take priority for R.P.I.C)
    const offerPainPoints = Array.isArray(offer?.pain_points) ? offer.pain_points : [];
    const leadPainPoints = Array.isArray(lead?.pain_points) ? lead.pain_points : [];
    const combinedPainPoints = [...offerPainPoints, ...leadPainPoints].filter(Boolean);

    // Get proof points from offer for credible use cases
    const proofPoints = Array.isArray(offer?.proof_points) ? offer.proof_points : [];
    
    // Get benefits from offer
    const benefits = Array.isArray(offer?.benefits) ? offer.benefits : [];
    
    // Get sales assets/lead magnets from offer
    const salesAssets = Array.isArray(offer?.sales_assets) ? offer.sales_assets : [];

    // Prepare comprehensive lead context for AI agent with R.P.I.C data
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
      
      // Full enriched data from APIs
      enriched_data: lead.enriched_data,
      enrichment_status: lead.enrichment_status,
      
      // Offer data for R.P.I.C framework
      offer_name: offer?.name || lead.offer_name,
      offer_value_proposition: offer?.value_proposition || lead.offer,
      offer_call_to_action: offer?.call_to_action || lead.cta,
      
      // Pain points for Role Reality
      offer_pain_points: offerPainPoints,
      lead_pain_points: leadPainPoints,
      
      // Proof points for Credible Use Case
      proof_points: proofPoints,
      
      // Benefits for Intervention
      benefits: benefits,
      
      // Sales assets for value adds
      sales_assets: salesAssets,
      
      // Company description for context
      company_description: offer?.company_description,
      
      // Excluded terms to avoid
      excluded_terms: offer?.excluded_terms
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
        offer: offer?.value_proposition || lead.offer || '',
        hook_snippet: offer?.hook_snippet || lead.hook_snippet || '',
        
        // Pass combined pain points for R.P.I.C Role Reality
        pain_points: combinedPainPoints.join(', '),
        
        // Sequence context - CRITICAL for unique emails per step
        step_number: lead.step_number || 1,
        total_steps: lead.total_steps || 3,
        objective: lead.objective || 'meetings',
        framework: lead.framework || '',
        
        // Full lead context for AI with R.P.I.C data
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
