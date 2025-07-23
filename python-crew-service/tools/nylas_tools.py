import os
import httpx

NYLAS_API_KEY = os.getenv('NYLAS_API_KEY')
NYLAS_API_SERVER = os.getenv('NYLAS_API_SERVER')

async def get_message_details(grant_id: str, message_id: str) -> dict:
    """Fetches the full details of a specific email message using the Nylas API asynchronously."""
    print(f"--- FETCHING MESSAGE DETAILS: grant_id={grant_id}, message_id={message_id} ---")
    url = f"{NYLAS_API_SERVER}/v3/grants/{grant_id}/messages/{message_id}"
    headers = {
        "Authorization": f"Bearer {NYLAS_API_KEY}",
        "Accept": "application/json"
    }
    # Set a longer timeout (e.g., 30 seconds) to handle slow API responses
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()  # Raises an exception for 4xx or 5xx status codes
        message_data = response.json()
        # Debug: Print the full message structure to understand available fields
        print(f"--- DEBUG: Full Nylas message response ---")
        print(f"Available fields: {list(message_data.keys())}")
        if 'body' in message_data:
            print(f"Body field exists: {type(message_data['body'])}")
        if 'snippet' in message_data:
            print(f"Snippet: '{message_data['snippet']}'")
        return message_data
