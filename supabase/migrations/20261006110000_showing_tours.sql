-- Showing tours: a day's itinerary of homes for one client.
--
-- Kevin books the showings and knows the open-house times; this is where he
-- writes them down in order, so the client can be sent ONE schedule — by email
-- or as a text — with a link to each home on this site instead of a list of
-- addresses they then look up on Zillow.
--
-- WHAT IS DELIBERATELY NOT HERE.
--
--   * No times from the feed. MLS PIN's IDX download carries no open-house
--     schedule and no showing availability, so every time on a tour is one Kevin
--     typed. Nothing here pretends otherwise.
--
--   * No foreign key from a stop to idx_listings. That table is a cache of the
--     feed and idx-sync deletes from it; a key would either block that delete or
--     cascade it into a client's schedule. Same reasoning as
--     open_house_sign_ins.mls_number.
--
--   * No timezone column. `tour_date` and `starts_at` are a wall-clock date and
--     time in Massachusetts, which is the only place a showing here can be. A
--     TIMESTAMPTZ would invite exactly the off-by-a-day bug that storing "10 AM
--     on Saturday" as an instant in UTC produces for anyone reading it west of
--     Greenwich in the evening.

CREATE TABLE IF NOT EXISTS showing_tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  client_name TEXT NOT NULL CHECK (length(btrim(client_name)) > 0),
  -- Either is enough. A schedule can go out as a text with no email at all,
  -- which is how a good half of clients would rather get it.
  client_email TEXT,
  client_phone TEXT,

  tour_date DATE NOT NULL,
  -- One line to the client above the stops: where to meet, what to bring.
  note TEXT,

  -- When the email action last sent this. Null means the email never went —
  -- which says nothing about a text, since a text is sent from Kevin's own
  -- phone and this database cannot know whether he pressed send.
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT showing_tours_reachable CHECK (
    NULLIF(btrim(COALESCE(client_email, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(client_phone, '')), '') IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS showing_tours_date ON showing_tours (tour_date DESC);

CREATE TABLE IF NOT EXISTS showing_tour_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES showing_tours (id) ON DELETE CASCADE,

  -- Null for a home that is not in the feed: it is still a stop, it just has no
  -- page on this site to link to.
  mls_number TEXT,

  starts_at TIME NOT NULL,
  kind TEXT NOT NULL DEFAULT 'showing' CHECK (kind IN ('showing', 'open_house')),
  note TEXT,

  -- A snapshot of where this was when the stop was added. The schedule is
  -- re-read from the feed when it is sent, so a price cut between booking and
  -- sending shows; this is what is left to print if the listing has gone.
  address TEXT NOT NULL CHECK (length(btrim(address)) > 0),
  town TEXT,
  state TEXT,
  zip TEXT,
  list_price NUMERIC(12, 2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS showing_tour_stops_tour ON showing_tour_stops (tour_id, starts_at);

-- --- RLS ------------------------------------------------------------------
--
-- Admin only, like lockboxes. A tour is a client's name, their phone number and
-- where they will be at ten on Saturday: nobody but Kevin reads this table, and
-- the edge function that emails a schedule does so under the service role after
-- checking the caller is the admin.

ALTER TABLE showing_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE showing_tour_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages showing tours" ON showing_tours;
CREATE POLICY "Admin manages showing tours"
  ON showing_tours
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manages showing tour stops" ON showing_tour_stops;
CREATE POLICY "Admin manages showing tour stops"
  ON showing_tour_stops
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Supabase's default privileges hand every new table to anon as well. RLS would
-- refuse anon anyway — there is no anon policy — but a table of client phone
-- numbers should not depend on one layer.
REVOKE ALL ON showing_tours, showing_tour_stops FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON showing_tours, showing_tour_stops TO authenticated;
