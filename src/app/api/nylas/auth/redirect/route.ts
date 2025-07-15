// src/app/api/nylas/auth/redirect/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import Nylas from 'nylas'

export async function GET() {
  // --- MANUAL ENV VARIABLE LOADING --- 

  const envPath = path.resolve(process.cwd(), '.env.local');
  let nylasClientId: string | undefined;
  let nylasApiKey: string | undefined;
  let nylasApiServer: string | undefined;
  let nylasCallbackUri: string | undefined;

  try {

    const envFileContent = fs.readFileSync(envPath, { encoding: 'utf8' });


    // Split by lines, then by the first '=', and clean up the value
    const envVars = Object.fromEntries(
      envFileContent.split(/\r?\n/).map(line => {
        const [key, ...valueParts] = line.split('=');
        // Remove inline comments and trim whitespace
        const value = valueParts.join('=').split('#')[0].trim();
        return [key, value];
      })
    );

    nylasClientId = envVars['NYLAS_CLIENT_ID'];
    nylasApiKey = envVars['NYLAS_API_KEY'];
    nylasApiServer = envVars['NYLAS_API_SERVER'];
    nylasCallbackUri = envVars['NEXT_PUBLIC_NYLAS_CALLBACK_URI'];



  } catch (error) {
    console.error('Error manually reading or parsing .env.local:', error);
    return NextResponse.json({ error: 'Failed to load configuration.' }, { status: 500 });
  }
  
  if (!nylasClientId || !nylasApiKey) {
    console.error('Required Nylas variables not found in .env.local file.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  // --- END MANUAL LOADING ---

  // --- Manually construct the Nylas Auth URL to bypass SDK issues ---
  const params = new URLSearchParams({
    client_id: nylasClientId,
    redirect_uri: nylasCallbackUri || '',
    access_type: 'online',
    response_type: 'code',
    scope: 'email.readonly email.send calendar.readonly',
  });

  const authUrl = `${nylasApiServer}/v3/connect/auth?${params.toString()}`;



  return NextResponse.redirect(authUrl);
}