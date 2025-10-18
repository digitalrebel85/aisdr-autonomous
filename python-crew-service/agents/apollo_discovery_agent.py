import os
import json
import requests
import time
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from crewai import Agent
from crewai.tools import tool
from pydantic import BaseModel

load_dotenv()

APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')
APOLLO_BASE_URL = "https://api.apollo.io/v1"

class ApolloSearchResult(BaseModel):
    total_results: int
    leads: List[Dict[str, Any]]
    pagination: Dict[str, Any]

@tool("Apollo People Search")
def apollo_people_search(search_params: Dict[str, Any], page: int = 1, per_page: int = 25) -> Dict[str, Any]:
    """
    Search for people using Apollo API with advanced filters.
    
    Args:
        search_params: Dictionary containing Apollo search parameters
        page: Page number for pagination (default: 1)
        per_page: Results per page (default: 25, max: 100)
    
    Returns:
        Dictionary with search results including people data and pagination info
    """
    if not APOLLO_API_KEY:
        return {"error": "Apollo API key not configured"}
    
    url = f"{APOLLO_BASE_URL}/mixed_people/search"
    
    # Prepare the request payload
    payload = {
        "api_key": APOLLO_API_KEY,
        "page": page,
        "per_page": min(per_page, 100),  # Apollo max is 100
        **search_params
    }
    
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract and format the results
        people = data.get('people', [])
        pagination = data.get('pagination', {})
        
        formatted_leads = []
        for person in people:
            lead_data = {
                'apollo_id': person.get('id'),
                'first_name': person.get('first_name', ''),
                'last_name': person.get('last_name', ''),
                'name': person.get('name', ''),
                'email': person.get('email'),
                'title': person.get('title', ''),
                'linkedin_url': person.get('linkedin_url'),
                'phone': person.get('phone'),
                'company': person.get('organization', {}).get('name', '') if person.get('organization') else '',
                'company_domain': person.get('organization', {}).get('website_url', '') if person.get('organization') else '',
                'company_industry': person.get('organization', {}).get('industry', '') if person.get('organization') else '',
                'company_size': person.get('organization', {}).get('estimated_num_employees', '') if person.get('organization') else '',
                'location': person.get('city', ''),
                'country': person.get('country', ''),
                'seniority': person.get('seniority', ''),
                'departments': person.get('departments', []),
                'apollo_data': person  # Store full Apollo data for reference
            }
            formatted_leads.append(lead_data)
        
        return {
            'success': True,
            'total_results': pagination.get('total_entries', 0),
            'current_page': pagination.get('page', 1),
            'total_pages': pagination.get('total_pages', 1),
            'per_page': pagination.get('per_page', per_page),
            'leads': formatted_leads,
            'pagination': pagination
        }
        
    except requests.RequestException as e:
        error_msg = f"Apollo API request failed: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', 'Unknown error')}"
            except:
                error_msg += f" - Status: {e.response.status_code}"
        
        return {"error": error_msg, "success": False}
    
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "success": False}

@tool("Apollo Organization Search")
def apollo_organization_search(search_params: Dict[str, Any], page: int = 1, per_page: int = 25) -> Dict[str, Any]:
    """
    Search for organizations using Apollo API.
    
    Args:
        search_params: Dictionary containing Apollo organization search parameters
        page: Page number for pagination
        per_page: Results per page
    
    Returns:
        Dictionary with organization search results
    """
    if not APOLLO_API_KEY:
        return {"error": "Apollo API key not configured"}
    
    url = f"{APOLLO_BASE_URL}/organizations/search"
    
    payload = {
        "api_key": APOLLO_API_KEY,
        "page": page,
        "per_page": min(per_page, 100),
        **search_params
    }
    
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        organizations = data.get('organizations', [])
        pagination = data.get('pagination', {})
        
        return {
            'success': True,
            'total_results': pagination.get('total_entries', 0),
            'organizations': organizations,
            'pagination': pagination
        }
        
    except requests.RequestException as e:
        return {"error": f"Apollo organization search failed: {str(e)}", "success": False}

