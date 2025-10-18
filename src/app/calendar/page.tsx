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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

  const supabase = createClientComponentClient();

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
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Demo</Badge>;
      case 'discovery':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Discovery</Badge>;
      case 'follow_up':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Follow-up</Badge>;
      case 'closing':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Closing</Badge>;
      default:
        return <Badge variant="outline">Meeting</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      case 'no_show':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">No Show</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="h-7 w-7 mr-3 text-blue-600" />
                Calendar
              </h1>
              <p className="text-gray-600 mt-1">Manage your meetings and scheduling</p>
            </div>
            <div className="flex items-center space-x-3">
              {calendarSettings?.calendar_connected ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Calendar Connected
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Not Connected
                </Badge>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{todaysMeetings.length}</div>
              <div className="text-sm text-gray-600">Today's Meetings</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{upcomingMeetings.length}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {meetings.filter(m => m.type === 'demo').length}
              </div>
              <div className="text-sm text-gray-600">Demos Scheduled</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {meetings.filter(m => m.created_via === 'booking_link').length}
              </div>
              <div className="text-sm text-gray-600">Via Booking Link</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar View Selector */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendar View</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={view === 'day' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('day')}
                    >
                      Day
                    </Button>
                    <Button
                      variant={view === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={view === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('month')}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Calendar View</p>
                  <p className="text-sm">Integration with Nylas Calendar API coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Today's Meetings */}
            {todaysMeetings.length > 0 && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-600" />
                    Today's Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaysMeetings.map((meeting) => (
                      <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                                {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {meeting.attendees.length} attendees
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getMeetingTypeBadge(meeting.type)}
                            {meeting.meeting_url && (
                              <Button size="sm" variant="outline">
                                <Video className="w-4 h-4 mr-1" />
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar Settings */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Calendar Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Booking Link</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      value={calendarSettings?.booking_link || ''}
                      placeholder="https://calendly.com/yourname"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly
                    />
                    <Button size="sm" variant="outline">
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Calendar
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Booking Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Meetings */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Meetings
                </CardTitle>
                <CardDescription>
                  Next {upcomingMeetings.length} scheduled meetings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMeetings.slice(0, 5).map((meeting) => (
                    <div key={meeting.id} className="border-l-4 border-l-blue-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
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
                    <div className="text-center py-6 text-gray-500">
                      <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No upcoming meetings</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Link className="w-4 h-4 mr-2" />
                  Copy Booking Link
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Calendar Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
