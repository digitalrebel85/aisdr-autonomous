-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused')),
  billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One subscription per user for now
);

-- Create usage_tracking table for plan limits
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW()),
  period_end TIMESTAMP WITH TIME ZONE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_name, period_start)
);

-- Insert default plans
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, limits) VALUES
(
  'Startup',
  'startup',
  'Perfect for small teams getting started with AI sales development',
  99.00,
  990.00,
  '["AI-powered prospect discovery", "Up to 1,000 prospects/month", "Email personalization", "Basic analytics", "Email support"]'::jsonb,
  '{"prospects_per_month": 1000, "emails_per_month": 500, "connected_inboxes": 1, "team_members": 2}'::jsonb
),
(
  'Professional',
  'professional',
  'Advanced features for growing sales teams',
  299.00,
  2990.00,
  '["Everything in Startup", "Up to 5,000 prospects/month", "Multi-channel campaigns", "Advanced analytics", "A/B testing", "Priority support", "Integrations"]'::jsonb,
  '{"prospects_per_month": 5000, "emails_per_month": 2500, "connected_inboxes": 5, "team_members": 10, "campaigns": 50}'::jsonb
),
(
  'Enterprise',
  'enterprise',
  'Custom solution for large organizations',
  NULL,
  NULL,
  '["Everything in Professional", "Unlimited prospects", "Custom integrations", "Dedicated CSM", "SLA guarantees", "Advanced security", "Custom onboarding"]'::jsonb,
  '{"prospects_per_month": -1, "emails_per_month": -1, "connected_inboxes": -1, "team_members": -1, "campaigns": -1}'::jsonb
);

-- Add RLS policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (for pricing page)
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (is_active = true);

-- Users can only see their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own usage
CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (you'll need to set admin role)
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage subscriptions" ON subscriptions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name VARCHAR,
  plan_slug VARCHAR,
  status VARCHAR,
  billing_cycle VARCHAR,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  limits JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    p.name,
    p.slug,
    s.status,
    s.billing_cycle,
    s.current_period_end,
    s.trial_end,
    p.limits
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION check_usage_limit(
  user_uuid UUID,
  metric VARCHAR,
  increment_by INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_usage INTEGER;
  user_limit INTEGER;
  result JSONB;
BEGIN
  -- Get user's plan limits
  SELECT (p.limits->>metric)::INTEGER INTO user_limit
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = user_uuid AND s.status = 'active';
  
  -- If limit is -1, it's unlimited
  IF user_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'usage', 0, 'limit', -1);
  END IF;
  
  -- Get current usage for this period
  SELECT COALESCE(metric_value, 0) INTO current_usage
  FROM usage_tracking
  WHERE user_id = user_uuid 
    AND metric_name = metric
    AND period_start = DATE_TRUNC('month', NOW());
  
  -- Check if adding increment would exceed limit
  IF (current_usage + increment_by) > user_limit THEN
    RETURN jsonb_build_object('allowed', false, 'usage', current_usage, 'limit', user_limit);
  END IF;
  
  -- Update usage
  INSERT INTO usage_tracking (user_id, metric_name, metric_value)
  VALUES (user_uuid, metric, current_usage + increment_by)
  ON CONFLICT (user_id, metric_name, period_start)
  DO UPDATE SET 
    metric_value = usage_tracking.metric_value + increment_by,
    updated_at = NOW();
  
  RETURN jsonb_build_object('allowed', true, 'usage', current_usage + increment_by, 'limit', user_limit);
END;
$$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
