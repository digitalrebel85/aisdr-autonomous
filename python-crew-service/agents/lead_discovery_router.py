"""
Provider-agnostic lead discovery router.
Tries all available providers the user has configured, merges results, deduplicates by email.
Supports: Apollo, Icypeas, FindyMail, ZoomInfo, Snov.io, Lusha, RocketReach, and more.
"""

import os
import json
import requests
import time
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# ─── Provider Implementations ────────────────────────────────────────────────

def search_apollo(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search Apollo /mixed_people/search endpoint."""
    query = _build_apollo_query(icp_criteria)
    query['api_key'] = api_key
    query['per_page'] = min(max_results, 100)
    query['page'] = 1

    try:
        resp = requests.post(
            "https://api.apollo.io/v1/mixed_people/search",
            json=query,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        people = data.get('people', [])
        return {
            'success': True,
            'provider': 'apollo',
            'leads': [_normalize_apollo_lead(p) for p in people],
            'total_available': data.get('pagination', {}).get('total_entries', 0)
        }
    except Exception as e:
        return {'success': False, 'provider': 'apollo', 'error': str(e), 'leads': []}


def search_icypeas(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search Icypeas people search API."""
    try:
        payload = {
            'job_title': icp_criteria.get('job_titles', []),
            'industry': icp_criteria.get('industries', []),
            'location': icp_criteria.get('locations', []),
            'company_size': icp_criteria.get('company_sizes', []),
            'limit': min(max_results, 100)
        }
        resp = requests.post(
            "https://app.icypeas.com/api/v2/people-search",
            json=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get('data', data.get('results', []))
        return {
            'success': True,
            'provider': 'icypeas',
            'leads': [_normalize_generic_lead(p, 'icypeas') for p in results],
            'total_available': data.get('total', len(results))
        }
    except Exception as e:
        return {'success': False, 'provider': 'icypeas', 'error': str(e), 'leads': []}


def search_snov(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search Snov.io database search API."""
    try:
        # Snov uses a two-step: get access token, then search
        token_resp = requests.post(
            "https://api.snov.io/v1/oauth/access_token",
            json={'grant_type': 'client_credentials', 'client_id': api_key.split(':')[0], 'client_secret': api_key.split(':')[-1]},
            timeout=10
        )
        token_resp.raise_for_status()
        access_token = token_resp.json().get('access_token')

        payload = {
            'positions': icp_criteria.get('job_titles', []),
            'industries': icp_criteria.get('industries', []),
            'locations': icp_criteria.get('locations', []),
            'limit': min(max_results, 100)
        }
        resp = requests.post(
            "https://api.snov.io/v2/prospect-search",
            json=payload,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        prospects = data.get('data', [])
        return {
            'success': True,
            'provider': 'snov',
            'leads': [_normalize_generic_lead(p, 'snov') for p in prospects],
            'total_available': data.get('total', len(prospects))
        }
    except Exception as e:
        return {'success': False, 'provider': 'snov', 'error': str(e), 'leads': []}


def search_rocketreach(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search RocketReach person search API."""
    try:
        payload = {
            'query': {
                'current_title': icp_criteria.get('job_titles', []),
                'current_employer_industry': icp_criteria.get('industries', []),
                'location': icp_criteria.get('locations', []),
            },
            'page_size': min(max_results, 100),
            'start': 1
        }
        resp = requests.post(
            "https://api.rocketreach.co/v2/api/search",
            json=payload,
            headers={
                'Api-Key': api_key,
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        profiles = data.get('profiles', [])
        return {
            'success': True,
            'provider': 'rocketreach',
            'leads': [_normalize_generic_lead(p, 'rocketreach') for p in profiles],
            'total_available': data.get('pagination', {}).get('total', len(profiles))
        }
    except Exception as e:
        return {'success': False, 'provider': 'rocketreach', 'error': str(e), 'leads': []}


def search_lusha(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search Lusha prospecting API."""
    try:
        payload = {
            'filters': {
                'jobTitles': icp_criteria.get('job_titles', []),
                'industries': icp_criteria.get('industries', []),
                'locations': icp_criteria.get('locations', []),
                'companySizes': icp_criteria.get('company_sizes', []),
            },
            'limit': min(max_results, 100)
        }
        resp = requests.post(
            "https://api.lusha.com/v2/prospecting/search",
            json=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        contacts = data.get('data', data.get('contacts', []))
        return {
            'success': True,
            'provider': 'lusha',
            'leads': [_normalize_generic_lead(p, 'lusha') for p in contacts],
            'total_available': data.get('totalResults', len(contacts))
        }
    except Exception as e:
        return {'success': False, 'provider': 'lusha', 'error': str(e), 'leads': []}


def search_findymail(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """FindyMail is primarily an email finder/verifier, not a search tool.
    Use it as a verification layer on top of other providers."""
    return {
        'success': True,
        'provider': 'findymail',
        'leads': [],
        'total_available': 0,
        'note': 'FindyMail is used for email verification, not lead search. Leads from other providers will be verified through FindyMail.'
    }


def search_zoominfo(api_key: str, icp_criteria: Dict, max_results: int) -> Dict[str, Any]:
    """Search ZoomInfo contacts API."""
    try:
        payload = {
            'searchType': 'contact',
            'maxResults': min(max_results, 100),
            'outputFields': ['firstName', 'lastName', 'email', 'jobTitle', 'companyName', 'companyWebsite', 'industry', 'employeeCount', 'city', 'country', 'linkedInUrl', 'phone'],
            'filter': {}
        }
        if icp_criteria.get('job_titles'):
            payload['filter']['jobTitle'] = icp_criteria['job_titles']
        if icp_criteria.get('industries'):
            payload['filter']['industry'] = icp_criteria['industries']
        if icp_criteria.get('locations'):
            payload['filter']['locationCountry'] = icp_criteria['locations']
        if icp_criteria.get('company_sizes'):
            payload['filter']['employeeCount'] = icp_criteria['company_sizes']

        resp = requests.post(
            "https://api.zoominfo.com/search/contact",
            json=payload,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        contacts = data.get('data', data.get('result', {}).get('data', []))
        return {
            'success': True,
            'provider': 'zoominfo',
            'leads': [_normalize_generic_lead(p, 'zoominfo') for p in contacts],
            'total_available': data.get('totalResults', len(contacts))
        }
    except Exception as e:
        return {'success': False, 'provider': 'zoominfo', 'error': str(e), 'leads': []}


# ─── Provider Registry ───────────────────────────────────────────────────────

# Maps provider key → search function
# Order = priority (first match wins for dedup)
DISCOVERY_PROVIDERS = {
    'apollo': search_apollo,
    'zoominfo': search_zoominfo,
    'lusha': search_lusha,
    'rocketreach': search_rocketreach,
    'snov': search_snov,
    'icypeas': search_icypeas,
    'findymail': search_findymail,
}


# ─── Normalization ────────────────────────────────────────────────────────────

def _normalize_apollo_lead(person: Dict) -> Dict[str, Any]:
    """Normalize Apollo person data to standard lead format."""
    org = person.get('organization', {}) or {}
    return {
        'apollo_id': person.get('id'),
        'first_name': person.get('first_name', ''),
        'last_name': person.get('last_name', ''),
        'name': person.get('name', ''),
        'email': person.get('email'),
        'title': person.get('title', ''),
        'linkedin_url': person.get('linkedin_url'),
        'phone': person.get('phone'),
        'company': org.get('name', ''),
        'company_domain': org.get('website_url', ''),
        'company_industry': org.get('industry', ''),
        'company_size': org.get('estimated_num_employees', ''),
        'location': person.get('city', ''),
        'country': person.get('country', ''),
        'seniority': person.get('seniority', ''),
        'source': 'apollo'
    }


def _normalize_generic_lead(person: Dict, provider: str) -> Dict[str, Any]:
    """Normalize any provider's person data to standard lead format.
    Uses common field name patterns across providers."""
    
    # Try multiple field name patterns for each attribute
    def get_field(*keys, default=''):
        for key in keys:
            val = person.get(key)
            if val:
                return val
        return default

    email = get_field('email', 'emailAddress', 'email_address', 'workEmail', 'work_email')
    
    return {
        'apollo_id': get_field('id', 'contactId', 'contact_id', 'personId', 'person_id'),
        'first_name': get_field('first_name', 'firstName', 'fname'),
        'last_name': get_field('last_name', 'lastName', 'lname'),
        'name': get_field('name', 'fullName', 'full_name', default=f"{get_field('first_name', 'firstName')} {get_field('last_name', 'lastName')}".strip()),
        'email': email,
        'title': get_field('title', 'jobTitle', 'job_title', 'current_title', 'position'),
        'linkedin_url': get_field('linkedin_url', 'linkedInUrl', 'linkedin', 'li_url', 'linkedinUrl'),
        'phone': get_field('phone', 'phoneNumber', 'phone_number', 'directPhone', 'direct_phone'),
        'company': get_field('company', 'companyName', 'company_name', 'current_employer', 'organization'),
        'company_domain': get_field('company_domain', 'companyWebsite', 'company_website', 'domain', 'website'),
        'company_industry': get_field('industry', 'companyIndustry', 'company_industry'),
        'company_size': get_field('company_size', 'employeeCount', 'employee_count', 'companySize'),
        'location': get_field('location', 'city', 'locality'),
        'country': get_field('country', 'countryName', 'country_name'),
        'seniority': get_field('seniority', 'seniorityLevel', 'seniority_level', 'management_level'),
        'source': provider
    }


def _build_apollo_query(icp_criteria: Dict) -> Dict:
    """Build Apollo API search query from ICP criteria."""
    query = {}
    
    if icp_criteria.get('job_titles'):
        query['person_titles'] = icp_criteria['job_titles']
    
    if icp_criteria.get('seniority_levels'):
        seniority_map = {'C-Level': 'cxo', 'VP': 'vp', 'Director': 'director', 'Manager': 'manager', 'Senior': 'senior', 'Entry Level': 'entry'}
        query['person_seniorities'] = [seniority_map.get(s, s.lower()) for s in icp_criteria['seniority_levels']]
    
    if icp_criteria.get('locations'):
        query['person_locations'] = icp_criteria['locations']
    
    if icp_criteria.get('departments'):
        dept_map = {'Marketing': 'marketing', 'Sales': 'sales', 'Engineering': 'engineering', 'Product': 'product', 'Finance': 'finance', 'Operations': 'operations', 'HR': 'human_resources', 'IT': 'information_technology'}
        query['departments'] = [dept_map.get(d, d.lower().replace(' ', '_')) for d in icp_criteria['departments']]
    
    if icp_criteria.get('industries'):
        query['q_organization_keyword_tags'] = icp_criteria['industries']
    
    if icp_criteria.get('company_sizes'):
        size_map = {'1-10': '1,10', '11-50': '11,50', '51-200': '51,200', '201-500': '201,500', '501-1000': '501,1000', '1001-5000': '1001,5000', '5000+': '5001,50000'}
        query['organization_num_employees_ranges'] = [size_map.get(s, s) for s in icp_criteria['company_sizes'] if s in size_map]
    
    if icp_criteria.get('technologies'):
        query['organization_technologies'] = icp_criteria['technologies']
    
    query['only_verified_contacts'] = True
    return query


# ─── Main Router ──────────────────────────────────────────────────────────────

def discover_leads_multi_provider(
    icp_criteria: Dict[str, Any],
    api_keys: Dict[str, str],
    max_results: int = 25,
    preferred_provider: Optional[str] = None
) -> Dict[str, Any]:
    """
    Discover leads using all available providers the user has configured.
    
    Args:
        icp_criteria: ICP search criteria
        api_keys: Dict of provider → api_key (only providers with keys will be tried)
        max_results: Max leads to return
        preferred_provider: Optional provider to try first
    
    Returns:
        Merged, deduplicated results from all providers
    """
    all_leads: List[Dict] = []
    provider_results: Dict[str, Any] = {}
    seen_emails: set = set()
    
    # Determine provider order — preferred first, then by priority
    provider_order = []
    if preferred_provider and preferred_provider in DISCOVERY_PROVIDERS and preferred_provider in api_keys:
        provider_order.append(preferred_provider)
    
    for provider_key in DISCOVERY_PROVIDERS:
        if provider_key not in provider_order and provider_key in api_keys:
            provider_order.append(provider_key)
    
    if not provider_order:
        # Fallback: try env vars
        env_apollo = os.getenv('APOLLO_API_KEY')
        if env_apollo:
            provider_order.append('apollo')
            api_keys['apollo'] = env_apollo
    
    if not provider_order:
        return {
            'success': False,
            'error': 'No lead discovery providers configured. Add API keys in Settings → API Keys.',
            'leads': [],
            'total_discovered': 0,
            'providers_tried': []
        }
    
    print(f"[discovery-router] Trying providers: {provider_order}")
    
    for provider_key in provider_order:
        if len(all_leads) >= max_results:
            break
        
        search_fn = DISCOVERY_PROVIDERS[provider_key]
        remaining = max_results - len(all_leads)
        
        try:
            print(f"[discovery-router] Searching {provider_key} for up to {remaining} leads...")
            result = search_fn(api_keys[provider_key], icp_criteria, remaining)
            provider_results[provider_key] = {
                'success': result.get('success', False),
                'count': len(result.get('leads', [])),
                'total_available': result.get('total_available', 0),
                'error': result.get('error')
            }
            
            if result.get('success') and result.get('leads'):
                for lead in result['leads']:
                    email = (lead.get('email') or '').lower().strip()
                    if email and email not in seen_emails:
                        seen_emails.add(email)
                        lead['discovery_provider'] = provider_key
                        all_leads.append(lead)
                
                print(f"[discovery-router] {provider_key}: found {len(result['leads'])} leads ({len(all_leads)} total after dedup)")
            else:
                print(f"[discovery-router] {provider_key}: {result.get('error', 'no results')}")
                
        except Exception as e:
            print(f"[discovery-router] {provider_key} error: {e}")
            provider_results[provider_key] = {'success': False, 'error': str(e), 'count': 0}
    
    # Trim to max
    final_leads = all_leads[:max_results]
    
    return {
        'success': len(final_leads) > 0,
        'total_discovered': len(final_leads),
        'leads': final_leads,
        'providers_used': provider_results,
        'providers_tried': provider_order,
        'search_summary': f"Found {len(final_leads)} leads from {sum(1 for p in provider_results.values() if p.get('success'))} providers"
    }
