'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ArrowLeft,
  Plus,
  CheckCircle2,
  ExternalLink,
  Clock,
  Globe,
  Link2,
  Trash2
} from 'lucide-react';

interface BookingLink {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  working_hours?: Record<string, any>;
}

interface CalendarHost {
  id: string;
  email_address: string;
  provider: string;
  is_active: boolean;
  created_at: string;
}

export default function CalendarSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [calendarHosts, setCalendarHosts] = useState<CalendarHost[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      const { data: links } = await supabase
        .from('booking_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setBookingLinks(links || []);

      const { data: hosts } = await supabase
        .from('calendar_hosts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setCalendarHosts(hosts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="h-16 bg-white/5 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Calendar Settings</h1>
                <p className="mt-1 text-gray-400">Manage booking links, calendar hosts, and scheduling preferences</p>
              </div>
            </div>
            <Link href="/settings">
              <Button className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Hosts */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-xl">
                  <Globe className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Calendar Hosts</h3>
                  <p className="text-sm text-gray-400">Connected calendar accounts for availability checking</p>
                </div>
              </div>
              <Link href="/api/nylas/calendar-host-oauth">
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Host
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {calendarHosts.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No calendar hosts connected yet</p>
                <p className="text-gray-500 text-xs mt-1">Connect a Google or Outlook calendar to enable booking</p>
              </div>
            )}
            {calendarHosts.map((host) => (
              <div key={host.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{host.email_address}</h3>
                    <p className="text-sm text-gray-400">{host.provider} &bull; Connected {new Date(host.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge className={host.is_active 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                  {host.is_active && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {host.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Links */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Link2 className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Booking Links</h3>
                  <p className="text-sm text-gray-400">Shareable links for prospects to book meetings</p>
                </div>
              </div>
              <Link href="/calendar">
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Link
                </Button>
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {bookingLinks.length === 0 && (
              <div className="text-center py-8">
                <Link2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No booking links created yet</p>
                <p className="text-gray-500 text-xs mt-1">Create a booking link to let prospects schedule meetings</p>
              </div>
            )}
            {bookingLinks.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Link2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{link.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {link.duration_minutes} min
                      </span>
                      <span className="text-xs text-violet-400">/book/{link.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={link.is_active 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Link href="/calendar">
                    <Button size="sm" className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
