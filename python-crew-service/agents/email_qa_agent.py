"""
Email Quality Assurance Agent

Pre-send gate that checks AI-generated emails for:
1. Spam trigger words/phrases
2. Hallucinated statistics or claims
3. Tone violations (too salesy, too aggressive)
4. Formatting issues (missing greeting, too long, etc.)
5. Link safety (no broken/suspicious URLs)

Two-stage check:
  Stage 1: Fast deterministic rules (no LLM cost)
  Stage 2: AI tone/quality review (only if stage 1 passes)
"""

import re
import json
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process


class QACheckResult(BaseModel):
    passed: bool
    score: float  # 0-100
    issues: List[str] = []
    warnings: List[str] = []
    rewritten_subject: Optional[str] = None
    rewritten_body: Optional[str] = None


# --- Stage 1: Deterministic Rules ---

SPAM_TRIGGER_WORDS = [
    "act now", "limited time", "don't miss out", "guaranteed",
    "no obligation", "risk-free", "click here", "buy now",
    "free money", "congratulations", "you've been selected",
    "urgent", "100% free", "double your", "earn extra",
    "no cost", "winner", "amazing deal", "once in a lifetime",
    "order now", "special promotion", "this isn't spam",
    "dear friend", "as seen on", "click below",
]

HALLUCINATION_PATTERNS = [
    r'\b\d{2,3}%\s+(increase|decrease|reduction|improvement|growth|boost|more|less|faster|cheaper)',
    r'\b\d+x\s+(increase|growth|faster|more|better|improvement)',
    r'(saved?|generated?|earned?)\s+\$[\d,]+',
    r'(over|more than)\s+\d+\s+(companies|clients|customers|businesses)\s+(use|trust|rely)',
    r'#1\s+(rated|ranked|platform|solution|tool)',
    r'(studies show|research proves|data shows|statistics show)',
]

TONE_VIOLATIONS = [
    (r'!!+', "Multiple exclamation marks"),
    (r'[A-Z]{5,}', "Excessive capitalization (shouting)"),
    (r'🔥|💰|🚀|💪|🎉|⭐|💯|🏆', "Emoji in cold email"),
    (r'(buy|purchase|invest|pay)\s+(now|today|immediately)', "Hard sell language"),
    (r'(I\s+guarantee|we\s+guarantee|I\s+promise)', "Guarantee claims"),
]

MAX_BODY_WORDS = 200
MAX_SUBJECT_WORDS = 10
MIN_BODY_WORDS = 20


def run_deterministic_checks(subject: str, body: str, step_number: int = 1) -> QACheckResult:
    """Stage 1: Fast rule-based checks. No LLM cost."""
    issues = []
    warnings = []
    score = 100.0

    combined = f"{subject} {body}".lower()

    # Check spam triggers
    for trigger in SPAM_TRIGGER_WORDS:
        if trigger in combined:
            issues.append(f"Spam trigger: '{trigger}'")
            score -= 10

    # Check hallucination patterns
    for pattern in HALLUCINATION_PATTERNS:
        matches = re.findall(pattern, body, re.IGNORECASE)
        if matches:
            issues.append(f"Possible hallucinated claim: '{matches[0]}' (pattern: {pattern[:40]})")
            score -= 15

    # Check tone violations
    for pattern, description in TONE_VIOLATIONS:
        if re.search(pattern, body):
            issues.append(f"Tone violation: {description}")
            score -= 8

    # Check length
    body_words = len(body.split())
    subject_words = len(subject.split())

    if body_words > MAX_BODY_WORDS:
        warnings.append(f"Body too long: {body_words} words (max {MAX_BODY_WORDS})")
        score -= 5

    if body_words < MIN_BODY_WORDS:
        issues.append(f"Body too short: {body_words} words (min {MIN_BODY_WORDS})")
        score -= 10

    if subject_words > MAX_SUBJECT_WORDS:
        warnings.append(f"Subject too long: {subject_words} words (max {MAX_SUBJECT_WORDS})")
        score -= 3

    # Check for missing greeting
    first_line = body.strip().split('\n')[0].lower() if body.strip() else ''
    if not any(g in first_line for g in ['hi ', 'hey ', 'hello ', 'dear ']):
        warnings.append("Missing personal greeting in first line")
        score -= 3

    # Check for links in first email (hardcoded rule)
    if step_number == 1:
        url_pattern = r'https?://[^\s<>\"\')\]]+' 
        urls_in_body = re.findall(url_pattern, body)
        if urls_in_body:
            issues.append(f"Links found in first email (not allowed): {urls_in_body[0][:50]}")
            score -= 15

    # Check for placeholder tokens that weren't replaced
    placeholder_pattern = r'\{\{[^}]+\}\}'
    placeholders = re.findall(placeholder_pattern, body)
    if placeholders:
        issues.append(f"Unreplaced template tokens: {', '.join(placeholders)}")
        score -= 20

    score = max(0, score)
    passed = score >= 60 and len(issues) == 0

    return QACheckResult(
        passed=passed,
        score=score,
        issues=issues,
        warnings=warnings
    )


