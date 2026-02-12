-- Expand user_api_keys to support additional lead discovery providers
-- Drop the old CHECK constraint and replace with an expanded one

ALTER TABLE public.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;

ALTER TABLE public.user_api_keys ADD CONSTRAINT user_api_keys_provider_check 
    CHECK (provider IN (
        -- Enrichment providers (existing)
        'apollo', 'pdl', 'serper', 'clearbit', 'hunter', 'valueserp', 'builtwith',
        -- Lead discovery providers (new)
        'icypeas', 'findymail', 'zoominfo', 'snov', 'lusha', 'rocketreach',
        'kaspr', 'cognism', 'leadiq', 'seamless', 'uplead',
        -- Catch-all for future providers
        'custom'
    ));
