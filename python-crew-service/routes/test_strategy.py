"""
AI Test Strategy Decision Engine
Analyzes campaign context and historical data to recommend optimal A/B testing strategy
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import os
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI
from crew.email_copywriter_crew import create_email_copywriter_crew

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize LLM (same configuration as main.py)
def get_llm():
    """Get configured LLM instance - uses OpenAI for reliability"""
    # Temporarily forcing OpenAI due to DeepSeek API issues
    logger.info("Using OpenAI LLM for test strategy (DeepSeek disabled due to API errors)")
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY")
    )


class ICPProfile(BaseModel):
    name: str
    industries: List[str] = []
    pain_points: List[str] = []
    company_size: Optional[str] = None
    job_titles: List[str] = []


class Offer(BaseModel):
    name: str
    value_proposition: str
    call_to_action: str
    sales_assets: List[Any] = []  # Lead magnets - can be strings or {name, url, type} objects
    proof_points: List[str] = []  # Social proof
    benefits: List[str] = []


class HistoricalCampaign(BaseModel):
    objective: str
    test_type: str
    variant_elements: Dict[str, str]
    reply_rate: float
    was_winner: bool


class TestStrategyRequest(BaseModel):
    user_id: str
    campaign_name: str
    objective: str  # meetings, demos, trials, sales, awareness
    target_persona: str
    icp_profile: Optional[ICPProfile] = None
    offer: Optional[Offer] = None
    historical_campaigns: List[HistoricalCampaign] = []  # User's past campaigns


class VariantRecommendation(BaseModel):
    name: str
    variant_letter: str
    strategy: str
    config: Dict[str, str]
    reasoning: str
    expected_performance: float


class TestStrategyResponse(BaseModel):
    recommended_test_type: str
    reasoning: str
    confidence_score: float
    variants: List[VariantRecommendation]
    next_test_after_winner: Dict[str, str]
    historical_data_points: int


@router.post("/recommend-test-strategy", response_model=TestStrategyResponse)
async def recommend_test_strategy(request: TestStrategyRequest):
    """
    AI analyzes campaign context and recommends optimal A/B testing strategy
    
    Decision factors:
    1. Available assets (lead magnets, proof points, benefits)
    2. User's historical performance
    3. Global benchmarks for objective/persona
    4. Statistical significance potential
    """
    try:
        logger.info(f"Analyzing test strategy for: {request.campaign_name}")
        
        # Analyze available assets
        asset_analysis = analyze_available_assets(request.offer)
        
        # Analyze historical performance
        historical_insights = analyze_historical_performance(
            request.historical_campaigns,
            request.objective,
            request.target_persona
        )
        
        # Get global benchmarks
        global_benchmarks = get_global_benchmarks(
            request.objective,
            request.target_persona
        )
        
        # Decide test strategy
        test_strategy = decide_test_strategy(
            asset_analysis,
            historical_insights,
            global_benchmarks,
            request
        )
        
        # Generate variant recommendations
        variants = generate_variant_recommendations(
            test_strategy,
            request.offer,
            historical_insights
        )
        
        # Determine next test
        next_test = determine_next_test(test_strategy, asset_analysis)
        
        return TestStrategyResponse(
            recommended_test_type=test_strategy["test_type"],
            reasoning=test_strategy["reasoning"],
            confidence_score=test_strategy["confidence"],
            variants=variants,
            next_test_after_winner=next_test,
            historical_data_points=len(request.historical_campaigns)
        )
        
    except Exception as e:
        logger.error(f"Error recommending test strategy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def analyze_available_assets(offer: Optional[Offer]) -> Dict[str, Any]:
    """Analyze what assets are available for testing"""
    
    if not offer:
        return {
            "has_lead_magnets": False,
            "has_proof_points": False,
            "has_benefits": False,
            "lead_magnet_count": 0,
            "proof_point_count": 0,
            "benefit_count": 0
        }
    
    # Extract lead magnet names (handle both string and {name, url, type} formats)
    lead_magnet_names = []
    for asset in offer.sales_assets:
        if isinstance(asset, dict):
            lead_magnet_names.append(asset.get('name', str(asset)))
        else:
            lead_magnet_names.append(str(asset))
    
    return {
        "has_lead_magnets": len(offer.sales_assets) > 0,
        "has_proof_points": len(offer.proof_points) > 0,
        "has_benefits": len(offer.benefits) > 0,
        "lead_magnet_count": len(offer.sales_assets),
        "proof_point_count": len(offer.proof_points),
        "benefit_count": len(offer.benefits),
        "lead_magnets": lead_magnet_names,
        "proof_points": offer.proof_points,
        "benefits": offer.benefits
    }


def analyze_historical_performance(
    campaigns: List[HistoricalCampaign],
    objective: str,
    persona: str
) -> Dict[str, Any]:
    """Analyze user's historical campaign performance"""
    
    if not campaigns:
        return {
            "has_history": False,
            "total_campaigns": 0,
            "patterns": []
        }
    
    # Filter relevant campaigns
    relevant = [c for c in campaigns if c.objective == objective]
    
    # Find patterns
    patterns = []
    
    # Analyze lead magnet performance
    lead_magnet_performance = {}
    for campaign in relevant:
        if campaign.test_type == "lead_magnet" and "lead_magnet" in campaign.variant_elements:
            magnet = campaign.variant_elements["lead_magnet"]
            if magnet not in lead_magnet_performance:
                lead_magnet_performance[magnet] = []
            lead_magnet_performance[magnet].append(campaign.reply_rate)
    
    # Find best performing lead magnet
    if lead_magnet_performance:
        best_magnet = max(
            lead_magnet_performance.items(),
            key=lambda x: sum(x[1]) / len(x[1])
        )
        avg_performance = sum(best_magnet[1]) / len(best_magnet[1])
        patterns.append({
            "type": "lead_magnet",
            "element": best_magnet[0],
            "avg_performance": round(avg_performance, 2),
            "sample_size": len(best_magnet[1])
        })
    
    # Analyze proof point performance
    proof_point_performance = {}
    for campaign in relevant:
        if campaign.test_type == "proof_point" and "proof_point" in campaign.variant_elements:
            proof = campaign.variant_elements["proof_point"]
            if proof not in proof_point_performance:
                proof_point_performance[proof] = []
            proof_point_performance[proof].append(campaign.reply_rate)
    
    if proof_point_performance:
        best_proof = max(
            proof_point_performance.items(),
            key=lambda x: sum(x[1]) / len(x[1])
        )
        avg_performance = sum(best_proof[1]) / len(best_proof[1])
        patterns.append({
            "type": "proof_point",
            "element": best_proof[0],
            "avg_performance": round(avg_performance, 2),
            "sample_size": len(best_proof[1])
        })
    
    return {
        "has_history": True,
        "total_campaigns": len(campaigns),
        "relevant_campaigns": len(relevant),
        "patterns": patterns,
        "avg_reply_rate": round(sum(c.reply_rate for c in relevant) / len(relevant), 2) if relevant else 0
    }


