"""
Strategic Follow-up Agent
Generates contextual follow-up emails based on engagement patterns and lead behavior
"""

from crewai import Agent, Task, Crew
from pydantic import BaseModel
from typing import List, Optional
import os

# Pydantic models for input/output
class StrategicFollowUpInput(BaseModel):
    lead_name: Optional[str]
    lead_email: str
    company: Optional[str]
    engagement_level: str  # cold, warm, hot, interested, not_interested
    follow_up_reason: str  # no_reply_initial, conversation_stalled, interested_no_call, etc.
    follow_up_number: int  # 1st, 2nd, 3rd follow-up
    pain_points: Optional[List[str]]
    offer: Optional[str]
    cta: Optional[str]

class StrategicFollowUpOutput(BaseModel):
    subject: str
    email_content: str
    follow_up_strategy: str
    tone: str
    timing_rationale: str

def create_strategic_followup_agent():
    """Creates the Strategic Follow-up Agent"""
    
    # Determine which LLM to use based on environment
    llm_config = {
        "model": "deepseek-chat",
        "base_url": "https://api.deepseek.com",
        "api_key": os.getenv("DEEPSEEK_API_KEY")
    }
    
    return Agent(
        role="Strategic Follow-up Specialist",
        goal="Generate highly contextual and strategic follow-up emails that re-engage leads based on their specific behavior patterns and engagement history",
        backstory="""You are an expert sales follow-up strategist with deep understanding of buyer psychology 
        and engagement patterns. You craft follow-up emails that feel personal, timely, and valuable rather than 
        pushy or generic. You understand that different engagement levels and follow-up reasons require completely 
        different approaches and messaging strategies.""",
        verbose=True,
        llm=llm_config
    )

def create_strategic_followup_task(agent, input_data: StrategicFollowUpInput):
    """Creates the strategic follow-up task"""
    
    # Build context based on follow-up reason
    context_mapping = {
        "no_reply_initial": "The lead hasn't responded to the initial outreach. Focus on providing additional value and a different angle.",
        "conversation_stalled": "The lead was engaged but the conversation has stalled. Acknowledge the previous interaction and provide a gentle nudge.",
        "interested_no_call": "The lead showed interest but hasn't booked a call yet. Focus on removing barriers and making scheduling easy.",
        "warm_lead_quiet": "A warm lead has gone quiet. Re-engage with valuable content and check if priorities have changed.",
        "cold_follow_up": "Following up on a cold lead. Provide new value and approach from a different angle."
    }
    
    engagement_guidance = {
        "cold": "Professional but warm tone. Focus on education and value. No pressure.",
        "warm": "Friendly and conversational. Reference previous interactions if any. Provide helpful resources.",
        "hot": "Direct but not pushy. Focus on next steps and removing barriers.",
        "interested": "Enthusiastic but professional. Make it easy to take action. Address potential concerns."
    }
    
    follow_up_context = context_mapping.get(input_data.follow_up_reason, "General follow-up")
    tone_guidance = engagement_guidance.get(input_data.engagement_level, "Professional")
    
    # Build pain points context
    pain_points_text = ""
    if input_data.pain_points:
        pain_points_text = f"Known pain points: {', '.join(input_data.pain_points)}"
    
    return Task(
        description=f"""
        Generate a strategic follow-up email for this lead:
        
        LEAD CONTEXT:
        - Name: {input_data.lead_name or 'Not provided'}
        - Email: {input_data.lead_email}
        - Company: {input_data.company or 'Not provided'}
        - Engagement Level: {input_data.engagement_level}
        - Follow-up Reason: {input_data.follow_up_reason}
        - Follow-up Number: {input_data.follow_up_number}
        - {pain_points_text}
        - Offer: {input_data.offer or 'Not provided'}
        - CTA: {input_data.cta or 'Not provided'}
        
        STRATEGIC CONTEXT:
        {follow_up_context}
        
        TONE GUIDANCE:
        {tone_guidance}
        
        REQUIREMENTS:
        1. Create a compelling subject line that stands out in the inbox
        2. Write a personalized email that feels human and valuable
        3. Address the specific follow-up reason appropriately
        4. Include a clear but non-pushy call-to-action
        5. Match the tone to the engagement level
        6. Keep it concise but valuable (150-250 words)
        7. Make it feel like a natural continuation of the relationship
        
        FOLLOW-UP STRATEGY CONSIDERATIONS:
        - For "no_reply_initial": Try a different value proposition or angle
        - For "conversation_stalled": Acknowledge previous interaction, provide new value
        - For "interested_no_call": Remove friction, make scheduling easy
        - For "warm_lead_quiet": Check in genuinely, offer help
        - For "cold_follow_up": Provide significant new value
        
        AVOID:
        - Generic templates or obvious automation
        - Being pushy or aggressive
        - Repeating the exact same message as before
        - Making assumptions about their situation
        - Using too much sales jargon
        
        Return the response in this exact format:
        Subject: [compelling subject line]
        
        Email Content:
        [personalized email body]
        
        Strategy: [brief explanation of the approach taken]
        Tone: [tone used and why]
        Timing Rationale: [why this timing and approach makes sense]
        """,
        expected_output="A strategic follow-up email with subject line, personalized content, and strategic rationale",
        agent=agent
    )

def generate_strategic_followup(input_data: StrategicFollowUpInput) -> StrategicFollowUpOutput:
    """Generate strategic follow-up email content"""
    
    # Create agent and task
    agent = create_strategic_followup_agent()
    task = create_strategic_followup_task(agent, input_data)
    
    # Create and run crew
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True
    )
    
    # Execute the task
    result = crew.kickoff()
    
    # Parse the result
    content = str(result)
    
    # Extract components from the formatted response
    lines = content.split('\n')
    subject = ""
    email_content = ""
    strategy = ""
    tone = ""
    timing_rationale = ""
    
    current_section = None
    content_lines = []
    
    for line in lines:
        line = line.strip()
        if line.startswith("Subject:"):
            subject = line.replace("Subject:", "").strip()
            current_section = "subject"
        elif line.startswith("Email Content:"):
            current_section = "email"
            content_lines = []
        elif line.startswith("Strategy:"):
            if current_section == "email":
                email_content = "\n".join(content_lines).strip()
            strategy = line.replace("Strategy:", "").strip()
            current_section = "strategy"
        elif line.startswith("Tone:"):
            tone = line.replace("Tone:", "").strip()
            current_section = "tone"
        elif line.startswith("Timing Rationale:"):
            timing_rationale = line.replace("Timing Rationale:", "").strip()
            current_section = "timing"
        elif current_section == "email" and line:
            content_lines.append(line)
    
    # Ensure email content is captured if it's the last section
    if current_section == "email":
        email_content = "\n".join(content_lines).strip()
    
    # Fallback parsing if structured format wasn't followed
    if not subject or not email_content:
        # Try to extract from unstructured content
        if "Subject:" in content:
            subject_start = content.find("Subject:") + 8
            subject_end = content.find("\n", subject_start)
            subject = content[subject_start:subject_end].strip()
        
        if not email_content:
            # Use the main content as email body
            email_content = content
    
    return StrategicFollowUpOutput(
        subject=subject or f"Following up on our conversation - {input_data.company or 'your business'}",
        email_content=email_content or content,
        follow_up_strategy=strategy or f"Strategic follow-up for {input_data.follow_up_reason}",
        tone=tone or f"Matched to {input_data.engagement_level} engagement level",
        timing_rationale=timing_rationale or f"Follow-up #{input_data.follow_up_number} based on {input_data.follow_up_reason}"
    )
