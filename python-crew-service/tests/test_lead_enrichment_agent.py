import pytest
import json
import sys
import os

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.lead_enrichment_agent import enrich_lead

# --- Mock Data ---

APOLLO_SUCCESS_MOCK = {
    "person": {
        "name": "Mock Apollo Name",
        "title": "Chief Mock Officer",
        "linkedin_url": "https://linkedin.com/in/mockapollo",
        "organization": {
            "name": "Apollo Mock Inc.",
            "industry": "Mocking",
            "estimated_num_employees": 100
        },
        "city": "Mockville",
        "state": "CA",
        "country": "USA"
    }
}

PDL_SUCCESS_MOCK = {
    "status": 200,
    "data": {
        "full_name": "Mock PDL Name",
        "job_title": "Principal Data Mock",
        "job_company_name": "PDL Mocks Ltd.",
        "job_company_industry": "Advanced Mocking",
        "job_company_size": "201-500",
        "location_name": "Mock City, United States"
    }
}

# --- Tests ---

def test_enrich_lead_apollo_success(requests_mock):
    """Test successful enrichment from Apollo as the first source."""
    # Mock the Apollo API to return a successful response
    requests_mock.get(
        "https://api.apollo.io/v1/person/enrich",
        json=APOLLO_SUCCESS_MOCK, 
        status_code=200
    )
    
    # Run the enrichment function
    result = enrich_lead(email="test@apollo.com")
    
    # Assertions
    assert result is not None
    assert result["name"] == "Mock Apollo Name"
    assert result["company"] == "Apollo Mock Inc."
    assert result["source"] == "apollo"


def test_enrich_lead_apollo_fail_pdl_success(requests_mock):
    """Test fallback to PDL when Apollo fails (returns 404)."""
    # Mock Apollo to fail
    requests_mock.get(
        "https://api.apollo.io/v1/person/enrich",
        status_code=404
    )
    # Mock PDL to succeed
    requests_mock.get(
        "https://api.peopledatalabs.com/v5/person/enrich",
        json=PDL_SUCCESS_MOCK,
        status_code=200
    )
    
    # Run the enrichment function
    result = enrich_lead(email="test@pdl.com")
    
    # Assertions
    assert result is not None
    assert result["name"] == "Mock PDL Name"
    assert result["company"] == "PDL Mocks Ltd."
    assert result["source"] == "pdl"

def test_enrich_lead_apollo_no_name_pdl_success(requests_mock):
    """Test fallback to PDL when Apollo response is missing 'name'."""
    # Mock Apollo to return success but without a name
    apollo_no_name_mock = {"person": {"title": "CEO"}} # No name key
    requests_mock.get(
        "https://api.apollo.io/v1/person/enrich",
        json=apollo_no_name_mock,
        status_code=200
    )
    # Mock PDL to succeed
    requests_mock.get(
        "https://api.peopledatalabs.com/v5/person/enrich",
        json=PDL_SUCCESS_MOCK,
        status_code=200
    )
    
    # Run the enrichment function
    result = enrich_lead(email="test@pdl.com")
    
    # Assertions
    assert result is not None
    assert result["name"] == "Mock PDL Name"
    assert result["source"] == "pdl"

def test_enrich_lead_both_fail(requests_mock):
    """Test the case where both Apollo and PDL APIs fail."""
    # Mock both APIs to return a 404 error
    requests_mock.get("https://api.apollo.io/v1/person/enrich", status_code=404)
    requests_mock.get("https://api.peopledatalabs.com/v5/person/enrich", status_code=404)
    
    result = enrich_lead(email="nonexistent@email.com")
    
    # Assert that the result indicates failure
    assert result["source"] == "none"
    assert result["name"] is None
