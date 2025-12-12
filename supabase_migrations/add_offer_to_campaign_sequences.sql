-- ============================================================================
-- Add offer_id to campaign_sequences table
-- Links campaigns to specific offers for better email generation
-- ============================================================================

-- Add offer_id column to campaign_sequences
ALTER TABLE public.campaign_sequences
ADD COLUMN IF NOT EXISTS offer_id BIGINT REFERENCES public.offers(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_offer_id 
ON public.campaign_sequences(offer_id);

-- Add comment
COMMENT ON COLUMN public.campaign_sequences.offer_id IS 'Links campaign to a specific offer for value proposition and CTA';
