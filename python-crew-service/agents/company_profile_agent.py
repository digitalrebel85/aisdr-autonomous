import os
import json
import requests
from typing import Dict, Any, List, Optional
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool

# Global variable to store user's API keys for the current request
USER_API_KEYS: Dict[str, str] = {}
MOCK_MODE = os.getenv("MOCK") == "true"

# --- API Tools ---

@tool("Serper Company Search")
def serper_company_search(company_name: str, domain: str = None) -> Dict[str, Any]:
    """Fetches company information using Serper API (Google Search)."""
    serper_key = USER_API_KEYS.get('serper')
    if not serper_key:
        # Fallback to environment variable if user hasn't configured their own key
        serper_key = os.getenv('SERPER_API_KEY')
        if not serper_key:
            return {"error": "Serper API key not configured", "provider": "serper"}
    
    # Build search query for company information
    query_parts = [f'"{company_name}"']
    if domain:
        query_parts.append(f'site:{domain} OR "{domain}"')
    query_parts.extend(["about", "company", "business", "services"])
    query = " ".join(query_parts)
    
    api_url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": serper_key,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query,
        "num": 5
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Extract useful company information
        company_info = {
            "provider": "serper",
            "search_query": query,
            "organic_results": data.get("organic", []),
            "knowledge_graph": data.get("knowledgeGraph", {}),
            "answer_box": data.get("answerBox", {})
        }
        
        # Extract company description from results
        if data.get("knowledgeGraph", {}).get("description"):
            company_info["description"] = data["knowledgeGraph"]["description"]
        elif data.get("organic", []):
            company_info["description"] = data["organic"][0].get("snippet", "")
        
        return company_info
        
    except requests.RequestException as e:
        return {"error": str(e), "provider": "serper"}

@tool("BuiltWith Tech Stack")
def builtwith_tech_stack(domain: str) -> Dict[str, Any]:
    """Identifies the technology stack of a company's domain via BuiltWith."""
    builtwith_key = USER_API_KEYS.get('builtwith')
    if not builtwith_key:
        # Fallback to environment variable if user hasn't configured their own key
        builtwith_key = os.getenv('BUILTWITH_API_KEY')
        if not builtwith_key:
            return {"error": "BuiltWith API key not configured", "provider": "builtwith"}
    params = {"KEY": builtwith_key, "LOOKUP": domain}
    try:
        response = requests.get("https://api.builtwith.com/v21/api.json", params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        # BuiltWith API response structure can be complex; we simplify it.
        if data.get("Results", [{}])[0].get("Result", {}).get("Paths"):
            tech_list = []
            for path in data["Results"][0]["Result"]["Paths"]:
                tech_list.extend([tech.get("Name") for tech in path.get("Technologies", [])])
            return {"tech": list(set(tech_list))}  # Return unique tech names
        return {}
    except requests.RequestException:
        return {}

# --- Main Function ---

def run_company_profile(company_name: str, domain: str) -> Dict[str, Any]:
    """Runs the complete company profiling process."""
    if MOCK_MODE:
        return {
            "snippet": "A mock company that makes amazing widgets.",
            "techStack": ["Python", "FastAPI", "React"],
            "source_breakdown": {"valueserp": True, "builtwith": True},
        }

    company_data = serper_company_search(company_name, domain)
    tech_data = builtwith_tech_stack(domain)

    description = company_data.get("description")
    tech_stack = tech_data.get("tech", [])
    
    # Extract additional company info from Serper results
    knowledge_graph = company_data.get("knowledge_graph", {})
    organic_results = company_data.get("organic_results", [])

    if not description and not tech_stack:
        return {"description": None, "techStack": [], "source_breakdown": {"serper": False, "builtwith": False}}

    return {
        "description": description,
        "techStack": tech_stack,
        "knowledge_graph": knowledge_graph,
        "organic_results": organic_results[:3] if organic_results else [],  # Limit to top 3 results
        "search_query": company_data.get("search_query", ""),
        "source_breakdown": {
            "serper": bool(company_data and not company_data.get("error")),
            "builtwith": bool(tech_data and not tech_data.get("error")),
        },
    }

# --- CrewAI Agent & Task ---

company_profile_agent = Agent(
    role="Company Profile Agent",
    goal="Fetch company information and tech stack using Serper and BuiltWith",
    backstory="You help SDRs gather comprehensive company descriptions and technology details using Google search and tech stack analysis.",
    tools=[serper_company_search, builtwith_tech_stack],
    allow_delegation=False,
    verbose=False,
)

company_profile_task = Task(
    description="""
    Use the Serper Company Search tool to fetch comprehensive company information and the BuiltWith tool to get the technology stack.

    Input:
    - company_name: {company_name}
    - domain: {domain}

    Return only the JSON below (no commentary):
    {{
        "description": "Company description from search results",
        "techStack": ["React", "Node.js", "AWS"],
        "knowledge_graph": {{"key": "value"}},
        "organic_results": [{{"title": "...", "snippet": "..."}}],
        "search_query": "The search query used"
    }}
    """,
    agent=company_profile_agent,
    expected_output="A JSON object with the company snippet and a list of technologies."
)

def create_company_profile_crew(company_data: dict, api_keys: dict = None) -> Crew:
    """Create company profile crew with user's API keys."""
    global USER_API_KEYS
    USER_API_KEYS = api_keys or {}
    
    company_profile_crew = Crew(
        agents=[company_profile_agent],
        tasks=[company_profile_task],
        process=Process.sequential
    )
    
    return company_profile_crew

# --- Main execution block ---
if __name__ == "__main__":
    print("--- Running Company Profile Agent ---")
    if MOCK_MODE:
        print("INFO: Running in MOCK mode.")

    # Test with mock API keys
    api_keys = {
        'valueserp': 'YOUR_VALUESERP_API_KEY',
        'builtwith': 'YOUR_BUILTWITH_API_KEY'
    }
    crew = create_company_profile_crew({}, api_keys)
    
    inputs = {
        "company_name": "Tesla",
        "domain": "tesla.com"
    }
    result = crew.kickoff(inputs=inputs)
    print(json.dumps(result.raw, indent=2))
