-- supabase/migrations/YYYYMMDDHHMMSS_create_leads_table.sql

CREATE TABLE public.leads (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    title TEXT,
    company TEXT,
    pain_points TEXT[],
    offer TEXT,
    cta TEXT,
    UNIQUE(user_id, email)
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads" ON public.leads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" ON public.leads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" ON public.leads
    FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.leads IS 'Stores contextual information about sales leads.';
