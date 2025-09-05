import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations
 * 
 * This function creates a Supabase client configured for server-side usage in Next.js
 * Server Components and Server Actions. It handles cookie management for authentication
 * and is optimized for server-side data fetching and mutations.
 * 
 * Key Features:
 * - Server-side authentication with cookie handling
 * - Automatic session management
 * - Error handling for Server Component context
 * - Secure access to user sessions
 * 
 * @returns Promise<SupabaseClient> - Configured Supabase client instance for server usage
 * 
 * @example
 * ```typescript
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all cookies for the current request
         * Used by Supabase to access authentication cookies
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * Sets cookies for the current response
         * Used by Supabase to manage authentication state
         * 
         * Note: This may fail in Server Components, which is handled gracefully
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}