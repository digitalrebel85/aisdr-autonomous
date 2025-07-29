// API Route: Get Booking Availability
// Returns available time slots for a booking link

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/nylas/calendar';
import { createClient } from '@/utils/supabase/server';

interface BookingLinkWithHost {
  id: number;
  title: string;
  description?: string;
  duration_minutes: number;
  timezone: string;
  booking_slug: string;
  is_active: boolean;
  meeting_location?: string;
  meeting_type?: string;
  grant_id?: string;
  calendar_id?: string;
  host_id?: number;
  host_name?: string;
  host_email?: string;
  host_title?: string;
  host_bio?: string;
  host_avatar_url?: string;
  host_timezone?: string;
  host_grant_id?: string;
  host_calendar_id?: string;
  host_working_hours?: any;
  host_buffer_before?: number;
  host_buffer_after?: number;
  host_max_bookings?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingSlug = searchParams.get('slug');
    const date = searchParams.get('date');
    const timezone = searchParams.get('timezone') || 'UTC';

    if (!bookingSlug || !date) {
      return NextResponse.json(
        { error: 'Missing booking slug or date' },
        { status: 400 }
      );
    }

    // Validate date format
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Get booking link with calendar host information
    const supabase = await createClient();
    
    const { data: bookingData, error: linkError } = await supabase
      .rpc('get_booking_link_with_host', { p_booking_slug: bookingSlug })
      .single() as { data: BookingLinkWithHost | null; error: any };

    if (linkError || !bookingData) {
      return NextResponse.json(
        { error: 'Booking link not found or inactive' },
        { status: 404 }
      );
    }

    // If no calendar host is assigned, fall back to the booking link's grant_id
    const grantId = bookingData.host_grant_id || bookingData.grant_id;
    const calendarId = bookingData.host_calendar_id || bookingData.calendar_id;
    
    if (!grantId) {
      return NextResponse.json(
        { error: 'No calendar connection found for this booking link' },
        { status: 500 }
      );
    }

    // Get available slots using the calendar host's grant and calendar
    const slots = await getAvailableSlots(
      bookingData.id,
      date,
      timezone
    );

    return NextResponse.json({
      success: true,
      bookingLink: {
        title: bookingData.title,
        description: bookingData.description,
        duration: bookingData.duration_minutes,
        timezone: bookingData.timezone,
        host: bookingData.host_name ? {
          name: bookingData.host_name,
          title: bookingData.host_title,
          bio: bookingData.host_bio,
          email: bookingData.host_email,
        } : null,
      },
      slots,
    });

  } catch (error) {
    console.error('Error getting availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
