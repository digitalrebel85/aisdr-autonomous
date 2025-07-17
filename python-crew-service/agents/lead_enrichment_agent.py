import os
import json
import requests
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import tool

# Load environment variables from .env file
load_dotenv()

APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')
PDL_API_KEY = os.getenv('PDL_API_KEY')

# --- Tools for Lead Enrichment ---

@tool('Apollo Lookup')
def apollo_lookup(email: str = None, linkedin_url: str = None) -> dict:
    """Looks up a person's details on Apollo.io using their email or LinkedIn URL."""
    if not APOLLO_API_KEY:
        return {"error": "Apollo API key is not set."}
    if not email and not linkedin_url:
        return {"error": "Either email or linkedin_url is required."}

    api_url = "https://api.apollo.io/v1/person/enrich"
    params = {"api_key": APOLLO_API_KEY}
    if email:
        params['email'] = email
    elif linkedin_url:
        params['linkedin_url'] = linkedin_url

    try:
        response = requests.get(api_url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Apollo API request failed: {e}")
        return {}

@tool('PeopleDataLabs Lookup')
def pdl_lookup(email: str = None, linkedin_url: str = None) -> dict:
    """Looks up a person's details on PeopleDataLabs.com using their email or LinkedIn URL."""
    if not PDL_API_KEY:
        return {"error": "PDL API key is not set."}
    if not email and not linkedin_url:
        return {"error": "Either email or linkedin_url is required."}

    api_url = "https://api.peopledatalabs.com/v5/person/enrich"
    params = {"api_key": PDL_API_KEY}
    if email:
        params['email'] = email
    elif linkedin_url:
        # PDL uses 'profile' for LinkedIn URLs
        params['profile'] = linkedin_url

    try:
        response = requests.get(api_url, params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"PeopleDataLabs API request failed: {e}")
        return {}

# --- Agent & Task Definition ---

lead_enricher_agent = Agent(
    role="Lead Enrichment Agent",
    goal="Return person & company details for a raw lead using available tools",
    backstory="An expert in data enrichment, skilled in using Apollo and PeopleDataLabs to find comprehensive details about professional leads.",
    tools=[apollo_lookup, pdl_lookup],
    allow_delegation=False,
    verbose=False
)

lead_enrichment_task = Task(
    description="""
    Enrich this lead using the available tools. Try Apollo first. If the result is empty or lacks a 'name', try PeopleDataLabs.

    Input:
    - email: {email}
    - linkedin_url: {linkedin_url}

    After getting the data, normalize it into the following JSON structure. Return ONLY the final JSON.
    If a value is not found, use null.

    Normalization Schema:
    {{
        "name": "...",
        "title": "...",
        "company": "...",
        "industry": "...",
        "size": "...",
        "location": "...",
        "source": "apollo" | "pdl" | "none"
    }}
    """,
    agent=lead_enricher_agent,
    expected_output="A single JSON object containing the normalized lead data."
)

# --- Main execution block for testing ---

if __name__ == "__main__":
    print("--- Running Lead Enrichment Test ---")

    # Check for API keys
    if not APOLLO_API_KEY or not PDL_API_KEY:
        print("\nWARNING: APOLLO_API_KEY or PDL_API_KEY environment variables not set.")
        print("The test will run but will likely fail to find real data.")
        print("Please create a .env file with the required keys to run a full test.\n")

    # Create the crew
    enrichment_crew = Crew(
        agents=[lead_enricher_agent],
        tasks=[lead_enrichment_task],
        process=Process.sequential
    )

    # Execute the crew with a dummy email
    inputs = {
        "email": "elon@tesla.com",
        "linkedin_url": "https://www.linkedin.com/in/elon-musk/"
    }
    result = enrichment_crew.kickoff(inputs=inputs)

    print("\n--- Enrichment Result ---")
    try:
        # The result from the agent might be a string, so we parse it.
        result_json = json.loads(result)
        print(json.dumps(result_json, indent=2))
    except (json.JSONDecodeError, TypeError):
        print(result)
