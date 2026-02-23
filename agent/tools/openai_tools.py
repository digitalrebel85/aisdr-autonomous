"""
OpenAI Email Generation for AISDR

Generates personalized cold emails using OpenAI GPT-4.
"""

import os
from typing import Dict, Optional, List
from dataclasses import dataclass
import json

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: OpenAI library not installed. Run: pip install openai")

@dataclass
class EmailTemplate:
    subject: str
    body: str
    personalization_notes: str

class EmailGenerator:
    """Generates personalized cold emails using OpenAI."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=self.api_key) if OPENAI_AVAILABLE and self.api_key else None
        self.model = "gpt-4o-mini"  # Fast and cost-effective
        
    def generate_email(
        self,
        lead_first_name: str,
        lead_title: str,
        lead_company: str,
        lead_industry: str,
        sender_name: str,
        sender_company: str,
        value_proposition: str,
        pain_points: List[str],
        sequence_step: int = 1,
        previous_emails: Optional[List[str]] = None
    ) -> EmailTemplate:
        """
        Generate a personalized cold email.
        
        Args:
            lead_first_name: Lead's first name
            lead_title: Lead's job title
            lead_company: Lead's company name
            lead_industry: Lead's industry
            sender_name: Your name
            sender_company: Your company name
            value_proposition: What you offer (1-2 sentences)
            pain_points: List of pain points to address
            sequence_step: Which email in sequence (1-4)
            previous_emails: Previous emails in this thread (for follow-ups)
            
        Returns:
            EmailTemplate with subject and body
        """
        if not self.client:
            return self._fallback_template(lead_first_name, sequence_step)
            
        # Build the prompt
        system_prompt = """You are an expert B2B sales copywriter specializing in cold outreach.
Your emails are:
- Short (50-100 words max)
- Highly personalized based on the prospect's role and company
- Focused on a specific pain point
- Conversational, not salesy
- End with a soft question or call-to-action
- NEVER use generic phrases like "I hope this email finds you well"
- NEVER use exclamation points
- NEVER mention you're an AI"""

        if sequence_step == 1:
            # First touch - cold intro
            user_prompt = f"""Write a cold outreach email to:

Prospect: {lead_first_name} ({lead_title}) at {lead_company} ({lead_industry})

Value Proposition: {value_proposition}

Pain Points to Address: {', '.join(pain_points)}

From: {sender_name} at {sender_company}

Requirements:
- Subject line should be 3-6 words, intriguing but not clickbait
- First line should reference their role or company specifically
- Mention ONE specific pain point they likely face
- End with a soft question they can answer with yes/no
- Keep under 80 words

Return ONLY a JSON object with this format:
{{
    "subject": "subject line here",
    "body": "email body here"
}}"""

        elif sequence_step == 2:
            # Follow-up #1 - value add
            user_prompt = f"""Write a follow-up email to:

Prospect: {lead_first_name} ({lead_title}) at {lead_company}

This is the 2nd email in the sequence. Reference that you reached out before but keep it brief.

Value Proposition: {value_proposition}

From: {sender_name} at {sender_company}

Requirements:
- Subject: "Re: [original subject]" or similar
- Very short (30-50 words)
- Briefly mention you emailed before
- Share a relevant insight or case study
- Ask if they're open to learning more
- Keep it casual

Return ONLY a JSON object:
{{
    "subject": "subject line here",
    "body": "email body here"
}}"""

        elif sequence_step == 3:
            # Follow-up #2 - direct ask
            user_prompt = f"""Write a follow-up email to:

Prospect: {lead_first_name} ({lead_title}) at {lead_company}

This is the 3rd email - time to be more direct.

Value Proposition: {value_proposition}

From: {sender_name} at {sender_company}

Requirements:
- Short and direct
- Acknowledge they might be busy
- Clear ask for a 15-minute call
- Include this line: "If this isn't a priority right now, I completely understand."
- 40-60 words max

Return ONLY a JSON object:
{{
    "subject": "subject line here",
    "body": "email body here"
}}"""

        else:
            # Breakup email
            user_prompt = f"""Write a final "breakup" email to:

Prospect: {lead_first_name} ({lead_title}) at {lead_company}

This is the last email in the sequence.

From: {sender_name} at {sender_company}

Requirements:
- Subject: "Should I close your file?" or similar
- Very short (20-40 words)
- Permission-based language
- Easy for them to say "no thanks" or "yes, let's talk"
- No guilt, no pressure

Return ONLY a JSON object:
{{
    "subject": "subject line here",
    "body": "email body here"
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            
            # Parse the JSON response
            try:
                # Sometimes GPT wraps in markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                    
                result = json.loads(content.strip())
                
                return EmailTemplate(
                    subject=result.get('subject', 'Quick question'),
                    body=result.get('body', ''),
                    personalization_notes=f"Generated for {lead_first_name} at {lead_company} (step {sequence_step})"
                )
                
            except json.JSONDecodeError as e:
                print(f"Error parsing GPT response: {e}")
                print(f"Raw response: {content}")
                return self._fallback_template(lead_first_name, sequence_step)
                
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._fallback_template(lead_first_name, sequence_step)
            
    def _fallback_template(self, first_name: str, step: int) -> EmailTemplate:
        """Fallback templates if OpenAI fails."""
        templates = {
            1: EmailTemplate(
                subject=f"Quick question, {first_name}",
                body=f"Hi {first_name},\n\nI help marketing agencies replace their SDR teams with AI that books meetings 24/7.\n\nWorth a brief conversation?\n\nBest",
                personalization_notes="Fallback template (step 1)"
            ),
            2: EmailTemplate(
                subject="Re: Quick question",
                body=f"Hi {first_name},\n\nQuick follow-up. One of our agency clients replaced 3 SDRs with our AI and increased demo bookings by 3x.\n\nOpen to seeing how it works?\n\nBest",
                personalization_notes="Fallback template (step 2)"
            ),
            3: EmailTemplate(
                subject="15 minutes?",
                body=f"Hi {first_name},\n\nI know you're busy. Worth 15 minutes to see if AI SDR could work for your agency?\n\nIf not, no worries at all.\n\nBest",
                personalization_notes="Fallback template (step 3)"
            ),
            4: EmailTemplate(
                subject="Should I close your file?",
                body=f"Hi {first_name},\n\nI don't want to clutter your inbox. Should I close your file, or is this worth a quick chat?\n\nEither way is fine.\n\nBest",
                personalization_notes="Fallback template (step 4 - breakup)"
            )
        }
        return templates.get(step, templates[1])
        
    def analyze_reply(self, reply_text: str) -> Dict:
        """
        Analyze an email reply to determine intent.
        
        Returns:
            Dict with category and suggested action
        """
        if not self.client:
            return {'category': 'unknown', 'action': 'manual_review'}
            
        system_prompt = """You are an expert at analyzing sales email replies.
