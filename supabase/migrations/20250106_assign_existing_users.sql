-- Migration to assign existing users to default plans
-- Run this AFTER the main schema migration

-- First, let's see what users we have (this is just for reference)
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Create a function to assign users to plans based on their usage or signup date
CREATE OR REPLACE FUNCTION assign_users_to_plans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  startup_plan_id UUID;
  professional_plan_id UUID;
  user_lead_count INTEGER;
  user_email_count INTEGER;
BEGIN
  -- Get plan IDs
  SELECT id INTO startup_plan_id FROM plans WHERE slug = 'startup';
  SELECT id INTO professional_plan_id FROM plans WHERE slug = 'professional';
  
  -- Loop through all users who don't have subscriptions yet
  FOR user_record IN 
    SELECT u.id, u.email, u.created_at 
    FROM auth.users u 
    LEFT JOIN subscriptions s ON u.id = s.user_id 
    WHERE s.user_id IS NULL
  LOOP
    -- Count user's current leads (if leads table exists)
    SELECT COUNT(*) INTO user_lead_count 
    FROM leads 
    WHERE user_id = user_record.id;
    
    -- Count user's sent emails (if sent_emails table exists)
    SELECT COUNT(*) INTO user_email_count 
    FROM sent_emails 
    WHERE user_id = user_record.id 
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Assign plan based on usage
    IF user_lead_count > 1000 OR user_email_count > 500 THEN
      -- Heavy users get Professional plan with 14-day trial
      INSERT INTO subscriptions (
        user_id, 
        plan_id, 
        status, 
        billing_cycle,
        trial_end,
        current_period_start,
        current_period_end
      ) VALUES (
        user_record.id,
        professional_plan_id,
        'trialing',
        'monthly',
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '1 month'
      );
      
      RAISE NOTICE 'Assigned user % to Professional plan (trial) - leads: %, emails: %', 
        user_record.email, user_lead_count, user_email_count;
    ELSE
      -- Light users get Startup plan with 14-day trial
      INSERT INTO subscriptions (
        user_id, 
        plan_id, 
        status, 
        billing_cycle,
        trial_end,
        current_period_start,
        current_period_end
      ) VALUES (
        user_record.id,
        startup_plan_id,
        'trialing',
        'monthly',
        NOW() + INTERVAL '14 days',
        NOW(),
        NOW() + INTERVAL '1 month'
      );
      
      RAISE NOTICE 'Assigned user % to Startup plan (trial) - leads: %, emails: %', 
        user_record.email, user_lead_count, user_email_count;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'User plan assignment completed';
END;
$$;

-- Execute the function to assign plans
SELECT assign_users_to_plans();

-- Initialize usage tracking for existing users based on their current data
INSERT INTO usage_tracking (user_id, subscription_id, metric_name, metric_value, period_start, period_end)
SELECT 
  s.user_id,
  s.id,
  'prospects_per_month',
  COALESCE(lead_counts.count, 0),
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
FROM subscriptions s
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM leads 
  WHERE created_at >= DATE_TRUNC('month', NOW())
  GROUP BY user_id
) lead_counts ON s.user_id = lead_counts.user_id
ON CONFLICT (user_id, metric_name, period_start) DO NOTHING;

-- Initialize email usage tracking
INSERT INTO usage_tracking (user_id, subscription_id, metric_name, metric_value, period_start, period_end)
SELECT 
  s.user_id,
  s.id,
  'emails_per_month',
  COALESCE(email_counts.count, 0),
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
FROM subscriptions s
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM sent_emails 
  WHERE created_at >= DATE_TRUNC('month', NOW())
  GROUP BY user_id
) email_counts ON s.user_id = email_counts.user_id
ON CONFLICT (user_id, metric_name, period_start) DO NOTHING;

-- Clean up the function (optional)
DROP FUNCTION IF EXISTS assign_users_to_plans();

-- Show summary of what was created
SELECT 
  p.name as plan_name,
  s.status,
  COUNT(*) as user_count
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
GROUP BY p.name, s.status
ORDER BY p.name, s.status;
