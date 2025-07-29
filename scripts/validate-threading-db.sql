-- Database validation script for threading implementation
-- Run these queries in your Supabase SQL Editor to validate the threading setup

-- ===== STEP 1: Verify Table Structures =====

-- Check sent_emails table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sent_emails' 
AND column_name IN ('reply_to_message_id', 'thread_id', 'campaign_type', 'message_id', 'lead_id')
ORDER BY column_name;

-- Check replies table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'replies' 
AND column_name IN ('thread_id', 'lead_id', 'next_step_prompt', 'raw_response', 'sender_email', 'message_id')
ORDER BY column_name;

-- ===== STEP 2: Check Indexes =====

-- Check threading-related indexes
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE tablename IN ('sent_emails', 'replies')
AND indexname LIKE '%thread%' OR indexname LIKE '%reply%' OR indexname LIKE '%campaign%'
ORDER BY tablename, indexname;

-- ===== STEP 3: Sample Data Analysis =====

-- Check recent sent emails with threading info
SELECT 
    id,
    message_id,
    reply_to_message_id,
    thread_id,
    campaign_type,
    lead_id,
    created_at
FROM sent_emails 
ORDER BY created_at DESC 
LIMIT 10;

-- Check recent replies with threading info
SELECT 
    id,
    message_id,
    thread_id,
    lead_id,
    action,
    sender_email,
    created_at
FROM replies 
ORDER BY created_at DESC 
LIMIT 10;

-- ===== STEP 4: Threading Relationship Analysis =====

-- Find conversations with multiple messages (threaded conversations)
SELECT 
    thread_id,
    COUNT(*) as message_count,
    MIN(created_at) as first_message,
    MAX(created_at) as last_message
FROM (
    SELECT thread_id, created_at FROM sent_emails WHERE thread_id IS NOT NULL
    UNION ALL
    SELECT thread_id, created_at FROM replies WHERE thread_id IS NOT NULL
) combined
GROUP BY thread_id
HAVING COUNT(*) > 1
ORDER BY message_count DESC, last_message DESC;

-- Find reply relationships (sent emails that are replies to received messages)
SELECT 
    s.message_id as sent_message_id,
    s.reply_to_message_id,
    s.thread_id,
    s.campaign_type,
    r.message_id as original_message_id,
    r.sender_email as original_sender,
    s.created_at as reply_sent_at,
    r.created_at as original_received_at
FROM sent_emails s
LEFT JOIN replies r ON s.reply_to_message_id = r.message_id
WHERE s.reply_to_message_id IS NOT NULL
ORDER BY s.created_at DESC;

-- ===== STEP 5: Data Quality Checks =====

-- Check for orphaned threading data
SELECT 'Sent emails with reply_to_message_id but no matching reply' as issue_type, COUNT(*) as count
FROM sent_emails s
LEFT JOIN replies r ON s.reply_to_message_id = r.message_id
WHERE s.reply_to_message_id IS NOT NULL AND r.message_id IS NULL

UNION ALL

SELECT 'Replies without thread_id' as issue_type, COUNT(*) as count
FROM replies 
WHERE thread_id IS NULL

UNION ALL

SELECT 'Sent emails without thread_id but with reply_to_message_id' as issue_type, COUNT(*) as count
FROM sent_emails 
WHERE reply_to_message_id IS NOT NULL AND thread_id IS NULL;

-- ===== STEP 6: Performance Check =====

-- Check if indexes are being used (run EXPLAIN on common queries)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM sent_emails 
WHERE thread_id = 'sample-thread-id';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM replies 
WHERE thread_id = 'sample-thread-id';

-- ===== EXPECTED RESULTS =====

/*
EXPECTED RESULTS:

1. Table Structure Check:
   - sent_emails should have: reply_to_message_id (text), thread_id (text), campaign_type (text)
   - replies should have: thread_id (text), lead_id (bigint), next_step_prompt (text), raw_response (jsonb), sender_email (text)

2. Index Check:
   - Should see indexes like: idx_sent_emails_thread_id, idx_replies_thread_id, etc.

3. Sample Data:
   - Recent records should show populated threading fields when available
   - campaign_type should show 'automated_reply' for AI-generated responses

4. Threading Relationships:
   - Should see conversations with multiple related messages
   - Reply relationships should link sent emails to their original messages

5. Data Quality:
   - Minimal orphaned data (some is normal during development)
   - Most replies should have thread_id populated

6. Performance:
   - Index scans should be used for thread_id queries
   - Query execution should be fast (< 10ms for simple lookups)
*/
