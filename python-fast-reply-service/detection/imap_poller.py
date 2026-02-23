"""
Aggressive IMAP Poller
Polls IMAP inboxes every 15 seconds for users not on Gmail/Outlook.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
from imap_tools import MailBox, AND
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class AggressiveIMAPPoller:
    """Polls IMAP inboxes aggressively (15s interval) for fast detection"""
    
    def __init__(self, poll_interval: int = 15, redis_url: str = "redis://localhost:6379/0"):
        self.poll_interval = poll_interval
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.inboxes: Dict[str, dict] = {}
        self.last_check: Dict[str, datetime] = {}
        self._running = False
        self._message_cache = {}  # Cache for sent message IDs
        
    async def start(self):
        """Start the polling loop"""
        self._running = True
        logger.info(f"IMAP poller started with {self.poll_interval}s interval")
        
        # Pre-load sent message cache
        await self._load_sent_message_cache()
        
        while self._running:
            loop_start = asyncio.get_event_loop().time()
            
            if self.inboxes:
                # Check all inboxes concurrently
                tasks = [
                    self._check_inbox(user_id, creds)
                    for user_id, creds in self.inboxes.items()
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Log any errors
                for user_id, result in zip(self.inboxes.keys(), results):
                    if isinstance(result, Exception):
                        logger.error(f"IMAP error for {user_id}: {result}")
            
            # Ensure consistent interval
            elapsed = asyncio.get_event_loop().time() - loop_start
            sleep_time = max(0, self.poll_interval - elapsed)
            await asyncio.sleep(sleep_time)
    
    async def stop(self):
        """Stop the polling loop"""
        self._running = False
        logger.info("IMAP poller stopped")
    
    async def add_inbox(self, user_id: str, credentials: dict):
        """Add an inbox to poll"""
        self.inboxes[user_id] = credentials
        self.last_check[user_id] = datetime.utcnow() - timedelta(minutes=5)
        logger.info(f"Added IMAP inbox for user {user_id} ({credentials['email']})")
    
    async def remove_inbox(self, user_id: str):
        """Remove an inbox from polling"""
        if user_id in self.inboxes:
            del self.inboxes[user_id]
            del self.last_check[user_id]
            logger.info(f"Removed IMAP inbox for user {user_id}")
    
    async def _check_inbox(self, user_id: str, creds: dict):
        """Check a single inbox for new replies"""
        try:
            # Connect to IMAP
            with MailBox(creds['imap_server']).login(
                creds['email'],
                creds['password']
            ) as mailbox:
                
                # Fetch only unseen emails since last check
                since = self.last_check[user_id]
                
                for msg in mailbox.fetch(AND(date_gte=since)):
                    # Skip our own sent emails
                    if creds['email'] in msg.from_:
                        continue
                    
                    # Check if this is a reply to our campaign
                    if await self._is_reply_to_campaign(msg):
                        # Process the reply
                        await self._process_reply(user_id, msg)
                        
                        # Mark as seen
                        mailbox.flag(msg.uid, ['Seen'], True)
                
                self.last_check[user_id] = datetime.utcnow()
                
        except Exception as e:
            logger.error(f"Error checking inbox for {user_id}: {e}")
            raise
    
    async def _is_reply_to_campaign(self, msg) -> bool:
        """Fast check if message is a reply to our campaign"""
        # Check In-Reply-To header (fastest - O(1) Redis lookup)
        in_reply_to = msg.headers.get('in-reply-to', [None])[0]
        if in_reply_to:
            exists = await self.redis.sismember('sent_message_ids', in_reply_to)
            if exists:
                return True
        
        # Check References header
        references = msg.headers.get('references', [''])[0].split()
        for ref in references:
            exists = await self.redis.sismember('sent_message_ids', ref)
            if exists:
                return True
        
        # Check subject patterns (slower fallback)
        subject = msg.subject.lower()
        if subject.startswith('re:'):
            # Could be a reply - check if we emailed this person
            from_email = msg.from_
            recent_sent = await self.redis.get(f"recent_sent:{from_email}")
            if recent_sent:
                return True
        
        return False
    
    async def _process_reply(self, user_id: str, msg):
        """Process detected reply"""
        reply_data = {
            'message_id': str(msg.uid),
            'from_email': msg.from_,
            'from_name': msg.from_values.name if msg.from_values else '',
            'subject': msg.subject,
            'body': msg.text or msg.html or '',
            'date': msg.date.isoformat() if msg.date else datetime.utcnow().isoformat(),
            'in_reply_to': msg.headers.get('in-reply-to', [None])[0],
            'references': msg.headers.get('references', [''])[0].split(),
            'thread_id': self._extract_thread_id(msg)
        }
        
        # Queue for processing
        from detection.router import get_router
        router = get_router()
        await router.handle_incoming_reply(user_id, reply_data)
        
        logger.info(f"Detected reply from {msg.from_} for user {user_id}")
    
    def _extract_thread_id(self, msg) -> str:
        """Extract thread ID from message headers"""
        # Try References header first
        refs = msg.headers.get('references', [''])[0].split()
        if refs:
            return refs[0]
        
        # Fall back to In-Reply-To
        in_reply = msg.headers.get('in-reply-to', [None])[0]
        if in_reply:
            return in_reply
        
        # Last resort: use Message-ID
        msg_id = msg.headers.get('message-id', [None])[0]
        if msg_id:
            return msg_id
        
        # Absolute fallback: hash of subject + from
        import hashlib
        return hashlib.md5(f"{msg.subject}:{msg.from_}".encode()).hexdigest()
    
    async def _load_sent_message_cache(self):
        """Pre-load recent sent message IDs into Redis"""
        # This would query your Supabase for recent sent emails
        # and cache the message IDs in Redis for fast lookup
        logger.info("Loaded sent message cache")
