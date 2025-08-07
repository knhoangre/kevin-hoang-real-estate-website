import { createClient } from '@supabase/supabase-js';

// This file should only be used in server-side code
if (typeof window !== 'undefined') {
  throw new Error('This module should only be used in server-side code. For client-side code, use @/integrations/supabase/client instead.');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseServiceKey && 
  supabaseUrl !== 'placeholder' && 
  supabaseServiceKey !== 'placeholder' &&
  supabaseUrl.startsWith('http');

// Create a mock client if Supabase is not configured
const createMockClient = () => {
  console.warn('Supabase not configured for server-side. Using mock client.');
  return {
    auth: {
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
      delete: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    }),
  } as any;
};

export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'real-estate-website-server',
        },
      },
    })
  : createMockClient();