'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface ICPProfile {
  id: number;
  name: string;
  description: string;
  leads_scored: number;
}

interface Offer {
  id: number;
  name: string;
  description: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet: string;
  sales_assets?: string[];  // Lead magnets: webinars, whitepapers, consultations
  proof_points?: string[];  // Social proof: case studies, testimonials, ROI data
  pain_points?: string[];
  benefits?: string[];
}

interface VariantRecommendation {
  name: string;
  variant_letter: string;
  strategy: string;
  config: Record<string, string>;
  reasoning: string;
  expected_performance: number;
}

interface TestStrategy {
  recommended_test_type: string;
  reasoning: string;
  confidence_score: number;
  variants: VariantRecommendation[];
  next_test_after_winner: {
    test_type: string;
    reasoning: string;
  };
  historical_data_points: number;
}

interface AIRecommendation {
  framework: {
    framework: string;
    reasoning: string;
    alternative: string;
    confidence: number;
    touchPointStrategy: Record<string, string>;
  };
  sequence: {
    touches: number;
    timeline: string;
    reasoning: string;
    schedule: Array<{
      step: number;
      delay: number;
      type: string;
      focus: string;
    }>;
    confidence: number;
  };
  insights: {
    painPoints: string[];
    valuePropositions: string[];
    proofPoints?: string[];
    leadMagnets?: string[];
    competitiveInsights: any;
    triggerEvents: string[];
    bestPractices: string[];
  };
}

