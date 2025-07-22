import os
import json
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool

# --- Environment Setup ---
load_dotenv()
CRUNCHBASE_KEY = os.getenv("CRUNCHBASE_KEY")
BOMBORA_KEY = os.getenv("BOMBORA_KEY")
G2_KEY = os.getenv("G2_KEY")
MOCK_MODE = os.getenv("MOCK") == "true"

# --- API Tools ---

@tool("Crunchbase Lookup")
def crunchbase_lookup(company_name: str) -> Dict[str, Any]:
    """Looks up company funding data from Crunchbase."""
    if not CRUNCHBASE_KEY:
        return {}
    slug = company_name.lower().replace(" ", "-")
    url = f"https://api.crunchbase.com/api/v4/entities/organizations/{slug}?user_key={CRUNCHBASE_KEY}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return {}

@tool("Bombora Intent Data")
def bombora_intent(domain: str) -> Dict[str, Any]:
    """Fetches company intent data from Bombora."""
    if not BOMBORA_KEY:
        return {}
    url = f"https://api.bombora.com/intent?domain={domain}"
    headers = {"x-api-key": BOMBORA_KEY}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return {}

@tool("G2 Visitor Signals")
def g2_visitor_signals(domain: str) -> Dict[str, Any]:
    """Retrieves G2 visitor signals for a company domain."""
    if not G2_KEY:
        return {}
    url = f"https://data.g2.com/api/v1/companies/{domain}/visitors"
    headers = {"Authorization": f"Bearer {G2_KEY}"}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return {}

# --- Helper Functions ---

def calc_intent_score(funding: Dict, bombora: Dict, g2: Dict) -> int:
    """Calculates a buyer intent score from 0-100."""
    score = 0
    if funding:
        score += 40
    if bombora and "score" in bombora:
        score += min(30, bombora["score"] // 10)
    if g2 and "visitor_count" in g2:
        score += min(30, g2["visitor_count"] * 2)
    return score

def run_buyer_intent(company_name: str, domain: str) -> Dict[str, Any]:
    """Runs the full buyer intent analysis process."""
    if MOCK_MODE:
        return {
            "intent_score": 85,
            "recent_events": ["Series C funding: $50M", "Bombora intent score: 85", "G2 visitors: 10"],
            "hiring_flag": True,
            "source_breakdown": {"funding": True, "bombora": True, "g2": True}
        }

    funding_data = crunchbase_lookup(company_name)
    bombora_data = bombora_intent(domain)
    g2_data = g2_visitor_signals(domain)

    intent_score = calc_intent_score(funding_data, bombora_data, g2_data)
    recent_events: List[str] = []
    hiring_flag = False

    # Process funding data
    if funding_data.get("properties", {}).get("last_funding_type"):
        last_round = funding_data["properties"]["last_funding_type"]
        amount = funding_data["properties"].get("last_funding_total", {}).get("value_usd", 0)
        recent_events.append(f"{last_round} funding: ${amount/1_000_000:.0f}M")

    # Process Bombora data
    if bombora_data.get("score"):
        recent_events.append(f"Bombora intent score: {bombora_data['score']}")
        if any("hiring" in topic.lower() for topic in bombora_data.get("topics", [])):
            hiring_flag = True

    # Process G2 data
    if g2_data.get("visitor_count"):
        recent_events.append(f"G2 visitors: {g2_data['visitor_count']}")
        if g2_data.get("job_postings", 0) > 0:
            hiring_flag = True

    if not any([funding_data, bombora_data, g2_data]):
        return {
            "intent_score": 0, "recent_events": [], "hiring_flag": False,
            "source_breakdown": {"funding": False, "bombora": False, "g2": False}
        }

    return {
        "intent_score": intent_score,
        "recent_events": recent_events,
        "hiring_flag": hiring_flag,
        "source_breakdown": {
            "funding": bool(funding_data),
            "bombora": bool(bombora_data),
            "g2": bool(g2_data)
        }
    }

# --- CrewAI Agent & Task ---

buyer_intent_agent = Agent(
    role="Buyer Intent Analyst",
    goal="Analyze multiple data sources to determine a company's buyer intent.",
    backstory="You are an expert market analyst who synthesizes data from Crunchbase, Bombora, and G2 to create a holistic view of a company's recent activities and intent signals.",
    tools=[crunchbase_lookup, bombora_intent, g2_visitor_signals],
    allow_delegation=False,
    verbose=False,
)

buyer_intent_task = Task(
    description="""
    Analyze the buyer intent for company '{company_name}' with domain '{domain}'.
    1. Call Crunchbase, Bombora, and G2 tools.
    2. Synthesize the results into a final JSON report.
    Return ONLY the final JSON object with no commentary.
    """,
    agent=buyer_intent_agent,
    expected_output="A JSON object summarizing the intent score, recent events, and hiring flag."
)

# --- Main execution block ---
if __name__ == "__main__":
    print("--- Running Buyer Intent Analysis for 'Acme Solar' ---")
    # To run with mock data, set MOCK=true in your environment
    if MOCK_MODE:
        print("INFO: Running in MOCK mode.")

    result = run_buyer_intent(company_name="Acme Solar", domain="acmesolar.com")
    print(json.dumps(result, indent=2))
