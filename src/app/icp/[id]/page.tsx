"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Target,
  Building2,
  Users,
  MapPin,
  Briefcase,
  TrendingUp,
  Edit,
  Trash2,
  Sparkles,
  BarChart3,
  CheckCircle,
  Cpu,
  Globe,
  Layers,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';

interface ICPProfile {
  id: string;
  name: string;
  description: string;
  job_titles: string[];
  seniority_levels: string[];
  departments: string[];
  industries: string[];
  company_sizes: string[];
  technologies: string[];
  locations: string[];
  keywords: string[];
  funding_types: string[];
  employee_count_min?: number;
  employee_count_max?: number;
  revenue_min?: number;
  revenue_max?: number;
  usage_count: number;
  leads_scored: number;
  status: string;
  created_at: string;
  last_used_at?: string;
  scoring_weights?: {
    industry: number;
    company_size: number;
    job_title: number;
    geography: number;
    technology: number;
    revenue: number;
  };
}

export default function ICPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ICPProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('icp_profiles')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching ICP profile:', error);
        router.push('/icp');
        return;
      }

      setProfile(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ICP profile? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/icp/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/icp');
      } else {
        alert('Failed to delete ICP profile');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setDeleting(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/5 rounded"></div>
                    <div className="h-4 bg-white/5 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) return null;

  const TagList = ({ items, color = 'violet' }: { items: string[]; color?: string }) => {
    if (!items || items.length === 0) return <span className="text-sm text-gray-500">Not specified</span>;
    const colorMap: Record<string, string> = {
      violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
      blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} className={colorMap[color] || colorMap.violet}>{item}</Badge>
        ))}
      </div>
    );
  };

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div className="p-2 bg-violet-500/20 rounded-xl">{icon}</div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                  <Badge className={statusColors[profile.status] || statusColors.draft}>
                    {profile.status}
                  </Badge>
                </div>
                {profile.description && (
                  <p className="mt-1 text-gray-400">{profile.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/icp">
                <Button className="bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All ICPs
                </Button>
              </Link>
              <Link href={`/icp/${params.id}/angles`}>
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Angles
                </Button>
              </Link>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads Scored', value: profile.leads_scored || 0, icon: <Users className="w-4 h-4 text-violet-400" /> },
            { label: 'Times Used', value: profile.usage_count || 0, icon: <BarChart3 className="w-4 h-4 text-cyan-400" /> },
            { label: 'Created', value: new Date(profile.created_at).toLocaleDateString(), icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
            { label: 'Last Used', value: profile.last_used_at ? new Date(profile.last_used_at).toLocaleDateString() : 'Never', icon: <TrendingUp className="w-4 h-4 text-amber-400" /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
              <p className="text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job & Contact Filters */}
          <Section icon={<Briefcase className="h-5 w-5 text-violet-400" />} title="Job & Contact Filters">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Job Titles</p>
                <TagList items={profile.job_titles} color="violet" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Seniority Levels</p>
                <TagList items={profile.seniority_levels} color="fuchsia" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Departments</p>
                <TagList items={profile.departments} color="cyan" />
              </div>
            </div>
          </Section>

          {/* Industry & Company */}
          <Section icon={<Building2 className="h-5 w-5 text-cyan-400" />} title="Industry & Company">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Industries</p>
                <TagList items={profile.industries} color="cyan" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Company Sizes</p>
                <TagList items={profile.company_sizes} color="emerald" />
              </div>
              {(profile.employee_count_min || profile.employee_count_max) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Employee Count Range</p>
                  <p className="text-sm text-white">
                    {profile.employee_count_min || 0} — {profile.employee_count_max || '∞'}
                  </p>
                </div>
              )}
              {(profile.revenue_min || profile.revenue_max) && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Revenue Range</p>
                  <p className="text-sm text-white">
                    ${(profile.revenue_min || 0).toLocaleString()} — ${profile.revenue_max ? profile.revenue_max.toLocaleString() : '∞'}
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* Location */}
          <Section icon={<MapPin className="h-5 w-5 text-emerald-400" />} title="Location Filters">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Locations</p>
                <TagList items={profile.locations} color="emerald" />
              </div>
            </div>
          </Section>

          {/* Technology & Keywords */}
          <Section icon={<Layers className="h-5 w-5 text-amber-400" />} title="Technology & Keywords">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Technologies</p>
                <TagList items={profile.technologies} color="amber" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Keywords</p>
                <TagList items={profile.keywords} color="blue" />
              </div>
              {profile.funding_types && profile.funding_types.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Funding Stages</p>
                  <TagList items={profile.funding_types} color="fuchsia" />
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Scoring Weights */}
        {profile.scoring_weights && (
          <Section icon={<Zap className="h-5 w-5 text-fuchsia-400" />} title="Scoring Weights">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(profile.scoring_weights).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full"
                      style={{ width: `${(value / 10) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</p>
                  <p className="text-sm font-semibold text-white">{value}/10</p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </DashboardLayout>
  );
}
