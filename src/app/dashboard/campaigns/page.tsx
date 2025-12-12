'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Plus, 
  Rocket, 
  Users, 
  Mail, 
  TrendingUp,
  Eye,
  MessageSquare,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Zap,
  Activity,
  ArrowRight,
  Send,
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  objective?: string;
  status: string;
  total_leads?: number;
  created_at: string;
  stats?: {
    sent: number;
    queued: number;
    replies: number;
    opens: number;
    clicks: number;
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns...');
      
      // Check current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user ID:', user?.id);
      
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }
      
      // Fetch campaigns
      const { data: campaignsData, error } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Campaigns query result:', { data: campaignsData, error });
      
      if (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
      
      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      // Fetch outreach queue items for all campaigns
      const campaignIds = campaignsData.map(c => c.id);
      const { data: outreachData } = await supabase
        .from('outreach_queue')
        .select('campaign_id, status, thread_id')
        .in('campaign_id', campaignIds);

      // Fetch replies for this user
      const { data: repliesData } = await supabase
        .from('replies')
        .select('original_campaign_id, thread_id')
        .eq('user_id', user.id);

      // Calculate stats for each campaign
      const campaignsWithStats = campaignsData.map(campaign => {
        const campaignOutreach = outreachData?.filter(o => o.campaign_id === campaign.id) || [];
        const sentCount = campaignOutreach.filter(o => o.status === 'sent').length;
        const queuedCount = campaignOutreach.filter(o => o.status === 'queued').length;
        
        // Get thread_ids for this campaign's outreach emails
        const campaignThreadIds = campaignOutreach
          .map(o => o.thread_id)
          .filter(Boolean);
        
        // Count replies: match by original_campaign_id OR by thread_id (fallback)
        const replyCount = (repliesData || []).filter(r => 
          r.original_campaign_id === campaign.id ||
          (r.thread_id && campaignThreadIds.includes(r.thread_id))
        ).length;
        
        return {
          ...campaign,
          stats: {
            sent: sentCount,
            queued: queuedCount,
            replies: replyCount,
            opens: 0,
            clicks: 0
          }
        };
      });
      
      console.log('Setting campaigns with stats:', campaignsWithStats);
      setCampaigns(campaignsWithStats);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Campaigns</h1>
                <p className="text-gray-400 mt-1">AI-powered outreach sequences</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/campaigns/strategy')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 flex items-center space-x-2 font-semibold shadow-lg shadow-violet-500/25 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Campaign</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Rocket className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Campaigns</div>
          </div>

          <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{stats.active}</div>
            <div className="text-sm text-gray-500 mt-1">Active</div>
          </div>

          <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Pause className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-400">{stats.paused}</div>
            <div className="text-sm text-gray-500 mt-1">Paused</div>
          </div>

          <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-fuchsia-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-fuchsia-400">{stats.completed}</div>
            <div className="text-sm text-gray-500 mt-1">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-400">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('paused')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'paused'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              Paused
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'completed'
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
              <Rocket className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Create your first AI-powered campaign to start reaching out to leads automatically'
                : `You don't have any ${filter} campaigns at the moment`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/campaigns/strategy')}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 inline-flex items-center space-x-2 shadow-lg shadow-violet-500/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span>Create Your First Campaign</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {campaign.name}
                      </h3>
                      <Badge className={`text-xs ${
                        campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        campaign.status === 'completed' ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {campaign.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                        {campaign.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                        {campaign.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-400 mb-4">{campaign.description}</p>
                    )}
                    {campaign.objective && (
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-violet-400" />
                        <span className="text-gray-400">Objective: {campaign.objective}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-violet-400" />
                        <span>{campaign.total_leads || 0} leads</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/campaigns/${campaign.id}`);
                      }}
                      className="px-4 py-2 text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  <div className="text-center p-3 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Send className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{campaign.stats?.sent || 0}</div>
                    <div className="text-xs text-gray-500">Sent</div>
                  </div>
                  <div className="text-center p-3 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{campaign.stats?.queued || 0}</div>
                    <div className="text-xs text-gray-500">Queued</div>
                  </div>
                  <div className="text-center p-3 bg-white/[0.02] rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{campaign.stats?.opens || 0}</div>
                    <div className="text-xs text-gray-500">Opens</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-xl border border-violet-500/20">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="text-2xl font-bold text-violet-400">{campaign.stats?.replies || 0}</div>
                    <div className="text-xs text-gray-500">Replies</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
