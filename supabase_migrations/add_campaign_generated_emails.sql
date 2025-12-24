-- ============================================================================
-- CAMPAIGN GENERATED EMAILS TABLE
-- Stores AI-generated personalized emails for leads before campaign launch
-- Allows Research/Trial users to generate and export emails without inbox
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_generated_emails (
    id BIGSERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id BIGINT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Sequence step info
    sequence_id INTEGER,
    step_number INTEGER NOT NULL DEFAULT 1,
    
    -- Generated email content
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Generation metadata
    framework_used TEXT,
    ai_model TEXT DEFAULT 'crewai',
    generation_prompt TEXT,
    
    -- Lead context snapshot (for reference)
    lead_snapshot JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'sent', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Unique constraint: one email per lead per step per campaign
    UNIQUE(campaign_id, lead_id, step_number)
);

-- Enable RLS
ALTER TABLE public.campaign_generated_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own generated emails"
    ON public.campaign_generated_emails FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated emails"
    ON public.campaign_generated_emails FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated emails"
    ON public.campaign_generated_emails FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated emails"
    ON public.campaign_generated_emails FOR DELETE
    USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_campaign_generated_emails_campaign 
    ON public.campaign_generated_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_generated_emails_lead 
    ON public.campaign_generated_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_generated_emails_user 
    ON public.campaign_generated_emails(user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_campaign_generated_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_generated_emails_updated_at
    BEFORE UPDATE ON public.campaign_generated_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_generated_emails_updated_at();
