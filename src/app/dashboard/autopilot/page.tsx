'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Brain, Activity, Rocket, Users, Mail, Calendar,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Zap, Target, BarChart3, RefreshCw, Settings,
  ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight,
  Pause, Play, Eye, MessageSquare, Clock
} from 'lucide-react';
import Link from 'next/link';

interface AutopilotSettings {
  enabled: boolean;
  auto_discover_leads: boolean;
  auto_create_campaigns: boolean;
  discovery_icp_profile_id: number | null;
  default_offer_id: number | null;
  icp_score_threshold: number;
  max_leads_per_campaign: number;
  max_active_campaigns: number;
  max_new_leads_per_day: number;
  max_emails_per_day: number;
  booking_link: string | null;
  auto_send_booking_link: boolean;
  total_leads_discovered: number;
  total_campaigns_created: number;
  total_emails_sent: number;
  total_meetings_booked: number;
  last_discovery_at: string | null;
  angle_traffic_weights: Record<string, number>;
}

interface AnglePerformance {
  id: number;
  name: string;
  value_proposition: string;
  tone: string;
  is_active: boolean;
  is_control: boolean;
  performance_stats: {
    emails_sent: number;
    opens: number;
    replies: number;
    positive_replies: number;
    meetings_booked: number;
    open_rate: number;
    reply_rate: number;
    positive_rate: number;
    meeting_rate: number;
    composite_score: number | null;
    status: string;
    last_analyzed: string | null;
  };
}

interface Insight {
  id: number;
  insight_type: string;
  summary: string;
  recommendations: string[];
  metadata: any;
  created_at: string;
}

