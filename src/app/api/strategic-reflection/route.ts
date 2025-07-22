import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(_request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
  if (!pythonServiceUrl) {
    console.error('PYTHON_SERVICE_URL is not set');
    return new NextResponse(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
  }

  try {
    const response = await fetch(`${pythonServiceUrl}/run-strategic-reflection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: user.id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from Python service:', errorData);
      return new NextResponse(JSON.stringify({ error: 'Failed to run strategic reflection' }), { status: response.status });
    }

    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: 200 });

  } catch (error) {
    console.error('Error calling Python service:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
