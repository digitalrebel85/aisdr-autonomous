-- Add timezone support to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text;

-- Create index for timezone queries
CREATE INDEX IF NOT EXISTS idx_leads_timezone ON public.leads(timezone);

-- Function to determine business hours for a timezone
CREATE OR REPLACE FUNCTION is_business_hours_in_timezone(tz text, check_time timestamptz DEFAULT now())
RETURNS boolean AS $$
DECLARE
    local_time time;
    local_hour integer;
    local_day_of_week integer;
BEGIN
    -- Convert UTC time to the specified timezone
    local_time := (check_time AT TIME ZONE tz)::time;
    local_hour := EXTRACT(hour FROM local_time);
    local_day_of_week := EXTRACT(dow FROM (check_time AT TIME ZONE tz)); -- 0=Sunday, 1=Monday, etc.
    
    -- Check if it's a weekday (Monday=1 to Friday=5)
    IF local_day_of_week < 1 OR local_day_of_week > 5 THEN
        RETURN false;
    END IF;
    
    -- Check if it's business hours (9 AM to 5 PM)
    IF local_hour >= 9 AND local_hour < 17 THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get next business hour in a timezone
CREATE OR REPLACE FUNCTION get_next_business_hour_in_timezone(tz text, from_time timestamptz DEFAULT now())
RETURNS timestamptz AS $$
DECLARE
    result_time timestamptz;
    local_time timestamptz;
    local_hour integer;
    local_day_of_week integer;
    days_to_add integer := 0;
BEGIN
    result_time := from_time;
    
    -- Loop until we find a business hour
    FOR i IN 1..14 LOOP -- Max 2 weeks ahead
        local_time := result_time AT TIME ZONE tz;
        local_hour := EXTRACT(hour FROM local_time);
        local_day_of_week := EXTRACT(dow FROM local_time);
        
        -- If it's a weekday
        IF local_day_of_week >= 1 AND local_day_of_week <= 5 THEN
            -- If before 9 AM, set to 9 AM same day
            IF local_hour < 9 THEN
                result_time := date_trunc('day', local_time) + interval '9 hours';
                result_time := result_time AT TIME ZONE tz AT TIME ZONE 'UTC';
                -- Add random minutes (0-59) for human-like variation
                result_time := result_time + (random() * interval '59 minutes');
                RETURN result_time;
            -- If during business hours, return as-is (or add small delay)
            ELSIF local_hour >= 9 AND local_hour < 17 THEN
                RETURN result_time + (random() * interval '30 minutes');
            -- If after 5 PM, move to next day 9 AM
            ELSE
                result_time := date_trunc('day', local_time) + interval '1 day' + interval '9 hours';
                result_time := result_time AT TIME ZONE tz AT TIME ZONE 'UTC';
                result_time := result_time + (random() * interval '59 minutes');
                RETURN result_time;
            END IF;
        ELSE
            -- Weekend, move to next Monday 9 AM
            days_to_add := (8 - local_day_of_week) % 7;
            IF days_to_add = 0 THEN days_to_add := 1; END IF; -- If Sunday, go to Monday
            
            result_time := date_trunc('day', local_time) + (days_to_add || ' days')::interval + interval '9 hours';
            result_time := result_time AT TIME ZONE tz AT TIME ZONE 'UTC';
            result_time := result_time + (random() * interval '59 minutes');
            RETURN result_time;
        END IF;
        
        -- Move to next day if we haven't found a slot
        result_time := result_time + interval '1 day';
    END LOOP;
    
    -- Fallback: return original time + 1 day
    RETURN from_time + interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Common timezone mappings for leads (can be expanded)
CREATE TABLE IF NOT EXISTS public.timezone_mappings (
    country_code text PRIMARY KEY,
    country_name text NOT NULL,
    default_timezone text NOT NULL,
    common_timezones text[] DEFAULT ARRAY[]::text[]
);

