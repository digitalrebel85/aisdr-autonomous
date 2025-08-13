"use client";
import React from "react";
import { KPI } from "../../types/aisdr";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KPICards({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k) => {
        const isUp = (k.delta ?? 0) >= 0;
        return (
          <div key={k.id} className="rounded-xl border bg-white shadow-sm hover:shadow transition-shadow p-4">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-semibold">{k.value}{k.suffix ?? ''}</div>
              {k.delta !== undefined && (
                <div className={`inline-flex items-center text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                  {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span className="ml-0.5">{Math.abs(k.delta!)}{k.id === 'reply_rate' ? '%' : ''}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
