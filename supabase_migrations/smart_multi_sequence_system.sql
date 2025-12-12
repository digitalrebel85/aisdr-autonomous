-- =====================================================
-- SMART MULTI-SEQUENCE SYSTEM
-- Industry best practices: 5 touches max, 90-day wait, max 3 sequences
-- =====================================================

-- Add sequence tracking to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS sequence_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sequence_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_contact_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'in_sequence', 'cold', 'warm', 'hot', 'replied', 'meeting_booked', 'unsubscribed', 'bounced', 'spam_reported', 'do_not_contact')),
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS spam_reported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS meeting_booked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ;

-- Add sequence step tracking to outreach_queue
ALTER TABLE public.outreach_queue
ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sequence_id BIGINT REFERENCES campaign_sequences(id),
ADD COLUMN IF NOT EXISTS auto_stop_reason TEXT,
ADD COLUMN IF NOT EXISTS is_re_engagement BOOLEAN DEFAULT false;

-- Add sequence metadata to campaigns
ALTER TABLE public.outreach_campaigns
ADD COLUMN IF NOT EXISTS sequence_id BIGINT REFERENCES campaign_sequences(id),
ADD COLUMN IF NOT EXISTS sequence_type TEXT DEFAULT 'initial' CHECK (sequence_type IN ('initial', 're_engagement', 'nurture')),
ADD COLUMN IF NOT EXISTS parent_campaign_id UUID REFERENCES outreach_campaigns(id),
ADD COLUMN IF NOT EXISTS auto_stop_enabled BOOLEAN DEFAULT true;

-- =====================================================
-- SEQUENCE EXECUTION LOG
-- Track every sequence execution for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sequence_executions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
    sequence_id BIGINT REFERENCES campaign_sequences(id) ON DELETE SET NULL,
    
    -- Execution metadata
    sequence_type TEXT NOT NULL CHECK (sequence_type IN ('initial', 're_engagement', 'nurture')),
    sequence_number INTEGER NOT NULL, -- 1st, 2nd, 3rd sequence for this lead
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'failed')),
    stop_reason TEXT CHECK (stop_reason IN ('replied', 'meeting_booked', 'unsubscribed', 'spam_reported', 'bounced', 'completed', 'manual_stop', 'max_sequences_reached')),
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    
    -- Performance metrics
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sequence_executions_user ON sequence_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_lead ON sequence_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_executions_status ON sequence_executions(status);

-- RLS policies
ALTER TABLE public.sequence_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence executions"
    ON public.sequence_executions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequence executions"
    ON public.sequence_executions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequence executions"
    ON public.sequence_executions FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- SEQUENCE RULES TABLE
