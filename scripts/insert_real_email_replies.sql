-- Sample Real Email Replies Data
-- This demonstrates how actual incoming email replies from leads would be stored

-- First, let's insert some sample real email replies that leads might send
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
    1,
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
    '{"From": "John Smith <john.smith@techcorp.com>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Quick Chat About Your Sales Pipeline?", "Date": "' || (NOW() - INTERVAL '3 hours')::text || '"}',
    'original_msg_001',
    'nylas_msg_001',
    'webhook_001'
),

-- Objection/concern reply
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    2,
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
    3,
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

-- Question/information request
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    4,
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
    true,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '5 hours',
    '{"from": "lisa.anderson@retailmax.com", "to": "chris@aisdrnewstyle.com", "message_id": "msg_question_lead_004"}',
    '{"From": "Lisa Anderson <lisa.anderson@retailmax.com>", "To": "chris@aisdrnewstyle.com", "Subject": "Re: Increase Your E-commerce Sales"}',
    'original_msg_004',
    'nylas_msg_004',
    'webhook_004'
);

-- Now insert the corresponding automated replies that the AI system sent
INSERT INTO public.automated_replies (
    user_id,
    original_reply_id,
    lead_id,
    message_id,
    thread_id,
    recipient_email,
    recipient_name,
    subject,
    body,
    sent_status,
    sent_at,
    ai_analysis,
    nylas_message_id
) VALUES 
-- Automated reply to interested lead
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.replies WHERE message_id = 'msg_interested_lead_001'),
    1,
    'auto_reply_001',
    'thread_001',
    'john.smith@techcorp.com',
    'John Smith',
    'Re: Quick Chat About Your Sales Pipeline?',
    'Great to hear you''re interested, John! I''d be happy to show you how we can improve your lead generation process. I have availability Tuesday at 2 PM or Wednesday at 3 PM EST. Which works better for you? I''ll send over a calendar link once you confirm.

Best regards,
Chris',
    'sent',
    NOW() - INTERVAL '2 hours',
    '{"sentiment": "interested", "action": "schedule_call", "confidence": 0.95, "lead_temperature": "hot"}',
    'nylas_auto_001'
),

-- Automated reply to objection
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.replies WHERE message_id = 'msg_objection_lead_002'),
    2,
    'auto_reply_002',
    'thread_002',
    'sarah.wilson@cloudtech.com',
    'Sarah Wilson',
    'Re: Boost Your Marketing ROI',
    'I completely understand your concerns, Sarah. Bad experiences with agencies are unfortunately common, and I appreciate you being upfront about it. 

What makes us different is our transparent, data-driven approach. We don''t make unrealistic promises - instead, we start with a small pilot to prove results before any major commitment. We also provide weekly reports showing exactly what we''re doing and the results we''re achieving.

Would you be open to a brief 10-minute call where I can share some case studies of how we''ve helped companies who had similar bad experiences turn things around?

Best regards,
Chris',
    'sent',
    NOW() - INTERVAL '1 hour',
    '{"sentiment": "neutral", "action": "reply", "confidence": 0.88, "objection_type": "past_bad_experience"}',
    'nylas_auto_002'
),

-- Automated reply to not interested
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.replies WHERE message_id = 'msg_not_interested_003'),
    3,
    'auto_reply_003',
    'thread_003',
    'mike.johnson@startup.io',
    'Mike Johnson',
    'Re: Scale Your Startup Growth',
    'No problem at all, Mike. I''ve removed you from our mailing list. Best of luck with your current priorities!

Best regards,
Chris',
    'sent',
    NOW() - INTERVAL '30 minutes',
    '{"sentiment": "not_interested", "action": "not_interested", "confidence": 0.99}',
    'nylas_auto_003'
),

-- Automated reply to question
(
    'f7ee9f97-dead-4f92-99de-23cd707e3f0c',
    (SELECT id FROM public.replies WHERE message_id = 'msg_question_lead_004'),
    4,
    'auto_reply_004',
    'thread_004',
    'lisa.anderson@retailmax.com',
    'Lisa Anderson',
    'Re: Increase Your E-commerce Sales',
    'Great questions, Lisa! I''d be happy to share more details.

We''ve helped several e-commerce companies increase their sales by 25-40% within 90 days. For example, we recently helped a fashion retailer similar to RetailMax increase their monthly revenue from $50K to $78K through improved lead generation and email marketing.

Our process typically starts with a free audit of your current setup, then we create a customized 90-day growth plan. Pricing depends on scope, but most e-commerce clients invest between $2K-5K/month.

Would you like me to send over a case study that''s relevant to your industry? I think you''d find it interesting.

Best regards,
Chris',
    'sent',
    NOW() - INTERVAL '4 hours',
    '{"sentiment": "neutral", "action": "reply", "confidence": 0.92, "information_request": true}',
    'nylas_auto_004'
);
