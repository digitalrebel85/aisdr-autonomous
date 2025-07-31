import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingLinkId = searchParams.get('bookingLinkId') || '1';
  const date = searchParams.get('date') || '2025-08-01';

  try {
    const supabase = await createClient();

    // Get booking link configuration
    const { data: bookingLink, error: linkError } = await supabase
      .from('booking_links')
      .select('*')
      .eq('id', parseInt(bookingLinkId))
      .single();

    if (linkError || !bookingLink) {
      return NextResponse.json({
        error: 'Booking link not found',
        linkError,
      });
    }

    // Parse the date and get day name
    const baseDate = new Date(date);
    const dayName = baseDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Get day configuration from working hours
    const workingHours = bookingLink.working_hours || {};
    const dayConfig = workingHours[dayName];

    return NextResponse.json({
      debug: {
        bookingLinkId: parseInt(bookingLinkId),
        date,
        baseDate: baseDate.toISOString(),
        dayName,
        bookingLink: {
          id: bookingLink.id,
          title: bookingLink.title,
          duration_minutes: bookingLink.duration_minutes,
          timezone: bookingLink.timezone,
          working_hours: bookingLink.working_hours,
        },
        dayConfig,
        workingHoursKeys: Object.keys(workingHours),
        analysis: {
          hasWorkingHours: !!bookingLink.working_hours,
          hasDayConfig: !!dayConfig,
          dayEnabled: dayConfig?.enabled,
          workStart: dayConfig?.start,
          workEnd: dayConfig?.end,
        }
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
