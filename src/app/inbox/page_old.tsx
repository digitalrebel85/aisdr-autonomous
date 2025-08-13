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
  
  // AI Analysis Results
  sentiment: 'positive' | 'neutral' | 'negative';
  intent_score: number; // 0-100
  buying_signals: string[];
  pain_points_mentioned: string[];
  next_best_action: {
    type: 'reply' | 'call' | 'demo' | 'follow_up' | 'nurture';
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  
  // Email metadata
  is_read: boolean;
  is_starred: boolean;
  thread_id?: string;
  original_campaign_id?: string;
}

interface AIProcessedEmail {
  id: string;
  subject: string;
  from_name: string;
  from_email: string;
  content: string;
  preview: string;
  timestamp: string;
  lead_id?: string;
  lead_name?: string;
  lead_company?: string;
  
  // AI Analysis Results
  sentiment: 'positive' | 'neutral' | 'negative';
  intent_score: number; // 0-100
  buying_signals: string[];
  pain_points_mentioned: string[];
  next_best_action: {
    type: 'reply' | 'call' | 'demo' | 'follow_up' | 'nurture';
    description: string;
    urgency: 'high' | 'medium' | 'low';
    suggested_response?: string;
  };
  
  // Processing metadata
  ai_confidence: number; // 0-1
  processed_at: string;
  action_taken?: string;
  status: 'needs_action' | 'in_progress' | 'completed' | 'snoozed';
}

interface AISummary {
  total_processed: number;
  high_intent: number;
  needs_immediate_action: number;
  positive_sentiment: number;
  avg_response_time: string;
}

