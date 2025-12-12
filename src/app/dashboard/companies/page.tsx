"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Globe, 
  MapPin,
  Calendar,
  DollarSign,
  Search,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: number;
  domain: string;
  name?: string;
  description?: string;
  industry?: string;
  industries?: string[];
  estimated_num_employees?: number;
  annual_revenue?: number;
  annual_revenue_printed?: string;
  founded_year?: number;
  keywords?: string[];
  technologies?: string[];
  website_url?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  logo_url?: string;
  enrichment_status?: string;
  enrichment_source?: string;
  enriched_at?: string;
  created_at: string;
  leads?: { count: number }[];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, [searchQuery, industryFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (industryFilter && industryFilter !== 'all') params.append('industry', industryFilter);

      const response = await fetch(`/api/companies?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      
      const data = await response.json();
      setCompanies(data.companies || []);
      setIndustries(data.industries || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeadCount = (company: Company) => {
    return company.leads?.[0]?.count || 0;
  };

  const formatEmployees = (count?: number) => {
    if (!count) return '-';
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-cyan-600/10 rounded-2xl border border-white/10 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Companies</h1>
              <p className="text-gray-400 mt-1">
                {companies.length} companies enriched from your leads
              </p>
            </div>
          </div>
          <Button onClick={fetchCompanies} className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search companies by name or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-violet-500/50"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent className="bg-[#12121a] border-white/10">
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-fuchsia-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 py-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-violet-500/20 rounded-2xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No companies yet</h3>
          <p className="text-gray-400 mb-4">
            Companies are automatically created when you enrich leads.
          </p>
          <Link href="/leads">
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
              Go to Leads
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div key={company.id} className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 hover:border-violet-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name || company.domain}
                      className="w-10 h-10 rounded-lg object-contain bg-white/10 border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {company.name || company.domain}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {company.domain}
                    </p>
                  </div>
                </div>
                <Badge 
                  className={
                    company.enrichment_status === 'enriched' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }
                >
                  {company.enrichment_status || 'pending'}
                </Badge>
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                  {company.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-center text-violet-400 mb-1">
                    <Users className="w-3 h-3 mr-1" />
                    <span className="font-semibold text-sm">{formatEmployees(company.estimated_num_employees)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Employees</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-center text-emerald-400 mb-1">
                    <Users className="w-3 h-3 mr-1" />
                    <span className="font-semibold text-sm">{getLeadCount(company)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Leads</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-center justify-center text-fuchsia-400 mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="font-semibold text-sm">{company.founded_year || '-'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Founded</p>
                </div>
              </div>

              {/* Industry & Location */}
              <div className="flex flex-wrap gap-2 mb-4">
                {company.industry && (
                  <Badge className="text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                    {company.industry}
                  </Badge>
                )}
                {(company.city || company.country) && (
                  <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                    <MapPin className="w-3 h-3 mr-1" />
                    {[company.city, company.country].filter(Boolean).join(', ')}
                  </Badge>
                )}
              </div>

              {/* Technologies Preview */}
              {company.technologies && company.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {company.technologies.slice(0, 4).map((tech, i) => (
                    <Badge key={i} className="text-xs bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      {tech}
                    </Badge>
                  ))}
                  {company.technologies.length > 4 && (
                    <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                      +{company.technologies.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-white/5">
                {company.website_url && (
                  <a 
                    href={company.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                      <Globe className="w-3 h-3 mr-1" />
                      Website
                    </Button>
                  </a>
                )}
                {company.linkedin_url && (
                  <a 
                    href={company.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      LinkedIn
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
