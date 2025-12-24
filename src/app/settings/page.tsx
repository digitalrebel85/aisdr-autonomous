'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import DisconnectInboxButton from '@/components/DisconnectInboxButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Mail, 
  Bot, 
  Key, 
  Bell, 
  User, 
  Shield, 
  Clock,
  Globe,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ExternalLink,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

// Settings Section Component
const SettingsSection = ({ title, description, icon, children }: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
    <div className="p-5 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-xl">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-5">
      {children}
    </div>
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
  const statusConfig = {
    active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Active' },
    inactive: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Inactive' },
    warning: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Warning' }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-all">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-violet-500/20 rounded-lg">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {status && (
          <Badge className={statusConfig[status].color}>
            {status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {statusConfig[status].label}
          </Badge>
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
  const { canConnectInbox, isResearchOrTrial, subscription, loading: subLoading } = useSubscription();
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
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-16 bg-white/5 rounded-xl"></div>
                  <div className="h-16 bg-white/5 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Settings & Configuration</h1>
                <p className="mt-1 text-gray-400">Manage your AISDR system preferences and integrations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Email & AI Configuration */}
          <SettingsSection
            title="Email & AI Configuration"
            description="Connect email accounts and configure AI behavior"
            icon={<Mail className="h-5 w-5 text-violet-400" />}
          >
            <div className="space-y-4">
              {/* Connected Inboxes */}
              {inboxes.map((inbox) => {
                const isActive = inbox.access_token && inbox.is_active;
                return (
                  <SettingsCard
                    key={inbox.id}
                    icon={<Mail className="w-5 h-5 text-violet-400" />}
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
              
              <div className="pt-4 border-t border-white/5">
                {isResearchOrTrial() ? (
                  <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500/20 rounded-lg">
                        <Lock className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Connect Your Mailbox</p>
                        <p className="text-xs text-gray-400">Upgrade to Live Outreach to connect email accounts and start sending</p>
                      </div>
                    </div>
                    <Link href="/pricing">
                      <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Upgrade
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/api/nylas/auth/redirect">
                    <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect New Email
                    </Button>
                  </Link>
                )}
              </div>

              {/* AI Configuration */}
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-sm font-medium text-gray-400 mb-3">AI Configuration</h4>
                <div className="space-y-3">
                  {isResearchOrTrial() ? (
                    <div className="flex items-center justify-between p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-lg">
                          <Lock className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">AI Auto-Response</p>
                          <p className="text-xs text-gray-400">Upgrade to Live Outreach to enable AI-powered automatic responses to leads</p>
                        </div>
                      </div>
                      <Link href="/pricing">
                        <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-fuchsia-500/20 rounded-lg">
                          <Zap className="w-4 h-4 text-fuchsia-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Auto-Response</p>
                          <p className="text-xs text-gray-500">AI responds to lead inquiries</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Enabled
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Enrichment API Keys */}
          <SettingsSection
            title="Enrichment API Keys"
            description="Configure API keys for lead enrichment providers"
            icon={<Key className="h-5 w-5 text-amber-400" />}
          >
            <div className="space-y-6">
              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-violet-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-violet-300">About API Keys</h3>
                    <p className="text-sm text-violet-200/70 mt-1">
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
                <div key={provider.key} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">{provider.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          provider.category === 'Lead Enrichment' 
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'bg-fuchsia-500/20 text-fuchsia-300'
                        }`}>
                          {provider.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{provider.description}</p>
                    </div>
                    {apiKeyStatus[provider.key] && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        apiKeyStatus[provider.key] === 'saved' 
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : apiKeyStatus[provider.key] === 'saving'
                          ? 'bg-violet-500/20 text-violet-400'
                          : 'bg-amber-500/20 text-amber-400'
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
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <Button
                      onClick={() => saveApiKey(provider.key, apiKeys[provider.key])}
                      disabled={!apiKeys[provider.key].trim() || apiKeyStatus[provider.key] === 'saving'}
                      className="bg-violet-600 hover:bg-violet-500 text-white"
                    >
                      {apiKeyStatus[provider.key] === 'saving' ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-sm font-medium text-white mb-2">Provider Documentation</h3>
                <div className="space-y-2 text-sm">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Lead Enrichment Providers</h4>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">Apollo:</strong></span>
                        <a href="https://apolloapi.com/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">PeopleDataLabs:</strong></span>
                        <a href="https://www.peopledatalabs.com/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">Clearbit:</strong></span>
                        <a href="https://clearbit.com/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">Serper:</strong></span>
                        <a href="https://serper.dev/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">Hunter:</strong></span>
                        <a href="https://hunter.io/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Company Profiling Providers</h4>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">ValueSERP:</strong></span>
                        <a href="https://valueserp.com/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>• <strong className="text-gray-300">BuiltWith:</strong></span>
                        <a href="https://builtwith.com/" target="_blank" className="inline-flex items-center text-violet-400 hover:text-violet-300">
                          Get API key <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
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
            icon={<Globe className="h-5 w-5 text-emerald-400" />}
          >
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="block text-sm font-medium text-white mb-2">
                  Daily Email Limit
                </label>
                <input
                  type="number"
                  value={settings.maxDailyEmails}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxDailyEmails: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  min="1"
                  max="500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum emails to send per day</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <label className="block text-sm font-medium text-white mb-2">
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
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
            icon={<Bell className="h-5 w-5 text-amber-400" />}
          >
            <div className="space-y-4">
              <SettingsCard
                icon={<Bell className="w-5 h-5 text-amber-400" />}
                title="Email Notifications"
                description="Receive email alerts for important events"
                status={settings.emailNotifications ? 'active' : 'inactive'}
                action={
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-violet-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                }
              />
              
              <SettingsCard
                icon={<Clock className="w-5 h-5 text-cyan-400" />}
                title="Daily Summary"
                description="Receive daily performance summaries"
                status={settings.dailySummary ? 'active' : 'inactive'}
                action={
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, dailySummary: !prev.dailySummary }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.dailySummary ? 'bg-violet-600' : 'bg-gray-600'
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

          {/* Account Information */}
          <SettingsSection
            title="Account Information"
            description="View and manage your account details"
            icon={<User className="h-5 w-5 text-gray-400" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Account Created</label>
                <input
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Danger Zone</h3>
                  <p className="text-sm text-gray-400">Irreversible and destructive actions</p>
                </div>
                <Button className="bg-red-600 hover:bg-red-500 text-white">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}