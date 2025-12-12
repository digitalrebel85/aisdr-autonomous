"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Mail, 
  TrendingUp, 
  Plus,
  Bot,
  Target,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Home,
  ArrowRight,
  Cpu,
  Sparkles,
  Zap,
  Brain,
  CircuitBoard,
  Activity,
  Rocket,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface DashboardStats {
  totalLeads: number;
  enrichedLeads: number;
  pendingLeads: number;
  totalEmails: number;
  repliesReceived: number;
  responseRate: number;
  activeOffers: number;
}

interface RecentActivity {
  id: string;
  type: 'lead_added' | 'lead_enriched' | 'email_received' | 'offer_created';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning';
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    enrichedLeads: 0,
    pendingLeads: 0,
    totalEmails: 0,
    repliesReceived: 0,
    responseRate: 0,
    activeOffers: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      // Fetch leads stats
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, enrichment_status, created_at, first_name, last_name, company')
        .eq('user_id', user.id);

      // Fetch replies (email replies received)
      const { data: replies, error: repliesError } = await supabase
        .from('replies')
        .select('id, sender_email, sentiment, action, auto_reply_sent, created_at, summary')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch sent emails count
      const { data: sentEmails, error: sentError } = await supabase
        .from('sent_emails')
        .select('id')
        .eq('user_id', user.id);

      // Fetch active offers
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Calculate stats
      const totalLeads = leads?.length || 0;
      const enrichedLeads = leads?.filter(l => l.enrichment_status === 'completed').length || 0;
      const pendingLeads = leads?.filter(l => l.enrichment_status === 'pending').length || 0;
      const totalEmails = sentEmails?.length || 0;
      const repliesReceived = replies?.length || 0;
      const responseRate = totalEmails > 0 ? Math.round((repliesReceived / totalEmails) * 100 * 10) / 10 : 0;
      const activeOffers = offers?.length || 0;

      setStats({
        totalLeads,
        enrichedLeads,
        pendingLeads,
        totalEmails,
        repliesReceived,
        responseRate,
        activeOffers
      });

      // Build recent activity from real data
      const activities: RecentActivity[] = [];

      // Add recent leads
      if (leads && leads.length > 0) {
        const recentLeads = leads
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        
        recentLeads.forEach((lead, idx) => {
          const isEnriched = lead.enrichment_status === 'completed';
          activities.push({
            id: `lead-${lead.id}`,
            type: isEnriched ? 'lead_enriched' : 'lead_added',
            title: isEnriched ? 'Lead Enriched' : 'New Lead Added',
            description: `${lead.first_name || ''} ${lead.last_name || ''} from ${lead.company || 'Unknown Company'}`,
            timestamp: lead.created_at,
            status: isEnriched ? 'success' : 'pending'
          });
        });
      }

      // Add recent replies
      if (replies && replies.length > 0) {
        replies.slice(0, 3).forEach((reply) => {
          activities.push({
            id: `reply-${reply.id}`,
            type: 'email_received',
            title: 'New Reply',
            description: reply.summary || `Reply from ${reply.sender_email}`,
            timestamp: reply.created_at,
            status: reply.auto_reply_sent ? 'success' : 'warning'
          });
        });
      }

      // Sort by timestamp and take top 5
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_added':
        return <Users className="w-4 h-4 text-violet-400" />;
      case 'lead_enriched':
        return <Brain className="w-4 h-4 text-emerald-400" />;
      case 'email_received':
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case 'offer_created':
        return <Target className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Success</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</Badge>;
      case 'warning':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Warning</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-white/10 rounded-xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-8 bg-white/10 rounded w-1/3"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Command Center</h1>
                <p className="mt-1 text-gray-400">AI Agent is active and processing your leads</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/leads">
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Leads
                </Button>
              </Link>
              <Link href="/dashboard/campaigns/strategy">
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/leads">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-violet-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-white">{stats.totalLeads.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </Link>

          <Link href="/leads">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-emerald-500/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-400 mb-1">AI Enriched</p>
              <p className="text-3xl font-bold text-white">{stats.enrichedLeads.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Processed
                </Badge>
              </div>
            </div>
          </Link>

          <Link href="/inbox">
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-cyan-500/30 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-cyan-500/20 rounded-xl">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-sm text-gray-400 mb-1">Email Replies</p>
              <p className="text-3xl font-bold text-white">{stats.repliesReceived.toLocaleString()}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                  <Send className="w-3 h-3 mr-1" />
                  Received
                </Badge>
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-amber-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                +2.3%
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mb-1">Response Rate</p>
            <p className="text-3xl font-bold text-amber-400">{stats.responseRate}%</p>
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${stats.responseRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-xl">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
                  <p className="text-sm text-gray-400">AI-powered shortcuts</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/leads">
                <Button className="w-full justify-start text-gray-300 hover:text-white bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 h-12 rounded-xl transition-all">
                  <div className="p-1.5 bg-violet-500/20 rounded-lg mr-3">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  View All Leads
                </Button>
              </Link>
              <Link href="/inbox">
                <Button className="w-full justify-start text-gray-300 hover:text-white bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 h-12 rounded-xl transition-all">
                  <div className="p-1.5 bg-cyan-500/20 rounded-lg mr-3">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                  AI Inbox
                </Button>
              </Link>
              <Link href="/dashboard/campaigns">
                <Button className="w-full justify-start text-gray-300 hover:text-white bg-white/5 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-500/30 h-12 rounded-xl transition-all">
                  <div className="p-1.5 bg-fuchsia-500/20 rounded-lg mr-3">
                    <Rocket className="w-4 h-4 text-fuchsia-400" />
                  </div>
                  View Campaigns
                </Button>
              </Link>
              <Link href="/calendar">
                <Button className="w-full justify-start text-gray-300 hover:text-white bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 h-12 rounded-xl transition-all">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg mr-3">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  View Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                  <p className="text-sm text-gray-400">Latest AI agent updates</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex-shrink-0 mt-1 p-2 bg-white/10 rounded-lg">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{activity.title}</p>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No recent activity</p>
                  <p className="text-gray-500 text-xs mt-1">Add leads or send emails to see activity here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
