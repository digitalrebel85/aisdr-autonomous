-- Enhanced Email Replies Schema Migration
-- Adds fields to properly capture and store actual incoming email replies from leads

-- Add new columns to replies table for better email reply handling
ALTER TABLE public.replies 
ADD COLUMN IF NOT EXISTS raw_email_data JSONB, -- Full email data from Nylas/webhook
ADD COLUMN IF NOT EXISTS email_headers JSONB, -- Email headers (From, To, CC, BCC, etc.)
ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT, -- Original message this is replying to
ADD COLUMN IF NOT EXISTS conversation_id TEXT, -- Conversation/thread tracking
ADD COLUMN IF NOT EXISTS email_provider TEXT, -- Gmail, Outlook, etc.
ADD COLUMN IF NOT EXISTS attachments JSONB, -- File attachments info
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS lead_temperature TEXT CHECK (lead_temperature IN ('hot', 'warm', 'cold')),
ADD COLUMN IF NOT EXISTS auto_reply_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reply_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_reply_message_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_id TEXT, -- Nylas webhook ID for tracking
ADD COLUMN IF NOT EXISTS nylas_message_id TEXT, -- Nylas-specific message ID
ADD COLUMN IF NOT EXISTS original_campaign_id BIGINT, -- Will reference campaigns table when it exists
ADD COLUMN IF NOT EXISTS lead_context JSONB; -- Additional lead context for AI processing

-- Update existing columns to be more flexible
ALTER TABLE public.replies 
ALTER COLUMN sender_email DROP NOT NULL, -- Allow null for system messages
ALTER COLUMN grant_id DROP NOT NULL; -- Allow null for non-Nylas sources

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_replies_conversation_id ON public.replies(conversation_id);
CREATE INDEX IF NOT EXISTS idx_replies_reply_to_message_id ON public.replies(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_replies_sender_email ON public.replies(sender_email);
CREATE INDEX IF NOT EXISTS idx_replies_auto_reply_sent ON public.replies(auto_reply_sent);
CREATE INDEX IF NOT EXISTS idx_replies_lead_temperature ON public.replies(lead_temperature);
CREATE INDEX IF NOT EXISTS idx_replies_original_campaign_id ON public.replies(original_campaign_id);
CREATE INDEX IF NOT EXISTS idx_replies_nylas_message_id ON public.replies(nylas_message_id);

-- Note: automated_replies table creation temporarily removed to simplify migration
-- Will be added in a separate migration after core replies table is enhanced

-- Create a view for inbox display that combines replies with automated responses
-- Note: Temporarily commented out due to type casting issues - will be created after data migration
-- CREATE OR REPLACE VIEW public.inbox_threads AS
-- SELECT 
--     r.id,
--     r.user_id,
--     r.lead_id,
--     r.sender_email,
--     r.sender_name,
--     r.subject,
--     r.body as reply_body,
--     r.sentiment,
--     r.summary,
--     r.action,
--     r.next_step_prompt,
--     r.priority,
--     r.lead_temperature,
--     r.is_read,
--     r.is_processed,
--     r.auto_reply_sent,
--     r.auto_reply_sent_at,
--     r.received_at,
--     r.created_at,
--     r.conversation_id,
--     r.thread_id,
--     l.first_name as lead_first_name,
--     l.last_name as lead_last_name,
--     l.company as lead_company,
--     l.title as lead_title
-- FROM public.replies r
-- LEFT JOIN public.leads l ON r.lead_id::bigint = l.id
-- ORDER BY r.received_at DESC;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: automated_replies trigger removed since table is not created in this migration

-- Add comments for documentation
COMMENT ON COLUMN public.replies.raw_email_data IS 'Full email data from webhook/email provider (Nylas, etc.)';
COMMENT ON COLUMN public.replies.lead_temperature IS 'AI-assessed lead temperature based on reply content';
COMMENT ON COLUMN public.replies.auto_reply_sent IS 'Whether an automated reply was sent for this incoming email';
COMMENT ON COLUMN public.replies.original_campaign_id IS 'Links reply to the original outreach campaign that generated it';
