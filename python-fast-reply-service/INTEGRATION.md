# Integration Guide: Fast Reply Service

## Overview

This document explains how `python-fast-reply-service` integrates with the existing AISDR architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AISDR Platform                              │
├──────────────────────────┬──────────────────────────────────────────┤
│  python-crew-service     │  python-fast-reply-service               │
│  (Campaign Management)   │  (Real-time Reply Handling)              │
├──────────────────────────┼──────────────────────────────────────────┤
│  • Lead enrichment       │  • Reply detection (Gmail/Outlook/IMAP)  │
│  • Sequence generation   │  • Real-time classification              │
│  • Campaign orchestration│  • AI response drafting                  │
│  • Analytics             │  • Immediate SMTP send                   │
└──────────────────────────┴──────────────────────────────────────────┘
           │                            │
           └────────────┬───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │    Supabase      │
              │  (Shared DB)     │
              └──────────────────┘
```

## Data Flow

### 1. Campaign Sends (from python-crew-service)

When `python-crew-service` sends an email:

```python
# Store in Supabase
supabase.table('sent_emails').insert({
    'user_id': user_id,
    'lead_id': lead_id,
    'message_id': 'message-id-header@domain.com',
    'thread_id': thread_id,
    'subject': subject,
    'body': body,
    'sent_at': datetime.utcnow().isoformat()
})

# Also cache in Redis for fast lookup
redis.sadd('sent_message_ids', 'message-id-header@domain.com')
```

### 2. Reply Detection (python-fast-reply-service)

When a reply arrives:

```python
# 1. Detect via Gmail Pub/Sub, Outlook Graph, or IMAP polling
# 2. Check if reply matches sent message (In-Reply-To header)
# 3. Queue for processing

job = {
    'user_id': user_id,
    'reply': {...},
    'lead_context': {...},  # Fetched from Supabase
    'thread_history': [...]  # Previous messages
}
redis.lpush('reply_queue', json.dumps(job))
```

### 3. AI Processing

CrewAI agents:
1. **Analyzer Agent** — Classifies sentiment, intent, urgency
2. **Drafter Agent** — Writes personalized response

### 4. Response Send

```python
# Send via SMTP
aiosmtplib.send(...)

# Log to Supabase
supabase.table('sent_emails').insert({
    'user_id': user_id,
    'lead_id': lead_id,
    'in_reply_to': original_message_id,
    'is_ai_response': True,
    ...
})
```

## Shared Tables

### sent_emails

Tracks all outbound emails for reply correlation:

```sql
CREATE TABLE sent_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    lead_id uuid REFERENCES leads(id),
    campaign_id uuid REFERENCES campaigns(id),
    message_id TEXT UNIQUE,  -- Email Message-ID header
    thread_id TEXT,
    subject TEXT,
    body TEXT,
    is_ai_response BOOLEAN DEFAULT FALSE,
    in_reply_to TEXT,  -- If this is a reply
    sent_at TIMESTAMP DEFAULT NOW(),
    angle_id uuid REFERENCES icp_angles(id)
);

CREATE INDEX idx_sent_emails_message_id ON sent_emails(message_id);
CREATE INDEX idx_sent_emails_thread ON sent_emails(thread_id);
```

### email_replies

Stores incoming replies:

```sql
CREATE TABLE email_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    lead_id uuid REFERENCES leads(id),
    original_message_id TEXT,  -- References sent_emails.message_id
    from_email TEXT,
    subject TEXT,
    body TEXT,
    received_at TIMESTAMP DEFAULT NOW(),
    classification TEXT,  -- 'positive', 'question', 'objection', etc.
    ai_response_sent BOOLEAN DEFAULT FALSE,
    ai_response_id uuid REFERENCES sent_emails(id)
);
```

### leads (extended)

Add field for reply handling:

```sql
ALTER TABLE leads ADD COLUMN reply_handling_mode TEXT DEFAULT 'ai';
-- 'ai', 'human', 'hybrid'
```

## Configuration

### Environment Variables (python-crew-service)

Add to `.env`:

```bash
# Tell crew service about fast-reply service
FAST_REPLY_SERVICE_URL=http://localhost:8001
ENABLE_AI_REPLIES=true
```

### Environment Variables (python-fast-reply-service)

```bash
# Connect to same Supabase
SUPABASE_URL=same_as_crew_service
SUPABASE_SERVICE_KEY=same_as_crew_service

