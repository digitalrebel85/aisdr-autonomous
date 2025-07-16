from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from crewai import Agent, Task, Crew, Process, Tool
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import httpx
import requests
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI

# Load environment variables from .env file
load_dotenv()

# --- Environment Variable Validation ---
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

# --- Environment Variable Loading ---
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
NYLAS_API_KEY = os.getenv('NYLAS_API_KEY')
NYLAS_API_SERVER = os.getenv('NYLAS_API_SERVER')
SNITCHER_API_KEY = os.getenv('SNITCHER_API_KEY')

# --- LLM Configuration ---
llm = None
if os.getenv('DEEPSEEK_API_KEY'):
    print("INFO: Using DeepSeek LLM")
    # Bypass the pydantic SecretStr conversion by setting the key after initialization
    llm = ChatDeepSeek(model="deepseek-chat", temperature=0, api_key=os.getenv('DEEPSEEK_API_KEY'))
    # Force the SecretStr back to a string to fix litellm incompatibility
    if hasattr(llm, 'api_key') and llm.api_key:
        llm.api_key = llm.api_key.get_secret_value()
else:
    print("INFO: Using OpenAI LLM")
    llm = ChatOpenAI(model_name="gpt-4o", temperature=0, api_key=os.getenv('OPENAI_API_KEY'))

# --- Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# --- Pydantic Models ---
class MessageDetailsRequest(BaseModel):
    grant_id: str
    message_id: str

class AnalysisRequest(BaseModel):
    grant_id: str
    message_id: str
    user_id: str
    sender_email: str

class AnalysisResult(BaseModel):
    lead_id: str
    sentiment: str
    action: str
    summary: str
    nextStepPrompt: str

class FollowUpRequest(BaseModel):
    lead_context: str
    thread_history: str

class FollowUpResult(BaseModel):
    subject: str
    body: str

class EmailCopywritingRequest(BaseModel):
    name: str
    title: str
    company: str
    pain_points: str
    offer: str
    hook_snippet: str = ""

class EmailCopywritingResult(BaseModel):
    subject: str
    body: str

class VisitorIntelRequest(BaseModel):
    ip: str

class VisitorIntelResponse(BaseModel):
    companyDomain: str | None = None
    companyName: str | None = None

# --- CrewAI Agent & Task Definition ---
class ReplyAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Reply Classifier",
            goal="Understand and classify a cold email reply, and suggest the next best step",
            backstory=(
                "You are a smart AI SDR assistant. You read email replies from leads and determine: "
                "what their response means, whether they are interested or not, and what should be done next. "
                "You use the user's offer and CTA to guide your response. Be helpful, short, and always return structured output in JSON."
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )

class ReplyTask():
    def __init__(self, agent, lead_context, thread_history, email_reply):
        self.task = Task(
            description=(
                "Classify the lead's reply and determine what to do next.\n\n"
                f"Context:\n- Lead Reply: \"{email_reply}\"\n"
                f"- Lead Context: {lead_context}\n"
                f"- Thread History: \"{thread_history}\""
            ),
            expected_output=(
                "A JSON object with keys: 'lead_id', 'sentiment', 'action', 'summary', 'nextStepPrompt'."
            ),
            agent=agent
        )
        self.task.output_pydantic = AnalysisResult

class FollowUpAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Expert Sales Development Representative",
            goal="Write a gentle, concise, and effective follow-up email to a lead who has not replied.",
            backstory=(
                "You are an expert SDR specializing in re-engaging cold leads. Your tone is friendly, professional, and never pushy. "
                "You reference the previous conversation context to remind the lead what the offer was about. Your goal is to get a response, not to close a deal."
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )

class FollowUpTask():
    def __init__(self, agent, lead_context, thread_history):
        self.task = Task(
            description=(
                "Generate a follow-up email for a lead who hasn't responded.\n\n"
                f"Lead Context: {lead_context}\n"
                f"Previous Email Thread: {thread_history}"
            ),
            expected_output=(
                "A JSON object with keys: 'subject' and 'body'."
            ),
            agent=agent
        )
        self.task.output_pydantic = FollowUpResult

class EmailCopywriterAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Email Copywriter",
            goal="Write a high-converting, personalized cold email",
            backstory=(
                """You write cold emails that are short, relevant, and tailored to the recipient.\n\nYou use:\n- The lead's job title, company, industry, and pain points\n- The offer provided\n- The personalization hook (if any)\n\nYour tone should be confident, casual, and non-pitchy."""
            ),
            allow_delegation=False,
            verbose=True,
            llm=llm
        )

class EmailCopywritingTask():
    def __init__(self, agent, name, title, company, pain_points, offer, hook_snippet):
        self.task = Task(
            description=f"""Write a cold email for the following lead:\n\nLead:\n- Name: {name}\n- Title: {title}\n- Company: {company}\n- Pain Points: {pain_points}\n\nOffer:\n{offer}\n\nPersonalization Hook:\n{hook_snippet}\n\nOutput:\nA JSON object with keys: \"subject\" and \"body\".""",
            expected_output="A JSON object with keys: 'subject' and 'body'.",
            agent=agent
        )
        self.task.output_pydantic = EmailCopywritingResult

# --- Custom Tools ---

