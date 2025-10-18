from crewai import Crew, Process, Task
from agents.apollo_discovery_agent import create_apollo_discovery_agent
from typing import Dict, Any

class ApolloDiscoveryTask:
    def __init__(self, agent, icp_criteria: Dict[str, Any], max_results: int = 100):
        self.agent = agent
        self.icp_criteria = icp_criteria
        self.max_results = max_results
        
        self.task = Task(
            description=f"""
            Discover high-quality leads using Apollo API based on the provided ICP criteria.
            
            ICP Criteria:
            - Industries: {icp_criteria.get('industries', [])}
            - Company Sizes: {icp_criteria.get('company_sizes', [])}
            - Job Titles: {icp_criteria.get('job_titles', [])}
            - Locations: {icp_criteria.get('locations', [])}
            - Seniority Levels: {icp_criteria.get('seniority_levels', [])}
            - Departments: {icp_criteria.get('departments', [])}
            - Technologies: {icp_criteria.get('technologies', [])}
            - Keywords: {icp_criteria.get('keywords', [])}
            - Employee Count Range: {icp_criteria.get('employee_count_min', 'N/A')} - {icp_criteria.get('employee_count_max', 'N/A')}
            
            Maximum Results: {max_results}
            
            IMPORTANT: You must use the apollo_people_search tool to actually search for leads.
            Do NOT generate fake data or code. Use the available tools to perform real API searches.
            
            Your tasks:
            1. Use the "Build Apollo Search Query" tool to create the search parameters
            2. Use the "Apollo People Search" tool to execute the actual search
            3. Process and format the real results from Apollo API
            4. Return the actual discovered leads data
            
            CRITICAL: Only return real lead data from Apollo API calls. Do not hallucinate or generate fake results.
            
            Expected JSON output format:
            {{
                "success": true/false,
                "total_discovered": number,
                "leads": [array of real lead objects from Apollo],
                "query_used": {{actual apollo query used}},
                "search_summary": "description of actual search performed",
                "error": "error message if any"
            }}
            """,
            agent=self.agent,
            expected_output="JSON object containing discovered leads and search metadata"
        )

def create_apollo_discovery_crew(llm, icp_criteria: Dict[str, Any], max_results: int = 100):
    """
    Create a crew for Apollo lead discovery.
    
    Args:
        llm: Language model instance
        icp_criteria: ICP profile criteria dictionary
        max_results: Maximum number of leads to discover
    
    Returns:
        Configured CrewAI crew for lead discovery
    """
    # Create the Apollo discovery agent
    apollo_agent = create_apollo_discovery_agent(llm)
    
    # Create the discovery task
    discovery_task = ApolloDiscoveryTask(
        agent=apollo_agent.agent,
        icp_criteria=icp_criteria,
        max_results=max_results
    )
    
    # Create and return the crew
    return Crew(
        agents=[apollo_agent.agent],
        tasks=[discovery_task.task],
        process=Process.sequential,
        verbose=True,
        manager_llm=llm
    )
