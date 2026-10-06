-- Saved homes, and what a signed-in visitor has looked at.
--
-- Until now an account on this site was good for one thing: filling in a rental
-- application. A buyer who signed in could search exactly as a stranger could —
-- nothing they found was kept, so the place they kept it was Zillow, and Kevin
-- learned what a client liked only when the client told him.
--
-- Two tables:
--
--   listing_favorites   the homes somebody pressed the heart on.
--   listing_views       the homes they opened, and how often.
--
-- Both feed the "Recommended for you" list on /saved, and both are readable by
-- the admin — that is disclosed in the privacy policy and on /saved itself.
--
-- EVERY ROW CARRIES A SNAPSHOT, AND THE DATABASE WRITES IT.
--
-- idx_listings is a cache of the MLS feed: a home that goes under agreement or
-- is withdrawn is deleted from it within hours. A favourite that was only an
-- MLS number would turn into a blank card the moment the thing that made it
-- interesting — somebody else wanting it — happened. So each row keeps the
-- address, town and price as they were.
--
-- The snapshot is copied from idx_listings HERE, by a trigger and by the view
-- RPC, never accepted from the browser. A client that could write its own
-- snapshot could put any address and any price into the list Kevin reads as
-- "what this client is looking at".
--
-- NO FOREIGN KEY TO idx_listings, for the reason open_house_sign_ins.mls_number
-- has none: the sync's deletes must never be blocked by, or cascade into, a
-- record of what a person did.

-- ---------------------------------------------------------------------------
-- Favourites
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listing_favorites (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  mls_number TEXT NOT NULL CHECK (mls_number ~ '^[0-9]{5,12}$'),

  address TEXT,
  town TEXT,
  state TEXT,
  zip TEXT,
  prop_type TEXT,
  list_price NUMERIC(12, 2),
  bedrooms INTEGER,
  full_baths INTEGER,
  half_baths INTEGER,
  living_area INTEGER,
  photo_count INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mls_number)
);

-- The admin's "who saved what, lately" reads newest first across everyone.
CREATE INDEX IF NOT EXISTS listing_favorites_recent ON listing_favorites (created_at DESC);

/*
 * Fills the snapshot and pins the owner.
 *
 * Three things, all of which the INSERT policy alone could not do:
 *
 *   1. `user_id` is forced to the caller. The policy already refuses a row for
 *      somebody else; this makes it unnecessary to send the column at all.
 *   2. The snapshot is overwritten from idx_listings, whatever was sent.
 *   3. A number that is not a listing is refused, and so is the 501st favourite.
 *      Reaching this needs only a confirmed account, so it gets a ceiling, like
 *      the rental documents do — not a captcha, a limit on what one account can
 *      make this table hold.
 *
 * check_violation with a readable message, because the page shows it verbatim.
 */
CREATE OR REPLACE FUNCTION public.fill_listing_favorite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  l RECORD;
BEGIN
  NEW.user_id := auth.uid();
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to save a home.' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF (SELECT count(*) FROM listing_favorites WHERE user_id = NEW.user_id) >= 500 THEN
    RAISE EXCEPTION 'You have saved 500 homes, which is the most one account can hold. Remove a few to save more.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT address, town, state, zip, prop_type, list_price, bedrooms, full_baths, half_baths,
         living_area, photo_count
    INTO l
    FROM idx_listings
   WHERE mls_number = NEW.mls_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'That listing is no longer available to save.' USING ERRCODE = 'check_violation';
  END IF;

  NEW.address := l.address;
  NEW.town := l.town;
  NEW.state := l.state;
  NEW.zip := l.zip;
  NEW.prop_type := l.prop_type;
  NEW.list_price := l.list_price;
  NEW.bedrooms := l.bedrooms;
  NEW.full_baths := l.full_baths;
  NEW.half_baths := l.half_baths;
  NEW.living_area := l.living_area;
  NEW.photo_count := l.photo_count;
  NEW.created_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_listing_favorite ON listing_favorites;
CREATE TRIGGER trg_fill_listing_favorite
  BEFORE INSERT ON listing_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_listing_favorite();

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS listing_views (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mls_number TEXT NOT NULL CHECK (mls_number ~ '^[0-9]{5,12}$'),

  -- The axes a recommendation is built from, plus enough to print a line.
  address TEXT,
  town TEXT,
  state TEXT,
  zip TEXT,
  prop_type TEXT,
  list_price NUMERIC(12, 2),
  bedrooms INTEGER,
  photo_count INTEGER,

  view_count INTEGER NOT NULL DEFAULT 1,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, mls_number)
);

CREATE INDEX IF NOT EXISTS listing_views_recent ON listing_views (user_id, last_viewed_at DESC);

