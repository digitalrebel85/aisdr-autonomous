'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { redirect } from 'next/navigation';

export default function LeadsPage() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [enrichingLeads, setEnrichingLeads] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    companyDomain: '',
    offer: '',
    cta: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

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
      
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*, enrichment_status, enrichment_completed_at, enriched_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        setMessage({ type: 'error', text: 'Failed to fetch leads' });
      } else {
        setLeads(leads || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        title: formData.title,
        company: formData.company,
        company_domain: formData.companyDomain,
        offer: formData.offer,
        cta: formData.cta,
        enrichment_status: 'pending',
      });

      if (error) {
        console.error('Error inserting lead:', error);
        setMessage({ type: 'error', text: 'Failed to add lead' });
      } else {
        setMessage({ type: 'success', text: 'Lead added successfully!' });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          title: '',
          companyDomain: '',
          offer: '',
          cta: ''
        });
        fetchData(); // Refresh the leads list
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setMessage({ type: 'error', text: 'CSV file must have at least a header and one data row' });
        setUploading(false);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataLines = lines.slice(1);
      
      // Validate required headers (more flexible)
      const requiredHeaders = ['email'];
      const recommendedHeaders = ['first_name', 'last_name', 'company'];
      const supportedHeaders = [
        'first_name', 'last_name', 'email', 'company', 'title', 'company_domain',
        'phone', 'linkedin_url', 'location', 'industry', 'company_size', 'notes'
      ];
      
      const missingRequired = requiredHeaders.filter(h => !headers.includes(h));
      const missingRecommended = recommendedHeaders.filter(h => !headers.includes(h));
      const unsupportedHeaders = headers.filter(h => !supportedHeaders.includes(h));
      
      if (missingRequired.length > 0) {
        setMessage({ 
          type: 'error', 
          text: `Missing required column: ${missingRequired.join(', ')}. Email is required for lead enrichment.` 
        });
        setUploading(false);
        return;
      }
      
      // Warn about missing recommended fields
      if (missingRecommended.length > 0) {
        console.warn(`Missing recommended columns: ${missingRecommended.join(', ')}. These help with enrichment accuracy.`);
      }
      
      // Log unsupported headers
      if (unsupportedHeaders.length > 0) {
        console.log(`Custom columns will be stored in enriched_data: ${unsupportedHeaders.join(', ')}`);
      }
      
      const supabase = createClient();
      const leadsToInsert = [];
      
      for (const line of dataLines) {
        const values = line.split(',').map(v => v.trim().replace(/^"|"/g, ''));
        
        if (values.length !== headers.length) continue;
        
        const leadData: any = {
          user_id: user.id,
          offer: formData.offer || 'Default offer - to be customized',
          cta: formData.cta || 'Would you be interested in learning more?'
        };
        
        // Prepare enriched_data object for custom/unsupported fields
        const enrichedData: any = {
          csv_upload: {
            source: 'csv_upload',
            timestamp: new Date().toISOString(),
            custom_fields: {}
          }
        };
        
        headers.forEach((header, index) => {
          const value = values[index];
          if (!value || value.trim() === '') return; // Skip empty values
          
          // Check if this is a supported field
          if (supportedHeaders.includes(header)) {
            // Handle supported fields
            switch (header) {
              case 'first_name':
                leadData.first_name = value;
                break;
              case 'last_name':
                leadData.last_name = value;
                break;
              case 'email':
                leadData.email = value.toLowerCase().trim(); // Normalize email
                break;
              case 'company':
                leadData.company = value;
                break;
              case 'title':
                leadData.title = value;
                break;
              case 'company_domain':
                // Clean domain (remove http/https, www)
                leadData.company_domain = value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                break;
              case 'phone':
                leadData.phone = value;
                break;
              case 'linkedin_url':
                // Ensure LinkedIn URL is properly formatted
                if (value.includes('linkedin.com')) {
                  leadData.linkedin_url = value.startsWith('http') ? value : `https://${value}`;
                }
                break;
              case 'location':
                leadData.location = value;
                break;
              case 'industry':
                leadData.industry = value;
                break;
              case 'company_size':
                leadData.company_size = value;
                break;
              case 'notes':
                leadData.notes = value;
                break;
            }
          } else {
            // Store unsupported fields in enriched_data
            enrichedData.csv_upload.custom_fields[header] = value;
          }
        });
        
        // Only add enriched_data if there are custom fields
        if (Object.keys(enrichedData.csv_upload.custom_fields).length > 0) {
          leadData.enriched_data = enrichedData;
        }
        
        // Combine first and last name for the name field
        leadData.name = `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim();
        
        // If no name from first/last, try to extract from email
        if (!leadData.name && leadData.email) {
          const emailName = leadData.email.split('@')[0];
          leadData.name = emailName.replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        }
        
        leadData.enrichment_status = 'pending';
        
        // More flexible validation - only email is required
        if (leadData.email) {
          leadsToInsert.push(leadData);
        }
      }
      
      if (leadsToInsert.length === 0) {
        setMessage({ type: 'error', text: 'No valid leads found in CSV file' });
        setUploading(false);
        return;
      }
      
      const { data: insertedLeads, error } = await supabase.from('leads').insert(leadsToInsert).select();
      
      if (error) {
        console.error('Error inserting leads:', error);
        setMessage({ type: 'error', text: 'Failed to upload leads' });
      } else {
        const successCount = insertedLeads?.length || 0;
        setMessage({ 
          type: 'success', 
          text: `Successfully uploaded ${successCount} leads! You can now enrich them individually or use bulk enrichment.` 
        });
        
        // Optional: Ask user if they want to start batch enrichment
        if (insertedLeads && insertedLeads.length > 0 && window.confirm(
          `Would you like to start enriching all ${successCount} uploaded leads now? This will use your configured API keys.`
        )) {
          // Start batch enrichment for uploaded leads
          batchEnrichLeads(insertedLeads);
        }
        
        fetchData(); // Refresh the leads list
      }
    } catch (error) {
      console.error('Error processing CSV:', error);
      setMessage({ type: 'error', text: 'Error processing CSV file' });
    }
    
    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  const batchEnrichLeads = async (leads: any[]) => {
    if (!leads || leads.length === 0) return;
    
    setMessage({ 
      type: 'info', 
      text: `Starting batch enrichment for ${leads.length} leads. This may take a few minutes...` 
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process leads in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (lead) => {
        try {
          setEnrichingLeads(prev => new Set(prev).add(lead.id));
          
          const response = await fetch('/api/enrich-lead', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              leadId: lead.id,
              email: lead.email,
              companyDomain: lead.company_domain,
              name: lead.name,
              company: lead.company,
              firstName: lead.first_name,
              lastName: lead.last_name,
              linkedinUrl: lead.linkedin_url
            }),
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to enrich ${lead.email}:`, await response.text());
          }
        } catch (error) {
          errorCount++;
          console.error(`Error enriching ${lead.email}:`, error);
        } finally {
          setEnrichingLeads(prev => {
            const newSet = new Set(prev);
            newSet.delete(lead.id);
            return newSet;
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Final status message
    setMessage({ 
      type: successCount > 0 ? 'success' : 'error', 
      text: `Batch enrichment completed! ${successCount} successful, ${errorCount} failed.` 
    });
    
    fetchData(); // Refresh the leads list
  };

  const enrichLead = async (lead: any) => {
    setEnrichingLeads(prev => new Set(prev).add(lead.id));
    
    try {
      const response = await fetch('/api/enrich-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: lead.id,
          email: lead.email,
          companyDomain: lead.company_domain,
          name: lead.name,
          company: lead.company,
          firstName: lead.first_name,
          lastName: lead.last_name,
          linkedinUrl: lead.linkedin_url
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `Lead ${lead.email} enriched successfully!` });
        fetchData(); // Refresh the leads list
      } else {
        setMessage({ type: 'error', text: result.error || 'Enrichment failed' });
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      setMessage({ type: 'error', text: 'Failed to enrich lead' });
    } finally {
      setEnrichingLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(lead.id);
        return newSet;
      });
    }
  };

  const getEnrichmentStatus = (lead: any) => {
    if (enrichingLeads.has(lead.id)) return 'enriching';
    return lead.enrichment_status || 'pending';
  };

  const getEnrichmentBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Enriched</span>;
      case 'enriching':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Enriching...</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Database</h1>
          <p className="mt-2 text-gray-600">Manage your leads and import new prospects</p>
        </div>
        <div className="text-sm text-gray-500">
          {leads.length} total leads
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Upload Options */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Leads</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/leads/json-upload"
            className="group bg-white p-6 rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-500 transition-colors text-center"
          >
            <div className="text-4xl mb-3">🧠</div>
            <h3 className="font-semibold text-gray-900 mb-2">AI JSON Processing</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload unstructured text data. AI extracts contact info automatically.
            </p>
            <div className="text-xs text-blue-600 font-medium group-hover:text-blue-800">
              ✨ NEW: Intelligent Processing →
            </div>
          </a>
          <a
            href="/dashboard/leads/upload"
            className="group bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Traditional CSV</h3>
            <p className="text-sm text-gray-600 mb-3">
              Upload structured CSV files with predefined columns.
            </p>
            <div className="text-xs text-gray-600 font-medium group-hover:text-gray-800">
              Classic Format →
            </div>
          </a>
        </div>
      </div>

      {/* Add Lead Form and CSV Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual Lead Entry */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Lead</h2>
          <form onSubmit={addLead} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                required
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                required
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                required
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Job Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Company Domain (e.g., company.com)"
                value={formData.companyDomain}
                onChange={(e) => setFormData(prev => ({ ...prev, companyDomain: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <textarea
              required
              placeholder="Your Offer (e.g., We help companies increase sales by 20%...)"
              value={formData.offer}
              onChange={(e) => setFormData(prev => ({ ...prev, offer: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <textarea
              required
              placeholder="Your Call to Action (e.g., Are you free for a quick 15-min chat next week?)"
              value={formData.cta}
              onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <button
              type="submit"
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
            >
              Add Lead
            </button>
          </form>
        </div>

        {/* CSV Upload */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import from CSV</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Enhanced CSV Format Support:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Required:</strong> email (minimum for enrichment)</li>
                <li>• <strong>Recommended:</strong> first_name, last_name, company</li>
                <li>• <strong>Optional:</strong> title, company_domain, phone, linkedin_url, location, industry, company_size, notes</li>
                <li>• First row should contain column headers (case-insensitive)</li>
                <li>• Automatic data cleaning and validation</li>
                <li>• Batch enrichment option after upload</li>
              </ul>
              <div className="mt-3 p-2 bg-white rounded border">
                <p className="text-xs text-blue-700 font-mono">
                  Example: email,first_name,last_name,company,title,company_domain,phone
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Offer (for all imported leads)
                </label>
                <textarea
                  placeholder="Enter default offer for CSV imports"
                  value={formData.offer}
                  onChange={(e) => setFormData(prev => ({ ...prev, offer: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default CTA (for all imported leads)
                </label>
                <textarea
                  placeholder="Enter default call-to-action for CSV imports"
                  value={formData.cta}
                  onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={uploading}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent rounded-lg font-medium ${
                  uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } transition-colors`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                    Upload CSV File
                  </>
                )}
              </label>
              <p className="mt-2 text-sm text-gray-500">
                Select a CSV file to import multiple leads at once
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Your Leads</h2>
        </div>
        
        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.company || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.title || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.company_domain || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEnrichmentBadge(getEnrichmentStatus(lead))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {getEnrichmentStatus(lead) === 'pending' || getEnrichmentStatus(lead) === 'failed' ? (
                        <button
                          onClick={() => enrichLead(lead)}
                          disabled={enrichingLeads.has(lead.id)}
                          className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {enrichingLeads.has(lead.id) ? 'Enriching...' : 'Enrich'}
                        </button>
                      ) : getEnrichmentStatus(lead) === 'completed' ? (
                        <span className="text-green-600">✓ Complete</span>
                      ) : (
                        <span className="text-blue-600">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a lead manually or importing from CSV.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
