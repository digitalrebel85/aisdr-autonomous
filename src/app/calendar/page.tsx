"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Video, 
  Phone,
  Plus,
  ExternalLink,
  Settings,
  Link,
  Users
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  attendees: string[];
  location?: string;
  meeting_url?: string;
  lead_id?: string;
  lead_name?: string;
  lead_company?: string;
  type: 'demo' | 'discovery' | 'follow_up' | 'closing' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_via: 'manual' | 'booking_link' | 'ai_suggested';
}

interface CalendarSettings {
  booking_link?: string;
  calendar_connected: boolean;
  default_meeting_duration: number;
  buffer_time: number;
}

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  const supabase = createClient();

  useEffect(() => {
    fetchMeetings();
    fetchCalendarSettings();
  }, []);

  const fetchMeetings = async () => {
    try {
      // Mock meetings data - replace with Nylas Calendar API
      const mockMeetings: Meeting[] = [
        {
          id: '1',
          title: 'Demo Call - Acme Inc',
          start_time: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 2.5).toISOString(),
          attendees: ['alex@acme.com', 'you@company.com'],
          meeting_url: 'https://zoom.us/j/123456789',
          lead_id: 'lead1',
          lead_name: 'Alex Carter',
          lead_company: 'Acme Inc',
          type: 'demo',
          status: 'scheduled',
          created_via: 'ai_suggested'
        },
        {
          id: '2',
          title: 'Technical Deep Dive - BrightLabs',
          start_time: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
          attendees: ['jamie@brightlabs.io', 'tech@company.com', 'you@company.com'],
          meeting_url: 'https://meet.google.com/abc-defg-hij',
          lead_id: 'lead2',
          lead_name: 'Jamie Lee',
          lead_company: 'BrightLabs',
          type: 'demo',
          status: 'scheduled',
          created_via: 'booking_link'
        },
        {
          id: '3',
          title: 'Follow-up Call - CloudTech Solutions',
          start_time: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 48.5).toISOString(),
          attendees: ['sarah@cloudtech.com', 'you@company.com'],
          lead_id: 'lead4',
          lead_name: 'Sarah Wilson',
          lead_company: 'CloudTech Solutions',
          type: 'follow_up',
          status: 'scheduled',
          created_via: 'manual'
        },
        {
          id: '4',
          title: 'Q3 Check-in - NovaWorks',
          start_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
          end_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90 + 1800000).toISOString(),
          attendees: ['chris@novaworks.co', 'you@company.com'],
          lead_id: 'lead3',
          lead_name: 'Chris Hall',
          lead_company: 'NovaWorks',
          type: 'discovery',
          status: 'scheduled',
          created_via: 'ai_suggested'
        }
      ];

      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarSettings = async () => {
    try {
      // Mock settings - replace with actual user settings
      setCalendarSettings({
        booking_link: 'https://calendly.com/yourname/30min',
        calendar_connected: true,
        default_meeting_duration: 30,
        buffer_time: 15
      });
    } catch (error) {
      console.error('Error fetching calendar settings:', error);
    }
  };

  const getMeetingTypeBadge = (type: string) => {
    switch (type) {
      case 'demo':
        return <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">Demo</Badge>;
      case 'discovery':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Discovery</Badge>;
      case 'follow_up':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Follow-up</Badge>;
      case 'closing':
        return <Badge className="bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30">Closing</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Meeting</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>;
      case 'no_show':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">No Show</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  const upcomingMeetings = meetings
    .filter(m => new Date(m.start_time) > new Date() && m.status === 'scheduled')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const todaysMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.start_time);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString() && m.status === 'scheduled';
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-violet-400" />
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
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Calendar</h1>
              <p className="text-gray-400 mt-1">Manage your meetings and scheduling</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {calendarSettings?.calendar_connected ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Calendar Connected
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                Not Connected
              </Badge>
            )}
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{todaysMeetings.length}</div>
          <div className="text-sm text-gray-500">Today's Meetings</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{upcomingMeetings.length}</div>
          <div className="text-sm text-gray-500">Upcoming</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-fuchsia-500/20 rounded-lg">
              <Video className="w-5 h-5 text-fuchsia-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-fuchsia-400">
            {meetings.filter(m => m.type === 'demo').length}
          </div>
          <div className="text-sm text-gray-500">Demos Scheduled</div>
        </div>
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Link className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {meetings.filter(m => m.created_via === 'booking_link').length}
          </div>
          <div className="text-sm text-gray-500">Via Booking Link</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar View Selector */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Calendar View</h3>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => setView('day')}
                  className={view === 'day' ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}
                >
                  Day
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('week')}
                  className={view === 'week' ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}
                >
                  Week
                </Button>
                <Button
                  size="sm"
                  onClick={() => setView('month')}
                  className={view === 'month' ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'}
                >
                  Month
                </Button>
              </div>
            </div>
            <div className="p-5">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="w-10 h-10 text-violet-400" />
                </div>
                <p className="text-lg font-medium text-white">Calendar View</p>
                <p className="text-sm text-gray-400">Integration with Nylas Calendar API coming soon</p>
              </div>
            </div>
          </div>

          {/* Today's Meetings */}
          {todaysMeetings.length > 0 && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-emerald-400" />
                  Today's Meetings
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {todaysMeetings.map((meeting) => (
                    <div key={meeting.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-violet-500/30 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{meeting.title}</h4>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-violet-400" />
                              {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1 text-cyan-400" />
                              {meeting.attendees.length} attendees
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getMeetingTypeBadge(meeting.type)}
                          {meeting.meeting_url && (
                            <Button size="sm" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
                              <Video className="w-4 h-4 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar Settings */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-400" />
                Calendar Settings
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Booking Link</label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={calendarSettings?.booking_link || ''}
                    placeholder="https://calendly.com/yourname"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    readOnly
                  />
                  <Button size="sm" className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10">
                    <Link className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Calendar
                </Button>
                <Button className="w-full justify-start bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Booking Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-violet-400" />
                Upcoming Meetings
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Next {upcomingMeetings.length} scheduled meetings
              </p>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 5).map((meeting) => (
                  <div key={meeting.id} className="border-l-4 border-l-violet-500 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(meeting.start_time).toLocaleDateString()} at{' '}
                          {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {getMeetingTypeBadge(meeting.type)}
                          {meeting.lead_company && (
                            <span className="text-xs text-gray-500">
                              {meeting.lead_company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {upcomingMeetings.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-violet-500/20 rounded-xl flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-violet-400" />
                    </div>
                    <p className="text-sm text-gray-400">No upcoming meetings</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="p-5 space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                <Link className="w-4 h-4 mr-2" />
                Copy Booking Link
              </Button>
              <Button className="w-full justify-start bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Calendar Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
