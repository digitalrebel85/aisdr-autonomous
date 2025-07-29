import os
import httpx

NYLAS_API_KEY = os.getenv('NYLAS_API_KEY')
NYLAS_API_SERVER = os.getenv('NYLAS_API_SERVER', 'https://api.us.nylas.com')

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
        
        # Debug threading information
        if 'thread_id' in message_data:
            print(f"Thread ID: {message_data['thread_id']}")
        else:
            print("WARNING: No thread_id found in message data")
            
        if 'id' in message_data:
            print(f"Message ID: {message_data['id']}")
        else:
            print("WARNING: No message id found in message data")
            
        # Debug reply-to information
        if 'reply_to' in message_data:
            print(f"Reply-to: {message_data['reply_to']}")
        if 'in_reply_to' in message_data:
            print(f"In-reply-to: {message_data['in_reply_to']}")
        if 'references' in message_data:
            print(f"References: {message_data['references']}")
            
        return message_data
