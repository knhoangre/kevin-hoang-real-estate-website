# Apply Open House Sign-Ins Migration

The database table needs to be created. Here's how to apply the migration:

## Option 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/zvipgykolpoxukyjgffx
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/20240320000008_create_open_house_sign_ins_table.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Option 2: Via Supabase CLI

If you want to try applying just this migration, you can connect directly to the database and run the SQL.

## What this migration does:

- Creates the `open_house_sign_ins` table
- Sets up indexes for performance
- Enables Row Level Security (RLS)
- Creates policies to allow public inserts (for the sign-in form)

After applying this migration, the form should work correctly!



