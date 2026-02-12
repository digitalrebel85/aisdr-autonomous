-- ============================================================================
-- SEND TIME OPTIMIZATION
-- Track when emails get opened by timezone/hour, use data to optimize send times
-- ============================================================================

-- Track open events by hour-of-day in lead's timezone
CREATE TABLE IF NOT EXISTS public.send_time_stats (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 1=Mon...
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    open_rate NUMERIC(5,2) DEFAULT 0,
    reply_rate NUMERIC(5,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, timezone, hour_of_day, day_of_week)
);

ALTER TABLE public.send_time_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own send time stats" ON public.send_time_stats;
CREATE POLICY "Users can view their own send time stats" ON public.send_time_stats
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to send_time_stats" ON public.send_time_stats;
CREATE POLICY "Service role full access to send_time_stats" ON public.send_time_stats
    FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_send_time_user_tz ON public.send_time_stats(user_id, timezone);

-- RPC: Get optimal send hour for a timezone (returns hour with highest open rate)
CREATE OR REPLACE FUNCTION get_optimal_send_hour(
    p_user_id UUID,
    p_timezone TEXT DEFAULT 'America/New_York',
    p_day_of_week INTEGER DEFAULT NULL  -- NULL = any weekday
)
RETURNS TABLE(optimal_hour INTEGER, open_rate NUMERIC, sample_size INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.hour_of_day AS optimal_hour,
        s.open_rate,
        s.emails_sent AS sample_size
    FROM public.send_time_stats s
    WHERE s.user_id = p_user_id
      AND s.timezone = p_timezone
      AND s.emails_sent >= 5  -- Need minimum sample
      AND (p_day_of_week IS NULL OR s.day_of_week = p_day_of_week)
      AND s.hour_of_day >= 7  -- Only consider 7am-7pm
      AND s.hour_of_day <= 19
    ORDER BY s.open_rate DESC, s.emails_sent DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get optimal send time as a full timestamp (next occurrence of optimal hour in lead's timezone)
CREATE OR REPLACE FUNCTION get_optimal_send_time(
    p_user_id UUID,
    p_timezone TEXT DEFAULT 'America/New_York',
    p_from_time TIMESTAMPTZ DEFAULT now()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_optimal_hour INTEGER;
    v_local_time TIMESTAMPTZ;
    v_local_hour INTEGER;
    v_local_dow INTEGER;
    v_result TIMESTAMPTZ;
    v_days_ahead INTEGER;
BEGIN
    -- Try to get optimal hour from data
    SELECT optimal_hour INTO v_optimal_hour
    FROM get_optimal_send_hour(p_user_id, p_timezone)
    LIMIT 1;

    -- Fallback to 10am if no data
    IF v_optimal_hour IS NULL THEN
        v_optimal_hour := 10;
    END IF;

    -- Calculate next occurrence of this hour in the lead's timezone
    v_local_time := p_from_time AT TIME ZONE p_timezone;
    v_local_hour := EXTRACT(hour FROM v_local_time);
    v_local_dow := EXTRACT(dow FROM v_local_time);

    -- Start from today
    v_result := date_trunc('day', v_local_time) + (v_optimal_hour || ' hours')::interval;

    -- If the optimal hour has already passed today, move to tomorrow
    IF v_local_hour >= v_optimal_hour THEN
        v_result := v_result + interval '1 day';
    END IF;

    -- Skip weekends
    v_local_dow := EXTRACT(dow FROM v_result);
    IF v_local_dow = 0 THEN  -- Sunday
        v_result := v_result + interval '1 day';
    ELSIF v_local_dow = 6 THEN  -- Saturday
        v_result := v_result + interval '2 days';
    END IF;

    -- Add random jitter (0-45 minutes) for human-like variation
    v_result := v_result + (random() * interval '45 minutes');

    -- Convert back to UTC
    RETURN v_result AT TIME ZONE p_timezone AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Record a send event (called when email is sent)
CREATE OR REPLACE FUNCTION record_send_event(
    p_user_id UUID,
    p_timezone TEXT,
    p_sent_at TIMESTAMPTZ DEFAULT now()
)
RETURNS void AS $$
DECLARE
    v_local_time TIMESTAMPTZ;
    v_hour INTEGER;
    v_dow INTEGER;
BEGIN
    v_local_time := p_sent_at AT TIME ZONE COALESCE(p_timezone, 'America/New_York');
    v_hour := EXTRACT(hour FROM v_local_time);
    v_dow := EXTRACT(dow FROM v_local_time);

    INSERT INTO public.send_time_stats (user_id, timezone, hour_of_day, day_of_week, emails_sent, last_updated)
    VALUES (p_user_id, COALESCE(p_timezone, 'America/New_York'), v_hour, v_dow, 1, now())
    ON CONFLICT (user_id, timezone, hour_of_day, day_of_week)
    DO UPDATE SET
        emails_sent = send_time_stats.emails_sent + 1,
        open_rate = CASE WHEN (send_time_stats.emails_sent + 1) > 0
            THEN ROUND((send_time_stats.emails_opened::numeric / (send_time_stats.emails_sent + 1)) * 100, 2)
            ELSE 0 END,
        reply_rate = CASE WHEN (send_time_stats.emails_sent + 1) > 0
            THEN ROUND((send_time_stats.emails_replied::numeric / (send_time_stats.emails_sent + 1)) * 100, 2)
            ELSE 0 END,
        last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Record an open event (called when email open is detected)
CREATE OR REPLACE FUNCTION record_open_event(
    p_user_id UUID,
    p_timezone TEXT,
    p_sent_at TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    v_local_time TIMESTAMPTZ;
    v_hour INTEGER;
    v_dow INTEGER;
BEGIN
    v_local_time := p_sent_at AT TIME ZONE COALESCE(p_timezone, 'America/New_York');
    v_hour := EXTRACT(hour FROM v_local_time);
    v_dow := EXTRACT(dow FROM v_local_time);

    UPDATE public.send_time_stats
    SET emails_opened = emails_opened + 1,
        open_rate = CASE WHEN emails_sent > 0
            THEN ROUND(((emails_opened + 1)::numeric / emails_sent) * 100, 2)
            ELSE 0 END,
        last_updated = now()
    WHERE user_id = p_user_id
      AND timezone = COALESCE(p_timezone, 'America/New_York')
      AND hour_of_day = v_hour
      AND day_of_week = v_dow;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Record a reply event
CREATE OR REPLACE FUNCTION record_reply_event(
    p_user_id UUID,
    p_timezone TEXT,
    p_sent_at TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    v_local_time TIMESTAMPTZ;
    v_hour INTEGER;
    v_dow INTEGER;
BEGIN
    v_local_time := p_sent_at AT TIME ZONE COALESCE(p_timezone, 'America/New_York');
    v_hour := EXTRACT(hour FROM v_local_time);
    v_dow := EXTRACT(dow FROM v_local_time);

    UPDATE public.send_time_stats
    SET emails_replied = emails_replied + 1,
        reply_rate = CASE WHEN emails_sent > 0
            THEN ROUND(((emails_replied + 1)::numeric / emails_sent) * 100, 2)
            ELSE 0 END,
        last_updated = now()
    WHERE user_id = p_user_id
      AND timezone = COALESCE(p_timezone, 'America/New_York')
      AND hour_of_day = v_hour
      AND day_of_week = v_dow;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.send_time_stats IS 'Tracks email performance by hour/day for send time optimization';
