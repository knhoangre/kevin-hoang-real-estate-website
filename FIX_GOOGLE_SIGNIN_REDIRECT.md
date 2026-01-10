# Fix Google Sign-In Redirect Issue

## Problem
When signing in with Google, users are being redirected to `https://www.kevinhoang.dev/?code=...` instead of the correct domain (`kevinhoang.co`). The OAuth code is present in the URL, which means the OAuth flow is working, but Supabase is redirecting to the wrong domain.

## Root Cause
The redirect URL is controlled by Supabase's **Site URL** configuration. Even if the code specifies `window.location.origin`, Supabase will use its configured Site URL. Currently, your Supabase Site URL is set to `kevinhoang.dev` instead of `kevinhoang.co`.

## Solution

### Step 1: Update Supabase Site URL (CRITICAL - This is the main fix!)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (the one with URL: `zvipgykolpoxukyjgffx.supabase.co`)
3. Navigate to **Authentication** → **URL Configuration**
4. **IMPORTANT**: Update the **Site URL** from `https://kevinhoang.dev` (or `https://www.kevinhoang.dev`) to: `https://kevinhoang.co` (or `https://www.kevinhoang.co` - use your actual production domain)
5. In the **Redirect URLs** section, add the following URLs (one per line):
   ```
   https://kevinhoang.co
   https://kevinhoang.co/**
   https://www.kevinhoang.co
   https://www.kevinhoang.co/**
   http://localhost:8080
   http://localhost:8080/**
   ```
   **Note**: The `**` wildcard allows all paths under that domain.
6. Click **Save**

**This is the PRIMARY fix** - without updating the Site URL, Google sign-in will continue redirecting to `kevinhoang.dev`.

### Step 2: Update Google OAuth Configuration

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (the one used for Supabase)
4. Click **Edit**
5. In **Authorized redirect URIs**, make sure you have:
   ```
   https://zvipgykolpoxukyjgffx.supabase.co/auth/v1/callback
   ```
6. Click **Save**

### Step 3: Verify the Code Changes

The code has been updated to:
- Use `window.location.origin` instead of `/auth/callback` (in `src/hooks/useAuth.ts`)
- Added an `/auth/callback` route handler (in `src/pages/AuthCallback.tsx`)
- Added the `/complete-profile` route (in `src/App.tsx`)

These changes ensure proper handling of OAuth callbacks, but the **main fix is updating the Supabase Site URL** in Step 1.

## Testing

After making these changes:
1. Clear your browser cache and cookies
2. Try signing in with Google again
3. You should be redirected to `kevinhoang.co` (or your configured domain) instead of `kevinhoang.dev`

## Notes

- The Site URL in Supabase must match your production domain
- The Redirect URLs list allows multiple domains (useful for development and production)
- If you're using a different domain, update both the Site URL and Redirect URLs accordingly

