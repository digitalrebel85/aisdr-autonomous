"use client";

import React, { useState } from 'react';
import SideNavigation from './SideNavigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <SideNavigation 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/75" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 h-full">
            <SideNavigation />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#0a0a0f] border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-lg font-bold text-white">AISDR</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Desktop Toggle Button */}
        <div className="hidden lg:block absolute top-4 left-4 z-10">
          <Button
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]">
          {children}
        </main>
      </div>
    </div>
  );
}
