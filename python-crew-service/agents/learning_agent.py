"""
Learning Agent — Analyzes campaign/angle performance, identifies winners,
generates new test angles, and provides strategic insights.

This is the brain that makes the system get smarter over time.
"""

import os
import json
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", ""))
)

# ─── Constants ────────────────────────────────────────────────────────────────

MIN_EMAILS_FOR_SIGNIFICANCE = 30   # Need 30+ emails to judge an angle
WINNER_THRESHOLD = 1.5             # 50% better than average = winner
LOSER_THRESHOLD = 0.5              # 50% worse than average = loser
MAX_ACTIVE_ANGLES_PER_ICP = 5      # Don't create too many angles


# ─── Metrics Aggregation ─────────────────────────────────────────────────────

def aggregate_angle_metrics(user_id: str) -> Dict[str, Any]:
    """
    Aggregate real performance metrics per angle from sent_emails, email_events, and replies.
    Returns per-angle stats and overall averages.
    """
    # Get all active angles for this user
    angles_resp = supabase.table('icp_angles').select(
        'id, name, icp_profile_id, value_proposition, tone, hooks, pain_points, proof_points, performance_stats, is_control'
    ).eq('user_id', user_id).eq('is_active', True).execute()
    
    angles = angles_resp.data or []
    if not angles:
        return {'angles': [], 'has_data': False, 'message': 'No active angles found'}
    
    angle_ids = [a['id'] for a in angles]
    
    # Get sent emails with angle_id
    sent_resp = supabase.table('sent_emails').select(
        'id, angle_id, message_id, lead_id, campaign_id'
    ).eq('user_id', user_id).in_('angle_id', angle_ids).execute()
    
    sent_emails = sent_resp.data or []
    
    if not sent_emails:
        return {'angles': angles, 'has_data': False, 'message': 'No emails sent with angle tracking yet'}
    
    # Build per-angle email counts
    angle_email_map: Dict[int, List[Dict]] = {a['id']: [] for a in angles}
    all_message_ids = []
    all_lead_ids = []
    
    for email in sent_emails:
        aid = email.get('angle_id')
        if aid and aid in angle_email_map:
            angle_email_map[aid].append(email)
            if email.get('message_id'):
                all_message_ids.append(email['message_id'])
            if email.get('lead_id'):
                all_lead_ids.append(email['lead_id'])
    
    # Get open events
    opens_by_message = set()
    if all_message_ids:
        # Batch in chunks of 200
        for i in range(0, len(all_message_ids), 200):
            chunk = all_message_ids[i:i+200]
            events_resp = supabase.table('email_events').select(
                'message_id'
            ).in_('message_id', chunk).eq('event_type', 'opened').execute()
            for e in (events_resp.data or []):
                opens_by_message.add(e['message_id'])
    
    # Get replies with sentiment
    replies_by_lead: Dict[str, Dict] = {}
    if all_lead_ids:
        for i in range(0, len(all_lead_ids), 200):
            chunk = all_lead_ids[i:i+200]
            replies_resp = supabase.table('replies').select(
                'lead_id, sentiment, action'
            ).in_('lead_id', chunk).execute()
            for r in (replies_resp.data or []):
                lid = r.get('lead_id')
                if lid:
                    replies_by_lead[lid] = r
    
    # Get meetings booked
    meetings_by_lead = set()
    if all_lead_ids:
        for i in range(0, len(all_lead_ids), 200):
            chunk = all_lead_ids[i:i+200]
            meetings_resp = supabase.table('leads').select(
                'id'
            ).in_('id', chunk).eq('lead_status', 'meeting_booked').execute()
            for m in (meetings_resp.data or []):
                meetings_by_lead.add(m['id'])
    
    # Calculate per-angle metrics
    angle_results = []
    total_sent = 0
    total_opens = 0
    total_replies = 0
    total_positive = 0
    total_meetings = 0
    
    for angle in angles:
        aid = angle['id']
        emails = angle_email_map.get(aid, [])
        sent_count = len(emails)
        
        open_count = sum(1 for e in emails if e.get('message_id') in opens_by_message)
        reply_count = sum(1 for e in emails if e.get('lead_id') in replies_by_lead)
        positive_count = sum(
            1 for e in emails 
            if e.get('lead_id') in replies_by_lead 
            and replies_by_lead[e['lead_id']].get('sentiment') in ('positive', 'interested')
        )
        meeting_count = sum(1 for e in emails if e.get('lead_id') in meetings_by_lead)
        
        open_rate = round((open_count / sent_count * 100), 2) if sent_count > 0 else 0
        reply_rate = round((reply_count / sent_count * 100), 2) if sent_count > 0 else 0
        positive_rate = round((positive_count / reply_count * 100), 2) if reply_count > 0 else 0
        meeting_rate = round((meeting_count / sent_count * 100), 2) if sent_count > 0 else 0
        
        # Composite score: weighted combination
        composite_score = (
            open_rate * 0.15 +
            reply_rate * 0.35 +
            positive_rate * 0.25 +
            meeting_rate * 0.25
        ) if sent_count >= MIN_EMAILS_FOR_SIGNIFICANCE else None
        
        total_sent += sent_count
        total_opens += open_count
        total_replies += reply_count
        total_positive += positive_count
        total_meetings += meeting_count
        
        angle_results.append({
            'angle_id': aid,
            'name': angle['name'],
            'icp_profile_id': angle['icp_profile_id'],
            'value_proposition': angle['value_proposition'],
            'tone': angle.get('tone', 'professional'),
            'hooks': angle.get('hooks', []),
            'pain_points': angle.get('pain_points', []),
            'proof_points': angle.get('proof_points', []),
            'is_control': angle.get('is_control', False),
            'emails_sent': sent_count,
            'opens': open_count,
            'replies': reply_count,
            'positive_replies': positive_count,
            'meetings_booked': meeting_count,
            'open_rate': open_rate,
            'reply_rate': reply_rate,
            'positive_rate': positive_rate,
            'meeting_rate': meeting_rate,
            'composite_score': composite_score,
            'has_enough_data': sent_count >= MIN_EMAILS_FOR_SIGNIFICANCE
        })
    
    # Calculate averages
    avg_open = round((total_opens / total_sent * 100), 2) if total_sent > 0 else 0
    avg_reply = round((total_replies / total_sent * 100), 2) if total_sent > 0 else 0
    avg_positive = round((total_positive / total_replies * 100), 2) if total_replies > 0 else 0
    avg_meeting = round((total_meetings / total_sent * 100), 2) if total_sent > 0 else 0
    
    # Tag winners and losers
    scored_angles = [a for a in angle_results if a['composite_score'] is not None]
    if scored_angles:
        avg_composite = sum(a['composite_score'] for a in scored_angles) / len(scored_angles)
        for a in angle_results:
            if a['composite_score'] is not None and avg_composite > 0:
                ratio = a['composite_score'] / avg_composite
                if ratio >= WINNER_THRESHOLD:
                    a['status'] = 'winner'
                elif ratio <= LOSER_THRESHOLD:
                    a['status'] = 'loser'
                else:
                    a['status'] = 'testing'
            else:
                a['status'] = 'insufficient_data'
    else:
        for a in angle_results:
            a['status'] = 'insufficient_data'
    
    return {
        'has_data': total_sent > 0,
        'angles': angle_results,
        'totals': {
            'total_sent': total_sent,
            'total_opens': total_opens,
            'total_replies': total_replies,
            'total_positive': total_positive,
            'total_meetings': total_meetings,
        },
        'averages': {
            'open_rate': avg_open,
            'reply_rate': avg_reply,
            'positive_rate': avg_positive,
            'meeting_rate': avg_meeting,
        },
        'winners': [a for a in angle_results if a.get('status') == 'winner'],
        'losers': [a for a in angle_results if a.get('status') == 'loser'],
    }


