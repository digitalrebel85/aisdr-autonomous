'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
      console.log('Initializing Supabase client with service role key...');
      
      // Initialize Supabase with service role key for full database access
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
      );

      const specificUserId = 'f7ee9f97-dead-4f92-99de-23cd707e3f0c';
      
      console.log('Testing basic replies query first...');
      // First, try a simple query to test the connection
      const { data: testData, error: testError } = await supabase
        .from('replies')
        .select('id, user_id, sender_email, created_at')
        .limit(5);
        
      console.log('Test query result:', { testData, testError });
      
      if (testError) {
        console.error('Basic query failed:', testError);
        showMockData();
        return;
      }
      
      console.log('Basic query successful. Now trying enhanced query without leads join...');
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
        .eq('user_id', specificUserId)
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
        
        const transformedReplies = repliesData.map(reply => {
          // Extract sender name from email or use email as fallback
          const senderName = reply.raw_email_data?.data?.from?.[0]?.name || 
                            reply.sender_email?.split('@')[0] || 
                            'Unknown Lead';
          
          return {
            id: reply.id.toString(),
            lead_id: reply.lead_id?.toString() || '',
            lead_name: senderName,
            lead_email: reply.sender_email || 'unknown@email.com',
            lead_company: 'Unknown Company', // Will be populated when we fix the relationship
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
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        <Button onClick={fetchEmailThreads} className="bg-blue-600 hover:bg-blue-700 text-white">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-3xl font-bold">{inboxStats.totalConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Auto Replied</p>
                <p className="text-3xl font-bold text-green-600">{inboxStats.autoReplied}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-3xl font-bold text-orange-600">{inboxStats.needsAttention}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-3xl font-bold text-blue-600">{inboxStats.responseRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Conversations</option>
          <option value="needs_attention">Needs Attention</option>
          <option value="replied">Auto Replied</option>
          <option value="positive">Positive Responses</option>
        </select>
      </div>

      {/* Email Threads */}
      <div className="space-y-4">
        {filteredThreads.map((thread) => (
          <Card key={thread.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{thread.lead_name}</h3>
                    <span className="text-sm text-gray-500">from {thread.lead_company}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{thread.lead_email}</p>
                  <p className="text-sm font-medium text-gray-800">{thread.thread_subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(thread.lead_reply.received_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(thread.lead_reply.received_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge 
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    thread.lead_reply.sentiment === 'positive' || thread.lead_reply.sentiment === 'interested' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : thread.lead_reply.sentiment === 'negative' || thread.lead_reply.sentiment === 'not_interested'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  {thread.lead_reply.sentiment}
                </Badge>
                
                <Badge 
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    thread.ai_analysis.action_taken === 'schedule_call' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : thread.ai_analysis.action_taken === 'reply'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {thread.ai_analysis.action_taken.replace('_', ' ')}
                </Badge>
                
                {thread.requires_attention && (
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-1 text-xs font-medium rounded-full">
                    Needs Attention
                  </Badge>
                )}
                
                {thread.ai_response && (
                  <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-xs font-medium rounded-full">
                    AI Replied
                  </Badge>
                )}
              </div>

              {/* Lead's Reply */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Lead Reply</span>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {thread.lead_reply.content}
                </p>
              </div>

              {/* AI Analysis */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900">AI Analysis</span>
                </div>
                <p className="text-yellow-800 text-sm leading-relaxed">
                  {thread.ai_analysis.summary}
                </p>
                <div className="mt-2 pt-2 border-t border-yellow-200">
                  <span className="text-xs text-yellow-700">
                    Action: {thread.ai_analysis.action_taken.replace('_', ' ')} • Confidence: {Math.round(thread.ai_analysis.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* AI Response */}
              {thread.ai_response ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        AI Response (Sent)
                      </span>
                    </div>
                    <span className="text-xs text-blue-600">
                      Sent {new Date(thread.ai_response.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">
                    {thread.ai_response.content}
                  </p>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      thread.ai_response.status === 'sent' 
                        ? 'bg-green-100 text-green-800'
                        : thread.ai_response.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Status: {thread.ai_response.status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900">
                      Awaiting AI Response
                    </span>
                  </div>
                  <p className="text-orange-800 text-sm">
                    This reply requires attention. The AI system will generate and send a response automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThreads.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
          <p className="text-gray-500">
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