export default function CampaignStrategyWizard() {
  const router = useRouter();
  const supabase = createClient();
  
  // Wizard Steps
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Form Data
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState<string>('meetings');
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([]);
  const [selectedIcpProfile, setSelectedIcpProfile] = useState<number | null>(null);
  const [targetPersona, setTargetPersona] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  
  // AI Recommendations
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // AI Test Strategy
  const [testStrategy, setTestStrategy] = useState<TestStrategy | null>(null);
  const [isLoadingTestStrategy, setIsLoadingTestStrategy] = useState(false);
  const [acceptedAIStrategy, setAcceptedAIStrategy] = useState(false);
  
  // User Overrides
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [selectedTouches, setSelectedTouches] = useState<number>(3);
  
  // Loading & Error
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchICPProfiles();
    fetchOffers();
  }, []);

  const fetchICPProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('icp_profiles')
        .select('id, name, description, leads_scored')
        .eq('status', 'active')
        .order('leads_scored', { ascending: false });

      if (error) throw error;
      setIcpProfiles(data || []);
    } catch (err) {
      console.error('Error fetching ICP profiles:', err);
    }
  };

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('id, name, description, value_proposition, call_to_action, hook_snippet, sales_assets, proof_points, pain_points, benefits')
        // Show all offers (not just active)
        // .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching offers:', error);
        throw error;
      }
      
      console.log('Fetched offers:', data);
      console.log('Number of offers:', data?.length || 0);
      setOffers(data || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const getAIRecommendations = async () => {
    setIsLoadingAI(true);
    try {
      const selectedOfferData = offers.find(o => o.id === selectedOffer);
      
      const response = await fetch('/api/campaigns/ai-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective,
          icp_profile_id: selectedIcpProfile,
          target_persona: targetPersona,
          campaign_name: campaignName,
          offer: selectedOfferData ? {
            name: selectedOfferData.name,
            description: selectedOfferData.description,
            value_proposition: selectedOfferData.value_proposition,
            call_to_action: selectedOfferData.call_to_action,
            sales_assets: selectedOfferData.sales_assets || [],  // Lead magnets
            proof_points: selectedOfferData.proof_points || [],  // Social proof
            pain_points: selectedOfferData.pain_points || [],
            benefits: selectedOfferData.benefits || []
          } : null
        })
      });

      if (!response.ok) throw new Error('Failed to get AI recommendations');
      
      const data = await response.json();
      setAiRecommendations(data.recommendations);
      
      // Set defaults from AI
      setSelectedFramework(data.recommendations.framework.framework);
      setSelectedTouches(data.recommendations.sequence.touches);
      
    } catch (err) {
      console.error('Error getting AI recommendations:', err);
      setError('Failed to get AI recommendations');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getTestStrategy = async () => {
    setIsLoadingTestStrategy(true);
    setError('');
    
    try {
      const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:8000';
      
      const selectedOfferData = offers.find(o => o.id === selectedOffer);
      const selectedICPData = icpProfiles.find(icp => icp.id === selectedIcpProfile);
      
      // TODO: Fetch historical campaigns from database
      const historicalCampaigns: any[] = [];
      
      const response = await fetch(`${pythonServiceUrl}/recommend-test-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'current_user', // TODO: Get from auth
          campaign_name: campaignName,
          objective,
          target_persona: targetPersona,
          icp_profile: selectedICPData ? {
            name: selectedICPData.name,
            industries: [],
            pain_points: [],
            company_size: null,
            job_titles: []
          } : null,
          offer: selectedOfferData ? {
            name: selectedOfferData.name,
            value_proposition: selectedOfferData.value_proposition,
            call_to_action: selectedOfferData.call_to_action,
            sales_assets: selectedOfferData.sales_assets || [],
            proof_points: selectedOfferData.proof_points || [],
            benefits: selectedOfferData.benefits || []
          } : null,
          historical_campaigns: historicalCampaigns
        })
      });

      if (!response.ok) throw new Error('Failed to get test strategy');
      
      const data = await response.json();
      setTestStrategy(data);
      
    } catch (err) {
      console.error('Error getting test strategy:', err);
      setError('Failed to get test strategy recommendations');
    } finally {
      setIsLoadingTestStrategy(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2 && !aiRecommendations) {
      await getAIRecommendations();
    }
    
    if (currentStep === 3 && !testStrategy) {
      await getTestStrategy();
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    setError('');
    
    try {
      // Step 1: Generate variant emails using CrewAI
      if (testStrategy && acceptedAIStrategy) {
        const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:8000';
        
        const selectedOfferData = offers.find(o => o.id === selectedOffer);
        const selectedICPData = icpProfiles.find(icp => icp.id === selectedIcpProfile);
        
        // Generate emails for all variants
        const variantResponse = await fetch(`${pythonServiceUrl}/generate-variant-emails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_name: campaignName,
            objective,
            target_persona: targetPersona,
            icp_profile: selectedICPData ? {
              name: selectedICPData.name,
              industries: [],
              pain_points: [],
              company_size: null,
              job_titles: []
            } : null,
            offer: selectedOfferData ? {
              name: selectedOfferData.name,
              value_proposition: selectedOfferData.value_proposition,
              call_to_action: selectedOfferData.call_to_action,
              sales_assets: selectedOfferData.sales_assets || [],
              proof_points: selectedOfferData.proof_points || [],
              benefits: selectedOfferData.benefits || []
            } : null,
            variants: testStrategy.variants,
            num_touches: selectedTouches
          })
        });

        if (!variantResponse.ok) {
          throw new Error('Failed to generate variant emails');
        }

        const variantData = await variantResponse.json();
        
        // Step 2: Create campaign
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: campaign, error: campaignError } = await supabase
          .from('outreach_campaigns')
          .insert({
            user_id: user.id,
            name: campaignName,
            objective,
            status: 'active' // Changed from 'draft' to match check constraint
          })
          .select()
          .single();

        if (campaignError) throw campaignError;

        // Step 3: Create A/B test config
        const { data: testConfig, error: testConfigError } = await supabase
          .from('ab_test_configs')
          .insert({
            campaign_id: campaign.id,
            user_id: user.id,
            test_strategy: 'ai_recommended',
            primary_test_type: testStrategy.recommended_test_type,
            min_sample_size: 100,
            confidence_threshold: 95.0,
            test_duration_days: 7,
            split_method: 'equal',
            auto_optimize: true,
            auto_pause_losers: true,
            ai_recommendation: testStrategy,
            user_override: false
          })
          .select()
          .single();

        if (testConfigError) throw testConfigError;

        // Step 4: Create variants with generated emails
        const variantInserts = variantData.variants.map((variant: any) => ({
          campaign_id: campaign.id,
          user_id: user.id,
          variant_name: variant.name,
          variant_letter: variant.variant_letter,
          test_type: testStrategy.recommended_test_type,
          variant_config: variant.config,
          email_templates: variant.email_sequence,
          expected_performance: variant.expected_performance,
          ai_reasoning: variant.reasoning,
          status: 'active'
        }));

        const { error: variantsError } = await supabase
          .from('campaign_variants')
          .insert(variantInserts);

        if (variantsError) throw variantsError;

        // Step 5: Record AI decision
        await supabase
          .from('ai_test_decisions')
          .insert({
            user_id: user.id,
            campaign_id: campaign.id,
            recommended_test_type: testStrategy.recommended_test_type,
            reasoning: testStrategy.reasoning,
            confidence_score: testStrategy.confidence_score,
            historical_data_points: testStrategy.historical_data_points,
            predicted_variants: testStrategy.variants,
            user_accepted: acceptedAIStrategy
          });

        // Success! Redirect to campaign details
        router.push(`/dashboard/campaigns/${campaign.id}`);
        
      } else {
        // Fallback to old flow if no test strategy
        const { data: sequence, error: seqError } = await supabase
          .from('campaign_sequences')
          .insert({
            name: `${campaignName} - Sequence`,
            description: `AI-generated sequence for ${objective}`,
            objective,
            icp_profile_id: selectedIcpProfile,
            offer_id: selectedOffer,
            messaging_framework: selectedFramework,
            ai_recommended_framework: aiRecommendations?.framework.framework,
            framework_reasoning: aiRecommendations?.framework.reasoning,
            total_touches: selectedTouches,
            ai_recommended_touches: aiRecommendations?.sequence.touches,
            status: 'active'
          })
          .select()
          .single();

        if (seqError) throw seqError;

        router.push(`/dashboard/campaigns/sequences/${sequence.id}`);
      }
      
    } catch (err) {
      console.error('Error creating campaign:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create campaign';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle Supabase errors
        const supabaseError = err as any;
        if (supabaseError.message) errorMessage = supabaseError.message;
        if (supabaseError.hint) errorMessage += ` (${supabaseError.hint})`;
        if (supabaseError.details) errorMessage += ` - ${supabaseError.details}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const objectives = [
    { value: 'meetings', label: 'Book Meetings', icon: Users, description: 'Get prospects on your calendar' },
    { value: 'demos', label: 'Schedule Demos', icon: Target, description: 'Show your product in action' },
    { value: 'trials', label: 'Drive Trials', icon: Zap, description: 'Get users to try your product' },
    { value: 'sales', label: 'Close Sales', icon: TrendingUp, description: 'Direct sales conversations' },
    { value: 'awareness', label: 'Build Awareness', icon: Lightbulb, description: 'Educate and nurture' }
  ];

  const frameworks = [
    { code: 'AIDA', name: 'AIDA', description: 'Attention → Interest → Desire → Action' },
    { code: 'PAS', name: 'PAS', description: 'Problem → Agitate → Solution' },
    { code: 'BAB', name: 'BAB', description: 'Before → After → Bridge' },
    { code: '4Ps', name: '4Ps', description: 'Picture → Promise → Prove → Push' },
    { code: 'FAB', name: 'FAB', description: 'Features → Advantages → Benefits' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Campaign Strategy Wizard</h1>
              <p className="text-gray-400">AI-powered campaign planning like a real SDR</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  currentStep >= step 
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30' 
                    : 'bg-white/5 text-gray-500 border border-white/10'
                }`}>
                  {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
                </div>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${
                    currentStep > step ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Objective</span>
            <span>AI Research</span>
            <span>Framework</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-8 mb-6 backdrop-blur-sm">
          {/* Step 1: Campaign Objective */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">What's your campaign goal?</h2>
                <p className="text-gray-400">Choose your primary objective</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Q1 Enterprise Outreach"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((obj) => {
                  const Icon = obj.icon;
                  return (
                    <button
                      key={obj.value}
                      onClick={() => setObjective(obj.value)}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        objective === obj.value
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-violet-500/50 hover:bg-white/[0.05]'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-3 ${
                        objective === obj.value ? 'text-violet-400' : 'text-gray-500'
                      }`} />
                      <h3 className="font-semibold text-white mb-1">{obj.label}</h3>
                      <p className="text-sm text-gray-400">{obj.description}</p>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target ICP Profile (Optional)
                </label>
                <select
                  value={selectedIcpProfile || ''}
                  onChange={(e) => setSelectedIcpProfile(Number(e.target.value) || null)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                >
                  <option value="" className="bg-[#0a0a0f]">Select ICP profile...</option>
                  {icpProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id} className="bg-[#0a0a0f]">
                      {profile.name} ({profile.leads_scored} scored leads)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Persona Description
                </label>
                <textarea
                  value={targetPersona}
                  onChange={(e) => setTargetPersona(e.target.value)}
                  placeholder="e.g., VP of Sales at mid-market SaaS companies"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Offer <span className="text-red-400">*</span>
                </label>
                {/* Debug info */}
                <div className="mb-2 text-xs text-gray-500">
                  Debug: {offers.length} offers loaded
                </div>
                <select
                  value={selectedOffer || ''}
                  onChange={(e) => setSelectedOffer(Number(e.target.value) || null)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                  required
                >
                  <option value="" className="bg-[#0a0a0f]">Choose what you're offering...</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id} className="bg-[#0a0a0f]">
                      {offer.name}
                    </option>
                  ))}
                </select>
                {selectedOffer && (
                  <div className="mt-3 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <p className="text-sm text-gray-300 mb-2">
                      <strong className="text-white">Value Prop:</strong> {offers.find(o => o.id === selectedOffer)?.value_proposition}
                    </p>
                    <p className="text-sm text-gray-300">
                      <strong className="text-white">CTA:</strong> {offers.find(o => o.id === selectedOffer)?.call_to_action}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: AI Research */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Research & Insights</h2>
                  <p className="text-gray-400">AI analyzing your target audience...</p>
                </div>
              </div>

              {isLoadingAI ? (
                <div className="text-center py-12">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-400">AI is researching your target market...</p>
                </div>
              ) : aiRecommendations ? (
                <div className="space-y-6">
                  {/* Pain Points */}
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-red-400" />
                      Key Pain Points
                    </h3>
                    <ul className="space-y-2">
                      {aiRecommendations.insights.painPoints.map((pain, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          {pain}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Value Propositions */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
                      Recommended Value Propositions
                    </h3>
                    <ul className="space-y-2">
                      {aiRecommendations.insights.valuePropositions.map((vp, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start">
                          <span className="text-emerald-400 mr-2">✓</span>
                          {vp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Proof Points (Social Proof) */}
                  {aiRecommendations.insights.proofPoints && aiRecommendations.insights.proofPoints.length > 0 && (
                    <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl p-6">
                      <h3 className="font-semibold text-white mb-3 flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-fuchsia-400" />
                        Social Proof & Credibility
                      </h3>
                      <ul className="space-y-2">
                        {aiRecommendations.insights.proofPoints.map((proof: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start">
                            <span className="text-fuchsia-400 mr-2">🏆</span>
                            {proof}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lead Magnets (Value Offers) */}
                  {aiRecommendations.insights.leadMagnets && aiRecommendations.insights.leadMagnets.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                      <h3 className="font-semibold text-white mb-3 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-amber-400" />
                        Lead Magnets & Value Offers
                      </h3>
                      <ul className="space-y-2">
                        {aiRecommendations.insights.leadMagnets.map((magnet: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start">
                            <span className="text-amber-400 mr-2">🎁</span>
                            {magnet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Best Practices */}
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-cyan-400" />
                      Best Practices
                    </h3>
                    <ul className="space-y-2">
                      {aiRecommendations.insights.bestPractices.map((practice, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start">
                          <span className="text-cyan-400 mr-2">💡</span>
                          {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Click "Next" to get AI insights</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Framework & Sequence */}
          {currentStep === 3 && aiRecommendations && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">AI Recommendations</h2>
                <p className="text-gray-400">Review and customize AI suggestions</p>
              </div>

              {/* Framework Selection */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Recommended Framework</h3>
                    <p className="text-sm text-gray-400">{aiRecommendations.framework.reasoning}</p>
                  </div>
                  <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(aiRecommendations.framework.confidence * 100)}% confidence
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {frameworks.map((fw) => (
                    <button
                      key={fw.code}
                      onClick={() => setSelectedFramework(fw.code)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedFramework === fw.code
                          ? 'border-violet-500 bg-violet-500/20'
                          : 'border-white/10 bg-white/[0.02] hover:border-violet-500/50'
                      } ${fw.code === aiRecommendations.framework.framework ? 'ring-2 ring-violet-500/50' : ''}`}
                    >
                      <div className="font-semibold text-white mb-1">
                        {fw.name}
                        {fw.code === aiRecommendations.framework.framework && (
                          <span className="ml-2 text-xs text-violet-400">AI Pick</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{fw.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sequence Length */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Recommended Sequence</h3>
                    <p className="text-sm text-gray-400">{aiRecommendations.sequence.reasoning}</p>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {aiRecommendations.sequence.touches} touches
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Touches: {selectedTouches}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="7"
                    value={selectedTouches}
                    onChange={(e) => setSelectedTouches(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2 touches</span>
                    <span>7 touches</span>
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Timeline Preview:</h4>
                  {aiRecommendations.sequence.schedule.slice(0, selectedTouches).map((step, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-300">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold mr-3">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-white">Day {step.delay}</span>: {step.focus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: AI Test Strategy */}
          {currentStep === 4 && testStrategy && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-cyan-500/10 p-6 rounded-xl border border-white/10">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">AI Test Strategy</h2>
                    <p className="text-gray-300 mb-4">
                      Based on your assets and {testStrategy.historical_data_points > 0 ? `${testStrategy.historical_data_points} previous campaigns` : 'industry benchmarks'}, 
                      AI recommends testing <strong className="text-violet-400">{testStrategy.recommended_test_type.replace('_', ' ')}</strong> first.
                    </p>
                    
                    <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2 text-amber-400" />
                        Why this test?
                      </h4>
                      <p className="text-sm text-gray-300">{testStrategy.reasoning}</p>
                      <div className="mt-2 flex items-center text-sm text-violet-400">
                        <span className="font-medium">AI Confidence: {Math.round(testStrategy.confidence_score * 100)}%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white">Variants to Test:</h4>
                      {testStrategy.variants.map((variant, idx) => (
                        <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-violet-500/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-white">{variant.name}</h5>
                            <span className="text-sm text-violet-400 font-medium">
                              Expected: {variant.expected_performance}% reply rate
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            <strong className="text-white">Strategy:</strong> {variant.strategy}
                          </p>
                          <p className="text-xs text-gray-500 italic">{variant.reasoning}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                      <p className="text-sm text-gray-300">
                        <strong className="text-white">Next test:</strong> {testStrategy.next_test_after_winner.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Decision */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Your Decision</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setAcceptedAIStrategy(true)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      acceptedAIStrategy
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 hover:border-violet-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white mb-1">
                          ✅ Use AI Recommendation
                        </div>
                        <p className="text-sm text-gray-400">
                          AI will automatically generate and test these {testStrategy.variants.length} variants
                        </p>
                      </div>
                      {acceptedAIStrategy && (
                        <CheckCircle2 className="w-6 h-6 text-violet-400" />
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setAcceptedAIStrategy(false)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      !acceptedAIStrategy && acceptedAIStrategy !== null
                        ? 'border-gray-500 bg-gray-500/10'
                        : 'border-white/10 hover:border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white mb-1">
                          ⚙️ Customize Test Strategy
                        </div>
                        <p className="text-sm text-gray-400">
                          Manually define what to test (coming soon)
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State for Test Strategy */}
          {currentStep === 4 && isLoadingTestStrategy && (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400">AI is analyzing your campaign assets and determining optimal test strategy...</p>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && aiRecommendations && testStrategy && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Review Your Campaign</h2>
                <p className="text-gray-400">Everything looks good? Let's create it!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="font-semibold text-white mb-4">Campaign Details</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Name</dt>
                      <dd className="font-medium text-white">{campaignName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Objective</dt>
                      <dd className="font-medium text-white capitalize">{objective}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Target</dt>
                      <dd className="font-medium text-white">{targetPersona || 'General audience'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="font-semibold text-white mb-4">Strategy</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Framework</dt>
                      <dd className="font-medium text-white">{selectedFramework}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Sequence Length</dt>
                      <dd className="font-medium text-white">{selectedTouches} touches over {aiRecommendations.sequence.timeline}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">AI Confidence</dt>
                      <dd className="font-medium text-violet-400">{Math.round(aiRecommendations.framework.confidence * 100)}%</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-2 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
                  What happens next?
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">1.</span>
                    AI will generate {selectedTouches} personalized email templates
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">2.</span>
                    You can review and customize each email
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-400 mr-2">3.</span>
                    Select leads and launch your campaign
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!campaignName || !objective || !selectedOffer}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg shadow-violet-500/25 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreateCampaign}
              disabled={isCreating}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-emerald-500/25 transition-all"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
