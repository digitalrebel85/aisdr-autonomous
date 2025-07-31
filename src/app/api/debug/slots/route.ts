import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingLinkId = searchParams.get('bookingLinkId') || '1';
  const date = searchParams.get('date') || '2025-08-01';
  const timezone = searchParams.get('timezone') || 'Europe/London';

  try {
    const supabase = await createClient();

    // Test 1: Check if booking links exist
    const { data: bookingLinks, error: linksError } = await supabase
      .from('booking_links')
      .select('*')
      .limit(5);

    // Test 2: Call the RPC function directly
    const { data: slots, error: slotsError } = await supabase
      .rpc('get_available_slots', {
        p_booking_link_id: parseInt(bookingLinkId),
        p_date: date,
        p_timezone: timezone,
      });

    return NextResponse.json({
      debug: {
        bookingLinkId: parseInt(bookingLinkId),
        date,
        timezone,
        bookingLinks: {
          count: bookingLinks?.length || 0,
          data: bookingLinks,
          error: linksError,
        },
        slots: {
          count: slots?.length || 0,
          data: slots,
          error: slotsError,
        },
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
