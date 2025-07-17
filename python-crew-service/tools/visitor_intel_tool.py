import os
import requests

SNITCHER_API_KEY = os.getenv('SNITCHER_API_KEY')

def get_company_by_ip(ip: str) -> dict:
    """Identifies a company by its IP address using the Snitcher API."""
    print(f"--- GETTING COMPANY BY IP: {ip} ---")
    url = f"https://api.snitcher.com/v1/ip-to-company?ip_address={ip}"
    headers = {
        "Authorization": f"Bearer {SNITCHER_API_KEY}",
        "Accept": "application/json"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    data = response.json()
    
    # Snitcher returns a list of results, we'll take the first one.
    if data.get('results'):
        company = data['results'][0]['company']
        return {
            "companyName": company.get('name'),
            "companyDomain": company.get('domain')
        }
    else:
        raise Exception("No company found for this IP.")
