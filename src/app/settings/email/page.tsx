'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import DisconnectInboxButton from '@/components/DisconnectInboxButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Lock,
  Sparkles,
  Globe,
  Clock,
  Bell
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function EmailSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { canConnectInbox, isResearchOrTrial } = useSubscription();
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

      const { data: inboxes } = await supabase
        .from('connected_inboxes')
        .select('*')
        .eq('user_id', user.id);

      setInboxes(inboxes || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-8">
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
          {[...Array(3)].map((_, i) => (
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
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Email Settings</h1>
                <p className="mt-1 text-gray-400">Manage connected inboxes, AI responses, and outreach configuration</p>
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

        {/* Connected Inboxes */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-xl">
                <Mail className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Connected Inboxes</h3>
                <p className="text-sm text-gray-400">Email accounts connected for sending and receiving</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {inboxes.length === 0 && (
              <div className="text-center py-8">
                <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No email accounts connected yet</p>
              </div>
            )}
            {inboxes.map((inbox) => {
              const isActive = inbox.access_token && inbox.is_active;
              return (
                <div key={inbox.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-violet-500/30 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{inbox.email_address}</h3>
                      <p className="text-sm text-gray-400">{inbox.provider} &bull; Connected {new Date(inbox.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                      {isActive && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <DisconnectInboxButton 
                      inboxId={inbox.id} 
                      emailAddress={inbox.email_address}
                    />
                  </div>
                </div>
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
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-500/20 rounded-xl">
                <Zap className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">AI Configuration</h3>
                <p className="text-sm text-gray-400">Configure AI auto-response behavior</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
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
                    <p className="text-xs text-gray-500">AI responds to lead inquiries automatically</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Enabled
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Outreach Settings */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Globe className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Outreach Settings</h3>
                <p className="text-sm text-gray-400">Configure email sending limits and business hours</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <label className="block text-sm font-medium text-white mb-2">Daily Email Limit</label>
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
              <label className="block text-sm font-medium text-white mb-2">Business Hours</label>
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
        </div>

        {/* Notifications */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Bell className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Email Notifications</h3>
                <p className="text-sm text-gray-400">Manage notification preferences</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-400">Receive email alerts for important events</p>
                </div>
              </div>
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
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Daily Summary</h3>
                  <p className="text-sm text-gray-400">Receive daily performance summaries</p>
                </div>
              </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
