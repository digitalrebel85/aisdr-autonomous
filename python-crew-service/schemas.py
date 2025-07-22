from pydantic import BaseModel

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

class StrategicReflectionRequest(BaseModel):
    user_id: str

class StrategicReflectionResponse(BaseModel):
    summary: str
    recommendations: list[str]
