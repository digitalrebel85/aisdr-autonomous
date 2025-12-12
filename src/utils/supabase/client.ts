// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          const value = cookie?.substring(name.length + 1);
          
          // Handle malformed cookies gracefully
          if (!value) return undefined;
          
          try {
            // Decode URI component to handle encoded values
            return decodeURIComponent(value);
          } catch (e) {
            console.warn(`Failed to decode cookie ${name}:`, e);
            return undefined;
          }
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return;
          
          try {
            // Encode the value to handle special characters
            const encodedValue = encodeURIComponent(value);
            let cookie = `${name}=${encodedValue}`;
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
            if (options?.path) cookie += `; path=${options.path}`;
            if (options?.domain) cookie += `; domain=${options.domain}`;
            if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
            if (options?.secure) cookie += '; secure';
            document.cookie = cookie;
          } catch (e) {
            console.error(`Failed to set cookie ${name}:`, e);
          }
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; max-age=0; path=${options?.path || '/'}`;
        },
      },
    }
  )
}