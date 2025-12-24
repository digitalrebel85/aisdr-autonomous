"""
Website Scraper & Analyzer Agent
Scrapes company websites and uses AI to extract business intelligence
"""

import os
import json
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
import re

# Try to import OpenAI for analysis
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Global settings
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REQUEST_TIMEOUT = 10
MAX_CONTENT_LENGTH = 50000  # Max characters to send to AI


def scrape_page(url: str) -> Dict[str, Any]:
    """Scrape a single page and extract text content."""
    try:
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, nav, footer elements
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript']):
            element.decompose()
        
        # Extract title
        title = soup.title.string if soup.title else ""
        
        # Extract meta description
        meta_desc = ""
        meta_tag = soup.find('meta', attrs={'name': 'description'})
        if meta_tag:
            meta_desc = meta_tag.get('content', '')
        
        # Extract main content
        # Try to find main content areas
        main_content = ""
        
        # Look for common content containers
        content_selectors = [
            soup.find('main'),
            soup.find('article'),
            soup.find(id='content'),
            soup.find(id='main'),
            soup.find(class_='content'),
            soup.find(class_='main-content'),
        ]
        
        for container in content_selectors:
            if container:
                main_content = container.get_text(separator=' ', strip=True)
                break
        
        # Fallback to body
        if not main_content:
            body = soup.find('body')
            if body:
                main_content = body.get_text(separator=' ', strip=True)
        
        # Clean up whitespace
        main_content = re.sub(r'\s+', ' ', main_content).strip()
        
        # Extract headings for structure
        headings = []
        for h in soup.find_all(['h1', 'h2', 'h3']):
            text = h.get_text(strip=True)
            if text and len(text) < 200:
                headings.append(text)
        
        return {
            "success": True,
            "url": url,
            "title": title,
            "meta_description": meta_desc,
            "headings": headings[:20],  # Limit headings
            "content": main_content[:MAX_CONTENT_LENGTH],
            "content_length": len(main_content)
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "url": url,
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "url": url,
            "error": f"Parsing error: {str(e)}"
        }


def find_key_pages(domain: str) -> List[str]:
    """Find key pages to scrape on a domain."""
    base_url = f"https://{domain}" if not domain.startswith('http') else domain
    
    # Common important pages - prioritized order
    key_paths = [
        "",  # Homepage
        "/about",
        "/about-us",
        "/company",
        # News and blog pages for recent updates
        "/blog",
        "/news",
        "/newsroom",
        "/press",
        "/press-releases",
        "/announcements",
        "/updates",
        # Product/service pages
        "/services",
        "/products",
        "/solutions",
        "/what-we-do",
        "/our-story",
        "/customers",
        "/case-studies",
    ]
    
    urls = []
    for path in key_paths:
        urls.append(urljoin(base_url, path))
    
    return urls


def scrape_website(domain: str) -> Dict[str, Any]:
    """Scrape multiple pages from a website."""
    print(f"Starting website scrape for: {domain}")
    
    urls_to_try = find_key_pages(domain)
    scraped_pages = []
    successful_pages = 0
    has_news_or_blog = False
    
    # News/blog paths to look for
    news_paths = ['/blog', '/news', '/newsroom', '/press', '/press-releases', '/announcements', '/updates']
    
    for url in urls_to_try:
        print(f"  Scraping: {url}")
        result = scrape_page(url)
        
        if result["success"] and result.get("content"):
            scraped_pages.append(result)
            successful_pages += 1
            print(f"    ✓ Success - {len(result['content'])} chars")
            
            # Check if this is a news/blog page
            parsed_url = urlparse(url)
            if any(news_path in parsed_url.path.lower() for news_path in news_paths):
                has_news_or_blog = True
                print(f"    📰 Found news/blog page!")
        else:
            print(f"    ✗ Failed - {result.get('error', 'No content')}")
        
        # Stop after 4 successful pages, or 3 if we already have news/blog
        # This ensures we try to get news content for personalization
        if successful_pages >= 4 or (successful_pages >= 3 and has_news_or_blog):
            break
    
    return {
        "domain": domain,
        "pages_scraped": successful_pages,
        "has_news_or_blog": has_news_or_blog,
        "pages": scraped_pages
    }


