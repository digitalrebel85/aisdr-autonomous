"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  description: string;
  company_description: string;
  product_service_name: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet: string;
  pain_points: string[];
  benefits: string[];
  proof_points: string[];
  email_example: string;
  excluded_terms: string[];
  created_at: string;
  updated_at: string;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  title_patterns: string[];
  company_size_min?: number;
  company_size_max?: number;
  company_size_text?: string;
  industries: string[];
  pain_points: string[];
  messaging_hooks: string[];
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';
  is_default: boolean;
  usage_count: number;
  conversion_rate: number;
  effectiveness_score: number;
  created_at: string;
  updated_at: string;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePersona, setShowCreatePersona] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOffers();
    fetchPersonas();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch real offers from API
      const offersResponse = await fetch('/api/offers');
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        const transformedOffers: Offer[] = offersData.offers.map((offer: any) => ({
          id: offer.id.toString(),
          name: offer.name,
          description: offer.description || '',
          company_description: offer.company_description || '',
          product_service_name: offer.product_service_name || '',
          value_proposition: offer.value_proposition || '',
          call_to_action: offer.call_to_action || '',
          hook_snippet: offer.hook_snippet || '',
          pain_points: offer.pain_points || [],
          benefits: offer.benefits || [],
          proof_points: offer.proof_points || [],
          email_example: offer.email_example || '',
          excluded_terms: offer.excluded_terms || [],
          created_at: offer.created_at,
          updated_at: offer.updated_at,
        }));
        setOffers(transformedOffers);
      } else {
        console.error('Failed to fetch offers');
        setOffers([]);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
      setPersonas([]);
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
    <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Offers & CTAs</h1>
              <p className="text-gray-600 mt-1">Manage your value propositions and call-to-actions</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="offers" className="w-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 rounded-t-lg">
              <TabsTrigger value="offers">
                <Target className="w-4 h-4 mr-2" />
                Offers ({offers.length})
              </TabsTrigger>
              <TabsTrigger value="personas">
                <Users className="w-4 h-4 mr-2" />
                Personas ({personas.length})
              </TabsTrigger>
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
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {offers.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Offers</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {offers.filter(o => o.value_proposition).length}
                    </div>
                    <div className="text-sm text-gray-600">With Value Props</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {offers.filter(o => o.call_to_action).length}
                    </div>
                    <div className="text-sm text-gray-600">With CTAs</div>
                  </CardContent>
                </Card>
              </div>

              {/* Offers List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {offers.map((offer) => (
                  <Card key={offer.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">{offer.name}</CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {offer.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Value Proposition</h4>
                        <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {offer.value_proposition}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Call to Action</h4>
                        <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                          {offer.call_to_action}
                        </p>
                      </div>

                      {offer.hook_snippet && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Hook Snippet</h4>
                          <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            {offer.hook_snippet}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">
                            Created: {new Date(offer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <Button size="sm" variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                          <Trash2 className="w-4 h-4" />
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
              {/* Personas Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Personas</h2>
                  <p className="text-gray-600 text-sm">Automatically match leads to personas for personalized outreach</p>
                </div>
                <Button onClick={() => setShowCreatePersona(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Persona
                </Button>
              </div>

              {/* Personas Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{personas.length}</div>
                    <div className="text-sm text-gray-600">Total Personas</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {personas.filter(p => p.is_default).length}
                    </div>
                    <div className="text-sm text-gray-600">Default Personas</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {personas.reduce((sum, p) => sum + p.usage_count, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Usage</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {personas.length > 0 ? Math.round(personas.reduce((sum, p) => sum + p.effectiveness_score, 0) / personas.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Effectiveness</div>
                  </CardContent>
                </Card>
              </div>

              {/* Personas List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {personas.map((persona) => (
                  <Card key={persona.id} className="shadow-sm border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                            {persona.name}
                            {persona.is_default && (
                              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Default
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {persona.description}
                          </CardDescription>
                        </div>
                        <Badge variant={persona.effectiveness_score > 70 ? 'default' : 'secondary'} className="text-xs">
                          {persona.effectiveness_score}% effective
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title Patterns */}
                      {persona.title_patterns.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">Target Titles</h4>
                          <div className="flex flex-wrap gap-1">
                            {persona.title_patterns.slice(0, 3).map(title => (
                              <Badge key={title} variant="outline" className="text-xs bg-gray-50">
                                {title}
                              </Badge>
                            ))}
                            {persona.title_patterns.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                +{persona.title_patterns.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Industries */}
                      {persona.industries.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">Industries</h4>
                          <div className="flex flex-wrap gap-1">
                            {persona.industries.slice(0, 2).map(industry => (
                              <Badge key={industry} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {industry}
                              </Badge>
                            ))}
                            {persona.industries.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                +{persona.industries.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Messaging Tone */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tone:</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {persona.tone}
                        </Badge>
                      </div>

                      {/* Usage Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          <span>{persona.usage_count} uses</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>{persona.conversion_rate}% conversion</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        <Button size="sm" variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {personas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Personas Yet</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Create your first persona to start automatically matching leads and personalizing your outreach.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowCreatePersona(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Persona
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
