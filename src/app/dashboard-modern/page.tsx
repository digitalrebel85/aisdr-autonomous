"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AICopilot from '@/components/AICopilot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  Plus,
  Bot,
  Target,
  Calendar,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface DashboardStats {
  totalLeads: number;
  enrichedLeads: number;
  pendingLeads: number;
  highScoreLeads: number;
  totalEmails: number;
  repliesReceived: number;
  responseRate: number;
  activeOffers: number;
  activePersonas: number;
  trends: {
    leads: number;
    replies: number;
    responseRate: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'lead_added' | 'lead_enriched' | 'email_received' | 'offer_created';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'warning';
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  actionable: boolean;
  action?: string;
}

export default function ModernDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    enrichedLeads: 0,
    pendingLeads: 0,
    highScoreLeads: 0,
    totalEmails: 0,
    repliesReceived: 0,
    responseRate: 0,
    activeOffers: 0,
    activePersonas: 0,
    trends: {
      leads: 0,
      replies: 0,
      responseRate: 0
    }
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch real data from Supabase
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      const { data: replies } = await supabase
        .from('replies')
        .select('*')
        .eq('user_id', user.id);

      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('user_id', user.id);

      const totalLeads = leads?.length || 0;
      const enrichedLeads = leads?.filter(l => l.enrichment_status === 'completed').length || 0;
      const pendingLeads = leads?.filter(l => l.enrichment_status === 'pending').length || 0;
      const highScoreLeads = leads?.filter(l => (l.lead_score || 0) >= 70).length || 0;
      
      const totalReplies = replies?.length || 0;
      const positiveReplies = replies?.filter(r => r.sentiment === 'interested' || r.sentiment === 'positive').length || 0;
      
      // Calculate response rate
      const responseRate = totalLeads > 0 ? ((totalReplies / totalLeads) * 100).toFixed(1) : '0.0';

      setStats({
        totalLeads,
        enrichedLeads,
        pendingLeads,
        highScoreLeads,
        totalEmails: totalLeads, // Simplified - in reality would track sent emails separately
        repliesReceived: totalReplies,
        responseRate: parseFloat(responseRate),
        activeOffers: offers?.length || 0,
        activePersonas: 0, // Would need to fetch from personas table
        trends: {
          leads: 12, // Mock trend data - would calculate from historical data
          replies: 8,
          responseRate: 3.2
        }
      });

      // Generate AI insights based on real data
      const insights: AIInsight[] = [];
      
      if (pendingLeads > 5) {
        insights.push({
          id: '1',
          title: 'Enrichment Backlog',
          description: `You have ${pendingLeads} leads waiting for enrichment. Enriching these leads will help you personalize your outreach.`,
          actionable: true,
          action: 'Enrich Pending Leads'
        });
      }

      if (parseFloat(responseRate) < 5 && totalLeads > 20) {
        insights.push({
          id: '2',
          title: 'Low Response Rate',
          description: `Your response rate of ${responseRate}% is below average. Consider improving your email personalization or subject lines.`,
          actionable: true,
          action: 'Optimize Outreach'
        });
      }

      if (highScoreLeads > 0) {
        insights.push({
          id: '3',
          title: 'High-Value Leads Detected',
          description: `You have ${highScoreLeads} high-scoring leads. These are your best opportunities for conversion.`,
          actionable: true,
          action: 'View High-Score Leads'
        });
      }

      setAIInsights(insights);

      // Mock recent activity - in reality would fetch from activity log
      setRecentActivity([
        {
          id: '1',
          type: 'lead_enriched',
          title: 'Lead Enriched',
          description: `${enrichedLeads} leads have been enriched with AI data`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'email_received',
          title: 'New Replies',
          description: `${totalReplies} replies received from your outreach`,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'success'
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <ArrowUp className="w-4 h-4 text-green-600" />;
    } else if (value < 0) {
      return <ArrowDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your AI-powered insights.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/leads">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Leads
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Insights Banner */}
        {aiInsights.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Sparkles className="w-5 h-5 mr-2" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="flex items-start justify-between p-3 bg-white rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                  {insight.actionable && (
                    <Button variant="outline" size="sm" className="ml-4">
                      {insight.action}
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-600" />
                      Total Leads
                    </span>
                    <div className={`flex items-center text-xs ${getTrendColor(stats.trends.leads)}`}>
                      {getTrendIcon(stats.trends.leads)}
                      <span className="ml-1">{Math.abs(stats.trends.leads)}%</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-gray-900">
                    {stats.totalLeads.toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    <span className="flex items-center">
                      <Bot className="w-4 h-4 mr-2 text-green-600" />
                      Enriched Leads
                    </span>
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-gray-900">
                    {stats.enrichedLeads.toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-purple-600" />
                      Email Replies
                    </span>
                    <div className={`flex items-center text-xs ${getTrendColor(stats.trends.replies)}`}>
                      {getTrendIcon(stats.trends.replies)}
                      <span className="ml-1">{Math.abs(stats.trends.replies)}%</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-gray-900">
                    {stats.repliesReceived.toLocaleString()}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                      Response Rate
                    </span>
                    <div className={`flex items-center text-xs ${getTrendColor(stats.trends.responseRate)}`}>
                      {getTrendIcon(stats.trends.responseRate)}
                      <span className="ml-1">{Math.abs(stats.trends.responseRate)}%</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-gray-900">
                    {stats.responseRate}%
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest updates from your AI SDR system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Copilot */}
          <div className="lg:col-span-1">
            <AICopilot className="h-[600px]" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

