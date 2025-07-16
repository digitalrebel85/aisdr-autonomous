-- supabase/migrations/YYYYMMDDHHMMSS_update_replies_table.sql

-- First, check if the column to be renamed exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='replies' AND column_name='action_required') THEN
    ALTER TABLE public.replies RENAME COLUMN action_required TO action;
  END IF;
END$$;

-- Add the new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='replies' AND column_name='action') THEN
    ALTER TABLE public.replies ADD COLUMN action TEXT;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='replies' AND column_name='next_step_prompt') THEN
    ALTER TABLE public.replies ADD COLUMN next_step_prompt TEXT;
  END IF;
END$$;

COMMENT ON COLUMN public.replies.action IS 'The suggested next action (e.g., book_call, follow_up).';
COMMENT ON COLUMN public.replies.next_step_prompt IS 'The suggested response message to send to the lead.';
