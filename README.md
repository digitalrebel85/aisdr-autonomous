# 🤖 AISDR Autonomous

**Deploy an AI SDR that never sleeps.**

Your own autonomous outbound agent. No human-in-the-loop dashboard. Define the ICP, connect your platforms, and the AI runs discovery, enrichment, emailing, and reply handling — 24/7.

## What Changed

| Old (Human-Driven) | New (Autonomous) |
|-------------------|------------------|
| Upload CSVs manually | AI discovers leads from Apollo automatically |
| Click to send emails | AI sends based on heartbeat schedule |
| Read replies in UI | AI categorizes and responds automatically |
| Manage campaigns via dashboard | AI optimizes based on performance data |
| Human decides next steps | AI decides (with safety guardrails) |

## Architecture

```
┌─────────────────────────────────────────────┐
│           JARVIS SDR ORCHESTRATOR           │
├─────────────────────────────────────────────┤
│  Heartbeat (30 min)  │  Cron (scheduled)    │
│  - Check replies     │  - Morning briefing  │
│  - Process sends     │  - Lead discovery    │
│  - Update dashboard  │  - Evening report    │
└─────────────────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
┌─────────┐    ┌─────────────┐    ┌───────────┐
│  APOLLO │    │   NYLAS     │    │  SUPABASE │
│  Leads  │    │  Email/Cal  │    │   Data    │
└─────────┘    └─────────────┘    └───────────┘
```

## Directory Structure

```
aisdr-autonomous/
├── agent/              # The autonomous orchestrator
│   ├── orchestrator.py # Main Jarvis SDR logic
│   ├── HEARTBEAT.md    # Heartbeat checklist
│   └── AGENT.md        # Agent configuration
├── config/             # Configuration
│   ├── ICP.md          # Ideal Customer Profile
│   └── platforms.md    # Platform access configs
├── campaigns/          # Campaign data
│   └── [campaign-name]/
│       ├── config.json
│       ├── leads.json
│       └── logs/
├── mission-control/    # Monitoring dashboard
│   └── index.html      # Real-time status
├── python-crew-service/# Backend (from original)
│   ├── agents/         # CrewAI agents
│   ├── crew/           # Crew definitions
│   └── main.py         # FastAPI server
└── supabase/           # Database schema
```

## Setup

### 1. Configure Environment

Create `.env` in root:

```bash
# Apollo.io
APOLLO_API_KEY=your_key_here

# Nylas (Email/Calendar)
NYLAS_CLIENT_ID=your_id
NYLAS_CLIENT_SECRET=your_secret
NYLAS_ACCESS_TOKEN=your_token

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# OpenAI
OPENAI_API_KEY=sk-...

# Slack (for alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### 2. Define ICP

Edit `config/ICP.md` with your target:
- Industry
- Company size
- Location
- Pain points
- Decision makers

### 3. Create First Campaign

```bash
mkdir campaigns/agency-outreach-001
cat > campaigns/agency-outreach-001/config.json << 'EOF'
{
  "name": "agency-outreach-001",
  "target": {
    "industry": "Marketing Agency",
    "size": "10-50 employees",
    "location": "UK"
  },
  "sequence": {
    "steps": 4,
    "delays": [0, 3, 7, 12]
  },
  "daily_send_limit": 50,
  "status": "active"
}
EOF
```

### 4. Start the System

```bash
# Install dependencies
cd python-crew-service
pip install -r requirements.txt

# Start the API server
python main.py

# In another terminal, run heartbeat
python agent/orchestrator.py heartbeat

# Or set up cron for scheduled tasks
python agent/orchestrator.py morning    # 8am daily
python agent/orchestrator.py evening    # 6pm daily
```

## How It Works

### Heartbeat (Every 30 min)

Your AI SDR automatically:
1. **Checks replies** - Reads and categorizes all new emails
2. **Processes meetings** - Logs bookings, notifies you immediately
3. **Sends emails** - Queues and sends based on schedule/limits
4. **Discovers leads** - Finds new prospects from Apollo
5. **Updates dashboard** - Refreshes mission control

### Daily Schedule

| Time | Action |
|------|--------|
| 08:00 | Morning briefing to you (Slack/Telegram) |
| 09:00 | Apollo lead discovery (50 new prospects) |
| 10:00 | Lead enrichment batch |
| 11:00 | Email generation |
| 14:00 | Afternoon send batch |
| 17:00 | Reply processing |
| 18:00 | Daily report + memory log |

### Safety Guardrails

- Never exceed daily send limits
- Never contact same person twice
- Never send outside business hours
- Auto-pause if bounce rate >5%
- Auto-pause if spam complaints
- All external actions logged

## Mission Control

Open `mission-control/index.html` in browser for real-time dashboard:

- 📧 Emails sent today
- 💬 Reply rate
- 📅 Meetings booked
- 🤖 Sub-agent status
- 📊 Active campaigns
- 🚨 Alerts and issues

## Sub-Agents

Your AI SDR can spawn parallel workers:

1. **Lead Research Agent** - Deep company research
2. **Email Writer Agent** - Generate personalized copy
3. **Reply Analyzer Agent** - Categorize responses
4. **Meeting Booker Agent** - Calendar coordination
5. **Performance Analyst** - Campaign optimization

## Commands

```bash
# Manual operations
python agent/orchestrator.py heartbeat          # Run heartbeat now
python agent/orchestrator.py discover --count 50 # Discover 50 leads
python agent/orchestrator.py check-replies      # Check for replies
python agent/orchestrator.py morning            # Run morning routine
python agent/orchestrator.py evening            # Run evening routine
python agent/orchestrator.py report             # Generate report

# Campaign specific
python agent/orchestrator.py send --campaign agency-outreach-001
```

## Monitoring

Your AI SDR reports via:
- **Slack** - Real-time alerts and summaries
- **Email** - Daily/weekly reports
- **Mission Control** - Web dashboard
- **Memory files** - Daily logs in `memory/`

## The £500 Path to £1M

1. **Month 1** (£500 spent): Deploy, land 1 agency partner
2. **Month 2-3**: Scale to 5 agency partners
3. **Month 4-6**: Productize, add self-serve tier
4. **Month 7-12**: Scale to 50+ partners, £30k MRR
5. **Year 2**: £1M ARR with AI-native playbook

## vs. Original AISDR

| | Original AISDR | Autonomous AISDR |
|--|----------------|------------------|
| **User** | Human logs in, uploads CSVs, clicks buttons | I run everything automatically |
| **Frontend** | Next.js dashboard | None (mission control only) |
| **Operation** | Reactive (wait for human) | Proactive (heartbeat-driven) |
| **Scale** | 1 human manages 1-2 campaigns | 1 AI manages 10+ campaigns |
| **Cost** | £1-2k/mo SaaS | £500 setup, £200/mo infra |
| **Model** | Sell software | Sell AI employee service |

---

**Ready to deploy?** Configure your ICP and API keys, start the orchestrator, and your AI SDR starts booking meetings.
