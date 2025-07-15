// src/app/settings/page.tsx

import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function SettingsPage() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: inboxes, error } = await supabase
    .from('connected_inboxes')
    .select('id, email_address, provider')
    .eq('user_id', user?.id);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your connected inboxes.</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Your Inboxes</h2>
          <div className="p-4 border rounded-lg bg-gray-50">
            {inboxes && inboxes.length > 0 ? (
              <ul className="space-y-3">
                {inboxes.map((inbox) => (
                  <li key={inbox.id} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
                    <span className="font-medium text-gray-700">{inbox.email_address}</span>
                    <div className="flex items-center space-x-4">
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">{inbox.provider}</span>
                    <form action="/api/nylas/disconnect" method="post">
                      <input type="hidden" name="inboxId" value={inbox.id} />
                      <button type="submit" className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        Disconnect
                      </button>
                    </form>
                  </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">No inboxes connected yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="/api/nylas/auth/redirect" className="w-full max-w-xs px-6 py-3 text-center text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
            Connect New Inbox
          </Link>
        </div>

        <nav className="flex justify-center pt-2">
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Back to Dashboard
          </Link>
        </nav>
      </div>
    </div>
  );
}