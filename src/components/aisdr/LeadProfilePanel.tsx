"use client";
import React from "react";
import { LeadProfileData } from "../../types/aisdr";

export default function LeadProfilePanel({ open, data, onClose }: { open: boolean; data?: LeadProfileData; onClose: ()=>void }) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">Lead Profile</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Close</button>
        </div>
        {data ? (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-xl font-semibold">{data.lead.name}</div>
              <div className="text-gray-600">{data.lead.title} @ {data.lead.company}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Fit Score</div>
                <div className="text-lg font-semibold">{data.lead.fitScore ?? '--'}%</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Intent Score</div>
                <div className="text-lg font-semibold">{data.lead.intentScore ?? '--'}%</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Enrichment</div>
              <div className="text-sm text-gray-700">Company: {data.enrichment?.company ?? '—'}</div>
              <div className="text-sm text-gray-700">Tech Stack: {(data.enrichment?.techStack ?? []).join(', ') || '—'}</div>
              {data.enrichment?.linkedin && (
                <a className="text-sm text-blue-600 hover:underline" href={data.enrichment.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              )}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Engagement Timeline</div>
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {data.timeline.map(ev => (
                  <li key={ev.id} className="text-sm text-gray-700">
                    <span className="text-gray-500 mr-2">{new Date(ev.ts).toLocaleString()}</span>
                    {ev.detail}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">Call</button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-2 rounded-lg">Send Doc</button>
              <button className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg">Book Meeting</button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-gray-500">No lead selected.</div>
        )}
      </div>
    </div>
  );
}
