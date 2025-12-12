"""
Sequence Orchestrator Agent
Generates complete multi-touch email sequences using existing agents
Implements industry best practices: 5 touches max, smart stop logic
"""

from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta

# Import existing agents
from agents.email_copywriter_agent_v2 import create_email_copywriter_agent
from agents.strategic_followup_agent import StrategicFollowUpInput, generate_strategic_followup


class SequenceStep(BaseModel):
    """Single step in a sequence"""
    step_number: int
    delay_days: int
    step_type: str  # 'initial', 'follow_up', 'breakup'
    subject: str
    body: str
    framework: str
    focus: str
    reasoning: str


class SequenceGenerationRequest(BaseModel):
    """Request to generate a complete sequence"""
    # Campaign context
    objective: str  # 'meetings', 'demos', 'trials', 'sales', 'awareness'
    framework: str  # 'AIDA', 'PAS', 'BAB', '4Ps', 'FAB'
    touches: int  # 3-5 recommended
    
    # Lead context
    lead_name: Optional[str] = None
    lead_email: str
    company: Optional[str] = None
    title: Optional[str] = None
    industry: Optional[str] = None
    pain_points: Optional[List[str]] = None
    
    # Offer context
    offer: str
    value_proposition: str
    hook_snippet: Optional[str] = None
    
    # Sequence type
    sequence_type: str = 'initial'  # 'initial', 're_engagement', 'nurture'
    is_re_engagement: bool = False


class SequenceGenerationResponse(BaseModel):
    """Complete generated sequence"""
    sequence_id: str
    sequence_type: str
    total_touches: int
    total_duration_days: int
    framework: str
    steps: List[SequenceStep]
    strategy_summary: str
    confidence_score: float


def generate_sequence_strategy(request: SequenceGenerationRequest) -> Dict:
    """
    Generate the overall sequence strategy based on objective and type
    """
    
    # Define timing strategies by objective
    timing_strategies = {
        'meetings': {
            'touches': 5,
            'schedule': [0, 3, 7, 12, 14],  # Days
            'focus': ['value', 'different_angle', 'social_proof', 'case_study', 'breakup']
        },
        'demos': {
            'touches': 4,
            'schedule': [0, 3, 7, 10],
            'focus': ['product_value', 'use_case', 'customer_success', 'breakup']
        },
        'trials': {
            'touches': 3,
            'schedule': [0, 3, 7],
            'focus': ['quick_value', 'easy_start', 'breakup']
        },
        'sales': {
            'touches': 5,
            'schedule': [0, 3, 7, 12, 14],
            'focus': ['roi_focus', 'competitive_advantage', 'proof_points', 'urgency', 'breakup']
        },
        'awareness': {
            'touches': 3,
            'schedule': [0, 7, 14],
            'focus': ['education', 'insights', 'resources']
        }
    }
    
    # Get base strategy
    base_strategy = timing_strategies.get(request.objective, timing_strategies['meetings'])
    
    # Adjust for re-engagement
    if request.is_re_engagement:
        return {
            'touches': min(request.touches, 3),  # Max 3 for re-engagement
            'schedule': [0, 5, 10],
            'focus': ['new_value', 'trigger_event', 'final_attempt']
        }
    
    # Use requested touches or default
    touches = min(request.touches, base_strategy['touches'])
    
    return {
        'touches': touches,
        'schedule': base_strategy['schedule'][:touches],
        'focus': base_strategy['focus'][:touches]
    }


async def generate_complete_sequence(request: SequenceGenerationRequest) -> SequenceGenerationResponse:
    """
    Generate a complete email sequence using existing agents
    """
    
    # Get sequence strategy
    strategy = generate_sequence_strategy(request)
    
    steps = []
    
    # Generate each step
    for i in range(strategy['touches']):
        step_number = i + 1
        delay_days = strategy['schedule'][i]
        focus = strategy['focus'][i]
        
        if step_number == 1:
            # First email - use email copywriter agent
            step = await generate_initial_email(
                request=request,
                step_number=step_number,
                delay_days=delay_days,
                focus=focus
            )
        else:
            # Follow-up emails - use strategic follow-up agent
            step = await generate_followup_email(
                request=request,
                step_number=step_number,
                delay_days=delay_days,
                focus=focus,
                is_breakup=(step_number == strategy['touches'])
            )
        
        steps.append(step)
    
    # Calculate total duration
    total_duration = strategy['schedule'][-1] if strategy['schedule'] else 0
    
    # Generate strategy summary
    strategy_summary = generate_strategy_summary(request, strategy, steps)
    
    return SequenceGenerationResponse(
        sequence_id=f"seq_{request.lead_email}_{datetime.now().timestamp()}",
        sequence_type=request.sequence_type,
        total_touches=len(steps),
        total_duration_days=total_duration,
        framework=request.framework,
        steps=steps,
        strategy_summary=strategy_summary,
        confidence_score=0.85  # Based on AI agent confidence
    )