-- Insert common timezone mappings
INSERT INTO public.timezone_mappings (country_code, country_name, default_timezone, common_timezones) VALUES
-- North America
('US', 'United States', 'America/New_York', ARRAY['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles']),
('CA', 'Canada', 'America/Toronto', ARRAY['America/Toronto', 'America/Vancouver', 'America/Edmonton']),
('MX', 'Mexico', 'America/Mexico_City', ARRAY['America/Mexico_City', 'America/Tijuana']),

-- Europe
('GB', 'United Kingdom', 'Europe/London', ARRAY['Europe/London']),
('DE', 'Germany', 'Europe/Berlin', ARRAY['Europe/Berlin']),
('FR', 'France', 'Europe/Paris', ARRAY['Europe/Paris']),
('NL', 'Netherlands', 'Europe/Amsterdam', ARRAY['Europe/Amsterdam']),
('IT', 'Italy', 'Europe/Rome', ARRAY['Europe/Rome']),
('ES', 'Spain', 'Europe/Madrid', ARRAY['Europe/Madrid']),
('CH', 'Switzerland', 'Europe/Zurich', ARRAY['Europe/Zurich']),
('SE', 'Sweden', 'Europe/Stockholm', ARRAY['Europe/Stockholm']),
('NO', 'Norway', 'Europe/Oslo', ARRAY['Europe/Oslo']),
('DK', 'Denmark', 'Europe/Copenhagen', ARRAY['Europe/Copenhagen']),

-- Asia Pacific
('JP', 'Japan', 'Asia/Tokyo', ARRAY['Asia/Tokyo']),
('IN', 'India', 'Asia/Kolkata', ARRAY['Asia/Kolkata']),
('SG', 'Singapore', 'Asia/Singapore', ARRAY['Asia/Singapore']),
('AU', 'Australia', 'Australia/Sydney', ARRAY['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth']),
('CN', 'China', 'Asia/Shanghai', ARRAY['Asia/Shanghai']),
('KR', 'South Korea', 'Asia/Seoul', ARRAY['Asia/Seoul']),
('TH', 'Thailand', 'Asia/Bangkok', ARRAY['Asia/Bangkok']),
('MY', 'Malaysia', 'Asia/Kuala_Lumpur', ARRAY['Asia/Kuala_Lumpur']),
('PH', 'Philippines', 'Asia/Manila', ARRAY['Asia/Manila']),
('ID', 'Indonesia', 'Asia/Jakarta', ARRAY['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']),
('VN', 'Vietnam', 'Asia/Ho_Chi_Minh', ARRAY['Asia/Ho_Chi_Minh']),

-- Middle East & Africa
('LB', 'Lebanon', 'Asia/Beirut', ARRAY['Asia/Beirut']),
('AE', 'United Arab Emirates', 'Asia/Dubai', ARRAY['Asia/Dubai']),
('SA', 'Saudi Arabia', 'Asia/Riyadh', ARRAY['Asia/Riyadh']),
('IL', 'Israel', 'Asia/Jerusalem', ARRAY['Asia/Jerusalem']),
('TR', 'Turkey', 'Europe/Istanbul', ARRAY['Europe/Istanbul']),
('EG', 'Egypt', 'Africa/Cairo', ARRAY['Africa/Cairo']),
('ZA', 'South Africa', 'Africa/Johannesburg', ARRAY['Africa/Johannesburg']),
('KE', 'Kenya', 'Africa/Nairobi', ARRAY['Africa/Nairobi']),
('NG', 'Nigeria', 'Africa/Lagos', ARRAY['Africa/Lagos']),

-- South America
('BR', 'Brazil', 'America/Sao_Paulo', ARRAY['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza']),
('AR', 'Argentina', 'America/Argentina/Buenos_Aires', ARRAY['America/Argentina/Buenos_Aires']),
('CL', 'Chile', 'America/Santiago', ARRAY['America/Santiago']),
('CO', 'Colombia', 'America/Bogota', ARRAY['America/Bogota']),
('PE', 'Peru', 'America/Lima', ARRAY['America/Lima'])
ON CONFLICT (country_code) DO NOTHING;
