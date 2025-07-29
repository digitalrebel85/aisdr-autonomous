// Strategic Follow-up Dashboard
// Monitor and manage strategic follow-up campaigns

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Lead {
  id: number;
  email: string;
  name: string;
  company: string;
  engagement_level: string;
  follow_up_count: number;
  next_follow_up_date: string;
  follow_up_reason: string;
  last_outreach_date: string;
  last_reply_date: string;
  call_booked: boolean;
  do_not_follow_up: boolean;
}

interface FollowUpEvent {
  id: number;
  created_at: string;
  event_type: string;
  reason: string;
  follow_up_number: number;
  lead: {
    email: string;
    name: string;
    company: string;
  };
}

export default function StrategicFollowUpPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUpEvents, setFollowUpEvents] = useState<FollowUpEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingFollowUps, setProcessingFollowUps] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    scheduledFollowUps: 0,
    dueToday: 0,
    engaged: 0
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load leads with follow-up data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('last_outreach_date', { ascending: false });

      if (leadsError) throw leadsError;

      // Load recent follow-up events
      const { data: eventsData, error: eventsError } = await supabase
        .from('follow_up_events')
        .select(`
          *,
          lead:leads(email, name, company)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (eventsError) throw eventsError;

      setLeads(leadsData || []);
      setFollowUpEvents(eventsData || []);

      // Calculate stats
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const stats = {
        totalLeads: leadsData?.length || 0,
        scheduledFollowUps: leadsData?.filter(l => l.next_follow_up_date && !l.do_not_follow_up).length || 0,
        dueToday: leadsData?.filter(l => 
          l.next_follow_up_date && 
          new Date(l.next_follow_up_date) <= today &&
          !l.do_not_follow_up
        ).length || 0,
        engaged: leadsData?.filter(l => ['warm', 'hot', 'interested'].includes(l.engagement_level)).length || 0
      };
      
      setStats(stats);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runStrategicFollowUp = async () => {
    setProcessingFollowUps(true);
    try {
      const response = await fetch('/api/cron/strategic-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Strategic follow-up processing completed!\n\nAnalyzed: ${result.results?.analyzed || 0}\nScheduled: ${result.results?.scheduled || 0}\nSkipped: ${result.results?.skipped || 0}`);
        loadData(); // Refresh data
      } else {
        throw new Error('Failed to run strategic follow-up');
      }
    } catch (error) {
      console.error('Error running strategic follow-up:', error);
      alert('Failed to run strategic follow-up processing');
    } finally {
      setProcessingFollowUps(false);
    }
  };

  const toggleDoNotFollowUp = async (leadId: number, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ do_not_follow_up: !currentValue })
        .eq('id', leadId);

      if (error) throw error;
      
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'cold': return 'bg-gray-100 text-gray-800';
      case 'not_interested': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFollowUpReasonText = (reason: string) => {
    switch (reason) {
      case 'no_reply_initial': return 'No reply to initial outreach';
      case 'conversation_stalled': return 'Conversation stalled';
      case 'interested_no_call': return 'Interested but no call booked';
      case 'warm_lead_quiet': return 'Warm lead gone quiet';
      case 'cold_follow_up': return 'Cold follow-up';
      default: return reason;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading strategic follow-up data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategic Follow-up</h1>
          <p className="mt-2 text-gray-600">Intelligent follow-up management based on engagement patterns</p>
        </div>
        <button
          onClick={runStrategicFollowUp}
          disabled={processingFollowUps}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingFollowUps ? 'Processing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Leads</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Scheduled Follow-ups</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.scheduledFollowUps}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Due Today</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Engaged Leads</h3>
          <p className="text-2xl font-bold text-green-600">{stats.engaged}</p>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Lead Follow-up Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-ups</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Follow-up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className={lead.do_not_follow_up ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{lead.name || lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.company}</div>
                      <div className="text-xs text-gray-400">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEngagementColor(lead.engagement_level)}`}>
                      {lead.engagement_level}
                    </span>
                    {lead.call_booked && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Call Booked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.follow_up_count} sent
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.next_follow_up_date ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(lead.next_follow_up_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getFollowUpReasonText(lead.follow_up_reason)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">None scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.last_reply_date ? (
                        <span>Reply: {new Date(lead.last_reply_date).toLocaleDateString()}</span>
                      ) : lead.last_outreach_date ? (
                        <span>Outreach: {new Date(lead.last_outreach_date).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-400">No activity</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleDoNotFollowUp(lead.id, lead.do_not_follow_up)}
                      className={`${
                        lead.do_not_follow_up 
                          ? 'text-green-600 hover:text-green-900' 
                          : 'text-red-600 hover:text-red-900'
                      }`}
                    >
                      {lead.do_not_follow_up ? 'Enable' : 'Disable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Follow-up Events */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Follow-up Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {followUpEvents.map((event) => (
            <div key={event.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.event_type === 'follow_up_sent' ? '📧' : '📅'} 
                    {' '}Follow-up #{event.follow_up_number} - {event.lead.name || event.lead.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {getFollowUpReasonText(event.reason)} • {event.lead.company}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(event.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
