"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  MessageSquare,
  Activity,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
}

interface AIMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
      fetchAIMessages();
      fetchActivities();
    }
  }, [leadId]);

  const fetchLeadData = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockLead: Lead = {
        id: leadId,
        first_name: 'Alex',
        last_name: 'Carter',
        email: 'alex@acme.com',
        company: 'Acme Inc',
        title: 'VP of Sales',
        company_domain: 'acme.com',
        phone: '+1-555-0123',
        linkedin_url: 'https://linkedin.com/in/alexcarter',
        location: 'San Francisco, CA',
        industry: 'Technology',
        company_size: '51-200',
        enrichment_status: 'completed',
        enriched_data: {
          confidence_score: 0.95,
          primary_source: 'apollo',
          company_profile: {
            description: 'Leading technology company specializing in AI-powered sales automation solutions.',
            techStack: ['React', 'Node.js', 'AWS', 'MongoDB'],
            organic_results: [
              {
                title: 'Acme Inc - About Us',
                snippet: 'We are a leading technology company focused on revolutionizing sales processes through AI automation.'
              }
            ]
          }
        },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      };
      
      setLead(mockLead);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIMessages = async () => {
    setAiMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Based on the enrichment data, this lead shows high intent signals. They visited your pricing page 3 times this week.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: '2',
        role: 'user',
        content: 'What should my follow-up message focus on?',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: '3',
        role: 'assistant',
        content: 'Focus on their pain point around scaling their sales team. Mention your ROI calculator and offer a 15-minute demo.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      }
    ]);
  };

  const fetchActivities = async () => {
    setActivities([
      {
        id: '1',
        type: 'enrichment',
        description: 'Lead enriched with Apollo and Serper data',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: '2',
        type: 'email_open',
        description: 'Opened email: "Quick question about scaling"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: '3',
        type: 'website_visit',
        description: 'Visited pricing page',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      }
    ]);
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Lead not found</h2>
            <p className="text-gray-600 mt-2">The lead you're looking for doesn't exist.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getEnrichmentStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Enriched</Badge>;
      case 'enriching':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Enriching</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrichment': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'email_open': return <Mail className="w-4 h-4 text-green-600" />;
      case 'website_visit': return <ExternalLink className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16 border-2 border-gray-200">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${lead.first_name}+${lead.last_name}&background=0ea5e9&color=fff`} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {lead.first_name[0]}{lead.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h1>
                <p className="text-lg text-gray-600">{lead.title} at {lead.company}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-gray-500">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      <span className="text-sm">{lead.phone}</span>
                    </div>
                  )}
                  {lead.location && (
                    <div className="flex items-center text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{lead.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getEnrichmentStatusBadge(lead.enrichment_status)}
              <Button 
                onClick={handleEnrich} 
                disabled={enriching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enriching ? 'Enriching...' : 'Enrich Lead'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shadcn Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-t-lg">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="conversations">AI Conversations</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-6">
                    {/* Enrichment Summary */}
                    {lead.enriched_data && (
                      <Card className="shadow-sm border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                            AI Enrichment Summary
                          </CardTitle>
                          <CardDescription>
                            Data enriched from {lead.enriched_data.primary_source} with {Math.round(lead.enriched_data.confidence_score * 100)}% confidence
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Company Profile */}
                          {lead.enriched_data.company_profile && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Company Profile</h4>
                              <p className="text-gray-700 text-sm mb-3">{lead.enriched_data.company_profile.description}</p>
                              
                              {lead.enriched_data.company_profile.techStack && (
                                <div>
                                  <h5 className="font-medium text-gray-800 mb-2">Tech Stack</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {lead.enriched_data.company_profile.techStack.map((tech: string, index: number) => (
                                      <Badge key={index} className="bg-gray-50 text-gray-700 border border-gray-200 text-xs hover:bg-gray-100">
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {lead.enriched_data.company_profile.organic_results && (
                                <div className="mt-4">
                                  <h5 className="font-medium text-gray-800 mb-2">Recent Company News</h5>
                                  {lead.enriched_data.company_profile.organic_results.slice(0, 2).map((result: any, index: number) => (
                                    <div key={index} className="border-l-2 border-blue-200 pl-3 mb-2">
                                      <p className="font-medium text-sm text-gray-900">{result.title}</p>
                                      <p className="text-xs text-gray-600">{result.snippet}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Contact Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Contact Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-blue-600" />
                                  <span>{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-blue-600" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                {lead.linkedin_url && (
                                  <div className="flex items-center">
                                    <ExternalLink className="w-4 h-4 mr-2 text-blue-600" />
                                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      LinkedIn Profile
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-4">
                              <h4 className="font-semibold text-green-900 mb-2">Company Info</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-2 text-green-600" />
                                  <span>{lead.company}</span>
                                </div>
                                {lead.industry && (
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 mr-2 text-green-600" />
                                    <span>{lead.industry}</span>
                                  </div>
                                )}
                                {lead.company_size && (
                                  <div className="flex items-center">
                                    <User className="w-4 h-4 mr-2 text-green-600" />
                                    <span>{lead.company_size} employees</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="conversations" className="space-y-4">
                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                        AI Conversations
                      </CardTitle>
                      <CardDescription>
                        Chat with AI about this lead to get insights and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {aiMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-4" />
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Ask AI about this lead..."
                          className="flex-1"
                        />
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                  <Card className="shadow-sm border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-orange-600" />
                        Activity Timeline
                      </CardTitle>
                      <CardDescription>
                        Recent activities and interactions with this lead
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Schedule Call
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Meeting
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
