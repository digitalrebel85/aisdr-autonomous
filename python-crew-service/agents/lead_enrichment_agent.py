import os
import json
import requests
from crewai import Agent, Task, Crew, Process
from crewai.tools import tool
from typing import Dict, Any, Optional

# Global variable to store user's API keys for the current request
USER_API_KEYS: Dict[str, str] = {}

# --- Enhanced Multi-Provider Enrichment Tools ---

@tool('Apollo Person Lookup')
def apollo_person_lookup(email: str = None, linkedin_url: str = None) -> dict:
    """Looks up a person's details on Apollo.io using their email or LinkedIn URL."""
    apollo_key = USER_API_KEYS.get('apollo')
    if not apollo_key:
        return {"error": "Apollo API key not configured", "provider": "apollo"}
    if not email and not linkedin_url:
        return {"error": "Either email or linkedin_url is required.", "provider": "apollo"}

    # Apollo people/match endpoint - email goes in URL params, not body
    api_url = "https://api.apollo.io/api/v1/people/match"
    headers = {
        "accept": "application/json",
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        "x-api-key": apollo_key
    }
    
    # Build query params - Apollo expects email in URL
    params = {}
    if email:
        params['email'] = email
    if linkedin_url:
        params['linkedin_url'] = linkedin_url
    
    # Empty body for POST
    body = {}

    try:
        print(f"Apollo request: {api_url} params={params}")
        response = requests.post(api_url, headers=headers, params=params, json=body, timeout=15)
        print(f"Apollo response status: {response.status_code}")
        print(f"Apollo response: {response.text[:500] if response.text else 'empty'}")
        response.raise_for_status()
        data = response.json()
        data['provider'] = 'apollo'
        return data
    except requests.exceptions.RequestException as e:
        print(f"Apollo API request failed: {e}")
        return {"error": str(e), "provider": "apollo"}

