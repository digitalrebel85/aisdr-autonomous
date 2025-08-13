"use client";
import React from "react";
import { NextAction } from "../../types/aisdr";

export default function NextActionCard({ action, onDoNow }: { action: NextAction; onDoNow: () => void }) {
  const gradient = "bg-gradient-to-r from-orange-500 to-red-600";
  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className={`${gradient} text-white p-4`}> 
        <div className="text-sm opacity-90">Next Best Action</div>
        <div className="text-xl font-semibold">{action.title}</div>
      </div>
      <div className="p-4">
        <p className="text-gray-700 mb-4">{action.description}</p>
        <button onClick={onDoNow} className={`${gradient} hover:opacity-95 transition text-white px-4 py-2 rounded-lg font-medium`}>
          {action.ctaLabel}
        </button>
      </div>
    </div>
  );
}
