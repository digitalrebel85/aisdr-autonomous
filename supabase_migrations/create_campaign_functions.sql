-- Create function to increment campaign sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent_count(campaign_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.outreach_campaigns 
    SET sent_count = sent_count + 1
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment campaign failed count
CREATE OR REPLACE FUNCTION increment_campaign_failed_count(campaign_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.outreach_campaigns 
    SET failed_count = failed_count + 1
    WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add campaign_id and campaign_type to sent_emails table if they don't exist
ALTER TABLE public.sent_emails 
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.outreach_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS campaign_type text DEFAULT 'manual';
