'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from '@/lib/validations/auth';

export async function login(data: LoginFormData) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(data);
    
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return { error: error.message };
    }

    // Success: no error
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

export async function register(data: RegisterFormData) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(data);
    
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Success: no error
    return { error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'Invalid input data' };
  }
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
