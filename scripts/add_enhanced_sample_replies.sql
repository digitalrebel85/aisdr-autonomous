-- Add Enhanced Sample Email Replies
-- This script adds the new columns and inserts sample real email replies

-- First, add the new columns to the replies table (safe to run multiple times)
ALTER TABLE public.replies 
ADD COLUMN IF NOT EXISTS raw_email_data JSONB,
ADD COLUMN IF NOT EXISTS email_headers JSONB,
ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT,
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS email_provider TEXT,
ADD COLUMN IF NOT EXISTS attachments JSONB,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS lead_temperature TEXT CHECK (lead_temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS auto_reply_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reply_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_reply_message_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_id TEXT,
ADD COLUMN IF NOT EXISTS nylas_message_id TEXT,
ADD COLUMN IF NOT EXISTS original_campaign_id BIGINT,
ADD COLUMN IF NOT EXISTS lead_context JSONB;

-- Update existing columns to be more flexible
ALTER TABLE public.replies 
ALTER COLUMN sender_email DROP NOT NULL,
ALTER COLUMN grant_id DROP NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_replies_conversation_id ON public.replies(conversation_id);
CREATE INDEX IF NOT EXISTS idx_replies_reply_to_message_id ON public.replies(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_replies_sender_email ON public.replies(sender_email);
CREATE INDEX IF NOT EXISTS idx_replies_auto_reply_sent ON public.replies(auto_reply_sent);
CREATE INDEX IF NOT EXISTS idx_replies_lead_temperature ON public.replies(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_replies_original_campaign_id ON public.replies(original_campaign_id);
CREATE INDEX IF NOT EXISTS idx_replies_nylas_message_id ON public.replies(nylas_message_id);

-- Clear existing sample data to avoid conflicts
DELETE FROM public.replies WHERE user_id = 'f7ee9f97-dead-4f92-99de-23cd707e3f0c' AND message_id LIKE 'msg_%';

-- Insert sample leads if they don't exist
INSERT INTO public.leads (user_id, first_name, last_name, email, company, title, offer, cta)
VALUES 
  ('f7ee9f97-dead-4f92-99de-23cd707e3f0c', 'John', 'Smith', 'john.smith@techcorp.com', 'TechCorp Inc', 'VP of Sales', 'Sales Pipeline Optimization', 'Schedule a 15-minute call'),
  ('f7ee9f97-dead-4f92-99de-23cd707e3f0c', 'Sarah', 'Wilson', 'sarah.wilson@cloudtech.com', 'CloudTech Solutions', 'Marketing Director', 'Marketing ROI Improvement', 'Book a free consultation'),
  ('f7ee9f97-dead-4f92-99de-23cd707e3f0c', 'Mike', 'Johnson', 'mike.johnson@startup.io', 'StartupIO', 'CEO', 'Startup Growth Strategy', 'Get a growth audit'),
  ('f7ee9f97-dead-4f92-99de-23cd707e3f0c', 'Lisa', 'Anderson', 'lisa.anderson@retailmax.com', 'RetailMax', 'Head of Digital Marketing', 'E-commerce Sales Boost', 'See case studies')
ON CONFLICT (email) DO NOTHING;

-- Insert sample real email replies
INSERT INTO public.replies (
    user_id,
    lead_id,
    message_id,
    thread_id,
    conversation_id,
    sender_email,
    sender_name,
    subject,
    body,
    sentiment,
    summary,
    action,
    next_step_prompt,
    priority,
    lead_temperature,
    is_read,
    is_processed,
    auto_reply_sent,
    auto_reply_sent_at,
    received_at,
    raw_email_data,
    email_headers,
    reply_to_message_id,
    nylas_message_id,
    webhook_id
) VALUES 
-- Interested lead reply
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.leads WHERE email = 'john.smith@techcorp.com' LIMIT 1),
    'msg_interested_lead_001',
    'thread_001',
    'conv_001',
    'john.smith@techcorp.com',
    'John Smith',
    'Re: Quick Chat About Your Sales Pipeline?',
    'Hi Chris,

Thanks for reaching out! I''m actually very interested in learning more about how you can help us improve our lead generation. We''ve been struggling with our current process and could definitely use some help.

Would you be available for a 15-minute call this week to discuss? I''m free Tuesday or Wednesday afternoon.

Best regards,
John Smith
VP of Sales, TechCorp',
    'interested',
    'Lead is very interested and wants to schedule a call this week. Mentioned struggling with current lead generation process.',
    'schedule_call',
    'Great to hear you''re interested, John! I''d be happy to show you how we can improve your lead generation process. I have availability Tuesday at 2 PM or Wednesday at 3 PM EST. Which works better for you? I''ll send over a calendar link once you confirm.',
    'high',
    'hot',
    false,
    true,
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '3 hours',
    '{"from": "john.smith@techcorp.com", "to": "chris@aisdrnewstyle.com", "message_id": "msg_interested_lead_001", "thread_id": "thread_001"}',
    '{"From": "John Smith <john.smith@techcorp.com>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Quick Chat About Your Sales Pipeline?"}',
    'original_msg_001',
    'nylas_msg_001',
    'webhook_001'
),

-- Objection/concern reply
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.leads WHERE email = 'sarah.wilson@cloudtech.com' LIMIT 1),
    'msg_objection_lead_002',
    'thread_002',
    'conv_002',
    'sarah.wilson@cloudtech.com',
    'Sarah Wilson',
    'Re: Boost Your Marketing ROI',
    'Hi,

