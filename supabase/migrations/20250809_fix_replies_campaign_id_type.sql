-- Fix original_campaign_id column type from bigint to uuid
-- The campaigns table uses UUID for its primary key

-- Drop the existing column if it exists and recreate with correct type
DO $$
BEGIN
  -- Check if the column exists
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='replies' AND column_name='original_campaign_id') THEN
    -- Drop the existing column
    ALTER TABLE public.replies DROP COLUMN original_campaign_id;
  END IF;
  
  -- Add the column with the correct UUID type
  ALTER TABLE public.replies ADD COLUMN original_campaign_id UUID;
END$$;

COMMENT ON COLUMN public.replies.original_campaign_id IS 'Links the reply to the original campaign that initiated the conversation.';
