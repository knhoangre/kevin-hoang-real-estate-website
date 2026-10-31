-- Send listings: homes Kevin thinks a client may be interested in, as one text
-- or one email.
--
-- Kevin asked on 2026-10-30 for what the showing tours do, without the times:
-- type an address or an MLS number and press a button, rather than assembling
-- the address, the link and the number by hand for each home.
--
-- WHY A TABLE AT ALL, when a text is sent from his own phone and an email copies
-- him. Three things need one: the send function takes an ID, not a recipient, so
-- it cannot be used to mail an arbitrary person; anyone typed here who is not in
-- the CRM is filed there, as on a tour; and the page can show what went to whom
-- last week. A row exists only once a message has been generated — typing and
-- walking away leaves nothing.
--
-- WHY JSON COLUMNS AND NOT CHILD TABLES. The same reasons as showing_tours.clients
-- (see 20261008100000): people and homes are edited as a set and saved with one
-- UPDATE, and nothing queries a message by who or what is on it.
--
--   clients  The same shape as showing_tours.clients: id, name, email, phone,
--            contactId. MAY BE EMPTY, unlike a tour's. A lot of these go into a
--            Zillow chat, where there is no email or phone to give, and a message
--            with nobody on it is still a message to paste.
--
--   homes    In the order Kevin added them: mlsNumber, address, town, state, zip,
--            listPrice, status, propType. A SNAPSHOT for this page to draw and for nothing else.
--            The message is built from the feed when it is generated, so a price
--            cut shows, and a home that has left the feed is left out of it.
--
-- No foreign key to idx_listings, for the reason no other table has one: it is a
-- cache of the feed and idx-sync deletes from it.

CREATE TABLE IF NOT EXISTS listing_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  clients JSONB NOT NULL DEFAULT '[]'::jsonb,
  homes JSONB NOT NULL,
  -- A line to the client above the homes.
  note TEXT,

  -- When the email action last sent this. Null means the email never went, which
  -- says nothing about a text: Kevin sends those from his own phone and this
  -- database cannot know whether he pressed send.
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CASE, because jsonb_array_length() raises on anything that is not an array.
  CONSTRAINT listing_sends_homes CHECK (
    CASE WHEN jsonb_typeof(homes) = 'array'
         THEN jsonb_array_length(homes) BETWEEN 1 AND 20
         ELSE FALSE END
  ),
  CONSTRAINT listing_sends_people CHECK (
    CASE WHEN jsonb_typeof(clients) = 'array'
         THEN jsonb_array_length(clients) <= 8
         ELSE FALSE END
  )
);

CREATE INDEX IF NOT EXISTS listing_sends_recent ON listing_sends (created_at DESC);

-- ---------------------------------------------------------------------------
-- Tidy the list of people, and file anyone new in the CRM
-- ---------------------------------------------------------------------------
-- The decisions are the ones showing_tour_people() writes down, and they hold
-- here for the same reasons: contactId is the database's to write; p_prefer_new
-- is FALSE, because Kevin is typing about somebody else and a couple sharing an
-- email must not rename each other's contact; a person already filed and
-- unchanged is not offered again, or a contact he deleted would come back; and a
-- CRM failure never fails the save.
--
-- What differs is what it refuses: a message may have nobody on it, and nobody on
-- it needs a way to be reached, since it can be pasted anywhere.
CREATE OR REPLACE FUNCTION public.listing_send_people()
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
BEGIN
  IF NEW.clients IS NULL OR jsonb_typeof(NEW.clients) <> 'array' THEN
    RAISE EXCEPTION 'The people on a message must be a list.' USING ERRCODE = 'check_violation';
  END IF;

  FOR v_person IN SELECT value FROM jsonb_array_elements(NEW.clients)
  LOOP
    v_name := NULLIF(btrim(regexp_replace(COALESCE(v_person ->> 'name', ''), '\s+', ' ', 'g')), '');
    v_email := NULLIF(lower(btrim(COALESCE(v_person ->> 'email', ''))), '');
    v_phone := NULLIF(btrim(COALESCE(v_person ->> 'phone', '')), '');

    IF v_name IS NULL THEN
      -- An empty row is a form with a spare line on it, not a person.
      CONTINUE WHEN v_email IS NULL AND v_phone IS NULL;
      RAISE EXCEPTION 'Everyone on a message needs a name.' USING ERRCODE = 'check_violation';
    END IF;

    v_id := NULLIF(btrim(COALESCE(v_person ->> 'id', '')), '');
    IF v_id IS NULL OR v_id = ANY (v_seen) THEN
      v_id := gen_random_uuid()::TEXT;
    END IF;
    v_seen := v_seen || v_id;

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
          NULLIF(btrim(substr(v_name, length(v_first) + 1)), ''),
          v_email,
          v_phone,
          'Sent Listings',
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
          RAISE WARNING 'CRM sync failed for a person on listing send %: %', NEW.id, SQLERRM;
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

  IF jsonb_array_length(v_out) > 8 THEN
    RAISE EXCEPTION 'A message can list up to eight people.' USING ERRCODE = 'check_violation';
  END IF;

  NEW.clients := v_out;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.listing_send_people IS
  'Normalises listing_sends.clients and files anyone new or changed in the CRM, stamping contactId. SECURITY DEFINER because crm_upsert_contact is not callable by the admin''s own role.';

-- A trigger function cannot be called directly, but Supabase's default privileges
-- grant it by name all the same.
REVOKE EXECUTE ON FUNCTION public.listing_send_people() FROM PUBLIC, anon, authenticated;

-- `OF clients`: stamping sent_at when the email goes is not an edit to who it is
-- for, and must not re-run any of the above.
DROP TRIGGER IF EXISTS trg_listing_send_people ON listing_sends;
CREATE TRIGGER trg_listing_send_people
  BEFORE INSERT OR UPDATE OF clients ON listing_sends
  FOR EACH ROW EXECUTE FUNCTION public.listing_send_people();

-- --- RLS ------------------------------------------------------------------
--
-- Admin only, like the tours: a client's name and phone number, and which homes
-- they are being shown. The function that emails one does so under the service
-- role after checking the caller is the admin.

ALTER TABLE listing_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages listing sends" ON listing_sends;
CREATE POLICY "Admin manages listing sends"
  ON listing_sends
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON listing_sends FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON listing_sends TO authenticated;
