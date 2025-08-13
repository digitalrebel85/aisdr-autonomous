import { KPI } from "../types/aisdr";

export const currentActivity = "Scanning for high-intent leads…";

export const kpis: KPI[] = [
  { id: "leads_today", label: "Leads Today", value: 27, delta: 12 },
  { id: "replies", label: "Replies", value: 9, delta: 3 },
  { id: "meetings", label: "Meetings Booked", value: 2, delta: 1 },
  { id: "reply_rate", label: "Reply Rate", value: 18, suffix: "%", delta: 4 },
];
