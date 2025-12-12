-- Fix RLS policies for outreach_campaigns to ensure users can see their own campaigns

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.outreach_campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.outreach_campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.outreach_campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.outreach_campaigns;

-- Enable RLS
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own campaigns"
ON public.outreach_campaigns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
ON public.outreach_campaigns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
ON public.outreach_campaigns
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
ON public.outreach_campaigns
FOR DELETE
USING (auth.uid() = user_id);
