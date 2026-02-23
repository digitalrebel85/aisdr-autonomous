# Campaigns Directory

Each campaign is a folder containing:

```
campaigns/
├── campaign-name/
│   ├── config.json       # Target ICP, sequence settings
│   ├── leads.csv         # Target list
│   ├── sequence.md       # Email sequence copy
│   ├── performance.json  # Real-time metrics
│   └── logs/             # Daily activity logs
```

## Active Campaigns

### agency-outreach-001
**Target:** UK marketing agencies, 10-50 employees
**Angle:** White-label AI SDR service
**Status:** [Not started]

### agency-outreach-002
**Target:** US demand gen agencies
**Angle:** Overflow capacity offering
**Status:** [Not started]

## Campaign Config Template

```json
{
  "name": "campaign-name",
  "target": {
    "industry": "Marketing Agency",
    "size": "10-50 employees",
    "location": "UK",
    "services": ["B2B SaaS", "Demand Gen"]
  },
  "sequence": {
    "steps": 4,
    "delay_days": [0, 3, 7, 12],
    "personalization": true
  },
  "limits": {
    "daily_send_max": 50,
    "total_leads": 500
  },
  "status": "active|paused|completed"
}
```
