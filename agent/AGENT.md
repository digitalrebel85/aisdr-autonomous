# Autonomous SDR Agent - Jarvis

## Core Loop

```
Every 30 minutes (heartbeat):
├── Check for new email replies
├── Check for booked meetings  
├── Process any bounced/invalid emails
├── Review campaign performance
├── Generate and send new emails (if within limits)
└── Update mission control dashboard
```

## Daily Schedule (Cron)

```
08:00 - Morning briefing to Chris
        (yesterday's stats, today's plan, any issues)

09:00 - Apollo lead discovery
        (find 50 new prospects matching ICP)

10:00 - Lead enrichment batch
        (enrich discovered leads with company data)

11:00 - Email generation batch  
        (write personalized emails for today's sends)

14:00 - Afternoon send batch
        (send emails respecting time zones)

17:00 - Reply processing
        (categorize replies, update lead status)

18:00 - Daily report
        (emails sent, replies received, meetings booked)
```

## Weekly Schedule

```
Monday 09:00 - Competitor research
               (what other agencies are pitching)

Wednesday 14:00 - Campaign optimization
                  (A/B test analysis, sequence tweaks)

Friday 17:00 - Weekly report to Chris
               (full funnel metrics, learnings, next week plan)
```

## Sub-Agent Tasks

When I spawn workers for parallel processing:

1. **Lead Research Agent** - Deep dive on specific companies
2. **Email Writer Agent** - Generate personalized copy  
3. **Reply Analyzer Agent** - Categorize responses (positive/negative/meeting)
4. **Meeting Booker Agent** - Handle calendar coordination
5. **Performance Analyst Agent** - Analyze campaign data

## Decision Rules

### Send Email?
- YES if: Lead matches ICP, not contacted before, within send limits
- NO if: Bounced before, unsubscribed, replied already, outside hours

### Reply Handling
- **Positive/Meeting interest** → Log to meetings table, notify Chris immediately
- **Question** → Draft response, queue for Chris approval
- **Not interested** → Log, move to nurture list
- **Hard no** → Log, mark do-not-contact
- **Out of office** → Reschedule follow-up

### Campaign Adjustments
- If open rate <20% → Rewrite subject lines
- If reply rate <5% → Rewrite email body
- If meeting rate <2% → Adjust targeting/ICP
- If bounce rate >5% → Pause, review data quality

## Safety Guardrails

### Never Do
- Send more than daily limits
- Contact same person twice
- Send outside business hours
- Use aggressive/pushy language
- Make promises I can't keep

### Always Do  
- Log every action to Supabase
- Update mission control in real-time
- Report issues to Chris immediately
- Maintain email reputation
- Respect unsubscribe requests

## Learning Loop

After every 100 emails sent:
1. Analyze what worked (high reply rate patterns)
2. Analyze what didn't (ignored emails)
3. Update email templates based on learnings
4. Document insights in memory

## Mission Control

Real-time dashboard showing:
- Emails sent today/this week/this month
- Reply rate, meeting rate, pipeline value
- Active campaigns and their status
- Sub-agent activity
- Issues/alerts
- Next scheduled actions
