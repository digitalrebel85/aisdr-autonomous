import { createClient } from '@/utils/supabase/server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message_id, grant_id, sender_email } = await request.json();

  if (!message_id || !grant_id || !sender_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
  if (!pythonServiceUrl) {
    console.error('PYTHON_SERVICE_URL is not set');
    return NextResponse.json({ error: 'Service is not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`${pythonServiceUrl}/analyze-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_id,
        message_id,
        sender_email,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Python service error: ${response.status} ${errorBody}`);
      return NextResponse.json({ error: 'Failed to generate draft from service' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling Python service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
