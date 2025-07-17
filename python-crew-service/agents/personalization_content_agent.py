import os
import json
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from crewai_tools import tool

# --- Environment Setup ---
load_dotenv()
APIFY_TOKEN = os.getenv("APIFY_TOKEN")
VALUESERP_KEY = os.getenv("VALUESERP_KEY")
MOCK_MODE = os.getenv("MOCK") == "true"

# --- API Tools ---

@tool("LinkedIn Profile Scraper")
def linkedin_get_about(profile_url: str) -> Dict[str, Any]:
    """Fetches a person's 'About' section and recent posts from a LinkedIn profile."""
    if not APIFY_TOKEN:
        return {}
    url = f"https://api.apify.com/v2/acts/curious_coder~linkedin-profile-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    payload = {"profile_urls": [profile_url], "contentType": "json"}
    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        if not data:
            return {}
        profile = data[0]
        return {
            "about": profile.get("about", ""),
            "recentPosts": [post.get("text", "") for post in profile.get("recent_posts", [])],
        }
    except requests.RequestException:
        return {}

@tool("Twitter Profile Scraper")
def twitter_bio(handle: str) -> Dict[str, Any]:
    """Fetches a user's bio and recent tweets from a Twitter handle."""
    if not APIFY_TOKEN:
        return {}
    url = f"https://api.apify.com/v2/acts/datasquirel~twitter-profile-scraper/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    payload = {"handles": [handle]}
    try:
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        if not data:
            return {}
        profile = data[0]
        return {
            "bio": profile.get("description", ""),
            "tweets": [tweet.get("text", "") for tweet in profile.get("tweets", [])],
        }
    except requests.RequestException:
        return {}

@tool("ValueSERP Blog Search")
def valueserp_latest_blog(company: str) -> Dict[str, Any]:
    """Finds the latest blog post for a company using ValueSERP."""
    if not VALUESERP_KEY:
        return {}
    params = {"api_key": VALUESERP_KEY, "q": f"{company} blog", "num": "10"}
    try:
        response = requests.get("https://api.valueserp.com/search", params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        if data.get("organic_results"):
            first_result = data["organic_results"][0]
            return {"title": first_result.get("title"), "snippet": first_result.get("snippet")}
        return {}
    except requests.RequestException:
        return {}

# --- Helper Functions ---

def extract_best_quote(posts: List[str]) -> str:
    """Chooses the shortest line under 120 chars with an exclamation or question mark, else the first line."""
    if not posts:
        return ""
    
    candidates = [p for p in posts if ("!" in p or "?" in p) and len(p) < 120]
    if candidates:
        return min(candidates, key=len)
    
    return posts[0] if posts else ""

def run_personalization_content(
    profile_url: str, twitter_handle: str, company: str
) -> Dict[str, Any]:
    """Runs the full content personalization process."""
    if MOCK_MODE:
        return {
            "bio": "Mock bio from test data.",
            "last_posts": ["This is a mock post!", "Another great mock tweet?", "Third mock entry."],
            "best_quote": "This is a mock post!",
        }

    bio: Optional[str] = None
    posts: List[str] = []

    linkedin_data = linkedin_get_about(profile_url)
    if linkedin_data:
        bio = linkedin_data.get("about")
        posts.extend(linkedin_data.get("recentPosts", []))

    twitter_data = twitter_bio(twitter_handle)
    if twitter_data:
        if not bio and twitter_data.get("bio"):
            bio = twitter_data["bio"]
        posts.extend(twitter_data.get("tweets", []))

    blog_data = valueserp_latest_blog(company)
    if blog_data:
        if blog_data.get("title"): posts.append(blog_data["title"])
        if blog_data.get("snippet"): posts.append(blog_data["snippet"])

    if not bio and not posts:
        return {"bio": None, "last_posts": [], "best_quote": ""}

    return {
        "bio": bio,
        "last_posts": posts[:3],
        "best_quote": extract_best_quote(posts) or bio or "",
    }

# --- CrewAI Agent & Task ---

personalization_content_agent = Agent(
    role="Content Personalization Specialist",
    goal="Find highly relevant, personalized content snippets for outreach.",
    backstory="You are an expert at scouring the web for personal details, recent posts, and company news to craft the perfect personalized message.",
    tools=[linkedin_get_about, twitter_bio, valueserp_latest_blog],
    allow_delegation=False,
    verbose=False,
)

personalization_task = Task(
    description="""
    Gather personalization content for a lead.
    - LinkedIn Profile: {profile_url}
    - Twitter Handle: {twitter_handle}
    - Company: {company}
    
    Use the available tools to find their bio, recent posts, and company blog articles.
    Synthesize the findings into the required JSON format.
    Return ONLY the final JSON object.
    """,
    agent=personalization_content_agent,
    expected_output="A JSON object with bio, last_posts, and best_quote.",
)

# --- Main execution block ---
if __name__ == "__main__":
    print("--- Running Personalization Content Agent ---")
    if MOCK_MODE:
        print("INFO: Running in MOCK mode.")

    result = run_personalization_content(
        profile_url="https://www.linkedin.com/in/jeffweiner08",
        twitter_handle="jeffweiner",
        company="LinkedIn",
    )
    print(json.dumps(result, indent=2))
