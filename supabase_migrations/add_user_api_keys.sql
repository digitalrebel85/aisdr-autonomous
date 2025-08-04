-- Create table for storing user-specific API keys for enrichment providers
CREATE TABLE public.user_api_keys (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('apollo', 'pdl', 'serper', 'clearbit', 'hunter', 'valueserp', 'builtwith')),
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Ensure one active key per provider per user
    UNIQUE(user_id, provider, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API keys" ON public.user_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" ON public.user_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.user_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.user_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON public.user_api_keys(provider);
CREATE INDEX idx_user_api_keys_active ON public.user_api_keys(is_active) WHERE is_active = true;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_api_keys_updated_at
    BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_user_api_keys_updated_at();

-- Function to get user's API keys for enrichment
CREATE OR REPLACE FUNCTION get_user_api_keys(p_user_id UUID)
RETURNS TABLE(provider TEXT, api_key TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT uak.provider, uak.api_key
    FROM public.user_api_keys uak
    WHERE uak.user_id = p_user_id 
    AND uak.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.user_api_keys IS 'Stores user-specific API keys for enrichment providers';
COMMENT ON COLUMN public.user_api_keys.provider IS 'Enrichment provider name (apollo, pdl, serper, clearbit, hunter)';
COMMENT ON COLUMN public.user_api_keys.api_key IS 'Encrypted API key for the provider';
COMMENT ON COLUMN public.user_api_keys.is_active IS 'Whether this API key is currently active';
COMMENT ON FUNCTION get_user_api_keys(UUID) IS 'Returns active API keys for a user';
