'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  TrendingUp, 
  Mail, 
  Users, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MousePointerClick,
  MessageSquare,
  Calendar,
  Pause,
  Play,
  BarChart3
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  total_leads: number;
  created_at: string;
  campaign_sequences: {
    name: string;
    total_touches: number;
    messaging_framework: string;
  };
}

interface CampaignStats {
  total_emails: number;
  emails_sent: number;
  emails_queued: number;
  emails_failed: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings_booked: number;
  auto_stopped: number;
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignData();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchCampaignData, 30000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      // Fetch campaign (without campaign_sequences join for A/B test campaigns)
      const { data: campaignData, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('Campaign fetch error:', campaignError);
        throw campaignError;
      }
      setCampaign(campaignData);

      // Fetch queue stats with thread_id for reply matching
      const { data: queueData, error: queueError } = await supabase
        .from('outreach_queue')
        .select('status, thread_id')
        .eq('campaign_id', campaignId);

      if (queueError) throw queueError;

      // Fetch sent emails stats
      const { data: sentData, error: sentError } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('campaign_id', campaignId);

      if (sentError) throw sentError;

      // Get thread_ids for this campaign's outreach emails
      const campaignThreadIds = (queueData || [])
        .map((o: any) => o.thread_id)
        .filter(Boolean);

      // Fetch replies and count those matching this campaign
      const { data: repliesData } = await supabase
        .from('replies')
        .select('original_campaign_id, thread_id')
        .eq('user_id', user.id);

      // Count replies: match by original_campaign_id OR by thread_id (fallback)
      const repliesCount = (repliesData || []).filter((r: any) => 
        r.original_campaign_id === campaignId ||
        (r.thread_id && campaignThreadIds.includes(r.thread_id))
      ).length;

      // Calculate stats
      const queueStats = (queueData || []).reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total_emails: queueData?.length || 0,
        emails_sent: queueStats?.sent || 0,
        emails_queued: queueStats?.queued || 0,
        emails_failed: queueStats?.failed || 0,
        opens: sentData?.filter((e: any) => e.opened_at).length || 0,
        clicks: sentData?.filter((e: any) => e.clicked_at).length || 0,
        replies: repliesCount,
        meetings_booked: 0, // TODO: Calculate from bookings
        auto_stopped: queueStats?.cancelled || 0
      });

    } catch (err) {
      console.error('Error fetching campaign data:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async () => {
    if (!campaign) return;

    const newStatus = campaign.status === 'active' ? 'paused' : 'active';

    try {
      const { error } = await supabase
        .from('outreach_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      setCampaign({ ...campaign, status: newStatus });
    } catch (err) {
      console.error('Error updating campaign status:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const openRate = stats?.emails_sent ? ((stats.opens / stats.emails_sent) * 100).toFixed(1) : '0';
  const clickRate = stats?.emails_sent ? ((stats.clicks / stats.emails_sent) * 100).toFixed(1) : '0';
  const replyRate = stats?.emails_sent ? ((stats.replies / stats.emails_sent) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
              <p className="text-gray-600">{campaign.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
              <button
                onClick={toggleCampaignStatus}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                {campaign.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Leads */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{campaign.total_leads}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.total_emails} total emails
            </div>
          </div>

          {/* Emails Sent */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Emails Sent</h3>
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.emails_sent || 0}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.emails_queued || 0} queued
            </div>
          </div>

          {/* Open Rate */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Open Rate</h3>
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{openRate}%</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.opens || 0} opens
            </div>
          </div>

          {/* Reply Rate */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Reply Rate</h3>
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{replyRate}%</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.replies || 0} replies
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Engagement Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Opens</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{stats?.opens || 0}</span>
                  <span className="text-xs text-gray-500">({openRate}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MousePointerClick className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Clicks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{stats?.clicks || 0}</span>
                  <span className="text-xs text-gray-500">({clickRate}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Replies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{stats?.replies || 0}</span>
                  <span className="text-xs text-gray-500">({replyRate}%)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Meetings Booked</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats?.meetings_booked || 0}</span>
              </div>
            </div>
          </div>

          {/* Campaign Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Campaign Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Sent</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats?.emails_sent || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Queued</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats?.emails_queued || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-gray-700">Failed</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats?.emails_failed || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Pause className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Auto-Stopped</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats?.auto_stopped || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Details</h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm text-gray-600 mb-1">Sequence</dt>
              <dd className="font-medium text-gray-900">{campaign.campaign_sequences?.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Framework</dt>
              <dd className="font-medium text-gray-900">{campaign.campaign_sequences?.messaging_framework}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Total Touches</dt>
              <dd className="font-medium text-gray-900">{campaign.campaign_sequences?.total_touches}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Created</dt>
              <dd className="font-medium text-gray-900">
                {new Date(campaign.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Status</dt>
              <dd className="font-medium text-gray-900 capitalize">{campaign.status}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
