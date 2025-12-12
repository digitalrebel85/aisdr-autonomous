from crewai import Crew, Process
from agents.pain_point_enrichment_agent import PainPointEnrichmentAgent
from tasks.pain_point_enrichment_task import PainPointEnrichmentTask
from typing import Optional

def create_pain_point_crew(llm, lead_data: dict, icp_context: Optional[dict] = None, offer_context: Optional[dict] = None):
    """
    Create a crew to enrich a lead with AI-generated pain points.
    
    Args:
        llm: The language model to use
        lead_data: Dict with lead info (name, title, company, industry, etc.)
        icp_context: Optional dict with ICP pain points to consider
        offer_context: Optional dict with offer info (what problem it solves)
    
    Returns:
        Crew instance ready to kickoff
    """
    agent = PainPointEnrichmentAgent(llm=llm).agent
    task = PainPointEnrichmentTask(
        agent=agent,
        lead_data=lead_data,
        icp_context=icp_context,
        offer_context=offer_context
    ).task
    
    return Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )
