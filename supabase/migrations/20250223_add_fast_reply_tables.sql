-- Migration: Add tables for fast reply service
-- Creates tables for tracking sent emails and replies

-- Table for tracking all sent emails (for reply correlation)
CREATE TABLE IF NOT EXISTS sent_emails (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
    message_id TEXT UNIQUE,  -- Email Message-ID header for reply correlation
    thread_id TEXT,          -- Conversation thread ID
    subject TEXT NOT NULL,
    body TEXT,
    is_ai_response BOOLEAN DEFAULT FALSE,
    in_reply_to TEXT,        -- If this email is a reply, references original message_id
    angle_id uuid REFERENCES icp_angles(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_sent_emails_message_id ON sent_emails(message_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_thread ON sent_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_user ON sent_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_lead ON sent_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at);

-- Table for incoming email replies
CREATE TABLE IF NOT EXISTS email_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    original_message_id TEXT,  -- References sent_emails.message_id
    from_email TEXT NOT NULL,
    from_name TEXT,
    subject TEXT NOT NULL,
    body TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI Classification
    classification TEXT,  -- 'positive', 'negative', 'neutral', 'question', 'objection', 'unsubscribe', 'out_of_office', 'referral'
    intent TEXT,          -- 'meeting_request', 'information_request', 'pricing_inquiry', etc.
    urgency TEXT,         -- 'high', 'medium', 'low'
    confidence DECIMAL(3,2),  -- 0.00 to 1.00
    
    -- Response tracking
    ai_response_sent BOOLEAN DEFAULT FALSE,
    ai_response_id uuid REFERENCES sent_emails(id) ON DELETE SET NULL,
    ai_draft TEXT,        -- Store the AI-generated draft
    human_review_required BOOLEAN DEFAULT FALSE,
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    worker_id TEXT,       -- Which worker processed this
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_replies
CREATE INDEX IF NOT EXISTS idx_email_replies_original_msg ON email_replies(original_message_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_user ON email_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_lead ON email_replies(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_from_email ON email_replies(from_email);
CREATE INDEX IF NOT EXISTS idx_email_replies_received ON email_replies(received_at);
CREATE INDEX IF NOT EXISTS idx_email_replies_ai_sent ON email_replies(ai_response_sent) WHERE ai_response_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_email_replies_classification ON email_replies(classification);

-- Add reply_handling_mode to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reply_handling_mode TEXT DEFAULT 'ai';
-- Valid values: 'ai', 'human', 'hybrid', 'auto'

-- Add reply_stats to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reply_stats JSONB DEFAULT '{}'::jsonb;
/*
Example structure:
{
  "total_replies": 10,
  "positive": 5,
  "questions": 3,
  "objections": 2,
  "ai_responses_sent": 8,
  "human_handoffs": 2,
  "avg_response_time_seconds": 45
}
*/

-- Function to update campaign reply stats
CREATE OR REPLACE FUNCTION update_campaign_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaigns
    SET reply_stats = jsonb_set(
        COALESCE(reply_stats, '{}'::jsonb),
        '{total_replies}',
        (COALESCE(reply_stats->>'total_replies', '0')::int + 1)::text::jsonb
    )
    WHERE id = NEW.campaign_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
DROP TRIGGER IF EXISTS trg_update_campaign_reply_stats ON email_replies;
CREATE TRIGGER trg_update_campaign_reply_stats
    AFTER INSERT ON email_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_reply_stats();

-- Enable RLS
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sent_emails
CREATE POLICY "Users can view their own sent emails"
    ON sent_emails FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role can insert sent emails"
    ON sent_emails FOR INSERT
    WITH CHECK (true);  -- Service role bypass

CREATE POLICY "Users can update their own sent emails"
    ON sent_emails FOR UPDATE
    USING (user_id = auth.uid());

-- RLS Policies for email_replies
CREATE POLICY "Users can view their own email replies"
    ON email_replies FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Service role can insert email replies"
    ON email_replies FOR INSERT
    WITH CHECK (true);  -- Service role bypass

CREATE POLICY "Service role can update email replies"
    ON email_replies FOR UPDATE
    USING (true);

-- Comments for documentation
COMMENT ON TABLE sent_emails IS 'Tracks all outbound emails for reply correlation';
COMMENT ON TABLE email_replies IS 'Stores incoming email replies and AI processing results';
COMMENT ON COLUMN sent_emails.message_id IS 'Email Message-ID header used for In-Reply-To matching';
COMMENT ON COLUMN email_replies.original_message_id IS 'References sent_emails.message_id to correlate reply';
COMMENT ON COLUMN leads.reply_handling_mode IS 'How to handle replies: ai, human, hybrid, or auto';
