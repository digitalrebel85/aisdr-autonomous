# Platform Access Configuration

## Apollo.io (Lead Data)
- **API Key:** [Set in .env]
- **Use:** Discover leads, enrich data, find decision makers
- **Rate Limit:** 1000 requests/day on standard plan
- **Endpoint:** https://api.apollo.io/api/v1/

## Gmail API (Email)
- **OAuth 2.0 Flow:** Users connect their own Gmail/Google Workspace
- **Required Scopes:**
  - `https://www.googleapis.com/auth/gmail.send` - Send emails
  - `https://www.googleapis.com/auth/gmail.readonly` - Read emails
  - `https://www.googleapis.com/auth/gmail.modify` - Manage labels/threads
- **Redirect URI:** Configured in Google Cloud Console
- **Rate Limit:** 250 quota units per user per second

### Setting Up Gmail OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Web application type)
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
6. Copy Client ID and Client Secret

## Google Calendar API (Meetings)
- **OAuth:** Same app as Gmail (shared)
- **Scope:** `https://www.googleapis.com/auth/calendar`
- **Use:** Check availability, create events, generate booking links

## Multiple Mailboxes
Users can add unlimited Gmail/Google Workspace accounts:
- Each mailbox has its own OAuth refresh token
- Smart rotation: round-robin or random selection
- Per-mailbox daily limits and health tracking
- Automatic failover if one mailbox hits limits

### Mailbox Management
```json
{
  "mailboxes": [
    {
      "id": "mb_001",
      "email": "user@gmail.com",
      "provider": "gmail",
      "status": "active",
      "daily_limit": 50,
      "sent_today": 12,
      "refresh_token": "...",
      "health_score": 98
    }
  ]
}
```

## Supabase (Database)
- **URL:** [Set in .env]
- **Anon Key:** [Set in .env]
- **Service Key:** [Set in .env]
- **Tables:** leads, campaigns, emails, replies, meetings, mailboxes

## OpenAI/DeepSeek (LLM)
- **API Key:** [Set in .env]
- **Model:** gpt-4o-mini for emails, gpt-4o for research
- **Use:** Email writing, lead scoring, reply analysis

## LinkedIn (Optional)
- **Account:** [Set credentials in .env]
- **Use:** Profile research, connection requests
- **Tool:** LinkedIn automation via browser

## Clay (Enrichment)
- **API Key:** [Optional, for additional enrichment]
- **Use:** Company data, tech stack, intent signals

## Sending Infrastructure
- **Primary:** Gmail API (user's own accounts)
- **Rotation:** Multiple mailboxes for volume
- **Backup:** SendGrid/AWS SES (optional)
- **Warmup:** Built-in gradual ramp for new mailboxes

## Monitoring
- **Dashboard:** Real-time mailbox health at /dashboard
- **Slack:** Webhook for alerts and daily reports
- **Email:** Daily/weekly summaries

## Safety Limits (Per Mailbox)
- Week 1: 10 emails/day (warmup)
- Week 2: 25 emails/day
- Week 3: 50 emails/day
- Established: Up to 200 emails/day per mailbox
- Auto-pause if bounce rate >5%
- Auto-pause if spam rate >0.1%
- Never send outside 9am-5pm recipient local time
