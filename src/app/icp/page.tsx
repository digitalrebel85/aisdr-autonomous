"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Building,
  Users,
  MapPin,
  Briefcase,
  TrendingUp,
  Play,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

// Funding stage options for Apollo API
const FUNDING_STAGE_OPTIONS = [
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B', 
  'Series C',
  'Series D',
  'Series E+',
  'IPO',
  'Acquired',
  'Private Equity',
  'Bootstrapped',
  'Government Funded'
];

interface ICPProfile {
  id: string;
  name: string;
  description: string;
  campaign_name?: string;
  
  // Job & Contact Filters
  job_titles: string[];
  exclude_job_titles: string[];
  seniority_levels: string[];
  departments: string[];
  lead_names: string[];
  
  // Company Filters
  industries: string[];
  industry_keywords: string[];
  exclude_industry_keywords: string[];
  company_sizes: string[];
  company_domain_names: string[];
  company_domain_exact_match: boolean;
  exclude_company_domains: string[];
  exclude_domains_exact_match: boolean;
  technologies: string[];
  currently_hiring_for: string[];
  
  // Location Filters
  contact_locations: string[];
  exclude_contact_locations: string[];
  company_hq_locations: string[];
  
  // Company Metrics
  employee_count_min?: number;
  employee_count_max?: number;
  revenue_min?: number;
  revenue_max?: number;
  yearly_headcount_growth_min?: number;
  yearly_headcount_growth_max?: number;
  
  // Funding Filters
  funding_types: string[];
  funding_amount_min?: number;
  funding_amount_max?: number;
  
  // Advanced Filters
  intent_signals: string[];
  verified_emails_only: boolean;
  keywords: string[];
  
  // System Fields
  usage_count: number;
  leads_scored: number;
  status: 'active' | 'draft' | 'archived';
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

const INDUSTRY_OPTIONS = [
  'Software', 'SaaS', 'Technology', 'Cloud Computing', 'Cybersecurity',
  'Financial Services', 'Banking', 'Insurance', 'Healthcare', 'Biotech',
  'Manufacturing', 'Automotive', 'Retail', 'E-commerce', 'Real Estate',
  'Education', 'Media', 'Marketing', 'Consulting', 'Professional Services'
];

const COMPANY_SIZE_OPTIONS = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
];

const SENIORITY_OPTIONS = [
  'C-Level', 'VP', 'Director', 'Head', 'Manager', 'Senior', 'Lead', 'Specialist'
];

const DEPARTMENT_OPTIONS = [
  'Sales', 'Marketing', 'Engineering', 'Product', 'Operations', 'Finance',
  'HR', 'Customer Success', 'Business Development', 'IT', 'Legal'
];

const FUNDING_TYPE_OPTIONS = [
  'pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'series-d', 
  'growth', 'ipo', 'public', 'private-equity', 'bootstrapped'
];

const INTENT_SIGNAL_OPTIONS = [
  'hiring', 'funding', 'expansion', 'technology adoption', 'digital transformation',
  'sales enablement', 'revenue growth', 'cost reduction', 'compliance',
  'security', 'automation', 'integration', 'migration', 'optimization'
];

const LOCATION_OPTIONS = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia',
  'New York', 'California', 'Texas', 'London', 'Toronto', 'Berlin', 'Paris',
  'Remote', 'San Francisco', 'New York City', 'Los Angeles', 'Chicago', 'Boston'
];

const TECHNOLOGY_OPTIONS = [
  'Salesforce', 'HubSpot', 'AWS', 'Microsoft Azure', 'Google Cloud',
  'Slack', 'Zoom', 'Shopify', 'WordPress', 'React', 'Node.js',
  'Python', 'Java', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'
];

