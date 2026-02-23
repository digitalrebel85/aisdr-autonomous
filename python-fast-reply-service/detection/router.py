"""
Fast Reply Detection Router
Routes incoming emails to the correct processing pipeline based on provider.
"""

import asyncio
import json
import logging
from typing import Dict, Optional
from datetime import datetime
import redis.asyncio as redis
from imap_tools import MailBox, AND
from pydantic import BaseModel

from models.schemas import EmailReply, LeadContext
from detection.gmail_pubsub import GmailPubSubWatcher
from detection.outlook_graph import OutlookGraphWatcher
from detection.imap_poller import AggressiveIMAPPoller

logger = logging.getLogger(__name__)

class DetectionRouter:
    """Main router that coordinates all detection methods"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.gmail_watchers: Dict[str, GmailPubSubWatcher] = {}
        self.outlook_watchers: Dict[str, OutlookGraphWatcher] = {}
        self.imap_poller = AggressiveIMAPPoller(redis_url=redis_url)
        self.active_users: Dict[str, dict] = {}
        
    async def start(self):
        """Start all detection services"""
        logger.info("Starting detection router...")
        
        # Start IMAP poller for non-push providers
        asyncio.create_task(self.imap_poller.start())
        
        # Load and register all active users
        await self._load_active_users()
        
        logger.info(f"Detection router started with {len(self.active_users)} users")
        
    async def register_user(self, user_id: str, credentials: dict):
        """Register a user for reply detection based on their email provider"""
        email = credentials.get('email', '').lower()
        
        try:
            if self._is_gmail(email):
                await self._register_gmail(user_id, credentials)
            elif self._is_outlook(email):
                await self._register_outlook(user_id, credentials)
            else:
                # Fall back to IMAP polling
                await self._register_imap(user_id, credentials)
                
            self.active_users[user_id] = {
                'email': email,
                'registered_at': datetime.utcnow().isoformat(),
                'provider': self._detect_provider(email)
            }
            
            logger.info(f"Registered user {user_id} ({email}) with {self._detect_provider(email)}")
            
        except Exception as e:
            logger.error(f"Failed to register user {user_id}: {e}")
            # Fall back to IMAP on any error
            await self._register_imap(user_id, credentials)
    
    async def _register_gmail(self, user_id: str, credentials: dict):
        """Register Gmail user with Pub/Sub"""
        watcher = GmailPubSubWatcher(
            project_id=credentials.get('google_project_id'),
            redis_url=str(self.redis.connection_pool.connection_kwargs['host'])
        )
        await watcher.setup_watch(
            user_email=credentials['email'],
            credentials=credentials['google_credentials']
        )
        self.gmail_watchers[user_id] = watcher
    
    async def _register_outlook(self, user_id: str, credentials: dict):
        """Register Outlook user with Graph API webhooks"""
        watcher = OutlookGraphWatcher(
            client_id=credentials.get('ms_client_id'),
            client_secret=credentials.get('ms_client_secret'),
            tenant_id=credentials.get('ms_tenant_id'),
            redis_url=str(self.redis.connection_pool.connection_kwargs['host'])
        )
        await watcher.subscribe_to_replies(
            user_email=credentials['email'],
            webhook_url=f"https://your-domain.com/webhook/outlook"
        )
        self.outlook_watchers[user_id] = watcher
    
    async def _register_imap(self, user_id: str, credentials: dict):
        """Register user for IMAP polling"""
        await self.imap_poller.add_inbox(user_id, credentials)
    
    async def _load_active_users(self):
        """Load all active users from database"""
        # This would query your Supabase for users with email credentials
        # For now, users must be registered manually
        pass
    
    def _detect_provider(self, email: str) -> str:
        """Detect email provider from address"""
        if self._is_gmail(email):
            return "gmail"
        elif self._is_outlook(email):
            return "outlook"
        return "imap"
    
    def _is_gmail(self, email: str) -> bool:
        """Check if email is Gmail or Google Workspace"""
        return ('gmail.com' in email or 
                email.endswith('.google.com') or
                'googlemail.com' in email)
    
    def _is_outlook(self, email: str) -> bool:
        """Check if email is Outlook/Hotmail/Office365"""
        outlook_domains = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'office365.com']
        return any(domain in email for domain in outlook_domains)
    
    async def handle_incoming_reply(self, user_id: str, reply_data: dict):
        """Process detected reply and queue for AI processing"""
        try:
            reply = EmailReply(**reply_data)
            
            # Get lead context from database
            lead_context = await self._get_lead_context(reply.from_email)
            
            # Get thread history
            thread_history = await self._get_thread_history(reply.thread_id)
            
            # Create job for worker
            job = {
                'user_id': user_id,
                'reply': reply.model_dump(),
                'lead_context': lead_context.model_dump() if lead_context else None,
                'thread_history': thread_history,
                'received_at': datetime.utcnow().isoformat(),
                'priority': 'high'
            }
            
            # Push to Redis queue (LPUSH for FIFO)
            await self.redis.lpush('reply_queue', json.dumps(job))
            
            # Also publish to pub/sub for real-time notifications
            await self.redis.publish(f"replies:{user_id}", json.dumps(job))
            
            logger.info(f"Queued reply from {reply.from_email} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error handling reply: {e}")
    
    async def _get_lead_context(self, email: str) -> Optional[LeadContext]:
        """Fetch lead context from Supabase"""
        # This would query your Supabase
        # Return cached result from Redis first
        cached = await self.redis.get(f"lead:{email}")
        if cached:
            return LeadContext(**json.loads(cached))
        return None
    
    async def _get_thread_history(self, thread_id: str) -> list:
        """Fetch email thread history"""
        # Query Supabase for previous emails in thread
        return []
    
    async def unregister_user(self, user_id: str):
        """Remove user from all detection methods"""
        if user_id in self.gmail_watchers:
            await self.gmail_watchers[user_id].stop_watch()
            del self.gmail_watchers[user_id]
        
        if user_id in self.outlook_watchers:
            await self.outlook_watchers[user_id].unsubscribe()
            del self.outlook_watchers[user_id]
        
        await self.imap_poller.remove_inbox(user_id)
        
        if user_id in self.active_users:
            del self.active_users[user_id]
        
        logger.info(f"Unregistered user {user_id}")


# Singleton instance
_router: Optional[DetectionRouter] = None

def get_router() -> DetectionRouter:
    global _router
    if _router is None:
        _router = DetectionRouter()
    return _router
