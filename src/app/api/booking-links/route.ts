import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get booking links with calendar host info
    const { data: bookingLinks, error } = await supabase
      .from('booking_links')
      .select(`
        id,
        title,
        description,
        booking_slug,
        duration_minutes,
        is_active,
        calendar_host:calendar_hosts(
          host_name,
          host_title
        )
      `)
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('Error fetching booking links:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch booking links' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingLinks: bookingLinks || [],
    });
  } catch (error) {
    console.error('Error in booking links API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
