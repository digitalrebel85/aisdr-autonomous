"""
Fast Reply Worker
Processes replies using CrewAI and sends responses.
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

from models.schemas import EmailReply, LeadContext, ProcessingJob, ProcessingResult, ReplyClassification, EmailDraft
from crew.reply_crew import create_reply_crew

logger = logging.getLogger(__name__)

class FastReplyWorker:
    """Worker that processes email replies with AI and sends responses"""
    
    def __init__(self, 
                 worker_id: str,
                 redis_url: str = "redis://localhost:6379/0",
                 max_processing_time: int = 180):
        self.worker_id = worker_id
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.max_processing_time = max_processing_time
        self.reply_crew = None
        self.smtp_config = {
            'host': 'smtp.gmail.com',
            'port': 587,
            'username': '',
            'password': ''
        }
        self._running = False
        
    async def initialize(self):
        """Initialize worker components"""
        logger.info(f"Worker {self.worker_id} initializing...")
        
        # Initialize CrewAI
        self.reply_crew = create_reply_crew()
        
        # Load SMTP config from environment
        import os
        self.smtp_config['host'] = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_config['port'] = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_config['username'] = os.getenv('SMTP_USER', '')
        self.smtp_config['password'] = os.getenv('SMTP_PASS', '')
        
        logger.info(f"Worker {self.worker_id} ready")
        
    async def start(self):
        """Main worker loop"""
        await self.initialize()
        self._running = True
        
        logger.info(f"Worker {self.worker_id} started")
        
        while self._running:
            try:
                # Block until job available (BLPOP)
                result = await self.redis.blpop('reply_queue', timeout=5)
                
                if result:
                    queue_name, job_data = result
                    job = json.loads(job_data)
                    
                    # Process job
                    await self._process_job(job)
                    
            except Exception as e:
                logger.error(f"Worker {self.worker_id} error: {e}")
                await asyncio.sleep(1)  # Brief pause on error
                
    async def stop(self):
        """Stop the worker"""
        self._running = False
        logger.info(f"Worker {self.worker_id} stopped")
        
    async def _process_job(self, job_data: dict):
        """Process a single reply job"""
        start_time = datetime.utcnow()
        job_id = f"{self.worker_id}-{start_time.timestamp()}"
        
        try:
            logger.info(f"Processing job {job_id}")
            
            # Parse job
            job = ProcessingJob(**job_data)
            
            # Execute AI crew with timeout
            result = await asyncio.wait_for(
                self._execute_crew(job),
                timeout=self.max_processing_time
            )
            
            processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            if result and result.action_required == 'reply':
                # Send the reply
                await self._send_reply(job, result)
                
                logger.info(f"Job {job_id} completed in {processing_time}ms")
            else:
                logger.info(f"Job {job_id} - no reply needed ({result.action_required if result else 'no result'})")
            
            # Store result
            await self._store_result(job_id, job, result, processing_time)
            
        except asyncio.TimeoutError:
            logger.error(f"Job {job_id} timed out after {self.max_processing_time}s")
            await self._handle_timeout(job_data)
            
        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            await self._handle_error(job_data, e)
    
    async def _execute_crew(self, job: ProcessingJob) -> Optional[ReplyClassification]:
        """Execute CrewAI to classify and draft reply"""
        try:
            # Run the reply crew
            result = await self.reply_crew.kickoff_async({
                'email_content': job.reply.body,
                'lead_context': job.lead_context.model_dump() if job.lead_context else {},
                'thread_history': [m.model_dump() for m in job.thread_history],
                'time_budget': '2_minutes'  # Hint for crew to be fast
            })
            
            # Parse result
            if isinstance(result, dict):
                return ReplyClassification(**result)
            elif isinstance(result, str):
                # Try to parse JSON from string
                import re
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group())
                    return ReplyClassification(**data)
            
            return None
            
        except Exception as e:
            logger.error(f"Crew execution error: {e}")
            return None
    
    async def _send_reply(self, job: ProcessingJob, classification: ReplyClassification):
        """Send email reply via SMTP"""
        try:
            if not classification.suggested_response:
                logger.warning("No suggested response to send")
                return
            
            # Build email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"Re: {job.reply.subject}"
            msg['From'] = self.smtp_config['username']
            msg['To'] = job.reply.from_email
            msg['In-Reply-To'] = job.reply.message_id
            msg['References'] = ' '.join(job.reply.references + [job.reply.message_id])
            
            # Add text body
            body = classification.suggested_response
            msg.attach(MIMEText(body, 'plain'))
            
            # Send via SMTP
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_config['host'],
                port=self.smtp_config['port'],
                username=self.smtp_config['username'],
                password=self.smtp_config['password'],
                use_tls=False,  # Gmail uses STARTTLS
                start_tls=True
            )
            
            logger.info(f"Reply sent to {job.reply.from_email}")
            
            # Track sent message
            await self._track_sent_message(job, msg)
            
        except Exception as e:
            logger.error(f"Failed to send reply: {e}")
            raise
    
    async def _track_sent_message(self, job: ProcessingJob, msg: MIMEMultipart):
        """Track sent message for reply correlation"""
        message_id = msg['Message-ID']
        if message_id:
            # Add to Redis set for fast lookup
            await self.redis.sadd('sent_message_ids', message_id)
            # Also store with TTL (7 days)
            await self.redis.setex(f"sent:{message_id}", 604800, job.reply.thread_id)
    
    async def _store_result(self, job_id: str, job: ProcessingJob, 
                           result: Optional[ReplyClassification], processing_time_ms: int):
        """Store processing result"""
        result_data = {
            'job_id': job_id,
            'user_id': job.user_id,
            'lead_email': job.reply.from_email,
            'processed_at': datetime.utcnow().isoformat(),
            'processing_time_ms': processing_time_ms,
            'classification': result.model_dump() if result else None,
            'success': result is not None
        }
        
        # Store in Redis for quick access
        await self.redis.setex(f"result:{job_id}", 86400, json.dumps(result_data))
        
        # Also queue for database storage
        await self.redis.lpush('results_queue', json.dumps(result_data))
    
    async def _handle_timeout(self, job_data: dict):
        """Handle job timeout - queue for human review"""
        logger.warning(f"Job timed out, queuing for human review")
        await self.redis.lpush('human_review_queue', json.dumps({
            **job_data,
            'timeout_at': datetime.utcnow().isoformat(),
            'reason': 'processing_timeout'
        }))
    
    async def _handle_error(self, job_data: dict, error: Exception):
        """Handle job error"""
        logger.error(f"Job error: {error}")
        await self.redis.lpush('failed_jobs_queue', json.dumps({
            **job_data,
            'error_at': datetime.utcnow().isoformat(),
            'error': str(error)
        }))
