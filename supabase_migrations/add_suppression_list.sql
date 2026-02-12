-- ============================================================================
-- SUPPRESSION LIST / DO-NOT-CONTACT SYSTEM
-- Global unsubscribe tracking, one-click unsubscribe support, compliance
-- ============================================================================

-- Suppression list: tracks all unsubscribed/do-not-contact emails
CREATE TABLE IF NOT EXISTS public.suppression_list (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'unsubscribed',  -- unsubscribed, bounced, spam_reported, manual, compliance
    source TEXT DEFAULT 'reply',                   -- reply, one_click, manual, bounce, spam
    lead_id BIGINT REFERENCES public.leads(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
    unsubscribed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(user_id, email)  -- One entry per email per user
);

ALTER TABLE public.suppression_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own suppression list" ON public.suppression_list;
CREATE POLICY "Users can view their own suppression list" ON public.suppression_list
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own suppression list" ON public.suppression_list;
CREATE POLICY "Users can manage their own suppression list" ON public.suppression_list
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to suppression_list" ON public.suppression_list;
CREATE POLICY "Service role full access to suppression_list" ON public.suppression_list
    FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_suppression_user_email ON public.suppression_list(user_id, email);
CREATE INDEX IF NOT EXISTS idx_suppression_email ON public.suppression_list(email);

-- RPC: Check if an email is suppressed for a user
CREATE OR REPLACE FUNCTION is_email_suppressed(p_user_id UUID, p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.suppression_list
        WHERE user_id = p_user_id AND email = LOWER(TRIM(p_email))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Add email to suppression list (upsert — idempotent)
CREATE OR REPLACE FUNCTION suppress_email(
    p_user_id UUID,
    p_email TEXT,
    p_reason TEXT DEFAULT 'unsubscribed',
    p_source TEXT DEFAULT 'manual',
    p_lead_id BIGINT DEFAULT NULL,
    p_campaign_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.suppression_list (user_id, email, reason, source, lead_id, campaign_id)
    VALUES (p_user_id, LOWER(TRIM(p_email)), p_reason, p_source, p_lead_id, p_campaign_id)
    ON CONFLICT (user_id, email) DO UPDATE SET
        reason = EXCLUDED.reason,
        source = EXCLUDED.source,
        unsubscribed_at = now();

    -- Also update lead status if lead_id provided
    IF p_lead_id IS NOT NULL THEN
        UPDATE public.leads
        SET lead_status = 'unsubscribed', updated_at = now()
        WHERE id = p_lead_id AND user_id = p_user_id;
    END IF;

    -- Cancel any queued emails for this address
    UPDATE public.outreach_queue
    SET status = 'cancelled', error_message = 'Email suppressed: ' || p_reason
    WHERE user_id = p_user_id
      AND status = 'queued'
      AND lead_id IN (
          SELECT id FROM public.leads WHERE email = LOWER(TRIM(p_email)) AND user_id = p_user_id
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.suppression_list IS 'Global suppression/unsubscribe list for compliance and deliverability';
