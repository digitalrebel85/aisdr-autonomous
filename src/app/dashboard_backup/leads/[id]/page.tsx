'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building, User, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  company_domain?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  linkedin_url?: string;
  engagement_level: string;
  created_at: string;
  last_contacted_at?: string;
  follow_up_count: number;
  enriched_data?: any;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  metadata?: any;
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (leadId) {
      fetchLeadData();
    }
  }, [leadId]);

  const fetchLeadData = async () => {
    try {
      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();

      if (leadError) {
        console.error('Error fetching lead data:', leadError);
        setError('Failed to fetch lead data');
        setLoading(false);
        return;
      }

      if (!leadData) {
        setError('Lead not found');
        setLoading(false);
        return;
      }

      setLead(leadData);

      // Fetch lead activities (emails sent, replies, etc.)
      const { data: emailActivities } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      const { data: replyActivities } = await supabase
        .from('email_replies')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      // Combine and format activities
      const allActivities: Activity[] = [];
      
      emailActivities?.forEach(email => {
        allActivities.push({
          id: email.id,
          type: 'email_sent',
          description: `Email sent: ${email.subject}`,
          created_at: email.created_at,
          metadata: email
        });
      });

      replyActivities?.forEach(reply => {
        allActivities.push({
          id: reply.id,
          type: 'email_reply',
          description: `Reply received: ${reply.subject}`,
          created_at: reply.created_at,
          metadata: reply
        });
      });

      // Sort by date
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(allActivities);

    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichLead = async () => {
    if (!lead) return;
    
    setEnriching(true);
    try {
      const response = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id
        }),
      });

      if (response.ok) {
        // Refresh lead data to show enriched information
        await fetchLeadData();
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
    } finally {
      setEnriching(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'email_reply':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email_sent':
        return 'border-l-blue-500';
      case 'email_reply':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Link href="/dashboard/leads" className="mr-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lead Not Found</h1>
          <Link href="/dashboard/leads">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {lead.name || `${lead.first_name} ${lead.last_name}`}
            </h1>
            <p className="text-gray-600">{lead.title} at {lead.company}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={lead.engagement_level === 'hot' ? 'default' : 'secondary'}>
            {lead.engagement_level || 'cold'}
          </Badge>
          <Button onClick={handleEnrichLead} disabled={enriching}>
            {enriching ? 'Enriching...' : 'Enrich Lead'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                
                {lead.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.phone}</p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  </div>
                )}
                
                {lead.linkedin_url && (
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <div>
                      <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                        LinkedIn Profile
                      </a>
                      <p className="text-xs text-gray-500">Social</p>
                    </div>
                  </div>
                )}
                
                {lead.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.location}</p>
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                  <p className="text-xs text-gray-500">Company</p>
                </div>
                
                {lead.company_domain && (
                  <div>
                    <a href={`https://${lead.company_domain}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                      {lead.company_domain}
                    </a>
                    <p className="text-xs text-gray-500">Website</p>
                  </div>
                )}
                
                {lead.industry && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.industry}</p>
                    <p className="text-xs text-gray-500">Industry</p>
                  </div>
                )}
                
                {lead.company_size && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.company_size}</p>
                    <p className="text-xs text-gray-500">Company Size</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enriched Data */}
          {lead.enriched_data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  AI Enrichment Summary
                </CardTitle>
                <CardDescription>
                  {lead.enriched_data.primary_source && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Primary Source: {lead.enriched_data.primary_source}
                    </span>
                  )}
                  {lead.enriched_data.confidence_score && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Confidence: {Math.round(lead.enriched_data.confidence_score * 100)}%
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Lead Enrichment Summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Lead Intelligence
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {lead.enriched_data.title && (
                        <div>
                          <span className="font-medium text-gray-700">Job Title:</span>
                          <p className="text-gray-900">{lead.enriched_data.title}</p>
                        </div>
                      )}
                      {lead.enriched_data.location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-900">{lead.enriched_data.location}</p>
                        </div>
                      )}
                      {lead.enriched_data.phone && (
                        <div>
                          <span className="font-medium text-gray-700">Phone:</span>
                          <p className="text-gray-900">{lead.enriched_data.phone}</p>
                        </div>
                      )}
                      {lead.enriched_data.linkedin_url && (
                        <div>
                          <span className="font-medium text-gray-700">LinkedIn:</span>
                          <a href={lead.enriched_data.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Profile */}
                  {lead.enriched_data.company_profile && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Company Intelligence
                      </h4>
                      
                      {lead.enriched_data.company_profile.description && (
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">Company Description:</span>
                          <p className="text-gray-900 mt-1 text-sm leading-relaxed">
                            {lead.enriched_data.company_profile.description}
                          </p>
                        </div>
                      )}

                      {lead.enriched_data.company_profile.techStack && lead.enriched_data.company_profile.techStack.length > 0 && (
                        <div className="mb-4">
                          <span className="font-medium text-gray-700 block mb-2">Technology Stack:</span>
                          <div className="flex flex-wrap gap-2">
                            {lead.enriched_data.company_profile.techStack.map((tech: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.enriched_data.company_profile.organic_results && lead.enriched_data.company_profile.organic_results.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 block mb-2">Key Company Information:</span>
                          <div className="space-y-2">
                            {lead.enriched_data.company_profile.organic_results.slice(0, 3).map((result: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <p className="font-medium text-sm text-gray-900">{result.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{result.snippet}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legacy Pain Points and Interests */}
                  {(lead.enriched_data.pain_points?.length > 0 || lead.enriched_data.interests?.length > 0) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Insights</h4>
                      <div className="space-y-3">
                        {lead.enriched_data.pain_points && lead.enriched_data.pain_points.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 block mb-2">Pain Points:</span>
                            <div className="flex flex-wrap gap-2">
                              {lead.enriched_data.pain_points.map((point: string, index: number) => (
                                <Badge key={index} variant="destructive" className="text-xs">{point}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {lead.enriched_data.interests && lead.enriched_data.interests.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700 block mb-2">Interests:</span>
                            <div className="flex flex-wrap gap-2">
                              {lead.enriched_data.interests.map((interest: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">{interest}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enrichment Metadata */}
                  {(lead.enriched_data.enrichment_timestamp || lead.enriched_data.all_sources) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Enrichment Details</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        {lead.enriched_data.enrichment_timestamp && (
                          <p>Last enriched: {new Date(lead.enriched_data.enrichment_timestamp).toLocaleString()}</p>
                        )}
                        {lead.enriched_data.all_sources && (
                          <div>
                            <p className="font-medium">Data Sources Attempted:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(lead.enriched_data.all_sources).map(([source, data]: [string, any]) => (
                                <span key={source} className={`px-2 py-1 rounded text-xs ${
                                  data.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Recent interactions and outreach history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className={`border-l-4 ${getActivityColor(activity.type)} pl-4 pb-4`}>
                      <div className="flex items-start space-x-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No activity yet</p>
                    <p className="text-sm text-gray-400">Activity will appear here when you start outreach</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Follow-ups sent</span>
                  <span className="text-sm font-medium">{lead.follow_up_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last contacted</span>
                  <span className="text-sm font-medium">
                    {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Added</span>
                  <span className="text-sm font-medium">{formatDate(lead.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
