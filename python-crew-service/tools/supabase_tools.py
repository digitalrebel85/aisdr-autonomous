import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_lead_by_email(email: str, user_id: str) -> dict | None:
    """Fetches lead details from Supabase by email and user_id."""
    print(f"--- FETCHING LEAD: email={email}, user_id={user_id} ---")
    response = supabase.table('leads').select('*').eq('email', email).eq('user_id', user_id).limit(1).execute()
    if response.data:
        return response.data[0]
    return None

def get_campaign_performance_metrics(user_id: str, days: int = 30) -> dict:
    """Fetches campaign performance metrics for a given user over a specified number of days."""
    from datetime import datetime, timedelta

    print(f"--- FETCHING METRICS: user_id={user_id}, days={days} ---")

    # 1. Define date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    # 2. Get total emails sent in the period
    sent_response = supabase.table('sent_emails').select('message_id', count='exact').eq('user_id', user_id).gte('created_at', start_date.isoformat()).execute()
    total_sent = sent_response.count or 0
    if total_sent == 0:
        return {"message": f"No emails sent in the last {days} days."}
    sent_message_ids = [item['message_id'] for item in sent_response.data]

    # 3. Get counts for opens, bounces, and replies
    events_response = supabase.table('email_events').select('message_id', 'event_type').in_('message_id', sent_message_ids).execute()
    replies_response = supabase.table('replies').select('message_id', 'sentiment').in_('message_id', sent_message_ids).execute()

    opened_ids = {e['message_id'] for e in events_response.data if e['event_type'] == 'opened'}
    bounced_ids = {e['message_id'] for e in events_response.data if e['event_type'] == 'bounced'}
    replied_ids = {r['message_id'] for r in replies_response.data}

    # 4. Calculate rates
    open_rate = (len(opened_ids) / total_sent) * 100 if total_sent > 0 else 0
    reply_rate = (len(replied_ids) / total_sent) * 100 if total_sent > 0 else 0
    bounce_rate = (len(bounced_ids) / total_sent) * 100 if total_sent > 0 else 0

    # 5. Calculate sentiment breakdown
    sentiment_counts = {}
    for reply in replies_response.data:
        sentiment = reply.get('sentiment', 'unknown').lower()
        sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1

    return {
        "period_days": days,
        "total_sent": total_sent,
        "open_rate": f"{open_rate:.2f}%",
        "reply_rate": f"{reply_rate:.2f}%",
        "bounce_rate": f"{bounce_rate:.2f}%",
        "total_replies": len(replied_ids),
        "sentiment_breakdown": sentiment_counts,
    }