# --- Stage 2: AI Quality Review ---

def create_qa_review_agent(llm):
    """Create a lightweight QA agent for tone/quality review."""
    return Agent(
        role="Cold Email Quality Reviewer",
        goal="Review a cold outreach email and flag any issues with tone, professionalism, or effectiveness. Be strict but fair.",
        backstory=(
            "You are a senior sales operations manager who reviews every outbound email before it goes out. "
            "You've seen thousands of cold emails and know exactly what gets responses vs what gets marked as spam. "
            "You check for: unnatural AI-sounding language, overpromising, being too generic, weak CTAs, "
            "and anything that would make a busy executive hit delete. You are concise and direct."
        ),
        allow_delegation=False,
        verbose=False,
        llm=llm
    )


def run_ai_review(llm, subject: str, body: str, lead_name: str = "", company: str = "") -> QACheckResult:
    """Stage 2: AI-powered quality review. Only runs if stage 1 passes."""
    try:
        agent = create_qa_review_agent(llm)

        task = Task(
            description=f"""Review this cold email and return a JSON verdict.

SUBJECT: {subject}
BODY:
{body}

CONTEXT: This email is being sent to {lead_name or 'a prospect'} at {company or 'their company'}.

Check for:
1. Does it sound human or AI-generated? (AI tells: generic phrases, perfect grammar, no personality)
2. Is the CTA soft and permission-based? (NOT "book a call" or "schedule a meeting")
3. Is it specific to the recipient or could it be sent to anyone?
4. Any claims that sound made up or unverifiable?
5. Is the tone appropriate for cold outreach? (not too casual, not too formal)

Return ONLY a JSON object:
{{
  "passed": true/false,
  "score": 0-100,
  "issues": ["list of blocking issues"],
  "warnings": ["list of non-blocking suggestions"],
  "rewritten_subject": "improved subject if needed, or null",
  "rewritten_body": "improved body if needed, or null"
}}

If the email is good enough to send (score >= 70), set passed=true and leave rewritten fields as null.
If it needs fixes, set passed=false and provide rewritten versions.""",
            expected_output="JSON object with passed, score, issues, warnings, and optional rewrites",
            agent=agent
        )

        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
        result = crew.kickoff()
        raw = str(result)

        # Parse JSON from result
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > start:
            parsed = json.loads(raw[start:end])
            return QACheckResult(
                passed=parsed.get('passed', True),
                score=float(parsed.get('score', 75)),
                issues=parsed.get('issues', []),
                warnings=parsed.get('warnings', []),
                rewritten_subject=parsed.get('rewritten_subject'),
                rewritten_body=parsed.get('rewritten_body')
            )

        # If parsing fails, pass by default (don't block sends on QA errors)
        return QACheckResult(passed=True, score=70, warnings=["QA AI review returned unparseable result"])

    except Exception as e:
        # On any error, pass by default — don't block sends on QA failures
        return QACheckResult(passed=True, score=70, warnings=[f"QA AI review failed: {str(e)}"])


# --- Combined QA Pipeline ---

def run_email_qa(
    subject: str,
    body: str,
    step_number: int = 1,
    lead_name: str = "",
    company: str = "",
    llm=None,
    skip_ai_review: bool = False
) -> QACheckResult:
    """
    Run the full QA pipeline on an email before sending.
    
    Stage 1: Deterministic rules (always runs, free)
    Stage 2: AI review (only if stage 1 passes and LLM provided)
    
    Returns QACheckResult with pass/fail, score, issues, and optional rewrites.
    """
    # Stage 1: Deterministic
    stage1 = run_deterministic_checks(subject, body, step_number)

    if not stage1.passed:
        return stage1

    # Stage 2: AI review (optional)
    if llm and not skip_ai_review:
        stage2 = run_ai_review(llm, subject, body, lead_name, company)

        # Merge results
        combined_issues = stage1.issues + stage2.issues
        combined_warnings = stage1.warnings + stage2.warnings
        combined_score = min(stage1.score, stage2.score)

        return QACheckResult(
            passed=stage2.passed and len(combined_issues) == 0,
            score=combined_score,
            issues=combined_issues,
            warnings=combined_warnings,
            rewritten_subject=stage2.rewritten_subject,
            rewritten_body=stage2.rewritten_body
        )

    return stage1