def analyze_website_content(scraped_data: Dict[str, Any], company_name: str = None) -> Dict[str, Any]:
    """Use AI to analyze scraped website content."""
    
    if not scraped_data.get("pages"):
        return {
            "success": False,
            "error": "No pages were successfully scraped"
        }
    
    # Combine content from all pages
    combined_content = ""
    for page in scraped_data["pages"]:
        combined_content += f"\n\n--- PAGE: {page['url']} ---\n"
        combined_content += f"Title: {page.get('title', 'N/A')}\n"
        combined_content += f"Meta: {page.get('meta_description', 'N/A')}\n"
        if page.get('headings'):
            combined_content += f"Headings: {', '.join(page['headings'][:10])}\n"
        combined_content += f"Content: {page.get('content', '')[:10000]}\n"
    
    # Truncate if too long
    combined_content = combined_content[:MAX_CONTENT_LENGTH]
    
    # Get OpenAI API key
    openai_key = os.getenv('OPENAI_API_KEY')
    if not openai_key:
        return {
            "success": False,
            "error": "OpenAI API key not configured"
        }
    
    if not OPENAI_AVAILABLE:
        return {
            "success": False,
            "error": "OpenAI library not installed"
        }
    
    try:
        client = OpenAI(api_key=openai_key)
        
        prompt = f"""Analyze this company website content and extract key business intelligence.

Company Name: {company_name or 'Unknown'}
Website Content:
{combined_content}

Extract and return a JSON object with:
{{
    "company_description": "A 2-3 sentence description of what the company does",
    "value_proposition": "Their main value proposition or unique selling point",
    "target_customers": "Who their ideal customers are (industries, company sizes, roles)",
    "products_services": ["List of main products or services they offer"],
    "pain_points_solved": ["List of problems/pain points they help solve"],
    "key_differentiators": ["What makes them different from competitors"],
    "industry": "Primary industry they operate in",
    "company_size_indicators": "Any indicators of company size (team size, customers, etc.)",
    "recent_news_or_updates": ["List of recent announcements, news, blog posts, awards, partnerships, product launches, funding rounds, or company updates - PRIORITIZE THESE for email personalization hooks"],
    "blog_topics": ["Key topics or themes from their blog/news section if available"],
    "tone_and_style": "The tone of their messaging (professional, casual, technical, etc.)"
}}

IMPORTANT: Pay special attention to /blog, /news, /press pages for recent updates. These are GOLD for email personalization - things like:
- New product launches or features
- Awards or recognition received
- Partnerships or integrations announced
- Funding rounds or company milestones
- Recent blog posts showing their current focus areas

Return ONLY valid JSON, no other text."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cost-effective model
            messages=[
                {"role": "system", "content": "You are a business analyst expert at extracting company intelligence from website content. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = re.sub(r'^```json?\n?', '', result_text)
            result_text = re.sub(r'\n?```$', '', result_text)
        
        analysis = json.loads(result_text)
        analysis["success"] = True
        analysis["source"] = "website_scraper"
        analysis["pages_analyzed"] = len(scraped_data["pages"])
        analysis["domain"] = scraped_data["domain"]
        
        return analysis
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Failed to parse AI response as JSON: {str(e)}",
            "raw_response": result_text if 'result_text' in locals() else None
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"AI analysis failed: {str(e)}"
        }


def run_website_analysis(domain: str, company_name: str = None) -> Dict[str, Any]:
    """Main function to scrape and analyze a website."""
    print(f"\n{'='*50}")
    print(f"Website Analysis: {domain}")
    print(f"{'='*50}")
    
    # Step 1: Scrape the website
    scraped_data = scrape_website(domain)
    
    if not scraped_data.get("pages"):
        return {
            "success": False,
            "domain": domain,
            "error": "Could not scrape any pages from the website",
            "scraped_data": scraped_data
        }
    
    print(f"\nSuccessfully scraped {scraped_data['pages_scraped']} pages")
    
    # Step 2: Analyze with AI
    print("Analyzing content with AI...")
    analysis = analyze_website_content(scraped_data, company_name)
    
    if analysis.get("success"):
        print("✓ Analysis complete!")
    else:
        print(f"✗ Analysis failed: {analysis.get('error')}")
    
    # Combine results
    result = {
        "domain": domain,
        "company_name": company_name,
        "scrape_success": True,
        "pages_scraped": scraped_data["pages_scraped"],
        "analysis": analysis if analysis.get("success") else None,
        "error": analysis.get("error") if not analysis.get("success") else None
    }
    
    return result


# --- Test ---
if __name__ == "__main__":
    # Test with a sample domain
    test_domain = "stripe.com"
    result = run_website_analysis(test_domain, "Stripe")
    print("\n" + "="*50)
    print("FINAL RESULT:")
    print("="*50)
    print(json.dumps(result, indent=2))
