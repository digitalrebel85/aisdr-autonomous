import { Lead, LeadProfileData, EngagementEvent } from "../types/aisdr";

export const leads: Lead[] = [
  { id: "l1", name: "Alex Carter", title: "VP Sales", company: "Acme Inc", sentiment: "positive", heat: "hot", email: "alex@acme.com", domain: "acme.com", techStack: ["HubSpot", "Salesforce"], fitScore: 92, intentScore: 88, replyDraft: { subject: "Quick idea on boosting outbound", body: "Hey Alex, noticed the spike in pricing visits…", generating: false } },
  { id: "l2", name: "Jamie Lee", title: "Head of Marketing", company: "BrightLabs", sentiment: "neutral", heat: "warm", email: "jamie@brightlabs.io", domain: "brightlabs.io", techStack: ["Marketo", "Segment"], fitScore: 78, intentScore: 65, replyDraft: { subject: "Thoughts on intent data", body: "Hi Jamie, I pulled a quick insight…", generating: true } },
  { id: "l3", name: "Chris Hall", title: "Founder", company: "NovaWorks", sentiment: "negative", heat: "cold", email: "chris@novaworks.co", domain: "novaworks.co", techStack: ["Webflow", "Zapier"], fitScore: 61, intentScore: 34 },
];

const timelineBase = (leadId: string): EngagementEvent[] => [
  { id: `${leadId}-t1`, ts: new Date(Date.now() - 1000*60*60*24).toISOString(), kind: "visit", detail: "Visited website: /pricing" },
  { id: `${leadId}-t2`, ts: new Date(Date.now() - 1000*60*60*20).toISOString(), kind: "open", detail: "Opened outreach email (2 times)" },
  { id: `${leadId}-t3`, ts: new Date(Date.now() - 1000*60*60*16).toISOString(), kind: "click", detail: "Clicked CTA: Case Study" },
];

export const leadProfiles: Record<string, LeadProfileData> = {
  l1: {
    lead: leads[0],
    enrichment: { company: "Acme Inc", techStack: ["HubSpot", "Salesforce"], linkedin: "https://linkedin.com/in/alex-carter" },
    timeline: [
      ...timelineBase("l1"),
      { id: "l1-t4", ts: new Date(Date.now() - 1000*60*60*2).toISOString(), kind: "reply", detail: "Replied: Interested this quarter." },
    ],
  },
  l2: {
    lead: leads[1],
    enrichment: { company: "BrightLabs", techStack: ["Marketo", "Segment"], linkedin: "https://linkedin.com/in/jamie-lee" },
    timeline: timelineBase("l2"),
  },
  l3: {
    lead: leads[2],
    enrichment: { company: "NovaWorks", techStack: ["Webflow", "Zapier"], linkedin: "https://linkedin.com/in/chris-hall" },
    timeline: timelineBase("l3"),
  },
};
