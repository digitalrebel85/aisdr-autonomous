import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');

    // Build query
    let query = supabase
      .from('companies')
      .select(`
        *,
        leads:leads(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
    }
    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch companies' }), { status: 500 });
    }

    // Get unique industries for filter dropdown
    const { data: industries } = await supabase
      .from('companies')
      .select('industry')
      .eq('user_id', user.id)
      .not('industry', 'is', null);

    const uniqueIndustries = [...new Set(industries?.map(i => i.industry).filter(Boolean))];

    return NextResponse.json({
      companies: companies || [],
      industries: uniqueIndustries,
      total: companies?.length || 0
    });

  } catch (error) {
    console.error('Error in companies endpoint:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
