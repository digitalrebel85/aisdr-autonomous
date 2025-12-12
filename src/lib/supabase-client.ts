import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Singleton pattern to prevent multiple Supabase client instances
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient();
  }
  return supabaseClient;
}
