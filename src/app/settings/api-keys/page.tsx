'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Key, 
  ArrowLeft,
  Shield,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function ApiKeysSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    apollo: '',
    pdl: '',
    serper: '',
    clearbit: '',
    hunter: '',
    valueserp: '',
    builtwith: '',
    icypeas: '',
    findymail: '',
    zoominfo: '',
    snov: '',
    lusha: '',
    rocketreach: ''
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, 'saved' | 'unsaved' | 'saving' | undefined>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

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
      console.error('Error fetching API keys:', error);
      setLoading(false);
    }
  };

  const saveApiKey = async (provider: string, apiKey: string) => {
    if (!user || !apiKey.trim()) return;
    const supabase = createClient();
    setApiKeyStatus(prev => ({ ...prev, [provider]: 'saving' }));

    try {
      await supabase
        .from('user_api_keys')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('provider', provider);

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

  const providers = [
    { key: 'apollo', name: 'Apollo.io', description: 'Lead discovery + contact data + company info', category: 'Lead Discovery', url: 'https://apolloapi.com/' },
    { key: 'zoominfo', name: 'ZoomInfo', description: 'Enterprise B2B contact and company database', category: 'Lead Discovery', url: 'https://www.zoominfo.com/' },
    { key: 'lusha', name: 'Lusha', description: 'B2B prospecting and contact data', category: 'Lead Discovery', url: 'https://www.lusha.com/' },
    { key: 'rocketreach', name: 'RocketReach', description: 'Professional contact search engine', category: 'Lead Discovery', url: 'https://rocketreach.co/' },
    { key: 'icypeas', name: 'Icypeas', description: 'Email finder and lead search', category: 'Lead Discovery', url: 'https://icypeas.com/' },
    { key: 'snov', name: 'Snov.io', description: 'Lead generation and email outreach platform', category: 'Lead Discovery', url: 'https://snov.io/' },
    { key: 'findymail', name: 'FindyMail', description: 'Email finder and verification', category: 'Email Verification', url: 'https://findymail.com/' },
    { key: 'pdl', name: 'PeopleDataLabs', description: 'Comprehensive professional profiles', category: 'Lead Enrichment', url: 'https://www.peopledatalabs.com/' },
    { key: 'clearbit', name: 'Clearbit', description: 'B2B contact and company data', category: 'Lead Enrichment', url: 'https://clearbit.com/' },
    { key: 'serper', name: 'Serper API', description: 'Google Search for public information', category: 'Lead Enrichment', url: 'https://serper.dev/' },
    { key: 'hunter', name: 'Hunter.io', description: 'Email discovery and verification', category: 'Lead Enrichment', url: 'https://hunter.io/' },
    { key: 'valueserp', name: 'ValueSERP', description: 'Company descriptions and search snippets', category: 'Company Profiling', url: 'https://valueserp.com/' },
    { key: 'builtwith', name: 'BuiltWith', description: 'Technology stack analysis', category: 'Company Profiling', url: 'https://builtwith.com/' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="h-16 bg-white/5 rounded-xl"></div>
            </div>
          ))}
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
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                <Key className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Enrichment API Keys</h1>
                <p className="mt-1 text-gray-400">Configure API keys for lead enrichment providers</p>
              </div>
            </div>
            <Link href="/settings">
              <Button className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                All Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-violet-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-violet-300">About API Keys</h3>
              <p className="text-sm text-violet-200/70 mt-1">
                Add API keys for any providers you use. The autopilot agent will automatically try all configured providers to discover and enrich leads.
              </p>
            </div>
          </div>
        </div>

        {/* API Key Cards */}
        <div className="space-y-4">
          {providers.map(provider => (
            <div key={provider.key} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-white">{provider.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      provider.category === 'Lead Discovery' 
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : provider.category === 'Lead Enrichment'
                        ? 'bg-violet-500/20 text-violet-300'
                        : provider.category === 'Email Verification'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-fuchsia-500/20 text-fuchsia-300'
                    }`}>
                      {provider.category}
                    </span>
                    {apiKeyStatus[provider.key] === 'saved' && (
                      <span className="flex items-center text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{provider.description}</p>
                </div>
                <a href={provider.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-violet-400 hover:text-violet-300">
                  Get key <ExternalLink className="w-3 h-3 ml-1" />
                </a>
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
                  disabled={!apiKeys[provider.key]?.trim() || apiKeyStatus[provider.key] === 'saving'}
                  className="bg-violet-600 hover:bg-violet-500 text-white"
                >
                  {apiKeyStatus[provider.key] === 'saving' ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
