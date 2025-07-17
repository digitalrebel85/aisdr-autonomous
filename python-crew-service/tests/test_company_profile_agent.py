import pytest
import sys
import os

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents import company_profile_agent

# --- Mock Data ---
MOCK_VALUESERP = {"snippet": "Tesla is an American electric vehicle (EV) and clean energy company."}
MOCK_BUILTWITH = {"tech": ["React", "AWS", "Stripe", "Google Analytics"]}

# --- Test Cases ---

@pytest.fixture
def mock_apis(monkeypatch):
    """Fixture to mock all external API calls for the company profile agent."""
    monkeypatch.setattr(
        company_profile_agent, "valueserp_company_snippet", lambda name: MOCK_VALUESERP
    )
    monkeypatch.setattr(
        company_profile_agent, "builtwith_tech_stack", lambda domain: MOCK_BUILTWITH
    )

def test_run_company_profile_with_mocks(mock_apis):
    """Tests the main company profile function with mocked data."""
    result = company_profile_agent.run_company_profile(
        company_name="Tesla", domain="tesla.com"
    )

    # Assert snippet is correctly retrieved
    assert result["snippet"] is not None
    assert "EV" in result["snippet"]

    # Assert tech stack is correctly retrieved
    assert "AWS" in result["techStack"]
    assert "React" in result["techStack"]
    assert len(result["techStack"]) == 4

    # Assert source breakdown
    assert result["source_breakdown"]["valueserp"] is True
    assert result["source_breakdown"]["builtwith"] is True

def test_all_sources_fail(monkeypatch):
    """Tests the scenario where all data sources return empty."""
    monkeypatch.setattr(company_profile_agent, "valueserp_company_snippet", lambda name: {})
    monkeypatch.setattr(company_profile_agent, "builtwith_tech_stack", lambda domain: {})

    result = company_profile_agent.run_company_profile(company_name="x", domain="x")

    assert result["snippet"] is None
    assert result["techStack"] == []
    assert result["source_breakdown"]["valueserp"] is False
    assert result["source_breakdown"]["builtwith"] is False
