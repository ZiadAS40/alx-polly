'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication context interface defining the shape of auth state and methods
 * 
 * This interface provides type safety for authentication state management across
 * the application, including user session data, loading states, and logout functionality.
 */
const AuthContext = createContext<{ 
  session: Session | null;    // Current authentication session
  user: User | null;          // Current authenticated user
  signOut: () => void;        // Function to sign out the current user
  loading: boolean;           // Loading state for authentication operations
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication Provider Component
 * 
 * This component provides authentication state management throughout the application.
 * It handles user session initialization, authentication state changes, and provides
 * a centralized way to access user data and authentication methods.
 * 
 * Key Features:
 * - Automatic session restoration on app load
 * - Real-time authentication state updates
 * - Proper cleanup of event listeners
 * - Loading state management during auth operations
 * 
 * @param children - React children components that will have access to auth context
 * @returns JSX element providing authentication context to children
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Create Supabase client instance (memoized to prevent unnecessary re-renders)
  const supabase = useMemo(() => createClient(), []);
  
  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    /**
     * Initial user data fetch on component mount
     * 
     * This function retrieves the current user from Supabase Auth and updates
     * the context state. It handles errors gracefully and ensures the component
     * is still mounted before updating state to prevent memory leaks.
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null);
        setLoading(false);
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    // Fetch initial user data
    getUser();

    /**
     * Real-time authentication state change listener
     * 
     * This listener responds to authentication events like login, logout, and
     * token refresh. It automatically updates the context state when the
     * authentication state changes, providing real-time updates across the app.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Do not set loading to false here, only after initial load
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out function that terminates the current user session
   * 
   * This function calls Supabase Auth's signOut method to end the current
   * user session. The auth state change listener will automatically update
   * the context state when the logout completes.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  console.log('AuthContext: user', user);
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * This hook provides a convenient way to access authentication state and methods
 * from any component within the AuthProvider tree. It returns the current user,
 * session, loading state, and signOut function.
 * 
 * @returns Authentication context object containing user, session, loading state, and signOut function
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, loading, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = () => useContext(AuthContext);
