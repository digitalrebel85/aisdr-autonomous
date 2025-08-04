-- Create user profiles table for enhanced user management and onboarding
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    company TEXT,
    role TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user profile
CREATE OR REPLACE FUNCTION get_or_create_user_profile(user_uuid UUID)
RETURNS public.user_profiles AS $$
DECLARE
    profile public.user_profiles;
BEGIN
    -- Try to get existing profile
    SELECT * INTO profile FROM public.user_profiles WHERE id = user_uuid;
    
    -- If no profile exists, create one
    IF profile.id IS NULL THEN
        INSERT INTO public.user_profiles (id)
        VALUES (user_uuid)
        RETURNING * INTO profile;
    END IF;
    
    RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information and onboarding tracking';
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Whether user has completed initial onboarding';
COMMENT ON COLUMN public.user_profiles.onboarding_step IS 'Current step in onboarding process (0-6)';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences and settings as JSON';
COMMENT ON FUNCTION get_or_create_user_profile(UUID) IS 'Gets existing profile or creates new one for user';
