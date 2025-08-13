-- Add missing fields for AI lead processing system
-- These fields are used by the unstructured lead capture and enrichment system

-- Add phone field for contact information
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add location field for geographic information
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add industry field for business context
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Add company_size field for business intelligence
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_size TEXT;

-- Add linkedin_url field for social media profiles
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add enrichment_status field for tracking enrichment process
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending'
CHECK (enrichment_status IN ('pending', 'enriching', 'completed', 'failed'));

-- Add enrichment timestamps for tracking
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS enrichment_started_at TIMESTAMPTZ;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS enrichment_completed_at TIMESTAMPTZ;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS enrichment_error TEXT;

-- Create indexes for the new fields to improve query performance
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_leads_location ON public.leads USING btree (location);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads USING btree (industry);
CREATE INDEX IF NOT EXISTS idx_leads_company_size ON public.leads USING btree (company_size);
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON public.leads USING btree (linkedin_url);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_status ON public.leads USING btree (enrichment_status);

-- Create a composite index for enrichment queries
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_pending ON public.leads USING btree (enrichment_status, created_at)
WHERE enrichment_status = 'pending';

-- Add comments for documentation
COMMENT ON COLUMN public.leads.phone IS 'Contact phone number extracted from AI processing or enrichment';
COMMENT ON COLUMN public.leads.location IS 'Geographic location (city, state, country) from AI extraction or enrichment';
COMMENT ON COLUMN public.leads.industry IS 'Business industry classification from AI analysis or enrichment';
COMMENT ON COLUMN public.leads.company_size IS 'Company size indicator (e.g., "1-10", "51-200", "500+") from enrichment';
COMMENT ON COLUMN public.leads.linkedin_url IS 'LinkedIn profile URL from AI extraction or enrichment';
COMMENT ON COLUMN public.leads.enrichment_status IS 'Status of lead enrichment process (pending, enriching, completed, failed)';
COMMENT ON COLUMN public.leads.enrichment_started_at IS 'Timestamp when enrichment process started';
COMMENT ON COLUMN public.leads.enrichment_completed_at IS 'Timestamp when enrichment process completed';
COMMENT ON COLUMN public.leads.enrichment_error IS 'Error message if enrichment failed';
