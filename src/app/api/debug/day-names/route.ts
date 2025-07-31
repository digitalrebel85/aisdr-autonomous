import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Test day name generation for different dates
    const testDates = [
      '2025-08-01', // Friday
      '2025-08-02', // Saturday  
      '2025-08-03', // Sunday
      '2025-08-04', // Monday
    ];

    const results = [];

    for (const date of testDates) {
      // Test PostgreSQL day name generation
      const { data, error } = await supabase
        .rpc('test_day_name', { test_date: date })
        .single();

      const jsDate = new Date(date);
      const jsDayName = jsDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      results.push({
        date,
        jsDayName,
        pgDayName: data?.day_name || 'error',
        pgError: error,
      });
    }

    return NextResponse.json({
      debug: {
        testDates: results,
        bookingLinkWorkingHours: {
          friday: { start: '09:00', end: '17:00' },
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          // Note: Saturday and Sunday are NOT configured
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
