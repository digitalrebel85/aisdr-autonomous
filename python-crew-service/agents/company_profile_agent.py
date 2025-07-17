import os
import json
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import tool

# --- Environment Setup ---
load_dotenv()
VALUESERP_KEY = os.getenv("VALUESERP_KEY")
BUILTWITH_KEY = os.getenv("BUILTWITH_KEY")
MOCK_MODE = os.getenv("MOCK") == "true"

# --- API Tools ---

@tool("ValueSERP Company Snippet")
def valueserp_company_snippet(company_name: str) -> Dict[str, Any]:
    """Fetches a descriptive snippet for a company from ValueSERP."""
    if not VALUESERP_KEY:
        return {}
    params = {"api_key": VALUESERP_KEY, "q": company_name, "num": "1"}
    try:
        response = requests.get("https://api.valueserp.com/search", params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        if data.get("organic_results"):
            return {"snippet": data["organic_results"][0].get("snippet", "")}
        return {}
    except requests.RequestException:
        return {}

@tool("BuiltWith Tech Stack")
def builtwith_tech_stack(domain: str) -> Dict[str, Any]:
    """Identifies the technology stack of a company's domain via BuiltWith."""
    if not BUILTWITH_KEY:
        return {}
    params = {"KEY": BUILTWITH_KEY, "LOOKUP": domain}
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

    snippet_data = valueserp_company_snippet(company_name)
    tech_data = builtwith_tech_stack(domain)

    snippet = snippet_data.get("snippet")
    tech_stack = tech_data.get("tech", [])

    if not snippet and not tech_stack:
        return {"snippet": None, "techStack": [], "source_breakdown": {"valueserp": False, "builtwith": False}}

    return {
        "snippet": snippet,
        "techStack": tech_stack,
        "source_breakdown": {
            "valueserp": bool(snippet_data),
            "builtwith": bool(tech_data),
        },
    }

# --- CrewAI Agent & Task ---

company_profile_agent = Agent(
    role="Company Profile Agent",
    goal="Fetch company snippet and tech stack",
    backstory="You help SDRs gather concise company descriptions and technology details.",
    tools=[valueserp_company_snippet, builtwith_tech_stack],
    allow_delegation=False,
    verbose=False,
)

company_profile_task = Task(
    description="""
    Use tools to fetch a short snippet describing the company and a list of technologies used.

    Input:
    - company_name: {company_name}
    - domain: {domain}

    Return only the JSON below (no commentary):
    {{
        "snippet": "...",
        "techStack": ["...","..."]
    }}
    """,
    agent=company_profile_agent,
    expected_output="A JSON object with the company snippet and a list of technologies."
)

# --- Main execution block ---
if __name__ == "__main__":
    print("--- Running Company Profile Agent ---")
    if MOCK_MODE:
        print("INFO: Running in MOCK mode.")

    result = run_company_profile(company_name="Tesla", domain="tesla.com")
    print(json.dumps(result, indent=2))
