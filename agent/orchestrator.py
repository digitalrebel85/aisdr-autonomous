#!/usr/bin/env python3
"""
Autonomous SDR Orchestrator
Jarvis - The AI SDR That Never Sleeps

This is the main orchestration layer that runs on heartbeat/cron.
It coordinates all SDR activities: lead discovery, enrichment, 
email sending, reply processing, and reporting.
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

# Gmail tools for multi-mailbox OAuth
from tools.gmail_tools import (
    GmailManager,
    send_email_via_gmail,
    check_gmail_replies,
    get_message_details,
    init_gmail_manager
)
from tools.apollo_tools import ApolloClient, init_apollo, discover_leads as apollo_discover
from tools.openai_tools import EmailGenerator, init_email_generator, generate_personalized_email, analyze_email_reply

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/chris/.openclaw/workspace/aisdr-autonomous/logs/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('jarvis-sdr')

@dataclass
class Campaign:
    name: str
    status: str  # active, paused, completed
    target_icp: Dict
    sequence: List[Dict]
    daily_send_limit: int
    leads: List[Dict]
    
@dataclass
class Lead:
    email: str
    first_name: str
    last_name: str
    company: str
    title: str
    linkedin_url: Optional[str]
    source: str
    status: str  # new, contacted, replied, meeting, uninterested
    last_contact: Optional[datetime]
    emails_sent: int
    
class AutonomousSDR:
    """Main orchestrator for autonomous SDR operations."""
    
    def __init__(self, config_path: str = "config"):
        self.config_path = Path(config_path)
        self.campaigns_path = Path("campaigns")
        self.memory_path = Path("/home/chris/.openclaw/memory")
        self.active_campaigns: List[Campaign] = []
        self.daily_stats = {
            'emails_sent': 0,
            'replies_received': 0,
            'meetings_booked': 0,
            'leads_discovered': 0
        }
        self.gmail_manager: Optional[GmailManager] = None
        
        # Load configurations
        self._load_icp()
        self._load_platforms()
        self._load_campaigns()
        
        # Initialize Gmail manager if credentials available
        self._init_gmail()
        
        # Initialize Apollo client
        self._init_apollo()
        
        # Initialize Email generator
        self._init_email_generator()
        
    def _load_icp(self):
        """Load Ideal Customer Profile."""
        icp_file = self.config_path / "ICP.md"
        if icp_file.exists():
            logger.info("ICP loaded from config/ICP.md")
        else:
            logger.warning("No ICP file found")
            
    def _load_platforms(self):
        """Load platform credentials and configs."""
        platforms_file = self.config_path / "platforms.md"
        if platforms_file.exists():
            logger.info("Platform configs loaded")
        else:
            logger.warning("No platforms config found")

    def _init_gmail(self):
        """Initialize Gmail manager if credentials are available."""
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/callback')

        if client_id and client_secret:
            self.gmail_manager = init_gmail_manager(client_id, client_secret, redirect_uri)
            logger.info("Gmail manager initialized")

            # Load any saved mailboxes from config
            self._load_saved_mailboxes()
        else:
            logger.warning("Google OAuth credentials not found. Gmail features disabled.")

    def _init_apollo(self):
        """Initialize Apollo client."""
        api_key = os.getenv('APOLLO_API_KEY')
        if api_key:
            init_apollo(api_key)
            logger.info("Apollo client initialized")
        else:
            logger.warning("Apollo API key not found. Lead discovery disabled.")

    def _init_email_generator(self):
        """Initialize OpenAI email generator."""
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            init_email_generator(api_key)
            logger.info("Email generator initialized")
        else:
            logger.warning("OpenAI API key not found. Email generation disabled.")

    def _load_saved_mailboxes(self):
        """Load previously connected mailboxes from storage."""
        # TODO: Load from Supabase or local JSON
        pass
            
    def _load_campaigns(self):
        """Load active campaigns from campaigns directory."""
        if not self.campaigns_path.exists():
            logger.warning("No campaigns directory found")
            return
            
        for campaign_dir in self.campaigns_path.iterdir():
            if campaign_dir.is_dir():
                config_file = campaign_dir / "config.json"
                if config_file.exists():
                    logger.info(f"Found campaign: {campaign_dir.name}")
                    
    async def discover_leads(self, count: int = 50, icp_config: Optional[Dict] = None) -> List[Lead]:
        """
        Use Apollo.io to discover new leads matching ICP.
        
        Args:
            count: Number of leads to discover
            icp_config: ICP criteria (industry, titles, size, location)
            
        Returns:
            List of new Lead objects
        """
        logger.info(f"Discovering {count} new leads...")
        
        # Default ICP config if not provided
        if not icp_config:
            icp_config = {
                'titles': ['CEO', 'Head of Sales', 'Marketing Director', 'Founder'],
                'industries': [],
                'sizes': ['11-50', '51-200'],
                'locations': ['United Kingdom', 'London']
            }
        
        try:
            apollo_leads = await apollo_discover(
                title_keywords=icp_config.get('titles', ['CEO']),
                industries=icp_config.get('industries', []),
                company_sizes=icp_config.get('sizes', ['11-50']),
                locations=icp_config.get('locations', ['United Kingdom']),
                limit=count
            )
            
            # Convert Apollo leads to our Lead format
            leads = []
            for apollo_lead in apollo_leads:
                lead = Lead(
                    email=apollo_lead.email,
                    first_name=apollo_lead.first_name,
                    last_name=apollo_lead.last_name,
                    company=apollo_lead.company,
                    title=apollo_lead.title,
                    linkedin_url=apollo_lead.linkedin_url,
                    source='apollo',
                    status='new',
                    last_contact=None,
                    emails_sent=0
                )
                leads.append(lead)
                
            logger.info(f"Discovered {len(leads)} leads from Apollo")
            self.daily_stats['leads_discovered'] += len(leads)
            return leads
            
        except Exception as e:
            logger.error(f"Error discovering leads: {e}")
            return []
        
    async def enrich_lead(self, lead: Lead) -> Lead:
        """
        Enrich a lead with additional data from various sources.
        
        Uses:
        - Apollo for company/role data
        - LinkedIn for profile info
        - Company website for context
        """
        logger.info(f"Enriching lead: {lead.email}")
        # TODO: Implement enrichment pipeline
        return lead
        
    async def generate_email(self, lead: Lead, step: int, campaign_config: Optional[Dict] = None) -> Dict:
        """
        Generate personalized email for a lead at specific sequence step.
        
        Uses OpenAI GPT-4 for personalization.
        
        Args:
            lead: The lead to email
            step: Sequence step (1-4)
            campaign_config: Campaign settings including value prop and pain points
            
        Returns:
            Dict with 'subject' and 'body'
        """
        logger.info(f"Generating email for {lead.email}, step {step}")
        
        # Default campaign config
        if not campaign_config:
            campaign_config = {
                'sender_name': 'Chris',
                'sender_company': 'AISDR',
                'value_proposition': 'AI-powered SDR that books meetings 24/7',
                'pain_points': ['SDR turnover', 'Can\'t scale outreach', 'High cost of sales team']
            }
        
        try:
            email_template = await generate_personalized_email(
                lead_first_name=lead.first_name or 'there',
                lead_title=lead.title or 'Executive',
                lead_company=lead.company or 'Company',
                lead_industry='Marketing',  # TODO: Get from ICP config
                sender_name=campaign_config.get('sender_name', 'Chris'),
                sender_company=campaign_config.get('sender_company', 'AISDR'),
                value_proposition=campaign_config.get('value_proposition', 'AI SDR services'),
                pain_points=campaign_config.get('pain_points', ['Scaling outreach']),
                sequence_step=step
            )
            
            return {
                'subject': email_template.subject,
                'body': email_template.body,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error generating email: {e}")
            # Return fallback
            return {
                'subject': f"Quick question, {lead.first_name or 'there'}",
                'body': f"Hi {lead.first_name or 'there'},\n\nI help companies like {lead.company or 'yours'} scale their outreach with AI.\n\nWorth a brief conversation?\n\nBest",
                'success': False,
                'error': str(e)
            }
        
    async def send_email(self, lead: Lead, subject: str, email_body: str) -> bool:
        """
        Send email via Gmail API.
        
        Respects:
        - Daily send limits per mailbox
        - Business hours (recipient timezone)
        - Anti-spam guidelines
        """
        logger.info(f"Sending email to {lead.email}")
        
        result = await send_email_via_gmail(
            to_email=lead.email,
            subject=subject,
            body=email_body
        )
        
        if result.get('success'):
            logger.info(f"Email sent successfully via {result.get('mailbox')}")
            # TODO: Log to Supabase
            # TODO: Update lead status
            return True
        else:
            logger.error(f"Failed to send email: {result.get('error')}")
            return False
        
    async def check_replies(self) -> List[Dict]:
        """
        Check Gmail for new email replies across all connected mailboxes.
        
        Returns:
            List of replies to process
        """
        logger.info("Checking for new replies...")
        
        replies = await check_gmail_replies(since=datetime.now() - timedelta(hours=1))
        
        logger.info(f"Found {len(replies)} new replies")
        
        # TODO: Categorize replies (positive/negative/question/meeting)
        # TODO: Update lead statuses in Supabase
        
        return replies
        
    async def process_reply(self, reply: Dict):
        """
        Process a received reply and take appropriate action.
        
        Actions:
        - Positive/meeting: Notify Chris, book meeting
        - Question: Draft response for approval
        - Negative: Log and mark do-not-contact
        - Out of office: Reschedule
        """
        from_email = reply.get('from', 'Unknown')
        logger.info(f"Processing reply from {from_email}")
        
        try:
            # Analyze the reply using OpenAI
            analysis = await analyze_email_reply(reply.get('body', ''))
            
            category = analysis.get('category', 'unknown')
            confidence = analysis.get('confidence', 0)
            
            logger.info(f"Reply categorized as: {category} (confidence: {confidence}%)")
            
            # Take action based on category
            if category in ['positive', 'meeting']:
                # High intent - notify immediately
                logger.info(f"🎉 MEETING INTENT from {from_email}")
                # TODO: Send notification to user
                # TODO: Create meeting booking link
                # TODO: Mark lead as 'meeting_scheduled'
                
            elif category == 'question':
                # Needs human response
                logger.info(f"❓ Question from {from_email} - needs response")
                # TODO: Queue for user approval
                # TODO: Draft response using AI
                
            elif category == 'not_interested':
                # Mark as do-not-contact
                logger.info(f"❌ Not interested: {from_email}")
                # TODO: Update lead status to 'uninterested'
                
            elif category == 'out_of_office':
                # Reschedule follow-up
                logger.info(f"📅 Out of office: {from_email}")
                # TODO: Reschedule email for when they're back
                
            elif category == 'wrong_person':
                # Try to find right person
                logger.info(f"👤 Wrong person: {from_email}")
                # TODO: Ask for referral
                
            # Update stats
            self.daily_stats['replies_received'] += 1
            
            # TODO: Log to Supabase
            # TODO: Update campaign metrics
            
        except Exception as e:
            logger.error(f"Error processing reply: {e}")
        
    async def run_campaign_step(self, campaign: Campaign):
        """
        Execute one step of a campaign.
        
        For each lead in campaign:
        1. Check if they're due for next email
        2. Generate personalized content
        3. Send (if within limits)
        4. Log and update status
        """
        logger.info(f"Running campaign step: {campaign.name}")
        # TODO: Get leads due for next touch
        # TODO: Generate and send emails
        # TODO: Update campaign state
        
    async def daily_morning_routine(self):
        """
        08:00 daily routine.
        
        - Send morning briefing to Chris
        - Plan day's activities
        - Check for any overnight issues
        """
        logger.info("Running morning routine...")
        # TODO: Generate and send morning briefing
        # TODO: Check system health
        # TODO: Plan today's sends
        
    async def daily_evening_routine(self):
        """
        18:00 daily routine.
        
        - Process all replies
        - Send daily report
        - Log activities to memory
        """
        logger.info("Running evening routine...")
        # TODO: Final reply check
        # TODO: Generate daily report
        # TODO: Log to memory file
        
    async def heartbeat(self):
        """
        Main heartbeat - runs every 30 minutes.
        
        Checks (in priority order):
        1. Replies (always check)
        2. Meeting bookings
        3. Bounces/errors
        4. Send queue
        5. Lead discovery (if time)
        """
        logger.info("💓 Heartbeat triggered")
        
        # Priority 1: Always check replies
        replies = await self.check_replies()
        for reply in replies:
            await self.process_reply(reply)
            
        # Priority 2: Process send queue
        for campaign in self.active_campaigns:
            if campaign.status == "active":
                await self.run_campaign_step(campaign)
                
        # Priority 3: Update mission control
        await self.update_mission_control()
        
        logger.info("💓 Heartbeat complete")
        
    async def update_mission_control(self):
        """Update the mission control dashboard with latest stats."""
        logger.info("Updating mission control...")
        # TODO: Write stats to JSON
        # TODO: Refresh dashboard data
        
    async def spawn_sub_agent(self, task: str, data: Dict) -> str:
        """
        Spawn a sub-agent to handle a specific task in parallel.
        
        Sub-agents:
        - Lead Research Agent
        - Email Writer Agent
        - Reply Analyzer Agent
        - Meeting Booker Agent
        """
        logger.info(f"Spawning sub-agent for: {task}")
        # TODO: Implement sub-agent spawning
        # TODO: Return job ID for tracking
        return ""
        
    async def generate_report(self, period: str = "daily") -> str:
        """
        Generate performance report.
        
        Periods: daily, weekly, monthly
        """
        logger.info(f"Generating {period} report...")
        # TODO: Aggregate metrics
        # TODO: Format as markdown
        # TODO: Include insights and recommendations
        return ""

# CLI Interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Jarvis SDR - Autonomous SDR Agent")
    parser.add_argument("command", choices=[
        "heartbeat", "discover", "enrich", "send", 
        "check-replies", "morning", "evening", "report"
    ])
    parser.add_argument("--campaign", help="Campaign name")
    parser.add_argument("--count", type=int, default=50, help="Number of leads")
    
    args = parser.parse_args()
    
    sdr = AutonomousSDR()
    
    if args.command == "heartbeat":
        asyncio.run(sdr.heartbeat())
    elif args.command == "discover":
        leads = asyncio.run(sdr.discover_leads(args.count))
        print(f"Discovered {len(leads)} leads")
    elif args.command == "check-replies":
        replies = asyncio.run(sdr.check_replies())
        print(f"Found {len(replies)} replies")
    elif args.command == "morning":
        asyncio.run(sdr.daily_morning_routine())
    elif args.command == "evening":
        asyncio.run(sdr.daily_evening_routine())
    elif args.command == "report":
        report = asyncio.run(sdr.generate_report())
        print(report)
