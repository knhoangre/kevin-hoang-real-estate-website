-- Showing tours: more than one person on a tour, and everyone on one in the CRM.
--
-- A tour had exactly one client — a name, an email, a phone. Kevin shows homes
-- to couples and to families, and "Tammy and Matthew" was either one name field
-- holding two people and one of their phone numbers, or two tours for the same
-- Saturday. The schedule then greeted one of them and went to one inbox.
--
-- So the three client_* columns become `clients`: a JSON list of people, each
-- with a name and whatever there is to reach them by.
--
-- WHY A JSON COLUMN AND NOT A showing_tour_clients TABLE.
--
--   * The people on a tour are edited as a SET — add one, fix another's phone,
--     press Save. As a column that is one UPDATE of one row, and it either
--     happens or it does not. As a child table it is an insert, some updates and
--     a delete from the browser, with nothing making them one transaction.
--   * The obvious single-request write for a child table is an upsert, and
--     INSERT ... ON CONFLICT fires BEFORE INSERT triggers for every row it is
--     offered, changed or not. A trigger that files a contact would then run for
--     everybody on every save. That is the defect idx_price_history shipped with
--     (278,025 "price changes", 25 of them real).
--   * Nothing queries a tour by who is on it. It is read whole, by Kevin.
--
-- Each person carries an `id` the browser makes up once and keeps. It is what
-- lets the trigger below tell "Tammy's phone was corrected" from "Tammy was
-- removed and somebody else added", which positions in a list cannot.

-- ---------------------------------------------------------------------------
-- crm_upsert_contact() was callable by anyone holding the public key
-- ---------------------------------------------------------------------------
-- Supabase's default privileges grant every new function in `public` to anon
-- and authenticated BY NAME, and 20260913120000 never revoked this one. It is
-- SECURITY DEFINER, so `POST /rest/v1/rpc/crm_upsert_contact` with the anon key
-- that ships in every browser wrote straight into the CRM — and with
-- p_prefer_new it could move an existing contact onto a different name, email
-- and phone given only their current email. Confirmed against the live project
-- on 2026-10-08 with blank names, which return before any write: HTTP 200.
--
-- Nothing calls it over RPC. Its callers are triggers, which are SECURITY
-- DEFINER themselves and run as the owner, so they are unaffected.
REVOKE EXECUTE ON FUNCTION public.crm_upsert_contact(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_upsert_contact(
  TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT, TEXT, BOOLEAN, TEXT, TEXT
) TO service_role;

-- ---------------------------------------------------------------------------
-- The column, and the tours that already exist
-- ---------------------------------------------------------------------------
ALTER TABLE showing_tours ADD COLUMN IF NOT EXISTS clients JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Carried over BEFORE the trigger exists, on purpose: the trigger files people
-- in the CRM, and a migration is not the moment to do that to every tour made
-- while the feature was being tried out. An existing tour's people are filed the
-- next time that tour is saved — see the retry in the trigger.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'showing_tours' AND column_name = 'client_name'
  ) THEN
    UPDATE showing_tours
       SET clients = jsonb_build_array(jsonb_build_object(
             'id', gen_random_uuid()::TEXT,
             'name', btrim(regexp_replace(client_name, '\s+', ' ', 'g')),
             'email', NULLIF(lower(btrim(COALESCE(client_email, ''))), ''),
             'phone', NULLIF(btrim(COALESCE(client_phone, '')), ''),
             'contactId', NULL
           ))
     WHERE jsonb_array_length(clients) = 0;

    ALTER TABLE showing_tours DROP CONSTRAINT IF EXISTS showing_tours_reachable;
    ALTER TABLE showing_tours
      DROP COLUMN client_name,
      DROP COLUMN client_email,
      DROP COLUMN client_phone;
  END IF;
END $$;

-- The structural half of what showing_tours_reachable used to say. The rest —
-- everybody named, somebody reachable — needs to look inside the list, and is
-- in the trigger, which also normalises what it checks.
ALTER TABLE showing_tours DROP CONSTRAINT IF EXISTS showing_tours_people;
ALTER TABLE showing_tours ADD CONSTRAINT showing_tours_people CHECK (
  CASE WHEN jsonb_typeof(clients) = 'array'
       THEN jsonb_array_length(clients) BETWEEN 1 AND 8
       ELSE FALSE END
);

-- ---------------------------------------------------------------------------
-- Tidy the list, and file anyone new in the CRM
-- ---------------------------------------------------------------------------
-- BEFORE, because it rewrites the row: every person comes out trimmed, with a
-- lower-cased email, an id, and `contactId` — the CRM contact they were filed
-- as. `contactId` is this function's to write. Whatever the browser sends in
-- that key is ignored, so the tick Kevin sees beside a name ("In your CRM") is
-- the database's statement and not the page's guess.
--
-- WHAT GETS FILED. crm_upsert_contact() decides, by its own rule: a first AND a
-- last name, and an email or a ten-digit phone. "Tammy" with a phone number is a
-- perfectly good person to take on a tour and is not yet a CRM contact; she
-- becomes one when a last name is added. Nothing here loosens that rule.
--
-- p_prefer_new IS FALSE, AND THAT IS A DECISION. TRUE means "the person typed
-- this about themselves" and overwrites what the CRM has. Here Kevin is typing
-- about somebody else, and the case that settles it is the ordinary one: a
-- couple who share an email address. Tammy is filed; Matthew, with the same
-- email, MATCHES Tammy's contact — and under TRUE would rename it Matthew. So a
-- tour adds people to the CRM and fills in blanks, and never overwrites.
--
-- ONLY WHEN SOMETHING CHANGED. A person whose name, email and phone are what
-- they were, and who was already filed, keeps their contactId and costs nothing
-- — otherwise changing a tour's note would re-file everyone on it, and a contact
-- Kevin had deliberately deleted from the CRM would come back each time. Someone
-- NOT yet filed is offered again on every save, which is what picks up the tours
-- that predate this migration, and the person who gains a last name later.
--
-- A CRM FAILURE NEVER FAILS THE SAVE. Same rule as the rental application's
-- trigger: the upsert is in its own exception block and raises a WARNING.
CREATE OR REPLACE FUNCTION public.showing_tour_people()
RETURNS TRIGGER AS $$
DECLARE
  v_person JSONB;
  v_prev JSONB;
  v_out JSONB := '[]'::jsonb;
  v_seen TEXT[] := '{}';
  v_id TEXT;
  v_name TEXT;
  v_first TEXT;
  v_email TEXT;
  v_phone TEXT;
  v_contact INTEGER;
  v_reachable BOOLEAN := FALSE;