# ─── Angle Traffic Allocation ────────────────────────────────────────────────

def calculate_angle_weights(angle_metrics: Dict[str, Any]) -> Dict[int, float]:
    """
    Calculate traffic allocation weights per angle.
    Winners get more traffic, losers get less, new angles get exploration budget.
    Uses Thompson Sampling-inspired approach.
    """
    angles = angle_metrics.get('angles', [])
    if not angles:
        return {}
    
    weights: Dict[int, float] = {}
    
    for angle in angles:
        aid = angle['angle_id']
        status = angle.get('status', 'insufficient_data')
        
        if status == 'winner':
            weights[aid] = 3.0       # 3x traffic
        elif status == 'loser':
            weights[aid] = 0.5       # Half traffic (don't kill entirely — might recover)
        elif status == 'testing':
            weights[aid] = 1.0       # Normal traffic
        else:
            weights[aid] = 1.5       # Exploration bonus for new angles
    
    # Normalize to percentages
    total = sum(weights.values())
    if total > 0:
        weights = {k: round(v / total * 100, 1) for k, v in weights.items()}
    
    return weights


# ─── AI Angle Generation ─────────────────────────────────────────────────────

def generate_new_angles_prompt(
    angle_metrics: Dict[str, Any],
    icp_profile: Dict[str, Any],
    offer: Dict[str, Any]
) -> str:
    """Build a prompt for the LLM to generate new test angles based on what's working."""
    
    winners = angle_metrics.get('winners', [])
    losers = angle_metrics.get('losers', [])
    averages = angle_metrics.get('averages', {})
    
    winner_summary = ""
    if winners:
        for w in winners:
            winner_summary += f"\n  - \"{w['name']}\" (reply rate: {w['reply_rate']}%, positive: {w['positive_rate']}%)"
            winner_summary += f"\n    Value prop: {w['value_proposition']}"
            winner_summary += f"\n    Tone: {w['tone']}, Hooks: {', '.join(w.get('hooks', [])[:2])}"
    
    loser_summary = ""
    if losers:
        for l in losers:
            loser_summary += f"\n  - \"{l['name']}\" (reply rate: {l['reply_rate']}%, positive: {l['positive_rate']}%)"
            loser_summary += f"\n    Value prop: {l['value_proposition']}"
    
    prompt = f"""You are an expert B2B sales strategist analyzing email outreach performance.

## Current Performance
- Average open rate: {averages.get('open_rate', 0)}%
- Average reply rate: {averages.get('reply_rate', 0)}%
- Average positive reply rate: {averages.get('positive_rate', 0)}%
- Average meeting rate: {averages.get('meeting_rate', 0)}%

## Winning Angles (what's working):{winner_summary or ' None yet — still testing'}

## Losing Angles (what's NOT working):{loser_summary or ' None identified yet'}

## Target ICP
- Name: {icp_profile.get('name', 'Unknown')}
- Industries: {', '.join(icp_profile.get('industries', []))}
- Job Titles: {', '.join(icp_profile.get('job_titles', []))}
- Company Sizes: {', '.join(icp_profile.get('company_sizes', []))}

## Offer
- Name: {offer.get('name', 'Unknown')}
- Pain Points: {', '.join(offer.get('pain_points', []))}
- Benefits: {', '.join(offer.get('benefits', []))}

## Task
Generate 1-2 NEW messaging angles to test. Each angle should:
1. Build on patterns from winning angles (if any)
2. Avoid patterns from losing angles
3. Try a meaningfully different approach (different tone, hook style, or value prop emphasis)
4. Be specific and actionable

Return ONLY a JSON array of angle objects:
```json
[
  {{
    "name": "Short descriptive name",
    "description": "Why we're testing this angle",
    "value_proposition": "The core pitch in 1-2 sentences",
    "pain_points": ["pain point 1", "pain point 2"],
    "hooks": ["opening hook 1", "opening hook 2"],
    "proof_points": ["proof 1", "proof 2"],
    "tone": "professional|casual|urgent|consultative|challenger",
    "rationale": "Why this angle should work based on the data"
  }}
]
```"""
    
    return prompt


