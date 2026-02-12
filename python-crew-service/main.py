from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
from agents.lead_enrichment_agent import lead_enricher_agent, lead_enrichment_task, create_lead_enrichment_crew, USER_API_KEYS as LEAD_API_KEYS
from agents.company_profile_agent import create_company_profile_crew, run_company_profile, USER_API_KEYS as COMPANY_API_KEYS
from agents.website_scraper_agent import run_website_analysis
from crewai import Crew, Process

# JSON Lead Processing Routes
from routes.json_lead_upload import router as json_lead_router

# Unstructured Lead Processing
from endpoints.process_unstructured_lead import router as unstructured_lead_router

# Apollo Discovery
from endpoints.apollo_discovery import router as apollo_discovery_router

# Campaign Strategy Analysis
from routes.campaign_strategy import router as campaign_strategy_router

# Test Strategy Decision Engine
from routes.test_strategy import router as test_strategy_router

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
from typing import Optional, Dict, List

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

class ICPProfile(BaseModel):
    name: str
    description: Optional[str] = None
    industries: Optional[List[str]] = []
    company_sizes: Optional[List[str]] = []
    job_titles: Optional[List[str]] = []
    seniority_levels: Optional[List[str]] = []
    departments: Optional[List[str]] = []
    technologies: Optional[List[str]] = []
    pain_points: Optional[List[str]] = []
    keywords: Optional[List[str]] = []
    locations: Optional[List[str]] = []

class OfferContext(BaseModel):
    name: Optional[str] = None
    product_service_name: Optional[str] = None
    value_proposition: Optional[str] = None
    company_description: Optional[str] = None
    pain_points: Optional[List[str]] = []
    benefits: Optional[List[str]] = []
    proof_points: Optional[List[str]] = []
    call_to_action: Optional[str] = None

class GenerateAnglesRequest(BaseModel):
    icp_profile: ICPProfile
    offer: Optional[OfferContext] = None
    number_of_angles: Optional[int] = 3
    existing_angles: Optional[List[str]] = []

class GeneratedAngle(BaseModel):
    name: str
    description: str
    value_proposition: str
    pain_points: List[str]
    hooks: List[str]
    proof_points: List[str]
    tone: str

class GenerateAnglesResponse(BaseModel):
    angles: List[GeneratedAngle]

class CompanyProfileRequest(BaseModel):
    company_name: str
    domain: str
    user_id: Optional[str] = None
    api_keys: Optional[Dict[str, str]] = None

class WebsiteAnalysisRequest(BaseModel):
    domain: str
    company_name: Optional[str] = None