def get_global_benchmarks(objective: str, persona: str) -> Dict[str, Any]:
    """Get global performance benchmarks (would query database in production)"""
    
    # Hardcoded benchmarks for now - would query global_performance_benchmarks table
    benchmarks = {
        "meetings": {
            "avg_reply_rate": 5.2,
            "lead_magnet_impact": 35,  # % impact on reply rate
            "proof_point_impact": 28,
            "subject_line_impact": 45,
            "best_lead_magnets": ["ROI Calculator", "Free Consultation", "Industry Report"],
            "best_proof_points": ["Case Study", "Customer Testimonial", "ROI Data"]
        },
        "demos": {
            "avg_reply_rate": 6.8,
            "lead_magnet_impact": 42,
            "proof_point_impact": 35,
            "subject_line_impact": 38,
            "best_lead_magnets": ["Product Demo", "Free Trial", "Video Walkthrough"],
            "best_proof_points": ["Demo Video", "Customer Success Story", "Feature Comparison"]
        },
        "trials": {
            "avg_reply_rate": 8.1,
            "lead_magnet_impact": 50,
            "proof_point_impact": 30,
            "subject_line_impact": 35,
            "best_lead_magnets": ["Free Trial", "Sandbox Access", "Setup Guide"],
            "best_proof_points": ["User Reviews", "Quick Start Guide", "Support Availability"]
        }
    }
    
    return benchmarks.get(objective, benchmarks["meetings"])


