import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to load env vars from .env.local
function loadEnvVars() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.warn('.env.local file not found');
    return {};
  }
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      // Trim whitespace and remove surrounding quotes and comments
      acc[key.trim()] = value.trim().replace(/(^"|"$)/g, '').split(' #')[0];
    }
    return acc;
  }, {} as { [key: string]: string });
  return envVars;
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const env = loadEnvVars();
  const nylasApiKey = env.NYLAS_API_KEY;
  const supabase = await createClient();

  if (!nylasApiKey) {
    throw new Error('NYLAS_API_KEY is not defined in .env.local');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const formData = await request.formData();
    const inboxId = formData.get('inboxId') as string;

    if (!inboxId) {
      throw new Error('Inbox ID not provided');
    }

    // First, verify the user owns this inbox and get the grant_id
    const { data: inbox, error: selectError } = await supabase
      .from('connected_inboxes')
      .select('id, user_id, grant_id')
      .eq('id', inboxId)
      .single();

    if (selectError || !inbox) {
      throw new Error('Inbox not found or select error.');
    }

    if (inbox.user_id !== user.id) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Revoke the grant with Nylas using the correct DELETE /v3/grants/{grantId} endpoint
    const revokeResponse = await fetch(`https://api.us.nylas.com/v3/grants/${inbox.grant_id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${nylasApiKey}`,
      },
    });

    if (!revokeResponse.ok) {
      const errorBody = await revokeResponse.text();
      console.error(`Nylas revoke failed: ${revokeResponse.status}`, errorBody);
      // We still proceed to delete from our DB, but we log the error.
    }

    // Finally, delete the inbox from our Supabase table
    const { error: deleteError } = await supabase
      .from('connected_inboxes')
      .delete()
      .eq('id', inboxId);

    if (deleteError) {
      throw new Error(`Failed to delete inbox: ${deleteError.message}`);
    }

    // Redirect back to settings with a success message
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('success', 'inbox_disconnected');
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Nylas disconnect error:', error);
    const redirectUrl = new URL('/settings', request.url);
    redirectUrl.searchParams.set('error', 'disconnect_failed');
    return NextResponse.redirect(redirectUrl);
  }
}
