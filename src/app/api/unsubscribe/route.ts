// One-click unsubscribe endpoint
// Handles both GET (link click) and POST (List-Unsubscribe header) requests
// No auth required — uses signed token for verification

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const UNSUB_SECRET = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || 'default-unsub-secret';

// Generate a signed unsubscribe token
export function generateUnsubToken(userId: string, email: string): string {
  const payload = `${userId}:${email}`;
  const hmac = crypto.createHmac('sha256', UNSUB_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
  return token;
}

// Verify and decode an unsubscribe token
function verifyUnsubToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;

    const hmac = parts.pop()!;
    const email = parts.pop()!;
    const userId = parts.join(':'); // UUID contains no colons but be safe

    const expectedHmac = crypto.createHmac('sha256', UNSUB_SECRET).update(`${userId}:${email}`).digest('hex');
    if (hmac !== expectedHmac) return null;

    return { userId, email };
  } catch {
    return null;
  }
}

// GET — user clicks unsubscribe link in email
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link is invalid or expired.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const data = verifyUnsubToken(token);
  if (!data) {
    return new NextResponse(renderPage('Invalid Link', 'This unsubscribe link is invalid or has been tampered with.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const supabase = createServiceClient();

  try {
    // Add to suppression list
    await supabase.rpc('suppress_email', {
      p_user_id: data.userId,
      p_email: data.email,
      p_reason: 'unsubscribed',
      p_source: 'one_click'
    });

    console.log(`[unsubscribe] ${data.email} unsubscribed via one-click link (user: ${data.userId})`);

    return new NextResponse(
      renderPage(
        'Unsubscribed Successfully',
        `You've been removed from our mailing list. You will no longer receive emails from us.`,
        true
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return new NextResponse(
      renderPage('Something Went Wrong', 'Please try again or contact support.', false),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// POST — List-Unsubscribe-Post header (RFC 8058 one-click)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const data = verifyUnsubToken(token);
  if (!data) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    await supabase.rpc('suppress_email', {
      p_user_id: data.userId,
      p_email: data.email,
      p_reason: 'unsubscribed',
      p_source: 'one_click'
    });

    console.log(`[unsubscribe] ${data.email} unsubscribed via List-Unsubscribe-Post (user: ${data.userId})`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[unsubscribe] POST error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function renderPage(title: string, message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 40px 24px;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 28px;
      ${success
        ? 'background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);'
        : 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);'
      }
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      ${success ? 'color: #10b981;' : 'color: #ef4444;'}
    }
    p {
      color: #9ca3af;
      font-size: 15px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✓' : '✕'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
