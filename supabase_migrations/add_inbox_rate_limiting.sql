-- Create table to track daily sending limits per inbox
CREATE TABLE IF NOT EXISTS public.inbox_daily_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    inbox_id uuid REFERENCES public.connected_inboxes(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    outreach_sent_count integer DEFAULT 0,
    daily_limit integer DEFAULT 15,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per inbox per day
    UNIQUE(inbox_id, date)
);

-- Enable RLS
ALTER TABLE public.inbox_daily_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inbox_daily_limits
CREATE POLICY "Users can view their own inbox limits" ON public.inbox_daily_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inbox limits" ON public.inbox_daily_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inbox limits" ON public.inbox_daily_limits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inbox limits" ON public.inbox_daily_limits
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inbox_daily_limits_user_id ON public.inbox_daily_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_daily_limits_inbox_date ON public.inbox_daily_limits(inbox_id, date);

-- Function to check if inbox can send more emails today
CREATE OR REPLACE FUNCTION can_inbox_send_today(p_inbox_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    current_count integer;
    daily_limit integer;
    today_date date;
BEGIN
    today_date := CURRENT_DATE;
    
    -- Get or create today's record for this inbox
    INSERT INTO public.inbox_daily_limits (user_id, inbox_id, date, outreach_sent_count, daily_limit)
    VALUES (p_user_id, p_inbox_id, today_date, 0, 15)
    ON CONFLICT (inbox_id, date) DO NOTHING;
    
    -- Get current count and limit
    SELECT outreach_sent_count, daily_limit
    INTO current_count, daily_limit
    FROM public.inbox_daily_limits
    WHERE inbox_id = p_inbox_id AND date = today_date;
    
    -- Return true if under limit
    RETURN current_count < daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment inbox daily count
CREATE OR REPLACE FUNCTION increment_inbox_daily_count(p_inbox_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
    today_date date;
BEGIN
    today_date := CURRENT_DATE;
    
    -- Insert or update today's count
    INSERT INTO public.inbox_daily_limits (user_id, inbox_id, date, outreach_sent_count, daily_limit, updated_at)
    VALUES (p_user_id, p_inbox_id, today_date, 1, 15, timezone('utc'::text, now()))
    ON CONFLICT (inbox_id, date) 
    DO UPDATE SET 
        outreach_sent_count = inbox_daily_limits.outreach_sent_count + 1,
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available inboxes for sending (under daily limit)
CREATE OR REPLACE FUNCTION get_available_inboxes_for_sending(p_user_id uuid)
RETURNS TABLE(
    inbox_id uuid,
    email_address text,
    grant_id text,
    provider text,
    remaining_sends integer
) AS $$
DECLARE
    today_date date;
BEGIN
    today_date := CURRENT_DATE;
    
    RETURN QUERY
    SELECT 
        ci.id as inbox_id,
        ci.email_address,
        ci.grant_id,
        ci.provider,
        COALESCE(15 - COALESCE(idl.outreach_sent_count, 0), 15) as remaining_sends
    FROM public.connected_inboxes ci
    LEFT JOIN public.inbox_daily_limits idl ON (ci.id = idl.inbox_id AND idl.date = today_date)
    WHERE ci.user_id = p_user_id 
        AND ci.access_token IS NOT NULL
        AND COALESCE(idl.outreach_sent_count, 0) < COALESCE(idl.daily_limit, 15)
    ORDER BY COALESCE(idl.outreach_sent_count, 0) ASC; -- Prefer inboxes with fewer sends today
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
