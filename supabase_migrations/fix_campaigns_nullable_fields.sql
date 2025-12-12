-- Make offer_id nullable in outreach_campaigns
-- The A/B testing system doesn't always require an offer_id since offers are stored in variants

ALTER TABLE public.outreach_campaigns 
ALTER COLUMN offer_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.outreach_campaigns.offer_id IS 'Optional: Offer ID (can be null for A/B test campaigns where offers are stored in variants)';
