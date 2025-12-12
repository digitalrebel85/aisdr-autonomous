'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
  ChevronUp
} from 'lucide-react';

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
  const supabase = createClientComponentClient();
  const sequenceId = params.id as string;

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [sequenceSteps, setSequenceSteps] = useState<SequenceStep[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [icpScoreMin, setIcpScoreMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Connected inbox
  const [connectedInbox, setConnectedInbox] = useState<any>(null);

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

      // Update leads status
      const { error: leadsError } = await supabase
        .from('leads')
        .update({ 
          lead_status: 'in_sequence',
          sequence_count: supabase.raw('sequence_count + 1')
        })
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

  const allSelected = selectedLeads.size === filteredLeads.length && filteredLeads.length > 0;
  const someSelected = selectedLeads.size > 0 && selectedLeads.size < filteredLeads.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Launch Campaign
              </h1>
              <p className="text-gray-600">
                {sequence?.name} - Select leads to include
              </p>
            </div>
            <button
              onClick={launchCampaign}
              disabled={isLaunching || selectedLeads.size === 0}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
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
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filter Leads</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Eligible</option>
                      <option value="new">New Leads Only</option>
                      <option value="eligible">Never Contacted</option>
                      <option value="enriched">Enriched Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min ICP Score
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={icpScoreMin}
                      onChange={(e) => setIcpScoreMin(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="text-sm text-gray-600 mt-1">{icpScoreMin}+</div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setIcpScoreMin(0);
                      }}
                      className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedLeads.size} of {filteredLeads.length} selected
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {filteredLeads.length} eligible leads
                </span>
              </div>

              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ICP Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedLeads.has(lead.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleLead(lead.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLead(lead.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {lead.first_name} {lead.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{lead.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.company}</div>
                          <div className="text-sm text-gray-500">{lead.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingUp className={`w-4 h-4 mr-1 ${
                              lead.icp_score >= 80 ? 'text-green-600' :
                              lead.icp_score >= 60 ? 'text-yellow-600' :
                              'text-gray-400'
                            }`} />
                            <span className="text-sm font-medium text-gray-900">
                              {lead.icp_score || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.enrichment_status === 'completed' ? 'bg-green-100 text-green-800' :
                            lead.enrichment_status === 'enriching' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
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
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No eligible leads found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Campaign Summary */}
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">Sequence</dt>
                  <dd className="font-medium text-gray-900">{sequence?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Framework</dt>
                  <dd className="font-medium text-gray-900">{sequence?.messaging_framework}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Touches</dt>
                  <dd className="font-medium text-gray-900">{sequence?.total_touches}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Selected Leads</dt>
                  <dd className="font-medium text-gray-900">{selectedLeads.size}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">Total Emails</dt>
                  <dd className="font-medium text-gray-900">
                    {selectedLeads.size * (sequence?.total_touches || 0)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Sequence Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sequence Timeline</h3>
              <div className="space-y-3">
                {sequenceSteps.map((step, idx) => (
                  <div key={step.step_number} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{step.step_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        Day {step.delay_days}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {step.subject_line}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Inbox */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Sending From</h3>
              {connectedInbox ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {connectedInbox.email_address}
                    </div>
                    <div className="text-xs text-gray-500">Connected</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-red-900">No inbox connected</div>
                    <button className="text-xs text-blue-600 hover:text-blue-700">
                      Connect inbox
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Checklist */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                Pre-Launch Checklist
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
                  Email templates finalized
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 ${connectedInbox ? 'text-green-600' : 'text-gray-400'}`} />
                  Email inbox connected
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className={`w-4 h-4 mr-2 mt-0.5 ${selectedLeads.size > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                  Leads selected
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">•</span>
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
