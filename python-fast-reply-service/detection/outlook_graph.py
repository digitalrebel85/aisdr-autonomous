"""
Outlook Graph API Watcher
Real-time webhooks for Microsoft 365/Outlook users.
"""

import json
import logging
from typing import Optional
import msal
import requests
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class OutlookGraphWatcher:
    """Watches Outlook inbox via Microsoft Graph webhooks"""
    
    def __init__(self, client_id: str, client_secret: str, tenant_id: str, 
                 redis_url: str = "redis://localhost:6379/0"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.tenant_id = tenant_id
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.app = msal.ConfidentialClientApplication(
            client_id,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            client_credential=client_secret
        )
        self.subscriptions: dict = {}
        
    async def subscribe_to_replies(self, user_email: str, webhook_url: str):
        """Subscribe to email notifications via Graph API"""
        try:
            # Get access token
            token = self.app.acquire_token_for_client(
                scopes=["https://graph.microsoft.com/.default"]
            )
            
            if "access_token" not in token:
                logger.error(f"Failed to acquire token: {token.get('error_description')}")
                return
            
            # Create subscription
            from datetime import datetime, timedelta
            
            subscription = {
                "changeType": "created",
                "notificationUrl": webhook_url,
                "resource": f"users/{user_email}/messages",
                "expirationDateTime": (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z",
                "clientState": "aisdr-secret-validation"
            }
            
            response = requests.post(
                "https://graph.microsoft.com/v1.0/subscriptions",
                headers={"Authorization": f"Bearer {token['access_token']}"},
                json=subscription
            )
            
            if response.status_code == 201:
                data = response.json()
                self.subscriptions[user_email] = {
                    'id': data['id'],
                    'expiration': data['expirationDateTime']
                }
                logger.info(f"Graph subscription created for {user_email}")
            else:
                logger.error(f"Failed to create subscription: {response.text}")
                
        except Exception as e:
            logger.error(f"Error subscribing to Outlook: {e}")
            raise
    
    async def unsubscribe(self, user_email: str):
        """Remove subscription"""
        if user_email not in self.subscriptions:
            return
        
        try:
            token = self.app.acquire_token_for_client(
                scopes=["https://graph.microsoft.com/.default"]
            )
            
            sub_id = self.subscriptions[user_email]['id']
            
            response = requests.delete(
                f"https://graph.microsoft.com/v1.0/subscriptions/{sub_id}",
                headers={"Authorization": f"Bearer {token['access_token']}"}
            )
            
            if response.status_code == 204:
                del self.subscriptions[user_email]
                logger.info(f"Unsubscribed {user_email}")
            else:
                logger.error(f"Failed to unsubscribe: {response.text}")
                
        except Exception as e:
            logger.error(f"Error unsubscribing: {e}")
    
    async def process_notification(self, validation_token: Optional[str], data: dict):
        """Process incoming webhook from Microsoft"""
        # Handle validation challenge
        if validation_token:
            return validation_token
        
        try:
            # Process actual notifications
            for notification in data.get('value', []):
                resource = notification.get('resourceData', {})
                message_id = resource.get('id')
                user_id = notification.get('resource', '').split('/')[1] if notification.get('resource') else None
                
                if message_id and user_id:
                    logger.info(f"Outlook notification: new message {message_id} for {user_id}")
                    await self._fetch_and_process_message(user_id, message_id)
                    
        except Exception as e:
            logger.error(f"Error processing Outlook notification: {e}")
    
    async def _fetch_and_process_message(self, user_id: str, message_id: str):
        """Fetch full message from Graph API"""
        # This would fetch the actual message content
        # and queue it for processing
        pass
    
    async def renew_subscriptions(self):
        """Renew expiring subscriptions (run periodically)"""
        from datetime import datetime, timedelta
        
        for user_email, sub in self.subscriptions.items():
            expiration = datetime.fromisoformat(sub['expiration'].replace('Z', '+00:00'))
            
            # Renew if expiring in less than 12 hours
            if expiration - datetime.now(expiration.tzinfo) < timedelta(hours=12):
                try:
                    token = self.app.acquire_token_for_client(
                        scopes=["https://graph.microsoft.com/.default"]
                    )
                    
                    new_expiration = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
                    
                    response = requests.patch(
                        f"https://graph.microsoft.com/v1.0/subscriptions/{sub['id']}",
                        headers={"Authorization": f"Bearer {token['access_token']}"},
                        json={"expirationDateTime": new_expiration}
                    )
                    
                    if response.status_code == 200:
                        sub['expiration'] = new_expiration
                        logger.info(f"Renewed subscription for {user_email}")
                    else:
                        logger.error(f"Failed to renew: {response.text}")
                        
                except Exception as e:
                    logger.error(f"Error renewing subscription: {e}")
