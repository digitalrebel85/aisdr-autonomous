"""
Gmail API Tools for Autonomous SDR

Handles OAuth authentication and Gmail API operations.
Supports multiple mailboxes via OAuth refresh tokens.
"""

import os
import base64
import json
from email.mime.text import MIMEText
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# Google API libraries
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import Flow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False
    print("Warning: Google API libraries not installed. Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")

# Gmail API scopes
GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
]

CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar'

class GmailManager:
    """Manages multiple Gmail accounts via OAuth."""
    
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.mailboxes: Dict[str, Dict] = {}
        
    def get_auth_url(self) -> str:
        """Generate OAuth URL for user to connect their Gmail."""
        if not GOOGLE_LIBS_AVAILABLE:
            raise ImportError("Google API libraries not installed")
            
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=GMAIL_SCOPES + [CALENDAR_SCOPE],
            redirect_uri=self.redirect_uri
        )
        
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force to get refresh token
        )
        
        return auth_url
        
    def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange OAuth code for refresh token."""
        if not GOOGLE_LIBS_AVAILABLE:
            raise ImportError("Google API libraries not installed")
            
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=GMAIL_SCOPES + [CALENDAR_SCOPE],
            redirect_uri=self.redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Get user info
        service = build('gmail', 'v1', credentials=credentials)
        profile = service.users().getProfile(userId='me').execute()
        
        return {
            'email': profile['emailAddress'],
            'refresh_token': credentials.refresh_token,
            'access_token': credentials.token,
            'expires_at': (datetime.now() + timedelta(seconds=credentials.expiry.second if credentials.expiry else 3600)).isoformat()
        }
        
    def add_mailbox(self, mailbox_id: str, email: str, refresh_token: str, 
                    daily_limit: int = 50, warmup_week: int = 1):
        """Add a mailbox to the rotation."""
        self.mailboxes[mailbox_id] = {
            'id': mailbox_id,
            'email': email,
            'refresh_token': refresh_token,
            'daily_limit': daily_limit,
            'sent_today': 0,
            'status': 'active',
            'health_score': 100,
            'warmup_week': warmup_week
        }
        
    def _get_credentials(self, refresh_token: str) -> Credentials:
        """Get fresh credentials from refresh token."""
        return Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=GMAIL_SCOPES
        )
        
    async def send_email(self, to_email: str, subject: str, body: str, 
                        mailbox_id: Optional[str] = None) -> Dict:
        """
        Send email via Gmail API.
        
        Args:
            to_email: Recipient email
            subject: Email subject
            body: HTML or plain text body
            mailbox_id: Specific mailbox to use, or None for auto-selection
            
        Returns:
            Dict with message_id, thread_id, status
        """
        if not GOOGLE_LIBS_AVAILABLE:
            return {'error': 'Google API libraries not installed'}
            
        # Select mailbox
        if mailbox_id and mailbox_id in self.mailboxes:
            mailbox = self.mailboxes[mailbox_id]
        else:
            # Auto-select: find mailbox with capacity
            mailbox = self._select_mailbox()
            
        if not mailbox:
            return {'error': 'No available mailboxes'}
            
        if mailbox['sent_today'] >= mailbox['daily_limit']:
            return {'error': f"Mailbox {mailbox['email']} has hit daily limit"}
            
        try:
            # Build Gmail service
            creds = self._get_credentials(mailbox['refresh_token'])
            service = build('gmail', 'v1', credentials=creds)
            
            # Create message
            message = MIMEText(body, 'html' if '<html>' in body else 'plain')
            message['to'] = to_email
            message['subject'] = subject
            message['from'] = mailbox['email']
            
            # Encode and send
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': encoded_message}
            
            send_result = service.users().messages().send(
                userId='me', 
                body=create_message
            ).execute()
            
            # Update mailbox stats
            mailbox['sent_today'] += 1
            
            return {
                'success': True,
                'message_id': send_result['id'],
                'thread_id': send_result.get('threadId'),
                'mailbox': mailbox['email'],
                'sent_at': datetime.now().isoformat()
            }
            
        except HttpError as e:
            error_details = e.error_details if hasattr(e, 'error_details') else str(e)
            return {'error': f'Gmail API error: {error_details}'}
        except Exception as e:
            return {'error': f'Failed to send: {str(e)}'}
            
    def _select_mailbox(self) -> Optional[Dict]:
        """Select best mailbox for sending (round-robin or least used)."""
        active_mailboxes = [
            m for m in self.mailboxes.values() 
            if m['status'] == 'active' and m['sent_today'] < m['daily_limit']
        ]
        
        if not active_mailboxes:
            return None
            
        # Simple round-robin: pick mailbox with most remaining capacity
        return min(active_mailboxes, key=lambda m: m['sent_today'])
        
    async def check_replies(self, since: Optional[datetime] = None) -> List[Dict]:
        """
        Check for new replies across all mailboxes.
        
        Args:
            since: Only check for replies since this datetime
            
        Returns:
            List of reply dicts with from, subject, body, timestamp
        """
        if not GOOGLE_LIBS_AVAILABLE:
            return []
            
        if since is None:
            since = datetime.now() - timedelta(hours=1)  # Last hour by default
            
        replies = []
        
        for mailbox_id, mailbox in self.mailboxes.items():
            if mailbox['status'] != 'active':
                continue
                
            try:
                creds = self._get_credentials(mailbox['refresh_token'])
                service = build('gmail', 'v1', credentials=creds)
                
                # Search for unread messages in inbox
                query = f'in:inbox is:unread after:{since.strftime("%Y/%m/%d")}'
                results = service.users().messages().list(
                    userId='me', 
                    q=query,
                    maxResults=50
                ).execute()
                
                messages = results.get('messages', [])
                
                for msg in messages:
                    # Get full message details
                    message = service.users().messages().get(
                        userId='me', 
                        id=msg['id'],
                        format='full'
                    ).execute()
                    
                    # Extract headers
                    headers = {h['name']: h['value'] for h in message['payload']['headers']}
                    
                    # Check if it's a reply (has Re: or references thread)
                    subject = headers.get('Subject', '')
                    if not subject.startswith('Re:'):
                        # Might be a new message, not a reply
                        # Check if it's in a thread we started
                        thread_id = message.get('threadId')
                        # TODO: Check if this thread was started by us
                        
                    # Extract body
                    body = ''
                    if 'parts' in message['payload']:
                        for part in message['payload']['parts']:
                            if part['mimeType'] == 'text/plain':
                                body = base64.urlsafe_b64decode(
                                    part['body']['data']
                                ).decode('utf-8')
                                break
                            elif part['mimeType'] == 'text/html':
                                body = base64.urlsafe_b64decode(
                                    part['body']['data']
                                ).decode('utf-8')
                                break
                    elif 'body' in message['payload'] and 'data' in message['payload']['body']:
                        body = base64.urlsafe_b64decode(
                            message['payload']['body']['data']
                        ).decode('utf-8')
                        
                    # Mark as read
                    service.users().messages().modify(
                        userId='me',
                        id=msg['id'],
                        body={'removeLabelIds': ['UNREAD']}
                    ).execute()
                    
                    replies.append({
                        'message_id': msg['id'],
                        'thread_id': message.get('threadId'),
                        'from': headers.get('From'),
                        'to': headers.get('To'),
                        'subject': subject,
                        'body': body[:1000],  # Truncate long bodies
                        'received_at': datetime.fromtimestamp(
                            int(message['internalDate']) / 1000
                        ).isoformat(),
                        'mailbox': mailbox['email'],
                        'mailbox_id': mailbox_id
                    })
                    
            except Exception as e:
                print(f"Error checking replies for {mailbox['email']}: {e}")
                continue
                
        return replies
        
    async def get_message_details(self, message_id: str, mailbox_id: str) -> Dict:
        """Get full details of a specific message."""
        if mailbox_id not in self.mailboxes:
            return {'error': 'Mailbox not found'}
            
        mailbox = self.mailboxes[mailbox_id]
        
        try:
            creds = self._get_credentials(mailbox['refresh_token'])
            service = build('gmail', 'v1', credentials=creds)
            
            message = service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            return {
                'success': True,
                'message': message
            }
            
        except Exception as e:
            return {'error': str(e)}
            
    def reset_daily_counts(self):
        """Reset sent_today counter for all mailboxes (call at midnight)."""
        for mailbox in self.mailboxes.values():
            mailbox['sent_today'] = 0
            
    def get_mailbox_health(self, mailbox_id: str) -> Dict:
        """Get health metrics for a mailbox."""
        if mailbox_id not in self.mailboxes:
            return {'error': 'Mailbox not found'}
            
        mailbox = self.mailboxes[mailbox_id]
        
        return {
            'email': mailbox['email'],
            'status': mailbox['status'],
            'sent_today': mailbox['sent_today'],
            'daily_limit': mailbox['daily_limit'],
            'remaining': mailbox['daily_limit'] - mailbox['sent_today'],
            'health_score': mailbox['health_score'],
            'warmup_week': mailbox['warmup_week']
        }

# Convenience functions for orchestrator
_gmail_manager: Optional[GmailManager] = None

def init_gmail_manager(client_id: str, client_secret: str, redirect_uri: str):
    """Initialize the global Gmail manager."""
    global _gmail_manager
    _gmail_manager = GmailManager(client_id, client_secret, redirect_uri)
    return _gmail_manager

def get_gmail_manager() -> Optional[GmailManager]:
    """Get the global Gmail manager instance."""
    return _gmail_manager

async def send_email_via_gmail(to_email: str, subject: str, body: str, 
                               mailbox_id: Optional[str] = None) -> Dict:
    """Send email via Gmail API."""
    if not _gmail_manager:
        return {'error': 'Gmail manager not initialized'}
    return await _gmail_manager.send_email(to_email, subject, body, mailbox_id)

async def check_gmail_replies(since: Optional[datetime] = None) -> List[Dict]:
    """Check for replies across all connected mailboxes."""
    if not _gmail_manager:
        return []
    return await _gmail_manager.check_replies(since)

async def get_message_details(message_id: str, mailbox_id: str) -> Dict:
    """Get message details."""
    if not _gmail_manager:
        return {'error': 'Gmail manager not initialized'}
    return await _gmail_manager.get_message_details(message_id, mailbox_id)