def decide_test_strategy(
    assets: Dict[str, Any],
    historical: Dict[str, Any],
    benchmarks: Dict[str, Any],
    request: TestStrategyRequest
) -> Dict[str, Any]:
    """
    Decide optimal test strategy based on all factors
    
    Priority logic:
    1. If multiple lead magnets available + high impact → test lead magnets
    2. If multiple proof points available + lead magnet already known → test proof points
    3. If no strong assets → test subject line approaches
    4. If historical data shows pattern → build on that
    """
    
    # Calculate test potential scores
    lead_magnet_score = 0
    proof_point_score = 0
    subject_line_score = 0
    
    # Lead magnet potential
    if assets["lead_magnet_count"] >= 2:
        lead_magnet_score += 40
        lead_magnet_score += min(assets["lead_magnet_count"] * 10, 30)  # More options = better
        lead_magnet_score += benchmarks["lead_magnet_impact"] * 0.3
    
    # Proof point potential
    if assets["proof_point_count"] >= 2:
        proof_point_score += 35
        proof_point_score += min(assets["proof_point_count"] * 10, 25)
        proof_point_score += benchmarks["proof_point_impact"] * 0.3
    
    # Subject line always possible
    subject_line_score = 30 + (benchmarks["subject_line_impact"] * 0.3)
    
    # Boost scores based on historical insights
    if historical["has_history"]:
        for pattern in historical["patterns"]:
            if pattern["type"] == "lead_magnet" and pattern["sample_size"] >= 2:
                # If we already know best lead magnet, test proof points next
                proof_point_score += 20
            elif pattern["type"] == "proof_point" and pattern["sample_size"] >= 2:
                # If we know best proof point, test subject lines
                subject_line_score += 20
    
    # Decide based on scores
    scores = {
        "lead_magnet": lead_magnet_score,
        "proof_point": proof_point_score,
        "subject_line": subject_line_score
    }
    
    best_test = max(scores.items(), key=lambda x: x[1])
    test_type = best_test[0]
    confidence = min(best_test[1] / 100, 0.95)  # Cap at 95%
    
    # Generate reasoning
    reasoning = generate_reasoning(test_type, assets, historical, benchmarks)
    
    return {
        "test_type": test_type,
        "confidence": round(confidence, 2),
        "reasoning": reasoning,
        "scores": scores
    }


def generate_reasoning(
    test_type: str,
    assets: Dict[str, Any],
    historical: Dict[str, Any],
    benchmarks: Dict[str, Any]
) -> str:
    """Generate human-readable reasoning for test strategy"""
    
    reasons = []
    
    if test_type == "lead_magnet":
        reasons.append(f"You have {assets['lead_magnet_count']} lead magnets to compare")
        reasons.append(f"Lead magnet choice impacts reply rate by {benchmarks['lead_magnet_impact']}% on average")
        
        if historical["has_history"]:
            lead_magnet_patterns = [p for p in historical["patterns"] if p["type"] == "lead_magnet"]
            if lead_magnet_patterns:
                best = lead_magnet_patterns[0]
                reasons.append(f"Your '{best['element']}' performed at {best['avg_performance']}% in previous campaigns")
        else:
            reasons.append("This is your first campaign - testing lead magnets will establish baseline performance")
    
    elif test_type == "proof_point":
        reasons.append(f"You have {assets['proof_point_count']} proof points to test")
        reasons.append(f"Proof points impact reply rate by {benchmarks['proof_point_impact']}% on average")
        
        if historical["has_history"]:
            reasons.append("You have historical data showing which lead magnets work - now optimize with proof points")
    
    elif test_type == "subject_line":
        reasons.append(f"Subject lines impact open rates by {benchmarks['subject_line_impact']}%")
        reasons.append("Testing different subject line approaches will maximize email opens")
    
    return " • ".join(reasons)


