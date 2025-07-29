-- Calendar Booking System Database Schema
-- This migration adds calendar booking functionality using Nylas Calendar API

-- Create booking_links table for managing calendar booking links
CREATE TABLE IF NOT EXISTS public.booking_links (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    grant_id TEXT NOT NULL, -- Nylas grant ID for calendar access
    
    -- Booking link configuration
    title TEXT NOT NULL DEFAULT 'Schedule a Call',
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_before_minutes INTEGER DEFAULT 15,
    buffer_after_minutes INTEGER DEFAULT 15,
    
    -- Availability settings
    timezone TEXT NOT NULL DEFAULT 'UTC',
    working_hours JSONB NOT NULL DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
    
    -- Booking settings
    max_bookings_per_day INTEGER DEFAULT 8,
    advance_booking_days INTEGER DEFAULT 30,
    minimum_notice_hours INTEGER DEFAULT 24,
    
    -- Link settings
    booking_slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    is_active BOOLEAN DEFAULT TRUE,
    require_confirmation BOOLEAN DEFAULT FALSE,
    
    -- Meeting details
    meeting_location TEXT DEFAULT 'Zoom (link will be provided)',
    meeting_type TEXT DEFAULT 'video_call', -- video_call, phone_call, in_person
    
    -- Nylas calendar settings
    calendar_id TEXT, -- Specific calendar to book into
    event_title_template TEXT DEFAULT 'Sales Call with {{lead_name}}',
    event_description_template TEXT DEFAULT 'Scheduled sales call with {{lead_name}} from {{lead_company}}'
);

-- Create bookings table for tracking actual bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- References
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    booking_link_id BIGINT REFERENCES booking_links(id) ON DELETE CASCADE NOT NULL,
    lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Booking details
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL,
    
    -- Lead information
    lead_name TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    lead_company TEXT,
    lead_phone TEXT,
    booking_notes TEXT,
    
    -- Meeting details
    meeting_location TEXT,
    meeting_type TEXT,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled, completed, no_show
    confirmation_sent BOOLEAN DEFAULT FALSE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Nylas integration
    nylas_event_id TEXT, -- Nylas calendar event ID
    nylas_grant_id TEXT, -- Grant used for calendar access
    
    -- Booking metadata
    booking_source TEXT DEFAULT 'email_link', -- email_link, website, manual
    user_agent TEXT,
    ip_address INET
);

-- Create booking_availability table for managing custom availability
CREATE TABLE IF NOT EXISTS public.booking_availability (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    booking_link_id BIGINT REFERENCES booking_links(id) ON DELETE CASCADE NOT NULL,
    
    -- Date and time
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Availability type
    availability_type TEXT NOT NULL DEFAULT 'available', -- available, blocked, busy
    reason TEXT, -- Optional reason for blocked/busy times
    
    -- Constraints
    UNIQUE(booking_link_id, date, start_time, end_time)
);

-- Add booking-related columns to leads table
DO $$ 
BEGIN
    -- Add call_scheduled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'call_scheduled') THEN
        ALTER TABLE leads ADD COLUMN call_scheduled BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN leads.call_scheduled IS 'Whether a call has been scheduled with this lead';
    END IF;

    -- Add call_scheduled_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'call_scheduled_date') THEN
        ALTER TABLE leads ADD COLUMN call_scheduled_date TIMESTAMPTZ;
        COMMENT ON COLUMN leads.call_scheduled_date IS 'Date and time of scheduled call';
    END IF;

    -- Add booking_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'leads' AND column_name = 'booking_id') THEN
        ALTER TABLE leads ADD COLUMN booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL;
        COMMENT ON COLUMN leads.booking_id IS 'Reference to the booking record';
    END IF;
END $$;

