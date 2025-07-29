// Nylas Calendar API Integration
// Handles calendar booking, availability, and event management

import { createClient } from '@/utils/supabase/server';

interface BookingSlot {
  start: string;
  end: string;
  available: boolean;
}

interface CreateBookingParams {
  bookingLinkId: number;
  leadName: string;
  leadEmail: string;
  leadCompany?: string;
  leadPhone?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  notes?: string;
}

interface NylasCalendar {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  is_primary: boolean;
}

interface NylasEvent {
  id: string;
  title: string;
  description?: string;
  when: {
    start_time: number;
    end_time: number;
    start_timezone?: string;
    end_timezone?: string;
  };
  location?: string;
  participants: Array<{
    email: string;
    name?: string;
    status?: string;
  }>;
  calendar_id: string;
}

export class NylasCalendarService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NYLAS_API_SERVER || 'https://api.us.nylas.com';
    this.apiKey = process.env.NYLAS_API_KEY || '';
  }

  /**
   * Get calendars for a specific grant
   */
  async getCalendars(grantId: string): Promise<NylasCalendar[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/calendars`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Nylas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  /**
   * Get primary calendar for a grant
   */
  async getPrimaryCalendar(grantId: string): Promise<NylasCalendar | null> {
    try {
      const calendars = await this.getCalendars(grantId);
      return calendars.find(cal => cal.is_primary) || calendars[0] || null;
    } catch (error) {
      console.error('Error getting primary calendar:', error);
      return null;
    }
  }

  /**
   * Check availability for a specific time range
   */
  async checkAvailability(
    grantId: string,
    calendarId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/calendars/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_time: startTimestamp,
          end_time: endTimestamp,
          calendar_ids: [calendarId],
        }),
      });

      if (!response.ok) {
        throw new Error(`Nylas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if there are any busy periods that conflict
      const busyPeriods = data.data?.[0]?.busy_time_slots || [];
      return busyPeriods.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    grantId: string,
    calendarId: string,
    eventData: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      attendeeEmail: string;
      attendeeName?: string;
      location?: string;
    }
  ): Promise<NylasEvent | null> {
    try {
      const startTimestamp = Math.floor(new Date(eventData.startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(eventData.endTime).getTime() / 1000);

      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          when: {
            start_time: startTimestamp,
            end_time: endTimestamp,
            start_timezone: eventData.timezone,
            end_timezone: eventData.timezone,
          },
          location: eventData.location,
          participants: [
            {
              email: eventData.attendeeEmail,
              name: eventData.attendeeName,
              status: 'yes',
            },
          ],
          calendar_id: calendarId,
          busy: true,
          conferencing: {
            provider: 'Zoom',
            details: {
              meeting_code: 'auto-generated',
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nylas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    grantId: string,
    eventId: string,
    updates: Partial<{
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location: string;
    }>
  ): Promise<NylasEvent | null> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.location) updateData.location = updates.location;

      if (updates.startTime && updates.endTime && updates.timezone) {
        updateData.when = {
          start_time: Math.floor(new Date(updates.startTime).getTime() / 1000),
          end_time: Math.floor(new Date(updates.endTime).getTime() / 1000),
          start_timezone: updates.timezone,
          end_timezone: updates.timezone,
        };
      }

      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Nylas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Cancel a calendar event
   */
  async cancelEvent(grantId: string, eventId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling event:', error);
      return false;
    }
  }
}

/**
 * Create a booking and calendar event
 */
export async function createBooking(params: CreateBookingParams): Promise<{
  success: boolean;
  bookingId?: number;
  eventId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const calendarService = new NylasCalendarService();

  try {
    // Get booking link details
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('id', params.bookingLinkId)
      .single();

    if (linkError || !bookingLink) {
      return { success: false, error: 'Booking link not found' };
    }

    // Check availability using our database function
    const { data: isAvailable } = await supabase
      .rpc('check_booking_availability', {
        p_booking_link_id: params.bookingLinkId,
        p_start_time: params.startTime,
        p_end_time: params.endTime,
      });

    if (!isAvailable) {
      return { success: false, error: 'Time slot not available' };
    }

    // Get calendar details
    const primaryCalendar = await calendarService.getPrimaryCalendar(bookingLink.grant_id);
    if (!primaryCalendar) {
      return { success: false, error: 'No calendar found' };
    }

    const calendarId = bookingLink.calendar_id || primaryCalendar.id;

    // Double-check availability with Nylas
    const nylasAvailable = await calendarService.checkAvailability(
      bookingLink.grant_id,
      calendarId,
      params.startTime,
      params.endTime
    );

    if (!nylasAvailable) {
      return { success: false, error: 'Time slot conflicts with existing events' };
    }

    // Create the booking record first
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingLink.user_id,
        booking_link_id: params.bookingLinkId,
        lead_id: null, // Will be set if lead exists
        start_time: params.startTime,
        end_time: params.endTime,
        timezone: params.timezone,
        lead_name: params.leadName,
        lead_email: params.leadEmail,
        lead_company: params.leadCompany,
        lead_phone: params.leadPhone,
        booking_notes: params.notes,
        meeting_location: bookingLink.meeting_location,
        meeting_type: bookingLink.meeting_type,
        status: 'confirmed',
        nylas_grant_id: bookingLink.grant_id,
        booking_source: 'email_link',
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return { success: false, error: 'Failed to create booking record' };
    }

    // Create calendar event
    const eventTitle = bookingLink.event_title_template
      .replace('{{lead_name}}', params.leadName)
      .replace('{{lead_company}}', params.leadCompany || '');

    const eventDescription = bookingLink.event_description_template
      .replace('{{lead_name}}', params.leadName)
      .replace('{{lead_company}}', params.leadCompany || '') +
      (params.notes ? `\n\nNotes: ${params.notes}` : '');

    const event = await calendarService.createEvent(
      bookingLink.grant_id,
      calendarId,
      {
        title: eventTitle,
        description: eventDescription,
        startTime: params.startTime,
        endTime: params.endTime,
        timezone: params.timezone,
        attendeeEmail: params.leadEmail,
        attendeeName: params.leadName,
        location: bookingLink.meeting_location,
      }
    );

    if (!event) {
      // Clean up booking if event creation failed
      await supabase.from('bookings').delete().eq('id', booking.id);
      return { success: false, error: 'Failed to create calendar event' };
    }

    // Update booking with event ID
    await supabase
      .from('bookings')
      .update({ nylas_event_id: event.id })
      .eq('id', booking.id);

    // Try to find and update existing lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', params.leadEmail)
      .single();

    if (existingLead) {
      await supabase
        .from('bookings')
        .update({ lead_id: existingLead.id })
        .eq('id', booking.id);
    }

    return {
      success: true,
      bookingId: booking.id,
      eventId: event.id,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get available time slots for a booking link
 */
export async function getAvailableSlots(
  bookingLinkId: number,
  date: string,
  timezone: string = 'UTC'
): Promise<BookingSlot[]> {
  const supabase = await createClient();

  try {
    const { data: slots, error } = await supabase
      .rpc('get_available_slots', {
        p_booking_link_id: bookingLinkId,
        p_date: date,
        p_timezone: timezone,
      });

    if (error) {
      console.error('Error getting available slots:', error);
      return [];
    }

    return slots || [];
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}
