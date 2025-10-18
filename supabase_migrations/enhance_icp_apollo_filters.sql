-- Enhance ICP profiles table with comprehensive Apollo API filters
-- This migration adds all Apollo search capabilities for advanced lead discovery
-- and integrates with the existing personas system

-- Add new columns for comprehensive Apollo API filters
ALTER TABLE public.icp_profiles 
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS exclude_job_titles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS company_domain_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS company_domain_exact_match BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exclude_company_domains JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exclude_domains_exact_match BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_locations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exclude_contact_locations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS intent_signals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industry_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS exclude_industry_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS verified_emails_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lead_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS company_hq_locations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS currently_hiring_for JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS yearly_headcount_growth_min INTEGER,
ADD COLUMN IF NOT EXISTS yearly_headcount_growth_max INTEGER,
ADD COLUMN IF NOT EXISTS funding_types JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS funding_amount_min BIGINT,
ADD COLUMN IF NOT EXISTS funding_amount_max BIGINT;

-- Add persona integration to ICP profiles
-- This links ICP profiles with personas for automatic persona assignment to discovered leads
ALTER TABLE public.icp_profiles 
ADD COLUMN IF NOT EXISTS default_persona_id BIGINT REFERENCES public.personas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_assign_persona BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.icp_profiles.campaign_name IS 'Campaign name for organizing Apollo searches';
COMMENT ON COLUMN public.icp_profiles.exclude_job_titles IS 'Array of job titles to exclude from search';
COMMENT ON COLUMN public.icp_profiles.company_domain_names IS 'Array of specific company domains to target';
COMMENT ON COLUMN public.icp_profiles.company_domain_exact_match IS 'Whether to use exact match for company domains';
COMMENT ON COLUMN public.icp_profiles.exclude_company_domains IS 'Array of company domains to exclude';
COMMENT ON COLUMN public.icp_profiles.exclude_domains_exact_match IS 'Whether to use exact match for excluded domains';
COMMENT ON COLUMN public.icp_profiles.contact_locations IS 'Array of contact geographic locations';
COMMENT ON COLUMN public.icp_profiles.exclude_contact_locations IS 'Array of contact locations to exclude';
COMMENT ON COLUMN public.icp_profiles.intent_signals IS 'Array of buyer intent signals';
COMMENT ON COLUMN public.icp_profiles.industry_keywords IS 'Array of industry-specific keywords';
COMMENT ON COLUMN public.icp_profiles.exclude_industry_keywords IS 'Array of industry keywords to exclude';
COMMENT ON COLUMN public.icp_profiles.verified_emails_only IS 'Only include leads with verified email addresses';
COMMENT ON COLUMN public.icp_profiles.lead_names IS 'Array of specific lead names to target';
COMMENT ON COLUMN public.icp_profiles.company_hq_locations IS 'Array of company headquarters locations';
COMMENT ON COLUMN public.icp_profiles.currently_hiring_for IS 'Array of roles the company is currently hiring for';
COMMENT ON COLUMN public.icp_profiles.yearly_headcount_growth_min IS 'Minimum yearly headcount growth percentage';
COMMENT ON COLUMN public.icp_profiles.yearly_headcount_growth_max IS 'Maximum yearly headcount growth percentage';
COMMENT ON COLUMN public.icp_profiles.funding_types IS 'Array of funding types (seed, series-a, etc.)';
COMMENT ON COLUMN public.icp_profiles.funding_amount_min IS 'Minimum funding amount in USD';
COMMENT ON COLUMN public.icp_profiles.funding_amount_max IS 'Maximum funding amount in USD';
COMMENT ON COLUMN public.icp_profiles.default_persona_id IS 'Default persona to assign to leads discovered with this ICP profile';
COMMENT ON COLUMN public.icp_profiles.auto_assign_persona IS 'Whether to automatically assign the default persona to discovered leads';

-- Create index for persona relationship
CREATE INDEX IF NOT EXISTS idx_icp_profiles_persona_id ON public.icp_profiles(default_persona_id);

-- Update sample data with enhanced filters and persona integration
UPDATE public.icp_profiles 
SET 
    campaign_name = 'Tech Startup Outreach',
    contact_locations = '["United States", "Canada", "United Kingdom"]'::jsonb,
    verified_emails_only = true,
    intent_signals = '["hiring", "funding", "expansion"]'::jsonb,
    industry_keywords = '["SaaS", "fintech", "AI/ML"]'::jsonb,
    yearly_headcount_growth_min = 10,
    funding_types = '["series-a", "series-b", "seed"]'::jsonb,
    auto_assign_persona = true
WHERE name = 'Tech Startup Decision Makers';

-- Insert additional sample ICP profile with comprehensive filters
INSERT INTO public.icp_profiles (
    user_id,
    name,
    description,
    campaign_name,
    industries,
    company_sizes,
    job_titles,
    exclude_job_titles,
    seniority_levels,
    departments,
    contact_locations,
    exclude_contact_locations,
    company_domain_names,
    company_domain_exact_match,
    technologies,
    intent_signals,
    industry_keywords,
    exclude_industry_keywords,
    employee_count_min,
    employee_count_max,
    revenue_min,
    revenue_max,
    verified_emails_only,
    currently_hiring_for,
    yearly_headcount_growth_min,
    funding_types,
    auto_assign_persona,
    status
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Enterprise Sales Leaders',
    'Target enterprise sales leaders at high-growth companies with verified contact info',
    'Enterprise Sales Campaign Q1 2025',
    '["Software", "Technology", "Financial Services"]'::jsonb,
    '["1000-5000", "5000+"]'::jsonb,
    '["VP Sales", "Director of Sales", "Chief Revenue Officer", "Head of Sales"]'::jsonb,
    '["Sales Representative", "Sales Coordinator"]'::jsonb,
    '["VP", "Director", "C-Level"]'::jsonb,
    '["Sales", "Revenue Operations"]'::jsonb,
    '["United States", "Canada"]'::jsonb,
    '["Remote"]'::jsonb,
    '["salesforce.com", "hubspot.com"]'::jsonb,
    true,
    '["Salesforce", "HubSpot", "Outreach", "SalesLoft"]'::jsonb,
    '["hiring sales", "revenue growth", "sales enablement"]'::jsonb,
    '["B2B", "enterprise sales", "revenue operations"]'::jsonb,
    '["SMB", "small business"]'::jsonb,
    1000,
    10000,
    50000000,
    1000000000,
    true,
    '["Account Executive", "Sales Manager", "Business Development"]'::jsonb,
    15,
    '["series-b", "series-c", "ipo"]'::jsonb,
    true,
    'active'
);

-- Create index for better query performance on new filter columns
CREATE INDEX IF NOT EXISTS idx_icp_profiles_campaign_name ON public.icp_profiles(campaign_name);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_verified_emails ON public.icp_profiles(verified_emails_only);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_headcount_growth ON public.icp_profiles(yearly_headcount_growth_min, yearly_headcount_growth_max);

-- Update RLS policies to include new columns (policies already exist, just ensuring they cover new fields)
-- The existing RLS policies will automatically cover the new columns since they use user_id
