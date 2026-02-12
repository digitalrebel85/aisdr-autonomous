-- Autopilot settings: allows users to configure the AI SDR agent to run autonomously
-- The agent will auto-discover leads, create campaigns, and run outreach without manual intervention

CREATE TABLE IF NOT EXISTS public.autopilot_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Master toggle
    enabled boolean DEFAULT false,
    
    -- Lead discovery settings
    auto_discover_leads boolean DEFAULT true,
    discovery_icp_profile_id bigint REFERENCES public.icp_profiles(id) ON DELETE SET NULL,
    max_leads_per_discovery integer DEFAULT 25,        -- Max leads to discover per run
    discovery_frequency_hours integer DEFAULT 24,      -- How often to discover new leads (hours)
    last_discovery_at timestamptz,
    
    -- Campaign creation settings
    auto_create_campaigns boolean DEFAULT true,
    default_offer_id bigint REFERENCES public.offers(id) ON DELETE SET NULL,
    icp_score_threshold integer DEFAULT 70,            -- Min ICP score to auto-queue
    max_leads_per_campaign integer DEFAULT 50,          -- Max leads per auto-created campaign
    max_active_campaigns integer DEFAULT 3,             -- Max concurrent auto campaigns
    
    -- Sequence settings
    default_touches integer DEFAULT 3,                  -- Number of email touches per lead
    default_objective text DEFAULT 'meetings',          -- meetings, demos, trials, awareness
    sequence_spacing_days integer[] DEFAULT '{0,3,7}',  -- Days between touches
    
    -- Daily caps (safety rails)
    max_new_leads_per_day integer DEFAULT 50,           -- Cap on new leads entering system daily
    max_emails_per_day integer DEFAULT 20,              -- Cap on total emails sent per day (per inbox)
    leads_discovered_today integer DEFAULT 0,
    leads_discovered_today_date date,
    
    -- Booking settings
    booking_link text,                                  -- Calendar/scheduling link (Calendly, Cal.com, etc.)
    auto_send_booking_link boolean DEFAULT true,        -- Auto-send booking link when intent detected
    
    -- Status tracking
    total_leads_discovered integer DEFAULT 0,
    total_campaigns_created integer DEFAULT 0,
    total_emails_sent integer DEFAULT 0,
    total_meetings_booked integer DEFAULT 0,
    
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.autopilot_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view their own autopilot settings" ON public.autopilot_settings;
CREATE POLICY "Users can view their own autopilot settings" ON public.autopilot_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own autopilot settings" ON public.autopilot_settings;
CREATE POLICY "Users can insert their own autopilot settings" ON public.autopilot_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own autopilot settings" ON public.autopilot_settings;
CREATE POLICY "Users can update their own autopilot settings" ON public.autopilot_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own autopilot settings" ON public.autopilot_settings;
CREATE POLICY "Users can delete their own autopilot settings" ON public.autopilot_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_autopilot_settings_user_id ON public.autopilot_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_settings_enabled ON public.autopilot_settings(enabled) WHERE enabled = true;

-- Track which leads were auto-discovered (prevent re-discovery)
CREATE TABLE IF NOT EXISTS public.autopilot_discovered_leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id bigint REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    icp_profile_id bigint REFERENCES public.icp_profiles(id) ON DELETE SET NULL,
    discovery_source text DEFAULT 'apollo',
    apollo_id text,                                    -- Dedup key from Apollo
    discovered_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    auto_campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
    
    UNIQUE(user_id, apollo_id)                         -- Prevent duplicate discoveries
);

ALTER TABLE public.autopilot_discovered_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own discovered leads" ON public.autopilot_discovered_leads;
CREATE POLICY "Users can view their own discovered leads" ON public.autopilot_discovered_leads
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own discovered leads" ON public.autopilot_discovered_leads;
CREATE POLICY "Users can insert their own discovered leads" ON public.autopilot_discovered_leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_autopilot_discovered_user ON public.autopilot_discovered_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_autopilot_discovered_apollo ON public.autopilot_discovered_leads(user_id, apollo_id);

-- Add source column to outreach_campaigns to distinguish auto vs manual
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Helper RPC to increment meetings counter (called from webhook, fail-safe)
CREATE OR REPLACE FUNCTION increment_autopilot_meetings(p_user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.autopilot_settings
    SET total_meetings_booked = COALESCE(total_meetings_booked, 0) + 1,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service role policy for cron access (bypasses RLS)
DROP POLICY IF EXISTS "Service role full access to autopilot_settings" ON public.autopilot_settings;
CREATE POLICY "Service role full access to autopilot_settings" ON public.autopilot_settings
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to autopilot_discovered_leads" ON public.autopilot_discovered_leads;
CREATE POLICY "Service role full access to autopilot_discovered_leads" ON public.autopilot_discovered_leads
    FOR ALL USING (true) WITH CHECK (true);

-- Learning loop: store traffic allocation weights per angle
ALTER TABLE public.autopilot_settings ADD COLUMN IF NOT EXISTS angle_traffic_weights JSONB DEFAULT '{}'::jsonb;

-- AI insights table for storing learning loop + performance loop insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    insight_type TEXT NOT NULL,  -- 'daily_performance_review', 'learning_loop', etc.
    summary TEXT DEFAULT '',
    recommendations JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own insights" ON public.ai_insights;
CREATE POLICY "Users can view their own insights" ON public.ai_insights
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to ai_insights" ON public.ai_insights;
CREATE POLICY "Service role full access to ai_insights" ON public.ai_insights
    FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights(user_id, insight_type);

COMMENT ON TABLE public.autopilot_settings IS 'User configuration for the autonomous AI SDR agent';
COMMENT ON TABLE public.autopilot_discovered_leads IS 'Tracks leads auto-discovered by the autopilot agent to prevent duplicates';
COMMENT ON TABLE public.ai_insights IS 'AI-generated insights from learning loop and performance analysis';
