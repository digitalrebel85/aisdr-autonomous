import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const nylasApiServer = process.env.NYLAS_API_SERVER;
    const nylasClientId = process.env.NYLAS_CLIENT_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!nylasApiServer || !nylasClientId) {
      return NextResponse.json(
        { success: false, error: 'Nylas configuration missing' },
        { status: 500 }
      );
    }

    // Generate OAuth URL for calendar host connection
    const authUrl = `${nylasApiServer}/v3/connect/auth?` +
      `client_id=${nylasClientId}&` +
      `redirect_uri=${encodeURIComponent(`${baseUrl}/api/nylas/calendar-host-callback`)}&` +
      `response_type=code&` +
      `provider=google`;

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error('Error generating calendar host OAuth URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
