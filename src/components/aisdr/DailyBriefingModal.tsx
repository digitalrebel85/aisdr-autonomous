"use client";
import React from "react";

export default function DailyBriefingModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-5">
            <div className="text-sm opacity-90">Morning Chris</div>
            <div className="text-xl font-semibold">Here’s what I worked on while you were away…</div>
          </div>
          <div className="p-5 space-y-3 text-gray-800">
            <div>• Followed up with 12 leads and drafted 4 replies.</div>
            <div>• Detected an intent spike from Acme and BrightLabs.</div>
            <div>• Booked 2 meetings and prepped talk tracks.</div>
            <div className="pt-2 text-sm text-gray-600">Today’s Plan: prioritize hot leads, send 8 tailored reachouts, monitor replies in real time.</div>
            <div className="pt-3 text-right">
              <button onClick={onClose} className="bg-gray-900 text-white px-4 py-2 rounded-lg">Let’s go</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
