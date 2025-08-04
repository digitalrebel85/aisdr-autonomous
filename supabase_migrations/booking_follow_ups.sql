-- Create booking_follow_ups table to track follow-up emails sent for bookings
CREATE TABLE IF NOT EXISTS public.booking_follow_ups (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    follow_up_type TEXT NOT NULL, -- '24_hour_reminder', '1_hour_reminder', 'confirmation'
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    email_subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_booking_follow_ups_booking_id ON public.booking_follow_ups(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_follow_ups_type ON public.booking_follow_ups(follow_up_type);
CREATE INDEX IF NOT EXISTS idx_booking_follow_ups_sent_at ON public.booking_follow_ups(sent_at);

-- Create unique constraint to prevent duplicate follow-ups
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_follow_ups_unique 
ON public.booking_follow_ups(booking_id, follow_up_type);

-- Add RLS policies
ALTER TABLE public.booking_follow_ups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view follow-ups for their own bookings
CREATE POLICY "Users can view their booking follow-ups" ON public.booking_follow_ups
    FOR SELECT USING (
        booking_id IN (
            SELECT b.id FROM public.bookings b 
            JOIN public.booking_links bl ON b.booking_link_id = bl.id 
            WHERE bl.user_id = auth.uid()
        )
    );

-- Policy: System can insert follow-ups (for cron job)
CREATE POLICY "System can insert booking follow-ups" ON public.booking_follow_ups
    FOR INSERT WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_follow_ups_updated_at 
    BEFORE UPDATE ON public.booking_follow_ups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.booking_follow_ups IS 'Tracks follow-up emails sent for calendar bookings';
COMMENT ON COLUMN public.booking_follow_ups.follow_up_type IS 'Type of follow-up: confirmation, 24_hour_reminder, 1_hour_reminder';
COMMENT ON COLUMN public.booking_follow_ups.sent_at IS 'When the follow-up email was sent';
COMMENT ON COLUMN public.booking_follow_ups.email_subject IS 'Subject line of the follow-up email sent';
