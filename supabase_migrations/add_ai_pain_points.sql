-- Add AI-enriched pain points to leads and ICP profiles
-- Pain points are optional and populated via AI analysis

-- Add pain_points to leads table (AI-enriched, specific to this lead)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pain_points_source TEXT CHECK (pain_points_source IN ('manual', 'ai_enriched', 'imported')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pain_points_enriched_at TIMESTAMPTZ DEFAULT NULL;

-- Add pain_points to icp_profiles table (generic for the ICP)
ALTER TABLE public.icp_profiles 
ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.pain_points IS 'AI-enriched or manually added pain points specific to this lead. Array of strings.';
COMMENT ON COLUMN public.leads.pain_points_source IS 'Source of pain points: manual, ai_enriched, or imported from CSV';
COMMENT ON COLUMN public.leads.pain_points_enriched_at IS 'Timestamp when pain points were last enriched by AI';
COMMENT ON COLUMN public.icp_profiles.pain_points IS 'Generic pain points for this ICP that the offer solves. Array of strings.';

-- Create index for leads with pain points (for filtering)
CREATE INDEX IF NOT EXISTS idx_leads_has_pain_points ON public.leads USING btree ((pain_points IS NOT NULL AND pain_points != '[]'::jsonb));

-- Example of what pain_points looks like:
-- For a lead: ["Struggling to scale outreach without hiring more SDRs", "Low reply rates on cold emails", "Spending too much time on manual follow-ups"]
-- For an ICP: ["Scaling sales outreach", "Improving email deliverability", "Reducing cost per lead"]
