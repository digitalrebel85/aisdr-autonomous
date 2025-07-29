import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/calendar-hosts?error=oauth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar-hosts?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const nylasApiServer = process.env.NYLAS_API_SERVER;
    const nylasClientId = process.env.NYLAS_CLIENT_ID;
    const nylasClientSecret = process.env.NYLAS_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!nylasApiServer || !nylasClientId || !nylasClientSecret) {
      return NextResponse.redirect(
        new URL('/dashboard/calendar-hosts?error=config_missing', request.url)
      );
    }

    const tokenResponse = await fetch(`${nylasApiServer}/v3/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
      },
      body: JSON.stringify({
        client_id: nylasClientId,
        client_secret: nylasClientSecret,
        redirect_uri: `${baseUrl}/api/nylas/calendar-host-callback`,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/dashboard/calendar-hosts?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, grant_id } = tokenData;

    // Get account details
    const accountResponse = await fetch(`${nylasApiServer}/v3/grants/me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!accountResponse.ok) {
      console.error('Failed to get account details');
      return NextResponse.redirect(
        new URL('/dashboard/calendar-hosts?error=account_fetch_failed', request.url)
      );
    }

    const accountData = await accountResponse.json();
    
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/login?error=authentication_required', request.url)
      );
    }

    // Store the grant information temporarily in session storage via redirect
    const redirectUrl = new URL('/dashboard/calendar-hosts', request.url);
    redirectUrl.searchParams.set('success', 'calendar_connected');
    redirectUrl.searchParams.set('grant_id', grant_id);
    redirectUrl.searchParams.set('host_email', accountData.email);
    redirectUrl.searchParams.set('access_token', access_token);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in calendar host OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/calendar-hosts?error=callback_failed', request.url)
    );
  }
}
