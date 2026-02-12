"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Users,
  Mail,
  Target,
  BarChart3,
  Calendar,
  Settings,
  Bot,
  Inbox,
  TrendingUp,
  Building2,
  FileText,
  Zap,
  ChevronRight,
  Home,
  Rocket,
  Sparkles,
  Brain,
  CircuitBoard,
  Activity,
  Cpu
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Command Center',
    href: '/dashboard',
    icon: Cpu,
  },
  {
    name: 'Lead Database',
    href: '/leads',
    icon: Users,
    badge: 'AI',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    children: [
      { name: 'All Leads', href: '/leads', icon: Users },
      { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
    ]
  },
  {
    name: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Rocket,
    badge: 'Live',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    children: [
      { name: 'All Campaigns', href: '/dashboard/campaigns', icon: Rocket },
      { name: 'AI Agent', href: '/dashboard/campaigns/agent', icon: Bot },
      { name: 'AI Strategy', href: '/dashboard/campaigns/strategy', icon: Sparkles },
    ]
  },
  {
    name: 'AI Inbox',
    href: '/inbox',
    icon: Bot,
    badge: '3',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    name: 'Autopilot',
    href: '/dashboard/autopilot',
    icon: Brain,
    badge: 'Auto',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    name: 'ICP Scoring',
    href: '/icp',
    icon: Target,
    badge: 'AI',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  },
  {
    name: 'Offers & Personas',
    href: '/offers',
    icon: Target,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    badge: '2',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { name: 'Profile', href: '/settings/profile', icon: Settings },
      { name: 'API Keys', href: '/settings/api-keys', icon: Zap },
      { name: 'Email Settings', href: '/settings/email', icon: Mail },
      { name: 'Calendar Settings', href: '/settings/calendar', icon: Calendar },
    ]
  },
];

interface SideNavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function SideNavigation({ collapsed = false, onToggle }: SideNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isChildActive = (item: NavigationItem) => {
    if (!item.children) return false;
    return item.children.some(child => pathname === child.href);
  };

  return (
    <div className={`bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-72'
    } flex flex-col h-screen relative`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 via-transparent to-fuchsia-600/5 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative p-5 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a0f]"></div>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">AISDR</h1>
              <p className="text-xs text-gray-500">Autonomous Sales Agent</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Status Banner */}
      {!collapsed && (
        <div className="relative mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-violet-500/20 rounded-lg">
                <Activity className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-white">Agent Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-400">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isItemActive = isActive(item.href) || isChildActive(item);
          const hasChildren = item.children && item.children.length > 0;
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isItemActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg ${isItemActive ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                    <item.icon className={`w-4 h-4 ${isItemActive ? 'text-violet-400' : 'text-gray-500'}`} />
                  </div>
                  {!collapsed && <span>{item.name}</span>}
                </div>
                
                {!collapsed && (
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 border ${item.badgeColor || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {hasChildren && (
                      <ChevronRight className={`w-4 h-4 transition-transform ${isItemActive ? 'rotate-90 text-violet-400' : 'text-gray-600'}`} />
                    )}
                  </div>
                )}
              </Link>

              {/* Sub-navigation */}
              {!collapsed && hasChildren && isItemActive && (
                <div className="ml-4 mt-1.5 pl-4 border-l border-white/10 space-y-1">
                  {item.children?.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        pathname === child.href
                          ? 'bg-violet-500/10 text-violet-300 font-medium'
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <child.icon className={`w-4 h-4 ${
                        pathname === child.href ? 'text-violet-400' : 'text-gray-600'
                      }`} />
                      <span>{child.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative p-4 border-t border-white/5">
        {!collapsed && (
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                  <CircuitBoard className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-white">AI Processing</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Leads enriched</span>
                <span className="text-emerald-400">24 today</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Emails sent</span>
                <span className="text-violet-400">156 today</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div className="h-full w-3/4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
