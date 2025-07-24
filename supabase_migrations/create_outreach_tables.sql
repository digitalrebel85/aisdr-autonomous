-- Create offers table first (required by outreach_campaigns)
CREATE TABLE IF NOT EXISTS public.offers (
    id bigserial PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    value_proposition text,
    call_to_action text,
    hook_snippet text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create outreach campaigns table
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    offer_id bigint REFERENCES public.offers(id) ON DELETE CASCADE NOT NULL,
    status text DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'paused', 'completed', 'failed')),
    total_leads integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    delay_minutes integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);

-- Create outreach queue table
CREATE TABLE IF NOT EXISTS public.outreach_queue (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lead_id bigint REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    inbox_id uuid REFERENCES public.connected_inboxes(id) ON DELETE CASCADE NOT NULL,
    grant_id text NOT NULL,
    sender_email text NOT NULL,
    status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'skipped')),
    scheduled_at timestamp with time zone NOT NULL,
    sent_at timestamp with time zone,
    message_id text,
    error_message text,
    lead_data jsonb,
    offer_data jsonb,
    generated_email jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Offers table already created above

-- Enable RLS
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outreach_campaigns
CREATE POLICY "Users can view their own campaigns" ON public.outreach_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON public.outreach_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.outreach_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.outreach_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for outreach_queue
CREATE POLICY "Users can view their own queue items" ON public.outreach_queue
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue items" ON public.outreach_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue items" ON public.outreach_queue
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue items" ON public.outreach_queue
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for offers
CREATE POLICY "Users can view their own offers" ON public.offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own offers" ON public.offers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers" ON public.offers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers" ON public.offers
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_user_id ON public.outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON public.outreach_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_outreach_queue_user_id ON public.outreach_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_campaign_id ON public.outreach_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_status ON public.outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_outreach_queue_scheduled_at ON public.outreach_queue(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);
