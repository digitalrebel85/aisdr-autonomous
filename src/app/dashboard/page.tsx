// src/app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

// Dashboard Metrics Cards
const MetricCard = ({ title, value, change, icon, color, href }: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) => {
  const CardContent = (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{CardContent}</Link> : CardContent;
};

// Quick Action Cards
const QuickActionCard = ({ title, description, icon, href, color }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}) => (
  <Link href={href}>
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${color} p-6 hover:shadow-md transition-all hover:scale-105`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

// Recent Activity Item
const ActivityItem = ({ type, description, time, status }: {
  type: string;
  description: string;
  time: string;
  status: 'success' | 'pending' | 'error';
}) => {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{description}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeOutreach: 0,
    bookingsThisMonth: 0,
    responseRate: 0,
    conversionRate: 0,
    aiInboxUnread: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    
    try {
      // Fetch metrics (simplified for demo)
      const { data: leads } = await supabase.from('leads').select('id');
      const { data: campaigns } = await supabase.from('outreach_campaigns').select('id').eq('status', 'active');
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      setMetrics({
        totalLeads: leads?.length || 0,
        activeOutreach: campaigns?.length || 0,
        bookingsThisMonth: bookings?.length || 0,
        responseRate: 24.5, // Calculate from actual data
        conversionRate: 8.2, // Calculate from actual data
        aiInboxUnread: 12 // Calculate from actual data
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AISDR Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor your AI-powered sales development performance</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/dashboard/leads" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            + Add Leads
          </Link>
          <Link href="/dashboard/automated-outreach" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            + New Campaign
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          change="+12%"
          icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
          color="border-l-blue-500"
          href="/dashboard/leads"
        />
        <MetricCard
          title="Active Outreach"
          value={metrics.activeOutreach}
          change="+5%"
          icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>}
          color="border-l-green-500"
          href="/dashboard/automated-outreach"
        />
        <MetricCard
          title="Bookings This Month"
          value={metrics.bookingsThisMonth}
          change="+18%"
          icon={<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>}
          color="border-l-purple-500"
          href="/dashboard/bookings"
        />
        <MetricCard
          title="Response Rate"
          value={`${metrics.responseRate}%`}
          change="+2.3%"
          icon={<svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>}
          color="border-l-yellow-500"
          href="/dashboard/analytics"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change="+1.1%"
          icon={<svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>}
          color="border-l-indigo-500"
          href="/dashboard/analytics"
        />
        <MetricCard
          title="AI Inbox Unread"
          value={metrics.aiInboxUnread}
          icon={<svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>}
          color="border-l-red-500"
          href="/dashboard/inbox"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <QuickActionCard
              title="Import Leads"
              description="Upload CSV or connect CRM to import new leads"
              icon={<svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.293 5.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>}
              href="/dashboard/leads"
              color="border-l-blue-500"
            />
            <QuickActionCard
              title="Create Booking Link"
              description="Set up new calendar booking link for lead conversion"
              icon={<svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>}
              href="/dashboard/bookings"
              color="border-l-green-500"
            />
            <QuickActionCard
              title="Train AI Responses"
              description="Improve AI reply quality with custom training"
              icon={<svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>}
              href="/dashboard/inbox"
              color="border-l-purple-500"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <ActivityItem
              type="outreach"
              description="Campaign 'Q1 Tech Outreach' sent to 45 leads"
              time="2 hours ago"
              status="success"
            />
            <ActivityItem
              type="booking"
              description="New booking scheduled with John Smith"
              time="4 hours ago"
              status="success"
            />
            <ActivityItem
              type="ai_reply"
              description="AI responded to 8 lead inquiries"
              time="6 hours ago"
              status="success"
            />
            <ActivityItem
              type="follow_up"
              description="Strategic follow-up sequence triggered"
              time="8 hours ago"
              status="pending"
            />
            <ActivityItem
              type="integration"
              description="Email sync with Gmail completed"
              time="1 day ago"
              status="success"
            />
          </div>
        </div>
      </div>
    </div>
  );
}