export default function ICPPage() {
  const [icpProfiles, setIcpProfiles] = useState<ICPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ICPProfile | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_name: '',
    
    // Job & Contact Filters
    job_titles: [] as string[],
    exclude_job_titles: [] as string[],
    seniority_levels: [] as string[],
    departments: [] as string[],
    lead_names: [] as string[],
    
    // Company Filters
    industries: [] as string[],
    industry_keywords: [] as string[],
    exclude_industry_keywords: [] as string[],
    company_sizes: [] as string[],
    company_domain_names: [] as string[],
    company_domain_exact_match: false,
    exclude_company_domains: [] as string[],
    exclude_domains_exact_match: false,
    technologies: [] as string[],
    currently_hiring_for: [] as string[],
    
    // Location Filters
    contact_locations: [] as string[],
    exclude_contact_locations: [] as string[],
    company_hq_locations: [] as string[],
    
    // Company Metrics
    employee_count_min: '',
    employee_count_max: '',
    revenue_min: '',
    revenue_max: '',
    yearly_headcount_growth_min: '',
    yearly_headcount_growth_max: '',
    
    // Funding Filters
    funding_stages: [] as string[],
    funding_types: [] as string[],
    funding_amount_min: '',
    funding_amount_max: '',
    
    // Advanced Filters
    intent_signals: [] as string[],
    verified_emails_only: false,
    keywords: [] as string[]
  });

  const supabase = createClient();

  useEffect(() => {
    fetchICPProfiles();
  }, []);

  const fetchICPProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/icp');
      if (response.ok) {
        const data = await response.json();
        setIcpProfiles(data.profiles || []);
      }
    } catch (error) {
      console.error('Error fetching ICP profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        employee_count_min: formData.employee_count_min ? parseInt(formData.employee_count_min) : null,
        employee_count_max: formData.employee_count_max ? parseInt(formData.employee_count_max) : null,
        revenue_min: formData.revenue_min ? parseInt(formData.revenue_min) : null,
        revenue_max: formData.revenue_max ? parseInt(formData.revenue_max) : null,
      };

      const url = editingProfile ? `/api/icp/${editingProfile.id}` : '/api/icp';
      const method = editingProfile ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchICPProfiles();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving ICP profile:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      industries: [],
      company_sizes: [],
      locations: [],
      job_titles: [],
      seniority_levels: [],
      departments: [],
      technologies: [],
      funding_stages: [],
      keywords: [],
      employee_count_min: '',
      employee_count_max: '',
      revenue_min: '',
      revenue_max: ''
    });
    setShowCreateForm(false);
    setEditingProfile(null);
  };

  const handleEdit = (profile: ICPProfile) => {
    setFormData({
      name: profile.name,
      description: profile.description,
      industries: profile.industries,
      company_sizes: profile.company_sizes,
      locations: profile.locations,
      job_titles: profile.job_titles,
      seniority_levels: profile.seniority_levels,
      departments: profile.departments,
      technologies: profile.technologies,
      funding_stages: profile.funding_stages,
      keywords: profile.keywords,
      employee_count_min: profile.employee_count_min?.toString() || '',
      employee_count_max: profile.employee_count_max?.toString() || '',
      revenue_min: profile.revenue_min?.toString() || '',
      revenue_max: profile.revenue_max?.toString() || ''
    });
    setEditingProfile(profile);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ICP profile?')) return;
    
    try {
      const response = await fetch(`/api/icp/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchICPProfiles();
      }
    } catch (error) {
      console.error('Error deleting ICP profile:', error);
    }
  };

  const handleScoreLeads = async (profile: ICPProfile) => {
    try {
      setLoading(true);
      const response = await fetch('/api/icp/score-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icp_profile_id: profile.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Scoring complete! ${result.total_scored} leads scored.\n\nScore Distribution:\n- High (80+): ${result.score_distribution.high}\n- Medium (50-79): ${result.score_distribution.medium}\n- Low (<50): ${result.score_distribution.low}\n\nAverage Score: ${result.average_score}`);
        await fetchICPProfiles();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error scoring leads:', error);
      alert('Failed to score leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (field: keyof typeof formData, value: string) => {
    if (value && !formData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field] as string[], value]
      }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ideal Customer Profiles</h1>
                <p className="text-gray-400 mt-1">Define your ideal customer criteria to score and prioritize existing leads</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create ICP
              </Button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white/[0.03] rounded-2xl border border-white/10 mb-6 overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">{editingProfile ? 'Edit' : 'Create'} ICP Profile</h3>
              <p className="text-sm text-gray-400 mt-1">
                Define your ideal customer profile to score and qualify existing leads (1-100 score)
              </p>
            </div>
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 p-1 rounded-xl">
                    <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white text-gray-400 rounded-lg">Basic Info</TabsTrigger>
                    <TabsTrigger value="company" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white text-gray-400 rounded-lg">Company</TabsTrigger>
                    <TabsTrigger value="contacts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white text-gray-400 rounded-lg">Contacts</TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white text-gray-400 rounded-lg">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-300">Profile Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., SaaS Sales Directors"
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-gray-300">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of this ICP"
                          rows={3}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Industries */}
                      <div>
                        <Label className="text-gray-300">Industries</Label>
                        <Select onValueChange={(value) => addToArray('industries', value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Add industry" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            {INDUSTRY_OPTIONS.map(industry => (
                              <SelectItem key={industry} value={industry} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.industries.map(industry => (
                            <Badge key={industry} className="cursor-pointer bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30" 
                                   onClick={() => removeFromArray('industries', industry)}>
                              {industry} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Company Sizes */}
                      <div>
                        <Label className="text-gray-300">Company Sizes</Label>
                        <Select onValueChange={(value) => addToArray('company_sizes', value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Add company size" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            {COMPANY_SIZE_OPTIONS.map(size => (
                              <SelectItem key={size} value={size} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">{size} employees</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.company_sizes.map(size => (
                            <Badge key={size} className="cursor-pointer bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30"
                                   onClick={() => removeFromArray('company_sizes', size)}>
                              {size} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Employee Count Range */}
                      <div>
                        <Label className="text-gray-300">Employee Count Range</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={formData.employee_count_min}
                            onChange={(e) => setFormData(prev => ({ ...prev, employee_count_min: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={formData.employee_count_max}
                            onChange={(e) => setFormData(prev => ({ ...prev, employee_count_max: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>

                      {/* Revenue Range */}
                      <div>
                        <Label className="text-gray-300">Annual Revenue Range</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min ($)"
                            value={formData.revenue_min}
                            onChange={(e) => setFormData(prev => ({ ...prev, revenue_min: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                          <Input
                            type="number"
                            placeholder="Max ($)"
                            value={formData.revenue_max}
                            onChange={(e) => setFormData(prev => ({ ...prev, revenue_max: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Titles */}
                      <div>
                        <Label className="text-gray-300">Job Titles</Label>
                        <Input
                          placeholder="Add job title and press Enter"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('job_titles', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.job_titles.map(title => (
                            <Badge key={title} className="cursor-pointer bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/30"
                                   onClick={() => removeFromArray('job_titles', title)}>
                              {title} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Seniority Levels */}
                      <div>
                        <Label className="text-gray-300">Seniority Levels</Label>
                        <Select onValueChange={(value) => addToArray('seniority_levels', value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Add seniority level" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            {SENIORITY_OPTIONS.map(level => (
                              <SelectItem key={level} value={level} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.seniority_levels.map(level => (
                            <Badge key={level} className="cursor-pointer bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30"
                                   onClick={() => removeFromArray('seniority_levels', level)}>
                              {level} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Departments */}
                      <div>
                        <Label className="text-gray-300">Departments</Label>
                        <Select onValueChange={(value) => addToArray('departments', value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Add department" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            {DEPARTMENT_OPTIONS.map(dept => (
                              <SelectItem key={dept} value={dept} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.departments.map(dept => (
                            <Badge key={dept} className="cursor-pointer bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30"
                                   onClick={() => removeFromArray('departments', dept)}>
                              {dept} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Technologies */}
                      <div>
                        <Label className="text-gray-300">Technologies</Label>
                        <Input
                          placeholder="Add technology and press Enter"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('technologies', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.technologies.map(tech => (
                            <Badge key={tech} className="cursor-pointer bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                                   onClick={() => removeFromArray('technologies', tech)}>
                              {tech} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Funding Stages */}
                      <div>
                        <Label className="text-gray-300">Funding Stages</Label>
                        <Select onValueChange={(value) => addToArray('funding_stages', value)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Add funding stage" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a24] border-white/10">
                            {FUNDING_STAGE_OPTIONS.map(stage => (
                              <SelectItem key={stage} value={stage} className="text-gray-300 focus:bg-violet-500/20 focus:text-white">{stage}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.funding_stages.map(stage => (
                            <Badge key={stage} className="cursor-pointer bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30"
                                   onClick={() => removeFromArray('funding_stages', stage)}>
                              {stage} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div>
                        <Label className="text-gray-300">Keywords</Label>
                        <Input
                          placeholder="Add keyword and press Enter"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('keywords', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.keywords.map(keyword => (
                            <Badge key={keyword} className="cursor-pointer bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                                   onClick={() => removeFromArray('keywords', keyword)}>
                              {keyword} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Locations */}
                      <div>
                        <Label className="text-gray-300">Locations</Label>
                        <Input
                          placeholder="Add location and press Enter"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('locations', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.locations.map(location => (
                            <Badge key={location} className="cursor-pointer bg-teal-500/20 text-teal-300 border-teal-500/30 hover:bg-teal-500/30"
                                   onClick={() => removeFromArray('locations', location)}>
                              {location} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                  <Button type="button" onClick={resetForm} className="bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                    {editingProfile ? 'Update' : 'Create'} Profile
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ICP Profiles List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {icpProfiles.map((profile) => (
            <div key={profile.id} className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{profile.description}</p>
                </div>
                <Badge className={profile.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                  {profile.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {/* Key Criteria */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <Building className="w-4 h-4 mr-1 text-violet-400" />
                      Industries
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.industries.slice(0, 2).map(industry => (
                        <Badge key={industry} className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                          {industry}
                        </Badge>
                      ))}
                      {profile.industries.length > 2 && (
                        <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                          +{profile.industries.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <Users className="w-4 h-4 mr-1 text-cyan-400" />
                      Company Size
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.company_sizes.slice(0, 2).map(size => (
                        <Badge key={size} className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          {size}
                        </Badge>
                      ))}
                      {profile.company_sizes.length > 2 && (
                        <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                          +{profile.company_sizes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <Briefcase className="w-4 h-4 mr-1 text-fuchsia-400" />
                      Job Titles
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.job_titles.slice(0, 2).map(title => (
                        <Badge key={title} className="text-xs bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                          {title}
                        </Badge>
                      ))}
                      {profile.job_titles.length > 2 && (
                        <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                          +{profile.job_titles.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
                      Performance
                    </div>
                    <div className="text-sm">
                      <div className="text-white">{profile.leads_scored || 0} leads scored</div>
                      <div className="text-gray-500">{profile.usage_count} scoring runs</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-violet-500/20 text-violet-400 border-violet-500/30 hover:bg-violet-500/30"
                      onClick={() => handleEdit(profile)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                      onClick={() => handleScoreLeads(profile)}
                      disabled={loading}
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Score Leads
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                    onClick={() => handleDelete(profile.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {icpProfiles.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
              <Target className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No ICP Profiles Yet</h3>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              Create your first Ideal Customer Profile to score and prioritize your existing leads
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First ICP
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
