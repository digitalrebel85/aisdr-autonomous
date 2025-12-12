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
  TrendingUp,
  X,
  Loader2,
  Check,
  AlertCircle
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
  sales_assets: string[];
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
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [createOfferError, setCreateOfferError] = useState<string | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);
  const [updateOfferError, setUpdateOfferError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    value_proposition: '',
    call_to_action: '',
    hook_snippet: '',
    pain_points: '',
    benefits: '',
    proof_points: '',
    sales_assets: ''
  });
  const [newOffer, setNewOffer] = useState({
    name: '',
    description: '',
    value_proposition: '',
    call_to_action: '',
    hook_snippet: '',
    pain_points: '',
    benefits: '',
    proof_points: '',
    sales_assets: ''
  });

  const supabase = createClientComponentClient();

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      name: offer.name,
      description: offer.description || '',
      value_proposition: offer.value_proposition || '',
      call_to_action: offer.call_to_action || '',
      hook_snippet: offer.hook_snippet || '',
      pain_points: Array.isArray(offer.pain_points) ? offer.pain_points.join(', ') : '',
      benefits: Array.isArray(offer.benefits) ? offer.benefits.join(', ') : '',
      proof_points: Array.isArray(offer.proof_points) ? offer.proof_points.join(', ') : '',
      sales_assets: Array.isArray(offer.sales_assets) ? offer.sales_assets.join(', ') : ''
    });
    setUpdateOfferError(null);
  };

  const handleUpdateOffer = async () => {
    if (!editingOffer || !editForm.name.trim() || !editForm.value_proposition.trim() || !editForm.call_to_action.trim()) {
      setUpdateOfferError('Please fill in all required fields');
      return;
    }

    setIsUpdatingOffer(true);
    setUpdateOfferError(null);

    try {
      const response = await fetch(`/api/offers/${editingOffer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          value_proposition: editForm.value_proposition,
          call_to_action: editForm.call_to_action,
          hook_snippet: editForm.hook_snippet,
          pain_points: editForm.pain_points ? editForm.pain_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          benefits: editForm.benefits ? editForm.benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
          proof_points: editForm.proof_points ? editForm.proof_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          sales_assets: editForm.sales_assets ? editForm.sales_assets.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchOffers();
        setEditingOffer(null);
      } else {
        setUpdateOfferError(data.error || 'Failed to update offer');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      setUpdateOfferError('Network error - please try again');
    } finally {
      setIsUpdatingOffer(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!newOffer.name.trim() || !newOffer.value_proposition.trim() || !newOffer.call_to_action.trim()) {
      setCreateOfferError('Please fill in all required fields');
      return;
    }

    setIsCreatingOffer(true);
    setCreateOfferError(null);

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOffer.name,
          description: newOffer.description,
          value_proposition: newOffer.value_proposition,
          call_to_action: newOffer.call_to_action,
          hook_snippet: newOffer.hook_snippet,
          pain_points: newOffer.pain_points ? newOffer.pain_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          benefits: newOffer.benefits ? newOffer.benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
          proof_points: newOffer.proof_points ? newOffer.proof_points.split(',').map(s => s.trim()).filter(Boolean) : [],
          sales_assets: newOffer.sales_assets ? newOffer.sales_assets.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh offers list
        await fetchOffers();
        setShowCreateOffer(false);
        setNewOffer({
          name: '',
          description: '',
          value_proposition: '',
          call_to_action: '',
          hook_snippet: '',
          pain_points: '',
          benefits: '',
          proof_points: '',
          sales_assets: ''
        });
      } else {
        setCreateOfferError(data.error || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setCreateOfferError('Network error - please try again');
    } finally {
      setIsCreatingOffer(false);
    }
  };

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
          pain_points: Array.isArray(offer.pain_points) ? offer.pain_points : [],
          benefits: Array.isArray(offer.benefits) ? offer.benefits : [],
          proof_points: Array.isArray(offer.proof_points) ? offer.proof_points : [],
          sales_assets: Array.isArray(offer.sales_assets) ? offer.sales_assets : [],
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
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
              <Target className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Offers & CTAs</h1>
              <p className="text-gray-400 mt-1">Manage your value propositions and call-to-actions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowCreateOffer(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="offers" className="w-full">
        <div className="bg-white/[0.03] rounded-xl border border-white/10 mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 rounded-t-xl">
            <TabsTrigger value="offers" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400">
              <Target className="w-4 h-4 mr-2" />
              Offers ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="personas" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400">
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
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-violet-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{offers.length}</div>
                <div className="text-sm text-gray-500">Total Offers</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{offers.length}</div>
                <div className="text-sm text-gray-500">Active Offers</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-fuchsia-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-fuchsia-400">{offers.filter(o => o.value_proposition).length}</div>
                <div className="text-sm text-gray-500">With Value Props</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">{offers.filter(o => o.call_to_action).length}</div>
                <div className="text-sm text-gray-500">With CTAs</div>
              </div>
            </div>

            {/* Offers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{offer.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{offer.description}</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Value Proposition</h4>
                      <p className="text-sm text-violet-200/80 bg-violet-500/10 p-3 rounded-xl border border-violet-500/20">
                        {offer.value_proposition}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-white mb-2">Call to Action</h4>
                      <p className="text-sm text-emerald-200/80 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        {offer.call_to_action}
                      </p>
                    </div>

                    {offer.hook_snippet && (
                      <div>
                        <h4 className="font-medium text-white mb-2">Hook Snippet</h4>
                        <p className="text-sm text-amber-200/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                          {offer.hook_snippet}
                        </p>
                      </div>
                    )}

                    {/* AI Strategy Fields */}
                    {(offer.pain_points?.length > 0 || offer.benefits?.length > 0 || offer.proof_points?.length > 0) && (
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          AI Strategy Data
                        </div>
                        
                        {offer.pain_points?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-red-400 uppercase">Pain Points</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {offer.pain_points.slice(0, 2).map((point, i) => (
                                <Badge key={i} className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                                  {typeof point === 'string' ? point.substring(0, 30) : point}{typeof point === 'string' && point.length > 30 ? '...' : ''}
                                </Badge>
                              ))}
                              {offer.pain_points.length > 2 && (
                                <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                                  +{offer.pain_points.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {offer.proof_points?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-fuchsia-400 uppercase">Proof Points</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {offer.proof_points.slice(0, 2).map((point, i) => (
                                <Badge key={i} className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                                  {typeof point === 'string' ? point.substring(0, 30) : point}{typeof point === 'string' && point.length > 30 ? '...' : ''}
                                </Badge>
                              ))}
                              {offer.proof_points.length > 2 && (
                                <Badge className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                                  +{offer.proof_points.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {offer.benefits?.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-emerald-400 uppercase">Benefits</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {offer.benefits.slice(0, 2).map((benefit, i) => (
                                <Badge key={i} className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                  {typeof benefit === 'string' ? benefit.substring(0, 30) : benefit}{typeof benefit === 'string' && benefit.length > 30 ? '...' : ''}
                                </Badge>
                              ))}
                              {offer.benefits.length > 2 && (
                                <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                  +{offer.benefits.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/5">
                      <div className="text-center">
                        <div className="text-sm text-gray-500">
                          Created: {new Date(offer.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => setViewingOffer(offer)} className="bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" onClick={() => openEditModal(offer)} className="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button size="sm" className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
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
                <h2 className="text-xl font-semibold text-white">AI Personas</h2>
                <p className="text-gray-400 text-sm">Automatically match leads to personas for personalized outreach</p>
              </div>
              <Button onClick={() => setShowCreatePersona(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Persona
              </Button>
            </div>

            {/* Personas Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-fuchsia-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-fuchsia-400">{personas.length}</div>
                <div className="text-sm text-gray-500">Total Personas</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{personas.filter(p => p.is_default).length}</div>
                <div className="text-sm text-gray-500">Default Personas</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-violet-400">{personas.reduce((sum, p) => sum + p.usage_count, 0)}</div>
                <div className="text-sm text-gray-500">Total Usage</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">
                  {personas.length > 0 ? Math.round(personas.reduce((sum, p) => sum + p.effectiveness_score, 0) / personas.length) : 0}%
                </div>
                <div className="text-sm text-gray-500">Avg Effectiveness</div>
              </div>
            </div>

            {/* Personas List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {personas.map((persona) => (
                <div key={persona.id} className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        {persona.name}
                        {persona.is_default && (
                          <Badge className="ml-2 text-xs bg-violet-500/20 text-violet-400 border-violet-500/30">
                            Default
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{persona.description}</p>
                    </div>
                    <Badge className={persona.effectiveness_score > 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                      {persona.effectiveness_score}% effective
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {/* Title Patterns */}
                    {persona.title_patterns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-2 text-sm">Target Titles</h4>
                        <div className="flex flex-wrap gap-1">
                          {persona.title_patterns.slice(0, 3).map(title => (
                            <Badge key={title} className="text-xs bg-white/5 text-gray-300 border-white/10">
                              {title}
                            </Badge>
                          ))}
                          {persona.title_patterns.length > 3 && (
                            <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                              +{persona.title_patterns.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Industries */}
                    {persona.industries.length > 0 && (
                      <div>
                        <h4 className="font-medium text-white mb-2 text-sm">Industries</h4>
                        <div className="flex flex-wrap gap-1">
                          {persona.industries.slice(0, 2).map(industry => (
                            <Badge key={industry} className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                              {industry}
                            </Badge>
                          ))}
                          {persona.industries.length > 2 && (
                            <Badge className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                              +{persona.industries.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Messaging Tone */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Tone:</span>
                      <Badge className="capitalize text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                        {persona.tone}
                      </Badge>
                    </div>

                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-white/5">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Target className="w-4 h-4 text-fuchsia-400" />
                        <span>{persona.usage_count} uses</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>{persona.conversion_rate}% conversion</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 hover:bg-fuchsia-500/30">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" className="bg-white/5 text-gray-300 border-white/10 hover:bg-white/10">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      <Button size="sm" className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {personas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl flex items-center justify-center">
                    <Users className="w-12 h-12 text-fuchsia-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Personas Yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Create your first persona to start automatically matching leads and personalizing your outreach.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowCreatePersona(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Persona
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

        {/* Create Offer Modal */}
        {showCreateOffer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Create New Offer</h2>
                  <p className="text-sm text-gray-600 mt-1">Define your value proposition and messaging</p>
                </div>
                <button
                  onClick={() => setShowCreateOffer(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOffer.name}
                    onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                    placeholder="e.g., AI SDR Platform, Free Strategy Session"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    placeholder="Brief description of what this offer is about..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Value Proposition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value Proposition <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newOffer.value_proposition}
                    onChange={(e) => setNewOffer({ ...newOffer, value_proposition: e.target.value })}
                    placeholder="What value does this offer provide? e.g., We eliminate the need for hiring SDRs by automating outbound..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Call to Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call to Action <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newOffer.call_to_action}
                    onChange={(e) => setNewOffer({ ...newOffer, call_to_action: e.target.value })}
                    placeholder="e.g., Book a 15-minute call, Start your free trial, Get your free report"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Hook Snippet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hook Snippet
                  </label>
                  <input
                    type="text"
                    value={newOffer.hook_snippet}
                    onChange={(e) => setNewOffer({ ...newOffer, hook_snippet: e.target.value })}
                    placeholder="e.g., AI that sounds human and books meetings like a top-performing SDR"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* AI Strategy Fields Section */}
                <div className="border-t border-gray-200 pt-5 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">AI Strategy Fields</span>
                    <span className="text-sm text-gray-500">- These help generate better campaign strategies</span>
                  </div>

                  {/* Pain Points */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pain Points <span className="text-gray-400">(problems your offer solves)</span>
                    </label>
                    <textarea
                      value={newOffer.pain_points}
                      onChange={(e) => setNewOffer({ ...newOffer, pain_points: e.target.value })}
                      placeholder="e.g., Manual prospecting takes too much time, Low response rates from cold outreach, Difficulty scaling sales team (comma separated)"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Benefits */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Benefits <span className="text-gray-400">(what customers get)</span>
                    </label>
                    <textarea
                      value={newOffer.benefits}
                      onChange={(e) => setNewOffer({ ...newOffer, benefits: e.target.value })}
                      placeholder="e.g., Save 10+ hours per week, Reduce customer acquisition cost by 40%, Scale without hiring (comma separated)"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Proof Points */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proof Points <span className="text-gray-400">(social proof & results)</span>
                    </label>
                    <textarea
                      value={newOffer.proof_points}
                      onChange={(e) => setNewOffer({ ...newOffer, proof_points: e.target.value })}
                      placeholder="e.g., 3x increase in qualified leads, 90% reduction in manual tasks, ROI positive within 30 days (comma separated)"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Sales Assets / Lead Magnets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Magnets / Sales Assets <span className="text-gray-400">(value offers)</span>
                    </label>
                    <textarea
                      value={newOffer.sales_assets}
                      onChange={(e) => setNewOffer({ ...newOffer, sales_assets: e.target.value })}
                      placeholder="e.g., Free ROI Calculator, Industry Benchmark Report, Strategy Session, Product Demo (comma separated)"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {createOfferError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {createOfferError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateOffer(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOffer}
                  disabled={!newOffer.name.trim() || !newOffer.value_proposition.trim() || !newOffer.call_to_action.trim() || isCreatingOffer}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  {isCreatingOffer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Offer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Offer Modal */}
        {viewingOffer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewingOffer.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Offer Details</p>
                </div>
                <button
                  onClick={() => setViewingOffer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {viewingOffer.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{viewingOffer.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Value Proposition</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">{viewingOffer.value_proposition}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Call to Action</h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">{viewingOffer.call_to_action}</p>
                </div>

                {viewingOffer.hook_snippet && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Hook Snippet</h4>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">{viewingOffer.hook_snippet}</p>
                  </div>
                )}

                {/* AI Strategy Fields */}
                <div className="border-t border-gray-200 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">AI Strategy Data</span>
                  </div>

                  {viewingOffer.pain_points?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-red-600 uppercase mb-2">Pain Points</h4>
                      <ul className="space-y-1">
                        {viewingOffer.pain_points.map((point, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingOffer.benefits?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-600 uppercase mb-2">Benefits</h4>
                      <ul className="space-y-1">
                        {viewingOffer.benefits.map((benefit, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingOffer.proof_points?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-purple-600 uppercase mb-2">Proof Points</h4>
                      <ul className="space-y-1">
                        {viewingOffer.proof_points.map((point, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-purple-500 mt-0.5">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingOffer.sales_assets?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-orange-600 uppercase mb-2">Lead Magnets / Sales Assets</h4>
                      <ul className="space-y-1">
                        {viewingOffer.sales_assets.map((asset, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            {asset}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!viewingOffer.pain_points?.length && !viewingOffer.benefits?.length && !viewingOffer.proof_points?.length && !viewingOffer.sales_assets?.length && (
                    <p className="text-sm text-gray-500 italic">No AI strategy data configured for this offer.</p>
                  )}
                </div>

                <div className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                  Created: {new Date(viewingOffer.created_at).toLocaleString()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <Button variant="outline" onClick={() => setViewingOffer(null)} className="px-6">
                  Close
                </Button>
                <Button onClick={() => { openEditModal(viewingOffer); setViewingOffer(null); }} className="bg-blue-600 hover:bg-blue-700 px-6">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Offer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Offer Modal */}
        {editingOffer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Offer</h2>
                  <p className="text-sm text-gray-600 mt-1">Update your offer details</p>
                </div>
                <button
                  onClick={() => setEditingOffer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Value Proposition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value Proposition <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editForm.value_proposition}
                    onChange={(e) => setEditForm({ ...editForm, value_proposition: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Call to Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call to Action <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.call_to_action}
                    onChange={(e) => setEditForm({ ...editForm, call_to_action: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Hook Snippet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hook Snippet</label>
                  <input
                    type="text"
                    value={editForm.hook_snippet}
                    onChange={(e) => setEditForm({ ...editForm, hook_snippet: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* AI Strategy Fields Section */}
                <div className="border-t border-gray-200 pt-5 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-900">AI Strategy Fields</span>
                  </div>

                  {/* Pain Points */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pain Points <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <textarea
                      value={editForm.pain_points}
                      onChange={(e) => setEditForm({ ...editForm, pain_points: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Benefits */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Benefits <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <textarea
                      value={editForm.benefits}
                      onChange={(e) => setEditForm({ ...editForm, benefits: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Proof Points */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proof Points <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <textarea
                      value={editForm.proof_points}
                      onChange={(e) => setEditForm({ ...editForm, proof_points: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Sales Assets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Magnets / Sales Assets <span className="text-gray-400">(comma separated)</span>
                    </label>
                    <textarea
                      value={editForm.sales_assets}
                      onChange={(e) => setEditForm({ ...editForm, sales_assets: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {updateOfferError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {updateOfferError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <Button variant="outline" onClick={() => setEditingOffer(null)} className="px-6">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateOffer}
                  disabled={!editForm.name.trim() || !editForm.value_proposition.trim() || !editForm.call_to_action.trim() || isUpdatingOffer}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  {isUpdatingOffer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
