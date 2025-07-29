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

    -- Handle message_id column (check if we need to migrate from nylas_message_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'replies' AND column_name = 'nylas_message_id') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'replies' AND column_name = 'message_id') THEN
        -- Rename nylas_message_id to message_id only if message_id doesn't exist
        ALTER TABLE replies RENAME COLUMN nylas_message_id TO message_id;
        COMMENT ON COLUMN replies.message_id IS 'The unique ID of the message from Nylas that was analyzed';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'replies' AND column_name = 'nylas_message_id') 
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'replies' AND column_name = 'message_id') THEN
        -- Both columns exist, drop the old nylas_message_id column
        ALTER TABLE replies DROP COLUMN nylas_message_id;
    END IF;
    
    -- Ensure message_id column has proper comment
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'replies' AND column_name = 'message_id') THEN
        COMMENT ON COLUMN replies.message_id IS 'The unique ID of the message from Nylas that was analyzed';
    END IF;

    -- Add lead_id column if it doesn't exist (for linking to leads table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'replies' AND column_name = 'lead_id') THEN
        ALTER TABLE replies ADD COLUMN lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL;
        COMMENT ON COLUMN replies.lead_id IS 'Links to the lead who sent this reply';
    END IF;

    -- Update action_required column name to just 'action' for consistency
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'replies' AND column_name = 'action_required') THEN
        ALTER TABLE replies RENAME COLUMN action_required TO action;
        COMMENT ON COLUMN replies.action IS 'AI-determined action: reply, follow_up, schedule_call, not_interested, no_action';
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
END $$;

-- Create index on thread_id for faster thread queries
CREATE INDEX IF NOT EXISTS idx_replies_thread_id 
ON replies(thread_id) 
WHERE thread_id IS NOT NULL;

-- Create index on lead_id for faster lead queries
CREATE INDEX IF NOT EXISTS idx_replies_lead_id 
ON replies(lead_id) 
WHERE lead_id IS NOT NULL;

-- Create index on action for filtering by action type
CREATE INDEX IF NOT EXISTS idx_replies_action 
ON replies(action);

-- Create composite index for user + thread queries
CREATE INDEX IF NOT EXISTS idx_replies_user_thread 
ON replies(user_id, thread_id) 
WHERE thread_id IS NOT NULL;

COMMENT ON TABLE replies IS 'Stores AI analysis of incoming email replies with threading support for conversation tracking';
