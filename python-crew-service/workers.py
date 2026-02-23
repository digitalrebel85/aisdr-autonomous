"""
Reply Worker - Processes email replies with AI
Integrated into the main crew service
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Optional
import redis.asyncio as redis
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from crew.reply_crew import create_reply_crew
from tools.supabase_tools import get_lead_by_email
from schemas import EmailReply

logger = logging.getLogger(__name__)

class ReplyWorker:
    """Processes reply queue and sends AI responses"""
    
    def __init__(self, redis_client: redis.Redis, max_processing_time: int = 180):
        self.redis = redis_client
        self.max_processing_time = max_processing_time
        self.reply_crew = None
        self._running = False
        
    async def initialize(self):
        """Initialize worker"""
        logger.info("Initializing reply worker...")
        self.reply_crew = create_reply_crew()
        logger.info("Reply worker ready")
        
    async def start(self):
        """Main worker loop"""
        await self.initialize()
        self._running = True
        
        logger.info("Reply worker started")
        
        while self._running:
            try:
                # Block for job
                result = await self.redis.blpop('reply_queue', timeout=5)
                
                if result:
                    _, job_data = result
                    job = json.loads(job_data)
                    await self._process_job(job)
                    
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(1)
    
    async def stop(self):
        """Stop worker"""
        self._running = False
        logger.info("Reply worker stopped")
    
    async def _process_job(self, job: dict):
        """Process a single reply job"""
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Processing reply from {job['reply']['from_email']}")
            
            # Run reply crew with timeout
            result = await asyncio.wait_for(
                self._execute_crew(job),
                timeout=self.max_processing_time
            )
            
            if result and result.get('action') == 'reply':
                # Send the response
                await self._send_reply(job, result)
                
                processing_time = (datetime.utcnow() - start_time).total_seconds()
                logger.info(f"Reply sent in {processing_time:.1f}s")
            else:
                logger.info(f"No reply needed: {result.get('action') if result else 'unknown'}")
            
        except asyncio.TimeoutError:
            logger.error("Reply processing timed out")
        except Exception as e:
            logger.error(f"Job failed: {e}")
    
    async def _execute_crew(self, job: dict) -> Optional[dict]:
        """Execute CrewAI to classify and draft reply"""
        try:
            reply = job['reply']
            lead = job.get('lead', {})
            
            result = await self.reply_crew.kickoff_async({
                'email_content': reply['body'],
                'lead_name': lead.get('name', ''),
                'lead_company': lead.get('company', ''),
                'lead_title': lead.get('title', ''),
                'subject': reply['subject'],
                'from_email': reply['from_email']
            })
            
            # Parse result
            if isinstance(result, dict):
                return result
            elif isinstance(result, str):
                try:
                    return json.loads(result)
                except:
                    return {'action': 'reply', 'draft': result}
            
            return None
            
        except Exception as e:
            logger.error(f"Crew execution error: {e}")
            return None
    
    async def _send_reply(self, job: dict, result: dict):
        """Send email reply"""
        try:
            draft = result.get('draft', '')
            if not draft:
                return
            
            reply = job['reply']
            
            # Build email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Re: {reply['subject']}"
            msg['From'] = 'ai@sales.com'  # Configure this
            msg['To'] = reply['from_email']
            msg['In-Reply-To'] = reply['message_id']
            
            msg.attach(MIMEText(draft, 'plain'))
            
            # Send via SMTP (configure with your SMTP settings)
            await aiosmtplib.send(
                msg,
                hostname="smtp.gmail.com",
                port=587,
                username="your-email@gmail.com",
                password="your-app-password",
                start_tls=True
            )
            
            logger.info(f"Sent reply to {reply['from_email']}")
            
        except Exception as e:
            logger.error(f"Failed to send reply: {e}")
            raise