def generate_variant_recommendations(
    strategy: Dict[str, Any],
    offer: Optional[Offer],
    historical: Dict[str, Any]
) -> List[VariantRecommendation]:
    """Generate specific variant recommendations"""
    
    test_type = strategy["test_type"]
    variants = []
    
    if test_type == "lead_magnet" and offer and offer.sales_assets:
        # Create variant for each lead magnet
        for i, magnet_raw in enumerate(offer.sales_assets[:5]):  # Max 5 variants
            # Handle both string and structured {name, url, type} formats
            if isinstance(magnet_raw, dict):
                magnet_name = magnet_raw.get('name', str(magnet_raw))
                magnet_url = magnet_raw.get('url', '')
            else:
                magnet_name = str(magnet_raw)
                magnet_url = ''
            
            # Check historical performance
            expected_perf = 5.0  # Base expectation
            reasoning = f"Testing '{magnet_name}' as primary CTA"
            
            if historical["has_history"]:
                for pattern in historical["patterns"]:
                    if pattern["type"] == "lead_magnet" and pattern["element"] == magnet_name:
                        expected_perf = pattern["avg_performance"]
                        reasoning += f" - Previously achieved {expected_perf}% reply rate"
                        break
                else:
                    # Adjust based on average
                    if historical["avg_reply_rate"] > 0:
                        expected_perf = historical["avg_reply_rate"] * 0.9  # Slightly conservative
            
            config = {"lead_magnet": magnet_name}
            if magnet_url:
                config["lead_magnet_url"] = magnet_url
            
            variants.append(VariantRecommendation(
                name=f"Variant {chr(65+i)} - {magnet_name}",
                variant_letter=chr(65+i),
                strategy=f"Lead with value proposition, offer {magnet_name}",
                config=config,
                reasoning=reasoning,
                expected_performance=round(expected_perf, 1)
            ))
    
    elif test_type == "proof_point" and offer and offer.proof_points:
        # Create variant for each proof point
        for i, proof in enumerate(offer.proof_points[:5]):
            expected_perf = 6.0
            
            if historical["has_history"]:
                for pattern in historical["patterns"]:
                    if pattern["type"] == "proof_point" and pattern["element"] == proof:
                        expected_perf = pattern["avg_performance"]
                        break
                else:
                    if historical["avg_reply_rate"] > 0:
                        expected_perf = historical["avg_reply_rate"] * 1.1  # Slightly optimistic
            
            variants.append(VariantRecommendation(
                name=f"Variant {chr(65+i)} - {proof[:30]}...",
                variant_letter=chr(65+i),
                strategy=f"Build credibility with: {proof}",
                config={"proof_point": proof},
                reasoning=f"Using '{proof}' to establish trust and credibility",
                expected_performance=round(expected_perf, 1)
            ))
    
    elif test_type == "subject_line":
        # Create variants with different subject line approaches
        approaches = [
            ("question_based", "Question-Based", "Engage curiosity with a relevant question", 6.5),
            ("pain_focused", "Pain-Focused", "Lead with their biggest pain point", 7.2),
            ("benefit_driven", "Benefit-Driven", "Highlight key benefit immediately", 5.8),
            ("curiosity_gap", "Curiosity Gap", "Create intrigue to drive opens", 6.0),
            ("personalized", "Personalized", "Use company-specific insight", 7.8)
        ]
        
        for i, (approach_key, approach_name, description, expected) in enumerate(approaches[:3]):
            variants.append(VariantRecommendation(
                name=f"Variant {chr(65+i)} - {approach_name}",
                variant_letter=chr(65+i),
                strategy=description,
                config={"subject_line_approach": approach_key},
                reasoning=f"{approach_name} subject lines typically achieve {expected}% open rates",
                expected_performance=expected
            ))
    
    return variants


def determine_next_test(strategy: Dict[str, Any], assets: Dict[str, Any]) -> Dict[str, str]:
    """Determine what to test after current winner is found"""
    
    current_test = strategy["test_type"]
    
    if current_test == "lead_magnet":
        if assets["proof_point_count"] >= 2:
            return {
                "test_type": "proof_point",
                "reasoning": "After finding best lead magnet, test which proof point strengthens it most"
            }
        else:
            return {
                "test_type": "subject_line",
                "reasoning": "After finding best lead magnet, optimize subject lines to maximize opens"
            }
    
    elif current_test == "proof_point":
        return {
            "test_type": "subject_line",
            "reasoning": "After finding best proof point, optimize subject lines for maximum engagement"
        }
    
    elif current_test == "subject_line":
        return {
            "test_type": "opening_line",
            "reasoning": "After optimizing subject lines, test different email opening approaches"
        }
    
    return {
        "test_type": "continuous_optimization",
        "reasoning": "Continue testing small variations to beat current best performance"
    }


class VariantGenerationRequest(BaseModel):
    campaign_name: str
    objective: str
    target_persona: str
    icp_profile: Optional[ICPProfile] = None
    offer: Optional[Offer] = None
    variants: List[VariantRecommendation]
    num_touches: int = 3