Categorize the reply into exactly one of these categories:
- "positive": Interested, wants to meet, asking for more info
- "meeting": Directly asking for or agreeing to a meeting
- "question": Has questions but seems interested
- "not_interested": Explicitly not interested
- "wrong_person": Not the right contact
- "out_of_office": Out of office reply
- "unsubscribe": Asking to be removed
- "other": Doesn't fit above categories

Also extract any meeting booking intent or specific questions asked."""

        user_prompt = f"""Analyze this email reply:

---
{reply_text}
---

Return ONLY a JSON object:
{{
    "category": "one of the categories above",
    "confidence": 0-100,
    "summary": "brief summary of what they said",
    "action": "suggested next action",
    "questions": ["any questions they asked"],
    "meeting_intent": true/false
}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            
            # Clean up and parse
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
            
        except Exception as e:
            print(f"Error analyzing reply: {e}")
            return {'category': 'unknown', 'action': 'manual_review'}

# Convenience functions
_email_generator: Optional[EmailGenerator] = None

def init_email_generator(api_key: Optional[str] = None) -> EmailGenerator:
    """Initialize global email generator."""
    global _email_generator
    _email_generator = EmailGenerator(api_key)
    return _email_generator

def get_email_generator() -> Optional[EmailGenerator]:
    """Get global email generator."""
    return _email_generator

async def generate_personalized_email(
    lead_first_name: str,
    lead_title: str,
    lead_company: str,
    lead_industry: str,
    sender_name: str,
    sender_company: str,
    value_proposition: str,
    pain_points: List[str],
    sequence_step: int = 1
) -> EmailTemplate:
    """Generate a personalized email."""
    if not _email_generator:
        init_email_generator()
    return _email_generator.generate_email(
        lead_first_name, lead_title, lead_company, lead_industry,
        sender_name, sender_company, value_proposition, pain_points,
        sequence_step
    )

async def analyze_email_reply(reply_text: str) -> Dict:
    """Analyze an email reply."""
    if not _email_generator:
        init_email_generator()
    return _email_generator.analyze_reply(reply_text)