"""
ICP Angle Generation Agent

A CrewAI agent specialized in generating strategic messaging angles
for Ideal Customer Profiles based on sales psychology and B2B best practices.
"""

from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel, Field
from typing import List, Optional
import json


class GeneratedAngle(BaseModel):
    """A single messaging angle for an ICP"""
    name: str = Field(description="Short, memorable name (2-4 words)")
    description: str = Field(description="When to use this angle")
    value_proposition: str = Field(description="Core pitch/message (2-3 sentences)")
    pain_points: List[str] = Field(description="3 specific pain points addressed")
    hooks: List[str] = Field(description="3 attention-grabbing opening lines")
    proof_points: List[str] = Field(description="2-3 social proof statements")
    tone: str = Field(description="One of: professional, casual, urgent, consultative, challenger")
    psychological_trigger: str = Field(description="Primary psychological driver: fear, greed, pride, exclusivity, urgency, social_proof")
    buyer_stage: str = Field(description="Best for: problem_aware, solution_aware, product_aware")


class AngleGenerationOutput(BaseModel):
    """Output from the angle generation agent"""
    angles: List[GeneratedAngle] = Field(description="List of generated messaging angles")
    strategy_notes: str = Field(description="Strategic reasoning behind the angle selection")


def create_angle_strategist_agent(llm):
    """Create the angle strategist agent"""
    return Agent(
        role="B2B Sales Messaging Strategist",
        goal="Generate highly differentiated, psychologically-compelling messaging angles that resonate with specific buyer personas and drive action",
        backstory="""You are a world-class B2B sales strategist with 20+ years of experience 
        crafting messaging for enterprise software companies. You've studied the psychology of 
        B2B buying decisions extensively and understand that different buyers respond to different 
        triggers based on their role, pain points, and stage in the buying journey.
        
        You know that effective angles must:
        1. Speak to a SPECIFIC pain point, not generic benefits
        2. Use the buyer's language, not vendor jargon
        3. Create urgency without being pushy
        4. Differentiate from competitors through unique framing
        5. Match the psychological profile of the target persona
        
        You've helped companies like Salesforce, HubSpot, and Gong develop their outbound messaging
        and understand what separates high-converting angles from noise.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )


def create_angle_generation_task(agent, icp_data: dict, num_angles: int, existing_angles: List[str], offer_data: dict = None):
    """Create the angle generation task"""
    
    icp_context = f"""
## Target ICP Profile

**Name:** {icp_data.get('name', 'Unknown')}
**Description:** {icp_data.get('description', 'Not specified')}

### Target Audience
- **Industries:** {', '.join(icp_data.get('industries', [])) or 'Any'}
- **Company Sizes:** {', '.join(icp_data.get('company_sizes', [])) or 'Any'}
- **Job Titles:** {', '.join(icp_data.get('job_titles', [])) or 'Decision makers'}
- **Seniority Levels:** {', '.join(icp_data.get('seniority_levels', [])) or 'Any'}
- **Departments:** {', '.join(icp_data.get('departments', [])) or 'Any'}

### Context
- **Technologies Used:** {', '.join(icp_data.get('technologies', [])) or 'Not specified'}
- **Known Pain Points:** {', '.join(icp_data.get('pain_points', [])) or 'Not specified'}
- **Keywords:** {', '.join(icp_data.get('keywords', [])) or 'Not specified'}
- **Locations:** {', '.join(icp_data.get('locations', [])) or 'Any'}

### Existing Angles to Avoid
{', '.join(existing_angles) if existing_angles else 'None - this is a fresh start'}
"""

    # Add offer context if provided
    offer_context = ""
    if offer_data:
        # Handle pain_points that might be objects or strings
        pain_points_list = []
        for pp in (offer_data.get('pain_points') or []):
            if isinstance(pp, dict):
                pain_points_list.append(pp.get('point', str(pp)))
            else:
                pain_points_list.append(str(pp))
        
        # Handle proof_points that might be objects or strings
        proof_points_list = []
        for pp in (offer_data.get('proof_points') or []):
            if isinstance(pp, dict):
                proof_points_list.append(pp.get('point', str(pp)))
            else:
                proof_points_list.append(str(pp))
        
        # Handle benefits that might be objects or strings
        benefits_list = []
        for b in (offer_data.get('benefits') or []):
            if isinstance(b, dict):
                benefits_list.append(b.get('benefit', str(b)))
            else:
                benefits_list.append(str(b))
        
        offer_context = f"""

## Product/Offer Context

**Product Name:** {offer_data.get('product_service_name') or offer_data.get('name') or 'Not specified'}
**Value Proposition:** {offer_data.get('value_proposition') or 'Not specified'}
**Company Description:** {offer_data.get('company_description') or 'Not specified'}
**Call to Action:** {offer_data.get('call_to_action') or 'Not specified'}

### Pain Points We Solve
{chr(10).join(['- ' + pp for pp in pain_points_list]) if pain_points_list else '- Not specified'}

### Key Benefits
{chr(10).join(['- ' + b for b in benefits_list]) if benefits_list else '- Not specified'}

### Proof Points / Social Proof
{chr(10).join(['- ' + pp for pp in proof_points_list]) if proof_points_list else '- Not specified'}

**IMPORTANT:** The angles you generate MUST be based on this specific product/offer. 
Each angle should present a different way to position THIS product to the target ICP.
Use the proof points and benefits provided - do not make up generic statistics.
"""

    task_description = f"""
Analyze the following ICP and generate {num_angles} HIGHLY DIFFERENTIATED messaging angles.

{icp_context}
{offer_context}

## Your Task

Generate {num_angles} messaging angles that are:

1. **Psychologically Distinct** - Each angle should target a DIFFERENT psychological trigger:
   - **Fear/Risk**: "What happens if you don't act?"
   - **Greed/Gain**: "What could you achieve?"
   - **Pride/Status**: "Be seen as a leader"
   - **Exclusivity**: "Join the elite few"
   - **Urgency**: "The window is closing"
   - **Social Proof**: "Everyone else is doing this"

2. **Persona-Specific** - Tailor language to the specific job titles and seniority levels

3. **Problem-Centric** - Lead with the problem, not the solution

4. **Differentiated** - Each angle should feel like it's from a different company

5. **Actionable** - Include specific hooks that can be used in cold emails

## Output Requirements

For each angle, provide:
- **name**: Memorable 2-4 word name
- **description**: One sentence on when to use this angle
- **value_proposition**: 2-3 sentence core pitch using the buyer's language
- **pain_points**: 3 SPECIFIC pain points (not generic)
- **hooks**: 3 cold email opening lines that create curiosity
- **proof_points**: 2-3 credible social proof statements
- **tone**: professional, casual, urgent, consultative, or challenger
- **psychological_trigger**: The primary driver (fear, greed, pride, exclusivity, urgency, social_proof)
- **buyer_stage**: problem_aware, solution_aware, or product_aware

## Important Guidelines

- Do NOT use generic phrases like "streamline operations" or "drive growth"
- DO use specific, quantified outcomes where possible
- Hooks should create curiosity or pattern interrupt, not pitch
- Each angle should feel like it could be a completely different campaign
- Consider the buyer's internal politics and what makes them look good

Return your response as valid JSON matching the AngleGenerationOutput schema.
"""

    return Task(
        description=task_description,
        expected_output="A JSON object with 'angles' array and 'strategy_notes' string",
        agent=agent,
        output_pydantic=AngleGenerationOutput
    )


def create_angle_generation_crew(llm, icp_data: dict, num_angles: int = 3, existing_angles: List[str] = None, offer_data: dict = None):
    """Create the angle generation crew"""
    
    if existing_angles is None:
        existing_angles = []
    
    agent = create_angle_strategist_agent(llm)
    task = create_angle_generation_task(agent, icp_data, num_angles, existing_angles, offer_data)
    
    return Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )


def generate_angles(llm, icp_data: dict, num_angles: int = 3, existing_angles: List[str] = None, offer_data: dict = None) -> AngleGenerationOutput:
    """
    Generate messaging angles for an ICP using CrewAI.
    
    Args:
        llm: The language model to use
        icp_data: Dictionary containing ICP profile data
        num_angles: Number of angles to generate
        existing_angles: List of existing angle names to avoid duplicating
        offer_data: Dictionary containing offer/product context
    
    Returns:
        AngleGenerationOutput with generated angles and strategy notes
    """
    crew = create_angle_generation_crew(llm, icp_data, num_angles, existing_angles or [], offer_data)
    result = crew.kickoff()
    
    # Handle the result
    if hasattr(result, 'pydantic') and result.pydantic:
        return result.pydantic
    
    # Try to parse from raw output
    raw_output = str(result)
    
    # Find JSON in the output
    start = raw_output.find('{')
    end = raw_output.rfind('}') + 1
    
    if start != -1 and end > start:
        try:
            parsed = json.loads(raw_output[start:end])
            return AngleGenerationOutput(**parsed)
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse angle output: {e}")
    
    # Return empty result if parsing fails
    return AngleGenerationOutput(
        angles=[],
        strategy_notes="Failed to generate angles - please try again"
    )
