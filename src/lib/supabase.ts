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
  /*
   * `any`, deliberately, and it is masking something worth fixing properly.
   *
   * This mock stands in for a full SupabaseClient when the env vars are absent.
   * Typing it as `SupabaseClient<Database>` instead — the obviously correct
   * thing — makes `supabase` a real typed client at every call site rather than
   * collapsing the union to `any`, and that surfaces 133 type errors across 14
   * files. None of them are caused by this shim: `src/integrations/supabase/
   * types.ts` is generated and currently describes only the eight CRM tables
   * (activities, contact_*, contact_messages, deals, unified_contacts). The app
   * also queries `properties`, `event_sign_ins`, `open_house_sign_ins` and
   * others, none of which are in it.
   *
   * So this one cast is what switches off type checking for every Supabase call
   * in the app. That is how the CRM CSV shipped a blank "Sources" column after
   * `contact.sources` was renamed to `source` — a typed client would have caught
   * it at build time.
   *
   * The fix is to regenerate types.ts against the live schema
   * (`supabase gen types typescript --project-id <id>`), then drop this cast.
   * That needs project credentials, so it is not done here.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see below
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