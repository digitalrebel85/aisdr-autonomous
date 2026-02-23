"""
Gmail Pub/Sub Watcher
Real-time push notifications for Gmail users.
"""

import json
import logging
from typing import Optional
from google.cloud import pubsub_v1
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class GmailPubSubWatcher:
    """Watches Gmail inbox via Pub/Sub push notifications"""
    
    def __init__(self, project_id: str, redis_url: str = "redis://localhost:6379/0"):
        self.project_id = project_id
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.publisher = pubsub_v1.PublisherClient()
        self.subscriber = pubsub_v1.SubscriberClient()
        self.active_watches: dict = {}
        
    async def setup_watch(self, user_email: str, credentials: dict):
        """Set up Pub/Sub watch for Gmail inbox"""
        try:
            # Create Gmail service
            creds = Credentials.from_authorized_user_info(credentials)
            service = build('gmail', 'v1', credentials=creds)
            
            # Create topic name (unique per user)
            topic_name = f"gmail-replies-{user_email.replace('@', '-').replace('.', '-')}"
            topic_path = self.publisher.topic_path(self.project_id, topic_name)
            
            # Create topic if not exists
            try:
                self.publisher.create_topic(request={"name": topic_path})
                logger.info(f"Created Pub/Sub topic: {topic_name}")
            except Exception:
                pass  # Topic already exists
            
            # Create push subscription
            subscription_name = f"gmail-sub-{user_email.replace('@', '-').replace('.', '-')}"
            subscription_path = self.subscriber.subscription_path(self.project_id, subscription_name)
            
            push_endpoint = f"https://your-domain.com/webhook/gmail"
            
            try:
                self.subscriber.create_subscription(
                    request={
                        "name": subscription_path,
                        "topic": topic_path,
                        "push_config": {"push_endpoint": push_endpoint},
                        "ack_deadline_seconds": 60
                    }
                )
                logger.info(f"Created Pub/Sub subscription: {subscription_name}")
            except Exception:
                pass  # Subscription already exists
            
            # Tell Gmail to watch this inbox
            request = {
                'labelIds': ['INBOX'],
                'topicName': f"projects/{self.project_id}/topics/{topic_name}",
                'labelFilterAction': 'include'
            }
            
            result = service.users().watch(userId='me', body=request).execute()
            
            self.active_watches[user_email] = {
                'history_id': result['historyId'],
                'expiration': result.get('expiration'),
                'topic': topic_name
            }
            
            logger.info(f"Gmail watch set up for {user_email}")
            
        except Exception as e:
            logger.error(f"Error setting up Gmail watch for {user_email}: {e}")
            raise
    
    async def stop_watch(self, user_email: str):
        """Stop watching Gmail inbox"""
        try:
            # Stop Gmail watch
            service = build('gmail', 'v1')
            service.users().stop(userId='me').execute()
            
            # Clean up subscription
            if user_email in self.active_watches:
                subscription_name = f"gmail-sub-{user_email.replace('@', '-').replace('.', '-')}"
                subscription_path = self.subscriber.subscription_path(self.project_id, subscription_name)
                try:
                    self.subscriber.delete_subscription(request={"subscription": subscription_path})
                except Exception:
                    pass
                
                del self.active_watches[user_email]
            
            logger.info(f"Stopped Gmail watch for {user_email}")
            
        except Exception as e:
            logger.error(f"Error stopping Gmail watch: {e}")
    
    async def process_push_notification(self, data: dict):
        """Process incoming Pub/Sub notification"""
        try:
            message_data = data.get('message', {})
            attributes = message_data.get('attributes', {})
            history_id = attributes.get('historyId')
            email_address = attributes.get('emailAddress')
            
            if not history_id or not email_address:
                logger.warning("Invalid Gmail notification received")
                return
            
            # Fetch changes since last historyId
            # This requires the user's credentials - would need to look them up
            logger.info(f"Gmail notification for {email_address}, historyId: {history_id}")
            
            # Queue for processing
            await self._fetch_and_process_changes(email_address, history_id)
            
        except Exception as e:
            logger.error(f"Error processing Gmail notification: {e}")
    
    async def _fetch_and_process_changes(self, email_address: str, history_id: str):
        """Fetch actual message changes from Gmail API"""
        # This would look up user's credentials and fetch new messages
        # For now, this is a placeholder
        pass
