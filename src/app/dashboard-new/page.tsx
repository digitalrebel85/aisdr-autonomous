"use client";
import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../../components/aisdr/TopBar";
import KPICards from "../../components/aisdr/KPICards";
import ActivityFeed from "../../components/aisdr/ActivityFeed";
import NextActionCard from "../../components/aisdr/NextActionCard";
import LeadInbox from "../../components/aisdr/LeadInbox";
import LeadProfilePanel from "../../components/aisdr/LeadProfilePanel";
import DailyBriefingModal from "../../components/aisdr/DailyBriefingModal";

import { currentActivity, kpis } from "../../data/kpis";
import { activityFeed } from "../../data/activity";
import { leads as leadList, leadProfiles } from "../../data/leads";
import { Lead, LeadProfileData, NextAction } from "../../types/aisdr";

export default function AISDRDashboardPage() {
  const [showBriefing, setShowBriefing] = useState(true);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>(leadList);

  const selectedProfile: LeadProfileData | undefined = useMemo(() => {
    return selectedLeadId ? leadProfiles[selectedLeadId] : undefined;
  }, [selectedLeadId]);

  const nextAction: NextAction = {
    id: "na1",
    title: "Send tailored follow-ups to hot leads",
    description: "I’ve prepared drafts for Alex (Acme) and Jamie (BrightLabs). Suggest sending now to catch today’s engagement window.",
    ctaLabel: "Do It Now",
    priority: "hot",
  };

  // Placeholder for WebSocket/API real-time updates
  useEffect(() => {
    // const ws = new WebSocket(process.env.NEXT_PUBLIC_ACTIVITY_WS_URL!);
    // ws.onmessage = (msg) => { /* update activity feed and KPIs */ };
    // return () => ws.close();
  }, []);

  const handleApproveSend = (id: string) => {
    // Simulate sending and mark generating=false
    setLeads((prev) => prev.map(l => l.id === id ? ({ ...l, replyDraft: l.replyDraft ? { ...l.replyDraft, generating: false, body: l.replyDraft.body + "\n\n(Sent)" } : l.replyDraft }) : l));
    // In real app, call API to send
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar activity={currentActivity} />
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <KPICards kpis={kpis} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LeadInbox
              leads={leads}
              onSelect={(id)=>setSelectedLeadId(id)}
              onApprove={handleApproveSend}
            />
          </div>
          <div className="space-y-6">
            <NextActionCard action={nextAction} onDoNow={() => alert("Action executed!")} />
            <ActivityFeed items={activityFeed} />
          </div>
        </div>
      </div>

      <LeadProfilePanel open={!!selectedLeadId} data={selectedProfile} onClose={() => setSelectedLeadId(null)} />
      <DailyBriefingModal open={showBriefing} onClose={() => setShowBriefing(false)} />
    </div>
  );
}
