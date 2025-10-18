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
  leads_discovered: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  last_used_at?: string;
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
    keywords: [] as string[],
    locations: [] as string[],
    
    // New Apollo API filters
    campaign_name: '',
    exclude_job_titles: [] as string[],
    company_domain_names: [] as string[],
    company_domain_exact_match: false,
    exclude_company_domains: [] as string[],
    exclude_domains_exact_match: false,
    contact_locations: [] as string[],
    exclude_contact_locations: [] as string[],
    intent_signals: [] as string[],
    industry_keywords: [] as string[],
    exclude_industry_keywords: [] as string[],
    verified_emails_only: false,
    lead_names: [] as string[],
    company_hq_locations: [] as string[],
    currently_hiring_for: [] as string[],
    yearly_headcount_growth_min: '',
    yearly_headcount_growth_max: '',
    funding_types: [] as string[],
    funding_amount_min: '',
    funding_amount_max: ''
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

  const handleDiscoverLeads = async (profile: ICPProfile) => {
    try {
      const response = await fetch('/api/apollo/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icp_profile_id: profile.id })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Discovery started! Session ID: ${result.session_id}`);
        await fetchICPProfiles();
      }
    } catch (error) {
      console.error('Error starting lead discovery:', error);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ideal Customer Profiles</h1>
              <p className="text-gray-600 mt-1">Define your target customers for Apollo lead discovery</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create ICP
              </Button>
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingProfile ? 'Edit' : 'Create'} ICP Profile</CardTitle>
              <CardDescription>
                Define your ideal customer profile for automated lead discovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Profile Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., SaaS Sales Directors"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of this ICP"
                          rows={3}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Industries */}
                      <div>
                        <Label>Industries</Label>
                        <Select onValueChange={(value) => addToArray('industries', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRY_OPTIONS.map(industry => (
                              <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.industries.map(industry => (
                            <Badge key={industry} variant="secondary" className="cursor-pointer" 
                                   onClick={() => removeFromArray('industries', industry)}>
                              {industry} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Company Sizes */}
                      <div>
                        <Label>Company Sizes</Label>
                        <Select onValueChange={(value) => addToArray('company_sizes', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPANY_SIZE_OPTIONS.map(size => (
                              <SelectItem key={size} value={size}>{size} employees</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.company_sizes.map(size => (
                            <Badge key={size} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('company_sizes', size)}>
                              {size} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Employee Count Range */}
                      <div>
                        <Label>Employee Count Range</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={formData.employee_count_min}
                            onChange={(e) => setFormData(prev => ({ ...prev, employee_count_min: e.target.value }))}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={formData.employee_count_max}
                            onChange={(e) => setFormData(prev => ({ ...prev, employee_count_max: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Revenue Range */}
                      <div>
                        <Label>Annual Revenue Range</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            placeholder="Min ($)"
                            value={formData.revenue_min}
                            onChange={(e) => setFormData(prev => ({ ...prev, revenue_min: e.target.value }))}
                          />
                          <Input
                            type="number"
                            placeholder="Max ($)"
                            value={formData.revenue_max}
                            onChange={(e) => setFormData(prev => ({ ...prev, revenue_max: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contacts" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Job Titles */}
                      <div>
                        <Label>Job Titles</Label>
                        <Input
                          placeholder="Add job title and press Enter"
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
                            <Badge key={title} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('job_titles', title)}>
                              {title} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Seniority Levels */}
                      <div>
                        <Label>Seniority Levels</Label>
                        <Select onValueChange={(value) => addToArray('seniority_levels', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add seniority level" />
                          </SelectTrigger>
                          <SelectContent>
                            {SENIORITY_OPTIONS.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.seniority_levels.map(level => (
                            <Badge key={level} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('seniority_levels', level)}>
                              {level} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Departments */}
                      <div>
                        <Label>Departments</Label>
                        <Select onValueChange={(value) => addToArray('departments', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add department" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENT_OPTIONS.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.departments.map(dept => (
                            <Badge key={dept} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('departments', dept)}>
                              {dept} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Technologies */}
                      <div>
                        <Label>Technologies</Label>
                        <Input
                          placeholder="Add technology and press Enter"
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
                            <Badge key={tech} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('technologies', tech)}>
                              {tech} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Funding Stages */}
                      <div>
                        <Label>Funding Stages</Label>
                        <Select onValueChange={(value) => addToArray('funding_stages', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add funding stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {FUNDING_STAGE_OPTIONS.map(stage => (
                              <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.funding_stages.map(stage => (
                            <Badge key={stage} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('funding_stages', stage)}>
                              {stage} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div>
                        <Label>Keywords</Label>
                        <Input
                          placeholder="Add keyword and press Enter"
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
                            <Badge key={keyword} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('keywords', keyword)}>
                              {keyword} ×
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Locations */}
                      <div>
                        <Label>Locations</Label>
                        <Input
                          placeholder="Add location and press Enter"
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
                            <Badge key={location} variant="secondary" className="cursor-pointer"
                                   onClick={() => removeFromArray('locations', location)}>
                              {location} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingProfile ? 'Update' : 'Create'} Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ICP Profiles List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {icpProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <CardDescription className="mt-1">{profile.description}</CardDescription>
                  </div>
                  <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                    {profile.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Key Criteria */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Building className="w-4 h-4 mr-1" />
                        Industries
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.industries.slice(0, 2).map(industry => (
                          <Badge key={industry} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                        {profile.industries.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.industries.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Users className="w-4 h-4 mr-1" />
                        Company Size
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.company_sizes.slice(0, 2).map(size => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                        {profile.company_sizes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.company_sizes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Briefcase className="w-4 h-4 mr-1" />
                        Job Titles
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {profile.job_titles.slice(0, 2).map(title => (
                          <Badge key={title} variant="outline" className="text-xs">
                            {title}
                          </Badge>
                        ))}
                        {profile.job_titles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.job_titles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Performance
                      </div>
                      <div className="text-sm">
                        <div>{profile.leads_discovered} leads found</div>
                        <div className="text-gray-500">{profile.usage_count} runs</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => handleEdit(profile)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                        onClick={() => handleDiscoverLeads(profile)}
                      >
                        <Search className="w-4 h-4 mr-1" />
                        Discover
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                      onClick={() => handleDelete(profile.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {icpProfiles.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ICP Profiles Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first Ideal Customer Profile to start discovering leads with Apollo
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First ICP
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
