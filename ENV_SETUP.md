# Environment Variables Setup

## Supabase Configuration

To fix the "Supabase not configured" error, you need to set up environment variables.

### Steps:

1. **Create a `.env` file** in the project root (same directory as `package.json`)

2. **Add the following variables:**

```env
VITE_SUPABASE_URL=https://zvipgykolpoxukyjgffx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard
   - Select your project (ID: `zvipgykolpoxukyjgffx`)
   - Navigate to: **Settings** → **API**
   - Copy the **Project URL** → Use for `VITE_SUPABASE_URL`
   - Copy the **anon public** key → Use for `VITE_SUPABASE_ANON_KEY`

4. **Restart your development server** after creating/updating the `.env` file

### Example `.env` file:

```env
VITE_SUPABASE_URL=https://zvipgykolpoxukyjgffx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2aXBneWtvbHBveHVreWpnZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDE5NzY4MDAsImV4cCI6MTk1NzU1MjgwMH0.your-actual-key-here
```

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed to version control.



