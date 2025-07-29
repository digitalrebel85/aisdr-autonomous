// Booking Management Dashboard
// Manage calendar booking links and view scheduled bookings

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface BookingLink {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  booking_slug: string;
  is_active: boolean;
  created_at: string;
  timezone: string;
  max_bookings_per_day: number;
  calendar_host_id?: number;
  calendar_host?: {
    host_name: string;
    host_email: string;
    host_title?: string;
  };
}

interface CalendarHost {
  id: number;
  host_name: string;
  host_email: string;
  host_title?: string;
  is_active: boolean;
}

interface Booking {
  id: number;
  start_time: string;
  end_time: string;
  lead_name: string;
  lead_email: string;
  lead_company: string;
  lead_phone: string;
  status: string;
  booking_notes: string;
  created_at: string;
  booking_link: {
    title: string;
  };
}

export default function BookingsPage() {
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarHosts, setCalendarHosts] = useState<CalendarHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'links' | 'bookings'>('links');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    description: '',
    duration_minutes: 30,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    max_bookings_per_day: 8,
    calendar_host_id: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load booking links with calendar host info
      const { data: linksData, error: linksError } = await supabase
        .from('booking_links')
        .select(`
          *,
          calendar_host:calendar_hosts(
            host_name,
            host_email,
            host_title
          )
        `)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;
      setBookingLinks(linksData || []);

      // Load calendar hosts
      const { data: hostsData, error: hostsError } = await supabase
        .from('calendar_hosts')
        .select('id, host_name, host_email, host_title, is_active')
        .eq('is_active', true)
        .order('host_name');

      if (hostsError) throw hostsError;
      setCalendarHosts(hostsData || []);

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_link:booking_links(title)
        `)
        .order('start_time', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBookingLink = async () => {
    if (!newLink.title.trim()) {
      alert('Please enter a title for the booking link');
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert('Authentication error. Please log in again.');
        return;
      }

      // Get a connected inbox (grant_id) for this user
      const { data: connectedInbox, error: inboxError } = await supabase
        .from('connected_inboxes')
        .select('grant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (inboxError || !connectedInbox) {
        alert('Please connect an inbox first before creating booking links.');
        return;
      }

      // Generate URL-friendly slug
      const bookingSlug = newLink.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const { error } = await supabase
        .from('booking_links')
        .insert({
          user_id: user.id,
          grant_id: connectedInbox.grant_id,
          title: newLink.title,
          description: newLink.description,
          duration_minutes: newLink.duration_minutes,
          booking_slug: bookingSlug,
          timezone: newLink.timezone,
          max_bookings_per_day: newLink.max_bookings_per_day,
          calendar_host_id: parseInt(newLink.calendar_host_id),
          is_active: true,
        });

      if (error) throw error;

      // Reset form
      setNewLink({
        title: '',
        description: '',
        duration_minutes: 30,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        max_bookings_per_day: 8,
        calendar_host_id: '',
      });
      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating booking link:', error);
      alert('Failed to create booking link');
    }
  };

  const toggleLinkStatus = async (linkId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('booking_links')
        .update({ is_active: !currentStatus })
        .eq('id', linkId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error updating link status:', error);
      alert('Failed to update link status');
    }
  };

  const copyBookingLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Booking link copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar Bookings</h1>
          <p className="mt-2 text-gray-600">Manage booking links and view scheduled calls</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Booking Link
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('links')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'links'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Booking Links ({bookingLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduled Calls ({bookings.length})
          </button>
        </nav>
      </div>

      {/* Create Booking Link Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Booking Link</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sales Call, Demo, Consultation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the meeting purpose"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendar Host *
                </label>
                <select
                  value={newLink.calendar_host_id}
                  onChange={(e) => setNewLink({ ...newLink, calendar_host_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a calendar host...</option>
                  {calendarHosts.map((host) => (
                    <option key={host.id} value={host.id}>
                      {host.host_name} ({host.host_email})
                      {host.host_title && ` - ${host.host_title}`}
                    </option>
                  ))}
                </select>
                {calendarHosts.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">
                    No calendar hosts available. <Link href="/dashboard/calendar-hosts" className="text-blue-600 hover:underline">Create one first</Link>.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    value={newLink.duration_minutes}
                    onChange={(e) => setNewLink({ ...newLink, duration_minutes: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Limit
                  </label>
                  <input
                    type="number"
                    value={newLink.max_bookings_per_day}
                    onChange={(e) => setNewLink({ ...newLink, max_bookings_per_day: parseInt(e.target.value) })}
                    min={1}
                    max={20}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={createBookingLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Links Tab */}
      {activeTab === 'links' && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Booking Links</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {bookingLinks.map((link) => (
              <div key={link.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{link.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        link.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {link.description && (
                      <p className="mt-1 text-sm text-gray-600">{link.description}</p>
                    )}
                    {link.calendar_host && (
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          📅 {link.calendar_host.host_name}
                          {link.calendar_host.host_title && ` (${link.calendar_host.host_title})`}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{link.duration_minutes} minutes</span>
                      <span>Max {link.max_bookings_per_day}/day</span>
                      <span>{link.timezone}</span>
                    </div>
                    <div className="mt-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {window.location.origin}/book/{link.booking_slug}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyBookingLink(link.booking_slug)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Copy Link
                    </button>
                    <Link
                      href={`/book/${link.booking_slug}`}
                      target="_blank"
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Preview
                    </Link>
                    <button
                      onClick={() => toggleLinkStatus(link.id, link.is_active)}
                      className={`px-3 py-1 text-sm rounded ${
                        link.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {link.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {bookingLinks.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No booking links created yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create your first booking link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Scheduled Calls</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{booking.lead_name}</div>
                        <div className="text-sm text-gray-500">{booking.lead_email}</div>
                        {booking.lead_company && (
                          <div className="text-xs text-gray-400">{booking.lead_company}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.booking_link.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.start_time).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })} - {new Date(booking.end_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {booking.booking_notes || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No bookings scheduled yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
