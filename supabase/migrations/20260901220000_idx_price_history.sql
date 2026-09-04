-- Price history for IDX listings.
--
-- WHY THIS IS OURS TO RECORD. The IDX feed is a SNAPSHOT: one row per listing,
-- carrying today's LIST_PRICE and nothing about yesterday's. A price cut is
-- therefore not a field we can read — it is a difference between two syncs, and
-- the only place that difference exists is here, at the moment the hourly upsert
-- overwrites the old number. Miss it and it is gone.
--
-- STATUS IS NOT A SUBSTITUTE. MLS PIN's PCG ("Price changed") says a price moved
-- at some point; it does not say from what, to what, in which direction, or when
-- — and it is replaced by the next status the listing takes. "$1,150,000, cut
-- from $1,295,000 on 14 March" is a fact about a house. "PCG" is a code.
--
-- TWO PLACES, ON PURPOSE:
--   * idx_listings.previous_list_price / price_change_at — the LAST change,
--     denormalised so a grid of 24 cards can badge a cut without 24 joins.
--   * idx_price_history — every change, for the timeline on the detail page.
--
-- Both are written by the trigger below rather than by the Edge Function, so
-- they cannot be skipped by a code path that forgot: any write to the table at
-- all, from any client, is captured.

ALTER TABLE idx_listings
  -- What the price was before the most recent change. NULL means "no change has
  -- been observed since we started watching", which is NOT the same as "the
  -- price never moved" — a listing first seen after its cut looks unchanged to
  -- us, and claiming otherwise would be inventing history.
  ADD COLUMN IF NOT EXISTS previous_list_price NUMERIC,
  ADD COLUMN IF NOT EXISTS price_change_at TIMESTAMPTZ,
  -- TRUE only when the last observed movement was DOWNWARD. Denormalised
  -- because PostgREST cannot compare two columns in a filter, so "show me what
  -- got cheaper" has no other server-side expression — and doing it in the
  -- browser would mean fetching every active listing to find the reduced ones.
  ADD COLUMN IF NOT EXISTS price_cut BOOLEAN NOT NULL DEFAULT FALSE,
  -- When this listing first entered our copy of the feed. Bounds every claim
  -- the history makes: nothing before this date was observed.
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS idx_price_history (
  id BIGSERIAL PRIMARY KEY,
  mls_number TEXT NOT NULL REFERENCES idx_listings(mls_number) ON DELETE CASCADE,
  list_price NUMERIC,
  -- The price this row replaced. NULL on the first observation of a listing,
  -- which is what distinguishes "listed at" from "changed to".
  previous_list_price NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The "Price cut" tab, which is a filter over the active feed. Partial, because
-- the vast majority of rows are FALSE and only the TRUE ones are ever asked for.
CREATE INDEX IF NOT EXISTS idx_listings_price_cut
  ON idx_listings (price_cut)
  WHERE price_cut;

-- The detail page reads one listing's history, newest first.
CREATE INDEX IF NOT EXISTS idx_price_history_mls
  ON idx_price_history (mls_number, recorded_at DESC);

/*
 * ON DELETE CASCADE is deliberate, and it has a cost worth stating.
 *
 * A listing removed from the feed must stop being displayed (the compliance
 * rule the sync's delete sweep exists for), and the sweep deletes the row — so
 * its history goes with it. Keeping orphaned history would mean retaining data
 * about a withdrawn listing after MLS PIN told us to stop showing it, which is
 * the thing the sweep is for. A listing that sells is re-inserted from the sold
 * feed under the same MLS number, and starts its history over.
 */

CREATE OR REPLACE FUNCTION public.idx_listings_track_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.list_price IS NOT NULL THEN
      INSERT INTO idx_price_history (mls_number, list_price, previous_list_price)
      VALUES (NEW.mls_number, NEW.list_price, NULL);
    END IF;
    RETURN NEW;
  END IF;

  -- An hourly re-sync writes the same price back on ~22,000 rows. Only a real
  -- movement is a price change; IS DISTINCT FROM also keeps a field going
  -- NULL (the feed omitting it) from being recorded as a change to nothing.
  IF NEW.list_price IS NOT NULL
     AND OLD.list_price IS NOT NULL
     AND NEW.list_price IS DISTINCT FROM OLD.list_price THEN
    NEW.previous_list_price := OLD.list_price;
    NEW.price_change_at := NOW();
    -- A raise CLEARS the flag rather than leaving it set from an earlier cut.
    -- The tab answers "what is cheaper than it was", and a home cut in March
    -- and raised in May is not.
    NEW.price_cut := NEW.list_price < OLD.list_price;

    INSERT INTO idx_price_history (mls_number, list_price, previous_list_price)
    VALUES (NEW.mls_number, NEW.list_price, OLD.list_price);
  ELSE
    -- Carry the last observed change forward. The upsert sends a full row, so
    -- without this every sync would blank the columns it does not know about.
    NEW.previous_list_price := OLD.previous_list_price;
    NEW.price_change_at := OLD.price_change_at;
    NEW.price_cut := OLD.price_cut;
  END IF;

  -- Same reasoning: first_seen_at belongs to the row, not to the payload.
  NEW.first_seen_at := OLD.first_seen_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS idx_listings_track_price ON idx_listings;
CREATE TRIGGER idx_listings_track_price
  BEFORE INSERT OR UPDATE ON idx_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.idx_listings_track_price();

ALTER TABLE idx_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read idx_price_history" ON idx_price_history;
CREATE POLICY "Public read idx_price_history" ON idx_price_history
  FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON idx_price_history TO anon, authenticated;

-- No write grants. The trigger runs as SECURITY DEFINER on behalf of the
-- service-role ingest; nothing else may append to a price record.
