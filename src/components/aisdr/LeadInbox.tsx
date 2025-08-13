"use client";
import React from "react";
import { Lead } from "../../types/aisdr";

const heatColor: Record<Lead["heat"], string> = {
  hot: "bg-green-100 text-green-700",
  warm: "bg-yellow-100 text-yellow-700",
  cold: "bg-gray-100 text-gray-600",
};

const sentimentColor: Record<Lead["sentiment"], string> = {
  positive: "bg-green-50 text-green-700 border border-green-200",
  neutral: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  negative: "bg-red-50 text-red-700 border border-red-200",
};

export default function LeadInbox({ leads, onSelect, onApprove }:{ leads: Lead[]; onSelect: (id: string)=>void; onApprove: (id: string)=>void }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="text-lg font-semibold">Prioritized Lead Inbox</div>
        <div className="text-sm text-gray-500">Green = Hot, Yellow = Warm, Gray = Cold</div>
      </div>
      <ul className="divide-y">
        {leads.map((l) => (
          <li key={l.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start gap-4">
              <button onClick={()=>onSelect(l.id)} className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-full text-xs ${heatColor[l.heat]}`}>{l.heat.toUpperCase()}</div>
                  <div className={`px-2 py-0.5 rounded-full text-xs ${sentimentColor[l.sentiment]}`}>{l.sentiment.toUpperCase()}</div>
                </div>
                <div className="mt-1 font-medium text-gray-900">{l.name} · {l.title} @ {l.company}</div>
                {l.replyDraft ? (
                  <div className="mt-2 text-sm text-gray-700">
                    <div className="font-medium mb-1">AI-suggested reply:</div>
                    <div className="text-gray-900">{l.replyDraft.subject}</div>
                    <div className="text-gray-600 line-clamp-2">
                      {l.replyDraft.generating ? (
                        <span className="inline-flex items-center gap-2">Generating <span className="inline-flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce [animation-delay:150ms]">.</span><span className="animate-bounce [animation-delay:300ms]">.</span></span></span>
                      ) : l.replyDraft.body}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">No draft yet.</div>
                )}
              </button>
              <div>
                <button onClick={()=>onApprove(l.id)} className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg text-sm hover:opacity-95">Approve & Send</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
