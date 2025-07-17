import pytest
from agents import buyer_intent_agent

# --- Mock Data ---
MOCK_CRUNCHBASE = {
    "properties": {
        "last_funding_type": "Series B",
        "last_funding_total": {"value_usd": 20000000}
    }
}
MOCK_BOMBORA = {"score": 78, "topics": ["Cloud Computing", "Data Storage"]}
MOCK_G2 = {"visitor_count": 12, "job_postings": 0}

# --- Test Cases ---

@pytest.fixture
def mock_apis(monkeypatch):
    """Fixture to mock all external API calls."""
    monkeypatch.setattr(buyer_intent_agent, "crunchbase_lookup", lambda company_name: MOCK_CRUNCHBASE)
    monkeypatch.setattr(buyer_intent_agent, "bombora_intent", lambda domain: MOCK_BOMBORA)
    monkeypatch.setattr(buyer_intent_agent, "g2_visitor_signals", lambda domain: MOCK_G2)

def test_run_buyer_intent_with_mocks(mock_apis):
    """Tests the main buyer intent function with mocked data."""
    # Run the function with test data
    result = buyer_intent_agent.run_buyer_intent(company_name="Acme", domain="acme.com")

    # Assert intent score calculation
    # Expected: 40 (funding) + min(30, 78/10=7) + min(30, 12*2=24) = 40 + 7 + 24 = 71
    assert result["intent_score"] > 70
    assert result["intent_score"] == 71

    # Assert recent events formatting
    assert len(result["recent_events"]) == 3
    assert "Series B" in result["recent_events"][0]
    assert "$20M" in result["recent_events"][0]
    assert "Bombora intent score: 78" in result["recent_events"][1]
    assert "G2 visitors: 12" in result["recent_events"][2]

    # Assert hiring flag logic
    assert result["hiring_flag"] is False

    # Assert source breakdown
    assert result["source_breakdown"]["funding"] is True
    assert result["source_breakdown"]["bombora"] is True
    assert result["source_breakdown"]["g2"] is True

def test_hiring_flag_from_bombora(monkeypatch):
    """Tests that the hiring flag is correctly set from Bombora topics."""
    bombora_hiring_mock = {"score": 60, "topics": ["Recruitment Software", "Hiring Trends"]}
    monkeypatch.setattr(buyer_intent_agent, "crunchbase_lookup", lambda company_name: {})
    monkeypatch.setattr(buyer_intent_agent, "bombora_intent", lambda domain: bombora_hiring_mock)
    monkeypatch.setattr(buyer_intent_agent, "g2_visitor_signals", lambda domain: {})

    result = buyer_intent_agent.run_buyer_intent(company_name="HiringCorp", domain="hiringcorp.com")
    assert result["hiring_flag"] is True

def test_hiring_flag_from_g2(monkeypatch):
    """Tests that the hiring flag is correctly set from G2 job postings."""
    g2_hiring_mock = {"visitor_count": 5, "job_postings": 3}
    monkeypatch.setattr(buyer_intent_agent, "crunchbase_lookup", lambda company_name: {})
    monkeypatch.setattr(buyer_intent_agent, "bombora_intent", lambda domain: {})
    monkeypatch.setattr(buyer_intent_agent, "g2_visitor_signals", lambda domain: g2_hiring_mock)

    result = buyer_intent_agent.run_buyer_intent(company_name="JobCorp", domain="jobcorp.com")
    assert result["hiring_flag"] is True

def test_all_apis_fail(monkeypatch):
    """Tests the scenario where all external data sources fail."""
    monkeypatch.setattr(buyer_intent_agent, "crunchbase_lookup", lambda company_name: {})
    monkeypatch.setattr(buyer_intent_agent, "bombora_intent", lambda domain: {})
    monkeypatch.setattr(buyer_intent_agent, "g2_visitor_signals", lambda domain: {})

    result = buyer_intent_agent.run_buyer_intent(company_name="FailCorp", domain="failcorp.com")
    assert result["intent_score"] == 0
    assert result["recent_events"] == []
    assert result["hiring_flag"] is False
    assert result["source_breakdown"]["funding"] is False
