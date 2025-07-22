-- Helper function to aggregate sentiment counts from a JSONB array of replies
CREATE OR REPLACE FUNCTION count_sentiments(replies_jsonb JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    sentiment_counts JSONB := '{}'::jsonb;
    reply JSONB;
    sentiment TEXT;
BEGIN
    IF replies_jsonb IS NULL THEN
        RETURN sentiment_counts;
    END IF;

    FOR reply IN SELECT * FROM jsonb_array_elements(replies_jsonb)
    LOOP
        sentiment := lower(reply->>'sentiment');
        sentiment_counts := jsonb_set(
            sentiment_counts,
            ARRAY[sentiment],
            to_jsonb(COALESCE((sentiment_counts->>sentiment)::int, 0) + 1)
        );
    END LOOP;

    RETURN sentiment_counts;
END;
$$;

-- Main analytics function to be called from the application
CREATE OR REPLACE FUNCTION get_user_campaign_analytics(p_user_id UUID, p_days INT)
RETURNS JSONB
LANGUAGE sql
AS $$
WITH date_range AS (
    SELECT 
        (NOW() - (p_days || ' days')::INTERVAL) AS start_date,
        NOW() AS end_date
),
sent_emails_in_period AS (
    SELECT id, message_id
    FROM public.sent_emails
    WHERE user_id = p_user_id
      AND created_at >= (SELECT start_date FROM date_range)
      AND created_at <= (SELECT end_date FROM date_range)
),
-- Aggregate events and replies for the sent emails
event_metrics AS (
    SELECT
        COUNT(DISTINCT s.id) AS total_sent,
        COUNT(DISTINCT CASE WHEN e.event_type = 'opened' THEN s.id END) AS total_opened,
        COUNT(DISTINCT CASE WHEN e.event_type = 'bounced' THEN s.id END) AS total_bounced
    FROM sent_emails_in_period s
    LEFT JOIN public.email_events e ON s.message_id = e.message_id
),
reply_metrics AS (
    SELECT
        COUNT(DISTINCT s.id) AS total_replied,
        jsonb_agg(jsonb_build_object('sentiment', r.sentiment)) AS replies
    FROM sent_emails_in_period s
    LEFT JOIN public.replies r ON s.message_id = r.message_id
)
SELECT jsonb_build_object(
    'period_days', p_days,
    'total_sent', em.total_sent,
    'open_rate', CASE WHEN em.total_sent > 0 THEN (em.total_opened::float / em.total_sent * 100) ELSE 0 END,
    'reply_rate', CASE WHEN em.total_sent > 0 THEN (rm.total_replied::float / em.total_sent * 100) ELSE 0 END,
    'bounce_rate', CASE WHEN em.total_sent > 0 THEN (em.total_bounced::float / em.total_sent * 100) ELSE 0 END,
    'total_replies', rm.total_replied,
    'sentiment_breakdown', count_sentiments(rm.replies)
)
FROM event_metrics em, reply_metrics rm;
$$;
