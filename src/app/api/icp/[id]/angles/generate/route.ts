import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST - Generate AI-suggested angles for an ICP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: icpId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the ICP profile with all details
    const { data: icp, error: icpError } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('id', icpId)
      .eq('user_id', user.id)
      .single();

    if (icpError || !icp) {
      return NextResponse.json({ error: 'ICP not found' }, { status: 404 });
    }

    const body = await request.json();
    const numberOfAngles = body.count || 3;
    const offer = body.offer || null;

    // Call Python CrewAI service to generate angles
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || process.env.CREW_SERVICE_URL || 'http://localhost:8000';
    
    const aiResponse = await fetch(`${pythonServiceUrl}/generate-angles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        icp_profile: {
          name: icp.name,
          description: icp.description,
          industries: icp.industries || [],
          company_sizes: icp.company_sizes || [],
          job_titles: icp.job_titles || [],
          seniority_levels: icp.seniority_levels || [],
          departments: icp.departments || [],
          technologies: icp.technologies || [],
          pain_points: icp.pain_points || [],
          keywords: icp.keywords || [],
          locations: icp.contact_locations || icp.locations || []
        },
        // Pass offer context for the AI to use
        offer: offer ? {
          name: offer.name,
          product_service_name: offer.product_service_name,
          value_proposition: offer.value_proposition,
          company_description: offer.company_description,
          pain_points: offer.pain_points || [],
          benefits: offer.benefits || [],
          proof_points: offer.proof_points || [],
          call_to_action: offer.call_to_action
        } : null,
        number_of_angles: numberOfAngles,
        existing_angles: body.existing_angles || []
      })
    });

    if (!aiResponse.ok) {
      console.error('AI service error:', await aiResponse.text());
      // Fallback to rule-based generation if AI service fails
      const fallbackAngles = generateFallbackAngles(icp, numberOfAngles);
      return NextResponse.json({ 
        angles: fallbackAngles,
        source: 'fallback'
      });
    }

    const aiData = await aiResponse.json();
    
    return NextResponse.json({ 
      angles: aiData.angles || [],
      source: 'ai'
    });

  } catch (error) {
    console.error('Error generating angles:', error);
    return NextResponse.json({ error: 'Failed to generate angles' }, { status: 500 });
  }
}

// Fallback angle generation when AI service is unavailable
function generateFallbackAngles(icp: any, count: number): any[] {
  const angles = [];
  
  // Common B2B angle templates
  const angleTemplates = [
    {
      name: 'Time Savings',
      description: 'Focus on efficiency and time saved',
      value_proposition: `Help ${icp.job_titles?.[0] || 'professionals'} save hours every week by automating repetitive tasks.`,
      pain_points: ['Manual processes are time-consuming', 'Too much time on admin work', 'Need to focus on strategic work'],
      hooks: [
        'What if you could get back 10+ hours every week?',
        'Imagine finishing your prospecting before your first coffee',
        'Your competitors are already automating this...'
      ],
      proof_points: ['Customers save 25+ hours/week on average', '3x productivity improvement'],
      tone: 'professional'
    },
    {
      name: 'Revenue Growth',
      description: 'Focus on increasing revenue and pipeline',
      value_proposition: `Help ${icp.company_sizes?.[0] || ''} companies in ${icp.industries?.[0] || 'your industry'} generate more qualified pipeline.`,
      pain_points: ['Pipeline is inconsistent', 'Not enough qualified leads', 'Sales team is stretched thin'],
      hooks: [
        'What would 3x more demos mean for your quarter?',
        'Your pipeline doesn\'t have to be a rollercoaster',
        'The best sales teams have one thing in common...'
      ],
      proof_points: ['Average 40% increase in qualified meetings', 'ROI positive within 30 days'],
      tone: 'professional'
    },
    {
      name: 'Competitive Edge',
      description: 'Focus on staying ahead of competition',
      value_proposition: `Give your team the same AI-powered advantage that top ${icp.industries?.[0] || 'industry'} companies are using.`,
      pain_points: ['Competitors are moving faster', 'Falling behind on technology', 'Need to modernize approach'],
      hooks: [
        'Your competitors are already using AI for this...',
        'The gap between leaders and laggards is widening',
        'In 2 years, this will be table stakes'
      ],
      proof_points: ['Used by leading companies in your space', 'Early adopters see 2x better results'],
      tone: 'challenger'
    },
    {
      name: 'Cost Reduction',
      description: 'Focus on reducing costs and improving efficiency',
      value_proposition: `Reduce your cost per meeting by 60% while maintaining quality.`,
      pain_points: ['SDR costs are too high', 'Cost per lead is unsustainable', 'Need to do more with less'],
      hooks: [
        'What if you could cut your SDR costs in half?',
        'The math on traditional SDRs doesn\'t work anymore',
        'There\'s a better way to scale outbound'
      ],
      proof_points: ['60% reduction in cost per meeting', 'No need to hire additional SDRs'],
      tone: 'consultative'
    },
    {
      name: 'Quality Over Quantity',
      description: 'Focus on better targeting and personalization',
      value_proposition: `Stop spraying and praying. Reach the right ${icp.job_titles?.[0] || 'prospects'} with messages that actually resonate.`,
      pain_points: ['Low response rates', 'Generic outreach doesn\'t work', 'Wasting time on wrong prospects'],
      hooks: [
        'What if every email you sent was actually relevant?',
        'The era of mass email blasts is over',
        'Your prospects can smell a template from a mile away'
      ],
      proof_points: ['3x higher response rates than industry average', 'AI personalization at scale'],
      tone: 'consultative'
    }
  ];

  // Select angles based on count
  for (let i = 0; i < Math.min(count, angleTemplates.length); i++) {
    angles.push(angleTemplates[i]);
  }

  return angles;
}
