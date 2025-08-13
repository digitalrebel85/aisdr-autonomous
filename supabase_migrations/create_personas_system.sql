-- Create personas system with hybrid matching support
-- This migration creates personas table, updates leads table, and adds review queue

-- Create personas table
CREATE TABLE IF NOT EXISTS public.personas (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  title_patterns text[] NOT NULL DEFAULT '{}',
  company_size_min integer,
  company_size_max integer,
  company_size_text text, -- For ranges like "50-200 employees"
  industries text[] NOT NULL DEFAULT '{}',
  pain_points text[] NOT NULL DEFAULT '{}',
  messaging_hooks text[] NOT NULL DEFAULT '{}',
  tone text NOT NULL DEFAULT 'professional',
  is_default boolean NOT NULL DEFAULT false,
  usage_count integer NOT NULL DEFAULT 0,
  conversion_rate float DEFAULT 0.0,
  effectiveness_score float DEFAULT 0.0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT personas_pkey PRIMARY KEY (id),
  CONSTRAINT personas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT personas_tone_check CHECK (tone IN ('professional', 'casual', 'technical', 'friendly', 'formal'))
) TABLESPACE pg_default;

-- Create indexes for personas
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_personas_is_default ON public.personas USING btree (user_id, is_default) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_personas_industries ON public.personas USING gin (industries) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_personas_title_patterns ON public.personas USING gin (title_patterns) TABLESPACE pg_default;

-- Add persona relationship to leads table (if leads table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
    -- Add persona columns to leads
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona_id bigint REFERENCES public.personas(id);
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona_match_status text DEFAULT 'pending';
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona_confidence float DEFAULT 0.0;
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS persona_assigned_at timestamp with time zone;
    
    -- Create index for persona lookups
    CREATE INDEX IF NOT EXISTS idx_leads_persona_id ON public.leads USING btree (persona_id) TABLESPACE pg_default;
    CREATE INDEX IF NOT EXISTS idx_leads_persona_status ON public.leads USING btree (user_id, persona_match_status) TABLESPACE pg_default;
  END IF;
END $$;

-- Create persona review queue for manual review of low-confidence matches
CREATE TABLE IF NOT EXISTS public.persona_review_queue (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  lead_id bigint,
  suggested_persona_id bigint,
  confidence float NOT NULL,
  match_reasons text[],
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT persona_review_queue_pkey PRIMARY KEY (id),
  CONSTRAINT persona_review_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT persona_review_queue_suggested_persona_fkey FOREIGN KEY (suggested_persona_id) REFERENCES public.personas (id) ON DELETE CASCADE,
  CONSTRAINT persona_review_queue_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'modified'))
) TABLESPACE pg_default;

-- Create indexes for review queue
CREATE INDEX IF NOT EXISTS idx_persona_review_queue_user_id ON public.persona_review_queue USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_persona_review_queue_status ON public.persona_review_queue USING btree (user_id, status) TABLESPACE pg_default;

-- Create persona effectiveness tracking
CREATE TABLE IF NOT EXISTS public.persona_effectiveness (
  id bigserial NOT NULL,
  user_id uuid NOT NULL,
  persona_id bigint NOT NULL,
  lead_id bigint,
  interaction_type text NOT NULL, -- 'email_sent', 'reply_received', 'meeting_booked', 'deal_closed'
  outcome text NOT NULL, -- 'positive', 'negative', 'neutral'
  effectiveness_score float DEFAULT 0.0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT persona_effectiveness_pkey PRIMARY KEY (id),
  CONSTRAINT persona_effectiveness_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT persona_effectiveness_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create index for effectiveness tracking
CREATE INDEX IF NOT EXISTS idx_persona_effectiveness_persona_id ON public.persona_effectiveness USING btree (persona_id) TABLESPACE pg_default;

-- Enable Row Level Security
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_effectiveness ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personas
CREATE POLICY "Users can view their own personas" ON public.personas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personas" ON public.personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personas" ON public.personas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personas" ON public.personas
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for review queue
CREATE POLICY "Users can view their own review queue" ON public.persona_review_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review items" ON public.persona_review_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review items" ON public.persona_review_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for effectiveness tracking
CREATE POLICY "Users can view their own effectiveness data" ON public.persona_effectiveness
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own effectiveness data" ON public.persona_effectiveness
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default persona for each user (this will be done via application logic)
-- We'll create a function to ensure each user has a default persona

-- Create function to create default persona for new users
CREATE OR REPLACE FUNCTION create_default_persona_for_user(user_uuid uuid)
RETURNS bigint AS $$
DECLARE
  persona_id bigint;
BEGIN
  INSERT INTO public.personas (
    user_id,
    name,
    description,
    title_patterns,
    industries,
    pain_points,
    messaging_hooks,
    tone,
    is_default
  ) VALUES (
    user_uuid,
    'Default Business Professional',
    'Generic persona for leads that don''t match specific criteria',
    ARRAY['Manager', 'Director', 'VP', 'Executive', 'Owner', 'Founder'],
    ARRAY['Technology', 'Business Services', 'Professional Services'],
    ARRAY['Manual processes', 'Time constraints', 'Resource limitations', 'Efficiency challenges'],
    ARRAY['Improve efficiency', 'Save time', 'Increase ROI', 'Streamline operations'],
    'professional',
    true
  ) RETURNING id INTO persona_id;
  
  RETURN persona_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create default persona for new users
CREATE OR REPLACE FUNCTION auto_create_default_persona()
RETURNS trigger AS $$
BEGIN
  PERFORM create_default_persona_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger would be created on auth.users, but we can't access that directly
-- Instead, we'll handle this in the application when a user first accesses personas

-- Create updated_at trigger for personas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data will be inserted via application logic when users first access personas
-- This ensures proper user_id assignment and avoids hardcoded UUIDs

-- Migration completed successfully