export default function AutopilotDashboard() {
  const [supabase] = useState(() => createClient());
  const [settings, setSettings] = useState<AutopilotSettings | null>(null);
  const [angles, setAngles] = useState<AnglePerformance[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [settingsRes, anglesRes, insightsRes, campaignsRes] = await Promise.all([
        supabase.from('autopilot_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('icp_angles').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ai_insights').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('outreach_campaigns').select('id, name, status, source, total_leads, created_at').eq('user_id', user.id).eq('source', 'autopilot').order('created_at', { ascending: false }).limit(5),
      ]);

      if (settingsRes.data) setSettings(settingsRes.data);
      if (anglesRes.data) setAngles(anglesRes.data);
      if (insightsRes.data) setInsights(insightsRes.data);
      if (campaignsRes.data) setRecentCampaigns(campaignsRes.data);
    } catch (err) {
      console.error('Failed to fetch autopilot data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAutopilot = async () => {
    if (!settings) return;
    setToggling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (settings.enabled) {
        // Disable
        await supabase.from('autopilot_settings').update({ enabled: false }).eq('user_id', user.id);
        setSettings({ ...settings, enabled: false });
      } else {
        // Enable — validate requirements
        if (!settings.discovery_icp_profile_id) {
          alert('Please configure an ICP profile before enabling autopilot.');
          return;
        }
        if (!settings.default_offer_id) {
          alert('Please configure a default offer before enabling autopilot.');
          return;
        }
        await supabase.from('autopilot_settings').update({ enabled: true }).eq('user_id', user.id);
        setSettings({ ...settings, enabled: true });
      }
    } finally {
      setToggling(false);
    }
  };

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-600/20 to-violet-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/20">
            <Brain className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Autopilot Not Configured</h2>
          <p className="text-gray-400 mb-6">Set up your ICP profile and default offer to enable the autonomous AI agent.</p>
          <Link href="/settings" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium hover:opacity-90 transition">
            <Settings className="w-4 h-4" /> Configure Autopilot
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Leads Discovered', value: settings.total_leads_discovered, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Campaigns Created', value: settings.total_campaigns_created, icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Emails Sent', value: settings.total_emails_sent, icon: Mail, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
    { label: 'Meetings Booked', value: settings.total_meetings_booked, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-600/20 to-violet-600/20 rounded-xl border border-cyan-500/20">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              Autopilot Dashboard
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Your autonomous AI SDR agent — discover, engage, and book meetings on autopilot</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/settings"
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleAutopilot}
              disabled={toggling}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
                settings.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {settings.enabled ? (
                <><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Running</>
              ) : (
                <><Play className="w-4 h-4" /> Start Autopilot</>
              )}
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {settings.enabled && (
          <div className="bg-gradient-to-r from-cyan-600/10 via-violet-600/10 to-fuchsia-600/10 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-white font-medium">Agent is running autonomously</span>
              <span className="text-xs text-gray-400">Last discovery: {timeAgo(settings.last_discovery_at)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>ICP threshold: <span className="text-cyan-400">{settings.icp_score_threshold}+</span></span>
              <span>Max campaigns: <span className="text-violet-400">{settings.max_active_campaigns}</span></span>
              <span>Daily cap: <span className="text-fuchsia-400">{settings.max_new_leads_per_day} leads</span></span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Main Grid: Angles + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Angle Performance — 2 cols */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Angle Performance</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{angles.length} active</span>
              </div>
              <Link href="/icp" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {angles.length === 0 ? (
              <div className="p-10 text-center">
                <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No angles configured yet</p>
                <p className="text-gray-500 text-xs mt-1">Create messaging angles on your ICP profiles to enable A/B testing</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {angles.map((angle) => {
                  const stats = angle.performance_stats || {} as any;
                  const status = stats.status || 'insufficient_data';
                  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
                    winner: { label: 'Winner', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
                    loser: { label: 'Losing', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: TrendingDown },
                    testing: { label: 'Testing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Activity },
                    insufficient_data: { label: 'Gathering Data', color: 'text-gray-400 bg-white/5 border-white/10', icon: Clock },
                  };
                  const sc = statusConfig[status] || statusConfig.insufficient_data;

                  return (
                    <div key={angle.id} className="p-4 hover:bg-white/[0.02] transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-white truncate">{angle.name}</h3>
                            {angle.is_control && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Control</span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sc.color}`}>{sc.label}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{angle.value_proposition}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3 mt-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Sent</p>
                          <p className="text-sm font-semibold text-white">{stats.emails_sent || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Open %</p>
                          <p className="text-sm font-semibold text-white">{stats.open_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Reply %</p>
                          <p className="text-sm font-semibold text-white">{stats.reply_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Positive %</p>
                          <p className="text-sm font-semibold text-white">{stats.positive_rate || 0}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Meetings</p>
                          <p className="text-sm font-semibold text-white">{stats.meetings_booked || 0}</p>
                        </div>
                      </div>

                      {/* Traffic weight bar */}
                      {settings.angle_traffic_weights && settings.angle_traffic_weights[String(angle.id)] && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">Traffic:</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                              style={{ width: `${Math.min(settings.angle_traffic_weights[String(angle.id)], 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">{settings.angle_traffic_weights[String(angle.id)]}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Insights — 1 col */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="p-5 border-b border-white/5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">AI Insights</h2>
            </div>

            {insights.length === 0 ? (
              <div className="p-10 text-center">
                <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No insights yet</p>
                <p className="text-gray-500 text-xs mt-1">The learning agent generates insights daily</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        insight.insight_type === 'learning_loop'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                      }`}>
                        {insight.insight_type === 'learning_loop' ? 'Learning Loop' : 'Performance Review'}
                      </span>
                      <span className="text-[10px] text-gray-500">{timeAgo(insight.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{insight.summary}</p>
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {(insight.recommendations as string[]).slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                            <ChevronRight className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {insight.metadata?.confidence && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500">Confidence:</span>
                        <span className={`text-[10px] font-medium ${
                          insight.metadata.confidence === 'high' ? 'text-emerald-400' :
                          insight.metadata.confidence === 'medium' ? 'text-amber-400' : 'text-gray-400'
                        }`}>{insight.metadata.confidence}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Autopilot Campaigns */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-lg font-semibold text-white">Recent Autopilot Campaigns</h2>
            </div>
            <Link href="/dashboard/campaigns" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="p-10 text-center">
              <Rocket className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No autopilot campaigns yet</p>
              <p className="text-gray-500 text-xs mt-1">The agent will create campaigns when it discovers qualified leads</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      campaign.status === 'running' ? 'bg-emerald-400 animate-pulse' :
                      campaign.status === 'paused' ? 'bg-amber-400' :
                      campaign.status === 'completed' ? 'bg-blue-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm text-white font-medium">{campaign.name}</p>
                      <p className="text-xs text-gray-500">{campaign.total_leads} leads · {timeAgo(campaign.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      campaign.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-white/5 text-gray-400 border-white/10'
                    }`}>{campaign.status}</span>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
