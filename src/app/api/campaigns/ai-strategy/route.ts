import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// AI Strategy Recommendation Engine
// Analyzes campaign objective and ICP to recommend framework and sequence

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      objective,
      icp_profile_id,
      target_persona,
      campaign_name,
      offer
    } = body;

    if (!objective) {
      return NextResponse.json({ error: 'Objective is required' }, { status: 400 });
    }

    // Get ICP profile data if provided
    let icpData = null;
    if (icp_profile_id) {
      const { data: icp } = await supabase
        .from('icp_profiles')
        .select('*')
        .eq('id', icp_profile_id)
        .eq('user_id', user.id)
        .single();
      
      icpData = icp;
    }

    // Call Python CrewAI service for real AI analysis
    const aiAnalysis = await callPythonAIService({
      objective,
      icp_data: icpData,
      target_persona,
      campaign_name,
      offer
    });

    // AI Decision Logic for Framework Selection
    const frameworkRecommendation = recommendFramework(objective, icpData, aiAnalysis);
    
    // AI Decision Logic for Sequence Length
    const sequenceRecommendation = recommendSequence(objective, icpData, aiAnalysis);

    return NextResponse.json({
      success: true,
      recommendations: {
        framework: frameworkRecommendation,
        sequence: sequenceRecommendation,
        insights: aiAnalysis.insights
      }
    });

  } catch (error) {
    console.error('Error in AI strategy:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============================================================================
// PYTHON CREWAI SERVICE INTEGRATION
// ============================================================================

async function callPythonAIService(params: {
  objective: string;
  icp_data: any;
  target_persona: string;
  campaign_name: string;
  offer: any;
}) {
  const { objective, icp_data, target_persona, campaign_name, offer } = params;

  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    // Prepare payload for Python AI service
    const payload = {
      campaign_name,
      objective,
      target_persona: target_persona || 'decision makers',
      icp_profile: icp_data ? {
        name: icp_data.name,
        description: icp_data.description,
        pain_points: icp_data.pain_points || [],
        industries: icp_data.industries || [],
        company_size: `${icp_data.employee_count_min || 0}-${icp_data.employee_count_max || 'unlimited'}`,
        job_titles: icp_data.job_titles || []
      } : null,
      offer: offer ? {
        name: offer.name,
        description: offer.description,
        value_proposition: offer.value_proposition,
        call_to_action: offer.call_to_action,
        sales_assets: offer.sales_assets || [],  // Lead magnets
        proof_points: offer.proof_points || [],  // Social proof
        pain_points: offer.pain_points || [],
        benefits: offer.benefits || []
      } : null
    };

    const response = await fetch(`${pythonServiceUrl}/analyze-campaign-strategy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Python AI service error:', response.status);
      // Fallback to basic analysis if AI service fails
      return generateFallbackAnalysis(params);
    }

    const aiResult = await response.json();
    return aiResult;

  } catch (error) {
    console.error('Error calling Python AI service:', error);
    // Fallback to basic analysis
    return generateFallbackAnalysis(params);
  }
}

function generateFallbackAnalysis(params: {
  objective: string;
  icp_data: any;
  target_persona: string;
  offer: any;
}) {
  const { objective, icp_data, target_persona, offer } = params;
  
  // Extract pain points from ICP profile if available
  const painPoints = icp_data?.pain_points || [
    'Inefficient processes costing time and money',
    'Lack of visibility into key metrics',
    'Difficulty scaling operations',
    'Manual workflows prone to errors'
  ];

  // Extract benefits from offer if available
  const benefits = offer ? [
    offer.value_proposition,
    ...(offer.benefits || []),
    'Proven results with similar companies',
    'Quick implementation with minimal disruption'
  ].slice(0, 4) : [
    'Streamline operations and boost efficiency',
    'Gain real-time insights and visibility',
    'Scale confidently with automated workflows'
  ];
  
  // Extract proof points (social proof)
  const proofPoints = offer?.proof_points || [
    'Proven ROI with similar companies',
    'Case studies available',
    '5000+ satisfied customers'
  ];
  
  // Extract lead magnets (value offers)
  const leadMagnets = offer?.sales_assets || [
    'Free consultation',
    'Industry whitepaper',
    'Product demo'
  ];

  return {
    insights: {
      painPoints,
      valuePropositions: benefits,
      proofPoints,
      leadMagnets,
      competitiveInsights: {
        commonAlternatives: ['Status quo', 'In-house solution', 'Competitor tools'],
        differentiators: [
          'Faster time to value',
          'Better customer support',
          'More intuitive interface',
          ...proofPoints.slice(0, 2)
        ].slice(0, 5)
      },
      triggerEvents: [
        'Recent funding announcement',
        'New executive hire',
        'Technology stack changes',
        'Company growth milestones'
      ],
      bestPractices: [
        `For ${objective}: Personalize first line with specific company insight`,
        'Keep emails under 150 words for best response rates',
        'Include social proof (customer logos, testimonials)',
        'Clear single CTA - don\'t give multiple options',
        'Send during business hours in recipient timezone'
      ],
      messagingHooks: offer ? [
        `Lead with: "${offer.value_proposition}"`,
        `Emphasize: ${painPoints[0]}`,
        proofPoints.length > 0 ? `Use proof: ${proofPoints[0]}` : 'Show tangible results',
        leadMagnets.length > 0 ? `Offer value: ${leadMagnets[0]}` : `Close with: ${offer.call_to_action}`
      ].slice(0, 4) : [
        'Lead with a relevant pain point',
        'Show quick wins and ROI',
        'Make the next step crystal clear'
      ]
    }
  };
}

// ============================================================================
// AI RECOMMENDATION LOGIC
// ============================================================================

function recommendFramework(objective: string, icpData: any, aiAnalysis: any) {
  const frameworks = {
    meetings: {
      primary: 'PAS',
      reasoning: 'PAS (Problem-Agitate-Solution) works best for booking meetings because it quickly identifies pain points and positions you as the solution.',
      alternative: 'AIDA',
      touchPoints: {
        1: 'Problem identification',
        2: 'Agitate the pain',
        3: 'Present solution + meeting CTA'
      }
    },
    demos: {
      primary: 'BAB',
      reasoning: 'BAB (Before-After-Bridge) is ideal for demos as it paints a transformation picture, making prospects want to see the product in action.',
      alternative: '4Ps',
      touchPoints: {
        1: 'Current state (Before)',
        2: 'Ideal state (After)',
        3: 'How to get there (Bridge) + demo CTA'
      }
    },
    trials: {
      primary: 'FAB',
      reasoning: 'FAB (Features-Advantages-Benefits) works well for trials by highlighting product value and making it easy to start.',
      alternative: 'AIDA',
      touchPoints: {
        1: 'Key features overview',
        2: 'Advantages over alternatives',
        3: 'Benefits + trial CTA'
      }
    },
    sales: {
      primary: '4Ps',
      reasoning: '4Ps (Picture-Promise-Prove-Push) provides comprehensive persuasion needed for direct sales conversations.',
      alternative: 'PAS',
      touchPoints: {
        1: 'Picture their situation',
        2: 'Promise + Proof',
        3: 'Push to action'
      }
    },
    awareness: {
      primary: 'AIDA',
      reasoning: 'AIDA (Attention-Interest-Desire-Action) is perfect for awareness campaigns with its gradual persuasion approach.',
      alternative: 'BAB',
      touchPoints: {
        1: 'Grab attention',
        2: 'Build interest',
        3: 'Create desire + soft CTA'
      }
    }
  };

  const recommendation = frameworks[objective as keyof typeof frameworks] || frameworks.meetings;

  return {
    framework: recommendation.primary,
    reasoning: recommendation.reasoning,
    alternative: recommendation.alternative,
    confidence: 0.85,
    touchPointStrategy: recommendation.touchPoints
  };
}

function recommendSequence(objective: string, icpData: any, aiAnalysis: any) {
  // AI logic for determining optimal sequence length and timing
  
  const baseSequences = {
    meetings: {
      touches: 4,
      reasoning: 'Cold meeting outreach needs 4-5 touches. Classic cold email sequence: intro, value, social proof, breakup.',
      timeline: '14 days',
      schedule: [
        { step: 1, delay: 0, type: 'email', focus: 'Cold intro: Personalized problem + curiosity hook' },
        { step: 2, delay: 3, type: 'email', focus: 'Follow-up: Value prop + case study/proof' },
        { step: 3, delay: 7, type: 'email', focus: 'Third touch: Direct meeting ask + calendar link' },
        { step: 4, delay: 12, type: 'email', focus: 'Breakup: Final attempt + permission to close file' }
      ]
    },
    demos: {
      touches: 3,
      reasoning: 'Cold demo outreach needs 3 strategic touches. First email breaks through, second builds credibility, third closes for demo.',
      timeline: '10 days',
      schedule: [
        { step: 1, delay: 0, type: 'email', focus: 'Cold intro: Problem + quick value prop' },
        { step: 2, delay: 4, type: 'email', focus: 'Follow-up: Social proof + transformation story' },
        { step: 3, delay: 8, type: 'email', focus: 'Breakup: Final demo offer + scarcity' }
      ]
    },
    trials: {
      touches: 3,
      reasoning: 'Cold trial outreach needs quick, low-friction sequence. Focus on easy signup and immediate value.',
      timeline: '7 days',
      schedule: [
        { step: 1, delay: 0, type: 'email', focus: 'Cold intro: Problem + free trial value' },
        { step: 2, delay: 3, type: 'email', focus: 'Follow-up: Quick setup + instant benefits' },
        { step: 3, delay: 6, type: 'email', focus: 'Breakup: Last chance trial offer + urgency' }
      ]
    },
    sales: {
      touches: 5,
      reasoning: 'Cold sales outreach needs longer sequence for trust building. Multiple touches with value at each step.',
      timeline: '21 days',
      schedule: [
        { step: 1, delay: 0, type: 'email', focus: 'Cold intro: Relevant insight + problem awareness' },
        { step: 2, delay: 3, type: 'email', focus: 'Follow-up: Solution + credibility markers' },
        { step: 3, delay: 7, type: 'email', focus: 'Third touch: Case study + ROI proof' },
        { step: 4, delay: 14, type: 'email', focus: 'Fourth touch: Offer + urgency/scarcity' },
        { step: 5, delay: 18, type: 'email', focus: 'Breakup: Final attempt + permission to close' }
      ]
    },
    awareness: {
      touches: 3,
      reasoning: 'Cold awareness outreach needs value-first approach. Build trust before asking for anything.',
      timeline: '14 days',
      schedule: [
        { step: 1, delay: 0, type: 'email', focus: 'Cold intro: Valuable insight + no ask' },
        { step: 2, delay: 5, type: 'email', focus: 'Follow-up: Educational content + helpful resource' },
        { step: 3, delay: 12, type: 'email', focus: 'Third touch: Soft CTA (download/subscribe)' }
      ]
    }
  };

  const recommendation = baseSequences[objective as keyof typeof baseSequences] || baseSequences.meetings;

  // Adjust based on ICP data
  if (icpData) {
    // If high-value enterprise targets, add more touches
    if (icpData.employee_count_min && icpData.employee_count_min > 500) {
      recommendation.touches += 1;
      recommendation.reasoning += ' Enterprise targets benefit from additional touchpoints.';
    }
    
    // If specific industry with known longer sales cycles
    if (icpData.industries && icpData.industries.includes('Enterprise Software')) {
      recommendation.timeline = `${parseInt(recommendation.timeline) + 7} days`;
      recommendation.reasoning += ' Enterprise software sales cycles warrant longer sequences.';
    }
  }

  return {
    touches: recommendation.touches,
    timeline: recommendation.timeline,
    reasoning: recommendation.reasoning,
    schedule: recommendation.schedule,
    confidence: 0.90
  };
}

// Note: AI insights are now generated by Python CrewAI service
// This function has been removed in favor of real AI analysis