class GeneratedVariant(BaseModel):
    name: str
    variant_letter: str
    strategy: str
    config: Dict[str, str]
    reasoning: str
    expected_performance: float
    email_sequence: List[str]  # Generated email content for each touch


class VariantGenerationResponse(BaseModel):
    success: bool
    variants: List[GeneratedVariant]
    generation_time_seconds: float


@router.post("/generate-variant-emails", response_model=VariantGenerationResponse)
async def generate_variant_emails(request: VariantGenerationRequest):
    """
    Generate actual email content for each test variant using CrewAI
    
    Uses existing email_copywriter_crew to generate email sequences
    for each variant based on the test strategy
    """
    try:
        import time
        start_time = time.time()
        
        logger.info(f"Generating email variants for: {request.campaign_name}")
        
        llm = get_llm()
        generated_variants = []
        
        # Get base data from offer
        pain_points = request.icp_profile.pain_points if request.icp_profile else []
        
        for variant in request.variants:
            logger.info(f"Generating emails for {variant.name}")
            
            # Determine what to emphasize based on variant config
            lead_magnet = variant.config.get('lead_magnet', request.offer.call_to_action if request.offer else '')
            lead_magnet_url = variant.config.get('lead_magnet_url', '')
            proof_point = variant.config.get('proof_point', '')
            
            # Build base offer text (without URL - URL added for touch 2+ only)
            base_offer_text = f"{request.offer.value_proposition if request.offer else ''}"
            if lead_magnet:
                base_offer_text += f" Get access to: {lead_magnet}"
            
            # Build hook snippet with proof point if available
            hook_snippet = proof_point if proof_point else ''
            
            # Build lead context explaining the variant strategy
            lead_context = f"""
            Variant Strategy: {variant.strategy}
            Test Focus: {variant.reasoning}
            Expected Performance: {variant.expected_performance}% reply rate
            
            This is variant {variant.variant_letter} in an A/B test.
            """
            
            # Generate email sequence for this variant
            email_sequence = []
            
            for touch_num in range(1, request.num_touches + 1):
                try:
                    logger.info(f"Starting email generation for {variant.name}, touch {touch_num}")
                    
                    # Add lead magnet URL only for touch 2+ (never in first email)
                    offer_text = base_offer_text
                    if lead_magnet_url and touch_num > 1:
                        offer_text += f" Link: {lead_magnet_url}"
                    
                    # Create email copywriter crew
                    email_crew = create_email_copywriter_crew(
                        llm=llm,
                        name="{{first_name}}",  # Template token
                        title=request.target_persona,
                        company="{{company}}",  # Template token
                        pain_points=pain_points,
                        offer=offer_text,
                        hook_snippet=hook_snippet,
                        lead_context=f"{lead_context}\nTouch #{touch_num} of {request.num_touches}"
                    )
                    
                    logger.info(f"Crew created, calling kickoff()...")
                    
                    # Generate email with timeout protection
                    result = email_crew.kickoff()
                    email_content = str(result)
                    
                    logger.info(f"Email generated successfully: {len(email_content)} characters")
                    
                    email_sequence.append(email_content)
                    logger.info(f"Generated touch {touch_num} for {variant.name}")
                    
                except Exception as e:
                    import traceback
                    error_details = traceback.format_exc()
                    logger.error(f"FULL ERROR for touch {touch_num}, {variant.name}:")
                    logger.error(f"Exception type: {type(e).__name__}")
                    logger.error(f"Exception message: {str(e)}")
                    logger.error(f"Full traceback:\n{error_details}")
                    
                    # Add placeholder with detailed error
                    error_msg = f"[Error: {type(e).__name__} - {str(e)}]"
                    email_sequence.append(error_msg)
            
            # Create generated variant
            generated_variants.append(GeneratedVariant(
                name=variant.name,
                variant_letter=variant.variant_letter,
                strategy=variant.strategy,
                config=variant.config,
                reasoning=variant.reasoning,
                expected_performance=variant.expected_performance,
                email_sequence=email_sequence
            ))
        
        end_time = time.time()
        generation_time = end_time - start_time
        
        logger.info(f"Generated {len(generated_variants)} variants in {generation_time:.2f}s")
        
        return VariantGenerationResponse(
            success=True,
            variants=generated_variants,
            generation_time_seconds=round(generation_time, 2)
        )
        
    except Exception as e:
        logger.error(f"Error generating variant emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
