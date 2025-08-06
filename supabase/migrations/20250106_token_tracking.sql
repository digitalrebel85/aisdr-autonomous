-- Create token_usage table for AI token tracking
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'email_generation', 'reply_analysis', 'lead_enrichment', etc.
  provider VARCHAR(20) NOT NULL, -- 'openai', 'deepseek', 'anthropic'
  model VARCHAR(50) NOT NULL, -- 'gpt-4', 'deepseek-chat', etc.
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_operation_type ON token_usage(operation_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_provider_model ON token_usage(provider, model);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_date ON token_usage(user_id, created_at);

-- Add RLS policies
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own token usage
CREATE POLICY "Users can view their own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own token usage (for system tracking)
CREATE POLICY "Users can insert their own token usage" ON token_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_token_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER token_usage_updated_at
  BEFORE UPDATE ON token_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_token_usage_updated_at();

-- Create function to get monthly token usage summary
CREATE OR REPLACE FUNCTION get_monthly_token_usage(user_uuid UUID, target_year INTEGER DEFAULT NULL, target_month INTEGER DEFAULT NULL)
RETURNS TABLE (
  total_tokens BIGINT,
  input_tokens BIGINT,
  output_tokens BIGINT,
  total_cost DECIMAL,
  operation_breakdown JSONB,
  model_breakdown JSONB
) AS $$
DECLARE
  start_date DATE;
  end_date DATE;
BEGIN
  -- Default to current month if not specified
  IF target_year IS NULL THEN
    target_year := EXTRACT(YEAR FROM NOW());
  END IF;
  IF target_month IS NULL THEN
    target_month := EXTRACT(MONTH FROM NOW());
  END IF;
  
  -- Calculate date range
  start_date := DATE(target_year || '-' || target_month || '-01');
  end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day');
  
  RETURN QUERY
  WITH usage_data AS (
    SELECT 
      tu.operation_type,
      tu.provider,
      tu.model,
      tu.input_tokens,
      tu.output_tokens,
      tu.total_tokens,
      tu.cost_usd
    FROM token_usage tu
    WHERE tu.user_id = user_uuid
      AND tu.created_at >= start_date
      AND tu.created_at <= end_date + INTERVAL '1 day'
  ),
  totals AS (
    SELECT 
      COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
      COALESCE(SUM(input_tokens), 0)::BIGINT as input_tokens,
      COALESCE(SUM(output_tokens), 0)::BIGINT as output_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost
    FROM usage_data
  ),
  operation_breakdown AS (
    SELECT jsonb_object_agg(
      operation_type,
      jsonb_build_object(
        'total_tokens', SUM(total_tokens),
        'input_tokens', SUM(input_tokens),
        'output_tokens', SUM(output_tokens),
        'cost_usd', SUM(cost_usd),
        'count', COUNT(*)
      )
    ) as breakdown
    FROM usage_data
    GROUP BY operation_type
  ),
  model_breakdown AS (
    SELECT jsonb_object_agg(
      provider || '/' || model,
      jsonb_build_object(
        'total_tokens', SUM(total_tokens),
        'input_tokens', SUM(input_tokens),
        'output_tokens', SUM(output_tokens),
        'cost_usd', SUM(cost_usd),
        'count', COUNT(*)
      )
    ) as breakdown
    FROM usage_data
    GROUP BY provider, model
  )
  SELECT 
    t.total_tokens,
    t.input_tokens,
    t.output_tokens,
    t.total_cost,
    COALESCE(ob.breakdown, '{}'::jsonb) as operation_breakdown,
    COALESCE(mb.breakdown, '{}'::jsonb) as model_breakdown
  FROM totals t
  CROSS JOIN operation_breakdown ob
  CROSS JOIN model_breakdown mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get daily token usage for charts
CREATE OR REPLACE FUNCTION get_daily_token_usage(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_tokens BIGINT,
  input_tokens BIGINT,
  output_tokens BIGINT,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(tu.created_at) as date,
    COALESCE(SUM(tu.total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(tu.input_tokens), 0)::BIGINT as input_tokens,
    COALESCE(SUM(tu.output_tokens), 0)::BIGINT as output_tokens,
    COALESCE(SUM(tu.cost_usd), 0) as total_cost
  FROM token_usage tu
  WHERE tu.user_id = user_uuid
    AND tu.created_at >= (NOW() - INTERVAL '1 day' * days_back)
  GROUP BY DATE(tu.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add token usage limits to plans (optional)
-- This adds token tracking to the existing plans table
DO $$
BEGIN
  -- Add token limits to existing plans if the column doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plans' AND column_name = 'token_limits'
  ) THEN
    ALTER TABLE plans ADD COLUMN token_limits JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update existing plans with token limits (optional - you can adjust these)
UPDATE plans SET token_limits = jsonb_build_object(
  'tokens_per_month', CASE 
    WHEN slug = 'startup' THEN 100000
    WHEN slug = 'professional' THEN 500000
    WHEN slug = 'enterprise' THEN -1
    ELSE 50000
  END,
  'cost_limit_usd', CASE 
    WHEN slug = 'startup' THEN 10.00
    WHEN slug = 'professional' THEN 50.00
    WHEN slug = 'enterprise' THEN -1
    ELSE 5.00
  END
) WHERE token_limits = '{}'::jsonb OR token_limits IS NULL;

COMMENT ON TABLE token_usage IS 'Tracks AI token usage for billing and analytics';
COMMENT ON FUNCTION get_monthly_token_usage IS 'Returns comprehensive monthly token usage statistics for a user';
COMMENT ON FUNCTION get_daily_token_usage IS 'Returns daily token usage for charting and analytics';
