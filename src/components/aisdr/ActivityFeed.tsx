"use client";
import React from "react";
import { ActivityItem } from "../../types/aisdr";

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm h-80 overflow-y-auto">
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-start gap-3">
            <div className="text-lg leading-none">{i.icon ?? '🤖'}</div>
            <div>
              <div className="text-sm text-gray-600">{new Date(i.timestamp).toLocaleTimeString()}</div>
              <div className="text-gray-900">{i.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
