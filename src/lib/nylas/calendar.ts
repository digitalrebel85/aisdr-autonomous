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

      const requestBody = {
        start_time: startTimestamp,
        end_time: endTimestamp,
        calendar_ids: [calendarId],
      };

      console.log('Nylas availability check:', {
        grantId,
        calendarId,
        startTime,
        endTime,
        startTimestamp,
        endTimestamp,
        requestBody
      });

      // For Google Calendar, use events endpoint instead of availability endpoint
      // Check for existing events in the time slot
      const eventsUrl = `${this.baseUrl}/v3/grants/${grantId}/events?calendar_id=${calendarId}&start=${startTimestamp}&end=${endTimestamp}`;
      
      console.log('Checking events with URL:', eventsUrl);
      
      const response = await fetch(eventsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Nylas API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Nylas API error response:', errorText);
        throw new Error(`Nylas API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Events found:', data.data?.length || 0);
      
      // Check if there are any events that conflict with the requested time
      const events = data.data || [];
      const hasConflict = events.some((event: any) => {
        const eventStart = event.when?.start_time || 0;
        const eventEnd = event.when?.end_time || 0;
        
        // Check if there's any overlap
        return (eventStart < endTimestamp && eventEnd > startTimestamp);
      });
      
      return !hasConflict;
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

      const response = await fetch(`${this.baseUrl}/v3/grants/${grantId}/events?calendar_id=${calendarId}`, {
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
          busy: true,
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
    console.log('createBooking: Starting with params:', params);
    
    // Get booking link details
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('id', params.bookingLinkId)
      .single();

    console.log('createBooking: Booking link query result:', { bookingLink, linkError });

    if (linkError || !bookingLink) {
      console.log('createBooking: Booking link not found');
      return { success: false, error: 'Booking link not found' };
    }

    // Check availability using our database function
    console.log('createBooking: Checking availability with RPC');
    
    // Convert times to proper ISO format with timezone
    const startTimeISO = new Date(params.startTime).toISOString();
    const endTimeISO = new Date(params.endTime).toISOString();
    
    console.log('createBooking: RPC parameters:', {
      p_booking_link_id: params.bookingLinkId,
      p_start_time: startTimeISO,
      p_end_time: endTimeISO,
    });
    
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_booking_availability', {
        p_booking_link_id: params.bookingLinkId,
        p_start_time: startTimeISO,
        p_end_time: endTimeISO,
      });

    console.log('createBooking: Availability check result:', { isAvailable, availabilityError });

    if (availabilityError) {
      console.log('createBooking: Availability check failed with error:', availabilityError);
      return { success: false, error: 'Availability check failed: ' + availabilityError.message };
    }

    if (!isAvailable) {
      console.log('createBooking: Time slot not available');
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

    // Send immediate confirmation email and schedule follow-ups
    try {
      await scheduleBookingFollowUps(booking.id, bookingLink, params);
    } catch (error) {
      console.error('Error scheduling booking follow-ups:', error);
      // Don't fail the booking creation if follow-up scheduling fails
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
 * Schedule follow-up emails for a booking
 */
async function scheduleBookingFollowUps(
  bookingId: number,
  bookingLink: any,
  params: CreateBookingParams
): Promise<void> {
  const supabase = await createClient();

  try {
    // Get user's connected inbox for sending emails
    const { data: inbox, error: inboxError } = await supabase
      .from('connected_inboxes')
      .select('email_address, grant_id')
      .eq('user_id', bookingLink.user_id)
      .eq('is_active', true)
      .single();

    if (inboxError || !inbox) {
      console.error('No active inbox found for user:', bookingLink.user_id);
      return;
    }

    // Generate confirmation email content
    const bookingTime = new Date(params.startTime);
    const formattedDate = bookingTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = bookingTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const confirmationSubject = `Booking Confirmed: ${bookingLink.title} on ${formattedDate}`;
    const confirmationBody = `Hi ${params.leadName},

Thank you for booking a meeting with us! Your appointment has been confirmed.

📅 **Meeting Details:**
• Date: ${formattedDate}
• Time: ${formattedTime} (${params.timezone})
• Duration: ${bookingLink.duration_minutes} minutes
• Location: ${bookingLink.meeting_location}

${params.notes ? `**Your Notes:** ${params.notes}\n\n` : ''}We're looking forward to speaking with you!

If you need to reschedule or have any questions, please reply to this email.

Best regards,
The Team`;

    // Send immediate confirmation email
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grantId: inbox.grant_id,
          to: params.leadEmail,
          subject: confirmationSubject,
          body: confirmationBody,
          fromEmail: inbox.email_address,
          leadId: null, // Will be set if lead exists
          bookingId: bookingId,
        }),
      });

      if (response.ok) {
        // Record the confirmation email
        await supabase
          .from('booking_follow_ups')
          .insert({
            booking_id: bookingId,
            follow_up_type: 'confirmation',
            sent_at: new Date().toISOString(),
            email_subject: confirmationSubject,
          });

        console.log(`Confirmation email sent for booking ${bookingId}`);
      } else {
        console.error(`Failed to send confirmation email for booking ${bookingId}`);
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  } catch (error) {
    console.error('Error in scheduleBookingFollowUps:', error);
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
    console.log('getAvailableSlots called with:', {
      bookingLinkId,
      date,
      timezone
    });

    // Get booking link details directly
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('id', bookingLinkId)
      .eq('is_active', true)
      .single();

    if (linkError || !bookingLink) {
      console.error('Booking link not found:', linkError);
      return [];
    }

    console.log('Booking link found:', {
      id: bookingLink.id,
      working_hours: bookingLink.working_hours,
      duration_minutes: bookingLink.duration_minutes
    });

    // Get day of week
    const requestDate = new Date(date + 'T00:00:00');
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[requestDate.getDay()];

    console.log('Day of week:', dayOfWeek);

    // Check if working hours exist for this day
    const workingHours = bookingLink.working_hours?.[dayOfWeek];
    if (!workingHours) {
      console.log('No working hours for', dayOfWeek);
      return [];
    }

    console.log('Working hours for', dayOfWeek, ':', workingHours);

    // Generate time slots
    const slots: BookingSlot[] = [];
    const startTime = workingHours.start; // e.g., "09:00"
    const endTime = workingHours.end;     // e.g., "17:00"
    const duration = bookingLink.duration_minutes || 30;

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    // Create slots every 30 minutes
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Create slot start time in the specified timezone
      // Format: YYYY-MM-DDTHH:mm:ss (without Z to keep it in local timezone)
      const timeString = String(currentHour).padStart(2, '0') + ':' + 
                        String(currentMinute).padStart(2, '0') + ':00';
      const slotStartString = date + 'T' + timeString;
      
      // Create Date objects for availability checking (these will be in UTC)
      const slotStart = new Date(slotStartString);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      // Calculate end time first to check working hours boundary
      let calculatedEndHour = currentHour;
      let calculatedEndMinute = currentMinute + duration;
      
      // Handle minute overflow
      if (calculatedEndMinute >= 60) {
        calculatedEndHour += Math.floor(calculatedEndMinute / 60);
        calculatedEndMinute = calculatedEndMinute % 60;
      }
      
      // Check if this slot fits within working hours
      if (calculatedEndHour > endHour || (calculatedEndHour === endHour && calculatedEndMinute > endMinute)) {
        break; // Slot would extend beyond working hours
      }

      // Check availability using our database function
      const { data: isAvailable, error: availError } = await supabase
        .rpc('check_booking_availability', {
          p_booking_link_id: bookingLinkId,
          p_start_time: slotStart.toISOString(),
          p_end_time: slotEnd.toISOString(),
        });

      if (availError) {
        console.error('Error checking availability for slot:', availError);
      }

      // Use the already calculated end time for the time string
      const endTimeString = date + 'T' + 
        String(calculatedEndHour).padStart(2, '0') + ':' + 
        String(calculatedEndMinute).padStart(2, '0') + ':00';

      slots.push({
        start: slotStartString,
        end: endTimeString,
        available: !availError && isAvailable === true
      });

      // Move to next 30-minute slot
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    console.log('Generated slots:', slots.length);
    return slots;

  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}
