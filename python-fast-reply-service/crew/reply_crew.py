"""
Reply Crew - CrewAI configuration for classifying and replying to emails.
"""

from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
import os

def create_reply_crew():
    """Create a crew for processing email replies"""
    
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
    
    # Agent 1: Reply Analyzer
    analyzer = Agent(
        role="Email Reply Analyzer",
        goal="Analyze incoming email replies to understand sentiment, intent, and required action",
        backstory="""You are an expert sales communication analyst. You quickly read email replies 
        and classify them into categories like: positive interest, question, objection, 
        unsubscribe request, out of office, or not interested. You understand context and nuance.""",
        llm=llm,
        verbose=True
    )
    
    # Agent 2: Response Drafter
    drafter = Agent(
        role="Email Response Drafter",
        goal="Draft appropriate, personalized responses to email replies",
        backstory="""You are a skilled sales copywriter who writes natural, conversational emails.
        You maintain context from previous messages and match the tone of the conversation.
        You are concise but personable.""",
        llm=llm,
        verbose=True
    )
    
    # Tasks
    analyze_task = Task(
        description="""
        Analyze this email reply:
        
        EMAIL CONTENT: {email_content}
        LEAD CONTEXT: {lead_context}
        THREAD HISTORY: {thread_history}
        
        Provide a JSON response with:
        - sentiment: (positive, negative, neutral, unsubscribe)
        - intent: (meeting_request, question, objection, referral, not_interested, out_of_office, other)
        - urgency: (high, medium, low)
        - action_required: (reply, handoff, unsubscribe, ignore, follow_up_later)
        - key_points: list of main points from the email
        - confidence: number 0-1
        """,
        agent=analyzer,
        expected_output="JSON with sentiment, intent, urgency, action_required, key_points, confidence"
    )
    
    draft_task = Task(
        description="""
        Draft a response to this email reply:
        
        EMAIL CONTENT: {email_content}
        LEAD CONTEXT: {lead_context}
        THREAD HISTORY: {thread_history}
        ANALYSIS: (use previous task result)
        
        Write a natural, conversational reply that:
        - Addresses their specific points/questions
        - Matches the tone of the conversation
        - Is concise (2-4 short paragraphs max)
        - Has a clear next step or call to action
        - Does NOT use corporate jargon or overly salesy language
        
        Provide a JSON response with:
        - subject: suggested subject line (usually "Re: [original]")
        - body: the full email body
        - tone: description of the tone used
        - personalization_notes: what made this personalized
        """,
        agent=drafter,
        expected_output="JSON with subject, body, tone, personalization_notes"
    )
    
    # Create crew
    crew = Crew(
        agents=[analyzer, drafter],
        tasks=[analyze_task, draft_task],
        process=Process.sequential,
        verbose=True
    )
    
    return crew