export default function InboxPage() {
  const [emailReplies, setEmailReplies] = useState<EmailReply[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailReply | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'needs_action' | 'high_intent' | 'positive'>('needs_action');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEmailReplies();
    fetchAISummary();
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
      const mockEmails: AIProcessedEmail[] = [
        {
          id: '1',
          subject: 'Re: Demo request - very interested!',
          from_name: 'Alex Carter',
          from_email: 'alex@acme.com',
          content: 'Hi! Thanks for the quick response. I watched your demo video and I\'m really impressed. Our team of 50 sales reps is struggling with lead qualification and we think your AI solution could be a game-changer. Can we schedule a call this week to discuss pricing and implementation timeline?',
          preview: 'Thanks for the quick response. I watched your demo video and I\'m really impressed...',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          lead_id: 'lead1',
          lead_name: 'Alex Carter',
          lead_company: 'Acme Inc',
          sentiment: 'positive',
          intent_score: 92,
          buying_signals: ['pricing inquiry', 'timeline discussion', 'team size mentioned', 'pain point identified'],
          pain_points_mentioned: ['lead qualification struggles', 'team scaling issues'],
          next_best_action: {
            type: 'call',
            description: 'Schedule demo call within 24 hours - high buying intent detected',
            urgency: 'high',
            suggested_response: 'Hi Alex, I\'m excited about the potential fit! I have availability tomorrow at 2pm or 4pm EST for a 30-minute call to discuss your team\'s needs and our pricing options. Which works better for you?'
          },
          ai_confidence: 0.95,
          processed_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          status: 'needs_action'
        },
        {
          id: '2',
          subject: 'Integration questions',
          from_name: 'Jamie Lee',
          from_email: 'jamie@brightlabs.io',
          content: 'Hi, I saw your demo and I\'m interested in understanding how your platform integrates with Salesforce and HubSpot. We\'re currently evaluating solutions and integration capability is crucial for our decision. Also, what\'s your typical implementation timeline?',
          preview: 'I saw your demo and I\'m interested in understanding how your platform integrates...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          lead_id: 'lead2',
          lead_name: 'Jamie Lee',
          lead_company: 'BrightLabs',
          sentiment: 'neutral',
          intent_score: 78,
          buying_signals: ['technical evaluation', 'decision criteria mentioned', 'timeline inquiry'],
          pain_points_mentioned: ['integration requirements', 'solution evaluation process'],
          next_best_action: {
            type: 'reply',
            description: 'Send technical integration guide and schedule technical demo',
            urgency: 'medium',
            suggested_response: 'Hi Jamie, great questions! We have native integrations with both Salesforce and HubSpot. I\'ll send you our integration guide and would love to show you a technical demo. Are you available for a 20-minute call this week?'
          },
          ai_confidence: 0.87,
          processed_at: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
          status: 'needs_action'
        },
        {
          id: '3',
          subject: 'Thanks but not right now',
          from_name: 'Chris Hall',
          from_email: 'chris@novaworks.co',
          content: 'Thanks for reaching out, but we\'re not looking for this type of solution right now. We just implemented a new CRM system and want to get that stabilized first. Maybe revisit in Q3 when we\'re looking at additional tools.',
          preview: 'Thanks for reaching out, but we\'re not looking for this type of solution right now...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          lead_id: 'lead3',
          lead_name: 'Chris Hall',
          lead_company: 'NovaWorks',
          sentiment: 'negative',
          intent_score: 25,
          buying_signals: ['future consideration mentioned'],
          pain_points_mentioned: ['recent CRM implementation', 'system stabilization needs'],
          next_best_action: {
            type: 'nurture',
            description: 'Add to Q3 follow-up sequence, send helpful CRM optimization content',
            urgency: 'low',
            suggested_response: 'Thanks for the honest feedback, Chris! I completely understand wanting to stabilize your new CRM first. I\'ll reach out in Q3, and in the meantime, I\'ll send you some helpful resources for CRM optimization.'
          },
          ai_confidence: 0.91,
          processed_at: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString(),
          status: 'completed',
          action_taken: 'Added to Q3 nurture sequence'
        },
        {
          id: '4',
          subject: 'Demo follow-up - technical questions',
          from_name: 'Sarah Wilson',
          from_email: 'sarah@cloudtech.com',
          content: 'The demo was great! Our technical team has a few questions: 1) What are the API rate limits? 2) How is data retention handled? 3) Do you support single sign-on? 4) What\'s included in the enterprise plan? We\'re comparing a few solutions and these details will help with our decision.',
          preview: 'The demo was great! Our technical team has a few questions about API limits, data retention...',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          lead_id: 'lead4',
          lead_name: 'Sarah Wilson',
          lead_company: 'CloudTech Solutions',
          sentiment: 'positive',
          intent_score: 85,
          buying_signals: ['technical evaluation', 'comparing solutions', 'enterprise plan interest', 'decision process'],
          pain_points_mentioned: ['technical requirements evaluation'],
          next_best_action: {
            type: 'reply',
            description: 'Send detailed technical FAQ and schedule technical deep-dive call',
            urgency: 'high',
            suggested_response: 'Hi Sarah, I\'m glad the demo resonated! I\'ll send you our technical FAQ document that covers all these points. Would you like to schedule a technical deep-dive call with our solutions engineer this week?'
          },
          ai_confidence: 0.89,
          processed_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
          status: 'in_progress',
          action_taken: 'Technical FAQ sent, awaiting call scheduling'
        }
      ];

      setProcessedEmails(mockEmails);
    } catch (error) {
      console.error('Error fetching AI processed emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    try {
      // Mock AI summary - replace with actual analytics
      setAiSummary({
        total_processed: 47,
        high_intent: 12,
        needs_immediate_action: 3,
        positive_sentiment: 28,
        avg_response_time: '2.3 hours'
      });
    } catch (error) {
      console.error('Error fetching AI summary:', error);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Priority</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">Low Priority</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'needs_action':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><AlertTriangle className="w-3 h-3 mr-1" />Needs Action</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'snoozed':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Snoozed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'reply': return <Reply className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'demo': return <MessageSquare className="w-4 h-4" />;
      case 'follow_up': return <Clock className="w-4 h-4" />;
      case 'nurture': return <TrendingUp className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredEmails = processedEmails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'needs_action' && email.status === 'needs_action') ||
                         (filter === 'high_intent' && email.intent_score >= 80) ||
                         (filter === 'positive' && email.sentiment === 'positive');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
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
                <Bot className="h-7 w-7 mr-3 text-blue-600" />
                AI Inbox
              </h1>
              <p className="text-gray-600 mt-1">AI-processed emails with sentiment analysis and action recommendations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                {processedEmails.filter(e => e.status === 'needs_action').length} Need Action
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Target className="w-3 h-3 mr-1" />
                {processedEmails.filter(e => e.intent_score >= 80).length} High Intent
              </Badge>
            </div>
          </div>
        </div>

        {/* AI Summary Dashboard */}
        {aiSummary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{aiSummary.total_processed}</div>
                <div className="text-sm text-gray-600">Emails Processed</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{aiSummary.high_intent}</div>
                <div className="text-sm text-gray-600">High Intent</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{aiSummary.needs_immediate_action}</div>
                <div className="text-sm text-gray-600">Urgent Actions</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{aiSummary.positive_sentiment}</div>
                <div className="text-sm text-gray-600">Positive Sentiment</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{aiSummary.avg_response_time}</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search AI-processed emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'needs_action' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('needs_action')}
                className={filter === 'needs_action' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Needs Action
              </Button>
              <Button
                variant={filter === 'high_intent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('high_intent')}
                className={filter === 'high_intent' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Target className="w-4 h-4 mr-1" />
                High Intent
              </Button>
              <Button
                variant={filter === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('positive')}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Positive
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
            </div>
          </div>
        </div>

        {/* Email List */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
              AI-Processed Emails
            </CardTitle>
            <CardDescription>
              {filteredEmails.length} emails analyzed by AI
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                    email.status === 'needs_action' ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                  } ${selectedEmail?.id === email.id ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="h-12 w-12 border-2 border-gray-200 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">
                          {email.from_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <p className="text-lg font-semibold text-gray-900">{email.from_name}</p>
                          {email.lead_company && (
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {email.lead_company}
                            </span>
                          )}
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Intent: {email.intent_score}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Confidence: {Math.round(email.ai_confidence * 100)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-base font-medium text-gray-900 mb-2">{email.subject}</p>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{email.preview}</p>
                        
                        <div className="flex items-center space-x-3 mb-3">
                          {getSentimentBadge(email.sentiment)}
                          {getStatusBadge(email.status)}
                          {getUrgencyBadge(email.next_best_action.urgency)}
                        </div>

                        {/* AI Insights */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="flex items-start space-x-2">
                            {getActionIcon(email.next_best_action.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">AI Recommendation:</p>
                              <p className="text-sm text-blue-800">{email.next_best_action.description}</p>
                              {email.next_best_action.suggested_response && (
                                <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                                  <p className="text-xs font-medium text-blue-700 mb-1">Suggested Response:</p>
                                  <p className="text-xs text-blue-600 italic">"{email.next_best_action.suggested_response}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Buying Signals & Pain Points */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {email.buying_signals.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Buying Signals:</p>
                              <div className="flex flex-wrap gap-1">
                                {email.buying_signals.slice(0, 3).map((signal, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    {signal}
                                  </Badge>
                                ))}
                                {email.buying_signals.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{email.buying_signals.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {email.pain_points_mentioned.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Pain Points:</p>
                              <div className="flex flex-wrap gap-1">
                                {email.pain_points_mentioned.slice(0, 2).map((pain, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                    {pain}
                                  </Badge>
                                ))}
                                {email.pain_points_mentioned.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{email.pain_points_mentioned.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 mt-4">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            {getActionIcon(email.next_best_action.type)}
                            <span className="ml-2 capitalize">{email.next_best_action.type}</span>
                          </Button>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Lead
                          </Button>
                          <Button size="sm" variant="outline">
                            <Star className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(email.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Processed {new Date(email.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