I appreciate you reaching out, but we''ve had some bad experiences with marketing agencies in the past. The last company we worked with promised great results but didn''t deliver and was very expensive.

How is your approach different? What kind of guarantees do you offer?

Sarah',
    'neutral',
    'Lead has objections based on past bad experiences with agencies. Asking about approach and guarantees.',
    'reply',
    'I completely understand your concerns, Sarah. Bad experiences with agencies are unfortunately common, and I appreciate you being upfront about it. 

What makes us different is our transparent, data-driven approach. We don''t make unrealistic promises - instead, we start with a small pilot to prove results before any major commitment. We also provide weekly reports showing exactly what we''re doing and the results we''re achieving.

Would you be open to a brief 10-minute call where I can share some case studies of how we''ve helped companies who had similar bad experiences turn things around?',
    'medium',
    'warm',
    false,
    true,
    true,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '2 hours',
    '{"from": "sarah.wilson@cloudtech.com", "to": "chris@aisdrnewstyle.com", "message_id": "msg_objection_lead_002"}',
    '{"From": "Sarah Wilson <sarah.wilson@cloudtech.com>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Boost Your Marketing ROI"}',
    'original_msg_002',
    'nylas_msg_002',
    'webhook_002'
),

-- Not interested reply
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.leads WHERE email = 'mike.johnson@startup.io' LIMIT 1),
    'msg_not_interested_003',
    'thread_003',
    'conv_003',
    'mike.johnson@startup.io',
    'Mike Johnson',
    'Re: Scale Your Startup Growth',
    'Hi,

Thanks for the email, but we''re not interested at this time. We''re focused on other priorities right now.

Please remove me from your mailing list.

Thanks,
Mike',
    'not_interested',
    'Lead explicitly not interested and requested to be removed from mailing list.',
    'not_interested',
    'No problem at all, Mike. I''ve removed you from our mailing list. Best of luck with your current priorities!',
    'low',
    'cold',
    false,
    true,
    true,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '45 minutes',
    '{"from": "mike.johnson@startup.io", "to": "chris@aisdrnewstyle.com", "message_id": "msg_not_interested_003"}',
    '{"From": "Mike Johnson <mike.johnson@startup.io>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Scale Your Startup Growth"}',
    'original_msg_003',
    'nylas_msg_003',
    'webhook_003'
),

-- Question/information request (no auto-reply sent yet)
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.leads WHERE email = 'lisa.anderson@retailmax.com' LIMIT 1),
    'msg_question_lead_004',
    'thread_004',
    'conv_004',
    'lisa.anderson@retailmax.com',
    'Lisa Anderson',
    'Re: Increase Your E-commerce Sales',
    'Hi Chris,

Your email caught my attention. Can you tell me more about your specific experience with e-commerce companies? What kind of results have you achieved for businesses similar to ours?

Also, what''s your typical engagement process and pricing structure?

Thanks,
Lisa Anderson
Head of Digital Marketing',
    'neutral',
    'Lead is asking for more information about experience, results, process, and pricing. Shows interest but needs more details.',
    'reply',
    'Great questions, Lisa! I''d be happy to share more details.

We''ve helped several e-commerce companies increase their sales by 25-40% within 90 days. For example, we recently helped a fashion retailer similar to RetailMax increase their monthly revenue from $50K to $78K through improved lead generation and email marketing.

Our process typically starts with a free audit of your current setup, then we create a customized 90-day growth plan. Pricing depends on scope, but most e-commerce clients invest between $2K-5K/month.

Would you like me to send over a case study that''s relevant to your industry? I think you''d find it interesting.',
    'medium',
    'warm',
    false,
    true,
    false, -- This one hasn't been auto-replied to yet
    NULL,
    NOW() - INTERVAL '4 hours',
    '{"from": "lisa.anderson@retailmax.com", "to": "chris@aisdrnewstyle.com", "message_id": "msg_question_lead_004"}',
    '{"From": "Lisa Anderson <lisa.anderson@retailmax.com>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Increase Your E-commerce Sales"}',
    'original_msg_004',
    'nylas_msg_004',
    'webhook_004'
);

-- Add comments for documentation
COMMENT ON COLUMN public.replies.raw_email_data IS 'Full email data from webhook/email provider (Nylas, etc.)';
COMMENT ON COLUMN public.replies.lead_temperature IS 'AI-assessed lead temperature based on reply content';
COMMENT ON COLUMN public.replies.auto_reply_sent IS 'Whether an automated reply was sent for this incoming email';
COMMENT ON COLUMN public.replies.original_campaign_id IS 'Links reply to the original outreach campaign that generated it';

-- Show results
SELECT 
    r.sender_name,
    r.subject,
    r.sentiment,
    r.lead_temperature,
    r.auto_reply_sent,
    r.received_at
FROM public.replies r
WHERE r.user_id = 'f7ee9f97-dead-4f92-99de-23cd707e3f0c'
    AND r.message_id LIKE 'msg_%'
ORDER BY r.received_at DESC;
