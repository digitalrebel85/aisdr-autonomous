"""
Webhook Server
Receives push notifications from Gmail Pub/Sub and Outlook Graph.
"""

import asyncio
import json
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from detection.router import get_router
from detection.gmail_pubsub import GmailPubSubWatcher
from detection.outlook_graph import OutlookGraphWatcher

logger = logging.getLogger(__name__)

app = FastAPI(title="AISDR Fast Reply Webhooks")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Gmail Pub/Sub webhook
@app.post("/webhook/gmail")
async def gmail_webhook(request: Request):
    """Receive Gmail Pub/Sub push notifications"""
    try:
        body = await request.body()
        data = json.loads(body)
        
        logger.info("Received Gmail webhook notification")
        
        # Process asynchronously
        router = get_router()
        if hasattr(router, 'gmail_watchers'):
            # Find the appropriate watcher and process
            for watcher in router.gmail_watchers.values():
                await watcher.process_push_notification(data)
                break  # Process with first available watcher
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing Gmail webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Outlook Graph webhook
@app.post("/webhook/outlook")
async def outlook_webhook(request: Request):
    """Receive Microsoft Graph webhook notifications"""
    try:
        # Check for validation token (Microsoft sends this to verify endpoint)
        validation_token = request.query_params.get('validationToken')
        
        body = await request.body()
        
        if validation_token:
            # Return validation token as plain text
            logger.info("Outlook validation challenge received")
            return Response(
                content=validation_token,
                media_type="text/plain",
                status_code=200
            )
        
        # Process actual notification
        data = json.loads(body)
        logger.info("Received Outlook webhook notification")
        
        router = get_router()
        if hasattr(router, 'outlook_watchers'):
            for watcher in router.outlook_watchers.values():
                await watcher.process_notification(None, data)
                break
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing Outlook webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "webhook-server"}

# Register user endpoint (for manual registration)
@app.post("/register")
async def register_user(user_id: str, credentials: dict):
    """Register a user for reply detection"""
    try:
        router = get_router()
        await router.register_user(user_id, credentials)
        return {"status": "registered", "user_id": user_id}
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def start_webhook_server(host: str = "0.0.0.0", port: int = 8001):
    """Start the webhook server"""
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_webhook_server())
