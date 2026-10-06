-- Stand-ins for what Supabase Auth provides, for the tests that exercise RLS.
--
-- The comparable-sales tests need none of this — they run as the owner and
-- touch no per-user data — so it is a separate file applied after them rather
-- than more weight on 00_bootstrap.sql.
--
-- `auth.uid()` reads the same setting PostgREST sets from the JWT, so a test
-- becomes "user X" exactly the way a request does: SET ROLE authenticated, and
-- set request.jwt.claim.sub. `public.is_admin()` is copied from
-- 20240320000011_fix_admin_function_for_app_metadata.sql as it stands.

CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT,
  raw_app_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE FUNCTION auth.uid() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID;
$$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

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
