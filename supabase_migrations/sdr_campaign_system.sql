-- ============================================================================
-- SDR-STYLE CAMPAIGN SYSTEM - Database Schema
-- AI-driven multi-touch campaigns with user override capability
-- ============================================================================

-- ============================================================================
-- 1. CAMPAIGN SEQUENCES (Multi-touch campaign templates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_sequences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Campaign Strategy
    objective TEXT NOT NULL CHECK (objective IN ('meetings', 'demos', 'trials', 'sales', 'awareness')),
    icp_profile_id BIGINT REFERENCES public.icp_profiles(id) ON DELETE SET NULL,
    
    -- AI Recommendations (can be overridden by user)
    messaging_framework TEXT NOT NULL DEFAULT 'AIDA' CHECK (messaging_framework IN ('AIDA', 'PAS', 'BAB', '4Ps', 'FAB', 'custom')),
    ai_recommended_framework TEXT,
    framework_reasoning TEXT,
    
    total_touches INTEGER NOT NULL DEFAULT 3 CHECK (total_touches BETWEEN 1 AND 10),
    ai_recommended_touches INTEGER,
    
    -- Performance
    campaigns_using INTEGER DEFAULT 0,
    avg_reply_rate DECIMAL(5,2),
    avg_meeting_rate DECIMAL(5,2),
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. SEQUENCE STEPS (Individual touchpoints)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sequence_steps (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL REFERENCES public.campaign_sequences(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    step_number INTEGER NOT NULL CHECK (step_number >= 1),
    step_type TEXT NOT NULL DEFAULT 'email' CHECK (step_type IN ('email', 'linkedin', 'phone', 'wait')),
    
    -- Timing
    delay_days INTEGER NOT NULL DEFAULT 0 CHECK (delay_days >= 0),
    
    -- Email Content
    subject_line_template TEXT,
    email_body_template TEXT,
    ai_generation_prompt TEXT,
    
    -- Conditional Logic
    conditional_logic JSONB DEFAULT '{}'::jsonb,
    
    -- Performance
    sent_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(sequence_id, step_number)
);

-- ============================================================================
-- 3. CAMPAIGN SEGMENTS (Cohorts within campaigns)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_segments (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    segment_name TEXT NOT NULL,
    segment_description TEXT,
    
    -- Segmentation criteria (JSON)
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Which sequence this segment uses
    sequence_id BIGINT REFERENCES public.campaign_sequences(id) ON DELETE SET NULL,
    
    -- Performance
    lead_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    meeting_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. CAMPAIGN ANALYTICS (Performance tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_analytics (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily metrics
    date DATE NOT NULL,
    
    -- Counts
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    meetings_booked INTEGER DEFAULT 0,
    
    -- Rates
    open_rate DECIMAL(5,2),
    reply_rate DECIMAL(5,2),
    meeting_rate DECIMAL(5,2),
    
    -- By segment
    segment_id BIGINT REFERENCES public.campaign_segments(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(campaign_id, date, segment_id)
);

-- ============================================================================
-- 5. MESSAGING FRAMEWORKS (Templates for AI)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messaging_frameworks (
    id BIGSERIAL PRIMARY KEY,
    
    framework_name TEXT NOT NULL UNIQUE,
    framework_code TEXT NOT NULL UNIQUE, -- 'AIDA', 'PAS', etc.
    description TEXT NOT NULL,
    
    -- Framework structure
    structure JSONB NOT NULL,
    -- Example for AIDA: {"steps": ["Attention", "Interest", "Desire", "Action"], "focus": "gradual_persuasion"}
    
    -- AI Prompts for each step
    ai_prompts JSONB NOT NULL,
    -- Example: {"step_1": "Create attention-grabbing opening...", "step_2": "Build interest with..."}
    
    -- Best use cases
    best_for_objectives TEXT[] DEFAULT ARRAY['meetings'],
    best_for_personas TEXT[],
    
    -- Examples
    example_emails JSONB DEFAULT '[]'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaign_sequences_user ON public.campaign_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_status ON public.campaign_sequences(status);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON public.sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_campaign_segments_campaign ON public.campaign_segments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign ON public.campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON public.campaign_analytics(date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_sequences
CREATE POLICY "Users can view own sequences" ON public.campaign_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sequences" ON public.campaign_sequences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sequences" ON public.campaign_sequences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sequences" ON public.campaign_sequences FOR DELETE USING (auth.uid() = user_id);

-- Policies for sequence_steps
CREATE POLICY "Users can view own steps" ON public.sequence_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own steps" ON public.sequence_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps" ON public.sequence_steps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own steps" ON public.sequence_steps FOR DELETE USING (auth.uid() = user_id);

-- Policies for campaign_segments
CREATE POLICY "Users can view own segments" ON public.campaign_segments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own segments" ON public.campaign_segments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own segments" ON public.campaign_segments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own segments" ON public.campaign_segments FOR DELETE USING (auth.uid() = user_id);

-- Policies for campaign_analytics
CREATE POLICY "Users can view own analytics" ON public.campaign_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own analytics" ON public.campaign_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messaging frameworks are public (read-only for users)
ALTER TABLE public.messaging_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view frameworks" ON public.messaging_frameworks FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA - Messaging Frameworks
-- ============================================================================

INSERT INTO public.messaging_frameworks (framework_name, framework_code, description, structure, ai_prompts, best_for_objectives) VALUES
('AIDA Framework', 'AIDA', 'Attention, Interest, Desire, Action - Classic persuasion model', 
 '{"steps": ["Attention", "Interest", "Desire", "Action"], "focus": "gradual_persuasion"}'::jsonb,
 '{"attention": "Create a compelling hook that grabs attention", "interest": "Build interest by highlighting relevant pain points", "desire": "Create desire by showing the transformation", "action": "Clear call-to-action"}'::jsonb,
 ARRAY['meetings', 'demos', 'sales']),

('PAS Framework', 'PAS', 'Problem, Agitate, Solution - Direct problem-solving approach',
 '{"steps": ["Problem", "Agitate", "Solution"], "focus": "pain_point_driven"}'::jsonb,
 '{"problem": "Identify the specific problem they face", "agitate": "Amplify the pain and consequences", "solution": "Present your solution as the answer"}'::jsonb,
 ARRAY['meetings', 'trials', 'sales']),

('BAB Framework', 'BAB', 'Before, After, Bridge - Transformation storytelling',
 '{"steps": ["Before", "After", "Bridge"], "focus": "transformation"}'::jsonb,
 '{"before": "Describe their current painful situation", "after": "Paint picture of ideal future state", "bridge": "Show how you get them there"}'::jsonb,
 ARRAY['demos', 'trials', 'awareness']),

('4Ps Framework', '4Ps', 'Picture, Promise, Prove, Push - Comprehensive persuasion',
 '{"steps": ["Picture", "Promise", "Prove", "Push"], "focus": "comprehensive"}'::jsonb,
 '{"picture": "Paint vivid picture of their situation", "promise": "Make clear promise of outcome", "prove": "Provide proof and credibility", "push": "Push to action with urgency"}'::jsonb,
 ARRAY['sales', 'demos']),

('FAB Framework', 'FAB', 'Features, Advantages, Benefits - Product-focused approach',
 '{"steps": ["Features", "Advantages", "Benefits"], "focus": "product_value"}'::jsonb,
 '{"features": "Highlight key product features", "advantages": "Explain advantages over alternatives", "benefits": "Connect to real business benefits"}'::jsonb,
 ARRAY['trials', 'demos', 'awareness'])
ON CONFLICT (framework_code) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate campaign performance
CREATE OR REPLACE FUNCTION calculate_campaign_performance(p_campaign_id BIGINT)
RETURNS TABLE (
    total_sent INTEGER,
    total_replied INTEGER,
    total_meetings INTEGER,
    reply_rate DECIMAL(5,2),
    meeting_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_sent,
        COUNT(*) FILTER (WHERE status = 'replied')::INTEGER as total_replied,
        COUNT(*) FILTER (WHERE status = 'meeting_booked')::INTEGER as total_meetings,
        ROUND((COUNT(*) FILTER (WHERE status = 'replied')::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2) as reply_rate,
        ROUND((COUNT(*) FILTER (WHERE status = 'meeting_booked')::DECIMAL / NULLIF(COUNT(*), 0) * 100), 2) as meeting_rate
    FROM outreach_queue
    WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
