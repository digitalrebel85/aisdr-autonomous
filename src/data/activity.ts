import { ActivityItem } from "../types/aisdr";

export const activityFeed: ActivityItem[] = [
  { id: "a1", timestamp: new Date().toISOString(), type: "followup", icon: "✅", message: "Sent 5 follow-ups to warm leads." },
  { id: "a2", timestamp: new Date(Date.now() - 5*60*1000).toISOString(), type: "intent", icon: "💡", message: "Detected intent surge from Acme's pricing page traffic." },
  { id: "a3", timestamp: new Date(Date.now() - 15*60*1000).toISOString(), type: "meeting", icon: "📅", message: "Booked a 30-min intro with TechCorp (Tue 2pm)." },
  { id: "a4", timestamp: new Date(Date.now() - 35*60*1000).toISOString(), type: "email", icon: "✉️", message: "Drafted 3 personalized replies for hot leads." },
];
