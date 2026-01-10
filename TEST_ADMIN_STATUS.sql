-- Test script to verify admin status
-- Run this in Supabase SQL Editor to check if is_admin() is working

-- 1. Check your app_metadata directly (this is the source of truth)
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_app_meta_data->>'is_admin' as is_admin_from_metadata,
  (raw_app_meta_data->>'is_admin')::boolean as is_admin_boolean
FROM auth.users
WHERE email = 'knhoangre@gmail.com';

-- 2. Test the is_admin() function with your user ID explicitly
-- Replace 'YOUR_USER_ID' with the id from query 1 above
SELECT 
  id as user_id,
  email,
  public.is_admin(id) as is_admin_result
FROM auth.users
WHERE email = 'knhoangre@gmail.com';

-- 3. If is_admin_from_metadata is null or false, run this to set it:
-- UPDATE auth.users
-- SET raw_app_meta_data = jsonb_set(
--   COALESCE(raw_app_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'knhoangre@gmail.com';

-- 4. Test if you can query open_house_sign_ins directly (bypassing RLS)
-- This should work regardless of RLS policies
SET ROLE service_role;
SELECT COUNT(*) as total_sign_ins FROM open_house_sign_ins;
RESET ROLE;

-- 5. Check existing policies on open_house_sign_ins
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'open_house_sign_ins'
ORDER BY policyname;

