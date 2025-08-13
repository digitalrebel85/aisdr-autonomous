// Shared type definitions for AISDR Agent Dashboard

export type Sentiment = 'positive' | 'neutral' | 'negative';
export type LeadHeat = 'hot' | 'warm' | 'cold';

export interface KPI {
  id: string;
  label: string;
  value: number;
  delta?: number; // positive/negative change vs previous period
  suffix?: string; // e.g., '%'
}

export interface ActivityItem {
  id: string;
  timestamp: string; // ISO
  type: 'email' | 'followup' | 'intent' | 'meeting' | 'research' | 'system';
  message: string;
  icon?: string; // emoji like ✅ 💡 📅 etc.
}

export interface NextAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  priority: LeadHeat;
}

export interface LeadReplyDraft {
  subject: string;
  body: string;
  generating?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  sentiment: Sentiment;
  heat: LeadHeat;
  email?: string;
  phone?: string;
  domain?: string;
  techStack?: string[];
  fitScore?: number; // 0-100
  intentScore?: number; // 0-100
  lastActivityAt?: string; // ISO
  replyDraft?: LeadReplyDraft;
}

export interface EngagementEvent {
  id: string;
  ts: string; // ISO
  kind: 'visit' | 'open' | 'click' | 'reply' | 'call' | 'meeting';
  detail: string;
}

export interface LeadProfileData {
  lead: Lead;
  enrichment?: {
    company?: string;
    techStack?: string[];
    linkedin?: string;
  };
  timeline: EngagementEvent[];
}
