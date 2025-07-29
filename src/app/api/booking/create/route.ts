// API Route: Create Booking
// Handles calendar booking creation from booking links

import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/nylas/calendar';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingSlug,
      leadName,
      leadEmail,
      leadCompany,
      leadPhone,
      startTime,
      endTime,
      timezone,
      notes,
    } = body;

    // Validate required fields
    if (!bookingSlug || !leadName || !leadEmail || !startTime || !endTime || !timezone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get booking link by slug
    const supabase = await createClient();
    
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('booking_slug', bookingSlug)
      .eq('is_active', true)
      .single();

    if (linkError || !bookingLink) {
      return NextResponse.json(
        { error: 'Booking link not found or inactive' },
        { status: 404 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate time format
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check if booking is in the future
    if (startDate <= new Date()) {
      return NextResponse.json(
        { error: 'Booking must be in the future' },
        { status: 400 }
      );
    }

    // Create the booking
    const result = await createBooking({
      bookingLinkId: bookingLink.id,
      leadName,
      leadEmail,
      leadCompany,
      leadPhone,
      startTime,
      endTime,
      timezone,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create booking' },
        { status: 400 }
      );
    }

    // Send confirmation email (optional - could be implemented later)
    // await sendBookingConfirmation(leadEmail, bookingDetails);

    return NextResponse.json({
      success: true,
      bookingId: result.bookingId,
      eventId: result.eventId,
      message: 'Booking created successfully',
    });

  } catch (error) {
    console.error('Error in booking creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
