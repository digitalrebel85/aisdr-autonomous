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
  Home
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
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
    badge: 'New',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    children: [
      { name: 'All Leads', href: '/leads', icon: Users },
      { name: 'Add Lead', href: '/leads/add', icon: Users },
      { name: 'Import CSV', href: '/leads/csv-upload', icon: FileText },
      { name: 'AI Import', href: '/leads/json-upload', icon: Bot },
    ]
  },
  {
    name: 'AI Inbox',
    href: '/inbox',
    icon: Bot,
    badge: '3',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    name: 'Offers & Personas',
    href: '/offers',
    icon: Target,
  },
  {
    name: 'Pipeline',
    href: '/pipeline',
    icon: BarChart3,
    badge: 'Soon',
    badgeColor: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    badge: '2',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
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
    <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">AISDR</h1>
              <p className="text-xs text-gray-500">AI Sales Assistant</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isItemActive = isActive(item.href) || isChildActive(item);
          const hasChildren = item.children && item.children.length > 0;
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isItemActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 ${isItemActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                
                {!collapsed && (
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${item.badgeColor || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {hasChildren && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
              </Link>

              {/* Sub-navigation */}
              {!collapsed && hasChildren && isItemActive && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children?.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        pathname === child.href
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <child.icon className={`w-4 h-4 ${
                        pathname === child.href ? 'text-blue-600' : 'text-gray-400'
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
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-700">Processing leads...</span>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
