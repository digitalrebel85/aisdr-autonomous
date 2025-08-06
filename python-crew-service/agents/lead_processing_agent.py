"""
AI-Powered Lead Processing Agent
Extracts structured lead data from unstructured text using LLM and NLP techniques
"""

import json
import re
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
import openai
from datetime import datetime

class RawLeadInput(BaseModel):
    raw_data: str = Field(description="Unstructured text containing lead information")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata about the lead")
    source: Optional[str] = Field(default="unknown", description="Source of the lead data")
    notes: Optional[str] = Field(default="", description="Additional notes about the lead")

class ProcessedLead(BaseModel):
    # Core contact information
    first_name: Optional[str] = Field(default=None, description="First name of the lead")
    last_name: Optional[str] = Field(default=None, description="Last name of the lead")
    full_name: Optional[str] = Field(default=None, description="Full name if first/last not separable")
    email: Optional[str] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    
    # Professional information
    title: Optional[str] = Field(default=None, description="Job title or position")
    company: Optional[str] = Field(default=None, description="Company name")
    company_domain: Optional[str] = Field(default=None, description="Company website domain")
    industry: Optional[str] = Field(default=None, description="Industry or sector")
    company_size: Optional[str] = Field(default=None, description="Company size description")
    
    # Location information
    location: Optional[str] = Field(default=None, description="Geographic location")
    
    # Social and web presence
    linkedin_url: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    
    # Business context
    pain_points: List[str] = Field(default=[], description="Identified pain points or needs")
    interests: List[str] = Field(default=[], description="Business interests or focus areas")
    lead_temperature: Optional[str] = Field(default="cold", description="Lead temperature: hot, warm, cold")
    
    # Apollo-specific intelligence
    tech_stack: List[str] = Field(default=[], description="Technologies and tools used by the company")
    funding_stage: Optional[str] = Field(default=None, description="Company funding stage")
    business_context: Dict[str, Any] = Field(default={}, description="Rich business context and insights")
    
    # Email personalization context
    email_context: Dict[str, Any] = Field(default={}, description="Context for email personalization")
    apollo_intelligence: Dict[str, Any] = Field(default={}, description="Apollo-specific insights and analysis")
    
    # Processing metadata
    confidence_score: float = Field(default=0.0, description="Confidence in extracted data (0-1)")
    extracted_fields: List[str] = Field(default=[], description="List of successfully extracted fields")
    missing_fields: List[str] = Field(default=[], description="List of fields that couldn't be extracted")
    processing_notes: List[str] = Field(default=[], description="Notes from the processing")
    
    # Original data preservation
    raw_input: str = Field(description="Original raw input text")
    source: str = Field(default="unknown", description="Source of the lead")
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

def extract_email_addresses(text: str) -> List[str]:
    """Extract email addresses from text using regex"""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return list(set(emails))  # Remove duplicates

def extract_phone_numbers(text: str) -> List[str]:
    """Extract phone numbers from text using regex"""
    phone_patterns = [
        r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # US format
        r'\+?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}',  # International
    ]
    phones = []
    for pattern in phone_patterns:
        phones.extend(re.findall(pattern, text))
    return list(set(phones))


def extract_linkedin_urls(text: str) -> List[str]:
    """Extract LinkedIn URLs from text"""
    linkedin_pattern = r'https?://(?:www\.)?linkedin\.com/in/[A-Za-z0-9_-]+'
    urls = re.findall(linkedin_pattern, text)
    return urls


def extract_company_domains(text: str) -> List[str]:
    """Extract potential company domains from text"""
    # Look for website patterns
    domain_patterns = [
        r'https?://(?:www\.)?([A-Za-z0-9.-]+\.[A-Za-z]{2,})',
        r'www\.([A-Za-z0-9.-]+\.[A-Za-z]{2,})',
        r'([A-Za-z0-9.-]+\.com|[A-Za-z0-9.-]+\.org|[A-Za-z0-9.-]+\.net|[A-Za-z0-9.-]+\.io)'
    ]
    domains = []
    for pattern in domain_patterns:
        matches = re.findall(pattern, text)
        domains.extend(matches)
    return list(set(domains))


def identify_company_size_indicators(text: str) -> List[str]:
    """Identify company size indicators in text"""
    size_patterns = [
        r'(\d+[\+\-]?\s*(?:employees?|people|staff|team members?))',
        r'(startup|small business|enterprise|fortune \d+|mid-size|large company)',
        r'(\d+\-\d+\s*(?:employees?|people))',
        r'(series [A-Z]|seed funded|pre-revenue|bootstrapped)'
    ]
    indicators = []
    for pattern in size_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        indicators.extend(matches)
    return indicators


def extract_tech_stack(text: str) -> List[str]:
    """Extract technology stack from text"""
    # Common technologies and frameworks
    tech_patterns = [
        # Frontend
        r'\b(React|Vue|Angular|JavaScript|TypeScript|HTML|CSS|Svelte|Next\.js|Nuxt\.js)\b',
        # Backend
        r'\b(Node\.js|Python|Java|PHP|Ruby|Go|Rust|C#|\.NET|Spring|Django|Flask|Express)\b',
        # Databases
        r'\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|SQLite|Oracle|SQL Server)\b',
        # Cloud/Infrastructure
        r'\b(AWS|Azure|Google Cloud|GCP|Docker|Kubernetes|Heroku|Vercel|Netlify)\b',
        # Tools/Services
        r'\b(Stripe|Intercom|Salesforce|HubSpot|Slack|Zoom|Figma|GitHub|GitLab)\b',
        # Mobile
        r'\b(iOS|Android|React Native|Flutter|Swift|Kotlin)\b'
    ]
    
    technologies = set()
    for pattern in tech_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        technologies.update(matches)
    
    return list(technologies)


def extract_pain_points(text: str) -> List[str]:
    """Extract business pain points and challenges from text"""
    pain_point_patterns = [
        r'challenges?\s+with\s+([^,.]+)',
        r'struggling\s+with\s+([^,.]+)',
        r'problems?\s+with\s+([^,.]+)',
        r'issues?\s+with\s+([^,.]+)',
        r'needs?\s+(?:help\s+with|to\s+improve)\s+([^,.]+)',
        r'looking\s+for\s+(?:solutions?\s+for|help\s+with)\s+([^,.]+)',
        r'pain\s+points?[^:]*:\s*([^,.]+)',
        r'bottlenecks?\s+in\s+([^,.]+)',
        r'difficulties\s+with\s+([^,.]+)'
    ]
    
    pain_points = []
    for pattern in pain_point_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        pain_points.extend([match.strip() for match in matches])
    
    # Common business pain points
    common_pains = [
        'lead generation', 'sales automation', 'customer acquisition',
        'marketing automation', 'data management', 'scaling', 'hiring',
        'customer retention', 'conversion rates', 'pipeline management',
        'team productivity', 'workflow automation', 'integration challenges'
    ]
    
    for pain in common_pains:
        if pain.lower() in text.lower():
            pain_points.append(pain)
    
    return list(set(pain_points))


def extract_funding_stage(text: str) -> str:
    """Extract company funding stage from text"""
    funding_patterns = [
        r'(pre-seed|seed|series [A-Z]|ipo|public|bootstrapped|self-funded)',
        r'raised\s+\$[\d.]+[MBK]?\s+(seed|series [A-Z])',
        r'\$[\d.]+[MBK]?\s+(seed|series [A-Z]|round)',
        r'(recently funded|just raised|closed.*round)'
    ]
    
    for pattern in funding_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).lower()
    
    return 'unknown'


def extract_business_context(text: str) -> Dict[str, Any]:
    """Extract rich business context from text"""
    context = {
        'growth_stage': [],
        'business_model': [],
        'market_focus': [],
        'recent_activities': [],
        'competitive_advantages': []
    }
    
    # Growth stage indicators
    growth_patterns = [
        r'(fast[- ]growing|rapidly expanding|scaling|high[- ]growth)',
        r'(startup|established|mature|enterprise)',
        r'(early[- ]stage|growth[- ]stage|late[- ]stage)'
    ]
    
    for pattern in growth_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        context['growth_stage'].extend(matches)
    
    # Business model indicators
    model_patterns = [
        r'(SaaS|B2B|B2C|marketplace|platform|e-commerce|subscription)',
        r'(enterprise|SMB|consumer|developer tools)'
    ]
    
    for pattern in model_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        context['business_model'].extend(matches)
    
    # Recent activities
    activity_patterns = [
        r'(recently launched|just released|announced|acquired)',
        r'(expanding into|entering|targeting)',
        r'(hiring|recruiting|building team)'
    ]
    
    for pattern in activity_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        context['recent_activities'].extend(matches)
    
    return context


def analyze_apollo_snippet(snippet: str) -> Dict[str, Any]:
    """Analyze Apollo snippet for email personalization insights"""
    analysis = {
        'personalization_hooks': [],
        'business_triggers': [],
        'messaging_angles': [],
        'urgency_indicators': [],
        'social_proof_opportunities': []
    }
    
    # Personalization hooks
    hook_patterns = [
        r'(recently\s+\w+)',
        r'(just\s+\w+)',
        r'(announced\s+[^,.]+)',
        r'(launched\s+[^,.]+)',
        r'(raised\s+\$[\d.]+[MBK]?)'
    ]
    
    for pattern in hook_patterns:
        matches = re.findall(pattern, snippet, re.IGNORECASE)
        analysis['personalization_hooks'].extend(matches)
    
    # Business triggers
    trigger_patterns = [
        r'(expanding|scaling|growing|hiring)',
        r'(challenges|problems|issues|pain points)',
        r'(looking for|seeking|needs|requires)'
    ]
    
    for pattern in trigger_patterns:
        matches = re.findall(pattern, snippet, re.IGNORECASE)
        analysis['business_triggers'].extend(matches)
    
    # Urgency indicators
    urgency_patterns = [
        r'(urgent|asap|quickly|immediately|soon)',
        r'(deadline|timeline|by\s+\w+)',
        r'(fast[- ]growing|rapidly|aggressive)'
    ]
    
    for pattern in urgency_patterns:
        matches = re.findall(pattern, snippet, re.IGNORECASE)
        analysis['urgency_indicators'].extend(matches)
    
    return analysis

def create_lead_processing_crew(user_api_keys: Dict[str, str] = None) -> Crew:
    """Create a crew for processing unstructured lead data"""
    
    # Lead Data Extraction Agent
    data_extractor = Agent(
        role='Lead Data Extraction Specialist',
        goal='Extract structured contact and company information from unstructured text',
        backstory="""You are an expert at parsing unstructured text to extract lead information.
        You can identify names, companies, job titles, contact information, and business context
        from various text formats including LinkedIn profiles, business cards, meeting notes,
        email signatures, and CRM exports.""",
        verbose=True,
        allow_delegation=False,
        tools=[
            extract_email_addresses,
            extract_phone_numbers,
            extract_linkedin_urls,
            extract_company_domains,
            identify_company_size_indicators,
            extract_tech_stack,
            extract_pain_points,
            extract_funding_stage,
            extract_business_context,
            analyze_apollo_snippet
        ]
    )
    
    # Lead Context Analyzer Agent
    context_analyzer = Agent(
        role='Lead Context Analysis Expert',
        goal='Analyze business context, pain points, and lead qualification from text',
        backstory="""You specialize in understanding business context and sales opportunities.
        You can identify pain points, business needs, company information, industry context,
        and lead temperature from conversational text and business communications.""",
        verbose=True,
        allow_delegation=False
    )
    
    # Data Quality Validator Agent
    quality_validator = Agent(
        role='Data Quality Validation Specialist',
        goal='Validate, standardize, and score the confidence of extracted lead data',
        backstory="""You ensure data quality and consistency. You validate email formats,
        standardize phone numbers, verify company information, and assign confidence scores
        to extracted data based on clarity and completeness.""",
        verbose=True,
        allow_delegation=False
    )
    
    return Crew(
        agents=[data_extractor, context_analyzer, quality_validator],
        verbose=True
    )

def process_raw_lead_data(raw_lead: RawLeadInput, user_api_keys: Dict[str, str] = None) -> ProcessedLead:
    """Process raw lead data using AI agents"""
    
    try:
        crew = create_lead_processing_crew(user_api_keys)
        
        # Task 1: Extract basic contact and company information
        extraction_task = Task(
            description=f"""
            Extract structured lead information from this raw text:
            
            Raw Data: {raw_lead.raw_data}
            Source: {raw_lead.source}
            Additional Notes: {raw_lead.notes}
            Metadata: {raw_lead.metadata}
            
            Extract the following information if available:
            - Full name (separate into first/last if possible)
            - Email address
            - Phone number
            - Job title/position
            - Company name
            - Company website/domain
            - LinkedIn profile URL
            - Location/geographic information
            - Industry or business sector
            - Company size indicators
            - Technology stack and tools used
            - Company funding stage and investment info
            - Business context and recent activities
            
            SPECIAL FOCUS FOR APOLLO EXPORTS:
            - If there's a 'snippet' field, analyze it thoroughly for business intelligence
            - If there's a 'tech_stack' field, extract all technologies mentioned
            - Look for funding information, growth stage, and business model details
            - Extract pain points, challenges, and business triggers
            
            Use the available tools to help with extraction. Be thorough but only extract
            information that is clearly present in the text.
            """,
            agent=crew.agents[0],
            expected_output="Structured list of extracted contact and company information"
        )
        
        # Task 2: Analyze business context and qualification
        context_task = Task(
            description=f"""
            Analyze the business context and sales potential from this lead data:
            
            Raw Data: {raw_lead.raw_data}
            
            Identify and extract:
            - Pain points or business challenges mentioned
            - Business interests or focus areas
            - Lead temperature (hot/warm/cold) based on context
            - Industry context and business needs
            - Any indicators of buying intent or timeline
            - Relationship context (how they were acquired)
            - Technology stack and technical context
            - Company growth stage and funding status
            - Recent business activities and announcements
            - Competitive landscape and positioning
            
            APOLLO SNIPPET ANALYSIS:
            - Extract personalization hooks (recent funding, launches, hires)
            - Identify business triggers (expansion, scaling, challenges)
            - Determine messaging angles based on company context
            - Assess urgency indicators and timing
            - Find social proof opportunities
            
            EMAIL PERSONALIZATION CONTEXT:
            - Create hooks for email opening lines
            - Identify technical angles for product positioning
            - Extract business triggers for timing
            - Determine appropriate messaging tone
            - Suggest relevant case studies or social proof
            
            Provide insights that would help with sales outreach and lead qualification.
            """,
            agent=crew.agents[1],
            expected_output="Business context analysis with pain points, interests, and lead qualification"
        )
        
        # Task 3: Validate and score the extracted data
        validation_task = Task(
            description=f"""
            Validate and score the quality of extracted lead information:
            
            Review all extracted data for:
            - Email format validation
            - Phone number standardization
            - Data consistency and completeness
            - Confidence scoring (0-1) for each field
            - Overall data quality assessment
            
            Create a final structured lead record with:
            - All validated and standardized data
            - Confidence scores
            - List of successfully extracted fields
            - List of missing critical fields
            - Processing notes and recommendations
            
            Format the output as a complete lead profile ready for database storage.
            """,
            agent=crew.agents[2],
            expected_output="Validated and scored lead data in structured format"
        )
        
        # Execute the crew tasks
        crew_tasks = [extraction_task, context_task, validation_task]
        results = crew.kickoff(tasks=crew_tasks)
        
        # Parse the results and create ProcessedLead object
        processed_lead = parse_crew_results(results, raw_lead)
        
        return processed_lead
        
    except Exception as e:
        # Fallback: create basic processed lead with error info
        return ProcessedLead(
            raw_input=raw_lead.raw_data,
            source=raw_lead.source,
            confidence_score=0.1,
            processing_notes=[f"Processing failed: {str(e)}"],
            missing_fields=["all_fields"]
        )

def parse_crew_results(results: Any, raw_lead: RawLeadInput) -> ProcessedLead:
    """Parse crew results into ProcessedLead object"""
    
    # Initialize with raw data
    processed_lead = ProcessedLead(
        raw_input=raw_lead.raw_data,
        source=raw_lead.source
    )
    
    try:
        # Extract basic information using regex fallbacks
        emails = extract_email_addresses(raw_lead.raw_data)
        phones = extract_phone_numbers(raw_lead.raw_data)
        linkedin_urls = extract_linkedin_urls(raw_lead.raw_data)
        domains = extract_company_domains(raw_lead.raw_data)
        
        # Set extracted data
        if emails:
            processed_lead.email = emails[0]
            processed_lead.extracted_fields.append("email")
        
        if phones:
            processed_lead.phone = phones[0]
            processed_lead.extracted_fields.append("phone")
            
        if linkedin_urls:
            processed_lead.linkedin_url = linkedin_urls[0]
            processed_lead.extracted_fields.append("linkedin_url")
            
        if domains:
            processed_lead.company_domain = domains[0]
            processed_lead.extracted_fields.append("company_domain")
        
        # Try to extract name patterns
        name_patterns = [
            r'^([A-Z][a-z]+)\s+([A-Z][a-z]+)',  # First Last at start
            r'([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s*,|\s*-|\s*@)',  # First Last before punctuation
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, raw_lead.raw_data)
            if match:
                processed_lead.first_name = match.group(1)
                processed_lead.last_name = match.group(2)
                processed_lead.full_name = f"{match.group(1)} {match.group(2)}"
                processed_lead.extracted_fields.extend(["first_name", "last_name", "full_name"])
                break
        
        # Extract company and title patterns
        title_company_patterns = [
            r'([A-Z][a-zA-Z\s]+)\s+at\s+([A-Z][a-zA-Z\s&.,]+)',  # Title at Company
            r'([A-Z][a-zA-Z\s]+)\s+@\s+([A-Z][a-zA-Z\s&.,]+)',   # Title @ Company
            r'([A-Z][a-zA-Z\s]+)\s*,\s*([A-Z][a-zA-Z\s&.,]+)',   # Title, Company
        ]
        
        for pattern in title_company_patterns:
            match = re.search(pattern, raw_lead.raw_data)
            if match and not processed_lead.title:
                potential_title = match.group(1).strip()
                potential_company = match.group(2).strip()
                
                # Basic validation - titles usually contain certain words
                title_indicators = ['CEO', 'CTO', 'VP', 'Director', 'Manager', 'Lead', 'Head', 'Chief', 'President', 'Founder']
                if any(indicator.lower() in potential_title.lower() for indicator in title_indicators):
                    processed_lead.title = potential_title
                    processed_lead.company = potential_company
                    processed_lead.extracted_fields.extend(["title", "company"])
                    break
        
        # Process Apollo-specific data
        if raw_lead.metadata:
            # Extract tech stack from metadata or raw data
            tech_stack_data = raw_lead.metadata.get('tech_stack', '')
            if tech_stack_data:
                processed_lead.tech_stack = extract_tech_stack(tech_stack_data)
                processed_lead.extracted_fields.append("tech_stack")
            else:
                # Try to extract from raw data
                tech_from_raw = extract_tech_stack(raw_lead.raw_data)
                if tech_from_raw:
                    processed_lead.tech_stack = tech_from_raw
                    processed_lead.extracted_fields.append("tech_stack")
            
            # Extract snippet analysis
            snippet = raw_lead.metadata.get('snippet', '')
            if snippet:
                processed_lead.apollo_intelligence = analyze_apollo_snippet(snippet)
                processed_lead.pain_points = extract_pain_points(snippet)
                processed_lead.funding_stage = extract_funding_stage(snippet)
                processed_lead.business_context = extract_business_context(snippet)
                processed_lead.extracted_fields.extend(["apollo_intelligence", "pain_points", "funding_stage", "business_context"])
        
        # Extract additional intelligence from raw data
        if not processed_lead.pain_points:
            processed_lead.pain_points = extract_pain_points(raw_lead.raw_data)
            if processed_lead.pain_points:
                processed_lead.extracted_fields.append("pain_points")
        
        if not processed_lead.funding_stage:
            processed_lead.funding_stage = extract_funding_stage(raw_lead.raw_data)
            if processed_lead.funding_stage and processed_lead.funding_stage != 'unknown':
                processed_lead.extracted_fields.append("funding_stage")
        
        # Create email personalization context
        processed_lead.email_context = {
            "personalization_hooks": processed_lead.apollo_intelligence.get('personalization_hooks', []),
            "business_triggers": processed_lead.apollo_intelligence.get('business_triggers', []),
            "technical_angles": processed_lead.tech_stack[:3] if processed_lead.tech_stack else [],
            "pain_points": processed_lead.pain_points[:3] if processed_lead.pain_points else [],
            "funding_context": processed_lead.funding_stage if processed_lead.funding_stage else None,
            "urgency_indicators": processed_lead.apollo_intelligence.get('urgency_indicators', []),
            "messaging_tone": "professional" if processed_lead.funding_stage in ['series a', 'series b', 'series c'] else "friendly"
        }
        
        # Calculate confidence score based on extracted fields (including Apollo fields)
        critical_fields = ["email", "first_name", "last_name", "company"]
        bonus_fields = ["tech_stack", "pain_points", "funding_stage", "apollo_intelligence"]
        
        extracted_critical = sum(1 for field in critical_fields if field in processed_lead.extracted_fields)
        extracted_bonus = sum(1 for field in bonus_fields if field in processed_lead.extracted_fields)
        
        # Base confidence from critical fields, bonus from Apollo intelligence
        base_confidence = extracted_critical / len(critical_fields)
        bonus_confidence = (extracted_bonus / len(bonus_fields)) * 0.3  # 30% bonus for Apollo data
        processed_lead.confidence_score = min(1.0, base_confidence + bonus_confidence)
        
        # Identify missing fields
        all_possible_fields = [
            "first_name", "last_name", "email", "phone", "title", "company", 
            "company_domain", "linkedin_url", "location", "industry"
        ]
        processed_lead.missing_fields = [
            field for field in all_possible_fields 
            if field not in processed_lead.extracted_fields
        ]
        
        # Add processing notes
        processed_lead.processing_notes.append(f"Extracted {len(processed_lead.extracted_fields)} fields")
        processed_lead.processing_notes.append(f"Confidence score: {processed_lead.confidence_score:.2f}")
        
        return processed_lead
        
    except Exception as e:
        processed_lead.processing_notes.append(f"Parsing error: {str(e)}")
        processed_lead.confidence_score = 0.1
        return processed_lead

def process_bulk_leads(raw_leads: List[RawLeadInput], user_api_keys: Dict[str, str] = None) -> List[ProcessedLead]:
    """Process multiple leads in bulk"""
    processed_leads = []
    
    for raw_lead in raw_leads:
        try:
            processed_lead = process_raw_lead_data(raw_lead, user_api_keys)
            processed_leads.append(processed_lead)
        except Exception as e:
            # Create error lead record
            error_lead = ProcessedLead(
                raw_input=raw_lead.raw_data,
                source=raw_lead.source,
                confidence_score=0.0,
                processing_notes=[f"Bulk processing error: {str(e)}"]
            )
            processed_leads.append(error_lead)
    
    return processed_leads

# Example usage and testing
if __name__ == "__main__":
    # Test with sample data
    sample_leads = [
        RawLeadInput(
            raw_data="John Smith, CEO at TechCorp Inc, john@techcorp.com, San Francisco based startup focusing on AI solutions, 50 employees",
            source="conference_notes",
            metadata={"priority": "high", "event": "AI Summit 2024"}
        ),
        RawLeadInput(
            raw_data="Jane Doe - CTO @ StartupIO (jane.doe@startup.io) - NYC - Series A funded fintech company",
            source="linkedin_export",
            notes="Connected on LinkedIn, interested in our product"
        )
    ]
    
    for lead in sample_leads:
        processed = process_raw_lead_data(lead)
        print(f"Processed Lead: {processed.model_dump_json(indent=2)}")
