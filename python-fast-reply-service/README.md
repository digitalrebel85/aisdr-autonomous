# Fast Reply Service

**Real-time email reply detection with <5 minute AI response time**

This is a standalone microservice that integrates with the main AISDR `python-crew-service`. It handles real-time detection of email replies and triggers AI responses within 5 minutes.

## Integration with Main Service

This service works alongside `python-crew-service`:

- `python-crew-service`: Campaign creation, lead enrichment, sequence generation
- `python-fast-reply-service`: Real-time reply detection and immediate AI response

## Quick Start

```bash
cd python-fast-reply-service
cp .env.example .env
# Edit .env with your credentials
docker-compose up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Detection Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Gmail Pub/Sub  │ Outlook Graph   │  IMAP (15s poll)        │
│  ~1-5s latency  │  ~1-5s latency  │  ~15s latency           │
└────────┬────────┴────────┬────────┴──────────────┬──────────┘
         │                 │                       │
         └─────────────────┴───────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Redis Job Queue    │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Worker Pool       │
                    │  (Reply Crews)      │
                    │  Auto-scaled        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Direct SMTP/API    │
                    └─────────────────────┘
```

## Timing Breakdown

| Stage | Gmail/Outlook | IMAP |
|-------|---------------|------|
| Detection | ~1-5s | ~7.5s |
| Queue pickup | ~0.1s | ~0.1s |
| CrewAI processing | ~30-90s | ~30-90s |
| SMTP send | ~2s | ~2s |
| **Total** | **~33-97s** | **~40-97s** |

✅ Well under 5 minute target

## Environment Variables

```bash
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# LLM API Keys
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key

# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

## Database Schema

Requires Supabase tables:
- `sent_emails` — track sent emails for reply correlation
- `email_replies` — store incoming replies
- `leads` — lead context for personalization

## API Endpoints

- `POST /register` — Register a user for reply detection
- `POST /webhook/gmail` — Gmail Pub/Sub webhook
- `POST /webhook/outlook` — Microsoft Graph webhook
- `GET /health` — Health check

## Deployment

```bash
# Start all services
docker-compose up -d

# Scale workers manually
docker-compose up -d --scale reply-worker=5
```

## See Also

- Main service: `../python-crew-service/`
- Shared Supabase: `../supabase/`
