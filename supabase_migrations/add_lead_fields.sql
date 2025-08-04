-- Add new fields to leads table for better lead management
-- Remove pain_points as they will be handled by AI enrichment
-- Add first_name, last_name, and company_domain fields

-- Add new columns
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company_domain TEXT;

-- Remove pain_points column as it will be handled by AI enrichment
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS pain_points;

-- Update existing records to populate first_name and last_name from name field
UPDATE public.leads 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN trim(substring(name from 1 for position(' ' in name) - 1))
    ELSE name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' in name) > 0 
    THEN trim(substring(name from position(' ' in name) + 1))
    ELSE NULL
  END
WHERE name IS NOT NULL;

-- Add comment for new fields
COMMENT ON COLUMN public.leads.first_name IS 'Lead first name for personalization';
COMMENT ON COLUMN public.leads.last_name IS 'Lead last name for personalization';
COMMENT ON COLUMN public.leads.company_domain IS 'Company domain for enrichment and validation';
