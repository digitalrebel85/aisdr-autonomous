-- Strategic Follow-up System Database Schema
-- This migration adds comprehensive tracking for strategic follow-ups

-- Add strategic follow-up columns to leads table
DO $$ 
BEGIN
    -- Add engagement tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'last_outreach_date') THEN
        ALTER TABLE leads ADD COLUMN last_outreach_date TIMESTAMPTZ;
        COMMENT ON COLUMN leads.last_outreach_date IS 'Date of last outreach email sent to this lead';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'last_reply_date') THEN
        ALTER TABLE leads ADD COLUMN last_reply_date TIMESTAMPTZ;
        COMMENT ON COLUMN leads.last_reply_date IS 'Date of last reply received from this lead';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'engagement_level') THEN
        ALTER TABLE leads ADD COLUMN engagement_level TEXT DEFAULT 'cold';
        COMMENT ON COLUMN leads.engagement_level IS 'Current engagement level: cold, warm, hot, interested, not_interested';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'call_booked') THEN
        ALTER TABLE leads ADD COLUMN call_booked BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN leads.call_booked IS 'Whether the lead has booked a call';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'call_completed') THEN
        ALTER TABLE leads ADD COLUMN call_completed BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN leads.call_completed IS 'Whether the call has been completed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'follow_up_count') THEN
        ALTER TABLE leads ADD COLUMN follow_up_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN leads.follow_up_count IS 'Number of follow-up emails sent';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'next_follow_up_date') THEN
        ALTER TABLE leads ADD COLUMN next_follow_up_date TIMESTAMPTZ;
        COMMENT ON COLUMN leads.next_follow_up_date IS 'Calculated date for next strategic follow-up';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'follow_up_reason') THEN
        ALTER TABLE leads ADD COLUMN follow_up_reason TEXT;
        COMMENT ON COLUMN leads.follow_up_reason IS 'Reason for next follow-up: no_reply, interested_no_call, conversation_stalled, etc.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'timezone') THEN
        ALTER TABLE leads ADD COLUMN timezone TEXT DEFAULT 'UTC';
        COMMENT ON COLUMN leads.timezone IS 'Lead timezone for scheduling follow-ups';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'do_not_follow_up') THEN
        ALTER TABLE leads ADD COLUMN do_not_follow_up BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN leads.do_not_follow_up IS 'Whether to exclude this lead from automatic follow-ups';
    END IF;
END $$;

-- Create strategic follow-up events table
CREATE TABLE IF NOT EXISTS public.follow_up_events (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'follow_up_sent', 'follow_up_scheduled', 'follow_up_skipped'
    reason TEXT NOT NULL, -- 'no_reply_3_days', 'interested_no_call', 'conversation_stalled', etc.
    follow_up_number INTEGER NOT NULL, -- Which follow-up this is (1st, 2nd, etc.)
    message_id TEXT, -- Nylas message ID if email was sent
    scheduled_for TIMESTAMPTZ, -- When this follow-up was scheduled for
    context JSONB -- Additional context for the follow-up
);

-- Enable RLS for follow_up_events
ALTER TABLE public.follow_up_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follow-up events" ON public.follow_up_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service roles can insert follow-up events" ON public.follow_up_events
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_date 
ON leads(next_follow_up_date) 
WHERE next_follow_up_date IS NOT NULL AND do_not_follow_up = FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_engagement_level 
ON leads(engagement_level);

CREATE INDEX IF NOT EXISTS idx_leads_last_outreach_date 
ON leads(last_outreach_date);

CREATE INDEX IF NOT EXISTS idx_leads_last_reply_date 
ON leads(last_reply_date);

