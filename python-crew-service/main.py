from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import httpx
import json
from datetime import datetime
from supabase import create_client, Client

# Load environment variables from parent directory (where .env files are located)
load_dotenv(dotenv_path='../.env')
load_dotenv(dotenv_path='../.env.local')

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

# Lead Enrichment
from agents.lead_enrichment_agent import lead_enricher_agent, lead_enrichment_task, create_lead_enrichment_crew
from agents.company_profile_agent import create_company_profile_crew
from crewai import Crew, Process

# JSON Lead Processing Routes
from routes.json_lead_upload import router as json_lead_router

# Unstructured Lead Processing
from endpoints.process_unstructured_lead import router as unstructured_lead_router

# Apollo Discovery
from endpoints.apollo_discovery import router as apollo_discovery_router

# Strategic Follow-up Agent
from agents.strategic_followup_agent import (
    StrategicFollowUpInput, StrategicFollowUpOutput, generate_strategic_followup
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

# Pydantic model for lead enrichment
from pydantic import BaseModel
from typing import Optional, Dict

class LeadEnrichmentRequest(BaseModel):
    email: str
    company_domain: Optional[str] = None
    lead_id: Optional[int] = None
    user_id: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None

class CompanyProfileRequest(BaseModel):
    company_name: str
    domain: str
    user_id: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None

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

        # 2. Use the message body sent from the webhook handler
        reply_text = ""
        thread_history = ""
        if request.message_id == 'test-simulation':
            print("--- RUNNING analyze-reply IN TEST SIMULATION MODE ---")
            reply_text = "That sounds interesting. Can you send over some more details?"
            thread_history = "User: Hey, are you free for a chat? Lead: That sounds interesting. Can you send over some more details?"
        else:
            # Use the message body that was already fetched by the webhook handler
            reply_text = request.message_body
            print(f"--- USING MESSAGE BODY FROM WEBHOOK: '{reply_text[:100]}...' ---")
            
            # Still fetch message details for thread_id if needed
            message_details = await fetch_nylas_message_details(request.grant_id, request.message_id)

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
        lead_res = supabase.table('leads').select('*').eq('user_id', request.user_id).eq('email', request.sender_email).execute()
        
        lead_id = None
        lead_context = "No existing lead context found."

        if lead_res.data:
            lead = lead_res.data[0]
            lead_id = lead['id']
            lead_context = str(lead)
        else:
            print(f"--- No lead found for email: {request.sender_email}. Skipping analysis. ---")
            return {"status": "skipped", "reason": "No matching lead found"}

        # 4. Create and run the Master Sales Crew to orchestrate a response
        print(f"--- ORCHESTRATING RESPONSE FOR: {request.sender_email} ---")
        reply_crew = create_reply_crew(
            llm=llm,
            email_reply=reply_text,
            lead_context=lead_context,
            thread_history=thread_history
        )
        result = reply_crew.kickoff()

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
        print(f"Lead Context: {request.lead_context}")
        
        email_crew = create_email_copywriter_crew(
            llm, request.name, request.title, request.company, 
            request.pain_points, request.offer, request.hook_snippet,
            request.lead_context
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
        crew = create_strategic_reflection_crew()
        result = crew.kickoff(inputs={
            'campaign_analytics': request.campaign_analytics,
            'time_period': request.time_period,
            'current_strategy': request.current_strategy
        })
        return StrategicReflectionResponse(recommendations=str(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Strategic reflection failed: {str(e)}")

@app.post("/generate-strategic-followup")
async def generate_strategic_followup_endpoint(request: StrategicFollowUpInput) -> StrategicFollowUpOutput:
    """Generate strategic follow-up email content based on lead engagement patterns"""
    try:
        print(f"Generating strategic follow-up for {request.lead_email}")
        print(f"Reason: {request.follow_up_reason}, Engagement: {request.engagement_level}")
        
        result = generate_strategic_followup(request)
        
        print(f"Generated follow-up - Subject: {result.subject}")
        return result
        
    except Exception as e:
        print(f"Error generating strategic follow-up: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Strategic follow-up generation failed: {str(e)}")

@app.post("/enrich-lead")
async def enrich_lead(request: LeadEnrichmentRequest):
    """Enrich a lead using multiple providers (Apollo, PDL, Serper, Clearbit, Hunter)"""
    try:
        print(f"--- ENRICHING LEAD: {request.email} ---")
        print(f"Available data: name={request.name}, company={request.company}, domain={request.company_domain}")
        
        # Create enrichment crew with user's API keys
        enrichment_crew = create_lead_enrichment_crew(
            lead_data={
                'email': request.email,
                'name': request.name,
                'company': request.company,
                'company_domain': request.company_domain
            },
            api_keys=request.api_keys or {}
        )
        
        # Prepare comprehensive inputs for the crew
        inputs = {
            "email": request.email or "",
            "linkedin_url": request.linkedin_url or "",
            "name": request.name or "",
            "company": request.company or "",
            "company_domain": request.company_domain or ""
        }
        
        print(f"Enrichment inputs: {inputs}")
        
        # Execute the enrichment
        result = enrichment_crew.kickoff(inputs=inputs)
        
        print(f"--- ENRICHMENT RESULT ---")
        print(result.raw)
        
        # Parse the lead enrichment result
        try:
            enriched_data = json.loads(result.raw)
            
            # Add metadata about the enrichment process
            enriched_data['enrichment_timestamp'] = json.loads(json.dumps(datetime.now(), default=str))
            enriched_data['input_data'] = {
                'email': request.email,
                'name': request.name,
                'company': request.company,
                'company_domain': request.company_domain,
                'linkedin_url': request.linkedin_url
            }
            
        except json.JSONDecodeError:
            # If the result isn't valid JSON, wrap it
            enriched_data = {
                "raw_output": str(result.raw),
                "primary_source": "none",
                "error": "Failed to parse enrichment result as JSON",
                "enrichment_timestamp": json.loads(json.dumps(datetime.now(), default=str))
            }
        
        # --- COMPANY PROFILE ENRICHMENT ---
        company_profile_data = {}
        if request.company and request.company_domain:
            try:
                print(f"--- ENRICHING COMPANY PROFILE: {request.company} ---")
                print(f"Domain: {request.company_domain}")
                
                # Create company profile crew with user's API keys
                company_crew = create_company_profile_crew(
                    company_data={
                        'company_name': request.company,
                        'domain': request.company_domain
                    },
                    api_keys=request.api_keys or {}
                )
                
                # Execute company profile enrichment
                company_inputs = {
                    "company_name": request.company,
                    "domain": request.company_domain
                }
                
                print(f"Company profile inputs: {company_inputs}")
                company_result = company_crew.kickoff(inputs=company_inputs)
                
                print(f"--- COMPANY PROFILE RESULT ---")
                print(company_result.raw)
                
                # Parse company profile result
                try:
                    company_profile_data = json.loads(company_result.raw)
                except json.JSONDecodeError:
                    company_profile_data = {
                        "raw_output": str(company_result.raw),
                        "error": "Failed to parse company profile result as JSON"
                    }
                    
            except Exception as e:
                print(f"Error during company profile enrichment: {e}")
                company_profile_data = {
                    "error": f"Company profile enrichment failed: {str(e)}"
                }
        else:
            print("Skipping company profile enrichment - missing company name or domain")
            company_profile_data = {
                "error": "Missing company name or domain for company profile enrichment"
            }
        
        # Combine lead and company data
        enriched_data['company_profile'] = company_profile_data
        
        return enriched_data
        
    except Exception as e:
        print(f"Error during lead enrichment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/company-profile")
async def company_profile(request: CompanyProfileRequest):
    """Generate company profile using ValueSERP and BuiltWith APIs"""
    try:
        print(f"--- GENERATING COMPANY PROFILE: {request.company_name} ---")
        print(f"Domain: {request.domain}")
        
        # Create company profile crew with user's API keys
        company_crew = create_company_profile_crew(
            company_data={
                'company_name': request.company_name,
                'domain': request.domain
            },
            api_keys=request.api_keys or {}
        )
        
        # Prepare inputs for the crew
        inputs = {
            "company_name": request.company_name,
            "domain": request.domain
        }
        
        print(f"Company profile inputs: {inputs}")
        
        # Execute the company profiling
        result = company_crew.kickoff(inputs=inputs)
        
        print(f"--- COMPANY PROFILE RESULT ---")
        print(result.raw)
        
        # Parse the result
        try:
            profile_data = json.loads(result.raw)
            
            # Add metadata about the profiling process
            profile_data['profile_timestamp'] = json.loads(json.dumps(datetime.now(), default=str))
            profile_data['input_data'] = {
                'company_name': request.company_name,
                'domain': request.domain
            }
            
            return profile_data
            
        except json.JSONDecodeError:
            # If JSON parsing fails, return raw result
            return {
                "snippet": result.raw,
                "techStack": [],
                "profile_timestamp": json.loads(json.dumps(datetime.now(), default=str)),
                "input_data": {
                    'company_name': request.company_name,
                    'domain': request.domain
                },
                "parsing_error": "Failed to parse JSON from crew result"
            }
            
    except Exception as e:
        print(f"Error during company profiling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Apollo Discovery
from agents.apollo_discovery_agent import create_apollo_discovery_agent

@app.post("/apollo/discover")
async def apollo_discover(request: dict):
    """Discover leads using Apollo API based on ICP criteria - Direct execution"""
    try:
        print(f"--- APOLLO LEAD DISCOVERY (DIRECT) ---")
        print(f"ICP Criteria: {request.get('icp_criteria', {})}")
        print(f"Max Results: {request.get('max_results', 100)}")
        
        icp_criteria = request.get('icp_criteria', {})
        max_results = request.get('max_results', 100)
        session_id = request.get('session_id')
        
        # Create Apollo discovery agent and execute directly
        discovery_agent = create_apollo_discovery_agent(llm)
        
        # Execute direct discovery (bypassing CrewAI to avoid hallucination)
        discovery_data = discovery_agent.discover_leads(icp_criteria, max_results)
        
        print(f"--- APOLLO DISCOVERY RESULT ---")
        print(f"Success: {discovery_data.get('success')}")
        print(f"Total discovered: {discovery_data.get('total_discovered', 0)}")
        print(f"Query used: {discovery_data.get('query_used', {})}")
        
        # Add metadata about the discovery process
        discovery_data['session_id'] = session_id
        discovery_data['discovery_timestamp'] = json.loads(json.dumps(datetime.now(), default=str))
        discovery_data['icp_criteria_used'] = icp_criteria
        
        return discovery_data
            
    except Exception as e:
        print(f"Error during Apollo discovery: {e}")
        return {
            "success": False,
            "error": f"Apollo discovery failed: {str(e)}",
            "total_discovered": 0,
            "leads": []
        }

# Register routers
app.include_router(json_lead_router)
app.include_router(unstructured_lead_router)
app.include_router(apollo_discovery_router)

@app.get("/")
async def root():
    return {"status": "running"}