/*
 * Records that the caller opened a listing.
 *
 * The ONLY way a row gets into listing_views: there is no INSERT or UPDATE
 * policy on the table. An upsert that increments cannot be expressed through
 * PostgREST's own upsert anyway (it sets columns to what it is given), and a
 * write policy would let a browser set its own view_count and its own snapshot.
 *
 * SECURITY DEFINER for that reason, and so everything it touches is spelled out:
 * it writes one row, for auth.uid(), copied from idx_listings. A number that is
 * not a listing is a no-op rather than an error — this is called in the
 * background from the listing page and must never surface there.
 *
 * Each account keeps its 400 most recently viewed homes. A recommendation is
 * built from the last few dozen; an unbounded history would be a table that
 * only grows, about people, which is the kind worth not having.
 */
CREATE OR REPLACE FUNCTION public.record_listing_view(p_mls TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL OR p_mls IS NULL OR p_mls !~ '^[0-9]{5,12}$' THEN
    RETURN;
  END IF;

  INSERT INTO listing_views AS v
         (user_id, mls_number, address, town, state, zip, prop_type, list_price, bedrooms, photo_count)
  SELECT v_user, l.mls_number, l.address, l.town, l.state, l.zip, l.prop_type, l.list_price,
         l.bedrooms, l.photo_count
    FROM idx_listings l
   WHERE l.mls_number = p_mls
  ON CONFLICT (user_id, mls_number) DO UPDATE
     SET view_count = v.view_count + 1,
         last_viewed_at = NOW(),
         -- Refreshed, so the line reads as the listing is now, not as it was on
         -- the first visit.
         address = EXCLUDED.address,
         town = EXCLUDED.town,
         state = EXCLUDED.state,
         zip = EXCLUDED.zip,
         prop_type = EXCLUDED.prop_type,
         list_price = EXCLUDED.list_price,
         bedrooms = EXCLUDED.bedrooms,
         photo_count = EXCLUDED.photo_count;

  DELETE FROM listing_views
   WHERE user_id = v_user
     AND mls_number IN (
       SELECT mls_number
         FROM listing_views
        WHERE user_id = v_user
        ORDER BY last_viewed_at DESC
       OFFSET 400
     );
END;
$$;

-- ---------------------------------------------------------------------------
-- The admin's summary
-- ---------------------------------------------------------------------------

/*
 * One row per person who has saved or viewed anything, for /admin/activity.
 *
 * It has to be a function: the name and email live in auth.users, which no
 * client role can read and which must stay that way. SECURITY DEFINER to reach
 * it, and therefore the admin check is the first statement — everything after
 * it runs with the definer's rights.
 */
CREATE OR REPLACE FUNCTION public.admin_client_activity()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  saved_count BIGINT,
  viewed_count BIGINT,
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
  )
  SELECT u.id,
         u.email::TEXT,
         NULLIF(btrim(COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), ''),
         COALESCE(f.n, 0),
         COALESCE(v.n, 0),
         GREATEST(f.latest, v.latest)
    FROM auth.users u
    LEFT JOIN f ON f.user_id = u.id
    LEFT JOIN v ON v.user_id = u.id
   WHERE f.user_id IS NOT NULL OR v.user_id IS NOT NULL
   ORDER BY GREATEST(f.latest, v.latest) DESC NULLS LAST;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

-- Favourites: your own rows to read, add and remove; every row for the admin to
-- read. No UPDATE policy — a favourite has nothing to edit, and RLS is scoped by
-- row, not by column, so the simplest way to keep the snapshot honest after the
-- insert is to grant no update at all.
DROP POLICY IF EXISTS "Read own favorites" ON listing_favorites;
CREATE POLICY "Read own favorites" ON listing_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Save a listing" ON listing_favorites;
CREATE POLICY "Save a listing" ON listing_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Remove own favorite" ON listing_favorites;
CREATE POLICY "Remove own favorite" ON listing_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Views: read your own, admin reads all. Written only by record_listing_view().
DROP POLICY IF EXISTS "Read own views" ON listing_views;
CREATE POLICY "Read own views" ON listing_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Supabase's default privileges hand every new table and function to anon and
-- authenticated BY NAME, so revoking from PUBLIC alone leaves them open. Revoke
-- from the roles explicitly, then grant back exactly what is meant.
REVOKE ALL ON listing_favorites, listing_views FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON listing_favorites TO authenticated;
GRANT SELECT ON listing_views TO authenticated;

REVOKE ALL ON FUNCTION public.record_listing_view(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_listing_view(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_client_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_client_activity() TO authenticated;

REVOKE ALL ON FUNCTION public.fill_listing_favorite() FROM PUBLIC, anon, authenticated;
