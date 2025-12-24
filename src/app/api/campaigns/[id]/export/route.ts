// API endpoint to export campaign leads with sequences as CSV
// Includes enriched lead data + sequence steps (subject, body) as custom fields

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all outreach queue items for this campaign with generated emails
    const { data: queueItems, error: queueError } = await supabase
      .from('outreach_queue')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .order('lead_id', { ascending: true })
      .order('sequence_step', { ascending: true });

    if (queueError) {
      return NextResponse.json({ error: 'Failed to fetch campaign data' }, { status: 500 });
    }

    // Get lead IDs - either from queue items or from campaign's lead assignments
    let leadIds: number[] = [];
    let leads: any[] = [];
    let leadSequences = new Map<number, any[]>();
    let maxSteps = 0;
    let variantEmails: any[] = [];

    if (queueItems && queueItems.length > 0) {
      // Campaign has queue items - use those
      leadIds = [...new Set(queueItems.map(item => item.lead_id))];
      
      // Group queue items by lead
      for (const item of queueItems) {
        if (!leadSequences.has(item.lead_id)) {
          leadSequences.set(item.lead_id, []);
        }
        leadSequences.get(item.lead_id)!.push(item);
      }
      
      maxSteps = Math.max(...Array.from(leadSequences.values()).map(items => items.length));
    } else {
      // No queue items - try to get leads from campaign_generated_emails first
      const { data: generatedEmails } = await supabase
        .from('campaign_generated_emails')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .order('lead_id', { ascending: true })
        .order('step_number', { ascending: true });
      
      if (generatedEmails && generatedEmails.length > 0) {
        // Use generated emails - group by lead
        leadIds = [...new Set(generatedEmails.map(e => e.lead_id))];
        
        for (const email of generatedEmails) {
          if (!leadSequences.has(email.lead_id)) {
            leadSequences.set(email.lead_id, []);
          }
          leadSequences.get(email.lead_id)!.push({
            lead_id: email.lead_id,
            sequence_step: email.step_number,
            subject: email.subject,
            body: email.body, // Add body at top level for export
            generated_email: { subject: email.subject, body: email.body },
            status: email.status
          });
        }
        
        maxSteps = Math.max(...Array.from(leadSequences.values()).map(items => items.length));
      } else {
        // Try sequence_executions
        const { data: executions } = await supabase
          .from('sequence_executions')
          .select('lead_id')
          .eq('campaign_id', campaignId);
        
        if (executions && executions.length > 0) {
          leadIds = [...new Set(executions.map(e => e.lead_id))];
        }
      }
      
      // Also check campaign_variants for email templates
      const { data: variants } = await supabase
        .from('campaign_variants')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);
      
      if (variants && variants.length > 0) {
        variantEmails = variants;
        // Get max steps from variant email templates
        for (const variant of variants) {
          const templates = variant.email_templates || [];
          if (Array.isArray(templates) && templates.length > maxSteps) {
            maxSteps = templates.length;
          }
        }
      }
    }

    // If still no leads, check if this is a campaign with variants but no leads assigned yet
    // In this case, export the variant email templates without lead data
    if (leadIds.length === 0 && variantEmails.length > 0) {
      // Export variant templates only
      const headers = ['variant_name', 'variant_letter', 'test_type'];
      for (let i = 1; i <= maxSteps; i++) {
        headers.push(`step_${i}_subject`);
        headers.push(`step_${i}_body`);
      }
      
      const rows: string[][] = [];
      for (const variant of variantEmails) {
        const row: string[] = [
          escapeCSV(variant.variant_name || ''),
          escapeCSV(variant.variant_letter || ''),
          escapeCSV(variant.test_type || '')
        ];
        
        const templates = variant.email_templates || [];
        for (let i = 0; i < maxSteps; i++) {
          const template = templates[i] || {};
          row.push(escapeCSV(template.subject || ''));
          row.push(escapeCSV(template.body || ''));
        }
        rows.push(row);
      }
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_variants_${new Date().toISOString().split('T')[0]}.csv`;
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // If still no leads and no variants, return error
    if (leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads found in campaign. Please add leads before exporting.' }, { status: 404 });
    }

    // Fetch full lead data with enrichment
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', user.id);

    if (leadsError) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
    
    leads = leadsData || [];

    // Create a map of leads by ID
    const leadsMap = new Map(leads.map(lead => [lead.id, lead]));

    // Build CSV headers
    const baseHeaders = [
      'first_name',
      'last_name',
      'email',
      'company',
      'title',
      'phone',
      'linkedin_url',
      'location',
      'industry',
      'company_size',
      'company_domain',
      'icp_score'
    ];

    // Add sequence step headers
    const sequenceHeaders: string[] = [];
    for (let i = 1; i <= maxSteps; i++) {
      sequenceHeaders.push(`step_${i}_subject`);
      sequenceHeaders.push(`step_${i}_body`);
      sequenceHeaders.push(`step_${i}_status`);
    }

    const allHeaders = [...baseHeaders, ...sequenceHeaders];

    // Build CSV rows
    const rows: string[][] = [];

    for (const leadId of leadIds) {
      const lead = leadsMap.get(leadId);
      if (!lead) continue;

      const sequences = leadSequences.get(leadId) || [];
      
      // Extract enriched data
      const enrichedData = lead.enriched_data || {};
      
      // Base lead data
      const row: string[] = [
        escapeCSV(lead.first_name || ''),
        escapeCSV(lead.last_name || ''),
        escapeCSV(lead.email || ''),
        escapeCSV(lead.company || ''),
        escapeCSV(lead.title || enrichedData.title || ''),
        escapeCSV(lead.phone || enrichedData.phone || ''),
        escapeCSV(lead.linkedin_url || enrichedData.linkedin_url || ''),
        escapeCSV(lead.location || enrichedData.location || ''),
        escapeCSV(lead.industry || enrichedData.industry || ''),
        escapeCSV(lead.company_size || enrichedData.company_size || ''),
        escapeCSV(lead.company_domain || enrichedData.company_domain || ''),
        escapeCSV(lead.icp_score?.toString() || '')
      ];

      // Add sequence steps
      for (let i = 0; i < maxSteps; i++) {
        const step = sequences.find(s => s.sequence_step === i + 1);
        if (step) {
          row.push(escapeCSV(step.subject || ''));
          row.push(escapeCSV(step.body || step.email_body || ''));
          row.push(escapeCSV(step.status || ''));
        } else {
          row.push('');
          row.push('');
          row.push('');
        }
      }

      rows.push(row);
    }

    // Generate CSV content
    const csvContent = [
      allHeaders.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return CSV file
    const filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// POST endpoint for exporting leads with sequence steps (for launch page)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const { leadIds, sequenceSteps } = body;
    
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }

    // Fetch leads data
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)
      .eq('user_id', user.id);

    if (leadsError || !leads || leads.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    // Build CSV headers
    const baseHeaders = [
      'first_name',
      'last_name',
      'email',
      'company',
      'title',
      'phone',
      'linkedin_url',
      'location',
      'industry',
      'company_size',
      'company_domain',
      'icp_score'
    ];

    // Add sequence step headers if provided
    const sequenceHeaders: string[] = [];
    const maxSteps = sequenceSteps?.length || 0;
    for (let i = 1; i <= maxSteps; i++) {
      sequenceHeaders.push(`step_${i}_subject`);
      sequenceHeaders.push(`step_${i}_body`);
    }

    const allHeaders = [...baseHeaders, ...sequenceHeaders];

    // Build CSV rows
    const rows: string[][] = [];

    for (const lead of leads) {
      const enrichedData = lead.enriched_data || {};
      
      const row: string[] = [
        escapeCSV(lead.first_name || ''),
        escapeCSV(lead.last_name || ''),
        escapeCSV(lead.email || ''),
        escapeCSV(lead.company || ''),
        escapeCSV(lead.title || enrichedData.title || ''),
        escapeCSV(lead.phone || enrichedData.phone || ''),
        escapeCSV(lead.linkedin_url || enrichedData.linkedin_url || ''),
        escapeCSV(lead.location || enrichedData.location || ''),
        escapeCSV(lead.industry || enrichedData.industry || ''),
        escapeCSV(lead.company_size || enrichedData.company_size || ''),
        escapeCSV(lead.company_domain || enrichedData.company_domain || ''),
        escapeCSV(lead.icp_score?.toString() || '')
      ];

      // Add sequence steps if provided
      if (sequenceSteps && Array.isArray(sequenceSteps)) {
        for (const step of sequenceSteps) {
          row.push(escapeCSV(step.subject_line_template || step.subject_line || ''));
          row.push(escapeCSV(step.email_body_template || step.email_body || ''));
        }
      }

      rows.push(row);
    }

    // Generate CSV content
    const csvContent = [
      allHeaders.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Return CSV file
    const filename = `campaign_leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (!value) return '';
  
  // Convert to string if not already
  const str = String(value);
  
  // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}
