"use client";

import React, { useState, useEffect } from 'react';
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
  Home
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

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
    highScoreLeads: 0,
    totalEmails: 0,
    repliesReceived: 0,
    responseRate: 0,
    activeOffers: 0,
    activePersonas: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - replace with actual Supabase queries
      setStats({
        totalLeads: 47,
        enrichedLeads: 32,
        pendingLeads: 8,
        highScoreLeads: 12,
        totalEmails: 156,
        repliesReceived: 23,
        responseRate: 14.7,
        activeOffers: 3,
        activePersonas: 5
      });

      setRecentActivity([
        {
          id: '1',
          type: 'lead_enriched',
          title: 'Lead Enriched',
          description: 'Alex Carter from Acme Inc has been enriched with AI data',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'email_received',
          title: 'New Reply',
          description: 'Sarah Wilson replied to your outreach email',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'lead_added',
          title: 'New Lead Added',
          description: 'Chris Hall from NovaWorks added to database',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_added':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'lead_enriched':
        return <Bot className="w-4 h-4 text-green-600" />;
      case 'email_received':
        return <Mail className="w-4 h-4 text-purple-600" />;
      case 'offer_created':
        return <Target className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-50 text-green-700 border border-green-200">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</Badge>;
      case 'warning':
        return <Badge className="bg-orange-50 text-orange-700 border border-orange-200">Warning</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Home className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="mt-1 text-gray-600">Welcome back! Here's what's happening with your AI SDR.</p>
              </div>
            </div>
            <Link href="/leads">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Leads
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/leads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  Total Leads
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.totalLeads.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/leads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Bot className="w-4 h-4 mr-2 text-green-600" />
                  Enriched Leads
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.enrichedLeads.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/inbox">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-purple-600" />
                  Email Replies
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.repliesReceived.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                Response Rate
              </CardTitle>
              <CardDescription className="text-2xl font-bold text-gray-900">
                {stats.responseRate}%
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/leads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  Pending Enrichment
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.pendingLeads.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/leads">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-red-600" />
                  High Score Leads
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.highScoreLeads.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/offers">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-indigo-600" />
                  Active Offers
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.activeOffers.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/offers">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-pink-600" />
                  Active Personas
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-gray-900">
                  {stats.activePersonas.toLocaleString()}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/leads">
                <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Users className="w-4 h-4 mr-2" />
                  View All Leads
                </Button>
              </Link>
              <Link href="/inbox">
                <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
                  <Mail className="w-4 h-4 mr-2" />
                  Check Inbox
                </Button>
              </Link>
              <Link href="/offers">
                <Button className="w-full justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                  <Target className="w-4 h-4 mr-2" />
                  Manage Offers
                </Button>
              </Link>
              <Link href="/calendar">
                <Button className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
