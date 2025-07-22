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
    """Fetches campaign performance metrics by calling the get_user_campaign_analytics RPC in Supabase."""
    print(f"--- FETCHING METRICS VIA RPC: user_id={user_id}, days={days} ---")
    try:
        # Call the database function
        response = supabase.rpc('get_user_campaign_analytics', {'p_user_id': user_id, 'p_days': days}).execute()
        
        # The data is in the first element of the list
        metrics = response.data
        
        if not metrics:
            raise Exception("No data returned from analytics function.")

        # The RPC call returns a list with a single JSONB object
        analytics_data = metrics[0]

        # Format rates to two decimal places and add percentage sign
        if 'open_rate' in analytics_data and analytics_data['open_rate'] is not None:
            analytics_data['open_rate'] = f"{analytics_data['open_rate']:.2f}%"
        if 'reply_rate' in analytics_data and analytics_data['reply_rate'] is not None:
            analytics_data['reply_rate'] = f"{analytics_data['reply_rate']:.2f}%"
        if 'bounce_rate' in analytics_data and analytics_data['bounce_rate'] is not None:
            analytics_data['bounce_rate'] = f"{analytics_data['bounce_rate']:.2f}%"

        print(f"--- METRICS RECEIVED ---\n{analytics_data}")
        return analytics_data

    except Exception as e:
        print(f"Error calling get_user_campaign_analytics RPC: {e}")
        # Return a consistent error structure for the agent
        return {
            "error": "Failed to retrieve campaign metrics.",
            "details": str(e)
        }
