"""
Pydantic Models and Schemas
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class EmailReply(BaseModel):
    """Incoming email reply"""
    message_id: str
    from_email: str
    from_name: Optional[str] = None
    subject: str
    body: str
    date: datetime
    in_reply_to: Optional[str] = None
    references: List[str] = Field(default_factory=list)
    thread_id: str

class LeadContext(BaseModel):
    """Context about the lead"""
    lead_id: str
    email: str
    name: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    pain_points: List[str] = Field(default_factory=list)
    icp_angle: Optional[str] = None
    campaign_id: Optional[str] = None
    custom_fields: Dict[str, Any] = Field(default_factory=dict)

class ThreadMessage(BaseModel):
    """Message in a thread"""
    message_id: str
    from_email: str
    subject: str
    body: str
    sent_at: datetime
    is_outbound: bool

class ReplyClassification(BaseModel):
    """AI classification of a reply"""
    sentiment: str  # positive, negative, neutral, unsubscribe
    intent: str  # meeting_request, question, objection, etc.
    urgency: str  # high, medium, low
    action_required: str  # reply, handoff, unsubscribe, ignore
    suggested_response: Optional[str] = None
    confidence: float = Field(ge=0, le=1)

class EmailDraft(BaseModel):
    """AI-generated email draft"""
    subject: str
    body: str
    tone: str
    personalization_notes: List[str] = Field(default_factory=list)

class ProcessingJob(BaseModel):
    """Job queued for processing"""
    user_id: str
    reply: EmailReply
    lead_context: Optional[LeadContext] = None
    thread_history: List[ThreadMessage] = Field(default_factory=list)
    received_at: datetime
    priority: str = "normal"  # low, normal, high

class ProcessingResult(BaseModel):
    """Result of processing a reply"""
    job_id: str
    classification: ReplyClassification
    draft: Optional[EmailDraft] = None
    sent_at: Optional[datetime] = None
    processing_time_ms: int
    success: bool
    error: Optional[str] = None
