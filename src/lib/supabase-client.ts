import { createClient } from '@/utils/supabase/client';

// Re-export for backward compatibility
// Prefer importing createClient from '@/utils/supabase/client' directly
export function getSupabaseClient() {
  return createClient();
}
