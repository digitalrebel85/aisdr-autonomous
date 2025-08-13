-- Create email replies table for inbox functionality
-- This table stores incoming email replies from leads

-- Create replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.replies (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
    message_id text UNIQUE NOT NULL,
    thread_id text,
    grant_id text NOT NULL,
    sender_email text NOT NULL,
    sender_name text,
    subject text,
    body text,
    sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'interested', 'not_interested')),
    summary text,
    action text CHECK (action IN ('reply', 'follow_up', 'schedule_call', 'not_interested', 'no_action')),
    next_step_prompt text,
    is_read boolean DEFAULT false,
    is_processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    received_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create email_replies table as an alias/view for compatibility
CREATE TABLE IF NOT EXISTS public.email_replies (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
    message_id text UNIQUE NOT NULL,
    thread_id text,
    grant_id text NOT NULL,
    sender_email text NOT NULL,
    sender_name text,
    subject text,
    body text,
    sentiment text CHECK (sentiment IN ('positive', 'negative', 'neutral', 'interested', 'not_interested')),
    summary text,
    action text CHECK (action IN ('reply', 'follow_up', 'schedule_call', 'not_interested', 'no_action')),
    next_step_prompt text,
    is_read boolean DEFAULT false,
    is_processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    received_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sent_emails table for tracking outbound emails
CREATE TABLE IF NOT EXISTS public.sent_emails (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
    campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
    message_id text UNIQUE NOT NULL,
    thread_id text,
    grant_id text NOT NULL,
    sender_email text NOT NULL,
    recipient_email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
    sent_at timestamp with time zone NOT NULL,
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_lead_id ON public.replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_replies_message_id ON public.replies(message_id);
CREATE INDEX IF NOT EXISTS idx_replies_thread_id ON public.replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_replies_received_at ON public.replies(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_is_read ON public.replies(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_email_replies_user_id ON public.email_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_lead_id ON public.email_replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_message_id ON public.email_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_thread_id ON public.email_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_at ON public.email_replies(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_replies_is_read ON public.email_replies(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_sent_emails_user_id ON public.sent_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_lead_id ON public.sent_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_campaign_id ON public.sent_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_message_id ON public.sent_emails(message_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_thread_id ON public.sent_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON public.sent_emails(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for replies
CREATE POLICY "Users can view their own replies" ON public.replies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own replies" ON public.replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies" ON public.replies
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for email_replies
CREATE POLICY "Users can view their own email replies" ON public.email_replies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email replies" ON public.email_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email replies" ON public.email_replies
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for sent_emails
CREATE POLICY "Users can view their own sent emails" ON public.sent_emails
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sent emails" ON public.sent_emails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sent emails" ON public.sent_emails
    FOR UPDATE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.replies IS 'Stores incoming email replies from leads with AI analysis';
COMMENT ON TABLE public.email_replies IS 'Alternative table for email replies (compatibility)';
COMMENT ON TABLE public.sent_emails IS 'Tracks all outbound emails sent to leads';

COMMENT ON COLUMN public.replies.message_id IS 'Unique message ID from email provider (Nylas)';
COMMENT ON COLUMN public.replies.thread_id IS 'Thread ID for grouping related messages';
COMMENT ON COLUMN public.replies.sentiment IS 'AI-analyzed sentiment of the reply';
COMMENT ON COLUMN public.replies.summary IS 'AI-generated summary of the reply content';
COMMENT ON COLUMN public.replies.action IS 'AI-recommended next action based on reply content';
COMMENT ON COLUMN public.replies.next_step_prompt IS 'AI-generated prompt for next steps';

COMMENT ON COLUMN public.sent_emails.message_id IS 'Unique message ID from email provider';
COMMENT ON COLUMN public.sent_emails.thread_id IS 'Thread ID for conversation tracking';
COMMENT ON COLUMN public.sent_emails.status IS 'Email delivery and engagement status';
