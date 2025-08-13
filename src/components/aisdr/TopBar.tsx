"use client";
import React from "react";

interface Props { activity: string }

export default function TopBar({ activity }: Props) {
  return (
    <div className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <p className="font-medium tracking-wide">{activity}</p>
        </div>
        <div className="text-sm opacity-90">AISDR is working proactively</div>
      </div>
    </div>
  );
}
