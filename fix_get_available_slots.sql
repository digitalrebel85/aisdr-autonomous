-- Fix get_available_slots function to properly generate time slots
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
    date_with_time TIMESTAMPTZ;
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
    
    -- Generate time slots properly
    -- Convert date + time to timestamptz in the specified timezone
    date_with_time := (p_date::TEXT || ' ' || work_start::TEXT)::TIMESTAMP AT TIME ZONE p_timezone;
    current_slot := date_with_time;
    
    -- Generate slots until we reach the end of working hours
    WHILE (current_slot AT TIME ZONE p_timezone)::TIME <= (work_end - slot_duration) LOOP
        slot_start := current_slot;
        slot_end := current_slot + slot_duration;
        available := check_booking_availability(p_booking_link_id, slot_start, slot_end);
        
        RETURN NEXT;
        
        current_slot := current_slot + INTERVAL '30 minutes'; -- 30-minute increments
    END LOOP;
END;
$$;
