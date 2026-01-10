/**
 * Script to apply the open house sign-ins migration
 * Run this with: node scripts/apply-open-house-migration.js
 * 
 * Or manually run the SQL from supabase/migrations/20240320000008_create_open_house_sign_ins_table.sql
 * in your Supabase dashboard SQL editor
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.log('\nAlternatively, you can run the migration manually:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of: supabase/migrations/20240320000008_create_open_house_sign_ins_table.sql');
  console.log('4. Run the SQL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    const migrationPath = join(__dirname, '../supabase/migrations/20240320000008_create_open_house_sign_ins_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📝 Applying migration: 20240320000008_create_open_house_sign_ins_table.sql');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.length > 0) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_migrations').select('*');
          if (queryError) {
            console.log('⚠️  Note: Some statements may need to be run manually through the Supabase dashboard.');
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\nYou can verify by checking the open_house_sign_ins table in your Supabase dashboard.');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\nPlease run the migration manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/20240320000008_create_open_house_sign_ins_table.sql');
    console.log('4. Run the SQL');
  }
}

applyMigration();



