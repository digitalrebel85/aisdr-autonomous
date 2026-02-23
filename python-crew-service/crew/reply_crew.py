"""
Reply Crew for AISDR
Handles classification and drafting of email replies
"""

from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
import os

def create_reply_crew():
    """Create crew for processing email replies"""
    
    # Initialize LLM
    if os.getenv('DEEPSEEK_API_KEY'):
        llm = ChatDeepSeek(
            model="deepseek-chat",
            temperature=0.3,
            api_key=os.getenv('DEEPSEEK_API_KEY')
        )
    else:
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.3,
            api_key=os.getenv('OPENAI_API_KEY')
        )
    
    # Analyzer Agent
    analyzer = Agent(
        role="Reply Analyzer",
        goal="Analyze email replies to understand intent and sentiment",
        backstory="""You are an expert at reading between the lines in sales emails.
        You quickly classify replies as: positive (interested), question (needs answer),
        objection (concern to address), unsubscribe (opt-out), or not interested.
        You understand nuance and context.""",
        llm=llm,
        verbose=True
    )
    
    # Drafter Agent
    drafter = Agent(
        role="Reply Drafter",
        goal="Write personalized, natural email responses",
        backstory="""You are a skilled sales communicator who writes emails that sound human.
        You are concise, friendly, and always address the specific points raised.
        You avoid corporate jargon and sales-speak.""",
        llm=llm,
        verbose=True
    )
    
    # Tasks
    analyze_task = Task(
        description="""
        Analyze this email reply:
        
        FROM: {from_email}
        SUBJECT: {subject}
        CONTENT: {email_content}
        
        LEAD INFO:
        Name: {lead_name}
        Company: {lead_company}
        Title: {lead_title}
        
        Classify:
        1. Sentiment: positive, neutral, negative, or unsubscribe
        2. Intent: meeting_request, question, objection, referral, not_interested, other
        3. Urgency: high, medium, low
        4. Action: reply, handoff_to_human, unsubscribe, ignore
        
        Return JSON with: sentiment, intent, urgency, action, reasoning
        """,
        agent=analyzer,
        expected_output="JSON classification of the reply"
    )
    
    draft_task = Task(
        description="""
        Draft a response to this email:
        
        ORIGINAL EMAIL: {email_content}
        CLASSIFICATION: (from previous analysis)
        
        Write a reply that:
        - Addresses their specific points directly
        - Matches a natural, conversational tone
        - Is 2-4 short paragraphs maximum
        - Has a clear next step or question
        - Sounds like it was written by a human, not AI
        
        Return JSON with: draft (the email text), tone, key_points_addressed
        """,
        agent=drafter,
        expected_output="JSON with drafted reply"
    )
    
    crew = Crew(
        agents=[analyzer, drafter],
        tasks=[analyze_task, draft_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew
