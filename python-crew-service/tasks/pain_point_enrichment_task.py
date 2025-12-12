from crewai import Task
from pydantic import BaseModel
from typing import List, Optional

class PainPointResult(BaseModel):
    pain_points: List[str]
    confidence: str  # "high", "medium", "low"
    reasoning: str

class PainPointEnrichmentTask:
    def __init__(self, agent, lead_data: dict, icp_context: Optional[dict] = None, offer_context: Optional[dict] = None):
        """
        Generate pain points for a lead based on their profile and context.
        
        Args:
            agent: The CrewAI agent to use
            lead_data: Dict with lead info (name, title, company, industry, etc.)
            icp_context: Optional dict with ICP pain points to consider
            offer_context: Optional dict with offer info (what problem it solves)
        """
        
        # Build context sections
        lead_info = f"""
        Name: {lead_data.get('first_name', '')} {lead_data.get('last_name', '')}
        Title: {lead_data.get('title', 'Unknown')}
        Company: {lead_data.get('company', 'Unknown')}
        Industry: {lead_data.get('industry', 'Unknown')}
        Company Size: {lead_data.get('company_size', 'Unknown')}
        Location: {lead_data.get('location', 'Unknown')}
        """
        
        # Add enriched data if available
        enriched = lead_data.get('enriched_data', {})
        if enriched:
            if isinstance(enriched, str):
                import json
                try:
                    enriched = json.loads(enriched)
                except:
                    enriched = {}
            
            if enriched.get('technologies'):
                lead_info += f"\nTechnologies Used: {', '.join(enriched['technologies'][:5])}"
            if enriched.get('funding_stage'):
                lead_info += f"\nFunding Stage: {enriched['funding_stage']}"
            if enriched.get('recent_news'):
                lead_info += f"\nRecent News: {enriched['recent_news']}"
        
        icp_section = ""
        if icp_context and icp_context.get('pain_points'):
            icp_section = f"""
            
            === ICP CONTEXT ===
            These are general pain points for this type of customer:
            {', '.join(icp_context['pain_points'])}
            
            Use these as inspiration but make them SPECIFIC to this lead.
            """
        
        offer_section = ""
        if offer_context:
            offer_section = f"""
            
            === OFFER CONTEXT ===
            The solution being offered: {offer_context.get('name', '')}
            Value proposition: {offer_context.get('value_proposition', '')}
            
            Focus on pain points that this offer could address.
            """
        
        self.task = Task(
            description=f"""
            Analyze this lead and generate 3-5 specific pain points they likely experience.
            
            === LEAD INFORMATION ===
            {lead_info}
            {icp_section}
            {offer_section}
            
            === REQUIREMENTS ===
            1. Generate 3-5 pain points that are SPECIFIC to this person's role and company
            2. Each pain point should be a complete sentence describing a challenge
            3. Pain points should be emotionally resonant (capture frustration/desire)
            4. Focus on problems that are actionable (a solution could address them)
            5. Consider the person's seniority level and responsibilities
            
            === PAIN POINT FORMULA ===
            Good pain points follow this pattern:
            "[Specific challenge] that leads to [negative outcome]"
            
            Examples:
            - "Spending hours on manual lead research instead of having conversations"
            - "Losing deals because follow-up emails get buried in the inbox"
            - "Can't accurately forecast pipeline because CRM data is inconsistent"
            
            === OUTPUT FORMAT ===
            Return a JSON object with:
            - pain_points: Array of 3-5 specific pain point strings
            - confidence: "high", "medium", or "low" based on how much context you had
            - reasoning: Brief explanation of why you identified these pain points
            """,
            expected_output="A JSON object with pain_points array, confidence level, and reasoning.",
            agent=agent
        )
        self.task.output_pydantic = PainPointResult
