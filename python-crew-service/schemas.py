from pydantic import BaseModel

class MessageDetailsRequest(BaseModel):
    grant_id: str
    message_id: str

class AnalysisRequest(BaseModel):
    grant_id: str
    message_id: str
    user_id: str
    sender_email: str
    message_body: str = ""

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
    # Basic lead info
    name: str
    title: str = ""
    company: str
    email: str
    
    # Core messaging
    offer: str
    hook_snippet: str = ""
    
    # Enhanced lead context (JSON string containing all enriched data)
    lead_context: str = "{}"  # JSON string with all available lead data
    
    # Legacy fields for backward compatibility
    pain_points: str = ""

class EmailCopywritingResult(BaseModel):
    subject: str
    body: str

class VisitorIntelRequest(BaseModel):
    ip: str

class VisitorIntelResponse(BaseModel):
    companyDomain: str | None = None
    companyName: str | None = None

class StrategicReflectionRequest(BaseModel):
    user_id: str

class StrategicReflectionResponse(BaseModel):
    summary: str
    recommendations: list[str]
