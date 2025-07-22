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
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()  # Raises an exception for 4xx or 5xx status codes
        return response.json()
