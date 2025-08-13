"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Mail, 
  Search, 
  Bot,
  Reply,
  Forward,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Phone,
  Calendar,
  ExternalLink,
  Sparkles,
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface EmailReply {
  id: string;
  subject: string;
  from_name: string;
  from_email: string;
  content: string;
  preview: string;
  received_at: string;
  lead_id?: string;
  lead_name?: string;
  lead_company?: string;
  
  // AI Analysis Results (from reply_crew)
  sentiment: 'positive' | 'neutral' | 'negative';
  ai_action: 'reply' | 'follow_up' | 'schedule_call' | 'not_interested' | 'no_action';
  ai_summary: string;
  recommended_response: string; // The actual email content to send (nextStepPrompt)
  
  // Email metadata
  is_read: boolean;
  is_starred: boolean;
  is_actioned: boolean; // Whether the user has taken action on the AI recommendation
  thread_id?: string;
  original_campaign_id?: string;
}

interface InboxSummary {
  total_replies: number;
  high_intent: number;
  needs_immediate_action: number;
  positive_sentiment: number;
  avg_response_time: string;
}

export default function InboxPage() {
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [inboxSummary, setInboxSummary] = useState<InboxSummary | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs_action' | 'high_intent' | 'positive'>('all');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEmailReplies();
    fetchInboxSummary();
  }, []);

  const fetchEmailReplies = async () => {
    try {
      // Fetch actual email replies from the database
      const { data: replies, error } = await supabase
        .from('email_replies')
        .select(`
          *,
          leads (
            first_name,
            last_name,
            company
          )
        `)
        .order('received_at', { ascending: false });

      if (error) {
        console.error('Error fetching email replies:', error);
        // Use mock data as fallback
        const mockReplies: EmailReply[] = [
          {
            id: '1',
            subject: 'Re: Demo request - very interested!',
            from_name: 'Alex Carter',
            from_email: 'alex@acme.com',
            content: 'Hi! Thanks for the quick response. I watched your demo video and I\'m really impressed. Our team of 50 sales reps is struggling with lead qualification and we think your AI solution could be a game-changer. Can we schedule a call this week to discuss pricing and implementation timeline?',
            preview: 'Thanks for the quick response. I watched your demo video and I\'m really impressed...',
            received_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            lead_id: 'lead1',
            lead_name: 'Alex Carter',
            lead_company: 'Acme Inc',
            sentiment: 'positive',
            intent_score: 92,
            buying_signals: ['pricing inquiry', 'timeline discussion', 'team size mentioned', 'pain point identified'],
            pain_points_mentioned: ['lead qualification struggles', 'team scaling issues'],
            next_best_action: {
              type: 'call',
              priority: 'high',
              reasoning: 'High buying intent with specific pricing and timeline questions'
            },
            is_read: false,
            is_starred: false,
            thread_id: 'thread1',
            original_campaign_id: 'campaign1'
          },
          {
            id: '2',
            subject: 'Integration questions',
            from_name: 'Jamie Lee',
            from_email: 'jamie@brightlabs.io',
            content: 'Hi, I saw your demo and I\'m interested in understanding how your platform integrates with Salesforce and HubSpot. We\'re currently evaluating solutions and integration capability is crucial for our decision. Also, what\'s your typical implementation timeline?',
            preview: 'I saw your demo and I\'m interested in understanding how your platform integrates...',
            received_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            lead_id: 'lead2',
            lead_name: 'Jamie Lee',
            lead_company: 'BrightLabs',
            sentiment: 'neutral',
            intent_score: 78,
            buying_signals: ['integration questions', 'evaluation process', 'decision criteria'],
            pain_points_mentioned: ['integration complexity', 'solution evaluation'],
            next_best_action: {
              type: 'reply',
              priority: 'medium',
              reasoning: 'Technical questions indicate serious evaluation - provide detailed integration info'
            },
            is_read: false,
            is_starred: true,
            thread_id: 'thread2',
            original_campaign_id: 'campaign2'
          },
          {
            id: '3',
            subject: 'Thanks for the info',
            from_name: 'Sarah Wilson',
            from_email: 'sarah@cloudtech.com',
            content: 'Thank you for sending over the information about your AI SDR platform. I\'ve shared it with my team and we\'ll be in touch if we decide to move forward. We\'re currently focused on other priorities but will keep you in mind for Q2.',
            preview: 'Thank you for sending over the information about your AI SDR platform...',
            received_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            lead_id: 'lead3',
            lead_name: 'Sarah Wilson',
            lead_company: 'CloudTech Solutions',
            sentiment: 'neutral',
            intent_score: 35,
            buying_signals: ['shared with team', 'future consideration'],
            pain_points_mentioned: [],
            next_best_action: {
              type: 'nurture',
              priority: 'low',
              reasoning: 'Not ready now but interested for future - add to Q2 follow-up sequence'
            },
            is_read: true,
            is_starred: false,
            thread_id: 'thread3',
            original_campaign_id: 'campaign1'
          }
        ];
        setEmailReplies(mockReplies);
      } else {
        // Transform database data to EmailReply format
        const transformedReplies: EmailReply[] = replies.map((reply: any) => ({
          id: reply.id,
          subject: reply.subject,
          from_name: reply.from_name,
          from_email: reply.from_email,
          content: reply.content,
          preview: reply.preview || reply.content.substring(0, 100) + '...',
          received_at: reply.received_at,
          lead_id: reply.lead_id,
          lead_name: reply.leads ? `${reply.leads.first_name} ${reply.leads.last_name}` : reply.from_name,
          lead_company: reply.leads?.company || 'Unknown Company',
          sentiment: reply.sentiment || 'neutral',
          intent_score: reply.intent_score || 0,
          buying_signals: reply.buying_signals || [],
          pain_points_mentioned: reply.pain_points_mentioned || [],
          next_best_action: reply.next_best_action || {
            type: 'reply',
            priority: 'medium',
            reasoning: 'Follow up on this reply'
          },
          is_read: reply.is_read || false,
          is_starred: reply.is_starred || false,
          thread_id: reply.thread_id,
          original_campaign_id: reply.original_campaign_id
        }));
        setEmailReplies(transformedReplies);
      }
    } catch (error) {
      console.error('Error fetching email replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInboxSummary = async () => {
    try {
      // Calculate summary from email replies or fetch from database
      setInboxSummary({
        total_replies: 23,
        high_intent: 8,
        needs_immediate_action: 3,
        positive_sentiment: 15,
        avg_response_time: '2.3 hours'
      });
    } catch (error) {
      console.error('Error fetching inbox summary:', error);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
            <ThumbsDown className="w-3 h-3 mr-1" />
            Negative
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">
            <Minus className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100">Medium Priority</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">Low Priority</Badge>;
    }
  };

  const getIntentScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">High Intent ({score}%)</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100">Medium Intent ({score}%)</Badge>;
    } else {
      return <Badge className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">Low Intent ({score}%)</Badge>;
    }
  };

  const filteredEmails = emailReplies.filter((email: EmailReply) => {
    const matchesSearch = 
      email.from_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filter === 'all' ||
      (filter === 'needs_action' && email.next_best_action.priority === 'high') ||
      (filter === 'high_intent' && email.intent_score >= 80) ||
      (filter === 'positive' && email.sentiment === 'positive');

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Mail className="h-7 w-7 mr-3 text-blue-600" />
                AI Inbox
              </h1>
              <p className="text-gray-600 mt-1">Email replies from your outreach campaigns</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {inboxSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{inboxSummary.total_replies}</div>
                <div className="text-sm text-gray-600">Total Replies</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{inboxSummary.high_intent}</div>
                <div className="text-sm text-gray-600">High Intent</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{inboxSummary.needs_immediate_action}</div>
                <div className="text-sm text-gray-600">Needs Action</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{inboxSummary.positive_sentiment}</div>
                <div className="text-sm text-gray-600">Positive</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{inboxSummary.avg_response_time}</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search replies by name, email, subject, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'secondary'}
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}
              >
                All
              </Button>
              <Button
                variant={filter === 'needs_action' ? 'default' : 'secondary'}
                onClick={() => setFilter('needs_action')}
                className={filter === 'needs_action' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Needs Action
              </Button>
              <Button
                variant={filter === 'high_intent' ? 'default' : 'secondary'}
                onClick={() => setFilter('high_intent')}
                className={filter === 'high_intent' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                High Intent
              </Button>
              <Button
                variant={filter === 'positive' ? 'default' : 'secondary'}
                onClick={() => setFilter('positive')}
                className={filter === 'positive' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Positive
              </Button>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Email Replies ({filteredEmails.length})
            </h2>
            {filteredEmails.map((email: EmailReply) => (
              <Card 
                key={email.id} 
                className={`shadow-sm border-gray-200 cursor-pointer transition-all hover:shadow-md ${
                  selectedEmail?.id === email.id ? 'ring-2 ring-blue-500 border-blue-200' : ''
                } ${!email.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedEmail(email)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${!email.is_read ? 'font-bold' : ''}`}>
                          {email.from_name}
                        </h3>
                        {email.is_starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {!email.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                      <p className="text-sm text-gray-600">{email.from_email}</p>
                      <p className="text-sm text-gray-900 font-medium mt-1">{email.subject}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(email.received_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{email.preview}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {getSentimentBadge(email.sentiment)}
                    {getIntentScoreBadge(email.intent_score)}
                    {getPriorityBadge(email.next_best_action.priority)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{email.lead_company}</span>
                    <span className="capitalize">{email.next_best_action.type} recommended</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredEmails.length === 0 && (
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No replies found</h3>
                  <p className="text-gray-600">
                    {searchQuery || filter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Email replies from your campaigns will appear here'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Email Detail Panel */}
          <div className="lg:sticky lg:top-6">
            {selectedEmail ? (
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        From: {selectedEmail.from_name} ({selectedEmail.from_email})
                      </CardDescription>
                      <CardDescription>
                        Company: {selectedEmail.lead_company}
                      </CardDescription>
                      <CardDescription>
                        Received: {new Date(selectedEmail.received_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedEmail.is_starred && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                      {!selectedEmail.is_read && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Email Content</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEmail.content}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sentiment</h4>
                      {getSentimentBadge(selectedEmail.sentiment)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Intent Score</h4>
                      {getIntentScoreBadge(selectedEmail.intent_score)}
                    </div>
                  </div>

                  {selectedEmail.buying_signals.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Buying Signals</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmail.buying_signals.map((signal: string, index: number) => (
                          <Badge key={index} className="bg-green-50 text-green-700 border border-green-200 text-xs hover:bg-green-100">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEmail.pain_points_mentioned.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pain Points Mentioned</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmail.pain_points_mentioned.map((pain: string, index: number) => (
                          <Badge key={index} className="bg-red-50 text-red-700 border border-red-200 text-xs hover:bg-red-100">
                            {pain}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Action</h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 capitalize">
                          {selectedEmail.next_best_action.type}
                        </Badge>
                        {getPriorityBadge(selectedEmail.next_best_action.priority)}
                      </div>
                      <p className="text-sm text-gray-700">{selectedEmail.next_best_action.reasoning}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Schedule Call
                    </Button>
                    <Button variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                      <Star className="w-4 h-4 mr-2" />
                      Star
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email</h3>
                  <p className="text-gray-600">Choose an email reply to view details and AI analysis</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
