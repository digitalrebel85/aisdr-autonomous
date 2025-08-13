"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  Mail,
  Settings
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Offer {
  id: string;
  name: string;
  value_proposition: string;
  pain_points: string[];
  benefits: string[];
  assets: string[];
  target_personas: string[];
  status: 'active' | 'draft' | 'paused';
  created_at: string;
  updated_at: string;
  usage_count: number;
  conversion_rate?: number;
}

interface Persona {
  id: string;
  name: string;
  title_patterns: string[];
  company_size: string[];
  industries: string[];
  pain_points: string[];
  messaging_hooks: string[];
  tone: 'professional' | 'casual' | 'consultative' | 'direct';
  status: 'active' | 'draft';
  created_at: string;
  updated_at: string;
  leads_matched: number;
}

export default function OffersPersonasPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOffers();
    fetchPersonas();
  }, []);

  const fetchOffers = async () => {
    try {
      // Mock offers data - replace with actual database query
      const mockOffers: Offer[] = [
        {
          id: '1',
          name: 'AI Sales Automation Demo',
          value_proposition: 'Increase your sales team productivity by 300% with AI-powered lead qualification and outreach automation',
          pain_points: ['Manual lead qualification', 'Time-consuming outreach', 'Low response rates', 'Scaling challenges'],
          benefits: ['3x faster lead qualification', 'Automated personalized outreach', '40% higher response rates', 'Scales with your team'],
          assets: ['ROI Calculator', 'Demo Video', 'Case Study: TechCorp', 'Implementation Guide'],
          target_personas: ['sales_manager', 'vp_sales', 'ceo_startup'],
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          usage_count: 47,
          conversion_rate: 23.4
        },
        {
          id: '2',
          name: 'Enterprise CRM Integration',
          value_proposition: 'Seamlessly integrate AI sales intelligence into your existing Salesforce or HubSpot workflow',
          pain_points: ['CRM data silos', 'Manual data entry', 'Lack of lead insights', 'Poor data quality'],
          benefits: ['Native CRM integration', 'Automated data enrichment', 'Real-time lead scoring', 'Clean, actionable data'],
          assets: ['Integration Guide', 'Technical Specs', 'Security Whitepaper', 'Migration Checklist'],
          target_personas: ['sales_ops', 'it_director', 'vp_sales'],
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          usage_count: 23,
          conversion_rate: 31.2
        },
        {
          id: '3',
          name: 'Startup Growth Package',
          value_proposition: 'Bootstrap your sales process with AI-powered lead generation and qualification for early-stage startups',
          pain_points: ['Limited sales resources', 'Founder-led sales', 'No proven process', 'Budget constraints'],
          benefits: ['Affordable pricing', 'Quick setup', 'Founder-friendly interface', 'Proven templates'],
          assets: ['Startup Playbook', 'Pricing Calculator', 'Success Stories', 'Quick Start Guide'],
          target_personas: ['founder_ceo', 'startup_sales'],
          status: 'draft',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          usage_count: 8,
          conversion_rate: 18.7
        }
      ];

      setOffers(mockOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchPersonas = async () => {
    try {
      // Mock personas data - replace with actual database query
      const mockPersonas: Persona[] = [
        {
          id: 'sales_manager',
          name: 'Sales Manager',
          title_patterns: ['Sales Manager', 'Regional Sales Manager', 'Sales Team Lead', 'Inside Sales Manager'],
          company_size: ['51-200', '201-500', '501-1000'],
          industries: ['Technology', 'SaaS', 'Software', 'Financial Services'],
          pain_points: ['Team productivity', 'Lead quality', 'Pipeline management', 'Quota attainment'],
          messaging_hooks: ['Increase team productivity', 'Better lead qualification', 'Hit quotas consistently', 'Scale your team'],
          tone: 'professional',
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          leads_matched: 34
        },
        {
          id: 'vp_sales',
          name: 'VP of Sales',
          title_patterns: ['VP Sales', 'Vice President Sales', 'VP of Sales', 'Sales Director', 'Head of Sales'],
          company_size: ['201-500', '501-1000', '1000+'],
          industries: ['Technology', 'SaaS', 'Enterprise Software', 'B2B Services'],
          pain_points: ['Revenue growth', 'Sales efficiency', 'Team scaling', 'Predictable pipeline'],
          messaging_hooks: ['Drive revenue growth', 'Scale sales operations', 'Predictable results', 'Strategic advantage'],
          tone: 'consultative',
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 75).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          leads_matched: 18
        },
        {
          id: 'founder_ceo',
          name: 'Founder/CEO (Startup)',
          title_patterns: ['CEO', 'Founder', 'Co-Founder', 'Founder & CEO', 'Chief Executive Officer'],
          company_size: ['1-10', '11-50'],
          industries: ['Startup', 'Technology', 'SaaS', 'E-commerce'],
          pain_points: ['Limited resources', 'Wearing many hats', 'Scaling challenges', 'Proving ROI'],
          messaging_hooks: ['Bootstrap growth', 'Founder-friendly', 'Quick wins', 'Affordable solution'],
          tone: 'direct',
          status: 'active',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          leads_matched: 12
        },
        {
          id: 'sales_ops',
          name: 'Sales Operations',
          title_patterns: ['Sales Operations', 'Sales Ops', 'Revenue Operations', 'RevOps', 'Sales Analyst'],
          company_size: ['101-500', '501-1000', '1000+'],
          industries: ['Technology', 'SaaS', 'Enterprise', 'Financial Services'],
          pain_points: ['Data quality', 'Process optimization', 'Tool integration', 'Reporting accuracy'],
          messaging_hooks: ['Clean data', 'Process automation', 'Better insights', 'Tool consolidation'],
          tone: 'professional',
          status: 'draft',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          leads_matched: 7
        }
      ];

      setPersonas(mockPersonas);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Edit className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'paused':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><AlertCircle className="w-3 h-3 mr-1" />Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case 'professional':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Professional</Badge>;
      case 'casual':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Casual</Badge>;
      case 'consultative':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Consultative</Badge>;
      case 'direct':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Direct</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
                <Target className="h-7 w-7 mr-3 text-blue-600" />
                Offers & Personas
              </h1>
              <p className="text-gray-600 mt-1">Manage your value propositions and target audience segments</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="offers" className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-t-lg">
              <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
              <TabsTrigger value="personas">Personas ({personas.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* Offers Tab */}
          <TabsContent value="offers">
            <div className="space-y-6">
              {/* Offers Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{offers.length}</div>
                    <div className="text-sm text-gray-600">Total Offers</div>
                  </CardContent>
                </Card>
          <div className="space-y-6">
            {/* Offers Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{offers.length}</div>
                  <div className="text-sm text-gray-600">Total Offers</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {offers.filter(o => o.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {offers.reduce((sum, o) => sum + o.usage_count, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Usage</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {(offers.reduce((sum, o) => sum + (o.conversion_rate || 0), 0) / offers.length).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Conversion</div>
                </CardContent>
              </Card>
            </div>

            {/* Offers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {offers.map((offer) => (
                <Card key={offer.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {offer.value_proposition}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusBadge(offer.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Pain Points */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Pain Points Addressed:</h4>
                      <div className="flex flex-wrap gap-1">
                        {offer.pain_points.slice(0, 3).map((pain, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            {pain}
                          </Badge>
                        ))}
                        {offer.pain_points.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.pain_points.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Key Benefits:</h4>
                      <div className="flex flex-wrap gap-1">
                        {offer.benefits.slice(0, 3).map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {benefit}
                          </Badge>
                        ))}
                        {offer.benefits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Assets */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Sales Assets:</h4>
                      <div className="flex flex-wrap gap-1">
                        {offer.assets.slice(0, 3).map((asset, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {asset}
                          </Badge>
                        ))}
                        {offer.assets.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.assets.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{offer.usage_count}</div>
                        <div className="text-xs text-gray-500">Times Used</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">{offer.conversion_rate}%</div>
                        <div className="text-xs text-gray-500">Conversion Rate</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas">
            <div className="space-y-6">
            {/* Personas Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{personas.length}</div>
                  <div className="text-sm text-gray-600">Total Personas</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {personas.filter(p => p.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {personas.reduce((sum, p) => sum + p.leads_matched, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Leads Matched</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(personas.reduce((sum, p) => sum + p.leads_matched, 0) / personas.length)}
                  </div>
                  <div className="text-sm text-gray-600">Avg per Persona</div>
                </CardContent>
              </Card>
            </div>

            {/* Personas List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {personas.map((persona) => (
                <Card key={persona.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center">
                          <User className="w-5 h-5 mr-2 text-blue-600" />
                          {persona.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          {getStatusBadge(persona.status)}
                          {getToneBadge(persona.tone)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Title Patterns */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Title Patterns:</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.title_patterns.slice(0, 3).map((title, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {title}
                          </Badge>
                        ))}
                        {persona.title_patterns.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{persona.title_patterns.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Company Size */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Company Size:</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.company_size.map((size, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            <Building2 className="w-3 h-3 mr-1" />
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Industries */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Industries:</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.industries.slice(0, 3).map((industry, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {industry}
                          </Badge>
                        ))}
                        {persona.industries.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{persona.industries.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Messaging Hooks */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Messaging Hooks:</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.messaging_hooks.slice(0, 3).map((hook, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {hook}
                          </Badge>
                        ))}
                        {persona.messaging_hooks.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{persona.messaging_hooks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Leads Matched:</span>
                        <span className="text-lg font-semibold text-blue-600">{persona.leads_matched}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-4">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-1" />
                        View Leads
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
