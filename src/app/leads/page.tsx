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
  MoreHorizontal,
  X,
  Loader2,
  Check,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

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
  icp_score?: number;
  icp_profile_id?: string;
  icp_match_details?: any;
  icp_scored_at?: string;
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
  const [icpScoreFilter, setIcpScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Add Lead Modal State
  const [showAddLead, setShowAddLead] = useState(false);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [addLeadError, setAddLeadError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    linkedin_url: '',
    location: '',
    industry: '',
    company_size: ''
  });

  // CSV Upload Wizard State
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvStep, setCsvStep] = useState<1 | 2 | 3>(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadResult, setCsvUploadResult] = useState<{ success: number; failed: number; duplicates?: number } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (response.ok) {
        const data = await response.json();
        const transformedLeads: Lead[] = (data.leads || []).map((lead: any) => ({
          id: lead.id?.toString() || '',
          first_name: lead.first_name || lead.name?.split(' ')[0] || '',
          last_name: lead.last_name || lead.name?.split(' ').slice(1).join(' ') || '',
          email: lead.email || '',
          company: lead.company || '',
          title: lead.title || '',
          company_domain: lead.company_domain || '',
          phone: lead.phone || '',
          linkedin_url: lead.linkedin_url || '',
          location: lead.location || '',
          industry: lead.industry || '',
          company_size: lead.company_size || '',
          enrichment_status: lead.enrichment_status || 'pending',
          enriched_data: lead.enriched_data || null,
          icp_score: lead.icp_score,
          icp_profile_id: lead.icp_profile_id,
          icp_match_details: lead.icp_match_details,
          icp_scored_at: lead.icp_scored_at,
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: lead.updated_at || new Date().toISOString(),
          last_contacted: lead.last_contacted,
          lead_score: lead.lead_score,
          tags: lead.tags || []
        }));
        setLeads(transformedLeads);
      } else {
        console.error('Failed to fetch leads');
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    // Stats will be calculated from leads data after fetch
    // This is called after fetchLeads, so we calculate from state
  };

  // Calculate stats from leads data
  const calculateStats = (): LeadStats => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return {
      total: leads.length,
      enriched: leads.filter(l => l.enrichment_status === 'completed').length,
      pending: leads.filter(l => l.enrichment_status === 'pending').length,
      high_score: leads.filter(l => (l.lead_score || 0) >= 80 || (l.icp_score || 0) >= 80).length,
      contacted_this_week: leads.filter(l => l.last_contacted && new Date(l.last_contacted) > oneWeekAgo).length
    };
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

  // Add Lead Handler
  const handleAddLead = async () => {
    if (!newLead.first_name.trim() || !newLead.last_name.trim() || !newLead.email.trim() || !newLead.company.trim()) {
      setAddLeadError('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newLead.email)) {
      setAddLeadError('Please enter a valid email address');
      return;
    }

    setIsAddingLead(true);
    setAddLeadError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchLeads();
        await fetchStats();
        setShowAddLead(false);
        setNewLead({
          first_name: '',
          last_name: '',
          email: '',
          company: '',
          title: '',
          phone: '',
          linkedin_url: '',
          location: '',
          industry: '',
          company_size: ''
        });
      } else {
        setAddLeadError(data.error || 'Failed to add lead');
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      setAddLeadError('Network error - please try again');
    } finally {
      setIsAddingLead(false);
    }
  };

  // CSV File Handler
  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvUploadError('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    setCsvUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      // RFC 4180-compliant CSV parser: handles multi-line quoted fields
      const parseCSV = (csv: string): string[][] => {
        const rows: string[][] = [];
        let row: string[] = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < csv.length; i++) {
          const ch = csv[i];
          const next = csv[i + 1];
          if (inQuotes) {
            if (ch === '"' && next === '"') {
              cell += '"';
              i++; // skip escaped quote
            } else if (ch === '"') {
              inQuotes = false;
            } else {
              cell += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              row.push(cell.trim());
              cell = '';
            } else if (ch === '\r' && next === '\n') {
              row.push(cell.trim());
              cell = '';
              rows.push(row);
              row = [];
              i++; // skip \n
            } else if (ch === '\n') {
              row.push(cell.trim());
              cell = '';
              rows.push(row);
              row = [];
            } else {
              cell += ch;
            }
          }
        }
        // push last cell / row
        row.push(cell.trim());
        if (row.some(c => c !== '')) rows.push(row);
        return rows;
      };

      const allRows = parseCSV(text);
      if (allRows.length < 2) {
        setCsvUploadError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = allRows[0];
      // Filter out empty rows (fewer cells than headers or all cells empty)
      const data = allRows.slice(1).filter(r => r.length >= headers.length && r.some(c => c !== ''));

      setCsvHeaders(headers);
      setCsvData(data);
      
      // Auto-map only core lead fields — all other columns go to enriched_data automatically
      const autoMapping: Record<string, string> = {};
      const fieldMappings: Record<string, string[]> = {
        first_name: ['first_name', 'firstname', 'first name', 'given name', 'first', 'fname'],
        last_name: ['last_name', 'lastname', 'last name', 'surname', 'family name', 'last', 'lname'],
        name: ['name', 'full name', 'fullname', 'contact name'],
        email: ['email', 'email address', 'e-mail', 'email_address', 'work email'],
        company: ['company', 'company name', 'organization', 'org', 'company_name', 'cleaned company name', 'account name'],
        title: ['title', 'job title', 'position', 'role', 'job_title'],
        phone: ['phone', 'phone number', 'telephone', 'mobile', 'phone_number', 'cell', 'company phone number', 'direct phone'],
        linkedin_url: ['linkedin', 'linkedin_url', 'linkedin url', 'linkedin profile', 'linkedin_profile', 'linkedin link', 'person linkedin url'],
        location: ['location', 'address', 'full_address', 'company address'],
        industry: ['industry', 'sector', 'vertical'],
        company_size: ['company_size', 'company size', 'employees', 'size', 'employee_count', 'headcount', 'employee count', 'number of employees'],
        company_domain: ['company_domain', 'domain', 'website', 'company website', 'company website full', 'company website short', 'url'],
      };

      headers.forEach((header) => {
        const headerLower = header.toLowerCase().trim();
        for (const [field, aliases] of Object.entries(fieldMappings)) {
          if (aliases.includes(headerLower)) {
            autoMapping[field] = header;
            break;
          }
        }
      });

      setCsvMapping(autoMapping);
      setCsvStep(2);
    };

    reader.readAsText(file);
  };

  // CSV Upload Handler
  const handleCSVUpload = async () => {
    // Validate required fields - either name OR (first_name + last_name), plus email and company
    const hasName = csvMapping.name || (csvMapping.first_name && csvMapping.last_name);
    if (!csvMapping.email || !hasName || !csvMapping.company) {
      setCsvUploadError('Please map at least: Name (or First Name + Last Name), Email, and Company');
      return;
    }

    setIsUploadingCSV(true);
    setCsvUploadError(null);

    try {
      const leadsToUpload = csvData.map(row => {
        const lead: Record<string, any> = {};
        
        // Map only the core fields the user selected
        for (const [field, csvHeader] of Object.entries(csvMapping)) {
          const headerIndex = csvHeaders.indexOf(csvHeader);
          if (headerIndex === -1 || !row[headerIndex]) continue;
          const value = row[headerIndex];

          if (field === 'email') {
            lead.email = value.toLowerCase().trim();
          } else if (field === 'company_domain') {
            lead.company_domain = value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
          } else if (field === 'linkedin_url') {
            lead.linkedin_url = value.startsWith('http') ? value : `https://${value}`;
          } else {
            lead[field] = value;
          }
        }

        // Build location from unmapped city/state/country columns if no location mapped
        if (!lead.location) {
          const cityAliases = ['lead city', 'city', 'company city'];
          const stateAliases = ['lead state', 'state', 'company state'];
          const countryAliases = ['lead country', 'country', 'company country'];
          const findVal = (aliases: string[]) => {
            for (const alias of aliases) {
              const idx = csvHeaders.findIndex(h => h.toLowerCase().trim() === alias);
              if (idx !== -1 && row[idx]) return row[idx];
            }
            return '';
          };
          const parts = [findVal(cityAliases), findVal(stateAliases), findVal(countryAliases)].filter(Boolean);
          if (parts.length > 0) lead.location = parts.join(', ');
        }

        // Capture ALL unmapped columns into enriched_data
        const mappedHeaders = new Set(Object.values(csvMapping));
        const customFields: Record<string, string> = {};
        csvHeaders.forEach((header, idx) => {
          if (!mappedHeaders.has(header) && row[idx]) {
            customFields[header.toLowerCase().trim().replace(/\s+/g, '_')] = row[idx];
          }
        });

        if (Object.keys(customFields).length > 0) {
          lead.enriched_data = {
            csv_upload: {
              source: 'csv_upload',
              timestamp: new Date().toISOString(),
              custom_fields: customFields
            }
          };
        }

        return lead;
      }).filter(lead => {
        // Must have email and company
        if (!lead.email || !lead.company) return false;
        // Must have either name OR (first_name AND last_name)
        const hasName = lead.name || (lead.first_name && lead.last_name);
        return hasName;
      });

      const response = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsToUpload }),
      });

      const data = await response.json();

      if (response.ok) {
        setCsvUploadResult({ 
          success: data.success || 0, 
          failed: data.failed || 0,
          duplicates: data.duplicates || 0
        });
        setCsvStep(3);
        if (data.success > 0) {
          await fetchLeads();
          await fetchStats();
        }
      } else {
        setCsvUploadError(data.error || 'Failed to upload leads');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setCsvUploadError('Network error - please try again');
    } finally {
      setIsUploadingCSV(false);
    }
  };

  // Reset CSV Wizard
  const resetCSVWizard = () => {
    setShowCSVUpload(false);
    setCsvStep(1);
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setCsvMapping({});
    setCsvUploadError(null);
    setCsvUploadResult(null);
  };

  const getEnrichmentStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Enriched</Badge>;
      case 'enriching':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Enriching</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Pending</Badge>;
    }
  };

  const getLeadScoreBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 80) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Hot ({score})</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Warm ({score})</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Cold ({score})</Badge>;
    }
  };

  const getICPScoreBadge = (score?: number) => {
    if (!score && score !== 0) {
      return <Badge variant="outline" className="text-gray-500 border-gray-500/30">Not Scored</Badge>;
    }
    
    if (score >= 80) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold">
          <TrendingUp className="w-3 h-3 mr-1" />
          {score} - High Match
        </Badge>
      );
    } else if (score >= 50) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold">
          {score} - Medium
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 font-semibold">
          {score} - Low Match
        </Badge>
      );
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

    const matchesICPScore =
      icpScoreFilter === 'all' ||
      (icpScoreFilter === 'high' && (lead.icp_score || 0) >= 80) ||
      (icpScoreFilter === 'medium' && (lead.icp_score || 0) >= 50 && (lead.icp_score || 0) < 80) ||
      (icpScoreFilter === 'low' && (lead.icp_score || 0) < 50 && lead.icp_score !== undefined);

    return matchesSearch && matchesFilter && matchesICPScore;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot className="w-6 h-6 text-violet-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  Lead Database
                </h1>
                <p className="text-gray-400 mt-1">AI-powered lead management and enrichment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => setShowCSVUpload(true)} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowAddLead(true)} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg shadow-violet-500/25">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {(() => {
          const stats = calculateStats();
          return (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Leads</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{stats.enriched}</div>
                <div className="text-sm text-gray-500">Enriched</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-fuchsia-500/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-fuchsia-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-fuchsia-400">{stats.high_score}</div>
                <div className="text-sm text-gray-500">High Score</div>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Mail className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-cyan-400">{stats.contacted_this_week}</div>
                <div className="text-sm text-gray-500">Contacted This Week</div>
              </div>
            </div>
          );
        })()}

        {/* Search and Filters */}
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                All
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                <Clock className="w-4 h-4 mr-1" />
                Pending
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('enriched')}
                className={statusFilter === 'enriched' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Enriched
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('high_score')}
                className={statusFilter === 'high_score' ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                High Score
              </Button>
            </div>
            <div className="border-l border-white/10 pl-4 flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">ICP Match:</span>
              <Button
                size="sm"
                onClick={() => setIcpScoreFilter('all')}
                className={icpScoreFilter === 'all' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                All
              </Button>
              <Button
                size="sm"
                onClick={() => setIcpScoreFilter('high')}
                className={icpScoreFilter === 'high' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                High (80+)
              </Button>
              <Button
                size="sm"
                onClick={() => setIcpScoreFilter('medium')}
                className={icpScoreFilter === 'medium' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                Medium (50-79)
              </Button>
              <Button
                size="sm"
                onClick={() => setIcpScoreFilter('low')}
                className={icpScoreFilter === 'low' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}
              >
                Low (&lt;50)
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-lg font-semibold text-white">Leads ({filteredLeads.length})</span>
            <div className="flex items-center space-x-2">
              <Button size="sm" className="bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30">
                <Bot className="w-4 h-4 mr-1" />
                Bulk Enrich
              </Button>
              <Button size="sm" className="bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10">
                <Filter className="w-4 h-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
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
                    ICP Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Score
                  </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/20 bg-white/5"
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
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {lead.first_name[0]}{lead.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-white hover:text-violet-400 transition-colors cursor-pointer">
                              {lead.first_name} {lead.last_name}
                            </Link>
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
                          <div className="text-sm font-medium text-white flex items-center">
                            <Building2 className="w-4 h-4 mr-1 text-gray-500" />
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
                        {getICPScoreBadge(lead.icp_score)}
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
                            <Button size="sm" className="bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30">
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
          </div>

        {/* Add Lead Modal */}
        {showAddLead && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Lead</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter lead details manually</p>
                </div>
                <button
                  onClick={() => setShowAddLead(false)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      placeholder="John"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      placeholder="Smith"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john.smith@company.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                {/* Company & Title Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      placeholder="Acme Inc"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={newLead.title}
                      onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                      placeholder="VP of Sales"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Phone & LinkedIn Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      placeholder="+1-555-0123"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                    <input
                      type="url"
                      value={newLead.linkedin_url}
                      onChange={(e) => setNewLead({ ...newLead, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/johnsmith"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Location & Industry Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={newLead.location}
                      onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                      placeholder="San Francisco, CA"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                    <input
                      type="text"
                      value={newLead.industry}
                      onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                      placeholder="Technology"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Size</label>
                  <select
                    value={newLead.company_size}
                    onChange={(e) => setNewLead({ ...newLead, company_size: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="" className="bg-[#12121a]">Select size...</option>
                    <option value="1-10" className="bg-[#12121a]">1-10 employees</option>
                    <option value="11-50" className="bg-[#12121a]">11-50 employees</option>
                    <option value="51-200" className="bg-[#12121a]">51-200 employees</option>
                    <option value="201-500" className="bg-[#12121a]">201-500 employees</option>
                    <option value="501-1000" className="bg-[#12121a]">501-1000 employees</option>
                    <option value="1001+" className="bg-[#12121a]">1001+ employees</option>
                  </select>
                </div>

                {/* Error Message */}
                {addLeadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {addLeadError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/[0.02] rounded-b-2xl">
                <Button variant="outline" onClick={() => setShowAddLead(false)} className="px-6 bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLead}
                  disabled={!newLead.first_name.trim() || !newLead.last_name.trim() || !newLead.email.trim() || !newLead.company.trim() || isAddingLead}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-6"
                >
                  {isAddingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Add Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Upload Wizard Modal */}
        {showCSVUpload && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-white">Import Leads from CSV</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Step {csvStep} of 3: {csvStep === 1 ? 'Upload File' : csvStep === 2 ? 'Map Columns' : 'Complete'}
                  </p>
                </div>
                <button
                  onClick={resetCSVWizard}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${csvStep >= 1 ? 'text-violet-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${csvStep >= 1 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'bg-white/10'}`}>
                      1
                    </div>
                    <span className="ml-2 font-medium">Upload</span>
                  </div>
                  <div className={`flex-1 h-1 mx-4 rounded ${csvStep >= 2 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-white/10'}`} />
                  <div className={`flex items-center ${csvStep >= 2 ? 'text-violet-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${csvStep >= 2 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'bg-white/10'}`}>
                      2
                    </div>
                    <span className="ml-2 font-medium">Map</span>
                  </div>
                  <div className={`flex-1 h-1 mx-4 rounded ${csvStep >= 3 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600' : 'bg-white/10'}`} />
                  <div className={`flex items-center ${csvStep >= 3 ? 'text-violet-400' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${csvStep >= 3 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'bg-white/10'}`}>
                      3
                    </div>
                    <span className="ml-2 font-medium">Done</span>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Step 1: Upload File */}
                {csvStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-violet-500/50 transition-colors bg-white/[0.02]">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-violet-400 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Upload your CSV file</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Drag and drop or click to browse. File should have headers in the first row.
                      </p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg cursor-pointer transition-all shadow-lg shadow-violet-500/25"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                      </label>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="font-medium text-white mb-2">Required columns:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• <strong className="text-violet-400">Name</strong> (or First Name + Last Name) - Contact's name</li>
                        <li>• <strong className="text-violet-400">Email</strong> - Contact's email address</li>
                        <li>• <strong className="text-violet-400">Company</strong> - Company name</li>
                      </ul>
                      <p className="text-sm text-gray-500 mt-3">
                        Optional: Title, Phone, LinkedIn URL, Location, City, Country, Timezone, Industry, Company Size, Pain Points, Offer, CTA
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Map Columns */}
                {csvStep === 2 && (
                  <div className="space-y-6">
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                      <p className="text-sm text-violet-300">
                        <strong className="text-white">{csvData.length}</strong> leads found in <strong className="text-white">{csvFile?.name}</strong>. 
                        Map your CSV columns to the core lead fields below. All other columns are automatically saved as enriched data.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        // Core lead fields only — everything else auto-stored in enriched_data
                        { key: 'first_name', label: 'First Name', required: false, hint: 'Required if no Full Name' },
                        { key: 'last_name', label: 'Last Name', required: false, hint: 'Required if no Full Name' },
                        { key: 'name', label: 'Full Name', required: false, hint: 'Or use First + Last Name' },
                        { key: 'email', label: 'Email', required: true },
                        { key: 'company', label: 'Company', required: true },
                        { key: 'title', label: 'Job Title', required: false },
                        { key: 'phone', label: 'Phone', required: false },
                        { key: 'linkedin_url', label: 'LinkedIn URL', required: false },
                        { key: 'company_domain', label: 'Company Website', required: false },
                        { key: 'location', label: 'Location', required: false },
                        { key: 'industry', label: 'Industry', required: false },
                        { key: 'company_size', label: 'Company Size', required: false },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            {field.label} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          <select
                            value={csvMapping[field.key] || ''}
                            onChange={(e) => setCsvMapping({ ...csvMapping, [field.key]: e.target.value })}
                            className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${
                              field.required && !csvMapping[field.key] ? 'border-red-500/50' : 'border-white/10'
                            }`}
                          >
                            <option value="" className="bg-[#12121a]">-- Select column --</option>
                            {csvHeaders.map(header => (
                              <option key={header} value={header} className="bg-[#12121a]">{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Preview */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Preview (first 3 rows):</h4>
                      <div className="overflow-x-auto border border-white/10 rounded-xl">
                        <table className="w-full text-sm">
                          <thead className="bg-white/5">
                            <tr>
                              {csvHeaders.slice(0, 5).map(header => (
                                <th key={header} className="px-3 py-2 text-left font-medium text-gray-400">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 3).map((row, i) => (
                              <tr key={i} className="border-t border-white/10">
                                {row.slice(0, 5).map((cell, j) => (
                                  <td key={j} className="px-3 py-2 text-gray-300">{cell || '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Complete */}
                {csvStep === 3 && csvUploadResult && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3>
                    <p className="text-gray-400 mb-6">
                      Successfully imported <strong className="text-emerald-400">{csvUploadResult.success}</strong> leads
                      {csvUploadResult.duplicates ? (
                        <span className="text-yellow-400"> ({csvUploadResult.duplicates} skipped — already exist)</span>
                      ) : null}
                      {csvUploadResult.failed > 0 && (
                        <span className="text-red-400"> ({csvUploadResult.failed} failed)</span>
                      )}
                    </p>
                    <Button onClick={resetCSVWizard} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0">
                      Done
                    </Button>
                  </div>
                )}

                {/* Error Message */}
                {csvUploadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm mt-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {csvUploadError}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {csvStep !== 3 && (
                <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/[0.02] rounded-b-2xl">
                  <Button
                    variant="outline"
                    onClick={csvStep === 1 ? resetCSVWizard : () => setCsvStep(1)}
                    className="px-6 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    {csvStep === 1 ? 'Cancel' : (
                      <>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </>
                    )}
                  </Button>
                  
                  {csvStep === 2 && (
                    <Button
                      onClick={handleCSVUpload}
                      disabled={!csvMapping.email || !(csvMapping.name || (csvMapping.first_name && csvMapping.last_name)) || !csvMapping.company || isUploadingCSV}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 px-6"
                    >
                      {isUploadingCSV ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          Import {csvData.length} Leads
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
}
