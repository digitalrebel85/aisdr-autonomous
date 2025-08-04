-- Add enrichment tracking and storage fields to leads table

-- Add enrichment status tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriching', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS enrichment_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS enrichment_error TEXT,
ADD COLUMN IF NOT EXISTS enriched_data JSONB;

-- Add enriched data fields for easier querying (extracted from enriched_data JSONB)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS pain_points TEXT[];

-- Create index for enrichment status queries
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON public.leads(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_completed ON public.leads(enrichment_completed_at);

-- Create index for enriched data searches
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_company_size ON public.leads(company_size);

-- Add GIN index for JSONB enriched_data field for fast JSON queries
CREATE INDEX IF NOT EXISTS idx_leads_enriched_data_gin ON public.leads USING GIN (enriched_data);

-- Add comments for new fields
COMMENT ON COLUMN public.leads.enrichment_status IS 'Status of lead enrichment process';
COMMENT ON COLUMN public.leads.enrichment_started_at IS 'When enrichment process started';
COMMENT ON COLUMN public.leads.enrichment_completed_at IS 'When enrichment process completed';
COMMENT ON COLUMN public.leads.enrichment_error IS 'Error message if enrichment failed';
COMMENT ON COLUMN public.leads.enriched_data IS 'Full enriched data from external APIs (JSON)';
COMMENT ON COLUMN public.leads.linkedin_url IS 'LinkedIn profile URL from enrichment';
COMMENT ON COLUMN public.leads.phone IS 'Phone number from enrichment';
COMMENT ON COLUMN public.leads.location IS 'Location/address from enrichment';
COMMENT ON COLUMN public.leads.industry IS 'Industry from enrichment';
COMMENT ON COLUMN public.leads.company_size IS 'Company size from enrichment';
COMMENT ON COLUMN public.leads.pain_points IS 'AI-identified pain points from enrichment';
