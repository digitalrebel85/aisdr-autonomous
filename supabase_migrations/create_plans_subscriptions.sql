-- Create plans and subscriptions system
-- This migration creates the pricing tiers and subscription management

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)  -- One subscription per user
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, metric_name, period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON public.usage_tracking(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_metric ON public.usage_tracking(metric_name);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (public pricing)
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;
CREATE POLICY "Plans are viewable by everyone" ON public.plans
    FOR SELECT USING (true);

-- Subscriptions are only viewable by the user
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking is only viewable by the user
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Insert the pricing plans
-- Clear existing plans first
DELETE FROM public.plans WHERE slug IN ('research', 'starter', 'pro', 'scale', 'enterprise');

-- Research tier - £97/month - Research & sequences only, no sending
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
(
    'Research',
    'research',
    'AI-powered lead research and email copywriting - no sending',
    97.00,
    87.00,
    '["Up to 1,000 leads/month", "1 ICP", "2 messaging angles", "AI lead research & enrichment", "AI-written email sequences", "Export sequences to your tools", "Basic analytics"]'::jsonb,
    '{
        "prospects_per_month": 1000,
        "emails_per_month": 0,
        "connected_inboxes": 0,
        "team_members": 1,
        "campaigns": 5,
        "icps": 1,
        "angles_per_icp": 2,
        "can_send_emails": false,
        "can_connect_inbox": false,
        "can_track_replies": false,
        "has_crm_sync": false,
        "has_calendar_booking": false
    }'::jsonb,
    1
),
-- Starter tier - £149/month - Full outbound with sending
(
    'Starter',
    'starter',
    'Full AI outbound with email sending',
    149.00,
    134.00,
    '["Up to 1,000 prospects/month", "1 ICP", "2 messaging angles", "AI-written emails + follow-ups", "Email sequences with sending", "Single inbox connection", "Reply classification (basic)", "CRM sync", "Guardrails enforced"]'::jsonb,
    '{
        "prospects_per_month": 1000,
        "emails_per_month": 5000,
        "connected_inboxes": 1,
        "team_members": 1,
        "campaigns": 10,
        "icps": 1,
        "angles_per_icp": 2,
        "can_send_emails": true,
        "can_connect_inbox": true,
        "can_track_replies": true,
        "has_crm_sync": true,
        "has_calendar_booking": false
    }'::jsonb,
    2
),
-- Pro tier - £499/month - For lean sales teams
(
    'Pro',
    'pro',
    'Buyer-aware outbound with real control',
    499.00,
    449.00,
    '["Up to 5,000 prospects/month", "3 ICPs", "5 angles per ICP", "Buyer-aware sequences", "Reply routing + calendar booking", "A/B testing (angles, not spam)", "Up to 3 inboxes", "Advanced analytics", "Priority support"]'::jsonb,
    '{
        "prospects_per_month": 5000,
        "emails_per_month": 25000,
        "connected_inboxes": 3,
        "team_members": 5,
        "campaigns": -1,
        "icps": 3,
        "angles_per_icp": 5,
        "can_send_emails": true,
        "can_connect_inbox": true,
        "can_track_replies": true,
        "has_crm_sync": true,
        "has_calendar_booking": true,
        "has_ab_testing": true,
        "has_advanced_analytics": true
    }'::jsonb,
    3
),
-- Scale tier - £899/month - For serious operators & agencies
(
    'Scale',
    'scale',
    'Precision at scale, not chaos',
    899.00,
    809.00,
    '["Up to 10,000 prospects/month", "Unlimited ICPs & angles", "Custom AI rules", "AI reply generation", "Audit logs + safety controls", "API access", "White-label", "Dedicated success manager"]'::jsonb,
    '{
        "prospects_per_month": 10000,
        "emails_per_month": -1,
        "connected_inboxes": -1,
        "team_members": -1,
        "campaigns": -1,
        "icps": -1,
        "angles_per_icp": -1,
        "can_send_emails": true,
        "can_connect_inbox": true,
        "can_track_replies": true,
        "has_crm_sync": true,
        "has_calendar_booking": true,
        "has_ab_testing": true,
        "has_advanced_analytics": true,
        "has_ai_reply_generation": true,
        "has_api_access": true,
        "has_white_label": true,
        "has_audit_logs": true
    }'::jsonb,
    4
);

-- Function to get user subscription with plan details
DROP FUNCTION IF EXISTS get_user_subscription(UUID) CASCADE;
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    plan_slug TEXT,
    status TEXT,
    billing_cycle TEXT,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    limits JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subscription_id,
        p.name as plan_name,
        p.slug as plan_slug,
        s.status,
        s.billing_cycle,
        s.current_period_end,
        s.trial_end,
        p.limits
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
DROP FUNCTION IF EXISTS check_usage_limit(UUID, TEXT, INTEGER) CASCADE;
CREATE OR REPLACE FUNCTION check_usage_limit(
    user_uuid UUID,
    metric TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
    v_limit INTEGER;
    v_current_usage INTEGER;
    v_period_start DATE;
    v_period_end DATE;
    v_allowed BOOLEAN;
BEGIN
    -- Get current billing period
    v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
    v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Get user's plan limit for this metric
    SELECT (p.limits->>metric)::INTEGER INTO v_limit
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing');
    
    -- If no subscription or limit not found, deny
    IF v_limit IS NULL THEN
        RETURN jsonb_build_object('allowed', false, 'usage', 0, 'limit', 0);
    END IF;
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1);
    END IF;
    
    -- Get current usage
    SELECT COALESCE(metric_value, 0) INTO v_current_usage
    FROM public.usage_tracking
    WHERE user_id = user_uuid
    AND metric_name = metric
    AND period_start = v_period_start;
    
    IF v_current_usage IS NULL THEN
        v_current_usage := 0;
    END IF;
    
    -- Check if allowed
    v_allowed := (v_current_usage + increment_by) <= v_limit;
    
    -- If allowed and incrementing, update usage
    IF v_allowed AND increment_by > 0 THEN
        INSERT INTO public.usage_tracking (user_id, metric_name, metric_value, period_start, period_end)
        VALUES (user_uuid, metric, increment_by, v_period_start, v_period_end)
        ON CONFLICT (user_id, metric_name, period_start)
        DO UPDATE SET 
            metric_value = usage_tracking.metric_value + increment_by,
            updated_at = now();
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'usage', v_current_usage,
        'limit', v_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action based on plan feature
DROP FUNCTION IF EXISTS can_use_feature(UUID, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION can_use_feature(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_can_use BOOLEAN;
BEGIN
    SELECT (p.limits->>feature_name)::BOOLEAN INTO v_can_use
    FROM public.subscriptions s
    JOIN public.plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing');
    
    RETURN COALESCE(v_can_use, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_feature(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON TABLE public.plans IS 'Pricing plans with features and limits';
COMMENT ON TABLE public.subscriptions IS 'User subscriptions to plans';
COMMENT ON TABLE public.usage_tracking IS 'Monthly usage tracking per user per metric';