@tool("Build Apollo Search Query")
def build_apollo_search_query(icp_criteria: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build Apollo API search query from ICP criteria using correct /mixed_people/search parameters.
    
    Args:
        icp_criteria: ICP profile criteria dictionary
    
    Returns:
        Apollo API compatible search query for /mixed_people/search endpoint
    """
    query = {}
    
    # Person-level filters
    if icp_criteria.get('job_titles'):
        query['person_titles'] = icp_criteria['job_titles']
    
    if icp_criteria.get('seniority_levels'):
        # Map to Apollo seniority values: cxo, vp, director, manager, etc.
        seniority_mapping = {
            'C-Level': 'cxo',
            'VP': 'vp', 
            'Director': 'director',
            'Manager': 'manager',
            'Senior': 'senior',
            'Entry Level': 'entry'
        }
        apollo_seniorities = []
        for level in icp_criteria['seniority_levels']:
            mapped = seniority_mapping.get(level, level.lower())
            apollo_seniorities.append(mapped)
        if apollo_seniorities:
            query['person_seniorities'] = apollo_seniorities
    
    if icp_criteria.get('locations'):
        query['person_locations'] = icp_criteria['locations']
    
    if icp_criteria.get('departments'):
        # Map to Apollo department values: marketing, sales, engineering, etc.
        dept_mapping = {
            'Marketing': 'marketing',
            'Sales': 'sales', 
            'Engineering': 'engineering',
            'Product': 'product',
            'Finance': 'finance',
            'Operations': 'operations',
            'HR': 'human_resources',
            'IT': 'information_technology'
        }
        apollo_departments = []
        for dept in icp_criteria['departments']:
            mapped = dept_mapping.get(dept, dept.lower().replace(' ', '_'))
            apollo_departments.append(mapped)
        if apollo_departments:
            query['departments'] = apollo_departments
    
    # Company-level filters
    if icp_criteria.get('industries'):
        # Use industry keywords for broader matching
        query['organization_industry_keywords'] = icp_criteria['industries']
    
    if icp_criteria.get('company_sizes'):
        # Map company size ranges to Apollo employee count format
        size_mapping = {
            '1-10': '1-10',
            '11-50': '11-50', 
            '51-200': '51-200',
            '201-500': '201-500',
            '501-1000': '501-1000',
            '1001-5000': '1001-5000',
            '5000+': '5001+'
        }
        apollo_sizes = []
        for size in icp_criteria['company_sizes']:
            if size in size_mapping:
                apollo_sizes.append(size_mapping[size])
        if apollo_sizes:
            query['organization_num_employees_ranges'] = apollo_sizes
    
    if icp_criteria.get('locations'):
        # Use same locations for company HQ
        query['organization_locations'] = icp_criteria['locations']
    
    if icp_criteria.get('technologies'):
        query['organization_technologies'] = icp_criteria['technologies']
    
    if icp_criteria.get('funding_stages'):
        # Map funding stages to Apollo funding rounds
        funding_mapping = {
            'Pre-Seed': 'pre_seed',
            'Seed': 'seed',
            'Series A': 'series_a',
            'Series B': 'series_b', 
            'Series C': 'series_c',
            'Series D+': 'series_d_and_beyond',
            'IPO': 'ipo',
            'Private Equity': 'private_equity'
        }
        apollo_funding = []
        for stage in icp_criteria['funding_stages']:
            mapped = funding_mapping.get(stage, stage.lower().replace(' ', '_'))
            apollo_funding.append(mapped)
        if apollo_funding:
            query['last_funding_round'] = apollo_funding
    
    if icp_criteria.get('keywords'):
        # Use organization domain search for keyword matching
        query['q_organization_domains'] = ' '.join(icp_criteria['keywords'])
    
    # Add employee count range if specified (overrides company_sizes)
    if icp_criteria.get('employee_count_min') or icp_criteria.get('employee_count_max'):
        min_emp = icp_criteria.get('employee_count_min', 1)
        max_emp = icp_criteria.get('employee_count_max', '')
        if max_emp:
            query['organization_num_employees_ranges'] = [f"{min_emp}-{max_emp}"]
        else:
            query['organization_num_employees_ranges'] = [f"{min_emp}+"]
    
    # Add revenue range if specified
    if icp_criteria.get('revenue_min') or icp_criteria.get('revenue_max'):
        min_rev = icp_criteria.get('revenue_min')
        max_rev = icp_criteria.get('revenue_max')
        if min_rev and max_rev:
            query['estimated_annual_revenue'] = f"{min_rev}-{max_rev}"
        elif min_rev:
            query['estimated_annual_revenue'] = f"{min_rev}+"
    
    # Always request verified contacts only
    query['only_verified_contacts'] = True
    
    return {
        'apollo_query': query,
        'estimated_complexity': len(query),
        'query_summary': f"Searching for {len(icp_criteria.get('job_titles', []))} job titles in {len(icp_criteria.get('industries', []))} industries with verified contacts",
        'endpoint': '/mixed_people/search'
    }

# Apollo Discovery Agent
class ApolloDiscoveryAgent:
    def __init__(self, llm):
        self.agent = Agent(
            role="Apollo Lead Discovery Specialist",
            goal="Use Apollo API tools to discover real leads matching ICP criteria and return structured JSON results",
            backstory="""You are a lead discovery specialist who uses Apollo API tools to find real prospects. 
            You MUST use the provided tools to make actual API calls and return real data. Never generate 
            fake data, code, or hallucinated results. Always use apollo_people_search tool after building 
            the query to get actual lead data from Apollo's database.""",
            tools=[apollo_people_search, apollo_organization_search, build_apollo_search_query],
            llm=llm,
            verbose=True,
            allow_delegation=False,
            max_execution_time=300
        )
    
    def _build_apollo_query(self, icp_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Build Apollo API search query from ICP criteria - direct function call"""
        query = {}
        
        # Person-level filters
        if icp_criteria.get('job_titles'):
            query['person_titles'] = icp_criteria['job_titles']
        
        if icp_criteria.get('seniority_levels'):
            # Map to Apollo seniority values
            seniority_mapping = {
                'C-Level': 'cxo',
                'VP': 'vp', 
                'Director': 'director',
                'Manager': 'manager',
                'Senior': 'senior',
                'Entry Level': 'entry'
            }
            apollo_seniorities = []
            for level in icp_criteria['seniority_levels']:
                mapped = seniority_mapping.get(level, level.lower())
                apollo_seniorities.append(mapped)
            if apollo_seniorities:
                query['person_seniorities'] = apollo_seniorities
        
        if icp_criteria.get('locations'):
            query['person_locations'] = icp_criteria['locations']
        
        if icp_criteria.get('departments'):
            # Map to Apollo department values
            dept_mapping = {
                'Marketing': 'marketing',
                'Sales': 'sales', 
                'Engineering': 'engineering',
                'Product': 'product',
                'Finance': 'finance',
                'Operations': 'operations',
                'HR': 'human_resources',
                'IT': 'information_technology'
            }
            apollo_departments = []
            for dept in icp_criteria['departments']:
                mapped = dept_mapping.get(dept, dept.lower().replace(' ', '_'))
                apollo_departments.append(mapped)
            if apollo_departments:
                query['departments'] = apollo_departments
        
        # Company-level filters using organization keyword tags
        if icp_criteria.get('industries'):
            industry_keywords = []
            for industry in icp_criteria['industries']:
                if industry.lower() == 'financial services':
                    industry_keywords.extend(['financial services', 'banking', 'investment', 'insurance'])
                elif industry.lower() == 'technology':
                    industry_keywords.extend(['technology', 'software', 'SaaS'])
                elif industry.lower() == 'healthcare':
                    industry_keywords.extend(['healthcare', 'medical'])
                elif industry.lower() == 'manufacturing':
                    industry_keywords.extend(['manufacturing', 'industrial'])
                else:
                    industry_keywords.append(industry)
            
            if industry_keywords:
                query['q_organization_keyword_tags'] = industry_keywords
        
        if icp_criteria.get('company_sizes'):
            # Map company size ranges to Apollo employee count format (comma-separated ranges)
            size_mapping = {
                '1-10': '1,10',
                '11-50': '11,50', 
                '51-200': '51,200',
                '201-500': '201,500',
                '501-1000': '501,1000',
                '1001-5000': '1001,5000',
                '5000+': '5001,50000'
            }
            apollo_sizes = []
            for size in icp_criteria['company_sizes']:
                if size in size_mapping:
                    apollo_sizes.append(size_mapping[size])
            if apollo_sizes:
                query['organization_num_employees_ranges'] = apollo_sizes
        
        if icp_criteria.get('locations'):
            query['organization_locations'] = icp_criteria['locations']
        
        if icp_criteria.get('technologies'):
            query['organization_technologies'] = icp_criteria['technologies']
        
        if icp_criteria.get('funding_stages'):
            # Map funding stages to Apollo funding rounds
            funding_mapping = {
                'Pre-Seed': 'pre_seed',
                'Seed': 'seed',
                'Series A': 'series_a',
                'Series B': 'series_b', 
                'Series C': 'series_c',
                'Series D+': 'series_d_and_beyond',
                'IPO': 'ipo',
                'Private Equity': 'private_equity'
            }
            apollo_funding = []
            for stage in icp_criteria['funding_stages']:
                mapped = funding_mapping.get(stage, stage.lower().replace(' ', '_'))
                apollo_funding.append(mapped)
            if apollo_funding:
                query['last_funding_round'] = apollo_funding
        
        if icp_criteria.get('keywords'):
            query['q_organization_domains'] = ' '.join(icp_criteria['keywords'])
        
        # Add employee count range if specified
        if icp_criteria.get('employee_count_min') or icp_criteria.get('employee_count_max'):
            min_emp = icp_criteria.get('employee_count_min', 1)
            max_emp = icp_criteria.get('employee_count_max', '')
            if max_emp:
                query['organization_num_employees_ranges'] = [f"{min_emp}-{max_emp}"]
            else:
                query['organization_num_employees_ranges'] = [f"{min_emp}+"]
        
        # Add revenue range if specified
        if icp_criteria.get('revenue_min') or icp_criteria.get('revenue_max'):
            min_rev = icp_criteria.get('revenue_min')
            max_rev = icp_criteria.get('revenue_max')
            if min_rev and max_rev:
                query['estimated_annual_revenue'] = f"{min_rev}-{max_rev}"
            elif min_rev:
                query['estimated_annual_revenue'] = f"{min_rev}+"
        
        # Always request verified contacts only
        query['only_verified_contacts'] = True
        
        return query
    
    def _build_organization_query(self, icp_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Build Apollo organization search query from ICP criteria"""
        query = {}
        
        # Industry filtering using keyword tags
        if icp_criteria.get('industries'):
            industry_keywords = []
            for industry in icp_criteria['industries']:
                if industry.lower() == 'financial services':
                    industry_keywords.extend(['financial services', 'banking', 'investment', 'insurance'])
                elif industry.lower() == 'technology':
                    industry_keywords.extend(['technology', 'software', 'SaaS'])
                elif industry.lower() == 'healthcare':
                    industry_keywords.extend(['healthcare', 'medical'])
                elif industry.lower() == 'manufacturing':
                    industry_keywords.extend(['manufacturing', 'industrial'])
                else:
                    industry_keywords.append(industry)
            
            if industry_keywords:
                query['q_organization_keyword_tags'] = industry_keywords
        
        # Company size filtering
        if icp_criteria.get('company_sizes'):
            size_mapping = {
                '1-10': '1,10',
                '11-50': '11,50', 
                '51-200': '51,200',
                '201-500': '201,500',
                '501-1000': '501,1000',
                '1001-5000': '1001,5000',
                '5000+': '5001,50000'
            }
            apollo_sizes = []
            for size in icp_criteria['company_sizes']:
                if size in size_mapping:
                    apollo_sizes.append(size_mapping[size])
            if apollo_sizes:
                query['organization_num_employees_ranges'] = apollo_sizes
        
        # Location filtering
        if icp_criteria.get('locations'):
            query['organization_locations'] = icp_criteria['locations']
        
        # Revenue filtering
        if icp_criteria.get('revenue_min') or icp_criteria.get('revenue_max'):
            if icp_criteria.get('revenue_min'):
                query['revenue_range[min]'] = icp_criteria['revenue_min']
            if icp_criteria.get('revenue_max'):
                query['revenue_range[max]'] = icp_criteria['revenue_max']
        
        return query
    
    def _build_people_query(self, icp_criteria: Dict[str, Any], organization_ids: list) -> Dict[str, Any]:
        """Build Apollo people search query from ICP criteria and organization IDs"""
        query = {}
        
        # Person-level filters
        if icp_criteria.get('job_titles'):
            query['person_titles'] = icp_criteria['job_titles']
        
        if icp_criteria.get('seniority_levels'):
            seniority_mapping = {
                'C-Level': 'c_suite',
                'VP': 'vp', 
                'Director': 'director',
                'Manager': 'manager',
                'Senior': 'senior',
                'Entry Level': 'entry'
            }
            apollo_seniorities = []
            for level in icp_criteria['seniority_levels']:
                mapped = seniority_mapping.get(level, level.lower())
                apollo_seniorities.append(mapped)
            if apollo_seniorities:
                query['person_seniorities'] = apollo_seniorities
        
        # Target specific organizations
        if organization_ids:
            query['organization_ids'] = organization_ids
        
        # Always request verified contacts only
        query['only_verified_contacts'] = True
        
        return query
    
    def _apollo_organization_search(self, search_params: Dict[str, Any], page: int = 1, per_page: int = 25) -> Dict[str, Any]:
        """Execute Apollo organization search - direct function call"""
        import requests
        import os
        
        # Get Apollo API key from environment
        APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')
        if not APOLLO_API_KEY:
            return {
                "error": "Apollo API key not found. Please set APOLLO_API_KEY environment variable.", 
                "success": False
            }
        
        url = "https://api.apollo.io/v1/organizations/search"
        headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
        
        try:
            payload = {
                "api_key": APOLLO_API_KEY,
                "page": page,
                "per_page": min(per_page, 100),
                **search_params
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            organizations = data.get('organizations', [])
            pagination = data.get('pagination', {})
            
            return {
                "success": True,
                "organizations": organizations,
                "pagination": pagination,
                "total_results": pagination.get('total_entries', 0)
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "error": f"Apollo organization search failed: {str(e)}",
                "success": False
            }
    
    def _apollo_people_search(self, search_params: Dict[str, Any], page: int = 1, per_page: int = 25) -> Dict[str, Any]:
        """Execute Apollo people search - direct function call"""
        import requests
        import os
        
        # Get Apollo API key from environment
        APOLLO_API_KEY = os.getenv('APOLLO_API_KEY')
        if not APOLLO_API_KEY:
            return {
                "error": "Apollo API key not found. Please set APOLLO_API_KEY environment variable.", 
                "success": False
            }
        
        url = "https://api.apollo.io/v1/mixed_people/search"
        headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
        
        try:
            payload = {
                "api_key": APOLLO_API_KEY,
                "page": page,
                "per_page": min(per_page, 100),
                **search_params
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            people = data.get('people', [])
            pagination = data.get('pagination', {})
            
            # Format leads for consistent output
            formatted_leads = []
            for person in people:
                lead_data = {
                    'apollo_id': person.get('id'),
                    'first_name': person.get('first_name', ''),
                    'last_name': person.get('last_name', ''),
                    'email': person.get('email'),
                    'title': person.get('title', ''),
                    'linkedin_url': person.get('linkedin_url'),
                    'phone': person.get('phone'),
                    'company': person.get('organization', {}).get('name', '') if person.get('organization') else '',
                    'company_domain': person.get('organization', {}).get('website_url', '') if person.get('organization') else '',
                    'company_industry': person.get('organization', {}).get('industry', '') if person.get('organization') else '',
                    'company_size': person.get('organization', {}).get('estimated_num_employees', '') if person.get('organization') else '',
                    'location': person.get('city', ''),
                    'country': person.get('country', ''),
                    'seniority': person.get('seniority', ''),
                    'departments': person.get('departments', []),
                    'apollo_data': person
                }
                formatted_leads.append(lead_data)
            
            return {
                'success': True,
                'total_results': pagination.get('total_entries', 0),
                'current_page': pagination.get('page', 1),
                'total_pages': pagination.get('total_pages', 1),
                'per_page': pagination.get('per_page', per_page),
                'leads': formatted_leads,
                'pagination': pagination
            }
            
        except requests.RequestException as e:
            error_msg = f"Apollo API request failed: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg += f" - {error_data.get('message', 'Unknown error')}"
                except:
                    error_msg += f" - Status: {e.response.status_code}"
            
            return {"error": error_msg, "success": False}
        
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}", "success": False}
    
    def discover_leads(self, icp_criteria: Dict[str, Any], max_results: int = 100) -> Dict[str, Any]:
        """
        Discover leads based on ICP criteria using Apollo API.
        Direct execution bypassing CrewAI agent to avoid hallucination issues.
        
        Args:
            icp_criteria: ICP profile criteria
            max_results: Maximum number of leads to discover
        
        Returns:
            Discovery results with leads and metadata
        """
        try:
            print(f"Building Apollo query from ICP criteria: {icp_criteria}")
            
            # Stage 1: Find organizations matching industry/company criteria
            org_query = self._build_organization_query(icp_criteria)
            print(f"Apollo organization query: {org_query}")
            
            org_result = self._apollo_organization_search(org_query, page=1, per_page=50)
            print(f"Apollo organization search result: {org_result}")
            
            if not org_result.get('success', False):
                return {
                    'success': False,
                    'error': f"Organization search failed: {org_result.get('error', 'Unknown error')}",
                    'total_discovered': 0,
                    'leads': [],
                    'query_used': {'org_query': org_query}
                }
            
            organizations = org_result.get('organizations', [])
            if not organizations:
                return {
                    'success': True,
                    'total_discovered': 0,
                    'leads': [],
                    'query_used': {'org_query': org_query},
                    'search_summary': 'No organizations found matching criteria',
                    'organizations_found': 0
                }
            
            # Extract organization IDs for people search
            org_ids = [org.get('id') for org in organizations if org.get('id')]
            print(f"Found {len(organizations)} organizations, {len(org_ids)} with IDs")
            
            # Stage 2: Find people at those organizations
            people_query = self._build_people_query(icp_criteria, org_ids)
            print(f"Apollo people query: {people_query}")
            
            people_result = self._apollo_people_search(people_query, page=1, per_page=min(max_results, 100))
            print(f"Apollo people search result: {people_result}")
            
            if not people_result.get('success', False):
                return {
                    'success': False,
                    'error': f"People search failed: {people_result.get('error', 'Unknown error')}",
                    'total_discovered': 0,
                    'leads': [],
                    'query_used': {'org_query': org_query, 'people_query': people_query}
                }
            
            leads = people_result.get('leads', [])
            
            return {
                'success': True,
                'total_discovered': len(leads),
                'leads': leads,
                'query_used': {'org_query': org_query, 'people_query': people_query},
                'search_summary': f"Found {len(leads)} people at {len(organizations)} organizations",
                'organizations_found': len(organizations),
                'pages_searched': 1
            }
            
        except Exception as e:
            print(f"Error in Apollo discovery: {str(e)}")
            return {
                'success': False,
                'error': f"Apollo discovery failed: {str(e)}",
                'total_discovered': 0,
                'leads': [],
                'query_used': {}
            }

def create_apollo_discovery_agent(llm):
    """Create and return an Apollo Discovery Agent instance."""
    return ApolloDiscoveryAgent(llm)
