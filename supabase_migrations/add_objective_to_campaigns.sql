-- Add objective column to outreach_campaigns table
-- This column is required for the AI A/B testing system

ALTER TABLE public.outreach_campaigns 
ADD COLUMN IF NOT EXISTS objective TEXT;

-- Add a check constraint for valid objectives
ALTER TABLE public.outreach_campaigns 
ADD CONSTRAINT IF NOT EXISTS check_objective_valid 
CHECK (objective IS NULL OR objective IN ('meetings', 'demos', 'trials', 'sales', 'engagement', 'nurture'));

-- Add index for filtering by objective
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_objective 
ON public.outreach_campaigns(objective);

-- Add comment for documentation
COMMENT ON COLUMN public.outreach_campaigns.objective IS 'Campaign objective: meetings, demos, trials, sales, engagement, or nurture';
