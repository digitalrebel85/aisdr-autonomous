"""
Fast Reply Detection - Integrated into AISDR
Real-time email reply detection for autonomous response
"""

import asyncio
import json
import logging
from typing import Dict, Optional
from datetime import datetime
from fastapi import APIRouter, Request, Response
import redis.asyncio as redis
from imap_tools import MailBox, AND

from schemas import LeadEnrichmentRequest
from tools.supabase_tools import get_lead_by_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/detection", tags=["detection"])

class FastReplyDetector:
    """Detects email replies across Gmail, Outlook, and IMAP"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.imap_poller: Optional[IMAPPoller] = None
        self._running = False
        
    async def start(self):
        """Start detection services"""
        self._running = True
        logger.info("Starting fast reply detector...")
        
        # Start IMAP poller for non-push providers
        self.imap_poller = IMAPPoller(self.redis)
        asyncio.create_task(self.imap_poller.start())
        
    async def stop(self):
        """Stop detection services"""
        self._running = False
        if self.imap_poller:
            await self.imap_poller.stop()
        logger.info("Fast reply detector stopped")
    
    async def register_email_account(self, user_id: str, email: str, credentials: dict):
        """Register an email account for reply detection"""
        provider = self._detect_provider(email)
        
        if provider == "gmail":
            # Gmail uses Pub/Sub via webhook
            logger.info(f"Registered Gmail account for {user_id}")
        elif provider == "outlook":
            # Outlook uses Graph API webhooks
            logger.info(f"Registered Outlook account for {user_id}")
        else:
            # Generic IMAP polling
            await self.imap_poller.add_inbox(user_id, email, credentials)
            logger.info(f"Registered IMAP account for {user_id}")
    
    def _detect_provider(self, email: str) -> str:
        """Detect email provider"""
        email = email.lower()
        if 'gmail.com' in email or 'googlemail.com' in email:
            return "gmail"
        elif any(x in email for x in ['outlook.com', 'hotmail.com', 'live.com', 'msn.com']):
            return "outlook"
        return "imap"
    
    async def process_reply(self, user_id: str, reply_data: dict):
        """Process a detected reply and queue for AI response"""
        try:
            # Get lead context
            lead = await get_lead_by_email(reply_data['from_email'])
            
            # Create job for reply crew
            job = {
                'user_id': user_id,
                'reply': reply_data,
                'lead': lead,
                'received_at': datetime.utcnow().isoformat(),
                'priority': 'high'
            }
            
            # Queue for processing
            await self.redis.lpush('reply_queue', json.dumps(job))
            
            logger.info(f"Queued reply from {reply_data['from_email']} for AI response")
            
        except Exception as e:
            logger.error(f"Error processing reply: {e}")


class IMAPPoller:
    """Polls IMAP inboxes for replies"""
    
    def __init__(self, redis_client: redis.Redis, poll_interval: int = 15):
        self.redis = redis_client
        self.poll_interval = poll_interval
        self.inboxes: Dict[str, dict] = {}
        self._running = False
        
    async def start(self):
        """Start polling loop"""
        self._running = True
        logger.info(f"IMAP poller started ({self.poll_interval}s interval)")
        
        while self._running:
            start_time = asyncio.get_event_loop().time()
            
            if self.inboxes:
                tasks = [
                    self._check_inbox(user_id, data)
                    for user_id, data in self.inboxes.items()
                ]
                await asyncio.gather(*tasks, return_exceptions=True)
            
            elapsed = asyncio.get_event_loop().time() - start_time
            sleep_time = max(0, self.poll_interval - elapsed)
            await asyncio.sleep(sleep_time)
    
    async def stop(self):
        """Stop polling"""
        self._running = False
        
    async def add_inbox(self, user_id: str, email: str, credentials: dict):
        """Add an inbox to poll"""
        self.inboxes[user_id] = {
            'email': email,
            'credentials': credentials,
            'last_check': datetime.utcnow()
        }
        logger.info(f"Added IMAP inbox: {email}")
    
    async def _check_inbox(self, user_id: str, data: dict):
        """Check single inbox for replies"""
        try:
            creds = data['credentials']
            
            with MailBox(creds['imap_server']).login(
                creds['email'],
                creds['password']
            ) as mailbox:
                
                since = data['last_check']
                
                for msg in mailbox.fetch(AND(date_gte=since)):
                    # Skip our own emails
                    if data['email'] in msg.from_:
                        continue
                    
                    # Check if reply to our campaign
                    if await self._is_reply(msg):
                        reply_data = {
                            'message_id': str(msg.uid),
                            'from_email': msg.from_,
                            'from_name': msg.from_values.name if msg.from_values else '',
                            'subject': msg.subject,
                            'body': msg.text or msg.html or '',
                            'date': msg.date.isoformat() if msg.date else datetime.utcnow().isoformat(),
                            'thread_id': self._extract_thread_id(msg)
                        }
                        
                        # Get detector and process
                        from main import get_detector
                        detector = get_detector()
                        await detector.process_reply(user_id, reply_data)
                        
                        # Mark as seen
                        mailbox.flag(msg.uid, ['Seen'], True)
                
                data['last_check'] = datetime.utcnow()
                
        except Exception as e:
            logger.error(f"IMAP error for {user_id}: {e}")
    
    async def _is_reply(self, msg) -> bool:
        """Check if message is a reply to our campaign"""
        # Check In-Reply-To header
        in_reply_to = msg.headers.get('in-reply-to', [None])[0]
        if in_reply_to:
            exists = await self.redis.sismember('sent_message_ids', in_reply_to)
            if exists:
                return True
        
        # Check References
        refs = msg.headers.get('references', [''])[0].split()
        for ref in refs:
            exists = await self.redis.sismember('sent_message_ids', ref)
            if exists:
                return True
        
        return False
    
    def _extract_thread_id(self, msg) -> str:
        """Extract thread ID from message"""
        refs = msg.headers.get('references', [''])[0].split()
        if refs:
            return refs[0]
        
        in_reply = msg.headers.get('in-reply-to', [None])[0]
        if in_reply:
            return in_reply
        
        msg_id = msg.headers.get('message-id', [None])[0]
        if msg_id:
            return msg_id
        
        import hashlib
        return hashlib.md5(f"{msg.subject}:{msg.from_}".encode()).hexdigest()


# API Routes

@router.post("/webhook/gmail")
async def gmail_webhook(request: Request):
    """Receive Gmail push notifications"""
    try:
        data = await request.json()
        logger.info("Received Gmail webhook")
        # Process Gmail notification
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Gmail webhook error: {e}")
        return {"status": "error"}

@router.post("/webhook/outlook")
async def outlook_webhook(request: Request):
    """Receive Outlook push notifications"""
    validation_token = request.query_params.get('validationToken')
    
    if validation_token:
        return Response(content=validation_token, media_type="text/plain")
    
    try:
        data = await request.json()
        logger.info("Received Outlook webhook")
        # Process Outlook notification
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Outlook webhook error: {e}")
        return {"status": "error"}

@router.post("/register")
async def register_account(request: LeadEnrichmentRequest):
    """Register email account for reply detection"""
    from main import get_detector
    detector = get_detector()
    
    await detector.register_email_account(
        user_id=request.user_id or "",
        email=request.email,
        credentials=request.api_keys or {}
    )
    
    return {"status": "registered"}
