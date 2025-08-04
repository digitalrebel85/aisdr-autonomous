-- Enhanced CSV Upload System with Custom Fields Support
-- This migration supports the unified storage approach where custom CSV columns
-- are stored in the existing enriched_data JSONB field under csv_upload.custom_fields

-- Add custom_data JSONB column for future extensibility (optional)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- Add index for custom data queries
CREATE INDEX IF NOT EXISTS idx_leads_custom_data_gin ON public.leads USING GIN (custom_data);

-- Add index for enriched_data CSV custom fields (primary storage location)
CREATE INDEX IF NOT EXISTS idx_leads_enriched_data_csv_gin ON public.leads USING GIN ((enriched_data->'csv_upload'->'custom_fields'));

-- Add comments explaining the unified storage approach
COMMENT ON COLUMN public.leads.custom_data IS 'Optional JSONB field for future custom data extensions';
COMMENT ON COLUMN public.leads.enriched_data IS 'Primary storage for all enriched data including CSV custom fields under csv_upload.custom_fields';

-- Current Implementation: CSV Custom Fields Storage Structure
-- enriched_data: {
--   "csv_upload": {
--     "source": "csv_upload",
--     "timestamp": "2025-01-03T15:14:00Z",
--     "custom_fields": {
--       "seo_meta_description": "High-converting landing pages for SaaS",
--       "lead_score": "85",
--       "marketing_source": "LinkedIn",
--       "budget_range": "50k-100k",
--       "decision_timeline": "Q1 2025"
--     }
--   }
-- }

-- AI Agent Usage: Custom fields are automatically parsed and used for email personalization
-- The AI agent receives context like:
-- "Additional Lead Intelligence:
--  Seo Meta Description: High-converting landing pages for SaaS
--  Lead Score: 85
--  Marketing Source: LinkedIn"

-- IMPORTANT: AI agent instructions updated to use custom fields intelligently:
-- - NEVER mention internal data like lead scores or tracking data directly
-- - Use custom fields to understand business context without referencing the data source
-- - Make emails sound like natural research, not internal tracking data
