-- Fix idx_price_history recording a "first seen" row on every hourly sync.
--
-- THE BUG, and it is a subtle one worth stating precisely.
--
-- The ingest writes with
--   .upsert(batch, { onConflict: 'mls_number' })
-- which is INSERT ... ON CONFLICT DO UPDATE. PostgreSQL fires row-level
-- BEFORE INSERT triggers for EVERY PROPOSED ROW, before it has looked for a
-- conflict — so a row that ends up being an UPDATE has already run the INSERT
-- trigger. Only the AFTER triggers correspond to the operation actually
-- performed. (See "Triggers" under INSERT ... ON CONFLICT in the PostgreSQL
-- manual; this is documented behaviour, not a quirk.)
--
-- idx_listings_track_price did its first-observation bookkeeping in the
-- BEFORE INSERT branch. So every sync, for every one of ~22,000 listings,
-- appended a history row saying the listing had just been seen for the first
-- time at its current price. The detail page rendered exactly that: fourteen
-- identical "First seen $21,500,000" entries for one listing, one per sync
-- since the table was created.
--
-- At the time of writing the table held 278,025 rows, of which 25 were real
-- price changes.
--
-- THE FIX. Split the one trigger in two, by what each half actually needs:
--
--   * BEFORE UPDATE keeps the column bookkeeping, because it mutates NEW
--     (previous_list_price, price_change_at, price_cut, first_seen_at) and only
--     a BEFORE trigger can do that.
--   * AFTER INSERT records the first observation. An AFTER INSERT trigger fires
--     only when a row was genuinely inserted, so an upsert that resolves to an
--     update no longer produces one.
--
-- The change-recording INSERT stays with the UPDATE half. It was already
-- correct — those 25 rows are real — and moving it would risk the one part of
-- this that worked.

-- ---------------------------------------------------------------------------
-- 1. Replace the trigger.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS idx_listings_track_price ON idx_listings;

CREATE OR REPLACE FUNCTION public.idx_listings_track_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- UPDATE only. The INSERT path moved to idx_listings_record_first_seen below;
  -- leaving a branch here would fire it again on every upsert, which is the bug.
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

CREATE TRIGGER idx_listings_track_price
  BEFORE UPDATE ON idx_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.idx_listings_track_price();

CREATE OR REPLACE FUNCTION public.idx_listings_record_first_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.list_price IS NOT NULL THEN
    INSERT INTO idx_price_history (mls_number, list_price, previous_list_price)
    VALUES (NEW.mls_number, NEW.list_price, NULL);
  END IF;
  RETURN NULL; -- AFTER trigger; the return value is ignored.
END;
$$;

DROP TRIGGER IF EXISTS idx_listings_record_first_seen ON idx_listings;
CREATE TRIGGER idx_listings_record_first_seen
  AFTER INSERT ON idx_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.idx_listings_record_first_seen();

-- ---------------------------------------------------------------------------
-- 2. Delete the rows the bug produced.
-- ---------------------------------------------------------------------------
--
-- DESTRUCTIVE, AND HERE IS WHY IT IS SAFE. Every row this removes is a
-- duplicate first-observation record: same mls_number, NULL previous_list_price.
-- The EARLIEST such row per listing is kept, because that one is true — it is
-- the observation the later copies were pretending to be, and it is what dates
-- the start of the timeline.
--
-- Nothing with a previous_list_price is touched. Those are the real price
-- changes, they are the only rows anyone would miss, and they are unreachable
-- from this statement's WHERE clause.

DELETE FROM idx_price_history h
WHERE h.previous_list_price IS NULL
  AND h.id <> (
    SELECT k.id
    FROM idx_price_history k
    WHERE k.mls_number = h.mls_number
      AND k.previous_list_price IS NULL
    -- id as the tiebreak, not recorded_at alone: a sync writes thousands of
    -- rows inside one transaction and they can share a timestamp to the
    -- microsecond, which would make "the earliest" ambiguous and the delete
    -- non-deterministic.
    ORDER BY k.recorded_at ASC, k.id ASC
    LIMIT 1
  );

-- ---------------------------------------------------------------------------
-- 3. A constraint, so this class of bug cannot recur silently.
-- ---------------------------------------------------------------------------
--
-- One first-observation row per listing, enforced rather than intended. If some
-- future code path tries to append a second, it now fails loudly instead of
-- quietly producing the fourteen-identical-entries display that started this.
-- Partial, because genuine changes are unconstrained: a listing may be cut any
-- number of times.
--
-- MUST run after the delete above: the index cannot be built while the
-- duplicates it forbids are still in the table.

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_history_one_first_seen
  ON idx_price_history (mls_number)
  WHERE previous_list_price IS NULL;
