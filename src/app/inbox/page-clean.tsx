'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Star,
  StarOff,
  Mail,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

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
  const [inboxStats, setInboxStats] = useState<InboxStats>({
    totalConversations: 0,
    autoReplied: 0,
    needsAttention: 0,
    positiveResponses: 0,
    responseRate: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'auto_replied' | 'needs_attention' | 'positive'>('all');

  // Create Supabase client with proper error handling
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Clear corrupted Supabase cookies
  const clearSupabaseCookies = () => {
    try {
      // Clear all cookies that might contain corrupted data
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token', 
        'supabase-auth-token',
        'supabase.auth.token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });

      // Clear localStorage and sessionStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });

      console.log('Cleared all Supabase storage');
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  };

  useEffect(() => {
    const initializeInbox = async () => {
      try {
        // Clear any corrupted cookies first
        clearSupabaseCookies();
        
        // Small delay to ensure cleanup completes
        setTimeout(() => {
          fetchEmailThreads();
          fetchStats();
        }, 100);
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
      }
    };

    initializeInbox();
  }, []);

  const fetchEmailThreads = async () => {
    try {
      console.log('Fetching email threads from database...');
      
      // Fetch email threads from Supabase without user filtering for demo
      const { data: repliesData, error: repliesError } = await supabase
        .from('replies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
        console.log('Showing mock data due to database error');
        showMockData();
        return;
      }

      // Process the fetched data if we have replies
      if (repliesData && repliesData.length > 0) {
        console.log(`Found ${repliesData.length} replies in database`);

        // For each reply, get the corresponding AI response from sent_emails
        const threadsWithResponses = await Promise.all(
          repliesData.map(async (reply: any) => {
            // Get AI response sent after this reply was created
            const { data: aiResponse } = await supabase
              .from('sent_emails')
              .select('*')
              .eq('thread_id', reply.thread_id)
              .eq('campaign_type', 'automated_reply')
              .gte('sent_at', reply.created_at)
              .order('sent_at', { ascending: true })
              .limit(1)
              .single();

            // Extract email content from raw_response if available
            const rawResponse = reply.raw_response || {};
            const emailSubject = rawResponse.subject || `Reply from ${reply.sender_email}`;
            const emailBody = rawResponse.body || rawResponse.content || 'No content available';

            return {
              reply,
              aiResponse,
              emailSubject,
              emailBody
            };
          })
        );

        // Transform to EmailThread format based on actual schema
        const emailThreads: EmailThread[] = threadsWithResponses.map(({ reply, aiResponse, emailSubject, emailBody }) => ({
          id: reply.id.toString(),
          lead_id: reply.lead_id || '',
          lead_name: reply.raw_response?.sender_name || reply.sender_email?.split('@')[0] || 'Unknown Lead',
          lead_email: reply.sender_email || 'unknown@email.com',
          lead_company: reply.raw_response?.company || 'Unknown Company',
          thread_subject: emailSubject,
          
          lead_reply: {
            content: emailBody,
            received_at: reply.created_at,
            sentiment: reply.sentiment || 'neutral'
          },
          
          ai_analysis: {
            action_taken: reply.action || 'no_action',
            summary: reply.summary || 'No analysis available',
            confidence: 0.85
          },
          
          ai_response: aiResponse ? {
            content: aiResponse.body,
            sent_at: aiResponse.sent_at,
            status: aiResponse.status === 'sent' ? 'sent' : 'failed'
          } : reply.next_step_prompt ? {
            content: reply.next_step_prompt,
            sent_at: reply.created_at,
            status: 'sent'
          } : null,
          
          status: reply.action ? 'active' : 'paused',
          is_starred: false,
          requires_attention: !reply.action || reply.action === 'reply',
          last_activity: aiResponse?.sent_at || reply.created_at
        }));

        setEmailThreads(emailThreads);
        console.log(`Processed ${emailThreads.length} email threads`);
      } else {
        console.log('No replies found in database, showing mock data');
        showMockData();
      }
    } catch (error) {
      console.error('Error fetching email threads:', error);
      showMockData();
    } finally {
      setLoading(false);
    }
  };

  const showMockData = () => {
    const mockThreads: EmailThread[] = [
      {
        id: '1',
        lead_id: 'lead1',
        lead_name: 'Alex Carter',
        lead_email: 'alex@acme.com',
        lead_company: 'Acme Inc',
        thread_subject: 'Re: Demo request - very interested!',
        lead_reply: {
          content: 'Hi! Thanks for the quick response. I watched your demo video and I\'m really impressed. Our team of 50 sales reps is struggling with lead qualification and we think your AI solution could be a game-changer. Can we schedule a call this week to discuss pricing and implementation timeline?',
          received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          sentiment: 'positive'
        },
        ai_analysis: {
          action_taken: 'schedule_call',
          summary: 'High-intent lead requesting demo call with specific pain points and timeline questions',
          confidence: 0.95
        },
        ai_response: {
          content: 'Hi Alex! I\'m thrilled to hear you\'re impressed with our demo. Your team\'s lead qualification challenges are exactly what our AI SDR platform excels at solving.\n\nI\'d love to schedule a call to discuss how we can help your 50-person sales team and go over our pricing options. I have availability:\n\n• Tomorrow (Tuesday) at 2:00 PM or 4:00 PM EST\n• Wednesday at 10:00 AM or 3:00 PM EST\n\nWhich time works best for you? I\'ll send a calendar invite right away.\n\nLooking forward to our conversation!\n\nBest regards,\nAI SDR Assistant',
          sent_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          status: 'sent'
        },
        status: 'active',
        is_starred: true,
        requires_attention: false,
        last_activity: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: '2',
        lead_id: 'lead2',
        lead_name: 'Mike Johnson',
        lead_email: 'mike@techcorp.com',
        lead_company: 'TechCorp',
        thread_subject: 'Re: Concerns about AI implementation',
        lead_reply: {
          content: 'I appreciate the outreach, but we\'ve had bad experiences with AI tools before. They promised a lot but didn\'t deliver. How do I know this won\'t be another waste of time and money?',
          received_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          sentiment: 'skeptical'
        },
        ai_analysis: {
          action_taken: 'reply',
          summary: 'Lead expressing skepticism due to past bad experiences with AI tools, needs reassurance',
          confidence: 0.88
        },
        ai_response: {
          content: 'Hi Mike,\n\nI completely understand your concern - you\'re absolutely right to be cautious after a bad experience.\n\nHere\'s what sets us apart:\n\n**Proven Results:**\n• 127% average increase in qualified leads\n• 89% of customers see ROI within 60 days\n• 98% customer retention rate\n\n**Risk-Free Trial:**\n• 30-day money-back guarantee\n• No long-term contracts required\n• Start with just 100 leads to test\n\nWould you be open to a 15-minute call where I can show you exactly how it works and address your specific concerns?\n\nBest regards,\nAI SDR Assistant',
          sent_at: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString(),
          status: 'sent'
        },
        status: 'active',
        is_starred: false,
        requires_attention: true,
        last_activity: new Date(Date.now() - 1000 * 60 * 60 * 3.5).toISOString()
      }
    ];
    setEmailThreads(mockThreads);
  };

  const fetchStats = async () => {
    try {
      // Fetch basic stats from database
      const { data: repliesData, error } = await supabase
        .from('replies')
        .select('action, sentiment')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stats:', error);
        // Set default stats
        setInboxStats({
          totalConversations: 2,
          autoReplied: 2,
          needsAttention: 1,
          positiveResponses: 1,
          responseRate: 100
        });
        return;
      }

      const total = repliesData?.length || 0;
      const autoReplied = repliesData?.filter(r => r.action && r.action !== 'no_action').length || 0;
      const needsAttention = repliesData?.filter(r => !r.action || r.action === 'reply').length || 0;
      const positive = repliesData?.filter(r => r.sentiment === 'positive' || r.sentiment === 'interested').length || 0;
      const responseRate = total > 0 ? Math.round((autoReplied / total) * 100) : 0;

      setInboxStats({
        totalConversations: total || 2,
        autoReplied: autoReplied || 2,
        needsAttention: needsAttention || 1,
        positiveResponses: positive || 1,
        responseRate: responseRate || 100
      });
    } catch (error) {
      console.error('Error in stats:', error);
      setInboxStats({
        totalConversations: 2,
        autoReplied: 2,
        needsAttention: 1,
        positiveResponses: 1,
        responseRate: 100
      });
    }
  };

  const filteredThreads = emailThreads.filter(thread => {
    const matchesSearch = searchQuery === '' || 
      thread.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lead_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.thread_subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'auto_replied') return matchesSearch && thread.ai_response;
    if (filter === 'needs_attention') return matchesSearch && thread.requires_attention;
    if (filter === 'positive') return matchesSearch && thread.lead_reply.sentiment === 'positive';
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading inbox...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Reply Inbox</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inboxStats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Replied</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inboxStats.autoReplied}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inboxStats.needsAttention}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Responses</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inboxStats.positiveResponses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{inboxStats.responseRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by lead name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'auto_replied' ? 'default' : 'outline'}
            onClick={() => setFilter('auto_replied')}
            size="sm"
          >
            Auto-Replied
          </Button>
          <Button
            variant={filter === 'needs_attention' ? 'default' : 'outline'}
            onClick={() => setFilter('needs_attention')}
            size="sm"
          >
            Needs Attention
          </Button>
          <Button
            variant={filter === 'positive' ? 'default' : 'outline'}
            onClick={() => setFilter('positive')}
            size="sm"
          >
            Positive
          </Button>
        </div>
      </div>

      {/* Email Threads */}
      <div className="space-y-4">
        {filteredThreads.map((thread) => (
          <Card key={thread.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{thread.lead_name}</h3>
                    <Badge variant="outline">{thread.lead_company}</Badge>
                    <Badge 
                      variant={thread.lead_reply.sentiment === 'positive' ? 'default' : 
                              thread.lead_reply.sentiment === 'skeptical' ? 'destructive' : 'secondary'}
                    >
                      {thread.lead_reply.sentiment}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{thread.lead_email}</p>
                  <p className="font-medium">{thread.thread_subject}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {thread.requires_attention && (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  {thread.status === 'active' ? (
                    <Play className="h-4 w-4 text-green-500" />
                  ) : (
                    <Pause className="h-4 w-4 text-gray-500" />
                  )}
                  <Button variant="ghost" size="sm">
                    {thread.is_starred ? <Star className="h-4 w-4 fill-yellow-400" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Lead's Reply */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Lead's Reply</span>
                  <span className="text-xs text-gray-500">
                    {new Date(thread.lead_reply.received_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{thread.lead_reply.content}</p>
              </div>

              {/* AI Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">AI Analysis</span>
                  <Badge variant="outline">{thread.ai_analysis.action_taken}</Badge>
                  <span className="text-xs text-gray-500">
                    {Math.round(thread.ai_analysis.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm">{thread.ai_analysis.summary}</p>
              </div>

              {/* AI Response */}
              {thread.ai_response && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">AI Response Sent</span>
                    <Badge variant={thread.ai_response.status === 'sent' ? 'default' : 'destructive'}>
                      {thread.ai_response.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(thread.ai_response.sent_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-line">{thread.ai_response.content}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-xs text-gray-500">
                  Last activity: {new Date(thread.last_activity).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Thread
                  </Button>
                  <Button variant="outline" size="sm">
                    Manual Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredThreads.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No email threads found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
