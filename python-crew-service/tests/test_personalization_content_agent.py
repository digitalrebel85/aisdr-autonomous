import pytest
import sys
import os

# Add project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents import personalization_content_agent

# --- Mock Data ---
MOCK_LINKEDIN = {
    "about": "Executive Chairman at LinkedIn. I love inspiring quotes.",
    "recentPosts": ["What an amazing journey it has been!", "Just posted a new article on leadership."],
}
MOCK_TWITTER = {
    "bio": "",  # Empty to test fallback
    "tweets": ["Is Web3 the future? Let's discuss."],
}
MOCK_BLOG = {"title": "Our Newest Feature is Here", "snippet": "We are excited to announce..."}


# --- Test Cases ---
@pytest.fixture
def mock_apis(monkeypatch):
    """Fixture to mock all external API calls for the personalization agent."""
    monkeypatch.setattr(
        personalization_content_agent, "linkedin_get_about", lambda url: MOCK_LINKEDIN
    )
    monkeypatch.setattr(
        personalization_content_agent, "twitter_bio", lambda handle: MOCK_TWITTER
    )
    monkeypatch.setattr(
        personalization_content_agent, "valueserp_latest_blog", lambda company: MOCK_BLOG
    )

def test_run_personalization_with_mocks(mock_apis):
    """Tests the main personalization content function with mocked data."""
    result = personalization_content_agent.run_personalization_content(
        profile_url="https://linkedin.com/in/test",
        twitter_handle="testuser",
        company="TestCorp",
    )

    # Assert bio is correctly sourced from LinkedIn
    assert result["bio"] is not None
    assert result["bio"] == MOCK_LINKEDIN["about"]

    # Assert posts are aggregated and truncated correctly
    assert len(result["last_posts"]) == 3
    assert result["last_posts"][0] == MOCK_LINKEDIN["recentPosts"][0]
    assert result["last_posts"][2] == MOCK_TWITTER["tweets"][0]

    # Assert best_quote logic selects the shortest post with '?' or '!'
    assert result["best_quote"] == "Is Web3 the future? Let's discuss."

def test_extract_best_quote():
    """Tests the quote extraction logic in isolation."""
    posts = [
        "This is a very long post that should not be selected because of its length, even though it has a question mark? Over 120 chars for sure.",
        "A short, punchy question?",
        "An even shorter exclamation!",
        "A statement with no punctuation.",
    ]
    assert personalization_content_agent.extract_best_quote(posts) == "An even shorter exclamation!"

def test_all_sources_fail(monkeypatch):
    """Tests the scenario where all data sources return empty."""
    monkeypatch.setattr(personalization_content_agent, "linkedin_get_about", lambda url: {})
    monkeypatch.setattr(personalization_content_agent, "twitter_bio", lambda handle: {})
    monkeypatch.setattr(personalization_content_agent, "valueserp_latest_blog", lambda company: {})

    result = personalization_content_agent.run_personalization_content(
        profile_url="x", twitter_handle="x", company="x"
    )

    assert result["bio"] is None
    assert result["last_posts"] == []
    assert result["best_quote"] == ""