-- Define global and user-specific sequence rules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sequence_rules (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Initial sequence rules
    initial_max_touches INTEGER DEFAULT 5 CHECK (initial_max_touches BETWEEN 1 AND 7),
    initial_duration_days INTEGER DEFAULT 14 CHECK (initial_duration_days BETWEEN 1 AND 30),
    
    -- Re-engagement rules
    re_engagement_wait_days INTEGER DEFAULT 90 CHECK (re_engagement_wait_days >= 30),
    re_engagement_max_touches INTEGER DEFAULT 3 CHECK (re_engagement_max_touches BETWEEN 1 AND 5),
    re_engagement_duration_days INTEGER DEFAULT 10 CHECK (re_engagement_duration_days BETWEEN 1 AND 21),
    re_engagement_requires_trigger BOOLEAN DEFAULT true,
    
    -- Nurture rules
    nurture_wait_days INTEGER DEFAULT 180 CHECK (nurture_wait_days >= 90),
    nurture_frequency_days INTEGER DEFAULT 90 CHECK (nurture_frequency_days >= 30),
    
    -- Global limits
    max_sequences_per_lead INTEGER DEFAULT 3 CHECK (max_sequences_per_lead BETWEEN 1 AND 5),
    respect_unsubscribe BOOLEAN DEFAULT true,
    auto_stop_on_reply BOOLEAN DEFAULT true,
    auto_stop_on_meeting BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE public.sequence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence rules"
    ON public.sequence_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sequence rules"
    ON public.sequence_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sequence rules"
    ON public.sequence_rules FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if lead can receive new sequence
CREATE OR REPLACE FUNCTION can_start_new_sequence(
    p_lead_id BIGINT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_lead RECORD;
    v_rules RECORD;
    v_result JSONB;
BEGIN
    -- Get lead data
    SELECT * INTO v_lead FROM leads WHERE id = p_lead_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'lead_not_found');
    END IF;
    
    -- Get sequence rules
    SELECT * INTO v_rules FROM sequence_rules WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- Use defaults if no rules set
        v_rules := ROW(
            NULL, p_user_id, 5, 14, 90, 3, 10, true, 180, 90, 3, true, true, true, now(), now()
        )::sequence_rules;
    END IF;
    
    -- Check do not contact statuses
    IF v_lead.lead_status IN ('unsubscribed', 'spam_reported', 'do_not_contact') THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'do_not_contact', 'status', v_lead.lead_status);
    END IF;
    
    -- Check max sequences reached
    IF v_lead.sequence_count >= v_rules.max_sequences_per_lead THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'max_sequences_reached', 'count', v_lead.sequence_count);
    END IF;
    
    -- Check if currently in sequence
    IF v_lead.lead_status = 'in_sequence' THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'already_in_sequence');
    END IF;
    
    -- Check if replied or meeting booked
    IF v_lead.lead_status IN ('replied', 'meeting_booked') THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'already_engaged', 'status', v_lead.lead_status);
    END IF;
    
    -- Check wait period for re-engagement
    IF v_lead.sequence_count > 0 AND v_lead.last_sequence_date IS NOT NULL THEN
        IF v_lead.last_sequence_date + (v_rules.re_engagement_wait_days || ' days')::INTERVAL > now() THEN
            RETURN jsonb_build_object(
                'allowed', false, 
                'reason', 'wait_period_not_met',
                'next_contact_date', v_lead.last_sequence_date + (v_rules.re_engagement_wait_days || ' days')::INTERVAL
            );
        END IF;
    END IF;
    
    -- All checks passed
    RETURN jsonb_build_object('allowed', true, 'sequence_type', 
        CASE 
            WHEN v_lead.sequence_count = 0 THEN 'initial'
            WHEN v_lead.sequence_count < v_rules.max_sequences_per_lead THEN 're_engagement'
            ELSE 'nurture'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-stop sequence
CREATE OR REPLACE FUNCTION auto_stop_sequence(
    p_lead_id BIGINT,
    p_stop_reason TEXT
)
RETURNS VOID AS $$
DECLARE
    v_campaign_id BIGINT;
BEGIN
    -- Get active campaign for this lead
    SELECT DISTINCT campaign_id INTO v_campaign_id
    FROM outreach_queue
    WHERE lead_id = p_lead_id
    AND status IN ('queued', 'processing')
    LIMIT 1;
    
    IF v_campaign_id IS NOT NULL THEN
        -- Cancel all pending emails for this lead
        UPDATE outreach_queue
        SET 
            status = 'cancelled',
            auto_stop_reason = p_stop_reason,
            updated_at = now()
        WHERE lead_id = p_lead_id
        AND campaign_id = v_campaign_id
        AND status IN ('queued', 'processing');
        
        -- Update sequence execution
        UPDATE sequence_executions
        SET 
            status = 'stopped',
            stop_reason = p_stop_reason,
            stopped_at = now(),
            updated_at = now()
        WHERE lead_id = p_lead_id
        AND status = 'active';
        
        -- Update lead status
        UPDATE leads
        SET 
            lead_status = CASE 
                WHEN p_stop_reason = 'replied' THEN 'replied'
                WHEN p_stop_reason = 'meeting_booked' THEN 'meeting_booked'
                WHEN p_stop_reason = 'unsubscribed' THEN 'unsubscribed'
                WHEN p_stop_reason = 'spam_reported' THEN 'spam_reported'
                WHEN p_stop_reason = 'bounced' THEN 'bounced'
                ELSE 'cold'
            END,
            updated_at = now()
        WHERE id = p_lead_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark sequence as completed
CREATE OR REPLACE FUNCTION complete_sequence(
    p_lead_id BIGINT,
    p_campaign_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    -- Update sequence execution
    UPDATE sequence_executions
    SET 
        status = 'completed',
        stop_reason = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE lead_id = p_lead_id
    AND campaign_id = p_campaign_id
    AND status = 'active';
    
    -- Update lead
    UPDATE leads
    SET 
        lead_status = 'cold',
        last_sequence_date = now(),
        next_contact_date = now() + INTERVAL '90 days', -- Default 90-day wait
        updated_at = now()
    WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamp trigger for sequence_executions
CREATE OR REPLACE FUNCTION update_sequence_executions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sequence_executions_timestamp
    BEFORE UPDATE ON sequence_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_sequence_executions_timestamp();

-- Auto-update timestamp trigger for sequence_rules
CREATE OR REPLACE FUNCTION update_sequence_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sequence_rules_timestamp
    BEFORE UPDATE ON sequence_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_sequence_rules_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE sequence_executions IS 'Tracks every sequence execution for analytics and compliance';
COMMENT ON TABLE sequence_rules IS 'User-configurable rules for sequence behavior and limits';
COMMENT ON FUNCTION can_start_new_sequence IS 'Checks if a lead is eligible for a new sequence based on rules';
COMMENT ON FUNCTION auto_stop_sequence IS 'Automatically stops a sequence when stop conditions are met';
COMMENT ON FUNCTION complete_sequence IS 'Marks a sequence as completed and sets next contact date';
