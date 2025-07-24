// src/app/dashboard/automated-outreach/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lead {
  id: number;
  name: string;
  email: string;
  company: string;
  title?: string;
  pain_points: string[];
  timezone?: string;
  country?: string;
  city?: string;
  created_at: string;
}

interface Offer {
  id: number;
  name: string;
  description: string;
  value_proposition: string;
  call_to_action: string;
  hook_snippet: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_leads: number;
  sent_count: number;
  failed_count: number;
  delay_minutes: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function AutomatedOutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [showTimezoneInfo, setShowTimezoneInfo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch leads
      const leadsResponse = await fetch('/api/leads');
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        setLeads(leadsData.leads || []);
        console.log('Fetched leads:', leadsData.leads?.length || 0);
      } else {
        console.error('Failed to fetch leads:', leadsResponse.status);
      }

      // Fetch offers
      const offersResponse = await fetch('/api/offers');
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setOffers(offersData.offers || []);
        console.log('Fetched offers:', offersData.offers?.length || 0);
      } else {
        console.error('Failed to fetch offers:', offersResponse.status);
      }

      // Fetch campaigns
      const campaignsResponse = await fetch('/api/automated-outreach');
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData.campaigns || []);
        console.log('Fetched campaigns:', campaignsData.campaigns?.length || 0);
      } else {
        console.error('Failed to fetch campaigns:', campaignsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLeadToggle = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !selectedOffer || selectedLeads.length === 0) {
      alert('Please fill in all required fields and select at least one lead.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/automated-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName,
          leadIds: selectedLeads,
          offerId: selectedOffer,
          delayMinutes
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const timezoneInfo = result.inboxRotation ? `\n\nInbox rotation: ${result.inboxRotation.join(', ')}` : '';
        alert(`Campaign created successfully! 🎉\n\n${result.queuedEmails} emails queued for timezone-aware sending.\n\nEmails will be sent during each recipient's local business hours (9 AM-5 PM) with human-like delays.${timezoneInfo}`);
        
        // Reset form
        setCampaignName('');
        setSelectedLeads([]);
        setSelectedOffer(null);
        setDelayMinutes(5);
        setShowCreateForm(false);
        
        // Refresh campaigns
        fetchData();
      } else {
        const error = await response.json();
        alert(`Failed to create campaign: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automated Outreach</h1>
              <p className="mt-2 text-gray-600">Create and manage automated email campaigns with inbox rotation</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {showCreateForm ? 'Cancel' : '+ New Campaign'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Campaign</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Q1 Lead Generation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Offer *
                  </label>
                  <select
                    value={selectedOffer || ''}
                    onChange={(e) => setSelectedOffer(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an offer...</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Delay Between Emails (minutes)
                  </label>
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p>• Random variations (±50%) added for human-like patterns</p>
                    <p>• Emails scheduled during each recipient's business hours (9 AM-5 PM)</p>
                    <p>• Automatic timezone detection ensures optimal delivery timing</p>
                  </div>
                </div>
              </div>

              {/* Lead Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Leads * ({selectedLeads.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTimezoneInfo(!showTimezoneInfo)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showTimezoneInfo ? 'Hide' : 'Show'} Timezones
                  </button>
                </div>
                
                {leads.length === 0 ? (
                  <div className="border border-gray-300 rounded-md p-8 text-center">
                    <div className="text-gray-500 mb-2">No leads found</div>
                    <div className="text-sm text-gray-400">
                      <a href="/dashboard/leads" className="text-blue-600 hover:text-blue-800">
                        Add leads first
                      </a> to create campaigns
                    </div>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                    {leads.map((lead) => {
                      const timezone = lead.timezone || 'America/New_York';
                      const location = [lead.city, lead.country].filter(Boolean).join(', ');
                      
                      return (
                        <div
                          key={lead.id}
                          className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleLeadToggle(lead.id)}
                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{lead.name}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                            <div className="text-xs text-gray-400">
                              {lead.company}
                              {lead.title && ` • ${lead.title}`}
                            </div>
                            {showTimezoneInfo && (
                              <div className="text-xs text-blue-600 mt-1">
                                🌍 {timezone}
                                {location && ` • ${location}`}
                                <span className="text-gray-500 ml-1">
                                  (emails sent during their 9 AM-5 PM)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={isCreating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
          </div>
          
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign.sent_count} sent, {campaign.failed_count} failed
                        </div>
                        <div className="text-xs text-gray-500">
                          of {campaign.total_leads} total
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign.delay_minutes}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">📧</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-500 mb-4">Create your first automated outreach campaign</p>
            </div>
          )}
        </div>

        <nav className="flex justify-center pt-6">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}
