import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/settings?error=nylas_auth_failed', request.url));
  }

  // --- MANUAL ENV VARIABLE LOADING ---
  const envPath = path.resolve(process.cwd(), '.env.local');
  let nylasClientId: string | undefined;
  let nylasApiKey: string | undefined;
  let nylasApiServer: string | undefined;
  let nylasCallbackUri: string | undefined;

  try {
    const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
    const envVars = Object.fromEntries(
      envFileContent.split(/\r?\n/).map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').split('#')[0].trim();
        return [key, value];
      })
    );
    nylasClientId = envVars['NYLAS_CLIENT_ID'];
    nylasApiKey = envVars['NYLAS_API_KEY'];
    nylasApiServer = envVars['NYLAS_API_SERVER'];
    nylasCallbackUri = envVars['NEXT_PUBLIC_NYLAS_CALLBACK_URI'];
  } catch (error) {
    console.error('Callback: Error manually reading .env.local:', error);
    return NextResponse.json({ error: 'Failed to load configuration.' }, { status: 500 });
  }

  if (!nylasClientId || !nylasApiKey || !nylasApiServer || !nylasCallbackUri) {
    console.error('Callback: Missing required Nylas variables in .env.local.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  // --- END MANUAL LOADING ---

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return NextResponse.redirect(new URL('/login?error=authentication_failed', request.url));
    }

    // 1. Exchange the authorization code for an access token
    const tokenResponse = await fetch(`${nylasApiServer}/v3/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: nylasClientId,
        client_secret: nylasApiKey,
        grant_type: 'authorization_code',
        code,
        redirect_uri: nylasCallbackUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, grant_id } = tokenData;

    // 2. Use the access token to get account details
    const accountResponse = await fetch(`${nylasApiServer}/v3/grants/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!accountResponse.ok) {
      const errorBody = await accountResponse.text();
      throw new Error(`Failed to get account details: ${errorBody}`);
    }

    const { data: accountData } = await accountResponse.json();

    // 3. Calculate expiration
    const expires_at = new Date(Date.now() + expires_in * 1000);

    // 4. Check if a grant with this ID already exists
    const { data: existingGrant, error: selectError } = await supabase
      .from('connected_inboxes')
      .select('id')
      .eq('grant_id', grant_id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Failed to check for existing grant: ${selectError.message}`);
    }

    const credentials = {
      user_id: user.id, // This is now correct after destructuring
      grant_id: accountData.id, // Use grant_id from the /grants/me response
      provider: accountData.provider,
      email_address: accountData.email, // The API returns 'email', not 'email_address'
      access_token: access_token,
      refresh_token: refresh_token,
      expires_at: expires_at.toISOString(),
    };

    let dbError;
    if (existingGrant) {
      // 5a. Update existing credentials
      const { error } = await supabase
        .from('connected_inboxes')
        .update(credentials)
        .eq('grant_id', grant_id);
      dbError = error;
    } else {
      // 5b. Insert new credentials
      const { error } = await supabase.from('connected_inboxes').insert(credentials);
      dbError = error;
    }

    if (dbError) {
      throw new Error(`Failed to save credentials: ${dbError.message}`);
    }

    return NextResponse.redirect(new URL('/settings?success=inbox_connected', request.url));

  } catch (error) {
    console.error('Nylas callback error:', error);
    return NextResponse.redirect(new URL('/settings?error=nylas_callback_failed', request.url));
  }
}