def generate_insights_prompt(angle_metrics: Dict[str, Any]) -> str:
    """Build a prompt for generating strategic insights from the data."""
    
    angles = angle_metrics.get('angles', [])
    averages = angle_metrics.get('averages', {})
    winners = angle_metrics.get('winners', [])
    losers = angle_metrics.get('losers', [])
    
    angle_breakdown = ""
    for a in sorted(angles, key=lambda x: x.get('composite_score') or 0, reverse=True):
        status_emoji = {'winner': 'WINNING', 'loser': 'LOSING', 'testing': 'TESTING'}.get(a.get('status', ''), 'NEW')
        angle_breakdown += f"\n  [{status_emoji}] \"{a['name']}\" — {a['emails_sent']} sent, {a['open_rate']}% open, {a['reply_rate']}% reply, {a['positive_rate']}% positive, {a['meeting_rate']}% meetings"
    
    prompt = f"""You are an expert B2B outreach strategist reviewing campaign performance data.

## Overall Metrics
- Total emails sent: {angle_metrics.get('totals', {}).get('total_sent', 0)}
- Average open rate: {averages.get('open_rate', 0)}%
- Average reply rate: {averages.get('reply_rate', 0)}%
- Average positive rate: {averages.get('positive_rate', 0)}%
- Average meeting rate: {averages.get('meeting_rate', 0)}%

## Per-Angle Breakdown:{angle_breakdown or ' No angle data yet'}

## Winners: {len(winners)} | Losers: {len(losers)}

## Task
Provide a concise strategic analysis with:
1. **Key Finding**: The single most important insight from this data
2. **What's Working**: Patterns in winning angles (tone, hooks, value props)
3. **What's Not Working**: Patterns in losing angles to avoid
4. **Recommendations**: 2-3 specific, actionable next steps
5. **Confidence Level**: How confident are you in these conclusions (low/medium/high) based on sample size

Return as JSON:
```json
{{
  "key_finding": "...",
  "whats_working": "...",
  "whats_not_working": "...",
  "recommendations": ["...", "..."],
  "confidence": "low|medium|high",
  "suggested_actions": [
    {{"action": "pause_angle", "angle_id": 123, "reason": "..."}},
    {{"action": "increase_traffic", "angle_id": 456, "reason": "..."}},
    {{"action": "create_angle", "description": "..."}}
  ]
}}
```"""
    
    return prompt
