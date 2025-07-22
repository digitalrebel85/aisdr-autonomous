from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import httpx
import json
from supabase import create_client, Client

# LLM Configuration
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI

# Schemas (Pydantic Models)
from schemas import (
    MessageDetailsRequest, AnalysisRequest, AnalysisResult,
    FollowUpRequest, FollowUpResult,
    EmailCopywritingRequest, EmailCopywritingResult,
    VisitorIntelRequest, VisitorIntelResponse,
    StrategicReflectionRequest, StrategicReflectionResponse
)

# Crew Creators
from crew.master_sales_crew import create_master_sales_crew
from crew.reply_crew import create_reply_crew
from crew.follow_up_crew import create_follow_up_crew
from crew.email_copywriter_crew import create_email_copywriter_crew
from crew.visitor_intel_crew import create_visitor_intel_crew
from crew.strategic_reflection_crew import create_strategic_reflection_crew

# Tools
from tools.nylas_tools import get_message_details as fetch_nylas_message_details
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
    # 'SNITCHER_API_KEY' is now optional
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

# Helper function to extract JSON from a string
def extract_json_from_string(s):
    # Find the start and end of the JSON block
    start = s.find('{')
    end = s.rfind('}') + 1
    if start == -1 or end == 0:
        return None
    json_str = s[start:end]
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return None

# --- API Endpoints ---

@app.post("/get-message-details")
async def get_message_details(request: MessageDetailsRequest):
    supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
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

        # Call the renamed function to fetch details from Nylas
        message_details = await fetch_nylas_message_details(request.grant_id, request.message_id)
        return message_details

    except Exception as e:
        print(f"Error getting message details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-reply")
async def analyze_reply(request: AnalysisRequest):
    supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
    try:
        # 1. Get user's Nylas access token from Supabase
        inbox_res = supabase.table('connected_inboxes').select('access_token').eq('grant_id', request.grant_id).single().execute()
        if not inbox_res.data:
            raise HTTPException(status_code=404, detail="Inbox not found for grant_id.")
        access_token = inbox_res.data['access_token']

        # 2. Fetch message details and thread history from Nylas
        reply_text = ""
        thread_history = ""
        if request.message_id == 'test-simulation':
            print("--- RUNNING analyze-reply IN TEST SIMULATION MODE ---")
            reply_text = "That sounds interesting. Can you send over some more details?"
            thread_history = "User: Hey, are you free for a chat? Lead: That sounds interesting. Can you send over some more details?"
        else:
            # Fetch the specific message that triggered the webhook to get the reply text
            message_details = await fetch_nylas_message_details(request.grant_id, request.message_id)
            reply_text = message_details.get('snippet', '')

            # Fetch the full thread for context
            async with httpx.AsyncClient() as client:
                nylas_api_server = os.getenv('NYLAS_API_SERVER')
                headers = {
                    "Authorization": f"Bearer {os.getenv('NYLAS_API_KEY')}",
                    "Accept": "application/json"
                }
                # Fetch the full thread using the thread_id from the message
                thread_id = message_details.get('thread_id')
                if not thread_id:
                    # If thread_id is still not found, it might be a new email not yet in a thread.
                    # In this case, we can treat the single message as the entire thread history.
                    thread_history = [{
                        'snippet': message_details.get('snippet', ''),
                        'from': message_details.get('from', [])
                    }]
                else:
                    thread_res = await client.get(f"{nylas_api_server}/v3/grants/{request.grant_id}/threads/{thread_id}?view=expanded", headers=headers)
                    thread_res.raise_for_status()
                    thread_history = thread_res.json()

        # 3. Find the lead_id and get lead context from Supabase
        lead_res = supabase.table('leads').select('*').eq('user_id', request.user_id).eq('email', request.sender_email).single().execute()
        if not lead_res.data:
            raise HTTPException(status_code=404, detail=f"Lead not found for email: {request.sender_email}")
        lead = lead_res.data
        lead_id = lead['id'] # This is the primary key, which we need.

        # 4. Create and run the Master Sales Crew to orchestrate a response
        company_domain = request.sender_email.split('@')[1]
        print(f"--- ORCHESTRATING RESPONSE FOR: {request.sender_email} ---")

        master_crew = create_master_sales_crew(
            llm=llm, 
            company_domain=company_domain, 
            email_reply=reply_text,
            lead_context=str(lead),
            thread_history=thread_history
        )
        result = master_crew.kickoff()

        print(f"--- CREW RESULT ---\n{result.raw}")

        # The master agent's final output is a JSON string.
        # We need to parse it to send it back as a proper JSON object.
        try:
            crew_output = json.loads(result.raw)
        except json.JSONDecodeError:
            # Handle cases where the LLM doesn't return valid JSON
            crew_output = {
                "drafted_reply": result.raw,
                "agent_reasoning": "The agent did not return valid JSON. Raw output is provided as the draft."
            }

        crew_output['lead_id'] = lead_id
        return crew_output

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
        print(f"--- RAW CREW RESULT ---\n{result.raw}")

        # Extract JSON from the raw result string
        json_result = extract_json_from_string(result.raw)
        if not json_result:
            raise HTTPException(status_code=500, detail="Failed to parse JSON from crew result.")

        # Validate and return the result
        result = EmailCopywritingResult.model_validate(json_result)
        return result

    except Exception as e:
        print(f"Error during cold email generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resolve-ip", response_model=VisitorIntelResponse)
async def resolve_ip(request: VisitorIntelRequest):
    if not os.getenv('SNITCHER_API_KEY'):
        raise HTTPException(
            status_code=400,
            detail="Visitor IP resolution feature is disabled. Please set the SNITCHER_API_KEY."
        )
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

@app.post("/run-strategic-reflection", response_model=StrategicReflectionResponse)
async def run_strategic_reflection(request: StrategicReflectionRequest):
    try:
        print(f"--- RUNNING STRATEGIC REFLECTION FOR USER: {request.user_id} ---")
        strategic_crew = create_strategic_reflection_crew(llm, request.user_id)
        result = strategic_crew.kickoff()
        
        # The final output should be a JSON string from the agent
        return StrategicReflectionResponse.model_validate_json(result.raw)

    except Exception as e:
        print(f"Error during strategic reflection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "running"}