# --- FastAPI App Initialization ---
app = FastAPI(
    title="CrewAI Advanced Email Analysis Service",
    description="A service to analyze email replies using a context-aware CrewAI agent.",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
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

        # 4. Stage 1: Classify the reply using the Reply Crew
        print(f"--- STAGE 1: CLASSIFYING REPLY FROM: {request.sender_email} ---")
        reply_crew = create_reply_crew(
            llm=llm,
            email_reply=reply_text,
            lead_context=lead_context,
            thread_history=thread_history
        )
        result = reply_crew.kickoff()

        print(f"--- CLASSIFICATION RESULT ---\n{result.raw}")

        # Parse classification result
        try:
            crew_output = json.loads(result.raw)
        except json.JSONDecodeError:
            crew_output = {
                "sentiment": "neutral",
                "action": "reply",
                "summary": result.raw[:200],
                "nextStepPrompt": result.raw,
                "agent_reasoning": "Classification did not return valid JSON."
            }

        crew_output['lead_id'] = lead_id

        # 5. Stage 2: If reply is needed, generate a proper email using the Master Sales Crew
        actions_needing_reply = ['reply', 'follow_up', 'schedule_call']
        if crew_output.get('action') in actions_needing_reply:
            print(f"--- STAGE 2: GENERATING REPLY EMAIL VIA MASTER SALES CREW ---")
            try:
                # Get company domain from lead data
                company_domain = ""
                if lead_res.data:
                    company_domain = lead_res.data[0].get('company_domain', '') or lead_res.data[0].get('company', '')

                master_crew = create_master_sales_crew(
                    llm=llm,
                    company_domain=company_domain,
                    email_reply=reply_text,
                    lead_context=lead_context,
                    thread_history=str(thread_history)
                )
                master_result = master_crew.kickoff()
                print(f"--- MASTER CREW RESULT ---\n{str(master_result.raw)[:500]}")

                # Parse the master crew's drafted reply
                try:
                    master_output = json.loads(master_result.raw)
                    if master_output.get('drafted_reply'):
                        crew_output['nextStepPrompt'] = master_output['drafted_reply']
                        crew_output['agent_reasoning'] = master_output.get('agent_reasoning', '')
                        print("--- Using Master Sales Crew drafted reply ---")
                except json.JSONDecodeError:
                    # If master crew returns raw text, use it as the reply
                    raw_reply = str(master_result.raw).strip()
                    if len(raw_reply) > 50:  # Only use if substantial
                        crew_output['nextStepPrompt'] = raw_reply
                        print("--- Using Master Sales Crew raw output as reply ---")

            except Exception as master_err:
                print(f"--- Master Sales Crew failed, falling back to classifier reply: {master_err} ---")
                # Fall back to the classifier's nextStepPrompt (better than nothing)

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
        print(f"Step {request.step_number}/{request.total_steps} | Objective: {request.objective}")
        print(f"Lead: {request.name} at {request.company}")
        
        email_crew = create_email_copywriter_crew(
            llm=llm,
            name=request.name,
            title=request.title,
            company=request.company,
            pain_points=request.pain_points,
            offer=request.offer,
            hook_snippet=request.hook_snippet,
            lead_context=request.lead_context,
            step_number=request.step_number,
            total_steps=request.total_steps,
            objective=request.objective,
            framework=request.framework,
            first_name=request.first_name
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

class StrategicReflectionByUserRequest(BaseModel):
    user_id: str

@app.post("/strategic-reflection")
async def strategic_reflection_by_user(request: StrategicReflectionByUserRequest):
    """
    Run AI strategic reflection for a user. Uses the CampaignMetricsTool to auto-fetch
    performance data from Supabase, then generates insights and recommendations.
    Called by the daily performance loop cron.
    """
    try:
        crew = create_strategic_reflection_crew(llm=llm, user_id=request.user_id)
        result = crew.kickoff()
        
        # Try to parse JSON from result
        raw = str(result)
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > start:
            try:
                import json as json_mod
                parsed = json_mod.loads(raw[start:end])
                return {
                    "summary": parsed.get("summary", raw),
                    "recommendations": parsed.get("recommendations", [])
                }
            except:
                pass
        
        return {
            "summary": raw[:500],
            "recommendations": []
        }
    except Exception as e:
        print(f"Strategic reflection error for user {request.user_id}: {e}")
        return {
            "summary": f"Reflection failed: {str(e)}",
            "recommendations": []
        }

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
        
        # Set API keys for the enrichment agent
        from agents.lead_enrichment_agent import USER_API_KEYS as LEAD_API_KEYS, multi_provider_enrichment
        LEAD_API_KEYS.clear()
        LEAD_API_KEYS.update(request.api_keys or {})
        
        # Call the enrichment function directly (bypasses LLM reformatting which drops organization_data)
        print(f"Enrichment inputs: email={request.email}, linkedin_url={request.linkedin_url}, name={request.name}, company={request.company}, domain={request.company_domain}")
        
        enriched_data = multi_provider_enrichment.func(
            email=request.email or None,
            linkedin_url=request.linkedin_url or None,
            name=request.name or None,
            company=request.company or None,
            company_domain=request.company_domain or None
        )
        
        print(f"--- ENRICHMENT RESULT ---")
        print(json.dumps(enriched_data, indent=2, default=str))
        
        # Add metadata about the enrichment process
        enriched_data['enrichment_timestamp'] = json.loads(json.dumps(datetime.now(), default=str))
        enriched_data['input_data'] = {
            'email': request.email,
            'name': request.name,
            'company': request.company,
            'company_domain': request.company_domain,
            'linkedin_url': request.linkedin_url
        }
        
        # --- COMPANY PROFILE ENRICHMENT ---
        company_profile_data = {}
        
        # Try to get company name and domain from multiple sources:
        # 1. Request params (user provided)
        # 2. Apollo enrichment result (organization.website_url or primary_domain)
        # 3. Enriched data company field
        
        company_name = request.company or enriched_data.get('company')
        company_domain = request.company_domain
        
        # Extract domain from Apollo's organization data if available
        # Check multiple locations: organization_data (normalized), all_sources.apollo
        if not company_domain:
            from urllib.parse import urlparse
            
            # First try the normalized organization_data field
            org_data = enriched_data.get('organization_data', {})
            print(f"Checking organization_data: {bool(org_data)}")
            
            # If not found, try all_sources.apollo (multiple paths)
            if not org_data:
                apollo_data = enriched_data.get('all_sources', {}).get('apollo', {})
                print(f"Checking all_sources.apollo: {bool(apollo_data)}, keys: {list(apollo_data.keys()) if apollo_data else []}")
                
                # Try direct organization first
                org_data = apollo_data.get('organization', {})
                
                # If not found, try under person
                if not org_data:
                    person_data = apollo_data.get('person', {})
                    print(f"Checking person data: {bool(person_data)}, keys: {list(person_data.keys()) if person_data else []}")
                    org_data = person_data.get('organization', {})
                    
                    # If still not found, we need to fetch org data from Apollo using the organization_id
                    if not org_data and person_data.get('organization_id'):
                        org_id = person_data.get('organization_id')
                        print(f"No org data in person, but found organization_id: {org_id}")
                        # We'll extract what we can from employment_history
                        employment = person_data.get('employment_history', [])
                        if employment:
                            current_job = next((e for e in employment if e.get('current')), employment[0] if employment else {})
                            org_name = current_job.get('organization_name')
                            if org_name:
                                company_name = org_name
                                print(f"Extracted company name from employment_history: {company_name}")
            
            print(f"Organization data found: {bool(org_data)}, keys: {list(org_data.keys()) if org_data else []}")
            
            # Try primary_domain first (cleaner), then website_url
            primary_domain = org_data.get('primary_domain', '')
            website_url = org_data.get('website_url', '')
            
            if primary_domain:
                company_domain = primary_domain.replace('www.', '').strip('/')
                print(f"Extracted domain from primary_domain: {company_domain}")
            elif website_url:
                # Extract domain from URL (e.g., "http://www.transparity.com" -> "transparity.com")
                parsed = urlparse(website_url)
                domain = parsed.netloc or parsed.path
                # Remove www. prefix if present
                company_domain = domain.replace('www.', '').strip('/')
                print(f"Extracted domain from website_url: {company_domain}")
            
            # Also get company name from org if not already set
            if not company_name and org_data.get('name'):
                company_name = org_data.get('name')
                print(f"Extracted company name: {company_name}")
        
        if company_name and company_domain:
            try:
                print(f"--- ENRICHING COMPANY PROFILE: {company_name} ---")
                print(f"Domain: {company_domain}")
                
                # Set API keys for company profile agent
                COMPANY_API_KEYS.clear()
                COMPANY_API_KEYS.update(request.api_keys or {})
                
                # Run company profile enrichment directly (faster than CrewAI)
                company_profile_data = run_company_profile(company_name, company_domain)
                
                print(f"--- COMPANY PROFILE RESULT ---")
                print(json.dumps(company_profile_data, indent=2, default=str))
                    
            except Exception as e:
                print(f"Error during company profile enrichment: {e}")
                company_profile_data = {
                    "error": f"Company profile enrichment failed: {str(e)}"
                }
        else:
            print(f"Skipping company profile enrichment - company_name={company_name}, company_domain={company_domain}")
            company_profile_data = {
                "error": "Missing company name or domain for company profile enrichment"
            }
        
        # Combine lead and company data
        enriched_data['company_profile'] = company_profile_data
        
        # --- WEBSITE SCRAPING & ANALYSIS ---
        website_analysis_data = {}
        
        if company_domain:
            try:
                print(f"--- SCRAPING & ANALYZING WEBSITE: {company_domain} ---")
                website_analysis_data = run_website_analysis(company_domain, company_name)
                
                print(f"--- WEBSITE ANALYSIS RESULT ---")
                if website_analysis_data.get('analysis'):
                    print(json.dumps(website_analysis_data['analysis'], indent=2, default=str))
                else:
                    print(f"Website analysis failed: {website_analysis_data.get('error')}")
                    
            except Exception as e:
                print(f"Error during website analysis: {e}")
                website_analysis_data = {
                    "success": False,
                    "error": f"Website analysis failed: {str(e)}"
                }
        else:
            print("Skipping website analysis - no company domain available")
            website_analysis_data = {
                "success": False,
                "error": "No company domain available for website analysis"
            }
        
        enriched_data['website_analysis'] = website_analysis_data
        
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

@app.post("/analyze-website")
async def analyze_website(request: WebsiteAnalysisRequest):
    """Scrape and analyze a company website to extract business intelligence"""
    try:
        print(f"--- ANALYZING WEBSITE: {request.domain} ---")
        
        result = run_website_analysis(request.domain, request.company_name)
        
        if result.get('analysis'):
            print(f"--- WEBSITE ANALYSIS SUCCESS ---")
            print(json.dumps(result['analysis'], indent=2, default=str))
        else:
            print(f"--- WEBSITE ANALYSIS FAILED: {result.get('error')} ---")
        
        return result
        
    except Exception as e:
        print(f"Error during website analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Apollo Discovery (legacy endpoint — kept for backward compatibility)
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

# Multi-provider lead discovery — uses whatever providers the user has configured
from agents.lead_discovery_router import discover_leads_multi_provider

@app.post("/discover-leads")
async def discover_leads_endpoint(request: dict):
    """Provider-agnostic lead discovery. Tries all available providers (Apollo, ZoomInfo, Icypeas, etc.)."""
    try:
        icp_criteria = request.get('icp_criteria', {})
        max_results = request.get('max_results', 25)
        api_keys = request.get('api_keys', {})
        preferred_provider = request.get('preferred_provider')

        # Also check for provider-specific headers (from autopilot cron)
        # Merge env vars as fallbacks
        env_providers = {
            'apollo': os.getenv('APOLLO_API_KEY'),
            'serper': os.getenv('SERPER_API_KEY'),
        }
        for provider, env_key in env_providers.items():
            if env_key and provider not in api_keys:
                api_keys[provider] = env_key

        print(f"--- MULTI-PROVIDER LEAD DISCOVERY ---")
        print(f"ICP Criteria: {icp_criteria}")
        print(f"Available providers: {list(api_keys.keys())}")
        print(f"Max Results: {max_results}")

        result = discover_leads_multi_provider(
            icp_criteria=icp_criteria,
            api_keys=api_keys,
            max_results=max_results,
            preferred_provider=preferred_provider
        )

        result['discovery_timestamp'] = json.loads(json.dumps(datetime.now(), default=str))
        result['icp_criteria_used'] = icp_criteria

        print(f"--- DISCOVERY RESULT ---")
        print(f"Success: {result.get('success')}")
        print(f"Total: {result.get('total_discovered', 0)}")
        print(f"Providers: {result.get('providers_used', {})}")

        return result

    except Exception as e:
        print(f"Error during multi-provider discovery: {e}")
        return {
            "success": False,
            "error": f"Lead discovery failed: {str(e)}",
            "total_discovered": 0,
            "leads": [],
            "providers_tried": []
        }

# Learning Agent — analyzes angle performance, generates new angles, provides insights
from agents.learning_agent import (
    aggregate_angle_metrics,
    calculate_angle_weights,
    generate_new_angles_prompt,
    generate_insights_prompt
)

@app.post("/learning-agent/analyze")
async def learning_agent_analyze(request: dict):
    """Aggregate angle metrics and return performance analysis for a user."""
    try:
        user_id = request.get('user_id')
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        
        metrics = aggregate_angle_metrics(user_id)
        weights = calculate_angle_weights(metrics)
        
        return {
            "success": True,
            "metrics": metrics,
            "traffic_weights": weights
        }
    except Exception as e:
        print(f"Learning agent analyze error: {e}")
        return {"success": False, "error": str(e)}

@app.post("/learning-agent/generate-angles")
async def learning_agent_generate_angles(request: dict):
    """Generate new test angles based on performance data using AI."""
    try:
        user_id = request.get('user_id')
        icp_profile = request.get('icp_profile', {})
        offer = request.get('offer', {})
        
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        
        # Get current metrics
        metrics = aggregate_angle_metrics(user_id)
        
        if not metrics.get('has_data'):
            return {
                "success": True,
                "angles": [],
                "message": "Not enough data yet to generate optimized angles"
            }
        
        # Build prompt and call LLM
        prompt = generate_new_angles_prompt(metrics, icp_profile, offer)
        
        from langchain_openai import ChatOpenAI
        gen_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        response = gen_llm.invoke(prompt)
        raw = response.content
        
        # Parse JSON from response
        start = raw.find('[')
        end = raw.rfind(']') + 1
        new_angles = []
        if start != -1 and end > start:
            try:
                new_angles = json.loads(raw[start:end])
            except:
                print(f"Failed to parse angle JSON: {raw[start:end][:200]}")
        
        return {
            "success": True,
            "angles": new_angles,
            "based_on": {
                "winners": len(metrics.get('winners', [])),
                "losers": len(metrics.get('losers', [])),
                "total_emails_analyzed": metrics.get('totals', {}).get('total_sent', 0)
            }
        }
    except Exception as e:
        print(f"Learning agent generate angles error: {e}")
        return {"success": False, "error": str(e), "angles": []}

@app.post("/learning-agent/insights")
async def learning_agent_insights(request: dict):
    """Generate strategic insights from angle performance data."""
    try:
        user_id = request.get('user_id')
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required")
        
        metrics = aggregate_angle_metrics(user_id)
        
        if not metrics.get('has_data'):
            return {
                "success": True,
                "insights": {
                    "key_finding": "Not enough data yet. Keep sending to build statistical significance.",
                    "recommendations": ["Continue current angles until at least 30 emails per angle"],
                    "confidence": "low"
                }
            }
        
        prompt = generate_insights_prompt(metrics)
        
        from langchain_openai import ChatOpenAI
        insights_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
        response = insights_llm.invoke(prompt)
        raw = response.content
        
        # Parse JSON
        start = raw.find('{')
        end = raw.rfind('}') + 1
        insights = {}
        if start != -1 and end > start:
            try:
                insights = json.loads(raw[start:end])
            except:
                insights = {"key_finding": raw[:500], "recommendations": [], "confidence": "low"}
        
        return {
            "success": True,
            "insights": insights,
            "metrics_summary": metrics.get('averages', {}),
            "angle_count": len(metrics.get('angles', [])),
            "winners": len(metrics.get('winners', [])),
            "losers": len(metrics.get('losers', []))
        }
    except Exception as e:
        print(f"Learning agent insights error: {e}")
        return {"success": False, "error": str(e)}

# Sequence Orchestrator
from agents.sequence_orchestrator_agent import (
    generate_complete_sequence,
    SequenceGenerationRequest,
    SequenceGenerationResponse
)

# Pain Point Enrichment
from crew.pain_point_crew import create_pain_point_crew
from schemas import PainPointEnrichmentRequest, PainPointEnrichmentResponse

@app.post("/generate-sequence", response_model=SequenceGenerationResponse)
async def generate_sequence(request: SequenceGenerationRequest):
    """
    Generate a complete multi-touch email sequence using AI agents
    Implements industry best practices: 3-5 touches, smart stop logic
    """
    try:
        print(f"--- GENERATING SEQUENCE ---")
        print(f"Objective: {request.objective}")
        print(f"Framework: {request.framework}")
        print(f"Touches: {request.touches}")
        print(f"Sequence Type: {request.sequence_type}")
        print(f"Lead: {request.lead_email}")
        
        # Generate complete sequence with the configured LLM
        sequence = await generate_complete_sequence(request, llm=llm)
        
        print(f"--- SEQUENCE GENERATED ---")
        print(f"Total Steps: {len(sequence.steps)}")
        print(f"Duration: {sequence.total_duration_days} days")
        print(f"Confidence: {sequence.confidence_score}")
        
        return sequence
        
    except Exception as e:
        print(f"Error generating sequence: {e}")
        raise HTTPException(status_code=500, detail=f"Sequence generation failed: {str(e)}")

# --- Email QA Endpoint ---
from agents.email_qa_agent import run_email_qa, QACheckResult

class EmailQARequest(BaseModel):
    subject: str
    body: str
    step_number: int = 1
    lead_name: str = ""
    company: str = ""
    skip_ai_review: bool = False

@app.post("/email-qa")
async def email_qa_check(request: EmailQARequest):
    """
    Pre-send quality assurance check on AI-generated emails.
    Stage 1: Deterministic rules (spam triggers, hallucinations, tone, formatting)
    Stage 2: AI review (only if stage 1 passes)
    Returns pass/fail with score, issues, warnings, and optional rewrites.
    """
    try:
        result = run_email_qa(
            subject=request.subject,
            body=request.body,
            step_number=request.step_number,
            lead_name=request.lead_name,
            company=request.company,
            llm=llm,
            skip_ai_review=request.skip_ai_review
        )
        return {
            "passed": result.passed,
            "score": result.score,
            "issues": result.issues,
            "warnings": result.warnings,
            "rewritten_subject": result.rewritten_subject,
            "rewritten_body": result.rewritten_body
        }
    except Exception as e:
        print(f"Email QA error: {e}")
        # On error, pass by default — don't block sends
        return {
            "passed": True,
            "score": 70,
            "issues": [],
            "warnings": [f"QA check failed: {str(e)}"],
            "rewritten_subject": None,
            "rewritten_body": None
        }

@app.post("/enrich-pain-points", response_model=PainPointEnrichmentResponse)
async def enrich_pain_points(request: PainPointEnrichmentRequest):
    """
    AI-enrich a lead with specific pain points based on their role, company, and context.
    
    This endpoint analyzes the lead's profile and generates 3-5 specific, actionable
    pain points that can be used to personalize outreach emails.
    """
    try:
        print(f"--- ENRICHING PAIN POINTS ---")
        print(f"Lead: {request.first_name} {request.last_name}")
        print(f"Title: {request.title} at {request.company}")
        print(f"Industry: {request.industry}")
        
        # Build lead data dict
        lead_data = {
            "first_name": request.first_name,
            "last_name": request.last_name,
            "title": request.title,
            "company": request.company,
            "industry": request.industry,
            "company_size": request.company_size,
            "location": request.location,
            "enriched_data": request.enriched_data
        }
        
        # Build optional context
        icp_context = None
        if request.icp_pain_points:
            icp_context = {"pain_points": request.icp_pain_points}
        
        offer_context = None
        if request.offer_name or request.offer_value_proposition:
            offer_context = {
                "name": request.offer_name,
                "value_proposition": request.offer_value_proposition
            }
        
        # Create and run the crew
        crew = create_pain_point_crew(
            llm=llm,
            lead_data=lead_data,
            icp_context=icp_context,
            offer_context=offer_context
        )
        
        result = crew.kickoff()
        
        # Parse result
        if hasattr(result, 'pydantic'):
            pain_point_result = result.pydantic
            return PainPointEnrichmentResponse(
                pain_points=pain_point_result.pain_points,
                confidence=pain_point_result.confidence,
                reasoning=pain_point_result.reasoning
            )
        else:
            # Try to extract from raw output
            raw_output = str(result)
            parsed = extract_json_from_string(raw_output)
            if parsed:
                return PainPointEnrichmentResponse(
                    pain_points=parsed.get("pain_points", []),
                    confidence=parsed.get("confidence", "medium"),
                    reasoning=parsed.get("reasoning", "")
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to parse pain points from AI response")
        
    except Exception as e:
        print(f"Error enriching pain points: {e}")
        raise HTTPException(status_code=500, detail=f"Pain point enrichment failed: {str(e)}")

# Import the angle generation agent
from agents.angle_generation_agent import generate_angles as crew_generate_angles, AngleGenerationOutput

# --- Generate Messaging Angles Endpoint ---
@app.post("/generate-angles", response_model=GenerateAnglesResponse)
async def generate_angles_endpoint(request: GenerateAnglesRequest):
    """
    Generate AI-powered messaging angles for an ICP profile using CrewAI agent.
    
    This endpoint uses a specialized B2B Sales Messaging Strategist agent that
    analyzes the ICP and generates psychologically-differentiated angles.
    """
    try:
        print(f"--- GENERATING ANGLES FOR ICP: {request.icp_profile.name} ---")
        print(f"Industries: {request.icp_profile.industries}")
        print(f"Job Titles: {request.icp_profile.job_titles}")
        print(f"Number requested: {request.number_of_angles}")
        
        # Convert Pydantic model to dict for the agent
        icp_data = {
            'name': request.icp_profile.name,
            'description': request.icp_profile.description,
            'industries': request.icp_profile.industries or [],
            'company_sizes': request.icp_profile.company_sizes or [],
            'job_titles': request.icp_profile.job_titles or [],
            'seniority_levels': request.icp_profile.seniority_levels or [],
            'departments': request.icp_profile.departments or [],
            'technologies': request.icp_profile.technologies or [],
            'pain_points': request.icp_profile.pain_points or [],
            'keywords': request.icp_profile.keywords or [],
            'locations': request.icp_profile.locations or []
        }
        
        # Convert offer to dict if provided
        offer_data = None
        if request.offer:
            offer_data = {
                'name': request.offer.name,
                'product_service_name': request.offer.product_service_name,
                'value_proposition': request.offer.value_proposition,
                'company_description': request.offer.company_description,
                'pain_points': request.offer.pain_points or [],
                'benefits': request.offer.benefits or [],
                'proof_points': request.offer.proof_points or [],
                'call_to_action': request.offer.call_to_action
            }
            print(f"Offer context: {offer_data.get('product_service_name')} - {offer_data.get('value_proposition', '')[:100]}")
        
        # Use the CrewAI agent to generate angles
        result: AngleGenerationOutput = crew_generate_angles(
            llm=llm,
            icp_data=icp_data,
            offer_data=offer_data,
            num_angles=request.number_of_angles or 3,
            existing_angles=request.existing_angles or []
        )
        
        print(f"Strategy Notes: {result.strategy_notes}")
        
        # Convert to response format
        angles = []
        for angle in result.angles:
            angles.append(GeneratedAngle(
                name=angle.name,
                description=angle.description,
                value_proposition=angle.value_proposition,
                pain_points=angle.pain_points[:3] if angle.pain_points else [],
                hooks=angle.hooks[:3] if angle.hooks else [],
                proof_points=angle.proof_points[:3] if angle.proof_points else [],
                tone=angle.tone if angle.tone in ['professional', 'casual', 'urgent', 'consultative', 'challenger'] else 'professional'
            ))
        
        print(f"Successfully generated {len(angles)} angles using CrewAI agent")
        return GenerateAnglesResponse(angles=angles)
        
    except Exception as e:
        print(f"Error generating angles: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Angle generation failed: {str(e)}")

# Register routers
app.include_router(json_lead_router)
app.include_router(unstructured_lead_router)
app.include_router(apollo_discovery_router)
app.include_router(campaign_strategy_router)
app.include_router(test_strategy_router)

@app.get("/")
async def root():
    return {"status": "running"}
