"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  TrendingUp,
  Activity,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  MessageSquare,
  Megaphone,
  ArrowLeft,
  CalendarCheck,
  Eye,
  MousePointer,
  XCircle,
  Trophy,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Zap,
  Brain,
  Target,
  Rocket,
  Bot,
  CircuitBoard,
  Cpu,
  Globe,
  Linkedin,
  BarChart3,
  TrendingDown,
  Flame,
  Snowflake,
  ThermometerSun,
  Play,
  Pause,
  MoreHorizontal,
  Lock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

interface Company {
  id: number;
  domain: string;
  name?: string;
  description?: string;
  industry?: string;
  industries?: string[];
  estimated_num_employees?: number;
  annual_revenue?: number;
  annual_revenue_printed?: string;
  founded_year?: number;
  keywords?: string[];
  technologies?: string[];
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo_url?: string;
  enrichment_status?: string;
  enrichment_source?: string;
  enriched_at?: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title?: string;
  company_domain?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  enrichment_status?: string;
  enriched_data?: any;
  created_at: string;
  updated_at: string;
  company_id?: number;
  company_data?: Company; // Linked company from companies table
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  stats: {
    sent: number;
    queued: number;
    replies: number;
    opens: number;
    clicks: number;
  };
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const { isResearchOrTrial } = useSubscription();

