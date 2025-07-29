// Calendar Hosts Management Page
// Allows users to manage different people's calendars for booking

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface CalendarHost {
  id: number;
  host_name: string;
  host_email: string;
  host_title?: string;
  host_bio?: string;
  host_avatar_url?: string;
  grant_id: string;
  calendar_id?: string;
  timezone: string;
  working_hours: any;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  max_bookings_per_day: number;
  is_active: boolean;
  created_at: string;
}

interface ConnectedInbox {
  id: number;
  email_address: string;
  grant_id: string;
  provider: string;
}

export default function CalendarHostsPage() {
  const [hosts, setHosts] = useState<CalendarHost[]>([]);
  // Remove connectedInboxes state as each host will connect via their own OAuth
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHost, setEditingHost] = useState<CalendarHost | null>(null);

  const [formData, setFormData] = useState({
    host_name: '',
    host_email: '',
    host_title: '',
    host_bio: '',
    grant_id: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    buffer_before_minutes: 15,
    buffer_after_minutes: 15,
    max_bookings_per_day: 8,
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const grantId = urlParams.get('grant_id');
    const hostEmail = urlParams.get('host_email');
    const accessToken = urlParams.get('access_token');
    const error = urlParams.get('error');

    if (error) {
      let errorMessage = 'Failed to connect calendar.';
      switch (error) {
        case 'oauth_failed':
          errorMessage = 'OAuth authentication failed. Please try again.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received. Please try again.';
          break;
        case 'config_missing':
          errorMessage = 'Nylas configuration is missing. Please contact support.';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code. Please try again.';
          break;
        case 'account_fetch_failed':
          errorMessage = 'Failed to fetch account details. Please try again.';
          break;
        case 'callback_failed':
          errorMessage = 'OAuth callback failed. Please try again.';
          break;
      }
      alert(errorMessage);
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard/calendar-hosts');
      return;
    }

    if (success === 'calendar_connected' && grantId && hostEmail) {
      // Restore form data from session storage
      const pendingHostData = sessionStorage.getItem('pendingCalendarHost');
      if (pendingHostData) {
        const hostData = JSON.parse(pendingHostData);
        setFormData({
          ...hostData,
          host_email: hostEmail,
          grant_id: grantId,
        });
        setShowCreateForm(true);
        sessionStorage.removeItem('pendingCalendarHost');
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard/calendar-hosts');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load calendar hosts
      const { data: hostsData, error: hostsError } = await supabase
        .from('calendar_hosts')
        .select('*')
        .order('created_at', { ascending: false });

      if (hostsError) {
        console.error('Error loading calendar hosts:', hostsError);
      } else {
        setHosts(hostsData || []);
      }

      // No need to load connected inboxes - each host connects individually
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      // Store the current form data in session storage for after OAuth
      const tempHostData = {
        host_name: formData.host_name,
        host_title: formData.host_title,
        host_bio: formData.host_bio,
        timezone: formData.timezone,
        buffer_before_minutes: formData.buffer_before_minutes,
        buffer_after_minutes: formData.buffer_after_minutes,
        max_bookings_per_day: formData.max_bookings_per_day,
      };
      sessionStorage.setItem('pendingCalendarHost', JSON.stringify(tempHostData));
      
      // Redirect to Nylas OAuth for calendar connection
      const response = await fetch('/api/nylas/calendar-host-oauth');
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Failed to initiate calendar connection. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      alert('Failed to connect calendar. Please try again.');
    }
  };

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Authentication required. Please log in.');
        return;
      }

      const { data, error } = await supabase
        .from('calendar_hosts')
        .insert([{
          user_id: user.id,
          host_name: formData.host_name,
          host_email: formData.host_email,
          host_title: formData.host_title || null,
          host_bio: formData.host_bio || null,
          grant_id: formData.grant_id,
          timezone: formData.timezone,
          buffer_before_minutes: formData.buffer_before_minutes,
          buffer_after_minutes: formData.buffer_after_minutes,
          max_bookings_per_day: formData.max_bookings_per_day,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating calendar host:', error);
        alert('Failed to create calendar host');
        return;
      }

      // Reset form and reload data
      setFormData({
        host_name: '',
        host_email: '',
        host_title: '',
        host_bio: '',
        grant_id: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        buffer_before_minutes: 15,
        buffer_after_minutes: 15,
        max_bookings_per_day: 8,
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating calendar host:', error);
      alert('Failed to create calendar host');
    }
  };

  const handleUpdateHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHost) return;

    try {
      const { error } = await supabase
        .from('calendar_hosts')
        .update({
          host_name: formData.host_name,
          host_email: formData.host_email,
          host_title: formData.host_title || null,
          host_bio: formData.host_bio || null,
          timezone: formData.timezone,
          buffer_before_minutes: formData.buffer_before_minutes,
          buffer_after_minutes: formData.buffer_after_minutes,
          max_bookings_per_day: formData.max_bookings_per_day,
        })
        .eq('id', editingHost.id);

      if (error) {
        console.error('Error updating calendar host:', error);
        alert('Failed to update calendar host');
        return;
      }

      setEditingHost(null);
      loadData();
    } catch (error) {
      console.error('Error updating calendar host:', error);
      alert('Failed to update calendar host');
    }
  };

  const handleToggleActive = async (host: CalendarHost) => {
    try {
      const { error } = await supabase
        .from('calendar_hosts')
        .update({ is_active: !host.is_active })
        .eq('id', host.id);

      if (error) {
        console.error('Error toggling host status:', error);
        alert('Failed to update host status');
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error toggling host status:', error);
      alert('Failed to update host status');
    }
  };

  const handleDeleteHost = async (host: CalendarHost) => {
    if (!confirm(`Are you sure you want to delete ${host.host_name}? This will affect any booking links using this calendar host.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('calendar_hosts')
        .delete()
        .eq('id', host.id);

      if (error) {
        console.error('Error deleting calendar host:', error);
        alert('Failed to delete calendar host');
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error deleting calendar host:', error);
      alert('Failed to delete calendar host');
    }
  };

  const startEdit = (host: CalendarHost) => {
    setEditingHost(host);
    setFormData({
      host_name: host.host_name,
      host_email: host.host_email,
      host_title: host.host_title || '',
      host_bio: host.host_bio || '',
      grant_id: host.grant_id,
      timezone: host.timezone,
      buffer_before_minutes: host.buffer_before_minutes,
      buffer_after_minutes: host.buffer_after_minutes,
      max_bookings_per_day: host.max_bookings_per_day,
    });
  };

  const cancelEdit = () => {
    setEditingHost(null);
    setShowCreateForm(false);
    setFormData({
      host_name: '',
      host_email: '',
      host_title: '',
      host_bio: '',
      grant_id: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      buffer_before_minutes: 15,
      buffer_after_minutes: 15,
      max_bookings_per_day: 8,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendar Hosts</h1>
        <p className="mt-2 text-gray-600">
          Manage different people whose calendars can be used for booking appointments.
        </p>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingHost) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingHost ? 'Edit Calendar Host' : 'Add New Calendar Host'}
          </h2>

          <form onSubmit={editingHost ? handleUpdateHost : handleCreateHost} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host Name *
                </label>
                <input
                  type="text"
                  value={formData.host_name}
                  onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.host_email}
                  onChange={(e) => setFormData({ ...formData, host_email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title/Role
                </label>
                <input
                  type="text"
                  value={formData.host_title}
                  onChange={(e) => setFormData({ ...formData, host_title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sales Manager, CEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar Connection *
                </label>
                {formData.grant_id ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-800">
                          Calendar Connected
                        </span>
                      </div>
                      {!editingHost && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, grant_id: '', host_email: '' })}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                    {formData.host_email && (
                      <p className="text-sm text-gray-600 mt-1">{formData.host_email}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleConnectCalendar}
                      className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>🔗</span>
                      <span>Connect Calendar via Nylas</span>
                    </button>
                    <p className="text-sm text-gray-500">
                      This will redirect to connect the host's Google or Outlook calendar.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bookings Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.max_bookings_per_day}
                  onChange={(e) => setFormData({ ...formData, max_bookings_per_day: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                value={formData.host_bio}
                onChange={(e) => setFormData({ ...formData, host_bio: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description about this person..."
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingHost ? 'Update Host' : 'Create Host'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {hosts.length} calendar host{hosts.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          Add Calendar Host
        </button>
      </div>

      {/* Calendar Hosts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {hosts.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Calendar Hosts</h3>
            <p className="text-gray-600 mb-4">
              Add calendar hosts to enable booking appointments with different people.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Add Your First Host
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {hosts.map((host) => (
              <div key={host.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {host.host_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {host.host_name}
                        </h3>
                        <p className="text-gray-600">{host.host_email}</p>
                        {host.host_title && (
                          <p className="text-sm text-gray-500">{host.host_title}</p>
                        )}
                      </div>
                    </div>
                    
                    {host.host_bio && (
                      <p className="mt-3 text-gray-600 text-sm">{host.host_bio}</p>
                    )}
                    
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Timezone: {host.timezone}</span>
                      <span>Max bookings: {host.max_bookings_per_day}/day</span>
                      <span>Buffer: {host.buffer_before_minutes}min before, {host.buffer_after_minutes}min after</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      host.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {host.is_active ? 'Active' : 'Inactive'}
                    </span>

                    <button
                      onClick={() => startEdit(host)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggleActive(host)}
                      className={`font-medium ${
                        host.is_active 
                          ? 'text-orange-600 hover:text-orange-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {host.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeleteHost(host)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