BEGIN
  IF NEW.clients IS NULL OR jsonb_typeof(NEW.clients) <> 'array' THEN
    RAISE EXCEPTION 'The people on a tour must be a list.' USING ERRCODE = 'check_violation';
  END IF;

  FOR v_person IN SELECT value FROM jsonb_array_elements(NEW.clients)
  LOOP
    v_name := NULLIF(btrim(regexp_replace(COALESCE(v_person ->> 'name', ''), '\s+', ' ', 'g')), '');
    v_email := NULLIF(lower(btrim(COALESCE(v_person ->> 'email', ''))), '');
    v_phone := NULLIF(btrim(COALESCE(v_person ->> 'phone', '')), '');

    IF v_name IS NULL THEN
      -- An empty row is a form with a spare line on it, not a person.
      CONTINUE WHEN v_email IS NULL AND v_phone IS NULL;
      RAISE EXCEPTION 'Everyone on a tour needs a name.' USING ERRCODE = 'check_violation';
    END IF;

    -- An id that is missing, or that two people share, is replaced rather than
    -- refused: it only has to be stable from here on.
    v_id := NULLIF(btrim(COALESCE(v_person ->> 'id', '')), '');
    IF v_id IS NULL OR v_id = ANY (v_seen) THEN
      v_id := gen_random_uuid()::TEXT;
    END IF;
    v_seen := v_seen || v_id;

    v_reachable := v_reachable OR v_email IS NOT NULL OR v_phone IS NOT NULL;

    v_prev := NULL;
    IF TG_OP = 'UPDATE' THEN
      SELECT value INTO v_prev
        FROM jsonb_array_elements(OLD.clients)
       WHERE value ->> 'id' = v_id
       LIMIT 1;
    END IF;

    IF v_prev IS NOT NULL
       AND v_prev ->> 'contactId' IS NOT NULL
       AND v_prev ->> 'name' IS NOT DISTINCT FROM v_name
       AND v_prev ->> 'email' IS NOT DISTINCT FROM v_email
       AND v_prev ->> 'phone' IS NOT DISTINCT FROM v_phone THEN
      v_contact := (v_prev ->> 'contactId')::INTEGER;
    ELSE
      v_contact := NULL;
      v_first := split_part(v_name, ' ', 1);
      BEGIN
        v_contact := public.crm_upsert_contact(
          v_first,
          -- Everything after the first word: "Mary Anne de la Cruz" files under
          -- "Mary" and "Anne de la Cruz", which is wrong for Mary Anne and right
          -- far more often than splitting on the last space is.
          NULLIF(btrim(substr(v_name, length(v_first) + 1)), ''),
          v_email,
          v_phone,
          'Showing Tour',
          NULL,
          NULL,
          '#c5a572',
          FALSE,
          -- Who this row was a moment ago, so a corrected email finds the
          -- contact the old one made instead of filing a second.
          v_prev ->> 'email',
          v_prev ->> 'phone'
        );
      EXCEPTION
        WHEN others THEN
          RAISE WARNING 'CRM sync failed for a person on showing tour %: %', NEW.id, SQLERRM;
      END;
    END IF;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'name', v_name,
      'email', v_email,
      'phone', v_phone,
      'contactId', v_contact
    ));
  END LOOP;

  IF jsonb_array_length(v_out) = 0 THEN
    RAISE EXCEPTION 'A tour needs at least one person.' USING ERRCODE = 'check_violation';
  END IF;
  IF jsonb_array_length(v_out) > 8 THEN
    RAISE EXCEPTION 'A tour can list up to eight people.' USING ERRCODE = 'check_violation';
  END IF;
  -- What showing_tours_reachable said about one client, said about the group: a
  -- schedule has to be able to go to somebody.
  IF NOT v_reachable THEN
    RAISE EXCEPTION 'A tour needs an email address or a phone number for at least one person.'
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.clients := v_out;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.showing_tour_people IS
  'Normalises showing_tours.clients and files anyone new or changed in the CRM, stamping contactId. SECURITY DEFINER because crm_upsert_contact is not callable by the admin''s own role.';

-- A trigger function cannot be called directly, but the default privileges
-- grant it by name all the same, and this file has just finished explaining
-- what that costs.
REVOKE EXECUTE ON FUNCTION public.showing_tour_people() FROM PUBLIC, anon, authenticated;

-- `OF clients`: stamping sent_at when the email goes is not an edit to who is
-- on the tour, and must not re-run any of the above.
DROP TRIGGER IF EXISTS trg_showing_tour_people ON showing_tours;
CREATE TRIGGER trg_showing_tour_people
  BEFORE INSERT OR UPDATE OF clients ON showing_tours
  FOR EACH ROW EXECUTE FUNCTION public.showing_tour_people();