  const toggleActivityExpanded = (activityId: string) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'positive':
      case 'interested':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'negative':
      case 'not_interested':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
    }
  }, [leadId]);

  const fetchLeadData = async () => {
    try {
      // Fetch lead data and replies separately since replies query has issues in dynamic routes
      const [leadResponse, repliesResponse] = await Promise.all([
        fetch(`/api/lead-detail/${leadId}`),
        fetch(`/api/test-replies`)
      ]);
      
      if (!leadResponse.ok) {
        const errorData = await leadResponse.json();
        console.error('Error fetching lead:', errorData);
        setLoading(false);
        return;
      }
      
      const responseData = await leadResponse.json();
      const { lead: data, activities: activityData, campaigns: campaignData } = responseData;
      
      // Get replies from the working test-replies endpoint
      let repliesForLead: any[] = [];
      if (repliesResponse.ok) {
        const repliesData = await repliesResponse.json();
        const allReplies = repliesData.tests?.allRepliesForUser?.data || [];
        console.log('[Lead Detail] All replies from test endpoint:', allReplies.length, 'Lead email:', data?.email, 'Lead ID:', leadId);
        // Filter replies for this lead
        repliesForLead = allReplies.filter((r: any) => 
          r.sender_email === data?.email || 
          r.lead_id === String(leadId) || 
          r.lead_id === Number(leadId)
        );
        console.log('[Lead Detail] Filtered replies for this lead:', repliesForLead.length);
        if (repliesForLead.length > 0) {
          console.log('[Lead Detail] First reply:', repliesForLead[0]);
        }
      } else {
        console.error('[Lead Detail] Failed to fetch replies:', repliesResponse.status);
      }
      
      // Debug logging
      console.log('[Lead Detail] API Response - lead:', data?.id, 
        'activities:', activityData?.length || 0,
        'campaigns:', campaignData?.length || 0, 
        'replies from test endpoint:', repliesForLead.length,
        'outreach:', responseData.outreach?.length || 0);
      
      if (data) {
        setLead({
          id: data.id.toString(),
          first_name: data.first_name || data.name?.split(' ')[0] || '',
          last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
          email: data.email,
          company: data.company,
          title: data.title,
          company_domain: data.company_domain,
          phone: data.phone,
          linkedin_url: data.linkedin_url,
          location: data.location,
          industry: data.industry,
          company_size: data.company_size,
          enrichment_status: data.enrichment_status,
          enriched_data: data.enriched_data,
          created_at: data.created_at,
          updated_at: data.updated_at,
          company_id: data.company_id,
          company_data: data.linked_company, // Linked company data from join
        });
      }
      
      // Set activities from API response, adding reply activities from test endpoint
      if (activityData) {
        // Add reply activities from the working endpoint
        const replyActivities = repliesForLead.map((reply: any) => {
          const emailData = reply.raw_email_data as any;
          const subject = emailData?.data?.subject || reply.summary?.substring(0, 40) || 'Reply received';
          return {
            id: `reply_${reply.id}`,
            type: 'reply_received',
            description: `Reply: "${subject}"`,
            timestamp: reply.created_at,
            metadata: {
              sender_email: reply.sender_email,
              lead_id: reply.lead_id,
              sentiment: reply.sentiment,
              summary: reply.summary,
              action: reply.action,
              raw_email_data: reply.raw_email_data,
              temperature: reply.lead_temperature,
              is_read: reply.is_read
            }
          };
        });
        
        // Merge and sort all activities by timestamp (most recent first)
        const allActivities = [...activityData, ...replyActivities].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeB - timeA;
        });
        
        console.log('[Lead Detail] Sorted activities:', allActivities.map(a => ({
          type: a.type,
          timestamp: a.timestamp
        })));
        
        setActivities(allActivities);
      }
      
      // Set campaigns from API response, enhancing with reply counts from test endpoint
      if (campaignData) {
        // Get outreach data to match thread_ids
        const outreachData = responseData.outreach || [];
        
        // Update reply counts using the replies we fetched from test endpoint
        // Match by original_campaign_id OR by thread_id (fallback for existing data)
        const enhancedCampaigns = campaignData.map((campaign: any) => {
          // Get thread_ids for this campaign's outreach emails
          const campaignThreadIds = outreachData
            .filter((o: any) => o.campaign_id === campaign.id && o.thread_id)
            .map((o: any) => o.thread_id);
          
          const campaignReplies = repliesForLead.filter((r: any) => 
            r.original_campaign_id === campaign.id ||
            (r.thread_id && campaignThreadIds.includes(r.thread_id))
          );
          return {
            ...campaign,
            stats: {
              ...campaign.stats,
              replies: campaignReplies.length
            }
          };
        });
        console.log('[Lead Detail] Campaigns:', enhancedCampaigns);
        console.log('[Lead Detail] Replies with thread_ids:', repliesForLead.map((r: any) => ({ id: r.id, thread_id: r.thread_id, original_campaign_id: r.original_campaign_id })));
        setCampaigns(enhancedCampaigns);
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrich = async () => {
    if (!lead) return;
    
    setEnriching(true);
    try {
      const response = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          email: lead.email,
          name: `${lead.first_name} ${lead.last_name}`,
          company: lead.company,
          company_domain: lead.company_domain,
        }),
      });

      if (response.ok) {
        await fetchLeadData();
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-8 h-8 text-violet-400" />
            </div>
          </div>
          <p className="text-gray-400 font-medium">Loading lead intelligence...</p>
          <p className="text-gray-600 text-sm mt-1">AI Agent is preparing data</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative text-center bg-white/[0.03] rounded-3xl border border-white/10 p-10 max-w-md backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Lead not found</h2>
          <p className="text-gray-400 mb-6">The lead you're looking for doesn't exist or has been removed.</p>
          <Link href="/leads">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getEnrichmentStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 backdrop-blur-sm"><CheckCircle2 className="w-3 h-3 mr-1" />Enriched</Badge>;
      case 'enriching':
        return <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30 backdrop-blur-sm"><Clock className="w-3 h-3 mr-1 animate-spin" />Enriching</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-100 border-red-400/30 backdrop-blur-sm"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-200 border-slate-400/30 backdrop-blur-sm">Pending</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrichment': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'email_sent': return <Send className="w-4 h-4 text-green-600" />;
      case 'email_scheduled': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'email_stopped': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'reply_received': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'call_booked': return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case 'meeting_booked': return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case 'milestone': return <Trophy className="w-4 h-4 text-amber-500" />;
      case 'email_open': return <Eye className="w-4 h-4 text-cyan-600" />;
      case 'email_click': return <MousePointer className="w-4 h-4 text-indigo-600" />;
      case 'website_visit': return <ExternalLink className="w-4 h-4 text-purple-600" />;
      case 'created': return <User className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'reply_received': return 'bg-violet-500/10 border-violet-500/20';
      case 'email_sent': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'email_scheduled': return 'bg-amber-500/10 border-amber-500/20';
      case 'email_stopped': return 'bg-red-500/10 border-red-500/20';
      case 'call_booked': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'meeting_booked': return 'bg-cyan-500/10 border-cyan-500/20';
      case 'milestone': return 'bg-fuchsia-500/10 border-fuchsia-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  // Calculate lead score based on available data
  const calculateLeadScore = () => {
    let score = 0;
    if (lead.enriched_data) score += 30;
    if (lead.phone) score += 15;
    if (lead.linkedin_url) score += 15;
    if (lead.company_data) score += 20;
    if (activities.length > 0) score += 10;
    if (campaigns.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const leadScore = calculateLeadScore();
  const getLeadTemperature = () => {
    if (leadScore >= 70) return { label: 'Hot', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (leadScore >= 40) return { label: 'Warm', icon: ThermometerSun, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Cold', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  };
  const temperature = getLeadTemperature();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/leads" className="inline-flex items-center text-gray-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Leads
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-emerald-400 font-medium">AI Agent Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Hero Header */}
        <div className="relative mb-8">
          {/* Glassmorphism Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
            {/* Circuit Pattern Overlay */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M10 10h80v80H10z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    <circle cx="10" cy="10" r="3" fill="currentColor"/>
                    <circle cx="90" cy="10" r="3" fill="currentColor"/>
                    <circle cx="10" cy="90" r="3" fill="currentColor"/>
                    <circle cx="90" cy="90" r="3" fill="currentColor"/>
                    <circle cx="50" cy="50" r="5" fill="currentColor"/>
                    <path d="M10 10L50 50M90 10L50 50M10 90L50 50M90 90L50 50" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circuit)" className="text-white"/>
              </svg>
            </div>
            
            <div className="relative p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-6">
                  {/* Avatar with Status Ring */}
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/20">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${lead.first_name}+${lead.last_name}&background=7c3aed&color=fff&size=128`} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-2xl font-bold">
                        {lead.first_name[0]}{lead.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0a0a0f] border-2 border-emerald-500">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-white">{lead.first_name} {lead.last_name}</h1>
                      <Badge className={`${temperature.bg} ${temperature.color} border-0 font-medium`}>
                        <temperature.icon className="w-3 h-3 mr-1" />
                        {temperature.label} Lead
                      </Badge>
                    </div>
                    <p className="text-lg text-gray-400 mb-4">{lead.title} at <span className="text-violet-400 font-medium">{lead.company}</span></p>
                    
                    {/* Contact Pills */}
                    <div className="flex flex-wrap items-center gap-3">
                      <a href={`mailto:${lead.email}`} className="flex items-center text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 transition-all border border-white/5 hover:border-violet-500/30 group">
                        <Mail className="w-4 h-4 mr-2 text-violet-400 group-hover:text-violet-300" />
                        <span className="text-sm">{lead.email}</span>
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="flex items-center text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 transition-all border border-white/5 hover:border-emerald-500/30 group">
                          <Phone className="w-4 h-4 mr-2 text-emerald-400 group-hover:text-emerald-300" />
                          <span className="text-sm">{lead.phone}</span>
                        </a>
                      )}
                      {lead.linkedin_url && (
                        <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-300 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 transition-all border border-white/5 hover:border-blue-500/30 group">
                          <Linkedin className="w-4 h-4 mr-2 text-blue-400 group-hover:text-blue-300" />
                          <span className="text-sm">LinkedIn</span>
                        </a>
                      )}
                      {lead.location && (
                        <div className="flex items-center text-gray-400 bg-white/5 rounded-full px-4 py-2 border border-white/5">
                          <MapPin className="w-4 h-4 mr-2 text-amber-400" />
                          <span className="text-sm">{lead.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Side Actions */}
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-3">
                    {getEnrichmentStatusBadge(lead.enrichment_status)}
                    <Button 
                      onClick={handleEnrich} 
                      disabled={enriching}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 border-0 font-medium"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {enriching ? 'Enriching...' : 'AI Enrich'}
                    </Button>
                  </div>
                  
                  {/* Lead Score */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 min-w-[140px]">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lead Score</div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-white">{leadScore}</span>
                      <span className="text-gray-500 text-sm mb-1">/100</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000"
                        style={{ width: `${leadScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
                <TabsList className="grid w-full grid-cols-4 bg-white/[0.02] p-1.5 gap-1 border-b border-white/5">
                  <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600/20 data-[state=active]:to-fuchsia-600/20 data-[state=active]:text-white data-[state=active]:border-violet-500/30 text-gray-500 font-medium transition-all border border-transparent">
                    <Cpu className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="campaigns" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600/20 data-[state=active]:to-fuchsia-600/20 data-[state=active]:text-white data-[state=active]:border-violet-500/30 text-gray-500 font-medium transition-all border border-transparent">
                    <Rocket className="w-4 h-4 mr-2" />
                    Campaigns
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600/20 data-[state=active]:to-fuchsia-600/20 data-[state=active]:text-white data-[state=active]:border-violet-500/30 text-gray-500 font-medium transition-all border border-transparent">
                    <Activity className="w-4 h-4 mr-2" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="enriched" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600/20 data-[state=active]:to-fuchsia-600/20 data-[state=active]:text-white data-[state=active]:border-violet-500/30 text-gray-500 font-medium transition-all border border-transparent">
                    <CircuitBoard className="w-4 h-4 mr-2" />
                    Data
                  </TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-6 mt-0">
                    {/* AI Enrichment Summary */}
                    {lead.enriched_data && (
                      <div className="rounded-2xl bg-gradient-to-br from-violet-600/10 to-fuchsia-600/5 border border-violet-500/20 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-violet-500/20 rounded-xl">
                              <Sparkles className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">AI Enrichment Data</h3>
                              <p className="text-sm text-gray-400">Powered by {lead.enriched_data.primary_source}</p>
                            </div>
                          </div>
                          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            {Math.round((lead.enriched_data.confidence_score || 0) * 100)}% confidence
                          </Badge>
                        </div>
                        
                        {/* Company Profile */}
                        {lead.enriched_data.company_profile && (
                          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                            <h4 className="font-semibold text-white mb-3 flex items-center">
                              <Building2 className="w-4 h-4 mr-2 text-violet-400" />
                              Company Profile
                            </h4>
                            <p className="text-gray-300 text-sm mb-4 leading-relaxed">{lead.enriched_data.company_profile.description}</p>
                            
                            {lead.enriched_data.company_profile.techStack && (
                              <div className="mb-4">
                                <h5 className="font-medium text-gray-400 mb-2 text-sm">Tech Stack</h5>
                                <div className="flex flex-wrap gap-2">
                                  {lead.enriched_data.company_profile.techStack.map((tech: string, index: number) => (
                                    <Badge key={index} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs font-medium">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Contact & Company Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                            <h4 className="font-semibold text-white mb-3 flex items-center">
                              <div className="p-1.5 bg-violet-500/20 rounded-lg mr-2">
                                <User className="w-3.5 h-3.5 text-violet-400" />
                              </div>
                              Contact Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center text-gray-300">
                                <Mail className="w-4 h-4 mr-3 text-violet-400" />
                                <span>{lead.email}</span>
                              </div>
                              {lead.phone && (
                                <div className="flex items-center text-gray-300">
                                  <Phone className="w-4 h-4 mr-3 text-emerald-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                              {lead.linkedin_url && (
                                <div className="flex items-center">
                                  <Linkedin className="w-4 h-4 mr-3 text-blue-400" />
                                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                    LinkedIn Profile
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                            <h4 className="font-semibold text-white mb-3 flex items-center">
                              <div className="p-1.5 bg-emerald-500/20 rounded-lg mr-2">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              Company Info
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center text-gray-300">
                                <Globe className="w-4 h-4 mr-3 text-emerald-400" />
                                <span className="font-medium">{lead.company}</span>
                              </div>
                              {lead.industry && (
                                <div className="flex items-center text-gray-300">
                                  <BarChart3 className="w-4 h-4 mr-3 text-amber-400" />
                                  <span>{lead.industry}</span>
                                </div>
                              )}
                              {lead.company_size && (
                                <div className="flex items-center text-gray-300">
                                  <User className="w-4 h-4 mr-3 text-cyan-400" />
                                  <span>{lead.company_size} employees</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="enriched" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-500/20 rounded-xl">
                          <CircuitBoard className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Raw Enriched Data</h3>
                          <p className="text-sm text-gray-400">Complete data from AI enrichment</p>
                        </div>
                      </div>
                      
                      {lead.enriched_data ? (
                        <div className="space-y-4">
                          {/* Source Info */}
                          <div className="bg-gradient-to-r from-violet-600/10 to-cyan-600/10 rounded-xl p-5 border border-violet-500/20">
                            <h4 className="font-semibold text-white mb-3 flex items-center">
                              <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
                              Data Source
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Primary</p>
                                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                                  {lead.enriched_data.primary_source || 'Unknown'}
                                </Badge>
                              </div>
                              {lead.enriched_data.confidence_score && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Confidence</p>
                                  <span className="text-white font-medium">{Math.round(lead.enriched_data.confidence_score * 100)}%</span>
                                </div>
                              )}
                              {lead.enriched_data.enrichment_timestamp && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Enriched</p>
                                  <span className="text-gray-300 text-sm">{new Date(lead.enriched_data.enrichment_timestamp).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* All Enriched Fields */}
                          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                            <h4 className="font-semibold text-white mb-4">All Enriched Fields</h4>
                            <div className="space-y-2 text-sm">
                              {Object.entries(lead.enriched_data).map(([key, value]) => {
                                if (key === 'all_sources' || key === 'input_data') return null;
                                if (typeof value === 'object' && value !== null) return null;
                                return (
                                  <div key={key} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                    <span className="text-gray-400 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-white">{String(value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Company Profile if available */}
                          {lead.enriched_data.company_profile && (
                            <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                              <h4 className="font-semibold text-white mb-3 flex items-center">
                                <Building2 className="w-4 h-4 mr-2 text-emerald-400" />
                                Company Profile
                              </h4>
                              {lead.enriched_data.company_profile.description && (
                                <p className="text-sm text-gray-300 mb-3">{lead.enriched_data.company_profile.description}</p>
                              )}
                              {lead.enriched_data.company_profile.techStack && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-gray-400 mb-2">Tech Stack:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {lead.enriched_data.company_profile.techStack.map((tech: string, i: number) => (
                                      <Badge key={i} className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">{tech}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                            
                            {/* Linked Company Data */}
                            {lead.company_data && (
                              <div className="bg-gradient-to-br from-fuchsia-600/10 to-violet-600/5 rounded-xl p-5 border border-fuchsia-500/20 mt-4">
                                <h4 className="font-semibold text-white mb-4 flex items-center">
                                  <div className="p-2 bg-fuchsia-500/20 rounded-lg mr-3">
                                    <Building2 className="w-4 h-4 text-fuchsia-400" />
                                  </div>
                                  Linked Company: {lead.company_data.name || lead.company}
                                </h4>
                                
                                {/* Company Overview */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  {lead.company_data.industry && (
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                      <p className="text-xs text-fuchsia-400 font-medium mb-1">Industry</p>
                                      <p className="text-sm text-white">{lead.company_data.industry}</p>
                                    </div>
                                  )}
                                  {lead.company_data.estimated_num_employees && (
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                      <p className="text-xs text-fuchsia-400 font-medium mb-1">Employees</p>
                                      <p className="text-sm text-white">{lead.company_data.estimated_num_employees.toLocaleString()}</p>
                                    </div>
                                  )}
                                  {lead.company_data.annual_revenue_printed && (
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                      <p className="text-xs text-fuchsia-400 font-medium mb-1">Revenue</p>
                                      <p className="text-sm text-white">{lead.company_data.annual_revenue_printed}</p>
                                    </div>
                                  )}
                                  {lead.company_data.founded_year && (
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                      <p className="text-xs text-fuchsia-400 font-medium mb-1">Founded</p>
                                      <p className="text-sm text-white">{lead.company_data.founded_year}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Description */}
                                {lead.company_data.description && (
                                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">{lead.company_data.description}</p>
                                )}
                                
                                {/* Technologies */}
                                {lead.company_data.technologies && lead.company_data.technologies.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-400 mb-2">Technologies:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {lead.company_data.technologies.slice(0, 15).map((tech: string, i: number) => (
                                        <Badge key={i} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">{tech}</Badge>
                                      ))}
                                      {lead.company_data.technologies.length > 15 && (
                                        <Badge className="bg-white/10 text-gray-300 border-white/20 text-xs">+{lead.company_data.technologies.length - 15} more</Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Keywords */}
                                {lead.company_data.keywords && lead.company_data.keywords.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-400 mb-2">Keywords:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {lead.company_data.keywords.slice(0, 10).map((keyword: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-violet-300 border-violet-500/30 text-xs">{keyword}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Location */}
                                {(lead.company_data.city || lead.company_data.country) && (
                                  <div className="flex items-center text-sm text-gray-400 mb-4">
                                    <MapPin className="w-3.5 h-3.5 mr-2 text-amber-400" />
                                    {[lead.company_data.city, lead.company_data.state, lead.company_data.country].filter(Boolean).join(', ')}
                                  </div>
                                )}
                                
                                {/* Social Links */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {lead.company_data.website_url && (
                                    <a href={lead.company_data.website_url} target="_blank" rel="noopener noreferrer" 
                                       className="inline-flex items-center text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-violet-500/30 transition-all">
                                      <Globe className="w-3 h-3 mr-1.5 text-violet-400" /> Website
                                    </a>
                                  )}
                                  {lead.company_data.linkedin_url && (
                                    <a href={lead.company_data.linkedin_url} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all">
                                      <Linkedin className="w-3 h-3 mr-1.5 text-blue-400" /> LinkedIn
                                    </a>
                                  )}
                                  {lead.company_data.twitter_url && (
                                    <a href={lead.company_data.twitter_url} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all">
                                      <ExternalLink className="w-3 h-3 mr-1.5 text-cyan-400" /> Twitter
                                    </a>
                                  )}
                                </div>
                                
                                {/* Enrichment Source */}
                                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                                  Source: <span className="text-fuchsia-400">{lead.company_data.enrichment_source || 'apollo'}</span>
                                  {lead.company_data.enriched_at && <span> • Enriched: {new Date(lead.company_data.enriched_at).toLocaleDateString()}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <CircuitBoard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 mb-4">No enrichment data available yet</p>
                            <Button 
                              onClick={handleEnrich}
                              disabled={enriching}
                              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0"
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              {enriching ? 'Enriching...' : 'AI Enrich This Lead'}
                            </Button>
                          </div>
                        )}
                      </div>
                  </TabsContent>

                  <TabsContent value="campaigns" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-fuchsia-500/20 rounded-xl">
                            <Rocket className="w-5 h-5 text-fuchsia-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Campaign History</h3>
                            <p className="text-sm text-gray-400">Active sequences and outreach</p>
                          </div>
                        </div>
                      </div>
                      
                      {campaigns.length > 0 ? (
                        <div className="space-y-4">
                          {campaigns.map((campaign) => (
                            <div key={campaign.id} className="p-5 bg-white/5 rounded-xl border border-white/10 hover:border-violet-500/30 transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-white">{campaign.name}</h4>
                                <Badge className={
                                  campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                  campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }>
                                  {campaign.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                                  {campaign.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-5 gap-3 text-center">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center justify-center mb-1">
                                    <Send className="w-3 h-3 text-emerald-400 mr-1" />
                                    <span className="text-xl font-bold text-white">{campaign.stats.sent}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Sent</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center justify-center mb-1">
                                    <Eye className="w-3 h-3 text-cyan-400 mr-1" />
                                    <span className="text-xl font-bold text-white">{campaign.stats.opens}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Opens</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center justify-center mb-1">
                                    <MousePointer className="w-3 h-3 text-violet-400 mr-1" />
                                    <span className="text-xl font-bold text-white">{campaign.stats.clicks}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Clicks</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center justify-center mb-1">
                                    <MessageSquare className="w-3 h-3 text-fuchsia-400 mr-1" />
                                    <span className="text-xl font-bold text-white">{campaign.stats.replies}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Replies</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                  <div className="flex items-center justify-center mb-1">
                                    <Clock className="w-3 h-3 text-amber-400 mr-1" />
                                    <span className="text-xl font-bold text-white">{campaign.stats.queued}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Queued</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-4">
                                Started: {new Date(campaign.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                          <Rocket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400 mb-4">Not part of any campaigns yet</p>
                          <Link href="/dashboard/campaigns/new">
                            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                              <Zap className="w-4 h-4 mr-2" />
                              Create Campaign
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/20 rounded-xl">
                          <Activity className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Activity Timeline</h3>
                          <p className="text-sm text-gray-400">All interactions and events</p>
                        </div>
                      </div>
                      
                      {isResearchOrTrial() ? (
                        <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                              <Lock className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Activity Tracking</p>
                              <p className="text-xs text-gray-400">Upgrade to Live Outreach to track email opens, clicks, and replies</p>
                            </div>
                          </div>
                          <Link href="/pricing">
                            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade
                            </Button>
                          </Link>
                        </div>
                      ) : activities.length > 0 ? (
                        <div className="space-y-3">
                          {activities.map((activity) => {
                            const isExpanded = expandedActivities.has(activity.id);
                            const hasExpandableContent = 
                              ((activity.type === 'email_sent' || activity.type === 'email_scheduled') && activity.metadata?.body) ||
                              (activity.type === 'reply_received' && (activity.metadata?.summary || activity.metadata?.raw_email_data));
                            
                            return (
                              <div key={activity.id} className="rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/30 transition-all">
                                <div 
                                  className={`flex items-start space-x-3 p-4 ${hasExpandableContent ? 'cursor-pointer' : ''}`}
                                  onClick={() => hasExpandableContent && toggleActivityExpanded(activity.id)}
                                >
                                  <div className="flex-shrink-0 mt-0.5 p-2 bg-white/10 rounded-lg">
                                    {getActivityIcon(activity.type)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-white">{activity.description}</p>
                                      {hasExpandableContent && (
                                        <div className="flex-shrink-0 ml-2">
                                          {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-500" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Sentiment badge for replies */}
                                    {activity.type === 'reply_received' && activity.metadata?.sentiment && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge className={`text-xs ${
                                          activity.metadata.sentiment === 'positive' || activity.metadata.sentiment === 'interested' 
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                            : activity.metadata.sentiment === 'negative' || activity.metadata.sentiment === 'not_interested'
                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                            : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        }`}>
                                          {activity.metadata.sentiment === 'positive' || activity.metadata.sentiment === 'interested' ? (
                                            <ThumbsUp className="w-3 h-3 mr-1" />
                                          ) : activity.metadata.sentiment === 'negative' || activity.metadata.sentiment === 'not_interested' ? (
                                            <ThumbsDown className="w-3 h-3 mr-1" />
                                          ) : null}
                                          {activity.metadata.sentiment}
                                        </Badge>
                                        {activity.metadata.action && (
                                          <Badge className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                                            {activity.metadata.action}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-500 mt-2">
                                      {new Date(activity.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Expandable content */}
                                {isExpanded && hasExpandableContent && (
                                  <div className="px-4 pb-4 pt-3 border-t border-white/10 bg-white/[0.02]">
                                      {/* Email sent/scheduled content */}
                                      {(activity.type === 'email_sent' || activity.type === 'email_scheduled') && activity.metadata?.body && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium text-gray-400 mb-2">Subject: {activity.metadata.subject || 'No subject'}</p>
                                          <div className="text-sm text-gray-300 whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/10">
                                            {activity.metadata.body}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Reply content */}
                                      {activity.type === 'reply_received' && (
                                        <div className="mt-2 space-y-3">
                                          {activity.metadata?.summary && (
                                            <div>
                                              <p className="text-xs font-medium text-violet-400 mb-2">AI Summary:</p>
                                              <p className="text-sm text-gray-300 bg-violet-500/10 p-3 rounded-lg border border-violet-500/20">
                                                {activity.metadata.summary}
                                              </p>
                                            </div>
                                          )}
                                          {activity.metadata?.raw_email_data?.data?.body && (
                                            <div>
                                              <p className="text-xs font-medium text-gray-400 mb-2">Original Email:</p>
                                              <div className="text-sm text-gray-300 whitespace-pre-wrap bg-white/5 p-3 rounded-lg border border-white/10 max-h-64 overflow-y-auto">
                                                {activity.metadata.raw_email_data.data.body}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No activity recorded yet</p>
                          </div>
                        )}
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Lead Intelligence */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Lead Intelligence</h3>
                </div>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  {getEnrichmentStatusBadge(lead.enrichment_status)}
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Created</span>
                  <span className="text-white font-medium">{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
                {lead.industry && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Industry</span>
                      <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">{lead.industry}</Badge>
                    </div>
                  </>
                )}
                {lead.company_size && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Company Size</span>
                      <span className="text-white font-medium">{lead.company_size}</span>
                    </div>
                  </>
                )}
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Engagement</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-emerald-400 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Automation Status */}
            <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 rounded-2xl border border-violet-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CircuitBoard className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-white">Automation</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  Active
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Next action</span>
                  <span className="text-white">Follow-up email</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Scheduled</span>
                  <span className="text-cyan-400">In 2 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
