-- Add threading columns to sent_emails table for proper message threading support
-- This migration adds columns to track reply relationships and thread information

-- Add threading columns to sent_emails table if they don't exist
DO $$ 
BEGIN
    -- Add reply_to_message_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sent_emails' AND column_name = 'reply_to_message_id') THEN
        ALTER TABLE sent_emails ADD COLUMN reply_to_message_id TEXT;
        COMMENT ON COLUMN sent_emails.reply_to_message_id IS 'ID of the message this email is replying to (for threading)';
    END IF;

    -- Add thread_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sent_emails' AND column_name = 'thread_id') THEN
        ALTER TABLE sent_emails ADD COLUMN thread_id TEXT;
        COMMENT ON COLUMN sent_emails.thread_id IS 'Thread ID for grouping related messages';
    END IF;

    -- Add campaign_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sent_emails' AND column_name = 'campaign_type') THEN
        ALTER TABLE sent_emails ADD COLUMN campaign_type TEXT DEFAULT 'outreach';
        COMMENT ON COLUMN sent_emails.campaign_type IS 'Type of campaign: outreach, automated_reply, follow_up, etc.';
    END IF;
END $$;

-- Create index on reply_to_message_id for faster threading queries
CREATE INDEX IF NOT EXISTS idx_sent_emails_reply_to_message_id 
ON sent_emails(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- Create index on thread_id for faster thread queries
CREATE INDEX IF NOT EXISTS idx_sent_emails_thread_id 
ON sent_emails(thread_id) 
WHERE thread_id IS NOT NULL;

-- Create index on campaign_type for filtering
CREATE INDEX IF NOT EXISTS idx_sent_emails_campaign_type 
ON sent_emails(campaign_type);

COMMENT ON TABLE sent_emails IS 'Tracks all sent emails with threading support for proper conversation tracking';
