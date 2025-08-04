// API Route: Create Booking
// Handles calendar booking creation from booking links

import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/nylas/calendar';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Booking create request body:', body);
    
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

    console.log('Extracted fields:', {
      bookingSlug,
      leadName,
      leadEmail,
      leadCompany,
      leadPhone,
      startTime,
      endTime,
      timezone,
      notes
    });

    // Validate required fields
    if (!bookingSlug || !leadName || !leadEmail || !startTime || !endTime || !timezone) {
      console.log('Missing required fields validation failed');
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missing: {
            bookingSlug: !bookingSlug,
            leadName: !leadName,
            leadEmail: !leadEmail,
            startTime: !startTime,
            endTime: !endTime,
            timezone: !timezone
          }
        },
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
      console.log('Email validation failed for:', leadEmail);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate time format
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    console.log('Date validation:', {
      startTime,
      endTime,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      now: new Date().toISOString()
    });
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid date format validation failed');
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      console.log('Start time >= end time validation failed');
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Check if booking is in the future
    if (startDate <= new Date()) {
      console.log('Booking in past validation failed');
      return NextResponse.json(
        { error: 'Booking must be in the future' },
        { status: 400 }
      );
    }

    // Create the booking
    console.log('About to call createBooking with:', {
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

    console.log('createBooking result:', result);

    if (!result.success) {
      console.log('createBooking failed with error:', result.error);
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