def _snitcher_ip_lookup(ip: str) -> str:
    """A tool to look up company information from an IP address using the Snitcher API."""
    headers = {"Authorization": f"Bearer {SNITCHER_API_KEY}"}
    try:
        response = requests.get(f"https://api.snitcher.com/v1/ip-to-company?ip={ip}", headers=headers)
        response.raise_for_status()
        return response.text
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            return "No company found for this IP address."
        return f"Error from Snitcher API: {e.response.status_code} - {e.response.text}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

snitcher_tool = Tool(
    name="Snitcher IP Lookup",
    func=_snitcher_ip_lookup,
    description="Identifies the company associated with a visitor's IP address. Input must be a valid IP string."
)

# --- Visitor Intel Agent ---
class VisitorIntelAgent(Agent):
    def __init__(self, llm):
        super().__init__(
            role="Visitor Intelligence Analyst",
            goal="Identify the company associated with a website visitor's IP address using the provided tools.",
            backstory="You are an expert at using marketing intelligence tools to uncover anonymous website traffic. You receive an IP address and your job is to return the company's name and domain.",
            tools=[snitcher_tool],
            allow_delegation=False,
            verbose=True,
            llm=llm
        )

class VisitorIntelTask():
    def __init__(self, agent, ip: str):
        self.task = Task(
            description=f"Use your tool to find company data for the IP address: {ip}. Focus on extracting the company name and domain.",
            expected_output="A JSON object with keys: 'companyDomain' and 'companyName'. If no company is found, return null for both.",
            agent=agent
        )
        self.task.output_pydantic = VisitorIntelResponse

# --- FastAPI App ---
app = FastAPI(
    title="CrewAI Advanced Email Analysis Service",
    description="A service to analyze email replies using a context-aware CrewAI agent.",
)

# --- Helper Functions ---
async def get_nylas_data(grant_id: str, access_token: str, message_id: str):
    """Fetches message and its thread history from Nylas API."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }
    async with httpx.AsyncClient() as client:
        # Fetch the message
        message_res = await client.get(f"{NYLAS_API_SERVER}/v3/grants/{grant_id}/messages/{message_id}", headers=headers)
        message_res.raise_for_status()
        message = message_res.json()

        # Fetch the thread
        thread_id = message.get('thread_id')
        thread_history = ""
        if thread_id:
            thread_res = await client.get(f"{NYLAS_API_SERVER}/v3/grants/{grant_id}/messages?thread_id={thread_id}", headers=headers)
            thread_res.raise_for_status()
            thread_history = thread_res.text # Pass the raw text for context

    return message, thread_history

# --- Main Endpoint ---
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
        reply_agent = ReplyAgent(llm=llm)
        reply_task_def = ReplyTask(
            agent=reply_agent,
            lead_context=str(lead),
            thread_history=thread_history,
            email_reply=reply_text
        )

        # 5. Run the Crew
        crew = Crew(agents=[reply_agent], tasks=[reply_task_def.task], process=Process.sequential, verbose=True)
        result = crew.kickoff()

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
        follow_up_agent = FollowUpAgent(llm=llm)
        follow_up_task_def = FollowUpTask(
            agent=follow_up_agent,
            lead_context=request.lead_context,
            thread_history=request.thread_history
        )

        crew = Crew(agents=[follow_up_agent], tasks=[follow_up_task_def.task], process=Process.sequential, verbose=True)
        result = crew.kickoff()

        follow_up_email = FollowUpResult.model_validate_json(result.raw)
        return follow_up_email

    except Exception as e:
        print(f"Error during follow-up generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cold-email", response_model=EmailCopywritingResult)
async def generate_cold_email(request: EmailCopywritingRequest):
    try:
        print("--- GENERATING COLD EMAIL ---")
        email_writer_agent = EmailCopywriterAgent(llm=llm)
        email_task_def = EmailCopywritingTask(
            agent=email_writer_agent,
            name=request.name,
            title=request.title,
            company=request.company,
            pain_points=request.pain_points,
            offer=request.offer,
            hook_snippet=request.hook_snippet
        )

        crew = Crew(agents=[email_writer_agent], tasks=[email_task_def.task], process=Process.sequential, verbose=True)
        result = crew.kickoff()

        email_output = EmailCopywritingResult.model_validate_json(result.raw)
        return email_output

    except Exception as e:
        print(f"Error during cold email generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/resolve-ip", response_model=VisitorIntelResponse)
async def resolve_ip(request: VisitorIntelRequest):
    try:
        print(f"--- RESOLVING IP ADDRESS: {request.ip} ---")
        intel_agent = VisitorIntelAgent(llm=llm)
        intel_task_def = VisitorIntelTask(agent=intel_agent, ip=request.ip)

        crew = Crew(agents=[intel_agent], tasks=[intel_task_def.task], process=Process.sequential, verbose=True)
        result = crew.kickoff()

        # The agent's output might be a string representation of the JSON.
        # We validate and parse it with our Pydantic model.
        intel_result = VisitorIntelResponse.model_validate_json(result.raw)
        return intel_result

    except Exception as e:
        # This handles errors from the crew kickoff or Pydantic validation
        print(f"Error during IP resolution: {e}")
        # Check if the error message indicates no company was found, and return a specific response
        if "No company found" in str(e):
            return VisitorIntelResponse(companyDomain=None, companyName=None)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"status": "running"}
