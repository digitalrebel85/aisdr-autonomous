"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Trash2,
  Target,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Sparkles,
  BarChart3,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface ICPAngle {
  id: string;
  icp_profile_id: string;
  name: string;
  description: string;
  value_proposition: string;
  pain_points: string[];
  hooks: string[];
  proof_points: string[];
  objection_handlers: string[];
  tone: string;
  is_active: boolean;
  is_control: boolean;
  performance_stats: {
    emails_sent: number;
    opens: number;
    replies: number;
    positive_replies: number;
    meetings_booked: number;
    open_rate: number;
    reply_rate: number;
    positive_rate: number;
  };
  created_at: string;
}

interface ICP {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  name: string;
  product_service_name: string;
  value_proposition: string;
  company_description: string;
  pain_points: string[];
  benefits: string[];
  proof_points: string[];
  call_to_action: string;
}

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
  { value: 'urgent', label: 'Urgent', description: 'Time-sensitive and action-oriented' },
  { value: 'consultative', label: 'Consultative', description: 'Advisory and helpful' },
  { value: 'challenger', label: 'Challenger', description: 'Provocative and thought-provoking' },
];

export default function ICPAnglesPage() {
  const params = useParams();
  const router = useRouter();
  const icpId = params.id as string;

  const [angles, setAngles] = useState<ICPAngle[]>([]);
  const [icp, setIcp] = useState<ICP | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(2);
  const [remaining, setRemaining] = useState(0);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingAngle, setEditingAngle] = useState<ICPAngle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value_proposition: '',
    pain_points: [] as string[],
    hooks: [] as string[],
    proof_points: [] as string[],
    objection_handlers: [] as string[],
    tone: 'professional',
    is_control: false
  });

  // AI Generation state
  const [generating, setGenerating] = useState(false);
  const [suggestedAngles, setSuggestedAngles] = useState<any[]>([]);
  
  // Offer selection for AI generation
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [showOfferSelector, setShowOfferSelector] = useState(false);

  useEffect(() => {
    fetchAngles();
    fetchOffers();
  }, [icpId]);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || data || []);
        // Auto-select first offer if available
        if ((data.offers || data)?.length > 0) {
          setSelectedOfferId((data.offers || data)[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const fetchAngles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/icp/${icpId}/angles`);
      if (response.ok) {
        const data = await response.json();
        setAngles(data.angles || []);
        setIcp(data.icp);
        setLimit(data.limit);
        setRemaining(data.remaining);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to fetch angles');
      }
    } catch (error) {
      console.error('Error fetching angles:', error);
      setError('Failed to fetch angles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingAngle 
        ? `/api/icp/${icpId}/angles/${editingAngle.id}`
        : `/api/icp/${icpId}/angles`;
      
      const response = await fetch(url, {
        method: editingAngle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAngles();
        resetForm();
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save angle');
      }
    } catch (error) {
      console.error('Error saving angle:', error);
      setError('Failed to save angle');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (angle: ICPAngle) => {
    setFormData({
      name: angle.name,
      description: angle.description || '',
      value_proposition: angle.value_proposition,
      pain_points: angle.pain_points || [],
      hooks: angle.hooks || [],
      proof_points: angle.proof_points || [],
      objection_handlers: angle.objection_handlers || [],
      tone: angle.tone || 'professional',
      is_control: angle.is_control || false
    });
    setEditingAngle(angle);
    setShowForm(true);
  };

  const handleDelete = async (angleId: string) => {
    if (!confirm('Are you sure you want to delete this angle?')) return;

    try {
      const response = await fetch(`/api/icp/${icpId}/angles/${angleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAngles();
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to delete angle');
      }
    } catch (error) {
      console.error('Error deleting angle:', error);
      setError('Failed to delete angle');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      value_proposition: '',
      pain_points: [],
      hooks: [],
      proof_points: [],
      objection_handlers: [],
      tone: 'professional',
      is_control: false
    });
    setEditingAngle(null);
    setShowForm(false);
    setError(null);
  };

  const addToArray = (field: keyof typeof formData, value: string) => {
    if (value.trim() && !((formData[field] as string[]).includes(value.trim()))) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  // Show offer selector before generating
  const initiateGenerateAngles = () => {
    if (offers.length === 0) {
      setError('No offers found. Please create an offer first.');
      return;
    }
    setShowOfferSelector(true);
  };

  // AI Generate Angles with selected offer
  const handleGenerateAngles = async () => {
    if (!selectedOfferId) {
      setError('Please select an offer');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuggestedAngles([]);
    setShowOfferSelector(false);

    try {
      const existingAngleNames = angles.filter(a => a.is_active).map(a => a.name);
      const selectedOffer = offers.find(o => o.id === selectedOfferId);
      
      const response = await fetch(`/api/icp/${icpId}/angles/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Math.min(remaining, 3), // Generate up to 3 or remaining limit
          existing_angles: existingAngleNames,
          offer_id: selectedOfferId,
          offer: selectedOffer ? {
            name: selectedOffer.name,
            product_service_name: selectedOffer.product_service_name,
            value_proposition: selectedOffer.value_proposition,
            company_description: selectedOffer.company_description,
            pain_points: selectedOffer.pain_points,
            benefits: selectedOffer.benefits,
            proof_points: selectedOffer.proof_points,
            call_to_action: selectedOffer.call_to_action
          } : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedAngles(data.angles || []);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to generate angles');
      }
    } catch (error) {
      console.error('Error generating angles:', error);
      setError('Failed to generate angles');
    } finally {
      setGenerating(false);
    }
  };

  // Use a suggested angle
  const useSuggestedAngle = (angle: any) => {
    setFormData({
      name: angle.name,
      description: angle.description || '',
      value_proposition: angle.value_proposition,
      pain_points: angle.pain_points || [],
      hooks: angle.hooks || [],
      proof_points: angle.proof_points || [],
      objection_handlers: [],
      tone: angle.tone || 'professional',
      is_control: false
    });
    setShowForm(true);
    // Remove from suggestions
    setSuggestedAngles(prev => prev.filter(a => a.name !== angle.name));
  };

  // Save suggested angle directly
  const saveSuggestedAngle = async (angle: any) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/icp/${icpId}/angles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: angle.name,
          description: angle.description || '',
          value_proposition: angle.value_proposition,
          pain_points: angle.pain_points || [],
          hooks: angle.hooks || [],
          proof_points: angle.proof_points || [],
          tone: angle.tone || 'professional',
          is_control: false
        })
      });

      if (response.ok) {
        await fetchAngles();
        setSuggestedAngles(prev => prev.filter(a => a.name !== angle.name));
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save angle');
      }
    } catch (error) {
      console.error('Error saving angle:', error);
      setError('Failed to save angle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/icp">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to ICPs
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Messaging Angles</h1>
                <p className="text-gray-400 mt-1">
                  {icp?.name} • {angles.length} angle{angles.length !== 1 ? 's' : ''} • {remaining} remaining
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                {limit === Infinity ? 'Unlimited' : `${limit} max`}
              </Badge>
              <Button 
                onClick={initiateGenerateAngles}
                disabled={generating || (remaining <= 0 && limit !== Infinity)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowForm(true)}
                disabled={remaining <= 0 && limit !== Infinity}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manually
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Offer Selector Modal */}
        {showOfferSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Generate Angles with AI</h3>
                      <p className="text-sm text-gray-400">Select an offer to base the angles on</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowOfferSelector(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-gray-300 mb-2 block">Select Offer</Label>
                  <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose an offer..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {offers.map((offer) => (
                        <SelectItem 
                          key={offer.id} 
                          value={offer.id}
                          className="text-white hover:bg-white/10"
                        >
                          <div className="flex flex-col">
                            <span>{offer.name || offer.product_service_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOfferId && (
                  <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                    <div className="text-xs text-gray-500 mb-2">Selected Offer Preview</div>
                    {(() => {
                      const offer = offers.find(o => o.id === selectedOfferId);
                      if (!offer) return null;
                      return (
                        <div className="space-y-2">
                          <div className="text-sm text-white font-medium">{offer.product_service_name || offer.name}</div>
                          {offer.value_proposition && (
                            <p className="text-xs text-gray-400 line-clamp-2">{offer.value_proposition}</p>
                          )}
                          {offer.pain_points?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {offer.pain_points.slice(0, 3).map((pp, i) => (
                                <Badge key={i} className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                                  {typeof pp === 'string' ? pp : (pp as any).point || pp}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  The AI will analyze your ICP and this offer to generate {Math.min(remaining, 3)} unique messaging angles 
                  with different psychological triggers and value propositions.
                </p>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowOfferSelector(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerateAngles}
                  disabled={!selectedOfferId || generating}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Angles
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggested Angles */}
        {suggestedAngles.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-violet-600/10 rounded-2xl border border-cyan-500/30 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">AI-Generated Angles</h3>
                  <p className="text-sm text-gray-400">Review and save the angles you like</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSuggestedAngles([])}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {suggestedAngles.map((angle, idx) => (
                <div key={idx} className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{angle.name}</h4>
                      <Badge className={`text-xs mt-1 ${
                        angle.tone === 'professional' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        angle.tone === 'casual' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        angle.tone === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        angle.tone === 'consultative' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                        'bg-orange-500/20 text-orange-300 border-orange-500/30'
                      }`}>
                        {angle.tone}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{angle.description}</p>
                  
                  <div className="bg-white/[0.02] rounded-lg p-3 mb-3 border border-white/5">
                    <p className="text-sm text-gray-300">{angle.value_proposition}</p>
                  </div>
                  
                  {angle.hooks?.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Sample Hook:</div>
                      <p className="text-xs text-cyan-300 italic">"{angle.hooks[0]}"</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <Button 
                      size="sm"
                      onClick={() => saveSuggestedAngle(angle)}
                      disabled={saving}
                      className="flex-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => useSuggestedAngle(angle)}
                      className="flex-1 bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setSuggestedAngles(prev => prev.filter((_, i) => i !== idx))}
                      className="bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 mb-6 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingAngle ? 'Edit' : 'Create'} Messaging Angle
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Define a unique value proposition and messaging approach
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Angle Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Time Savings, Revenue Growth"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Tone</Label>
                  <Select 
                    value={formData.tone} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/10">
                      {TONE_OPTIONS.map(tone => (
                        <SelectItem key={tone.value} value={tone.value} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">
                          <div>
                            <div>{tone.label}</div>
                            <div className="text-xs text-gray-500">{tone.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Value Proposition *</Label>
                <Textarea
                  value={formData.value_proposition}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_proposition: e.target.value }))}
                  placeholder="The core message of this angle. e.g., 'Stop wasting 20+ hours per week on manual prospecting. Our AI handles it in minutes.'"
                  required
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-gray-300">Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of when to use this angle"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Pain Points */}
              <div>
                <Label className="text-gray-300">Pain Points This Angle Addresses</Label>
                <Input
                  placeholder="Add pain point and press Enter"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('pain_points', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.pain_points.map((point, idx) => (
                    <Badge 
                      key={idx} 
                      className="cursor-pointer bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30"
                      onClick={() => removeFromArray('pain_points', point)}
                    >
                      {point} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Hooks */}
              <div>
                <Label className="text-gray-300">Opening Hooks</Label>
                <Input
                  placeholder="Add hook and press Enter (e.g., 'What if you could get your prospecting done while you sleep?')"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('hooks', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.hooks.map((hook, idx) => (
                    <Badge 
                      key={idx} 
                      className="cursor-pointer bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30"
                      onClick={() => removeFromArray('hooks', hook)}
                    >
                      {hook} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Proof Points */}
              <div>
                <Label className="text-gray-300">Proof Points / Social Proof</Label>
                <Input
                  placeholder="Add proof point and press Enter (e.g., 'Customers save 25 hours/week on average')"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('proof_points', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.proof_points.map((point, idx) => (
                    <Badge 
                      key={idx} 
                      className="cursor-pointer bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                      onClick={() => removeFromArray('proof_points', point)}
                    >
                      {point} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Control Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_control"
                  checked={formData.is_control}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_control: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500"
                />
                <Label htmlFor="is_control" className="text-gray-300 cursor-pointer">
                  Mark as control variant for A/B testing
                </Label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <Button type="button" onClick={resetForm} className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingAngle ? 'Update' : 'Create'} Angle
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Angles List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {angles.filter(a => a.is_active).map((angle) => (
            <div 
              key={angle.id} 
              className={`bg-white/[0.03] rounded-2xl border p-5 transition-all ${
                angle.is_control 
                  ? 'border-amber-500/30 hover:border-amber-500/50' 
                  : 'border-white/10 hover:border-violet-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{angle.name}</h3>
                    {angle.is_control && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                        Control
                      </Badge>
                    )}
                    <Badge className={`text-xs ${
                      angle.tone === 'professional' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      angle.tone === 'casual' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      angle.tone === 'urgent' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      angle.tone === 'consultative' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}>
                      {angle.tone}
                    </Badge>
                  </div>
                  {angle.description && (
                    <p className="text-sm text-gray-400 mt-1">{angle.description}</p>
                  )}
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-white/[0.02] rounded-xl p-4 mb-4 border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  Value Proposition
                </div>
                <p className="text-white text-sm">{angle.value_proposition}</p>
              </div>

              {/* Hooks Preview */}
              {angle.hooks?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    Hooks
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {angle.hooks.slice(0, 2).map((hook, idx) => (
                      <Badge key={idx} className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                        "{hook.substring(0, 40)}{hook.length > 40 ? '...' : ''}"
                      </Badge>
                    ))}
                    {angle.hooks.length > 2 && (
                      <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                        +{angle.hooks.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{angle.performance_stats?.emails_sent || 0}</div>
                  <div className="text-xs text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">{angle.performance_stats?.open_rate || 0}%</div>
                  <div className="text-xs text-gray-500">Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-violet-400">{angle.performance_stats?.reply_rate || 0}%</div>
                  <div className="text-xs text-gray-500">Reply Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">{angle.performance_stats?.meetings_booked || 0}</div>
                  <div className="text-xs text-gray-500">Meetings</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    className="bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30"
                    onClick={() => handleEdit(angle)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                  onClick={() => handleDelete(angle.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {angles.filter(a => a.is_active).length === 0 && !showForm && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
              <Lightbulb className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Messaging Angles Yet</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Create different messaging angles to A/B test value propositions and find what resonates with your ICP.
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Angle
            </Button>
          </div>
        )}

        {/* Limit Warning */}
        {remaining <= 0 && limit !== Infinity && (
          <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300">
                You've reached your limit of {limit} angles per ICP. Upgrade your plan to add more.
              </span>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">
                <Zap className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
