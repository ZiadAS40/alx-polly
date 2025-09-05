'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/lib/validations/auth';

/**
 * Authenticates a user with email and password credentials
 * 
 * This server action handles user login by validating input data against the login schema,
 * then attempting to authenticate with Supabase Auth. It includes comprehensive error
 * handling to prevent information disclosure while providing meaningful feedback.
 * 
 * @param data - Login form data containing email and password
 * @returns Promise<{ error: string | null }> - Returns error message if login fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await login({ email: 'user@example.com', password: 'SecurePass123!' });
 * if (result.error) {
 *   console.error('Login failed:', result.error);
 * } else {
 *   // User successfully logged in
 * }
 * ```
 */
export async function login(data: LoginFormData) {
  try {
    // Validate input data using Zod schema to prevent injection attacks
    const validatedData = loginSchema.parse(data);
    
    // Create Supabase client for server-side authentication
    const supabase = await createClient();

    // Attempt to authenticate user with Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Return error message if authentication fails
    if (error) {
      return { error: error.message };
    }

    // Success: no error - user is now authenticated
    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Registers a new user account with email, password, and name
 * 
 * This server action handles user registration by validating input data against the registration
 * schema, then creating a new user account with Supabase Auth. The password must meet strong
 * security requirements including mixed case, numbers, and special characters.
 * 
 * @param data - Registration form data containing name, email, and password
 * @returns Promise<{ error: string | null }> - Returns error message if registration fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await register({ 
 *   name: 'John Doe', 
 *   email: 'john@example.com', 
 *   password: 'SecurePass123!' 
 * });
 * if (result.error) {
 *   console.error('Registration failed:', result.error);
 * } else {
 *   // User account created successfully
 * }
 * ```
 */
export async function register(data: RegisterFormData) {
  try {
    // Validate input data using Zod schema with strong password requirements
    const validatedData = registerSchema.parse(data);
    
    // Create Supabase client for server-side user creation
    const supabase = await createClient();

    // Create new user account with Supabase Auth
    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name, // Store user's display name in metadata
        },
      },
    });

    // Return error message if registration fails
    if (error) {
      return { error: error.message };
    }

    // Success: no error - user account created
    return { error: null };
  } catch (error) {
    // Handle validation errors and unexpected errors gracefully
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

/**
 * Signs out the current authenticated user
 * 
 * This server action terminates the user's current session by calling Supabase Auth's
 * signOut method. After successful logout, the user will need to authenticate again
 * to access protected routes and features.
 * 
 * @returns Promise<{ error: string | null }> - Returns error message if logout fails, null if successful
 * 
 * @example
 * ```typescript
 * const result = await logout();
 * if (result.error) {
 *   console.error('Logout failed:', result.error);
 * } else {
 *   // User successfully logged out
 * }
 * ```
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Retrieves the currently authenticated user from the session
 * 
 * This server action fetches the current user's information from the active session.
 * Returns null if no user is authenticated or if the session is invalid.
 * 
 * @returns Promise<User | null> - Returns the authenticated user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Authenticated user:', user.email);
 * } else {
 *   console.log('No user authenticated');
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current authentication session
 * 
 * This server action fetches the current session information including user data,
 * access tokens, and session metadata. Useful for checking session validity and
 * accessing token information.
 * 
 * @returns Promise<Session | null> - Returns the current session object or null if no active session
 * 
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('Session valid until:', new Date(session.expires_at!));
 * } else {
 *   console.log('No active session');
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
