-- Migration: Free Trial System
-- Description: Creates tables and functions to manage free trial limits and usage tracking

-- Create user_trials table
CREATE TABLE IF NOT EXISTS user_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    leads_enriched INTEGER NOT NULL DEFAULT 0,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'converted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('starter', 'professional', 'growth', 'enterprise')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create usage_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('lead_enriched', 'email_sent', 'reply_received')),
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_status ON user_trials(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- Function to increment leads enriched count
CREATE OR REPLACE FUNCTION increment_leads_enriched(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE user_trials
    SET 
        leads_enriched = leads_enriched + p_count,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the usage
    INSERT INTO usage_logs (user_id, action_type, metadata)
    VALUES (p_user_id, 'lead_enriched', jsonb_build_object('count', p_count));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment emails sent count
CREATE OR REPLACE FUNCTION increment_emails_sent(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE user_trials
    SET 
        emails_sent = emails_sent + p_count,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log the usage
    INSERT INTO usage_logs (user_id, action_type, metadata)
    VALUES (p_user_id, 'email_sent', jsonb_build_object('count', p_count));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is within trial limits
CREATE OR REPLACE FUNCTION check_trial_limits(p_user_id UUID)
RETURNS TABLE (
    can_enrich_leads BOOLEAN,
    can_send_emails BOOLEAN,
    days_remaining INTEGER,
    leads_remaining INTEGER,
    emails_remaining INTEGER
) AS $$
DECLARE
    v_trial RECORD;
    v_max_days INTEGER := 14;
    v_max_leads INTEGER := 50;
    v_max_emails INTEGER := 100;
BEGIN
    SELECT * INTO v_trial
    FROM user_trials
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trial not found for user %', p_user_id;
    END IF;
    
    RETURN QUERY SELECT
        (v_trial.status = 'active' AND 
         v_trial.end_date > NOW() AND 
         v_trial.leads_enriched < v_max_leads) AS can_enrich_leads,
        (v_trial.status = 'active' AND 
         v_trial.end_date > NOW() AND 
         v_trial.emails_sent < v_max_emails) AS can_send_emails,
        GREATEST(0, EXTRACT(DAY FROM v_trial.end_date - NOW())::INTEGER) AS days_remaining,
        GREATEST(0, v_max_leads - v_trial.leads_enriched) AS leads_remaining,
        GREATEST(0, v_max_emails - v_trial.emails_sent) AS emails_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire trials (run via cron job)
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE user_trials
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE status = 'active'
    AND (
        end_date < NOW() OR
        leads_enriched >= 50 OR
        emails_sent >= 100
    );
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_trials_updated_at
    BEFORE UPDATE ON user_trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own trial data
CREATE POLICY "Users can view own trial"
    ON user_trials FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only view their own subscription data
CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage logs"
    ON usage_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can manage all data
CREATE POLICY "Service role can manage trials"
    ON user_trials FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage usage logs"
    ON usage_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON user_trials TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON usage_logs TO authenticated;
GRANT EXECUTE ON FUNCTION increment_leads_enriched TO authenticated;
GRANT EXECUTE ON FUNCTION increment_emails_sent TO authenticated;
GRANT EXECUTE ON FUNCTION check_trial_limits TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_trials IS 'Tracks free trial status and usage for each user';
COMMENT ON TABLE subscriptions IS 'Stores paid subscription information for users';
COMMENT ON TABLE usage_logs IS 'Detailed log of all usage actions for analytics and auditing';
COMMENT ON FUNCTION increment_leads_enriched IS 'Safely increments the lead enrichment counter for a user';
COMMENT ON FUNCTION increment_emails_sent IS 'Safely increments the email sent counter for a user';
COMMENT ON FUNCTION check_trial_limits IS 'Returns current trial limits and remaining quota for a user';
COMMENT ON FUNCTION expire_trials IS 'Batch expires trials that have exceeded time or usage limits';