-- Enable RLS for all booking tables
ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_links
CREATE POLICY "Users can view their own booking links" ON public.booking_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own booking links" ON public.booking_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking links" ON public.booking_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking links" ON public.booking_links
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service roles can insert bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for booking_availability
CREATE POLICY "Users can manage their booking availability" ON public.booking_availability
    FOR ALL USING (
        booking_link_id IN (
            SELECT id FROM booking_links WHERE user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_links_user_id ON booking_links(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_slug ON booking_links(booking_slug);
CREATE INDEX IF NOT EXISTS idx_booking_links_active ON booking_links(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_nylas_event_id ON bookings(nylas_event_id);

CREATE INDEX IF NOT EXISTS idx_booking_availability_link_date ON booking_availability(booking_link_id, date);

CREATE INDEX IF NOT EXISTS idx_leads_call_scheduled ON leads(call_scheduled) WHERE call_scheduled = TRUE;
CREATE INDEX IF NOT EXISTS idx_leads_call_scheduled_date ON leads(call_scheduled_date);

-- Create function to check booking availability
CREATE OR REPLACE FUNCTION check_booking_availability(
    p_booking_link_id BIGINT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    link_record RECORD;
    day_of_week TEXT;
    time_start TIME;
    time_end TIME;
    working_hours_for_day JSONB;
    existing_bookings INTEGER;
BEGIN
    -- Get booking link details
    SELECT * INTO link_record FROM booking_links WHERE id = p_booking_link_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if it's within advance booking window
    IF p_start_time > (now() + (link_record.advance_booking_days || ' days')::INTERVAL) THEN
        RETURN FALSE;
    END IF;
    
    -- Check minimum notice
    IF p_start_time < (now() + (link_record.minimum_notice_hours || ' hours')::INTERVAL) THEN
        RETURN FALSE;
    END IF;
    
    -- Get day of week and time
    day_of_week := LOWER(to_char(p_start_time AT TIME ZONE link_record.timezone, 'Day'));
    day_of_week := TRIM(day_of_week);
    time_start := (p_start_time AT TIME ZONE link_record.timezone)::TIME;
    time_end := (p_end_time AT TIME ZONE link_record.timezone)::TIME;
    
    -- Check working hours
    working_hours_for_day := link_record.working_hours -> day_of_week;
    
    IF working_hours_for_day IS NULL THEN
        RETURN FALSE; -- Day not available
    END IF;
    
    IF time_start < (working_hours_for_day ->> 'start')::TIME OR 
       time_end > (working_hours_for_day ->> 'end')::TIME THEN
        RETURN FALSE; -- Outside working hours
    END IF;
    
    -- Check daily booking limit
    SELECT COUNT(*) INTO existing_bookings
    FROM bookings
    WHERE booking_link_id = p_booking_link_id
    AND DATE(start_time AT TIME ZONE link_record.timezone) = DATE(p_start_time AT TIME ZONE link_record.timezone)
    AND status IN ('confirmed', 'completed');
    
    IF existing_bookings >= link_record.max_bookings_per_day THEN
        RETURN FALSE;
    END IF;
    
    -- Check for conflicting bookings (with buffer time)
    SELECT COUNT(*) INTO existing_bookings
    FROM bookings
    WHERE booking_link_id = p_booking_link_id
    AND status IN ('confirmed', 'completed')
    AND (
        (start_time - (link_record.buffer_before_minutes || ' minutes')::INTERVAL) < p_end_time
        AND
        (end_time + (link_record.buffer_after_minutes || ' minutes')::INTERVAL) > p_start_time
    );
    
    IF existing_bookings > 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check custom availability blocks
    SELECT COUNT(*) INTO existing_bookings
    FROM booking_availability
    WHERE booking_link_id = p_booking_link_id
    AND date = DATE(p_start_time AT TIME ZONE link_record.timezone)
    AND availability_type IN ('blocked', 'busy')
    AND (
        start_time < time_end AND end_time > time_start
    );
    
    IF existing_bookings > 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Create function to update lead when booking is made
CREATE OR REPLACE FUNCTION update_lead_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the lead record when a booking is created
    IF TG_OP = 'INSERT' AND NEW.lead_id IS NOT NULL THEN
        UPDATE leads 
        SET 
            call_booked = TRUE,
            call_scheduled = TRUE,
            call_scheduled_date = NEW.start_time,
            booking_id = NEW.id,
            engagement_level = CASE 
                WHEN engagement_level NOT IN ('interested', 'hot') THEN 'interested'
                ELSE engagement_level
            END
        WHERE id = NEW.lead_id;
    END IF;
    
    -- Update lead when booking status changes
    IF TG_OP = 'UPDATE' AND NEW.lead_id IS NOT NULL THEN
        UPDATE leads 
        SET 
            call_completed = CASE 
                WHEN NEW.status = 'completed' THEN TRUE
                ELSE call_completed
            END,
            call_scheduled = CASE 
                WHEN NEW.status = 'cancelled' THEN FALSE
                ELSE call_scheduled
            END
        WHERE id = NEW.lead_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for lead updates
CREATE TRIGGER trigger_update_lead_on_booking
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_on_booking();

-- Create function to generate available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
    p_booking_link_id BIGINT,
    p_date DATE,
    p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE(
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ,
    available BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    link_record RECORD;
    day_of_week TEXT;
    working_hours_for_day JSONB;
    work_start TIME;
    work_end TIME;
    current_slot TIMESTAMPTZ;
    slot_duration INTERVAL;
BEGIN
    -- Get booking link details
    SELECT * INTO link_record FROM booking_links WHERE id = p_booking_link_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get day of week
    day_of_week := LOWER(to_char(p_date, 'Day'));
    day_of_week := TRIM(day_of_week);
    
    -- Get working hours for this day
    working_hours_for_day := link_record.working_hours -> day_of_week;
    
    IF working_hours_for_day IS NULL THEN
        RETURN; -- Day not available
    END IF;
    
    work_start := (working_hours_for_day ->> 'start')::TIME;
    work_end := (working_hours_for_day ->> 'end')::TIME;
    slot_duration := (link_record.duration_minutes || ' minutes')::INTERVAL;
    
    -- Generate time slots
    current_slot := (p_date + work_start) AT TIME ZONE p_timezone;
    
    WHILE (current_slot::TIME) <= (work_end - slot_duration::TIME) LOOP
        slot_start := current_slot;
        slot_end := current_slot + slot_duration;
        available := check_booking_availability(p_booking_link_id, slot_start, slot_end);
        
        RETURN NEXT;
        
        current_slot := current_slot + INTERVAL '30 minutes'; -- 30-minute increments
    END LOOP;
END;
$$;

COMMENT ON TABLE booking_links IS 'Calendar booking link configurations for users';
COMMENT ON TABLE bookings IS 'Actual calendar bookings made by leads';
COMMENT ON TABLE booking_availability IS 'Custom availability overrides for booking links';
COMMENT ON FUNCTION check_booking_availability IS 'Checks if a time slot is available for booking';
COMMENT ON FUNCTION get_available_slots IS 'Returns available time slots for a given date and booking link';
