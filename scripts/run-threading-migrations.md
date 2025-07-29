# Threading Migrations - Run in Supabase SQL Editor

## Step 1: Add Threading Columns to sent_emails Table

Copy and paste this SQL into your Supabase SQL Editor:

```sql
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sent_emails_reply_to_message_id 
ON sent_emails(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sent_emails_thread_id 
ON sent_emails(thread_id) 
WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sent_emails_campaign_type 
ON sent_emails(campaign_type);
```

## Step 2: Add Threading Columns to replies Table

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add threading columns to replies table for better conversation tracking
-- This migration adds columns to track thread information in replies

-- Add threading columns to replies table if they don't exist
DO $$ 
BEGIN
    -- Add thread_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'thread_id') THEN
        ALTER TABLE replies ADD COLUMN thread_id TEXT;
        COMMENT ON COLUMN replies.thread_id IS 'Thread ID from Nylas for grouping related messages in a conversation';
    END IF;

    -- Add lead_id column if it doesn't exist (for linking to leads table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'lead_id') THEN
        ALTER TABLE replies ADD COLUMN lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL;
        COMMENT ON COLUMN replies.lead_id IS 'Links to the lead who sent this reply';
    END IF;

    -- Add next_step_prompt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'next_step_prompt') THEN
        ALTER TABLE replies ADD COLUMN next_step_prompt TEXT;
        COMMENT ON COLUMN replies.next_step_prompt IS 'AI-generated response content or next step instructions';
    END IF;

    -- Add raw_response column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'raw_response') THEN
        ALTER TABLE replies ADD COLUMN raw_response JSONB;
        COMMENT ON COLUMN replies.raw_response IS 'Full raw response from AI analysis for debugging';
    END IF;

    -- Add sender_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'sender_email') THEN
        ALTER TABLE replies ADD COLUMN sender_email TEXT;
        COMMENT ON COLUMN replies.sender_email IS 'Email address of the person who sent the reply';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_replies_thread_id 
ON replies(thread_id) 
WHERE thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_replies_lead_id 
ON replies(lead_id) 
WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_replies_user_thread 
ON replies(user_id, thread_id) 
WHERE thread_id IS NOT NULL;
```

## Step 3: Verify Migrations

After running both migrations, verify they worked by running this query:

```sql
-- Verify sent_emails table has new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sent_emails' 
AND column_name IN ('reply_to_message_id', 'thread_id', 'campaign_type')
ORDER BY column_name;

-- Verify replies table has new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'replies' 
AND column_name IN ('thread_id', 'lead_id', 'next_step_prompt', 'raw_response', 'sender_email')
ORDER BY column_name;
```

You should see all the new columns listed in the results.
