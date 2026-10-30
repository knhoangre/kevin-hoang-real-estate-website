-- What was still looser than it needed to be after 20261028100000, from a
-- review of the whole live schema on 2026-10-28 (Kevin asked for one). None of
-- these exposed a client's data the way the CRM did; each is a door that did
-- not need to be open.
--
--   1. The sync log printed Kevin's MLS PIN user id to anyone.
--   2. Any signed-in visitor could write rows into the CRM's deals.
--   3. is_admin(uuid) answered "is this account the admin?" for anyone, and
--      five SECURITY DEFINER functions resolved names through the caller's
--      search_path.
--   4. The anon role still held INSERT/UPDATE/DELETE on every table in public.
--      Nothing signed out writes to a table — the forms post to edge functions
--      — so RLS was the only thing between the public key and a write. Now the
--      grant is a second lock, and a policy made in a hurry cannot open one.
--
-- It also reports which role the scheduler's vault key carries, for the reason
-- given at the end.

-- ---------------------------------------------------------------------------
-- 1. The sync log, without its error text
-- ---------------------------------------------------------------------------
-- /search reads when the feed last loaded (MLS PIN requires the date be shown),
-- so the table stays readable. Its `error` column does not: 547 of them were
-- public, many carrying the feed URL with Kevin's MLS PIN user id in it, beside
-- 266 "MLS PIN login failed — check MLSPIN_USERNAME / MLSPIN_PASSWORD".
-- Column grants: `select=*` is now refused for anon, `select=finished_at` is not.

DO $$
BEGIN
  IF to_regclass('public.idx_sync_runs') IS NOT NULL THEN
    REVOKE SELECT ON public.idx_sync_runs FROM anon, authenticated;
    GRANT SELECT (id, started_at, finished_at, ok, rows_upserted, rows_deleted)
      ON public.idx_sync_runs TO anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Deals are the admin's
-- ---------------------------------------------------------------------------
-- The CRM's deals board is admin-only, but the table let any signed-in account
-- insert, read and edit rows of its own — rows the admin's "view all" policy
-- then put on his dashboard. Guarded, because the test database has no deals.

DO $$
BEGIN
  IF to_regclass('public.deals') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
    DROP POLICY IF EXISTS "Users can insert their own deals" ON public.deals;
    DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
    DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;
    DROP POLICY IF EXISTS "Admins can view all deals" ON public.deals;
    DROP POLICY IF EXISTS "Admin manages deals" ON public.deals;
    CREATE POLICY "Admin manages deals" ON public.deals FOR ALL TO authenticated
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. is_admin(uuid), and search_path on SECURITY DEFINER functions
-- ---------------------------------------------------------------------------
-- Live has two overloads: is_admin(), which every policy calls and which asks
-- about the caller, and is_admin(uuid), which it calls as its owner. Only the
-- first needs to be callable. The test database has a single is_admin(uuid
-- DEFAULT auth.uid()) that the policies resolve to, so the revoke is skipped
-- there rather than breaking every admin policy in the suite.

DO $$
BEGIN
  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
    ALTER FUNCTION public.is_admin() SET search_path = '';
  END IF;
  IF to_regprocedure('public.is_admin(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.is_admin(uuid) SET search_path = '';
  END IF;
  -- Trigger functions on the rental tables. Their bodies name
  -- rental_application_documents unqualified, so `public`, not ''.
  IF to_regprocedure('public.guard_rental_document_count()') IS NOT NULL THEN
    ALTER FUNCTION public.guard_rental_document_count() SET search_path = public;
  END IF;
  IF to_regprocedure('public.guard_rental_object_count()') IS NOT NULL THEN
    ALTER FUNCTION public.guard_rental_object_count() SET search_path = public;
  END IF;
  IF to_regprocedure('public.guard_submitted_rental_application()') IS NOT NULL THEN
    ALTER FUNCTION public.guard_submitted_rental_application() SET search_path = public;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. The public key writes nothing directly
-- ---------------------------------------------------------------------------
-- Reads are left to RLS: a signed-out page that asks a private table gets no
-- rows rather than an error, and some do ask before the session has loaded.
-- The default privileges change is what keeps a NEW table from arriving with
-- anon write grants; a feature that genuinely needs one grants it on purpose.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM anon;

-- ---------------------------------------------------------------------------
-- Which role the scheduler's key carries
-- ---------------------------------------------------------------------------
-- pg_cron calls idx-sync and showing-reminders with the vault secret
-- idx_sync_service_key. showing-reminders accepts only the service role, and
-- idx-sync is about to (it took the anon key, so anyone could start a feed
-- sync). If the secret were the anon key, both would stop. This prints the
-- role claim of that key — one word, never the key — so the next step is taken
-- knowing it. Silent where there is no vault (the test database).

DO $$
DECLARE
  claims JSON;
BEGIN
  EXECUTE $q$
    SELECT convert_from(decode(
             rpad(translate(split_part(decrypted_secret, '.', 2), '-_', '+/'),
                  ((length(split_part(decrypted_secret, '.', 2)) + 3) / 4) * 4, '='),
             'base64'), 'utf8')::json
      FROM vault.decrypted_secrets WHERE name = 'idx_sync_service_key'
  $q$ INTO claims;
  RAISE NOTICE 'scheduler key role: %', COALESCE(claims ->> 'role', 'NOT SET');
EXCEPTION
  WHEN invalid_schema_name OR undefined_table THEN NULL;
  WHEN OTHERS THEN RAISE NOTICE 'scheduler key role: unreadable (%)', SQLSTATE;
END $$;
