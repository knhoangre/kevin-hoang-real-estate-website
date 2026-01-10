# Fix Admin Function for App Metadata

## Problem
The `is_admin()` function in the database is checking the `profiles` table which doesn't exist. This causes RLS policies to fail, preventing admins from viewing data.

## Solution
Apply the migration to update the `is_admin()` function to check `auth.users.app_metadata.is_admin` instead.

## Steps to Apply

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the entire contents of `supabase/migrations/20240320000011_fix_admin_function_for_app_metadata.sql`
5. Click **Run**

## What This Does

- Drops the old `is_admin()` function that checks the `profiles` table
- Creates a new `is_admin()` function that checks `auth.users.app_meta_data->>'is_admin'`
- This allows RLS policies to correctly identify admin users

## Verify It Works

After applying, test by:
1. Sign out and sign back in
2. Go to Follow Up page
3. Check browser console - you should see data being fetched
4. If you still see errors, check the console for specific RLS policy errors

## SQL to Apply

```sql
-- Fix the is_admin() function to check app_metadata instead of profiles table
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.is_admin();

-- Create new function that checks app_metadata from auth.users
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (raw_app_meta_data->>'is_admin')::boolean,
      false
    )
    FROM auth.users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
```



