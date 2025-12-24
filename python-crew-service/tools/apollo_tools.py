import os
import requests
from dotenv import load_dotenv

load_dotenv()

APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')

def get_company_size_bucket(count: int | None) -> str | None:
    """Parses an employee count number into a human-readable size bucket.
    Aligned with ICP scoring options."""
    if count is None:
        return None
    if count <= 10: return '1-10'
    if count <= 50: return '11-50'
    if count <= 200: return '51-200'
    if count <= 500: return '201-500'
    if count <= 1000: return '501-1000'
    if count <= 5000: return '1001-5000'
    if count <= 10000: return '5001-10000'
    return '10001+'

def get_company_profile(domain: str) -> dict | None:
    """Fetches a company's profile from Apollo's Enrichment API."""
    if not APOLLO_API_KEY:
        print("ERROR: APOLLO_API_KEY is not set. Cannot enrich company profile.")
        return None

    url = f"https://api.apollo.io/v1/companies/enrich?domain={domain}&api_key={APOLLO_API_KEY}"
    headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        data = response.json()

        company_data = data.get('company')
        if not company_data:
            return None

        return {
            'companyName': company_data.get('name'),
            'industry': company_data.get('industry'),
            'companySize': get_company_size_bucket(company_data.get('employee_count')),
            'description': company_data.get('short_description'),
            'fundingStage': company_data.get('funding_stage'),
            'technographics': company_data.get('technologies', []) or [],
        }
    except requests.HTTPError as e:
        print(f"Apollo API request failed with status {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred while fetching company profile: {e}")
        return None
