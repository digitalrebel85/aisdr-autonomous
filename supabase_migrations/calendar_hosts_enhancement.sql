-- Calendar Hosts Enhancement
-- Adds support for managing multiple calendar hosts and their availability

-- Create calendar_hosts table for managing different people's calendars
CREATE TABLE IF NOT EXISTS public.calendar_hosts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Host information
    host_name TEXT NOT NULL,
    host_email TEXT NOT NULL,
    host_title TEXT, -- e.g., "Sales Manager", "CEO", "Product Specialist"
    host_bio TEXT,
    host_avatar_url TEXT,
    
    -- Calendar connection
    grant_id TEXT NOT NULL, -- Nylas grant ID for this host's calendar
    calendar_id TEXT, -- Specific calendar to use (optional, will use primary if not set)
    timezone TEXT NOT NULL DEFAULT 'UTC',
    
    -- Availability settings (can override booking link defaults)
    working_hours JSONB NOT NULL DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    buffer_before_minutes INTEGER DEFAULT 15,
    buffer_after_minutes INTEGER DEFAULT 15,
    max_bookings_per_day INTEGER DEFAULT 8,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Unique constraint to prevent duplicate hosts per user
    UNIQUE(user_id, host_email)
);

-- Add calendar_host_id to booking_links table
ALTER TABLE public.booking_links 
ADD COLUMN IF NOT EXISTS calendar_host_id BIGINT REFERENCES public.calendar_hosts(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_hosts_user_id ON public.calendar_hosts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_hosts_grant_id ON public.calendar_hosts(grant_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_calendar_host_id ON public.booking_links(calendar_host_id);

-- Enable RLS on calendar_hosts table
ALTER TABLE public.calendar_hosts ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only access their own calendar hosts
CREATE POLICY "Users can manage their own calendar hosts" ON public.calendar_hosts
    FOR ALL USING (auth.uid() = user_id);

-- Update booking_links RLS to include calendar_host_id access
DROP POLICY IF EXISTS "Users can manage their own booking links" ON public.booking_links;
CREATE POLICY "Users can manage their own booking links" ON public.booking_links
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.calendar_hosts 
            WHERE calendar_hosts.id = booking_links.calendar_host_id 
            AND calendar_hosts.user_id = auth.uid()
        )
    );

-- Function to get booking link with host information
CREATE OR REPLACE FUNCTION get_booking_link_with_host(p_booking_slug TEXT)
RETURNS TABLE (
    -- Booking link fields
    id BIGINT,
    title TEXT,
    description TEXT,
    duration_minutes INTEGER,
    timezone TEXT,
    booking_slug TEXT,
    is_active BOOLEAN,
    meeting_location TEXT,
    meeting_type TEXT,
    -- Host fields
    host_id BIGINT,
    host_name TEXT,
    host_email TEXT,
    host_title TEXT,
    host_bio TEXT,
    host_avatar_url TEXT,
    host_timezone TEXT,
    host_grant_id TEXT,
    host_calendar_id TEXT,
    host_working_hours JSONB,
    host_buffer_before INTEGER,
    host_buffer_after INTEGER,
    host_max_bookings INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bl.id,
        bl.title,
        bl.description,
        bl.duration_minutes,
        bl.timezone,
        bl.booking_slug,
        bl.is_active,
        bl.meeting_location,
        bl.meeting_type,
        -- Host information
        ch.id as host_id,
        ch.host_name,
        ch.host_email,
        ch.host_title,
        ch.host_bio,
        ch.host_avatar_url,
        ch.timezone as host_timezone,
        ch.grant_id as host_grant_id,
        ch.calendar_id as host_calendar_id,
        ch.working_hours as host_working_hours,
        ch.buffer_before_minutes as host_buffer_before,
        ch.buffer_after_minutes as host_buffer_after,
        ch.max_bookings_per_day as host_max_bookings
    FROM public.booking_links bl
    LEFT JOIN public.calendar_hosts ch ON bl.calendar_host_id = ch.id
    WHERE bl.booking_slug = p_booking_slug 
    AND bl.is_active = TRUE
    AND (ch.is_active = TRUE OR ch.id IS NULL);
END;
$$;

-- Function to create a calendar host from connected inbox
CREATE OR REPLACE FUNCTION create_calendar_host_from_inbox(
    p_user_id UUID,
    p_host_name TEXT,
    p_host_email TEXT,
    p_grant_id TEXT,
    p_host_title TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    host_id BIGINT;
BEGIN
    -- Insert new calendar host
    INSERT INTO public.calendar_hosts (
        user_id,
        host_name,
        host_email,
        host_title,
        grant_id,
        timezone
    ) VALUES (
        p_user_id,
        p_host_name,
        p_host_email,
        p_host_title,
        p_grant_id,
        p_timezone
    )
    RETURNING id INTO host_id;
    
    RETURN host_id;
END;
$$;

-- Sample data: Create calendar hosts from existing connected inboxes
-- This helps migrate existing setups to the new host-based system
INSERT INTO public.calendar_hosts (user_id, host_name, host_email, grant_id, host_title, timezone)
SELECT DISTINCT 
    ci.user_id,
    COALESCE(ci.email_address, 'Calendar Host') as host_name,
    ci.email_address as host_email,
    ci.grant_id,
    'Sales Representative' as host_title,
    'UTC' as timezone
FROM public.connected_inboxes ci
WHERE ci.grant_id IS NOT NULL
ON CONFLICT (user_id, host_email) DO NOTHING;

-- Update existing booking links to use the first available calendar host
UPDATE public.booking_links 
SET calendar_host_id = (
    SELECT ch.id 
    FROM public.calendar_hosts ch 
    WHERE ch.user_id = booking_links.user_id 
    AND ch.grant_id = booking_links.grant_id
    LIMIT 1
)
WHERE calendar_host_id IS NULL;

COMMENT ON TABLE public.calendar_hosts IS 'Manages different people whose calendars can be used for booking';
COMMENT ON COLUMN public.calendar_hosts.grant_id IS 'Nylas grant ID for accessing this hosts calendar';
COMMENT ON COLUMN public.calendar_hosts.calendar_id IS 'Specific calendar ID within the grant (optional)';
COMMENT ON FUNCTION get_booking_link_with_host(TEXT) IS 'Gets booking link details with associated calendar host information';
COMMENT ON FUNCTION create_calendar_host_from_inbox IS 'Creates a new calendar host from an existing connected inbox';
