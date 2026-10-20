-- Saved investment analyses, and Kevin's own renovation prices.
--
-- /investments lets a signed-in visitor run any home for sale as a rental, a
-- flip or a BRRRR. Two tables:
--
--   investment_analyses        one per person per home: every input of that
--                              home's analysis, as one jsonb document. Kevin
--                              (the admin) reads them — that is disclosed on
--                              /investments and in the privacy policy, as the
--                              saved homes are.
--   investment_cost_overrides  Kevin's replacement for any line of the cost
--                              book (src/lib/rehabCosts.ts) — a contractor's
--                              price for a roof, a kitchen, a square foot of
--                              new construction. Everyone signed in reads it;
--                              only the admin writes it.
--
-- And admin_client_activity() learns to count analyses, so an investor who has
-- saved nothing but analyses still appears on /admin/activity.
--
-- THE SNAPSHOT IS THE DATABASE'S, as on listing_favorites: address, town and
-- price are copied from idx_listings by the trigger, never taken from the
-- browser, because Kevin reads this table as "what this person is looking at".
-- And once written it does not change — RLS is scoped by row, not by column, so
-- the UPDATE trigger puts the snapshot, the owner and the home back to what
-- they were, whatever an update sends.
--
-- NO FOREIGN KEY TO idx_listings, for the reason no other table here has one:
-- the sync's deletes must never be blocked by, or cascade into, a record of
-- what a person did.

-- ---------------------------------------------------------------------------
-- Analyses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS investment_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  mls_number TEXT NOT NULL CHECK (mls_number ~ '^[0-9]{5,12}$'),
  strategy TEXT NOT NULL DEFAULT 'hold' CHECK (strategy IN ('hold', 'flip', 'brrrr', 'build', 'adu')),
  -- The Scenario document (src/lib/scenario.ts is its contract). Bounded, so a
  -- browser cannot make one row hold a megabyte.
  inputs JSONB NOT NULL CHECK (jsonb_typeof(inputs) = 'object' AND pg_column_size(inputs) <= 32768),

  address TEXT,
  town TEXT,
  state TEXT,
  prop_type TEXT,
  list_price NUMERIC(12, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, mls_number)
);

CREATE INDEX IF NOT EXISTS investment_analyses_recent ON investment_analyses (updated_at DESC);

/*
 * On INSERT: the owner is the caller, the snapshot is the listing's, and one
 * account holds at most 200 analyses. On UPDATE: only `inputs` and `strategy`
 * change; everything else is put back.
 *
 * check_violation with a readable message, because the page shows it verbatim.
 */
CREATE OR REPLACE FUNCTION public.fill_investment_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  l RECORD;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.mls_number := OLD.mls_number;
    NEW.address := OLD.address;
    NEW.town := OLD.town;
    NEW.state := OLD.state;
    NEW.prop_type := OLD.prop_type;
    NEW.list_price := OLD.list_price;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  NEW.user_id := auth.uid();
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to save an analysis.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF (SELECT count(*) FROM investment_analyses WHERE user_id = NEW.user_id) >= 200 THEN
    RAISE EXCEPTION 'You have saved 200 analyses, which is the most one account can hold. Remove a few to save more.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT address, town, state, prop_type, list_price
    INTO l
    FROM idx_listings
   WHERE mls_number = NEW.mls_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That listing is no longer in the feed, so this analysis cannot be saved.'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.address := l.address;
  NEW.town := l.town;
  NEW.state := l.state;
  NEW.prop_type := l.prop_type;
  NEW.list_price := l.list_price;
  NEW.created_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_investment_analysis ON investment_analyses;
CREATE TRIGGER trg_fill_investment_analysis
  BEFORE INSERT OR UPDATE ON investment_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_investment_analysis();

ALTER TABLE investment_analyses ENABLE ROW LEVEL SECURITY;