CREATE INDEX IF NOT EXISTS idx_follow_up_events_lead_id 
ON follow_up_events(lead_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_events_scheduled_for 
ON follow_up_events(scheduled_for);

-- Create strategic follow-up calculation function
CREATE OR REPLACE FUNCTION calculate_strategic_follow_up(lead_id BIGINT)
RETURNS TABLE(
    should_follow_up BOOLEAN,
    follow_up_date TIMESTAMPTZ,
    reason TEXT,
    priority INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    lead_record RECORD;
    last_sent_email RECORD;
    last_reply RECORD;
    days_since_outreach INTEGER;
    days_since_reply INTEGER;
    follow_up_result RECORD;
BEGIN
    -- Get lead information
    SELECT * INTO lead_record 
    FROM leads l 
    WHERE l.id = lead_id;
    
    -- Skip if lead is marked do not follow up
    IF lead_record.do_not_follow_up THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'do_not_follow_up', 0;
        RETURN;
    END IF;
    
    -- Get last sent email
    SELECT created_at INTO last_sent_email
    FROM sent_emails se
    WHERE se.lead_id = lead_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get last reply
    SELECT created_at INTO last_reply
    FROM replies r
    WHERE r.lead_id = lead_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate days since last outreach
    days_since_outreach := CASE 
        WHEN last_sent_email.created_at IS NOT NULL 
        THEN EXTRACT(DAYS FROM now() - last_sent_email.created_at)::INTEGER
        ELSE 999 
    END;
    
    -- Calculate days since last reply
    days_since_reply := CASE 
        WHEN last_reply.created_at IS NOT NULL 
        THEN EXTRACT(DAYS FROM now() - last_reply.created_at)::INTEGER
        ELSE 999 
    END;
    
    -- Strategic follow-up logic
    CASE 
        -- High priority: Interested but no call booked (2 days)
        WHEN lead_record.engagement_level = 'interested' 
             AND NOT lead_record.call_booked 
             AND days_since_outreach >= 2 THEN
            RETURN QUERY SELECT 
                TRUE, 
                now() + INTERVAL '1 day',
                'interested_no_call',
                10;
        
        -- High priority: Had conversation but stalled (3 days)
        WHEN lead_record.engagement_level IN ('warm', 'hot') 
             AND last_reply.created_at IS NOT NULL
             AND days_since_reply >= 3 
             AND days_since_outreach >= 2 THEN
            RETURN QUERY SELECT 
                TRUE, 
                now() + INTERVAL '1 day',
                'conversation_stalled',
                9;
        
        -- Medium priority: No reply after initial outreach (5 days)
        WHEN last_reply.created_at IS NULL 
             AND days_since_outreach >= 5 
             AND lead_record.follow_up_count < 3 THEN
            RETURN QUERY SELECT 
                TRUE, 
                now() + INTERVAL '1 day',
                'no_reply_initial',
                7;
        
        -- Medium priority: Warm lead gone quiet (7 days)
        WHEN lead_record.engagement_level = 'warm'
             AND days_since_reply >= 7 
             AND days_since_outreach >= 3 THEN
            RETURN QUERY SELECT 
                TRUE, 
                now() + INTERVAL '2 days',
                'warm_lead_quiet',
                6;
        
        -- Low priority: Cold follow-up (14 days)
        WHEN lead_record.engagement_level = 'cold'
             AND days_since_outreach >= 14 
             AND lead_record.follow_up_count < 2 THEN
            RETURN QUERY SELECT 
                TRUE, 
                now() + INTERVAL '3 days',
                'cold_follow_up',
                3;
        
        -- No follow-up needed
        ELSE
            RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 'no_follow_up_needed', 0;
    END CASE;
END;
$$;

-- Create function to update lead engagement based on replies
CREATE OR REPLACE FUNCTION update_lead_engagement_from_reply(
    lead_id BIGINT,
    reply_action TEXT,
    reply_sentiment TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE leads 
    SET 
        last_reply_date = now(),
        engagement_level = CASE 
            WHEN reply_action = 'schedule_call' THEN 'interested'
            WHEN reply_action = 'reply' AND reply_sentiment = 'positive' THEN 'hot'
            WHEN reply_action = 'reply' AND reply_sentiment = 'neutral' THEN 'warm'
            WHEN reply_action = 'not_interested' THEN 'not_interested'
            ELSE engagement_level
        END,
        call_booked = CASE 
            WHEN reply_action = 'schedule_call' THEN TRUE
            ELSE call_booked
        END,
        do_not_follow_up = CASE 
            WHEN reply_action = 'not_interested' THEN TRUE
            ELSE do_not_follow_up
        END
    WHERE id = lead_id;
END;
$$;

COMMENT ON TABLE follow_up_events IS 'Tracks strategic follow-up events and scheduling';
COMMENT ON FUNCTION calculate_strategic_follow_up IS 'Calculates whether a lead needs strategic follow-up and when';
COMMENT ON FUNCTION update_lead_engagement_from_reply IS 'Updates lead engagement level based on reply analysis';
