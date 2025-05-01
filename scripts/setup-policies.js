const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zvipgykolpoxukyjgffx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'contact_first_names',
  'contact_last_names',
  'contact_emails',
  'contact_phones',
  'contact_messages'
];

async function setupPolicies() {
  for (const table of tables) {
    // Enable RLS
    await supabase.rpc('enable_rls', { table_name: table });

    // Create INSERT policy
    await supabase.rpc('create_policy', {
      table_name: table,
      policy_name: `Allow anonymous inserts to ${table}`,
      operation: 'INSERT',
      role: 'anon',
      using_expr: 'true',
      check_expr: 'true'
    });

    // Create SELECT policy
    await supabase.rpc('create_policy', {
      table_name: table,
      policy_name: `Allow anonymous selects from ${table}`,
      operation: 'SELECT',
      role: 'anon',
      using_expr: 'true'
    });
  }
}

setupPolicies().catch(console.error);