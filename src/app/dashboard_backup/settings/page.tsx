'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Key, Calendar, Mail, Bell, Shield, ExternalLink, Save, Plus, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  title?: string;
  timezone?: string;
  signature?: string;
}

interface APIKey {
  id: number;
  provider: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
}

interface BookingLink {
  id: number;
  name: string;
  url: string;
  duration: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    company: '',
    title: '',
    timezone: 'America/New_York',
    signature: ''
  });
  
  const [newApiKey, setNewApiKey] = useState({
    provider: '',
    api_key: ''
  });
  
  const [newBookingLink, setNewBookingLink] = useState({
    name: '',
    url: '',
    duration: 30,
    description: ''
  });

  // Settings states
  const [settings, setSettings] = useState({
    auto_reply: false,
    daily_limit: 50,
    business_hours_only: true,
    email_notifications: true,
    daily_summary: true
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          company: profileData.company || '',
          title: profileData.title || '',
          timezone: profileData.timezone || 'America/New_York',
          signature: profileData.signature || ''
        });
      }

      // Fetch API keys
      const { data: apiKeysData } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setApiKeys(apiKeysData || []);

      // Fetch booking links
      const { data: bookingLinksData } = await supabase
        .from('booking_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setBookingLinks(bookingLinksData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...profileForm,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const saveApiKey = async () => {
    if (!newApiKey.provider || !newApiKey.api_key) {
      setMessage({ type: 'error', text: 'Please fill in all API key fields' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          provider: newApiKey.provider,
          api_key: newApiKey.api_key,
          is_active: true
        });

      if (error) throw error;

      setNewApiKey({ provider: '', api_key: '' });
      fetchData();
      setMessage({ type: 'success', text: 'API key saved successfully!' });
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ type: 'error', text: 'Failed to save API key' });
    }
  };

  const deleteApiKey = async (id: number) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchData();
      setMessage({ type: 'success', text: 'API key deleted successfully!' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      setMessage({ type: 'error', text: 'Failed to delete API key' });
    }
  };

  const saveBookingLink = async () => {
    if (!newBookingLink.name || !newBookingLink.url) {
      setMessage({ type: 'error', text: 'Please fill in booking link name and URL' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('booking_links')
        .insert({
          user_id: user.id,
          name: newBookingLink.name,
          url: newBookingLink.url,
          duration: newBookingLink.duration,
          description: newBookingLink.description,
          is_active: true
        });

      if (error) throw error;

      setNewBookingLink({ name: '', url: '', duration: 30, description: '' });
      fetchData();
      setMessage({ type: 'success', text: 'Booking link saved successfully!' });
    } catch (error) {
      console.error('Error saving booking link:', error);
      setMessage({ type: 'error', text: 'Failed to save booking link' });
    }
  };

  const deleteBookingLink = async (id: number) => {
    try {
      const { error } = await supabase
        .from('booking_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchData();
      setMessage({ type: 'success', text: 'Booking link deleted successfully!' });
    } catch (error) {
      console.error('Error deleting booking link:', error);
      setMessage({ type: 'error', text: 'Failed to delete booking link' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your profile, integrations, and preferences</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="booking">Booking Links</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileForm.company}
                    onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                    placeholder="Enter your company"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    placeholder="Enter your job title"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="signature">Email Signature</Label>
                <Textarea
                  id="signature"
                  value={profileForm.signature}
                  onChange={(e) => setProfileForm({ ...profileForm, signature: e.target.value })}
                  placeholder="Enter your email signature"
                  rows={4}
                />
              </div>
              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for lead enrichment services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add New API Key */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Add New API Key</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        value={newApiKey.provider}
                        onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                        className="p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select Provider</option>
                        <option value="apollo">Apollo.io</option>
                        <option value="pdl">PeopleDataLabs</option>
                        <option value="clearbit">Clearbit</option>
                        <option value="hunter">Hunter.io</option>
                        <option value="serper">Serper API</option>
                      </select>
                      <Input
                        type="password"
                        value={newApiKey.api_key}
                        onChange={(e) => setNewApiKey({ ...newApiKey, api_key: e.target.value })}
                        placeholder="Enter API key"
                      />
                      <Button onClick={saveApiKey}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Key
                      </Button>
                    </div>
                  </div>

                  {/* Existing API Keys */}
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.provider}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            •••••••••{key.api_key.slice(-4)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Added {new Date(key.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteApiKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No API keys configured yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Booking Links Tab */}
        <TabsContent value="booking">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Booking Links
                </CardTitle>
                <CardDescription>
                  Manage your calendar booking links for lead conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add New Booking Link */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Add New Booking Link</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={newBookingLink.name}
                          onChange={(e) => setNewBookingLink({ ...newBookingLink, name: e.target.value })}
                          placeholder="Link name (e.g., 'Discovery Call')"
                        />
                        <Input
                          value={newBookingLink.url}
                          onChange={(e) => setNewBookingLink({ ...newBookingLink, url: e.target.value })}
                          placeholder="Booking URL (Calendly, etc.)"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          type="number"
                          value={newBookingLink.duration}
                          onChange={(e) => setNewBookingLink({ ...newBookingLink, duration: parseInt(e.target.value) })}
                          placeholder="Duration (minutes)"
                        />
                        <Input
                          value={newBookingLink.description}
                          onChange={(e) => setNewBookingLink({ ...newBookingLink, description: e.target.value })}
                          placeholder="Description (optional)"
                        />
                      </div>
                      <Button onClick={saveBookingLink}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Booking Link
                      </Button>
                    </div>
                  </div>

                  {/* Existing Booking Links */}
                  <div className="space-y-3">
                    {bookingLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{link.name}</h4>
                            <Badge variant="outline">{link.duration} min</Badge>
                            <Badge variant={link.is_active ? 'default' : 'secondary'}>
                              {link.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                              {link.url}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                          {link.description && (
                            <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBookingLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {bookingLinks.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No booking links configured yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Outreach Settings Tab */}
        <TabsContent value="outreach">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Outreach Settings
              </CardTitle>
              <CardDescription>
                Configure your automated outreach preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-Reply</h3>
                  <p className="text-sm text-gray-600">Automatically respond to incoming emails</p>
                </div>
                <Switch
                  checked={settings.auto_reply}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_reply: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Business Hours Only</h3>
                  <p className="text-sm text-gray-600">Only send emails during business hours</p>
                </div>
                <Switch
                  checked={settings.business_hours_only}
                  onCheckedChange={(checked) => setSettings({ ...settings, business_hours_only: checked })}
                />
              </div>

              <div>
                <Label htmlFor="daily_limit">Daily Email Limit</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  value={settings.daily_limit}
                  onChange={(e) => setSettings({ ...settings, daily_limit: parseInt(e.target.value) })}
                  className="w-32"
                />
                <p className="text-sm text-gray-600 mt-1">Maximum emails to send per day</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how you receive updates and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive email alerts for important events</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily Summary</h3>
                  <p className="text-sm text-gray-600">Receive daily performance summaries</p>
                </div>
                <Switch
                  checked={settings.daily_summary}
                  onCheckedChange={(checked) => setSettings({ ...settings, daily_summary: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
