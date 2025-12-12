-- ============================================================================
-- Add proof_points column to offers table
-- Distinguishes between sales_assets (lead magnets) and proof_points (credibility)
-- ============================================================================

-- Add proof_points column
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS proof_points JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.offers.sales_assets IS 'Lead magnets and value offers (webinars, whitepapers, free consultations)';
COMMENT ON COLUMN public.offers.proof_points IS 'Social proof and credibility (case studies, testimonials, ROI data, customer logos)';

-- Example update to show the difference
-- UPDATE public.offers SET 
--   sales_assets = '["Free webinar", "Industry whitepaper", "Free consultation"]',
--   proof_points = '["Case study: 300% ROI increase", "5000+ customers", "Featured in Forbes", "4.9/5 G2 rating"]'
-- WHERE id = 1;
