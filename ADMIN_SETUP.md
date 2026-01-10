# Admin Role Setup Guide

## Overview
This guide explains how to set up and use the admin role system in your Supabase application.

## Database Migration

The admin system has been added via migration `20240320000010_add_admin_role.sql`. This migration:
- Adds an `is_admin` column to the `profiles` table
- Creates a helper function `is_admin()` to check admin status
- Updates RLS policies to allow admins to view all data
- Grants admins access to:
  - All profiles
  - All contact messages
  - All open house sign-ins
  - All contact data (names, emails, phones, sources)

## Making a User an Admin

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Table Editor** → **profiles**
4. Find the user you want to make an admin
5. Click on the row to edit it
6. Set `is_admin` to `true`
7. Save the changes

### Option 2: Via SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL (replace `USER_EMAIL_HERE` with the actual email):

```sql
-- Make a user an admin by email
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'USER_EMAIL_HERE';
```

Or by user ID:

```sql
-- Make a user an admin by user ID
UPDATE public.profiles
SET is_admin = TRUE
WHERE id = 'USER_UUID_HERE';
```

### Option 3: Via Supabase CLI

```bash
supabase db execute "
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'USER_EMAIL_HERE';
"
```

## Using Admin Status in Frontend

### Check if User is Admin

```typescript
import { useAdmin } from '@/hooks/useAdmin';

function MyComponent() {
  const { isAdmin, isLoading } = useAdmin();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (isAdmin) {
    return <div>Admin Dashboard</div>;
  }
  
  return <div>Regular User View</div>;
}
```

### Using AuthContext Directly

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAdmin, user } = useAuth();
  
  if (isAdmin) {
    // Show admin features
  }
}
```

## Admin Capabilities

Admins can:
- View all user profiles (not just their own)
- View all contact messages
- View all open house sign-ins
- View all contact data (first names, last names, emails, phones, sources)
- Update any user profile

Regular users can:
- View only their own profile
- Insert contact data (via forms)
- Cannot view other users' data

## Security Notes

- Admin status is checked server-side via RLS policies
- The `is_admin()` function is marked as `SECURITY DEFINER` for proper permission checks
- Admin status is cached in the frontend AuthContext but verified on each database query
- Always verify admin status on the backend for sensitive operations

## Removing Admin Status

To remove admin status from a user:

```sql
UPDATE public.profiles
SET is_admin = FALSE
WHERE email = 'USER_EMAIL_HERE';
```

## Troubleshooting

### User can't see admin features
1. Verify the user has `is_admin = TRUE` in the `profiles` table
2. Check that the migration `20240320000010_add_admin_role.sql` has been applied
3. Ensure the user has refreshed their session (sign out and sign back in)
4. Check browser console for any errors

### RLS policies not working
1. Verify RLS is enabled on all tables: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Check that the `is_admin()` function exists: `SELECT public.is_admin();`
3. Verify policies exist: Check `pg_policies` table in Supabase



