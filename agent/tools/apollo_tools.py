"""
Apollo.io API Integration for Lead Discovery

Handles lead search, enrichment, and data extraction from Apollo.
"""

import os
import json
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ApolloLead:
    email: str
    first_name: str
    last_name: str
    title: str
    company: str
    company_size: str
    industry: str
    location: str
    linkedin_url: Optional[str]
    phone: Optional[str]
    confidence_score: int
    
class ApolloClient:
    """Client for Apollo.io API."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('APOLLO_API_KEY')
        self.base_url = "https://api.apollo.io/api/v1"
        self.headers = {
            "Content-Type": "application/json",
            "X-Api-Key": self.api_key
        }
        
    def search_leads(
        self,
        title_keywords: List[str],
        industries: List[str],
        company_sizes: List[str],
        locations: List[str],
        limit: int = 50
    ) -> List[ApolloLead]:
        """
        Search for leads matching ICP criteria.
        
        Args:
            title_keywords: Job titles to search for (e.g., ['CEO', 'Head of Sales'])
            industries: Industry names (e.g., ['Marketing Agency', 'Software'])
            company_sizes: Size ranges (e.g., ['11-50', '51-200'])
            locations: Locations (e.g., ['United Kingdom', 'London'])
            limit: Max results to return (max 100 per API call)
            
        Returns:
            List of ApolloLead objects
        """
        if not self.api_key:
            print("Error: Apollo API key not configured")
            return []
            
        url = f"{self.base_url}/mixed_people/search"
        
        # Build person titles filter
        person_titles = []
        for keyword in title_keywords:
            person_titles.append({"term": keyword, "exact": False})
        
        # Build the request body
        data = {
            "api_key": self.api_key,
            "person_titles": person_titles,
            "person_locations": locations,
            "organization_industry_tag_ids": industries,
            "organization_num_employees_ranges": company_sizes,
            "per_page": min(limit, 100),  # API max is 100
            "page": 1,
            "contact_email_status": ["verified", "unverified", "likely_valid"],  # Include all
            "reveal_personal_emails": True,
            "reveal_phone_number": False  # Don't need phone for email outreach
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            people = result.get('people', [])
            
            leads = []
            for person in people:
                lead = self._parse_person_to_lead(person)
                if lead and lead.email:  # Only include if we have an email
                    leads.append(lead)
                    
            print(f"Found {len(leads)} leads from Apollo")
            return leads
            
        except requests.exceptions.RequestException as e:
            print(f"Apollo API error: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            return []
            
    def _parse_person_to_lead(self, person: Dict) -> Optional[ApolloLead]:
        """Convert Apollo person object to ApolloLead."""
        try:
            # Extract email (prefer work email)
            email = person.get('email')
            if not email and 'contact' in person:
                email = person['contact'].get('email')
            
            # Get organization info
            org = person.get('organization', {})
            
            return ApolloLead(
                email=email or '',
                first_name=person.get('first_name', ''),
                last_name=person.get('last_name', ''),
                title=person.get('title', ''),
                company=org.get('name', ''),
                company_size=org.get('estimated_num_employees', ''),
                industry=org.get('industry', ''),
                location=f"{person.get('city', '')}, {person.get('state', '')}, {person.get('country', '')}".strip(', '),
                linkedin_url=person.get('linkedin_url'),
                phone=person.get('work_phone') or person.get('mobile_phone'),
                confidence_score=person.get('contact', {}).get('email_quality_score', 0)
            )
        except Exception as e:
            print(f"Error parsing person: {e}")
            return None
            
    def enrich_person(self, email: Optional[str] = None, linkedin_url: Optional[str] = None) -> Optional[ApolloLead]:
        """
        Enrich a single person by email or LinkedIn URL.
        
        Args:
            email: Person's email address
            linkedin_url: Person's LinkedIn profile URL
            
        Returns:
            Enriched ApolloLead or None
        """
        if not email and not linkedin_url:
            print("Error: Need email or linkedin_url to enrich")
            return None
            
        url = f"{self.base_url}/people/match"
        
        params = {}
        if email:
            params['email'] = email
        if linkedin_url:
            params['linkedin_url'] = linkedin_url
            
        try:
            response = requests.post(url, headers=self.headers, params=params, timeout=15)
            response.raise_for_status()
            
            result = response.json()
            person = result.get('person')
            
            if person:
                return self._parse_person_to_lead(person)
            else:
                print("No person found in Apollo")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Apollo enrichment error: {e}")
            return None
            
    def get_organization(self, domain: str) -> Optional[Dict]:
        """
        Get organization details by domain.
        
        Args:
            domain: Company domain (e.g., 'apple.com')
            
        Returns:
            Organization dict or None
        """
        url = f"{self.base_url}/organizations/enrich"
        
        params = {"domain": domain}
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=15)
            response.raise_for_status()
            
            return response.json().get('organization')
            
        except requests.exceptions.RequestException as e:
            print(f"Apollo org lookup error: {e}")
            return None

# Convenience functions
_apollo_client: Optional[ApolloClient] = None

def init_apollo(api_key: Optional[str] = None) -> ApolloClient:
    """Initialize global Apollo client."""
    global _apollo_client
    _apollo_client = ApolloClient(api_key)
    return _apollo_client

def get_apollo() -> Optional[ApolloClient]:
    """Get global Apollo client."""
    return _apollo_client

async def discover_leads(
    title_keywords: List[str],
    industries: List[str],
    company_sizes: List[str],
    locations: List[str],
    limit: int = 50
) -> List[ApolloLead]:
    """Discover leads matching ICP criteria."""
    if not _apollo_client:
        init_apollo()
    return _apollo_client.search_leads(title_keywords, industries, company_sizes, locations, limit)

async def enrich_lead(email: Optional[str] = None, linkedin_url: Optional[str] = None) -> Optional[ApolloLead]:
    """Enrich a single lead."""
    if not _apollo_client:
        init_apollo()
    return _apollo_client.enrich_person(email, linkedin_url)