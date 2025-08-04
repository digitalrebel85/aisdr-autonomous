'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import DisconnectInboxButton from '@/components/DisconnectInboxButton';

// Settings Section Component
const SettingsSection = ({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
    {children}
  </div>
);

// Settings Card Component
const SettingsCard = ({ icon, title, description, action, status }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
  status?: 'active' | 'inactive' | 'warning';
}) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
            {status}
          </span>
        )}
        {action}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    apollo: '',
    pdl: '',
    serper: '',
    clearbit: '',
    hunter: '',
    valueserp: '',
    builtwith: ''
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, 'saved' | 'unsaved' | 'saving' | undefined>>({});
  const [settings, setSettings] = useState({
    autoResponse: true,
    maxDailyEmails: 50,
    businessHours: {
      start: '09:00',
      end: '17:00'
    },
    emailNotifications: true,
    dailySummary: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      setUser(user);
      
      // Fetch connected inboxes
      const { data: inboxes } = await supabase
        .from('connected_inboxes')
        .select('*')
        .eq('user_id', user.id);
      
      setInboxes(inboxes || []);
      
      // Fetch API keys
      const { data: userApiKeys } = await supabase
        .from('user_api_keys')
        .select('provider, api_key')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (userApiKeys) {
        const keyMap: Record<string, string> = {};
        userApiKeys.forEach(key => {
          keyMap[key.provider] = key.api_key;
        });
        setApiKeys(prev => ({ ...prev, ...keyMap }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const saveApiKey = async (provider: string, apiKey: string) => {
    if (!user || !apiKey.trim()) return;
    
    const supabase = createClient();
    setApiKeyStatus(prev => ({ ...prev, [provider]: 'saving' }));
    
    try {
      // First, deactivate any existing keys for this provider
      await supabase
        .from('user_api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider);
      
      // Insert new key
      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider,
          api_key: apiKey.trim(),
          is_active: true
        });
      
      if (error) {
        console.error('Error saving API key:', error);
        setApiKeyStatus(prev => ({ ...prev, [provider]: 'unsaved' }));
      } else {
        setApiKeyStatus(prev => ({ ...prev, [provider]: 'saved' }));
        setTimeout(() => {
          setApiKeyStatus(prev => {
          const newState = { ...prev };
          delete newState[provider];
          return newState;
        });
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setApiKeyStatus(prev => ({ ...prev, [provider]: 'unsaved' }));
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setApiKeyStatus(prev => ({ ...prev, [provider]: 'unsaved' }));
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
          <p className="mt-2 text-gray-600">Manage your AISDR system preferences and integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email Integrations */}
        <SettingsSection
          title="Email Integrations"
          description="Connect and manage your email accounts for automated outreach"
        >
          <div className="space-y-4">
            {inboxes.map((inbox) => {
              const isActive = inbox.access_token && inbox.is_active;
              return (
                <SettingsCard
                  key={inbox.id}
                  icon={
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                  }
                  title={inbox.email_address}
                  description={`${inbox.provider} • Connected ${new Date(inbox.created_at).toLocaleDateString()}`}
                  status={isActive ? 'active' : 'inactive'}
                  action={
                    <DisconnectInboxButton 
                      inboxId={inbox.id} 
                      emailAddress={inbox.email_address}
                    />
                  }
                />
              );
            })}
            
            <div className="pt-4 border-t">
              <Link 
                href="/api/nylas/auth/redirect"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path>
                </svg>
                Connect New Email
              </Link>
            </div>
          </div>
        </SettingsSection>

        {/* AI Configuration */}
        <SettingsSection
          title="AI Configuration"
          description="Customize AI behavior and response settings"
        >
          <div className="space-y-4">
            <SettingsCard
              icon={
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
                </svg>
              }
              title="Auto-Response"
              description="Enable AI to automatically respond to lead inquiries"
              status={settings.autoResponse ? 'active' : 'inactive'}
              action={
                <button
                  onClick={() => setSettings(prev => ({ ...prev, autoResponse: !prev.autoResponse }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoResponse ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoResponse ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              }
            />
            
            <SettingsCard
              icon={
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              }
              title="Response Training"
              description="Train AI with custom responses and tone"
              action={
                <Link
                  href="/dashboard/inbox"
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Configure
                </Link>
              }
            />
          </div>
        </SettingsSection>

        {/* Enrichment API Keys */}
        <SettingsSection
          title="Enrichment API Keys"
          description="Configure API keys for lead enrichment providers"
        >
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">About API Keys</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Configure your own API keys for lead enrichment providers. The system will try providers in order: Apollo → PeopleDataLabs → Clearbit → Serper → Hunter.
                  </p>
                </div>
              </div>
            </div>
            
            {[
              { key: 'apollo', name: 'Apollo.io', description: 'Professional contact data and company information', category: 'Lead Enrichment' },
              { key: 'pdl', name: 'PeopleDataLabs', description: 'Comprehensive professional profiles', category: 'Lead Enrichment' },
              { key: 'clearbit', name: 'Clearbit', description: 'B2B contact and company data', category: 'Lead Enrichment' },
              { key: 'serper', name: 'Serper API', description: 'Google Search for public information', category: 'Lead Enrichment' },
              { key: 'hunter', name: 'Hunter.io', description: 'Email discovery and verification', category: 'Lead Enrichment' },
              { key: 'valueserp', name: 'ValueSERP', description: 'Company descriptions and search snippets', category: 'Company Profiling' },
              { key: 'builtwith', name: 'BuiltWith', description: 'Technology stack analysis', category: 'Company Profiling' }
            ].map(provider => (
              <div key={provider.key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        provider.category === 'Lead Enrichment' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {provider.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{provider.description}</p>
                  </div>
                  {apiKeyStatus[provider.key] && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      apiKeyStatus[provider.key] === 'saved' 
                        ? 'bg-green-100 text-green-800'
                        : apiKeyStatus[provider.key] === 'saving'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {apiKeyStatus[provider.key] === 'saved' ? '✓ Saved' : 
                       apiKeyStatus[provider.key] === 'saving' ? 'Saving...' : 'Unsaved'}
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <input
                    type="password"
                    value={apiKeys[provider.key]}
                    onChange={(e) => handleApiKeyChange(provider.key, e.target.value)}
                    placeholder={`Enter ${provider.name} API key`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => saveApiKey(provider.key, apiKeys[provider.key])}
                    disabled={!apiKeys[provider.key].trim() || apiKeyStatus[provider.key] === 'saving'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {apiKeyStatus[provider.key] === 'saving' ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Provider Documentation</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Lead Enrichment Providers</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• <strong>Apollo:</strong> <a href="https://apolloapi.com/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                    <div>• <strong>PeopleDataLabs:</strong> <a href="https://www.peopledatalabs.com/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                    <div>• <strong>Clearbit:</strong> <a href="https://clearbit.com/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                    <div>• <strong>Serper:</strong> <a href="https://serper.dev/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                    <div>• <strong>Hunter:</strong> <a href="https://hunter.io/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Company Profiling Providers</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• <strong>ValueSERP:</strong> <a href="https://valueserp.com/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                    <div>• <strong>BuiltWith:</strong> <a href="https://builtwith.com/" target="_blank" className="text-blue-600 hover:underline">Get API key</a></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Outreach Settings */}
        <SettingsSection
          title="Outreach Settings"
          description="Configure email sending limits and business hours"
        >
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Email Limit
              </label>
              <input
                type="number"
                value={settings.maxDailyEmails}
                onChange={(e) => setSettings(prev => ({ ...prev, maxDailyEmails: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum emails to send per day</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Hours
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={settings.businessHours.start}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      businessHours: { ...prev.businessHours, start: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={settings.businessHours.end}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      businessHours: { ...prev.businessHours, end: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Manage email and system notifications"
        >
          <div className="space-y-4">
            <SettingsCard
              icon={
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                </svg>
              }
              title="Email Notifications"
              description="Receive email alerts for important events"
              status={settings.emailNotifications ? 'active' : 'inactive'}
              action={
                <button
                  onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              }
            />
            
            <SettingsCard
              icon={
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              }
              title="Daily Summary"
              description="Receive daily performance summaries"
              status={settings.dailySummary ? 'active' : 'inactive'}
              action={
                <button
                  onClick={() => setSettings(prev => ({ ...prev, dailySummary: !prev.dailySummary }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.dailySummary ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.dailySummary ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              }
            />
          </div>
        </SettingsSection>
      </div>

      {/* Account Information */}
      <SettingsSection
        title="Account Information"
        description="View and manage your account details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
            <input
              type="text"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
            />
          </div>
        </div>
        
        <div className="pt-6 border-t mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Danger Zone</h3>
              <p className="text-sm text-gray-600">Irreversible and destructive actions</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}