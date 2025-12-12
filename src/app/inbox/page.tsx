'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Bot,
  Mail,
  RefreshCw
} from 'lucide-react';

interface EmailThread {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  lead_company: string;
  thread_subject: string;
  lead_reply: {
    content: string;
    received_at: string;
    sentiment: string;
  };
  ai_analysis: {
    action_taken: string;
    summary: string;
    confidence: number;
  };
  ai_response: {
    content: string;
    sent_at: string;
    status: string;
  } | null;
  status: 'active' | 'paused';
  is_starred: boolean;
  requires_attention: boolean;
  last_activity: string;
}

interface InboxStats {
  totalConversations: number;
  autoReplied: number;
  needsAttention: number;
  positiveResponses: number;
  responseRate: number;
}

export default function InboxPage() {
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [inboxStats, setInboxStats] = useState<InboxStats>({
    totalConversations: 0,
    autoReplied: 0,
    needsAttention: 0,
    positiveResponses: 0,
    responseRate: 0
  });

  // Mock data for fallback
  const mockReplies: EmailThread[] = [
    {
      id: '1',
      lead_id: '1',
      lead_name: 'John Smith',
      lead_email: 'john@techcorp.com',
      lead_company: 'TechCorp Inc',
      thread_subject: 'Re: Quick Chat About Your Sales Pipeline?',
      lead_reply: {
        content: 'Hi Chris, thanks for reaching out! I\'m actually very interested in learning more about how you can help us improve our lead generation. We\'ve been struggling with our current process and could definitely use some help. Would you be available for a 15-minute call this week?',
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentiment: 'interested'
      },
      ai_analysis: {
        action_taken: 'schedule_call',
        summary: 'Lead is very interested and wants to schedule a call this week. Mentioned struggling with current lead generation process.',
        confidence: 0.95
      },
      ai_response: {
        content: 'Great to hear you\'re interested, John! I\'d be happy to show you how we can improve your lead generation process. I have availability Tuesday at 2 PM or Wednesday at 3 PM EST. Which works better for you?',
        sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      },
      status: 'active',
      is_starred: false,
      requires_attention: false,
      last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      lead_id: '2',
      lead_name: 'Sarah Wilson',
      lead_email: 'sarah@cloudtech.com',
      lead_company: 'CloudTech Solutions',
      thread_subject: 'Re: Boost Your Marketing ROI',
      lead_reply: {
        content: 'Hi, I appreciate you reaching out, but we\'ve had some bad experiences with marketing agencies in the past. The last company we worked with promised great results but didn\'t deliver. How is your approach different?',
        received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral'
      },
      ai_analysis: {
        action_taken: 'reply',
        summary: 'Lead has objections based on past bad experiences with agencies. Asking about approach and guarantees.',
        confidence: 0.88
      },
      ai_response: {
        content: 'I completely understand your concerns, Sarah. Bad experiences with agencies are unfortunately common. What makes us different is our transparent, data-driven approach. We start with a small pilot to prove results before any major commitment. Would you be open to a brief 10-minute call where I can share some case studies?',
        sent_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      },
      status: 'active',
      is_starred: false,
      requires_attention: false,
      last_activity: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      lead_id: '3',
      lead_name: 'Lisa Anderson',
      lead_email: 'lisa@retailmax.com',
      lead_company: 'RetailMax',
      thread_subject: 'Re: Increase Your E-commerce Sales',
      lead_reply: {
        content: 'Hi Chris, your email caught my attention. Can you tell me more about your specific experience with e-commerce companies? What kind of results have you achieved for businesses similar to ours? Also, what\'s your typical engagement process and pricing structure?',
        received_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral'
      },
      ai_analysis: {
        action_taken: 'reply',
        summary: 'Lead is asking for more information about experience, results, process, and pricing. Shows interest but needs more details.',
        confidence: 0.92
      },
      ai_response: null, // This one hasn't been replied to yet
      status: 'active',
      is_starred: false,
      requires_attention: true,
      last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  const showMockData = () => {
    console.log('Showing mock data for demonstration');
    setEmailThreads(mockReplies);
    calculateStats(mockReplies);
  };

  // Function to extract just the new reply content, removing quoted text
  const extractReplyContent = (emailBody: string): string => {
    if (!emailBody) return 'No message content';
    
    // Remove HTML tags first
    let cleanText = emailBody.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    cleanText = cleanText
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    // Split by common reply separators
    const separators = [
      'On ', // "On Sun, 10 Aug 2025, 1:37 pm"
      '-----Original Message-----',
      'From:',
      '________________________________',
      '> ', // Quoted lines starting with >
    ];
    
    let replyContent = cleanText;
    
    // Find the first occurrence of any separator and cut there
    for (const separator of separators) {
      const index = replyContent.indexOf(separator);
      if (index !== -1) {
        replyContent = replyContent.substring(0, index);
        break;
      }
    }
    
    // Clean up whitespace and return
    return replyContent.trim() || 'No message content';
  };

  const fetchEmailThreads = async () => {
    try {
      setLoading(true);
      console.log('Initializing Supabase client...');
      
      // Initialize Supabase with proper auth
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        showMockData();
        return;
      }
      
      console.log('Fetching replies for user:', user.id);
      const { data: repliesData, error: repliesError } = await supabase
        .from('replies')
        .select(`
          id,
          user_id,
          message_id,
          thread_id,
          lead_id,
          sender_email,
          sentiment,
          action,
          summary,
          next_step_prompt,
          raw_response,
          raw_email_data,
          conversation_id,
          priority,
          lead_temperature,
          auto_reply_sent,
          auto_reply_sent_at,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      console.log('Enhanced replies query result:', { repliesData, repliesError });
      
      if (repliesError) {
        console.error('Error fetching enhanced replies:', repliesError);
        showMockData();
        return;
      }
      
      console.log('Enhanced replies data length:', repliesData?.length || 0);
      if (repliesData && repliesData.length > 0) {
        console.log('Sample enhanced reply:', repliesData[0]);
        
        // Fetch lead data for company names
        const leadIds = repliesData
          .filter((r: any) => r.lead_id)
          .map((r: any) => r.lead_id);
        
        let leadsMap: Record<string, any> = {};
        if (leadIds.length > 0) {
          const { data: leadsData } = await supabase
            .from('leads')
            .select('id, first_name, last_name, company')
            .in('id', leadIds);
          
          if (leadsData) {
            leadsData.forEach((lead: any) => {
              leadsMap[lead.id] = lead;
            });
          }
        }
        
        const transformedReplies = repliesData.map((reply: any) => {
          // Get lead data if available
          const lead = reply.lead_id ? leadsMap[reply.lead_id] : null;
          
          // Extract sender name from lead data, email data, or use email as fallback
          const senderName = lead 
            ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() 
            : reply.raw_email_data?.data?.from?.[0]?.name || 
              reply.sender_email?.split('@')[0] || 
              'Unknown Lead';
          
          const leadCompany = lead?.company || 'Unknown Company';
          
          return {
            id: reply.id.toString(),
            lead_id: reply.lead_id?.toString() || '',
            lead_name: senderName,
            lead_email: reply.sender_email || 'unknown@email.com',
            lead_company: leadCompany,
            thread_subject: reply.raw_email_data?.data?.subject || `Reply from ${reply.sender_email}`,
            lead_reply: {
              content: extractReplyContent(reply.raw_email_data?.data?.body || reply.summary || ''),
              received_at: reply.created_at,
              sentiment: reply.sentiment || 'neutral'
            },
            ai_analysis: {
              action_taken: reply.action || 'no_action',
              summary: reply.summary || 'No analysis available',
              confidence: 0.8
            },
            ai_response: reply.auto_reply_sent ? {
              content: reply.next_step_prompt || 'No response generated',
              sent_at: reply.auto_reply_sent_at || reply.created_at,
              status: 'sent'
            } : null,
            status: 'active' as const,
            is_starred: false,
            requires_attention: !reply.auto_reply_sent,
            last_activity: reply.created_at
          };
        });
        
        setEmailThreads(transformedReplies);
        calculateStats(transformedReplies);
        console.log('Processed', transformedReplies.length, 'enhanced email threads');
      } else {
        console.log('No enhanced replies found, using mock data');
        showMockData();
      }
    } catch (error) {
      console.error('Error in fetchEmailThreads:', error);
      showMockData();
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (threads: EmailThread[]) => {
    const stats = {
      totalConversations: threads.length,
      autoReplied: threads.filter(t => t.ai_response).length,
      needsAttention: threads.filter(t => t.requires_attention).length,
      positiveResponses: threads.filter(t => t.lead_reply.sentiment === 'interested' || t.lead_reply.sentiment === 'positive').length,
      responseRate: threads.length > 0 ? Math.round((threads.filter(t => t.ai_response).length / threads.length) * 100) : 0
    };
    setInboxStats(stats);
  };

  useEffect(() => {
    fetchEmailThreads();
  }, []);

  const filteredThreads = emailThreads.filter(thread => {
    const matchesSearch = !searchQuery || 
      thread.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lead_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lead_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.thread_subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' ||
      (filter === 'needs_attention' && thread.requires_attention) ||
      (filter === 'replied' && thread.ai_response) ||
      (filter === 'positive' && (thread.lead_reply.sentiment === 'interested' || thread.lead_reply.sentiment === 'positive'));
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Inbox</h1>
              <p className="text-gray-400 mt-1">Automated conversation management</p>
            </div>
          </div>
          <Button onClick={fetchEmailThreads} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group relative bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500/20 to-violet-600/10 rounded-xl border border-violet-500/20">
                <MessageSquare className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-sm text-gray-500">Total Conversations</span>
            </div>
            <div className="text-4xl font-bold text-white">{inboxStats.totalConversations}</div>
          </div>
        </div>

        <div className="group relative bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-500">Auto Replied</span>
            </div>
            <div className="text-4xl font-bold text-emerald-400">{inboxStats.autoReplied}</div>
          </div>
        </div>

        <div className="group relative bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-gray-500">Needs Attention</span>
            </div>
            <div className="text-4xl font-bold text-amber-400">{inboxStats.needsAttention}</div>
          </div>
        </div>

        <div className="group relative bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl border border-cyan-500/20">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm text-gray-500">Response Rate</span>
            </div>
            <div className="text-4xl font-bold text-cyan-400">{inboxStats.responseRate}%</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-11 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="all" className="bg-[#12121a]">All Conversations</option>
              <option value="needs_attention" className="bg-[#12121a]">Needs Attention</option>
              <option value="replied" className="bg-[#12121a]">Auto Replied</option>
              <option value="positive" className="bg-[#12121a]">Positive Responses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Email Threads */}
      <div className="space-y-4">
        {filteredThreads.map((thread) => (
          <div key={thread.id} className="group relative bg-white/[0.03] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all duration-300 overflow-hidden">
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-fuchsia-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-violet-400">
                        {thread.lead_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{thread.lead_name}</h3>
                      <span className="text-sm text-gray-500">{thread.lead_company}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-1 ml-13">{thread.lead_email}</p>
                  <p className="text-sm font-medium text-gray-300 ml-13">{thread.thread_subject}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(thread.lead_reply.received_at).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-gray-600">
                    {new Date(thread.lead_reply.received_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
              <Badge 
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  thread.lead_reply.sentiment === 'positive' || thread.lead_reply.sentiment === 'interested' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : thread.lead_reply.sentiment === 'negative' || thread.lead_reply.sentiment === 'not_interested'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}
              >
                {thread.lead_reply.sentiment}
              </Badge>
              
              <Badge 
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  thread.ai_analysis.action_taken === 'schedule_call' 
                    ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' 
                    : thread.ai_analysis.action_taken === 'reply'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                }`}
              >
                {thread.ai_analysis.action_taken.replace('_', ' ')}
              </Badge>
              
              {thread.requires_attention && (
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 text-xs font-medium rounded-full">
                  Needs Attention
                </Badge>
              )}
              
              {thread.ai_response && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 text-xs font-medium rounded-full">
                  AI Replied
                </Badge>
              )}
            </div>

            {/* Lead's Reply */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="font-medium text-white">Lead Reply</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {thread.lead_reply.content}
              </p>
            </div>

            {/* AI Analysis */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-amber-300">AI Analysis</span>
              </div>
              <p className="text-amber-200/80 text-sm leading-relaxed">
                {thread.ai_analysis.summary}
              </p>
              <div className="mt-2 pt-2 border-t border-amber-500/20">
                <span className="text-xs text-amber-400/70">
                  Action: {thread.ai_analysis.action_taken.replace('_', ' ')} • Confidence: {Math.round(thread.ai_analysis.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* AI Response */}
            {thread.ai_response ? (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-violet-400" />
                    <span className="font-medium text-violet-300">AI Response (Sent)</span>
                  </div>
                  <span className="text-xs text-violet-400/70">
                    Sent {new Date(thread.ai_response.sent_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-violet-200/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {thread.ai_response.content}
                </p>
                <div className="mt-2 pt-2 border-t border-violet-500/20">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    thread.ai_response.status === 'sent' 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : thread.ai_response.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    Status: {thread.ai_response.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span className="font-medium text-amber-300">Awaiting AI Response</span>
                </div>
                <p className="text-amber-200/70 text-sm">
                  This reply requires attention. The AI system will generate and send a response automatically.
                </p>
              </div>
            )}
            </div>
          </div>
        ))}
      </div>

      {filteredThreads.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
            <MessageSquare className="h-10 w-10 text-violet-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No conversations found</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Email replies from leads will appear here once your outreach campaigns start receiving responses.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
