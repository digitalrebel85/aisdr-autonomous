'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, 
  Filter, 
  Search, 
  CheckCircle2,
  XCircle,
  TrendingUp,
  Mail,
  Calendar,
  Rocket,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title: string;
  icp_score: number;
  lead_status: string;
  enrichment_status: string;
  sequence_count: number;
  last_sequence_date: string | null;
}

interface Sequence {
  id: number;
  name: string;
  description: string;
  total_touches: number;
  messaging_framework: string;
  objective: string;
}

interface SequenceStep {
  step_number: number;
  delay_days: number;
  subject_line: string;
}

export default function CampaignLaunchPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [isLaunching, setIsLaunching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [icpScoreMin, setIcpScoreMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Connected inbox
  const [connectedInbox, setConnectedInbox] = useState<any>(null);
  
  // Subscription check
  const { isResearchOrTrial, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    fetchData();
  }, [sequenceId]);

  const fetchData = async () => {
    try {
      // Fetch sequence
      const { data: seqData, error: seqError } = await supabase
        .from('campaign_sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (seqError) throw seqError;
      setSequence(seqData);

      // Fetch sequence steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('step_number, delay_days, subject_line')
        .eq('sequence_id', sequenceId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;
      setSequenceSteps(stepsData || []);

      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('icp_score', { ascending: false });

      if (leadsError) throw leadsError;
      setAllLeads(leadsData || []);

      // Fetch connected inbox
      const { data: inboxData, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (inboxError) {
        console.warn('No connected inbox found');
      } else {
        setConnectedInbox(inboxData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load campaign data');
    }
  };

  const filteredLeads = allLeads.filter(lead => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        lead.first_name?.toLowerCase().includes(search) ||
        lead.last_name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.company?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'new' && lead.lead_status !== 'new') return false;
      if (statusFilter === 'eligible' && (lead.sequence_count >= 3 || lead.lead_status !== 'new')) return false;
      if (statusFilter === 'enriched' && lead.enrichment_status !== 'completed') return false;
    }

    // ICP score filter
    if (lead.icp_score < icpScoreMin) return false;

    // Exclude leads in active sequences
    if (lead.lead_status === 'in_sequence') return false;

    // Exclude do-not-contact statuses
    if (['unsubscribed', 'spam_reported', 'do_not_contact', 'bounced'].includes(lead.lead_status)) {
      return false;
    }

    return true;
  });

  const toggleLead = (leadId: number) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const launchCampaign = async () => {
    if (selectedLeads.size === 0) {
      setError('Please select at least one lead');
      return;
    }

    if (!connectedInbox) {
      setError('No connected inbox found. Please connect an email account first.');
      return;
    }

    setIsLaunching(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('outreach_campaigns')
        .insert({
          user_id: user.id,
          name: sequence?.name,
          description: sequence?.description,
          sequence_id: parseInt(sequenceId),
          sequence_type: 'initial',
          status: 'active',
          auto_stop_enabled: true,
          total_leads: selectedLeads.size
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create queue items for each lead × each touch
      const queueItems = [];
      const now = new Date();

      for (const leadId of Array.from(selectedLeads)) {
        for (const step of sequenceSteps) {
          const scheduledDate = new Date(now);
          scheduledDate.setDate(scheduledDate.getDate() + step.delay_days);
          
          // Add random minutes (0-120) for natural timing
          scheduledDate.setMinutes(scheduledDate.getMinutes() + Math.floor(Math.random() * 120));

          queueItems.push({
            user_id: user.id,
            campaign_id: campaign.id,
            lead_id: leadId,
            inbox_id: connectedInbox.id,
            sender_email: connectedInbox.email_address,
            grant_id: connectedInbox.grant_id,
            sequence_step: step.step_number,
            sequence_id: parseInt(sequenceId),
            scheduled_at: scheduledDate.toISOString(),
            status: 'queued'
          });
        }
      }

      // Insert queue items in batches
      const batchSize = 100;
      for (let i = 0; i < queueItems.length; i += batchSize) {
        const batch = queueItems.slice(i, i + batchSize);
        const { error: queueError } = await supabase
          .from('outreach_queue')
          .insert(batch);

        if (queueError) throw queueError;
      }

      // Create sequence executions for each lead
      const executions = Array.from(selectedLeads).map(leadId => ({
        user_id: user.id,
        lead_id: leadId,
        campaign_id: campaign.id,
        sequence_id: parseInt(sequenceId),
        sequence_type: 'initial',
        sequence_number: 1,
        status: 'active'
      }));

      const { error: execError } = await supabase
        .from('sequence_executions')
        .insert(executions);

      if (execError) throw execError;

      // Update leads status - increment sequence_count using RPC or separate update
      for (const leadId of Array.from(selectedLeads)) {
        await supabase.rpc('increment_lead_sequence_count', { lead_id: leadId });
      }
      
      // Update lead status
      const { error: leadsError } = await supabase
        .from('leads')
        .update({ lead_status: 'in_sequence' })
        .in('id', Array.from(selectedLeads));

      if (leadsError) throw leadsError;

      // Success! Redirect to campaign dashboard
      router.push(`/dashboard/campaigns/${campaign.id}`);

    } catch (err) {
      console.error('Error launching campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to launch campaign');
    } finally {
      setIsLaunching(false);
    }
  };

  // Create campaign and generate emails without requiring inbox
  const createCampaignWithEmails = async () => {
    if (selectedLeads.size === 0) {
      setError('Please select at least one lead');
      return;
    }

    setIsCreating(true);
    setCreationProgress('Creating campaign...');
    setError('');

    try {
      setCreationProgress(`Generating emails for ${selectedLeads.size} leads...`);
      
      const response = await fetch('/api/campaigns/create-and-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequenceId: parseInt(sequenceId),
          sequenceName: sequence?.name,
          sequenceDescription: sequence?.description,
          leadIds: Array.from(selectedLeads),
          sequenceSteps: sequenceSteps,
          framework: sequence?.messaging_framework,
          objective: sequence?.objective
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        console.warn('Campaign creation warnings:', result.errors);
      }
      
      setCreationProgress(`Created! ${result.emails_generated || result.emails_prepared || 0} emails ready.`);
      
      // Short delay to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to campaign page
      router.push(`/dashboard/campaigns/${result.campaign.id}`);

    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsCreating(false);
      setCreationProgress('');
    }
  };

  const allSelected = selectedLeads.size === filteredLeads.length && filteredLeads.length > 0;
  const someSelected = selectedLeads.size > 0 && selectedLeads.size < filteredLeads.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Launch Campaign
              </h1>
              <p className="text-gray-400">
                {sequence?.name} - Select leads to include
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Download Campaign Button - Available to all plans */}
              <button
                onClick={async () => {
                  if (selectedLeads.size === 0) return;
                  
                  try {
                    // Use POST endpoint to export leads directly without needing outreach_queue
                    const response = await fetch(`/api/campaigns/${sequenceId}/export`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        leadIds: Array.from(selectedLeads),
                        sequenceSteps: sequenceSteps
                      })
                    });
                    
                    if (!response.ok) {
                      const error = await response.json();
                      setError(error.error || 'Failed to export');
                      return;
                    }
                    
                    // Download the CSV
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `campaign_leads_export_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (err) {
                    console.error('Export error:', err);
                    setError('Failed to export campaign');
                  }
                }}
                disabled={selectedLeads.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
              
              {/* Create Campaign Button - Creates campaign and generates emails without inbox */}
              <button
                onClick={createCampaignWithEmails}
                disabled={isCreating || selectedLeads.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-violet-500/25 transition-all"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{creationProgress || 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Create Campaign</span>
                  </>
                )}
              </button>

              {/* Launch Campaign Button - Only show if inbox connected and not Research/Trial */}
              {connectedInbox && !isResearchOrTrial() && (
                <button
                  onClick={launchCampaign}
                  disabled={isLaunching || selectedLeads.size === 0}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  {isLaunching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>Launch to {selectedLeads.size} Leads</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Filter Leads</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm text-violet-400 hover:text-violet-300 flex items-center space-x-1"
                >
                  <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lead Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="all">All Eligible</option>
                      <option value="new">New Leads Only</option>
                      <option value="eligible">Never Contacted</option>
                      <option value="enriched">Enriched Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min ICP Score
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={icpScoreMin}
                      onChange={(e) => setIcpScoreMin(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                    <div className="text-sm text-gray-400 mt-1">{icpScoreMin}+</div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setIcpScoreMin(0);
                      }}
                      className="w-full px-4 py-2 text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Leads Table */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 text-violet-600 border-white/20 rounded focus:ring-violet-500 bg-white/5"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    {selectedLeads.size} of {filteredLeads.length} selected
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredLeads.length} eligible leads
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        ICP Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-white/5 cursor-pointer transition-colors ${
                          selectedLeads.has(lead.id) ? 'bg-violet-500/10' : ''
                        }`}
                        onClick={() => toggleLead(lead.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLead(lead.id)}
                            className="w-4 h-4 text-violet-600 border-white/20 rounded focus:ring-violet-500 bg-white/5"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{lead.company}</div>
                          <div className="text-sm text-gray-500">{lead.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingUp className={`w-4 h-4 mr-1 ${
                              lead.icp_score >= 80 ? 'text-emerald-400' :
                              lead.icp_score >= 60 ? 'text-amber-400' :
                              'text-gray-500'
                            }`} />
                            <span className="text-sm font-medium text-white">
                              {lead.icp_score || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.enrichment_status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            lead.enrichment_status === 'enriching' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {lead.enrichment_status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No eligible leads found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Campaign Summary */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Campaign Summary</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Sequence</dt>
                  <dd className="font-medium text-white">{sequence?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Framework</dt>
                  <dd className="font-medium text-white">{sequence?.messaging_framework}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Touches</dt>
                  <dd className="font-medium text-white">{sequence?.total_touches}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Selected Leads</dt>
                  <dd className="font-medium text-white">{selectedLeads.size}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Total Emails</dt>
                  <dd className="font-medium text-white">
                    {selectedLeads.size * (sequence?.total_touches || 0)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Sequence Timeline */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Sequence Timeline</h3>
              <div className="space-y-3">
                {sequenceSteps.map((step, idx) => (
                  <div key={step.step_number} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-violet-400">{step.step_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">
                        Day {step.delay_days}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {step.subject_line}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Inbox */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="font-semibold text-white mb-4">Sending From</h3>
              {connectedInbox ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {connectedInbox.email_address}
                    </div>
                    <div className="text-xs text-emerald-400">Connected</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-400">No inbox connected</div>
                    <button className="text-xs text-violet-400 hover:text-violet-300">
                      Connect inbox
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Checklist */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-3 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
                Pre-Launch Checklist
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400 mt-0.5" />
                  Email templates finalized
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 ${connectedInbox ? 'text-emerald-400' : 'text-gray-500'}`} />
                  Email inbox connected
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 ${selectedLeads.size > 0 ? 'text-emerald-400' : 'text-gray-500'}`} />
                  Leads selected
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  Auto-stop enabled for replies
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