# Redis for queue
REDIS_URL=redis://localhost:6379/0

# SMTP for sending
SMTP_HOST=smtp.gmail.com
SMTP_USER=ai@yourdomain.com
SMTP_PASS=app_password
```

## API Integration

### Register User for Reply Detection

When a user connects their email in the main app:

```javascript
// From frontend/backend
await fetch('http://fast-reply:8001/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_id: user.id,
        credentials: {
            email: user.email,
            password: encryptedPassword,  // Or app-specific password
            imap_server: 'imap.gmail.com',
            // For Gmail OAuth:
            google_credentials: {...},
            google_project_id: '...'
        }
    })
});
```

### Webhook Setup

For Gmail/Outlook users, configure webhooks to point to fast-reply service:

```javascript
// Gmail Pub/Sub push endpoint
const webhookUrl = 'https://your-domain.com/webhook/gmail';

// Outlook Graph webhook
const webhookUrl = 'https://your-domain.com/webhook/outlook';
```

## Deployment Options

### Option 1: Same Docker Network

```yaml
# docker-compose.yml (root of aisdr-autonomous)
version: '3.8'

services:
  # Existing services
  crew-service:
    build: ./python-crew-service
    ...
  
  # New fast-reply service
  fast-reply:
    build: ./python-fast-reply-service
    ports:
      - "8001:8001"
    environment:
      - REDIS_URL=redis://redis:6379/0
      - SUPABASE_URL=${SUPABASE_URL}
    depends_on:
      - redis
      - supabase
  
  redis:
    image: redis:7-alpine
    
  # ... other services
```

### Option 2: Separate Deployment

Deploy `python-fast-reply-service` independently:

```bash
cd python-fast-reply-service
docker-compose up -d
```

Configure `python-crew-service` to use external URL:

```bash
FAST_REPLY_SERVICE_URL=https://fast-reply.yourdomain.com
```

## Monitoring

### Key Metrics

Track in your monitoring system:

| Metric | Target | Alert If |
|--------|--------|----------|
| Detection latency | <15s | >30s |
| Processing time | <2min | >4min |
| Queue depth | <10 | >50 |
| Reply send success | >95% | <90% |

### Redis Commands for Debugging

```bash
# Check queue depth
redis-cli LLEN reply_queue

# See recent jobs
redis-cli LRANGE reply_queue 0 10

# Check active workers
redis-cli KEYS "worker:*"
```

## Troubleshooting

### Replies not being detected

1. Check `sent_emails` has `message_id` populated
2. Verify Redis has `sent_message_ids` set
3. Check IMAP credentials for polling users
4. Verify webhooks are receiving push notifications

### AI responses not sending

1. Check SMTP credentials
2. Verify `reply_queue` is being processed
3. Check worker logs: `docker logs fast-reply-worker-1`
4. Verify CrewAI is returning valid responses

### Duplicate responses

1. Ensure `email_replies` has unique constraint on `original_message_id`
2. Check idempotency in worker processing
3. Verify Redis job acknowledgment

## Migration Path

To add fast-reply to existing AISDR deployment:

1. Deploy Redis (if not already present)
2. Run migration: `supabase/migrations/005_add_reply_tables.sql`
3. Deploy `python-fast-reply-service`
4. Update `python-crew-service` to populate `message_id` on sends
5. Register existing users for reply detection
6. Monitor and tune

## Questions?

See `README.md` in `python-fast-reply-service/` for service-specific docs.
