-- Enhance offers table with additional required fields for complete offer management
-- This migration adds the missing fields specified in the AISDR flow requirements

-- Add new columns to offers table
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS product_service_name TEXT,
ADD COLUMN IF NOT EXISTS call_to_action TEXT,
ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sales_assets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS proof_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email_example TEXT,
ADD COLUMN IF NOT EXISTS excluded_terms JSONB DEFAULT '[]'::jsonb;

-- Update existing offers table structure to match new requirements
-- Rename 'title' to 'name' for consistency (if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'offers' AND column_name = 'title') THEN
        ALTER TABLE public.offers RENAME COLUMN title TO name;
    END IF;
END $$;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_offers_product_service ON public.offers USING btree (product_service_name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_offers_company_description ON public.offers USING gin (to_tsvector('english', company_description)) TABLESPACE pg_default;

-- Update comments for new columns
COMMENT ON COLUMN public.offers.company_description IS 'Description of the company/target market for this offer';
COMMENT ON COLUMN public.offers.product_service_name IS 'Name of the specific product or service being offered';
COMMENT ON COLUMN public.offers.call_to_action IS 'Primary call-to-action for this offer';
COMMENT ON COLUMN public.offers.proof_points IS 'Array of customer experience and proof points';
COMMENT ON COLUMN public.offers.email_example IS 'Example email demonstrating tone and style for this offer';
COMMENT ON COLUMN public.offers.excluded_terms IS 'Array of terms/phrases to avoid when using this offer';

-- Update sample data with new fields
UPDATE public.offers 
SET 
    company_description = CASE 
        WHEN name LIKE '%AI Sales%' THEN 'Mid-market B2B SaaS companies with 50-500 employees struggling with manual sales processes'
        WHEN name LIKE '%CRM%' THEN 'Growing companies with fragmented sales data across multiple systems'
        ELSE 'Technology companies looking to scale their sales operations'
    END,
    product_service_name = CASE
        WHEN name LIKE '%AI Sales%' THEN 'AISDR - AI Sales Development Representative'
        WHEN name LIKE '%CRM%' THEN 'CRM Integration Suite'
        ELSE 'Sales Automation Platform'
    END,
    call_to_action = CASE
        WHEN name LIKE '%AI Sales%' THEN 'Book a 15-minute demo to see AISDR in action'
        WHEN name LIKE '%CRM%' THEN 'Schedule a free CRM audit and integration consultation'
        ELSE 'Get started with a free trial today'
    END,
    proof_points = CASE
        WHEN name LIKE '%AI Sales%' THEN '[
            "TechCorp increased qualified demos by 300% in 30 days",
            "StartupCo reduced manual prospecting time by 90%",
            "ScaleCorp achieved 40% higher response rates with AI personalization",
            "GrowthInc generated $2M in pipeline in first quarter"
        ]'::jsonb
        WHEN name LIKE '%CRM%' THEN '[
            "FinanceFlow eliminated 15 hours/week of manual data entry",
            "SalesTeam improved forecast accuracy by 85%",
            "RevOps reduced reporting time from days to minutes",
            "DataCorp achieved single source of truth for 10,000+ contacts"
        ]'::jsonb
        ELSE '[
            "Average 3x increase in qualified leads",
            "90% reduction in manual tasks",
            "ROI positive within 30 days",
            "99.9% uptime with enterprise security"
        ]'::jsonb
    END,
    email_example = CASE
        WHEN name LIKE '%AI Sales%' THEN 'Hi {{first_name}},

I noticed {{company}} is in the {{industry}} space - we''ve been helping similar companies like TechCorp automate their sales development process.

Most sales teams we work with are struggling with:
• Manual prospecting taking 20+ hours per week
• Low response rates from generic outreach
• Difficulty scaling without hiring more SDRs

Our AI Sales Development Representative (AISDR) has helped companies like yours:
✓ Increase qualified demos by 300%
✓ Reduce manual work by 90% 
✓ Achieve 40% higher response rates

Worth a quick 15-minute conversation to see if this could work for {{company}}?

Best,
[Your name]'
        ELSE 'Hi {{first_name}},

Quick question - how is {{company}} currently handling [relevant business challenge]?

We''ve been working with companies in {{industry}} to [solution benefit], and the results have been impressive:

• [Specific benefit 1]
• [Specific benefit 2] 
• [Specific benefit 3]

[Proof point example]

Would it make sense to explore how this could work for {{company}}?

Best regards,
[Your name]'
    END,
    excluded_terms = CASE
        WHEN name LIKE '%AI Sales%' THEN '["spam", "mass email", "blast", "cheap", "free forever", "no commitment"]'::jsonb
        WHEN name LIKE '%CRM%' THEN '["data migration nightmare", "complex setup", "expensive", "difficult"]'::jsonb
        ELSE '["pushy", "sales pitch", "limited time", "act now", "guaranteed"]'::jsonb
    END
WHERE company_description IS NULL;

-- Add validation constraints
ALTER TABLE public.offers 
ADD CONSTRAINT offers_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT offers_cta_not_empty CHECK (call_to_action IS NULL OR length(trim(call_to_action)) > 0);

-- Create function to validate JSON arrays
CREATE OR REPLACE FUNCTION validate_json_array(json_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN jsonb_typeof(json_data) = 'array';
END;
$$ LANGUAGE plpgsql;

-- Add constraints for JSON fields
ALTER TABLE public.offers 
ADD CONSTRAINT offers_pain_points_is_array CHECK (validate_json_array(pain_points)),
ADD CONSTRAINT offers_benefits_is_array CHECK (validate_json_array(benefits)),
ADD CONSTRAINT offers_sales_assets_is_array CHECK (validate_json_array(sales_assets)),
ADD CONSTRAINT offers_proof_points_is_array CHECK (validate_json_array(proof_points)),
ADD CONSTRAINT offers_excluded_terms_is_array CHECK (validate_json_array(excluded_terms));
