# Platform Access Configuration

## Apollo.io (Lead Data)
- **API Key:** [Set in .env]
- **Use:** Discover leads, enrich data, find decision makers
- **Rate Limit:** 1000 requests/day on standard plan
- **Endpoint:** https://api.apollo.io/api/v1/

## Nylas (Email/Calendar)
- **Client ID:** [Set in .env]
- **Client Secret:** [Set in .env]
- **Use:** Send emails, read replies, book meetings
- **Webhook:** [Set for real-time reply detection]

## Supabase (Database)
- **URL:** [Set in .env]
- **Anon Key:** [Set in .env]
- **Service Key:** [Set in .env]
- **Tables:** leads, campaigns, emails, replies, meetings

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
- **Primary:** Nylas (connected to Google Workspace)
- **Backup:** SendGrid/AWS SES for volume
- **Domain:** [Set in .env - dedicated sending domain]
- **Warmup:** Instantly or Lemwarm for new domains

## Monitoring
- **Slack:** Webhook for alerts and daily reports
- **Telegram:** Direct updates to Chris
- **Mission Control:** Local dashboard at /mission-control

## Safety Limits
- Max 50 emails/day per sending account (warmup phase)
- Max 200 emails/day per account (established)
- Auto-pause if bounce rate >5%
- Auto-pause if spam complaint rate >0.1%
- Never send outside 8am-6pm recipient local time
