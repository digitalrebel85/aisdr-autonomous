from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import requests

# LLM Configuration
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI

# Schemas (Pydantic Models)
from schemas import (
    MessageDetailsRequest, AnalysisRequest, AnalysisResult,
    FollowUpRequest, FollowUpResult,
    EmailCopywritingRequest, EmailCopywritingResult,
    VisitorIntelRequest, VisitorIntelResponse
)

# Crew Creators
from crew.reply_crew import create_reply_crew
from crew.follow_up_crew import create_follow_up_crew
from crew.email_copywriter_crew import create_email_copywriter_crew
from crew.visitor_intel_crew import create_visitor_intel_crew

# Tools
from tools.nylas_tools import get_nylas_data, get_message_details
from tools.supabase_tools import get_lead_by_email

# --- FastAPI App Initialization ---
app = FastAPI(
    title="CrewAI Advanced Email Analysis Service",
    description="A service to analyze email replies using a context-aware CrewAI agent.",
)

# --- Environment Variable Loading & Validation ---
load_dotenv()

required_env_vars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'NYLAS_API_KEY',
    'NYLAS_API_SERVER',
    'SNITCHER_API_KEY',
]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
if not os.getenv('DEEPSEEK_API_KEY') and not os.getenv('OPENAI_API_KEY'):
    raise ValueError("Missing LLM API key: Please set either DEEPSEEK_API_KEY or OPENAI_API_KEY")

# --- LLM Configuration ---
llm = None
if os.getenv('DEEPSEEK_API_KEY'):
    print("INFO: Using DeepSeek LLM")
    llm = ChatDeepSeek(model="deepseek-chat", temperature=0, api_key=os.getenv('DEEPSEEK_API_KEY'))
    if hasattr(llm, 'api_key') and llm.api_key:
        llm.api_key = llm.api_key.get_secret_value()
else:
    print("INFO: Using OpenAI LLM")
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0, api_key=os.getenv('OPENAI_API_KEY'))

# --- API Endpoints ---

@app.post("/get-message-details")
async def get_message_details(request: MessageDetailsRequest):
    try:
        # In test mode, return a realistic mock message object
        if request.message_id == 'test-simulation':
            print("--- RUNNING get-message-details IN TEST SIMULATION MODE ---")
            return {
                'id': 'test-simulation',
                'grant_id': request.grant_id,
                'from': [{'name': 'Test Lead', 'email': 'chris@summitleadgeneration.com'}],
                'to': [{'name': 'Test User', 'email': 'user@example.com'}],
                'snippet': 'That sounds interesting. Can you send over some more details?',
                'thread_id': 'mock_thread_123',
                'date': 1672531200 # 2023-01-01
            }

        inbox_res = supabase.table('connected_inboxes').select('access_token').eq('grant_id', request.grant_id).single().execute()
        if not inbox_res.data:
            raise HTTPException(status_code=404, detail="Inbox not found for grant_id.")
        access_token = inbox_res.data['access_token']

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{NYLAS_API_SERVER}/v3/grants/{request.grant_id}/messages/{request.message_id}", headers=headers)
            res.raise_for_status()
            return res.json()
    except Exception as e:
        print(f"Error fetching message details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-reply", response_model=AnalysisResult)
async def analyze_reply(request: AnalysisRequest):
    try:
        # 1. Get user's Nylas access token from Supabase
        inbox_res = supabase.table('connected_inboxes').select('access_token').eq('grant_id', request.grant_id).single().execute()
        if not inbox_res.data:
            raise HTTPException(status_code=404, detail="Inbox not found for grant_id.")
        access_token = inbox_res.data['access_token']

        # 2. Fetch message details and thread history from Nylas
        if request.message_id == 'test-simulation':
            print("--- RUNNING analyze-reply IN TEST SIMULATION MODE ---")
            message = {
                'snippet': 'That sounds interesting. Can you send over some more details?',
                'thread_id': 'mock_thread_123'
            }
            thread_history = "User: Hey, are you free for a chat? Lead: That sounds interesting. Can you send over some more details?"
        else:
            message, thread_history = await get_nylas_data(request.grant_id, access_token, request.message_id)
        reply_text = message.get('snippet', '')

        # 3. Find the lead_id and get lead context from Supabase
        lead_res = supabase.table('leads').select('*').eq('user_id', request.user_id).eq('email', request.sender_email).single().execute()
        if not lead_res.data:
            raise HTTPException(status_code=404, detail=f"Lead not found for email: {request.sender_email}")
        lead = lead_res.data
        lead_id = lead['id'] # This is the primary key, which we need.

        # 4. Create and configure the CrewAI agent and task
        reply_crew = create_reply_crew(llm, str(lead), thread_history, reply_text)

        # 5. Run the Crew
        result = reply_crew.kickoff()

        # The result from kickoff is a CrewOutput object. The raw JSON string is in the .raw attribute.
        analysis = AnalysisResult.model_validate_json(result.raw)

        # 6. Return the structured analysis, ensuring the lead_id is set correctly
        # The Pydantic model from the agent should have the correct lead_id, but we'll set it here to be certain.
        analysis.lead_id = lead_id
        print(f"DEBUG: Returning analysis for lead_id: {analysis.lead_id}")
        return analysis

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-follow-up", response_model=FollowUpResult)
async def generate_follow_up(request: FollowUpRequest):
    try:
        print("--- GENERATING FOLLOW-UP EMAIL ---")
        follow_up_crew = create_follow_up_crew(llm, request.lead_context, request.thread_history)
        result = follow_up_crew.kickoff()
        return FollowUpResult.model_validate_json(result.raw)

    except Exception as e:
        print(f"Error during follow-up generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cold-email", response_model=EmailCopywritingResult)
async def generate_cold_email(request: EmailCopywritingRequest):
    try:
        print("--- GENERATING COLD EMAIL ---")
        email_crew = create_email_copywriter_crew(
            llm, request.name, request.title, request.company, 
            request.pain_points, request.offer, request.hook_snippet
        )
        result = email_crew.kickoff()
        return EmailCopywritingResult.model_validate_json(result.raw)

    except Exception as e:
        print(f"Error during cold email generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resolve-ip", response_model=VisitorIntelResponse)
async def resolve_ip(request: VisitorIntelRequest):
    try:
        print(f"--- RESOLVING IP ADDRESS: {request.ip} ---")
        intel_crew = create_visitor_intel_crew(llm, request.ip)
        result = intel_crew.kickoff()
        return VisitorIntelResponse.model_validate_json(result.raw)

    except Exception as e:
        print(f"Error during IP resolution: {e}")
        if "No company found" in str(e):
            return VisitorIntelResponse(companyDomain=None, companyName=None)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "running"}