@tool('PeopleDataLabs Person Lookup')
def pdl_person_lookup(email: str = None, linkedin_url: str = None) -> dict:
    """Looks up a person's details on PeopleDataLabs.com using their email or LinkedIn URL."""
    pdl_key = USER_API_KEYS.get('pdl')
    if not pdl_key:
        return {"error": "PDL API key not configured", "provider": "pdl"}
    if not email and not linkedin_url:
        return {"error": "Either email or linkedin_url is required.", "provider": "pdl"}

    api_url = "https://api.peopledatalabs.com/v5/person/enrich"
    params = {"api_key": pdl_key}
    if email:
        params['email'] = email
    elif linkedin_url:
        params['profile'] = linkedin_url

    try:
        response = requests.get(api_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        data['provider'] = 'pdl'
        return data
    except requests.exceptions.RequestException as e:
        print(f"PeopleDataLabs API request failed: {e}")
        return {"error": str(e), "provider": "pdl"}

@tool('Serper Person Search')
def serper_person_search(email: str = None, name: str = None, company: str = None) -> dict:
    """Search for person information using Serper API (Google Search)."""
    serper_key = USER_API_KEYS.get('serper')
    if not serper_key:
        # Fallback to environment variable if user hasn't configured their own key
        serper_key = os.getenv('SERPER_API_KEY')
        if not serper_key:
            return {"error": "Serper API key not configured", "provider": "serper"}
    
    # Build search query
    query_parts = []
    if name:
        query_parts.append(f'"{name}"')
    if company:
        query_parts.append(f'"{company}"')
    if email:
        query_parts.append(f'"{email}"')
    
    query_parts.extend(["LinkedIn", "profile", "contact"])
    query = " ".join(query_parts)
    
    if not query.strip():
        return {"error": "Need at least name, company, or email for search.", "provider": "serper"}

    api_url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": serper_key,
        "Content-Type": "application/json"
    }
    payload = {
        "q": query,
        "num": 10
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        data['provider'] = 'serper'
        data['search_query'] = query
        return data
    except requests.exceptions.RequestException as e:
        print(f"Serper API request failed: {e}")
        return {"error": str(e), "provider": "serper"}

@tool('Clearbit Person Lookup')
def clearbit_person_lookup(email: str) -> dict:
    """Looks up a person's details using Clearbit API."""
    clearbit_key = USER_API_KEYS.get('clearbit')
    if not clearbit_key:
        return {"error": "Clearbit API key not configured", "provider": "clearbit"}
    if not email:
        return {"error": "Email is required for Clearbit lookup.", "provider": "clearbit"}

    api_url = f"https://person.clearbit.com/v2/people/find?email={email}"
    headers = {"Authorization": f"Bearer {clearbit_key}"}

    try:
        response = requests.get(api_url, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        data['provider'] = 'clearbit'
        return data
    except requests.exceptions.RequestException as e:
        print(f"Clearbit API request failed: {e}")
        return {"error": str(e), "provider": "clearbit"}

@tool('Hunter Email Finder')
def hunter_email_finder(domain: str, first_name: str = None, last_name: str = None) -> dict:
    """Find email and person details using Hunter.io API."""
    hunter_key = USER_API_KEYS.get('hunter')
    if not hunter_key:
        return {"error": "Hunter API key not configured", "provider": "hunter"}
    if not domain:
        return {"error": "Domain is required for Hunter lookup.", "provider": "hunter"}

    api_url = "https://api.hunter.io/v2/email-finder"
    params = {
        "api_key": hunter_key,
        "domain": domain
    }
    
    if first_name:
        params['first_name'] = first_name
    if last_name:
        params['last_name'] = last_name

    try:
        response = requests.get(api_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        data['provider'] = 'hunter'
        return data
    except requests.exceptions.RequestException as e:
        print(f"Hunter API request failed: {e}")
        return {"error": str(e), "provider": "hunter"}

@tool('Multi-Provider Enrichment')
def multi_provider_enrichment(email: str = None, linkedin_url: str = None, name: str = None, company: str = None, company_domain: str = None) -> dict:
    """Attempts enrichment across multiple providers in priority order."""
    results = {}
    enriched_data = {}
    
    # Try Apollo first
    if email or linkedin_url:
        try:
            print("Trying apollo enrichment...")
            result = apollo_person_lookup.func(email, linkedin_url)
            results['apollo'] = result
            
            if not result.get('error') and _has_useful_data(result, 'apollo'):
                enriched_data = _normalize_provider_data(result, 'apollo')
                enriched_data['primary_source'] = 'apollo'
                enriched_data['all_sources'] = results
                print("Successfully enriched from apollo")
                return enriched_data
        except Exception as e:
            print(f"Error with apollo: {e}")
            results['apollo'] = {"error": str(e), "provider": "apollo"}
    
    # Try PDL
    if email or linkedin_url:
        try:
            print("Trying pdl enrichment...")
            result = pdl_person_lookup.func(email, linkedin_url)
            results['pdl'] = result
            
            if not result.get('error') and _has_useful_data(result, 'pdl'):
                enriched_data = _normalize_provider_data(result, 'pdl')
                enriched_data['primary_source'] = 'pdl'
                enriched_data['all_sources'] = results
                print("Successfully enriched from pdl")
                return enriched_data
        except Exception as e:
            print(f"Error with pdl: {e}")
            results['pdl'] = {"error": str(e), "provider": "pdl"}
    
    # Try Clearbit
    if email:
        try:
            print("Trying clearbit enrichment...")
            result = clearbit_person_lookup.func(email)
            results['clearbit'] = result
            
            if not result.get('error') and _has_useful_data(result, 'clearbit'):
                enriched_data = _normalize_provider_data(result, 'clearbit')
                enriched_data['primary_source'] = 'clearbit'
                enriched_data['all_sources'] = results
                print("Successfully enriched from clearbit")
                return enriched_data
        except Exception as e:
            print(f"Error with clearbit: {e}")
            results['clearbit'] = {"error": str(e), "provider": "clearbit"}
    
    # Try Serper
    try:
        print("Trying serper enrichment...")
        result = serper_person_search.func(email, name, company)
        results['serper'] = result
        
        if not result.get('error') and _has_useful_data(result, 'serper'):
            enriched_data = _normalize_provider_data(result, 'serper')
            enriched_data['primary_source'] = 'serper'
            enriched_data['all_sources'] = results
            print("Successfully enriched from serper")
            return enriched_data
    except Exception as e:
        print(f"Error with serper: {e}")
        results['serper'] = {"error": str(e), "provider": "serper"}
    
    # Try Hunter
    if company_domain and name:
        try:
            print("Trying hunter enrichment...")
            first_name = name.split()[0] if name else None
            last_name = name.split()[-1] if name and len(name.split()) > 1 else None
            result = hunter_email_finder.func(company_domain, first_name, last_name)
            results['hunter'] = result
            
            if not result.get('error') and _has_useful_data(result, 'hunter'):
                enriched_data = _normalize_provider_data(result, 'hunter')
                enriched_data['primary_source'] = 'hunter'
                enriched_data['all_sources'] = results
                print("Successfully enriched from hunter")
                return enriched_data
        except Exception as e:
            print(f"Error with hunter: {e}")
            results['hunter'] = {"error": str(e), "provider": "hunter"}
    
    # If no provider returned useful data, create basic enrichment from input
    print("No providers returned useful data, creating basic enrichment...")
    enriched_data = {
        "name": name,
        "first_name": name.split()[0] if name else None,
        "last_name": name.split()[-1] if name and len(name.split()) > 1 else None,
        "title": None,
        "company": company,
        "industry": None,
        "company_size": None,
        "location": None,
        "linkedin_url": linkedin_url,
        "phone": None,
        "email": email,
        "source": "basic_inference",
        "primary_source": "basic_inference",
        "all_sources": results,
        "confidence_score": 0.3,
        "enrichment_notes": "Basic enrichment from input data - no external providers available"
    }
    
    return enriched_data

def _has_useful_data(data: dict, provider: str) -> bool:
    """Check if provider returned useful data."""
    if provider == 'apollo':
        return data.get('person', {}).get('name') is not None
    elif provider == 'pdl':
        return data.get('full_name') is not None
    elif provider == 'clearbit':
        return data.get('name', {}).get('fullName') is not None
    elif provider == 'serper':
        return len(data.get('organic', [])) > 0
    elif provider == 'hunter':
        return data.get('data', {}).get('email') is not None
    return False

def _normalize_provider_data(data: dict, provider: str) -> dict:
    """Normalize data from different providers into standard format."""
    normalized = {
        "name": None,
        "first_name": None,
        "last_name": None,
        "title": None,
        "company": None,
        "industry": None,
        "company_size": None,
        "location": None,
        "linkedin_url": None,
        "phone": None,
        "email": None,
        "source": provider
    }
    
    if provider == 'apollo':
        person = data.get('person', {})
        normalized.update({
            "name": person.get('name'),
            "first_name": person.get('first_name'),
            "last_name": person.get('last_name'),
            "title": person.get('title'),
            "linkedin_url": person.get('linkedin_url'),
            "email": person.get('email'),
            "phone": person.get('phone_numbers', [{}])[0].get('raw_number') if person.get('phone_numbers') else None,
            "location": f"{person.get('city', '')}, {person.get('country', '')}".strip(', ') if person.get('city') or person.get('country') else None
        })
        
        # Get organization data - can be at root level or under person
        org = data.get('organization', {}) or person.get('organization', {})
        if org:
            normalized.update({
                "company": org.get('name'),
                "industry": org.get('industry'),
                "company_size": f"{org.get('estimated_num_employees')} employees" if org.get('estimated_num_employees') else None,
                # Store organization data for company enrichment
                "organization_data": {
                    "name": org.get('name'),
                    "website_url": org.get('website_url'),
                    "primary_domain": org.get('primary_domain'),
                    "linkedin_url": org.get('linkedin_url'),
                    "twitter_url": org.get('twitter_url'),
                    "facebook_url": org.get('facebook_url'),
                    "phone": org.get('phone'),
                    "industry": org.get('industry'),
                    "estimated_num_employees": org.get('estimated_num_employees'),
                    "annual_revenue": org.get('annual_revenue'),
                    "founded_year": org.get('founded_year'),
                    "short_description": org.get('short_description'),
                    "keywords": org.get('keywords', []),
                    "logo_url": org.get('logo_url'),
                    "city": org.get('city'),
                    "state": org.get('state'),
                    "country": org.get('country'),
                    "raw_address": org.get('raw_address'),
                }
            })
    
    elif provider == 'pdl':
        normalized.update({
            "name": data.get('full_name'),
            "first_name": data.get('first_name'),
            "last_name": data.get('last_name'),
            "title": data.get('job_title'),
            "linkedin_url": data.get('linkedin_url'),
            "email": data.get('emails', [{}])[0].get('address') if data.get('emails') else None,
            "phone": data.get('phone_numbers', [{}])[0].get('number') if data.get('phone_numbers') else None,
            "location": data.get('location_name')
        })
        
        if data.get('job_company_name'):
            normalized.update({
                "company": data.get('job_company_name'),
                "industry": data.get('job_company_industry'),
                "company_size": data.get('job_company_size')
            })
    
    elif provider == 'clearbit':
        name_data = data.get('name', {})
        normalized.update({
            "name": name_data.get('fullName'),
            "first_name": name_data.get('givenName'),
            "last_name": name_data.get('familyName'),
            "title": data.get('employment', {}).get('title'),
            "linkedin_url": data.get('linkedin', {}).get('handle'),
            "email": data.get('email'),
            "location": data.get('location')
        })
        
        employment = data.get('employment', {})
        if employment:
            normalized.update({
                "company": employment.get('name'),
                "industry": employment.get('industry')
            })
    
    elif provider == 'serper':
        # Extract information from search results
        organic_results = data.get('organic', [])
        if organic_results:
            # Look for LinkedIn profiles and extract info
            for result in organic_results:
                if 'linkedin.com/in/' in result.get('link', ''):
                    normalized['linkedin_url'] = result.get('link')
                    break
    
    elif provider == 'hunter':
        hunter_data = data.get('data', {})
        normalized.update({
            "email": hunter_data.get('email'),
            "first_name": hunter_data.get('first_name'),
            "last_name": hunter_data.get('last_name'),
            "linkedin_url": hunter_data.get('linkedin_url'),
            "phone": hunter_data.get('phone_number')
        })
        
        if hunter_data.get('first_name') and hunter_data.get('last_name'):
            normalized['name'] = f"{hunter_data.get('first_name')} {hunter_data.get('last_name')}"
    
    return normalized

# --- Agent & Task Definition ---

lead_enricher_agent = Agent(
    role="Multi-Provider Lead Enrichment Agent",
    goal="Return comprehensive person & company details using multiple enrichment providers",
    backstory="An expert data enrichment specialist with access to Apollo, PeopleDataLabs, Serper, Clearbit, and Hunter APIs. Skilled at finding the most comprehensive lead information by trying multiple sources and normalizing the results.",
    tools=[
        apollo_person_lookup,
        pdl_person_lookup, 
        serper_person_search,
        clearbit_person_lookup,
        hunter_email_finder,
        multi_provider_enrichment
    ],
    allow_delegation=False,
    verbose=True
)

lead_enrichment_task = Task(
    description="""
    Use the multi_provider_enrichment tool to enrich this lead comprehensively.
    This tool will automatically try multiple providers (Apollo, PeopleDataLabs, Clearbit, Serper, Hunter) 
    in priority order and return the best available data.

    Input parameters:
    - email: {email}
    - linkedin_url: {linkedin_url}
    - name: {name}
    - company: {company}
    - company_domain: {company_domain}

    The tool will return normalized data in this structure:
    {{
        "name": "Full name",
        "first_name": "First name",
        "last_name": "Last name", 
        "title": "Job title",
        "company": "Company name",
        "industry": "Industry",
        "company_size": "Company size",
        "location": "Location",
        "linkedin_url": "LinkedIn profile",
        "phone": "Phone number",
        "email": "Email address",
        "source": "Primary data source used",
        "primary_source": "Which provider gave the best data",
        "all_sources": "Results from all attempted providers"
    }}

    Use the multi_provider_enrichment tool with all available input parameters.
    Return ONLY the final JSON result from the tool.
    """,
    agent=lead_enricher_agent,
    expected_output="A comprehensive JSON object containing normalized lead data from the best available source."
)

# --- Main execution block for testing ---

def create_lead_enrichment_crew(lead_data: dict, api_keys: dict = None) -> Crew:
    """Create lead enrichment crew with user's API keys."""
    global USER_API_KEYS
    USER_API_KEYS = api_keys or {}
    
    enrichment_crew = Crew(
        agents=[lead_enricher_agent],
        tasks=[lead_enrichment_task],
        process=Process.sequential
    )
    
    return enrichment_crew

if __name__ == "__main__":
    print("--- Running Lead Enrichment Test ---")

    # Create the crew
    api_keys = {
        'apollo': 'YOUR_APOLLO_API_KEY',
        'pdl': 'YOUR_PDL_API_KEY',
        'serper': 'YOUR_SERPER_API_KEY',
        'clearbit': 'YOUR_CLEARBIT_API_KEY',
        'hunter': 'YOUR_HUNTER_API_KEY'
    }
    enrichment_crew = create_lead_enrichment_crew({}, api_keys)

    # Execute the crew with test data
    inputs = {
        "email": "elon@tesla.com",
        "linkedin_url": "https://www.linkedin.com/in/elon-musk/",
        "name": "Elon Musk",
        "company": "Tesla",
        "company_domain": "tesla.com"
    }
    result = enrichment_crew.kickoff(inputs=inputs)

    print("\n--- Enrichment Result ---")
    try:
        # The result from the agent might be a string, so we parse it.
        result_json = json.loads(result)
        print(json.dumps(result_json, indent=2))
    except (json.JSONDecodeError, TypeError):
        print(result)
