import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for browser-side operations
 * 
 * This function creates a Supabase client configured for client-side usage in the browser.
 * It uses the public environment variables and is optimized for client-side authentication
 * and data fetching operations.
 * 
 * @returns Configured Supabase client instance for browser usage
 * 
 * @example
 * ```typescript
 * const supabase = createClient();
 * const { data, error } = await supabase.auth.getUser();
 * ```
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
