"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bot,
  Mail,
  Phone,
  Building2,
  MapPin,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Star,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title?: string;
  company_domain?: string;
  phone?: string;
  linkedin_url?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  enrichment_status?: 'pending' | 'enriching' | 'completed' | 'failed';
  enriched_data?: any;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
  lead_score?: number;
  tags?: string[];
}

interface LeadStats {
  total: number;
  enriched: number;
  pending: number;
  high_score: number;
  contacted_this_week: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'enriched' | 'high_score'>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  const fetchLeads = async () => {
    try {
      // Mock leads data - replace with actual Supabase query
      const mockLeads: Lead[] = [
        {
          id: '1',
          first_name: 'Alex',
          last_name: 'Carter',
          email: 'alex@acme.com',
          company: 'Acme Inc',
          title: 'VP of Sales',
          company_domain: 'acme.com',
          phone: '+1-555-0123',
          linkedin_url: 'https://linkedin.com/in/alexcarter',
          location: 'San Francisco, CA',
          industry: 'Technology',
          company_size: '51-200',
          enrichment_status: 'completed',
          enriched_data: {
            confidence_score: 0.95,
            primary_source: 'apollo',
            intent_score: 92
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          lead_score: 92,
          tags: ['hot', 'demo-requested']
        },
        {
          id: '2',
          first_name: 'Jamie',
          last_name: 'Lee',
          email: 'jamie@brightlabs.io',
          company: 'BrightLabs',
          title: 'CTO',
          company_domain: 'brightlabs.io',
          location: 'New York, NY',
          industry: 'Software',
          company_size: '11-50',
          enrichment_status: 'completed',
          enriched_data: {
            confidence_score: 0.87,
            primary_source: 'serper',
            intent_score: 78
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          lead_score: 78,
          tags: ['technical', 'integration']
        },
        {
          id: '3',
          first_name: 'Sarah',
          last_name: 'Wilson',
          email: 'sarah@cloudtech.com',
          company: 'CloudTech Solutions',
          title: 'Marketing Director',
          company_domain: 'cloudtech.com',
          phone: '+1-555-0456',
          location: 'Denver, CO',
          industry: 'Cloud Services',
          company_size: '201-500',
          enrichment_status: 'enriching',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          lead_score: 85,
          tags: ['enterprise', 'follow-up']
        },
        {
          id: '4',
          first_name: 'Chris',
          last_name: 'Hall',
          email: 'chris@novaworks.co',
          company: 'NovaWorks',
          title: 'CEO',
          company_domain: 'novaworks.co',
          location: 'Austin, TX',
          industry: 'Startup',
          company_size: '1-10',
          enrichment_status: 'pending',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          lead_score: 45,
          tags: ['startup', 'nurture']
        },
        {
          id: '5',
          first_name: 'Maria',
          last_name: 'Rodriguez',
          email: 'maria@techflow.com',
          company: 'TechFlow',
          title: 'Head of Operations',
          company_domain: 'techflow.com',
          phone: '+1-555-0789',
          linkedin_url: 'https://linkedin.com/in/mariarodriguez',
          location: 'Chicago, IL',
          industry: 'Technology',
          company_size: '101-500',
          enrichment_status: 'completed',
          enriched_data: {
            confidence_score: 0.91,
            primary_source: 'apollo',
            intent_score: 67
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          last_contacted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          lead_score: 67,
          tags: ['qualified', 'operations']
        }
      ];

      setLeads(mockLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual calculations
      setStats({
        total: 47,
        enriched: 32,
        pending: 8,
        high_score: 12,
        contacted_this_week: 18
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEnrich = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Update status to enriching
    setLeads(prev => prev.map(l => 
      l.id === leadId 
        ? { ...l, enrichment_status: 'enriching' as const }
        : l
    ));

    try {
      const response = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          email: lead.email,
          name: `${lead.first_name} ${lead.last_name}`,
          company: lead.company,
          company_domain: lead.company_domain,
        }),
      });

      if (response.ok) {
        // Refresh leads data
        await fetchLeads();
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
      // Revert status on error
      setLeads(prev => prev.map(l => 
        l.id === leadId 
          ? { ...l, enrichment_status: 'pending' as const }
          : l
      ));
    }
  };

  const getEnrichmentStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Enriched</Badge>;
      case 'enriching':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Enriching</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getLeadScoreBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Hot ({score})</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warm ({score})</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cold ({score})</Badge>;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      statusFilter === 'all' ||
      (statusFilter === 'pending' && lead.enrichment_status === 'pending') ||
      (statusFilter === 'enriched' && lead.enrichment_status === 'completed') ||
      (statusFilter === 'high_score' && (lead.lead_score || 0) >= 80);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-7 w-7 mr-3 text-blue-600" />
                Leads
              </h1>
              <p className="text-gray-600 mt-1">Manage and enrich your lead database</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.enriched}</div>
                <div className="text-sm text-gray-600">Enriched</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.high_score}</div>
                <div className="text-sm text-gray-600">High Score</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.contacted_this_week}</div>
                <div className="text-sm text-gray-600">Contacted This Week</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
              <Button
                variant={statusFilter === 'enriched' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('enriched')}
                className={statusFilter === 'enriched' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Enriched
              </Button>
              <Button
                variant={statusFilter === 'high_score' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('high_score')}
                className={statusFilter === 'high_score' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                High Score
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Leads ({filteredLeads.length})</span>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                  <Bot className="w-4 h-4 mr-1" />
                  Bulk Enrich
                </Button>
                <Button variant="secondary" size="sm" className="bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {lead.first_name[0]}{lead.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {lead.first_name} {lead.last_name}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {lead.email}
                            </div>
                            {lead.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                            {lead.company}
                          </div>
                          {lead.title && (
                            <div className="text-sm text-gray-500">{lead.title}</div>
                          )}
                          {lead.location && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {lead.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getEnrichmentStatusBadge(lead.enrichment_status)}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {lead.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} className="bg-gray-50 text-gray-700 border border-gray-200 text-xs hover:bg-gray-100">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLeadScoreBadge(lead.lead_score)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.last_contacted 
                          ? new Date(lead.last_contacted).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link href={`/leads/${lead.id}`}>
                            <Button size="sm" variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {lead.enrichment_status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleEnrich(lead.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Bot className="w-4 h-4 mr-1" />
                              Enrich
                            </Button>
                          )}
                          {lead.enrichment_status === 'enriching' && (
                            <Button size="sm" disabled>
                              <Clock className="w-4 h-4 mr-1 animate-spin" />
                              Enriching
                            </Button>
                          )}
                          {lead.linkedin_url && (
                            <Button size="sm" variant="outline">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