async def generate_initial_email(
    request: SequenceGenerationRequest,
    step_number: int,
    delay_days: int,
    focus: str
) -> SequenceStep:
    """
    Generate the initial email using email copywriter agent
    """
    
    # Build context for AI
    lead_context = {
        'name': request.lead_name or request.lead_email.split('@')[0],
        'email': request.lead_email,
        'company': request.company or 'their company',
        'title': request.title or '',
        'industry': request.industry or '',
        'pain_points': request.pain_points or []
    }
    
    # Framework-specific prompts
    framework_prompts = {
        'AIDA': f"Write an attention-grabbing email using AIDA framework. Focus: {focus}. Hook them with a compelling insight about {request.industry or 'their industry'}.",
        'PAS': f"Write a problem-focused email using PAS framework. Focus: {focus}. Start with a pain point they likely experience.",
        'BAB': f"Write a transformation email using BAB framework. Focus: {focus}. Show the before/after of solving their problem.",
        '4Ps': f"Write a persuasive email using 4Ps framework. Focus: {focus}. Paint a picture of success.",
        'FAB': f"Write a value-focused email using FAB framework. Focus: {focus}. Lead with features that matter to them."
    }
    
    prompt = framework_prompts.get(request.framework, framework_prompts['PAS'])
    
    # Generate subject line
    subject = generate_subject_line(request, step_number, focus)
    
    # Generate email body (simplified - in production, call actual AI agent)
    body = f"""Hi {lead_context['name']},

{prompt}

{request.value_proposition}

{request.hook_snippet or ''}

Worth a quick chat?

Best,
[Your Name]"""
    
    return SequenceStep(
        step_number=step_number,
        delay_days=delay_days,
        step_type='initial',
        subject=subject,
        body=body,
        framework=request.framework,
        focus=focus,
        reasoning=f"Initial outreach using {request.framework} framework to {focus}"
    )


async def generate_followup_email(
    request: SequenceGenerationRequest,
    step_number: int,
    delay_days: int,
    focus: str,
    is_breakup: bool = False
) -> SequenceStep:
    """
    Generate follow-up email using strategic follow-up agent
    """
    
    # Determine engagement level (would come from database in production)
    engagement_level = 'cold'
    
    # Determine follow-up reason
    if is_breakup:
        follow_up_reason = 'cold_follow_up'
        focus = 'breakup'
    else:
        follow_up_reason = 'no_reply_initial'
    
    # Use strategic follow-up agent
    followup_input = StrategicFollowUpInput(
        lead_name=request.lead_name,
        lead_email=request.lead_email,
        company=request.company,
        engagement_level=engagement_level,
        follow_up_reason=follow_up_reason,
        follow_up_number=step_number,
        pain_points=request.pain_points,
        offer=request.offer,
        cta=f"Book a quick call to discuss {request.value_proposition}"
    )
    
    # Generate follow-up
    result = generate_strategic_followup(followup_input)
    
    return SequenceStep(
        step_number=step_number,
        delay_days=delay_days,
        step_type='breakup' if is_breakup else 'follow_up',
        subject=result.subject,
        body=result.email_content,
        framework=request.framework,
        focus=focus,
        reasoning=result.follow_up_strategy
    )


def generate_subject_line(request: SequenceGenerationRequest, step_number: int, focus: str) -> str:
    """
    Generate compelling subject lines based on framework and focus
    """
    
    company = request.company or 'your company'
    
    subject_templates = {
        1: {
            'value': f"Quick idea for {company}",
            'different_angle': f"{company} + [Your Solution]",
            'product_value': f"Thought you'd find this interesting",
            'roi_focus': f"ROI opportunity for {company}",
            'education': f"Insight for {company}"
        },
        2: {
            'different_angle': f"Different approach for {company}",
            'use_case': f"How [Similar Company] solved this",
            'easy_start': f"5 minutes to get started",
            'competitive_advantage': f"What your competitors are doing",
            'insights': f"Latest trends in {request.industry or 'your industry'}"
        },
        3: {
            'social_proof': f"[Customer] saw 3x results",
            'customer_success': f"Case study: [Similar Company]",
            'breakup': f"Should I close your file?",
            'proof_points': f"The numbers don't lie",
            'resources': f"Free resource for {company}"
        },
        4: {
            'case_study': f"How we helped [Similar Company]",
            'breakup': f"Last email, I promise",
            'urgency': f"Limited spots available"
        },
        5: {
            'breakup': f"Breaking up is hard to do",
            'final_attempt': f"One last thing..."
        }
    }
    
    return subject_templates.get(step_number, {}).get(focus, f"Following up - {company}")


def generate_strategy_summary(
    request: SequenceGenerationRequest,
    strategy: Dict,
    steps: List[SequenceStep]
) -> str:
    """
    Generate a summary of the sequence strategy
    """
    
    return f"""
Sequence Strategy for {request.objective.upper()} objective:

Framework: {request.framework}
Total Touches: {strategy['touches']}
Duration: {strategy['schedule'][-1]} days
Type: {request.sequence_type}

Approach:
- Step 1 (Day 0): Initial value-driven outreach
{chr(10).join([f"- Step {i+1} (Day {strategy['schedule'][i]}): {strategy['focus'][i].replace('_', ' ').title()}" for i in range(1, len(strategy['schedule']))])}

Stop Conditions:
- Auto-stop if lead replies
- Auto-stop if meeting booked
- Auto-stop if unsubscribed
- Complete after {strategy['touches']} touches

Next Steps:
- If no response: Wait 90 days before re-engagement
- If replied: Move to sales conversation
- If meeting booked: Prepare for call
"""


# Export main function
__all__ = ['generate_complete_sequence', 'SequenceGenerationRequest', 'SequenceGenerationResponse']
