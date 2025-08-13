"""
🚀 Unstructured Lead Processing Endpoint
Transforms natural language into structured lead data using AI agents
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime

from agents.lead_processing_agent import RawLeadInput, ProcessedLead, create_lead_processing_crew, process_raw_lead_data

router = APIRouter()

class UnstructuredLeadRequest(BaseModel):
    raw_data: str = Field(description="Natural language text containing lead information")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional context and metadata")

class UnstructuredLeadResponse(BaseModel):
    # Core extracted data
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    company_domain: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    linkedin_url: Optional[str] = None
    
    # Business intelligence
    pain_points: List[str] = []
    interests: List[str] = []
    lead_temperature: str = "warm"
    tech_stack: List[str] = []
    funding_stage: Optional[str] = None
    business_context: Dict[str, Any] = {}
    email_context: Dict[str, Any] = {}
    
    # Processing metadata
    confidence_score: float = 0.0
    extracted_fields: List[str] = []
    missing_fields: List[str] = []
    processing_notes: List[str] = []
    raw_input: str = ""
    source: str = "unstructured_input"
    processed_at: str = ""

@router.post("/process-unstructured-lead", response_model=UnstructuredLeadResponse)
async def process_unstructured_lead(request: UnstructuredLeadRequest):
    """
    🤖 Process unstructured lead data using AI agents
    
    Example Input:
    "Met Mike Jones from ABC Technologies at the trade show. He mentioned they're 
    struggling with lead generation and their current system isn't working. 
    Seemed interested in automation. Follow up next week. 
    His email might be mjones@abctech.com"
    
    Example Output:
    {
        "first_name": "Mike",
        "last_name": "Jones", 
        "company": "ABC Technologies",
        "email": "mjones@abctech.com",
        "pain_points": ["lead generation", "system inefficiency"],
        "interests": ["automation"],
        "lead_temperature": "warm",
        "confidence_score": 0.85
    }
    """
    
    try:
        logging.info(f"🤖 Processing unstructured lead data: {request.raw_data[:100]}...")
        
        # Create input for the AI agent
        raw_input = RawLeadInput(
            raw_data=request.raw_data,
            metadata=request.metadata,
            source=request.metadata.get('source', 'unstructured_input'),
            notes=request.metadata.get('user_notes', '')
        )
        
        # Process using the lead processing agent
        processed_lead = process_raw_lead_data(raw_input)
        
        # Create response with all extracted data from ProcessedLead object
        response = UnstructuredLeadResponse(
            # Core contact info
            first_name=processed_lead.first_name,
            last_name=processed_lead.last_name,
            full_name=processed_lead.full_name,
            email=processed_lead.email,
            phone=processed_lead.phone,
            
            # Professional info
            title=processed_lead.title,
            company=processed_lead.company,
            company_domain=processed_lead.company_domain,
            location=processed_lead.location,
            industry=processed_lead.industry,
            company_size=processed_lead.company_size,
            linkedin_url=processed_lead.linkedin_url,
            
            # Business intelligence
            pain_points=processed_lead.pain_points or [],
            interests=processed_lead.interests or [],
            lead_temperature=processed_lead.lead_temperature or 'warm',
            tech_stack=processed_lead.tech_stack or [],
            funding_stage=processed_lead.funding_stage,
            business_context=processed_lead.business_context or {},
            email_context=processed_lead.email_context or {},
            
            # Processing metadata
            confidence_score=processed_lead.confidence_score,
            extracted_fields=processed_lead.extracted_fields or [],
            missing_fields=processed_lead.missing_fields or [],
            processing_notes=processed_lead.processing_notes or [],
            raw_input=processed_lead.raw_input
        )
        
        logging.info(f"✅ Successfully processed unstructured lead. Confidence: {response.confidence_score}")
        return response
        
    except Exception as e:
        logging.error(f"❌ Error processing unstructured lead: {str(e)}")
        
        # Return fallback extraction on error
        fallback_data = extract_basic_info_fallback(request.raw_data)
        fallback_data['processing_notes'].append(f"AI processing failed: {str(e)}")
        
        return UnstructuredLeadResponse(
            **fallback_data,
            raw_input=request.raw_data,
            source=request.metadata.get('source', 'unstructured_input'),
            processed_at=datetime.utcnow().isoformat()
        )

def extract_basic_info_fallback(raw_text: str) -> Dict[str, Any]:
    """
    Fallback extraction using basic regex patterns when AI fails
    """
    import re
    
    extracted = {
        'processing_notes': ['Used fallback regex extraction'],
        'confidence_score': 0.3,  # Low confidence for regex-only
        'extracted_fields': [],
        'missing_fields': []
    }
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, raw_text)
    if emails:
        extracted['email'] = emails[0]
        extracted['extracted_fields'].append('email')
    
    # Extract phone numbers
    phone_pattern = r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}'
    phones = re.findall(phone_pattern, raw_text)
    if phones:
        extracted['phone'] = phones[0]
        extracted['extracted_fields'].append('phone')
    
    # Extract company names (basic patterns)
    company_patterns = [
        r'from\s+([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Tech|Solutions))',
        r'at\s+([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Tech|Solutions))',
        r'([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Company|Technologies|Tech|Solutions))'
    ]
    
    for pattern in company_patterns:
        companies = re.findall(pattern, raw_text, re.IGNORECASE)
        if companies:
            extracted['company'] = companies[0].strip()
            extracted['extracted_fields'].append('company')
            break
    
    # Extract names (basic patterns)
    name_patterns = [
        r'met\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+from',
        r'([A-Z][a-z]+\s+[A-Z][a-z]+)\s+at'
    ]
    
    for pattern in name_patterns:
        names = re.findall(pattern, raw_text)
        if names:
            full_name = names[0].strip()
            name_parts = full_name.split()
            if len(name_parts) >= 2:
                extracted['first_name'] = name_parts[0]
                extracted['last_name'] = name_parts[-1]
                extracted['full_name'] = full_name
                extracted['extracted_fields'].extend(['first_name', 'last_name', 'full_name'])
            break
    
    # Extract basic pain points (keyword matching)
    pain_keywords = ['struggling', 'problem', 'issue', 'challenge', 'need help', 'difficulty']
    pain_points = []
    
    for keyword in pain_keywords:
        if keyword in raw_text.lower():
            # Extract context around the keyword
            sentences = raw_text.split('.')
            for sentence in sentences:
                if keyword in sentence.lower():
                    pain_points.append(sentence.strip())
                    break
    
    if pain_points:
        extracted['pain_points'] = pain_points
        extracted['extracted_fields'].append('pain_points')
    
    # Set missing fields
    all_possible_fields = ['first_name', 'last_name', 'email', 'company', 'title', 'phone', 'pain_points']
    extracted['missing_fields'] = [field for field in all_possible_fields if field not in extracted['extracted_fields']]
    
    return extracted
