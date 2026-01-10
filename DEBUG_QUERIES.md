# Debug Queries for Follow Up Data

## Test if you can query the data directly

Run these queries in your Supabase SQL Editor to verify data exists and RLS is working:

### 1. Check if data exists in open_house_sign_ins:

```sql
SELECT COUNT(*) as total_sign_ins FROM open_house_sign_ins;
```

### 2. Check a sample record:

```sql
SELECT 
  o.id,
  o.address,
  o.first_name_id,
  o.last_name_id,
  o.email_id,
  o.phone_id,
  o.works_with_realtor,
  o.realtor_name,
  o.realtor_company,
  o.created_at,
  fn.first_name,
  ln.last_name,
  e.email,
  p.phone
FROM open_house_sign_ins o
LEFT JOIN contact_first_names fn ON o.first_name_id = fn.id
LEFT JOIN contact_last_names ln ON o.last_name_id = ln.id
LEFT JOIN contact_emails e ON o.email_id = e.id
LEFT JOIN contact_phones p ON o.phone_id = p.id
ORDER BY o.created_at DESC
LIMIT 5;
```

### 3. Test the is_admin() function:

```sql
-- This should return true for your user if admin is set correctly
SELECT public.is_admin();
```

### 4. Check RLS policies on open_house_sign_ins:

```sql
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
WHERE tablename = 'open_house_sign_ins';
```

### 5. Test if admin policy works:

```sql
-- This should return rows if you're an admin
SELECT * FROM open_house_sign_ins LIMIT 1;
```

## If the queries work but the frontend doesn't show data:

1. Check browser console for errors
2. Look for RLS policy errors (code: 42501)
3. Verify the is_admin() function returns true
4. Check if contact_* tables have data for the IDs referenced



