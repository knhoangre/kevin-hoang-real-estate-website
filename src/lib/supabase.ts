import { createClient } from '@supabase/supabase-js';

// This file should only be used in server-side code
if (typeof window !== 'undefined') {
  throw new Error('This module should only be used in server-side code. For client-side code, use @/integrations/supabase/client instead.');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'real-estate-website-server',
    },
  },
});