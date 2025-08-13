'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, MessageSquare, TrendingUp, Plus, FileText, Settings } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalLeads: number;
  totalCampaigns: number;
  totalReplies: number;
  responseRate: number;
  recentLeads: any[];
  recentReplies: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalCampaigns: 0,
    totalReplies: 0,
    responseRate: 0,
    recentLeads: [],
    recentReplies: []
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch leads count
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      // Fetch recent leads
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent replies
      const { data: recentReplies } = await supabase
        .from('email_replies')
        .select('*, leads(name, email)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalLeads: leadsCount || 0,
        totalCampaigns: campaignsCount || 0,
        totalReplies: recentReplies?.length || 0,
        responseRate: 12.5,
        recentLeads: recentLeads || [],
        recentReplies: recentReplies || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Loading your dashboard...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your outreach.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/leads">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Leads
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/leads">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/leads'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Leads
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {stats.totalLeads.toLocaleString()}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/campaigns'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Active Campaigns
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {stats.totalCampaigns.toLocaleString()}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/inbox'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Recent Replies
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {stats.totalReplies.toLocaleString()}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Response Rate
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-green-600">
              {stats.responseRate}%
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Lead Management
            </CardTitle>
            <CardDescription>
              Import, manage, and organize your leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/leads" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View All Leads
                </Button>
              </Link>
              <Link href="/dashboard/leads?action=upload" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Outreach Campaigns
            </CardTitle>
            <CardDescription>
              Create and manage email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/campaigns" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  View Campaigns
                </Button>
              </Link>
              <Link href="/dashboard/campaigns/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Inbox & Replies
            </CardTitle>
            <CardDescription>
              Manage incoming replies and conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/inbox" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Inbox
                </Button>
              </Link>
              <Link href="/dashboard/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest leads added to your database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentLeads.length > 0 ? (
                stats.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => window.location.href = `/dashboard/leads/${lead.id}`}>
                    <div>
                      <p className="font-medium text-gray-900">{lead.name || `${lead.first_name} ${lead.last_name}`}</p>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      <p className="text-xs text-gray-500">{lead.company}</p>
                    </div>
                    <Badge variant="outline">
                      {lead.engagement_level || 'New'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No leads yet. Start by importing your first leads!</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Replies</CardTitle>
            <CardDescription>Latest responses from your outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentReplies.length > 0 ? (
                stats.recentReplies.map((reply) => (
                  <div key={reply.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/inbox'}>
                    <div>
                      <p className="font-medium text-gray-900">{reply.leads?.name}</p>
                      <p className="text-sm text-gray-600">{reply.leads?.email}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{reply.subject}</p>
                    </div>
                    <Badge variant="secondary">
                      New
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No replies yet. Your responses will appear here!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