-- Your own to read, write and remove; every row for the admin to READ. The
-- admin's policy is SELECT only: an investor's assumptions are theirs.
DROP POLICY IF EXISTS "Read own analyses" ON investment_analyses;
CREATE POLICY "Read own analyses" ON investment_analyses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Save an analysis" ON investment_analyses;
CREATE POLICY "Save an analysis" ON investment_analyses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Update own analysis" ON investment_analyses;
CREATE POLICY "Update own analysis" ON investment_analyses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Remove own analysis" ON investment_analyses;
CREATE POLICY "Remove own analysis" ON investment_analyses
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Kevin's prices
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS investment_cost_overrides (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9-]{2,40}$'),
  low NUMERIC(12, 2) NOT NULL CHECK (low >= 0),
  mid NUMERIC(12, 2) NOT NULL,
  high NUMERIC(12, 2) NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID DEFAULT auth.uid(),
  CHECK (low <= mid AND mid <= high)
);

CREATE OR REPLACE FUNCTION public.stamp_investment_cost_override()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_investment_cost_override ON investment_cost_overrides;
CREATE TRIGGER trg_stamp_investment_cost_override
  BEFORE INSERT OR UPDATE ON investment_cost_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_investment_cost_override();

ALTER TABLE investment_cost_overrides ENABLE ROW LEVEL SECURITY;

-- Read by everyone signed in: they are the prices every analysis starts from.
DROP POLICY IF EXISTS "Read cost overrides" ON investment_cost_overrides;
CREATE POLICY "Read cost overrides" ON investment_cost_overrides
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admin writes cost overrides" ON investment_cost_overrides;
CREATE POLICY "Admin writes cost overrides" ON investment_cost_overrides
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- The admin's summary, now with analyses
-- ---------------------------------------------------------------------------

-- The return type changes, which CREATE OR REPLACE cannot do.
DROP FUNCTION IF EXISTS public.admin_client_activity();

CREATE FUNCTION public.admin_client_activity()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  saved_count BIGINT,
  viewed_count BIGINT,
  analysis_count BIGINT,
  last_active TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
-- The OUT columns above are also variables in here, and two of them (user_id,
-- email) share a name with columns the query reads. Columns win.
#variable_conflict use_column
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH f AS (
    SELECT lf.user_id, count(*) AS n, max(lf.created_at) AS latest
      FROM listing_favorites lf
     GROUP BY lf.user_id
  ),
  v AS (
    SELECT lv.user_id, count(*) AS n, max(lv.last_viewed_at) AS latest
      FROM listing_views lv
     GROUP BY lv.user_id
  ),
  a AS (
    SELECT ia.user_id, count(*) AS n, max(ia.updated_at) AS latest
      FROM investment_analyses ia
     GROUP BY ia.user_id
  )
  SELECT u.id,
         u.email::TEXT,
         NULLIF(btrim(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ''),
         COALESCE(f.n, 0),
         COALESCE(v.n, 0),
         COALESCE(a.n, 0),
         GREATEST(f.latest, v.latest, a.latest)
    FROM auth.users u
    LEFT JOIN f ON f.user_id = u.id
    LEFT JOIN v ON v.user_id = u.id
    LEFT JOIN a ON a.user_id = u.id
   WHERE f.user_id IS NOT NULL OR v.user_id IS NOT NULL OR a.user_id IS NOT NULL
   ORDER BY GREATEST(f.latest, v.latest, a.latest) DESC NULLS LAST;
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

-- Supabase's default privileges hand every new table and function to anon and
-- authenticated BY NAME, so revoking from PUBLIC alone leaves them open. Revoke
-- from the roles explicitly, then grant back exactly what is meant.
REVOKE ALL ON investment_analyses, investment_cost_overrides FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON investment_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON investment_cost_overrides TO authenticated;

REVOKE ALL ON FUNCTION public.fill_investment_analysis() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.stamp_investment_cost_override() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_client_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_client_activity() TO authenticated;
