import { createClient } from '@/utils/supabase/server';

import { redirect } from 'next/navigation';

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data, error: _leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function addLead(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const company = formData.get('company') as string;
    const offer = formData.get('offer') as string;
    const cta = formData.get('cta') as string;
    const painPointsRaw = formData.get('pain_points') as string;
    const pain_points = painPointsRaw.split(',').map(p => p.trim());

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        email,
        name,
        title,
        company,
        offer,
        cta,
        pain_points,
      });

      if (error) {
        console.error('Error inserting lead:', error);
        return redirect('/dashboard/leads?error=Could not add lead');
      }
    }

    return redirect('/dashboard/leads');
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Leads</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Lead</h2>
        <form action={addLead} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required name="email" type="email" placeholder="Lead Email" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input required name="name" type="text" placeholder="Lead Name" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input name="title" type="text" placeholder="Title" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <input name="company" type="text" placeholder="Company" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <textarea required name="offer" placeholder="Your Offer (e.g., We help companies increase sales by 20%...)" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3}></textarea>
          <textarea required name="cta" placeholder="Your Call to Action (e.g., Are you free for a quick 15-min chat next week?)" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" rows={2}></textarea>
          <textarea name="pain_points" placeholder="Lead's Pain Points (comma-separated)" className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" rows={2}></textarea>
          <button type="submit" className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors">Add Lead</button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Existing Leads</h2>
        <div className="bg-gray-800 rounded-lg shadow-md">
          <ul className="divide-y divide-gray-700">
            {leads && leads.length > 0 ? (
              leads.map(lead => (
                <li key={lead.id} className="p-4">
                  <p className="font-bold text-lg">{lead.name} ({lead.email})</p>
                  <p className="text-sm text-gray-400">{lead.company}</p>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">No leads found. Add one above to get started.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
