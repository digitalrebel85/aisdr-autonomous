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

@tool("Apollo Organization Enrich")
def apollo_organization_enrich(domain: str) -> Dict[str, Any]:
    """Enriches company/organization data using Apollo.io API."""
    apollo_key = USER_API_KEYS.get('apollo')
    if not apollo_key:
        apollo_key = os.getenv('APOLLO_API_KEY')
        if not apollo_key:
            return {"error": "Apollo API key not configured", "provider": "apollo"}
    
    api_url = f"https://api.apollo.io/api/v1/organizations/enrich"
    headers = {
        "accept": "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": apollo_key
    }
    params = {"domain": domain}
    
    try:
        print(f"Apollo org enrich request: domain={domain}")
        response = requests.get(api_url, headers=headers, params=params, timeout=15)
        print(f"Apollo org response status: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        
        org = data.get("organization", {})
        
        # Normalize Apollo organization data
        result = {
            "provider": "apollo",
            "name": org.get("name"),
            "description": org.get("short_description") or org.get("seo_description"),
            "website_url": org.get("website_url"),
            "linkedin_url": org.get("linkedin_url"),
            "twitter_url": org.get("twitter_url"),
            "facebook_url": org.get("facebook_url"),
            "industry": org.get("industry"),
            "industries": org.get("industries", []),
            "estimated_num_employees": org.get("estimated_num_employees"),
            "annual_revenue": org.get("annual_revenue"),
            "annual_revenue_printed": org.get("annual_revenue_printed"),
            "founded_year": org.get("founded_year"),
            "keywords": org.get("keywords", []),
            "technologies": org.get("technologies", []),
            "address": org.get("raw_address"),
            "city": org.get("city"),
            "state": org.get("state"),
            "country": org.get("country"),
            "phone": org.get("phone"),
            "logo_url": org.get("logo_url"),
            "raw_data": org  # Keep full response for reference
        }
        
        return result
        
    except requests.RequestException as e:
        print(f"Apollo organization enrich failed: {e}")
        return {"error": str(e), "provider": "apollo"}

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
    """Runs the complete company profiling process using Apollo first, then fallback to Serper."""
    if MOCK_MODE:
        return {
            "snippet": "A mock company that makes amazing widgets.",
            "techStack": ["Python", "FastAPI", "React"],
            "source_breakdown": {"apollo": True, "builtwith": True},
        }

    result = {
        "description": None,
        "techStack": [],
        "source_breakdown": {}
    }
    
    # Try Apollo organization enrichment FIRST (best data)
    print(f"Trying Apollo organization enrichment for domain: {domain}")
    apollo_data = apollo_organization_enrich.func(domain)
    
    if apollo_data and not apollo_data.get("error"):
        print("Apollo organization enrichment successful!")
        result["description"] = apollo_data.get("description")
        result["name"] = apollo_data.get("name")
        result["industry"] = apollo_data.get("industry")
        result["industries"] = apollo_data.get("industries", [])
        result["estimated_num_employees"] = apollo_data.get("estimated_num_employees")
        result["annual_revenue"] = apollo_data.get("annual_revenue")
        result["annual_revenue_printed"] = apollo_data.get("annual_revenue_printed")
        result["founded_year"] = apollo_data.get("founded_year")
        result["keywords"] = apollo_data.get("keywords", [])
        result["technologies"] = apollo_data.get("technologies", [])  # Apollo has tech stack!
        result["techStack"] = apollo_data.get("technologies", [])
        result["linkedin_url"] = apollo_data.get("linkedin_url")
        result["twitter_url"] = apollo_data.get("twitter_url")
        result["facebook_url"] = apollo_data.get("facebook_url")
        result["phone"] = apollo_data.get("phone")
        result["address"] = apollo_data.get("address")
        result["city"] = apollo_data.get("city")
        result["state"] = apollo_data.get("state")
        result["country"] = apollo_data.get("country")
        result["logo_url"] = apollo_data.get("logo_url")
        result["primary_source"] = "apollo"
        result["source_breakdown"]["apollo"] = True
        result["apollo_raw"] = apollo_data.get("raw_data")
    else:
        print(f"Apollo failed, trying Serper: {apollo_data.get('error', 'unknown error')}")
        result["source_breakdown"]["apollo"] = False
        
        # Fallback to Serper for company description
        serper_data = serper_company_search.func(company_name, domain)
        if serper_data and not serper_data.get("error"):
            result["description"] = serper_data.get("description")
            result["knowledge_graph"] = serper_data.get("knowledge_graph", {})
            result["organic_results"] = serper_data.get("organic_results", [])[:3]
            result["search_query"] = serper_data.get("search_query", "")
            result["primary_source"] = "serper"
            result["source_breakdown"]["serper"] = True
        else:
            result["source_breakdown"]["serper"] = False
    
    # Try BuiltWith for additional tech stack (if Apollo didn't provide enough)
    if not result.get("techStack") or len(result.get("techStack", [])) < 3:
        tech_data = builtwith_tech_stack.func(domain)
        if tech_data and tech_data.get("tech"):
            # Merge with existing tech stack
            existing_tech = set(result.get("techStack", []))
            new_tech = set(tech_data.get("tech", []))
            result["techStack"] = list(existing_tech | new_tech)
            result["source_breakdown"]["builtwith"] = True
        else:
            result["source_breakdown"]["builtwith"] = False

    return result

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
