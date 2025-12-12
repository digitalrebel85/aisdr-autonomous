"""
Campaign Strategy Analysis Endpoint
Uses CrewAI to analyze campaign objectives, ICP profiles, and offers
to generate personalized pain points, benefits, and messaging recommendations
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ICPProfile(BaseModel):
    name: str
    description: Optional[str] = None
    pain_points: List[str] = []
    industries: List[str] = []
    company_size: Optional[str] = None
    job_titles: List[str] = []


class Offer(BaseModel):
    name: str
    description: Optional[str] = None
    value_proposition: str
    call_to_action: str
    sales_assets: List[str] = []  # Lead magnets: webinars, whitepapers, consultations
    proof_points: List[str] = []  # Social proof: case studies, testimonials, ROI data
    pain_points: List[str] = []   # Pain points this offer addresses
    benefits: List[str] = []      # Key benefits


class CampaignStrategyRequest(BaseModel):
    campaign_name: str
    objective: str  # meetings, demos, trials, sales, awareness
    target_persona: str
    icp_profile: Optional[ICPProfile] = None
    offer: Optional[Offer] = None


class CampaignStrategyResponse(BaseModel):
    insights: Dict[str, Any]


@router.post("/analyze-campaign-strategy", response_model=CampaignStrategyResponse)
async def analyze_campaign_strategy(request: CampaignStrategyRequest):
    """
    Analyze campaign strategy using AI to generate personalized insights
    
    Returns:
    - painPoints: Business pain points the target audience faces
    - valuePropositions: How the offer solves those pain points
    - competitiveInsights: Alternatives and differentiators
    - triggerEvents: Events that make prospects ready to buy
    - bestPractices: Campaign-specific best practices
    - messagingHooks: Specific hooks to use in emails
    """
    try:
        logger.info(f"Analyzing campaign strategy for: {request.campaign_name}")
        
        # Extract pain points from Offer first, then ICP profile, or generate intelligent ones
        pain_points = []
        if request.offer and request.offer.pain_points:
            # Prefer pain points from Offer (most specific to the campaign)
            pain_points = request.offer.pain_points
            logger.info(f"Using pain points from Offer: {pain_points}")
        elif request.icp_profile and request.icp_profile.pain_points:
            pain_points = request.icp_profile.pain_points
            logger.info(f"Using pain points from ICP: {pain_points}")
        else:
            # Generate pain points based on target persona and industry
            pain_points = generate_persona_pain_points(
                request.target_persona,
                request.icp_profile.industries if request.icp_profile else []
            )
            logger.info(f"Generated pain points: {pain_points}")
        
        # Extract value propositions from offer or generate based on pain points
        value_propositions = []
        if request.offer:
            # Start with main value prop
            value_propositions.append(request.offer.value_proposition)
            
            # Add benefits from offer
            if request.offer.benefits:
                value_propositions.extend(request.offer.benefits[:3])
            else:
                value_propositions.extend([
                    f"Solve: {pain_points[0] if pain_points else 'key business challenges'}",
                    "Proven results with similar companies"
                ])
        else:
            value_propositions = [
                f"Address {pain_points[0] if pain_points else 'critical business needs'}",
                "Streamline operations and boost efficiency",
                "Gain competitive advantage in your market"
            ]
        
        # Generate competitive insights with proof points
        differentiators = [
            "Faster time to value",
            "Better customer support and onboarding",
            "More intuitive and user-friendly"
        ]
        
        # Add proof points as differentiators (NOT sales_assets)
        if request.offer and request.offer.proof_points:
            differentiators.extend(request.offer.proof_points[:3])
        else:
            differentiators.append("Proven ROI with similar companies")
        
        competitive_insights = {
            "commonAlternatives": [
                "Status quo / doing nothing",
                "In-house solution",
                "Competitor tools"
            ],
            "differentiators": differentiators[:5]  # Limit to top 5
        }
        
        # Generate trigger events based on persona and industry
        trigger_events = generate_trigger_events(
            request.target_persona,
            request.icp_profile.industries if request.icp_profile else []
        )
        
        # Generate best practices for the objective
        best_practices = generate_best_practices(request.objective, request.target_persona)
        
        # Generate messaging hooks
        messaging_hooks = generate_messaging_hooks(
            request.objective,
            pain_points,
            request.offer
        )
        
        # Add proof points as separate insight (social proof)
        proof_points = []
        if request.offer and request.offer.proof_points:
            proof_points = request.offer.proof_points
        
        # Add sales assets as lead magnets (value offers)
        lead_magnets = []
        if request.offer and request.offer.sales_assets:
            lead_magnets = request.offer.sales_assets
        
        insights = {
            "painPoints": pain_points[:4],  # Top 4 pain points
            "valuePropositions": value_propositions[:4],  # Top 4 value props
            "proofPoints": proof_points[:5],  # Top 5 social proof items
            "leadMagnets": lead_magnets[:5],  # Top 5 lead magnets/value offers
            "competitiveInsights": competitive_insights,
            "triggerEvents": trigger_events[:5],  # Top 5 trigger events
            "bestPractices": best_practices[:5],  # Top 5 best practices
            "messagingHooks": messaging_hooks[:3]  # Top 3 messaging hooks
        }
        
        return CampaignStrategyResponse(insights=insights)
        
    except Exception as e:
        logger.error(f"Error analyzing campaign strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_persona_pain_points(target_persona: str, industries: List[str]) -> List[str]:
    """Generate intelligent pain points based on persona and industry"""
    
    # Common pain points by role
    role_pain_points = {
        "ceo": [
            "Difficulty scaling operations profitably",
            "Lack of visibility into key business metrics",
            "Inefficient processes impacting bottom line",
            "Competitive pressure and market disruption"
        ],
        "cto": [
            "Technical debt slowing down innovation",
            "Difficulty attracting and retaining tech talent",
            "Security and compliance concerns",
            "Legacy systems limiting scalability"
        ],
        "vp sales": [
            "Inconsistent pipeline and revenue predictability",
            "Long sales cycles and low conversion rates",
            "Difficulty scaling the sales team",
            "Lack of visibility into sales performance"
        ],
        "marketing": [
            "Low ROI on marketing spend",
            "Difficulty generating qualified leads",
            "Lack of attribution and analytics",
            "Inefficient marketing workflows"
        ],
        "operations": [
            "Manual processes prone to errors",
            "Lack of process standardization",
            "Difficulty managing growth",
            "Inefficient resource allocation"
        ]
    }
    
    # Try to match persona to role
    persona_lower = target_persona.lower()
    for role, pains in role_pain_points.items():
        if role in persona_lower:
            return pains
    
    # Default pain points
    return [
        "Inefficient processes costing time and money",
        "Lack of visibility into key business metrics",
        "Difficulty scaling operations",
        "Manual workflows prone to errors"
    ]


def generate_trigger_events(target_persona: str, industries: List[str]) -> List[str]:
    """Generate relevant trigger events"""
    
    events = [
        "Recent funding announcement or investment round",
        "New executive hire (especially in relevant department)",
        "Company expansion or new office opening",
        "Product launch or major update announcement",
        "Technology stack changes or migrations"
    ]
    
    # Add industry-specific triggers
    if "saas" in str(industries).lower() or "software" in str(industries).lower():
        events.append("High customer churn or retention issues")
        events.append("Scaling challenges with user growth")
    
    if "ecommerce" in str(industries).lower() or "retail" in str(industries).lower():
        events.append("Seasonal sales peaks approaching")
        events.append("Inventory management challenges")
    
    return events


def generate_best_practices(objective: str, target_persona: str) -> List[str]:
    """Generate objective-specific best practices"""
    
    base_practices = [
        "Personalize first line with specific company insight",
        "Keep emails under 150 words for best response rates",
        "Include social proof (customer logos, testimonials)",
        "Clear single CTA - don't give multiple options",
        "Send during business hours in recipient timezone"
    ]
    
    objective_practices = {
        "meetings": [
            "Offer specific time slots to reduce friction",
            "Mention mutual connections or shared interests",
            "Lead with value, not your calendar availability"
        ],
        "demos": [
            "Highlight specific features relevant to their use case",
            "Share a quick video preview or screenshot",
            "Emphasize the 'aha moment' they'll experience"
        ],
        "trials": [
            "Emphasize zero commitment and easy setup",
            "Mention time-limited trial benefits",
            "Provide clear onboarding support"
        ],
        "sales": [
            "Build credibility with case studies and ROI data",
            "Address budget and procurement process early",
            "Create urgency with limited-time offers"
        ],
        "awareness": [
            "Focus on education, not selling",
            "Share valuable content and insights",
            "Build relationship before asking for anything"
        ]
    }
    
    specific = objective_practices.get(objective, [])
    return base_practices + specific


def generate_messaging_hooks(objective: str, pain_points: List[str], offer: Optional[Offer]) -> List[str]:
    """Generate specific messaging hooks for emails"""
    
    hooks = []
    
    if offer:
        hooks.append(f"Lead with: \"{offer.value_proposition}\"")
        if pain_points:
            hooks.append(f"Connect to pain: \"{pain_points[0]}\"")
        
        # Add proof point if available (social proof)
        if offer.proof_points:
            hooks.append(f"Use proof: {offer.proof_points[0]}")
        
        # Add lead magnet as CTA if available
        if offer.sales_assets:
            hooks.append(f"Offer value: {offer.sales_assets[0]}")
        else:
            hooks.append(f"Close with: {offer.call_to_action}")
    else:
        if pain_points:
            hooks.append(f"Open with their pain: \"{pain_points[0]}\"")
        hooks.append("Show quick wins and tangible ROI")
        hooks.append("Make the next step crystal clear and low-friction")
    
    # Add objective-specific hooks
    if objective == "meetings":
        hooks.append("Suggest specific time slots (e.g., 'Tuesday at 2pm or Wednesday at 10am?')")
    elif objective == "demos":
        hooks.append("Tease a specific feature they'll see in action")
    elif objective == "trials":
        hooks.append("Emphasize 'No credit card required' and quick setup")
    
    return hooks
