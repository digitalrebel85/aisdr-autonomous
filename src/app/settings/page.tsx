// src/app/settings/page.tsx

import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import DisconnectInboxButton from '@/components/DisconnectInboxButton';

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: inboxes, error: inboxesError } = await supabase
    .from('connected_inboxes')
    .select('id, email_address, provider, grant_id, created_at, access_token')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  if (inboxesError) {
    console.error('Error fetching inboxes:', inboxesError);
    // Optionally, render an error message to the user
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your connected inboxes.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Connected Inboxes</h2>
            <span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
              {inboxes?.length || 0} connected
            </span>
          </div>
          
          <div className="space-y-3">
            {inboxes && inboxes.length > 0 ? (
              inboxes.map((inbox) => {
                const isActive = inbox.access_token ? true : false;
                const connectedDate = new Date(inbox.created_at).toLocaleDateString();
                
                return (
                  <div key={inbox.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {inbox.provider === 'gmail' ? (
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">G</span>
                              </div>
                            ) : inbox.provider === 'outlook' ? (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">O</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">@</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{inbox.email_address}</h3>
                            <p className="text-sm text-gray-500">Connected on {connectedDate}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <span className={`text-xs font-medium ${
                            isActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isActive ? 'Active' : 'Disconnected'}
                          </span>
                        </div>
                        
                        <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full capitalize">
                          {inbox.provider}
                        </span>
                        
                        <DisconnectInboxButton 
                          inboxId={inbox.id} 
                          emailAddress={inbox.email_address} 
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Grant ID: {inbox.grant_id}</span>
                        <span>AI replies: {isActive ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-gray-400">📧</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inboxes connected</h3>
                <p className="text-gray-500 mb-4">Connect your first email account to start automating replies</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Another Inbox</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect multiple email accounts (Gmail, Outlook, etc.) to manage all your lead communications from one dashboard.
            </p>
            <Link 
              href="/api/nylas/auth/redirect" 
              className="inline-flex items-center px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <span className="mr-2">+</span>
              Connect New Inbox
            </Link>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span>Gmail</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">O</span>
                </div>
                <span>Outlook</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">@</span>
                </div>
                <span>Other</span>
              </div>
            </div>
          </div>
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