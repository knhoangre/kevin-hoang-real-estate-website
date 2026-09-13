-- A rental applicant becomes a CRM contact, tagged Renter.
--
-- WHY THIS IS IN THE DATABASE and not in the client or a fourth edge function:
--
--   * The applicant cannot write to the CRM. `contacts` and its satellite tables
--     are admin-only under RLS, which is correct — so the browser that has the
--     applicant's name in it is the one thing that cannot file it.
--   * The name, email and phone already land in rental_applications' denormalised
--     columns on every autosave, so the data is here the moment it is typed.
--   * submit-contact, submit-open-house-signin and submit-event-signin each carry
--     their own ~250-line hand-rolled copy of the find-or-insert dance below.
--     Writing a fourth would be four places to fix the next time the contact
--     model changes. This is one, callable, and those three could move onto it
--     later.
--
-- The CRM needs no changes to show any of this: `contacts_view` already exposes
-- source, birthday and tags, and /crm/contacts already renders tags with their
-- colour.

-- ---------------------------------------------------------------------------
-- One contact upsert, for anything that collects a person
-- ---------------------------------------------------------------------------
-- Every value lives in its own dedupe table keyed on the value itself, which is
-- what makes "the same person signed in twice" one contact rather than two.
CREATE OR REPLACE FUNCTION public.crm_upsert_contact(
  p_first TEXT,
  p_last TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_birthday DATE DEFAULT NULL,
  p_tag TEXT DEFAULT NULL,
  p_tag_color TEXT DEFAULT '#c5a572',
  -- TRUE when the person themselves supplied this, which makes it the most
  -- authoritative version we have: an applicant fixing a typo in their own phone
  -- number must move the contact onto the corrected one, or the CRM keeps a
  -- number nobody answers. FALSE is the conservative default for anything
  -- importing or inferring a contact.
  p_prefer_new BOOLEAN DEFAULT FALSE,
  -- What this person's email and phone were BEFORE this change, used only to
  -- find them. Without these, somebody correcting their email and their phone in
  -- the same save has nothing left that matches, so the upsert cannot tell them
  -- from a new person and files a duplicate.
  p_match_email TEXT DEFAULT NULL,
  p_match_phone TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_first TEXT := NULLIF(BTRIM(p_first), '');
  v_last TEXT := NULLIF(BTRIM(p_last), '');
  v_email TEXT := NULLIF(LOWER(BTRIM(COALESCE(p_email, ''))), '');
  v_digits TEXT := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_phone TEXT;
  v_first_id INTEGER;
  v_last_id INTEGER;
  v_email_id INTEGER;
  v_phone_id INTEGER;
  v_source_id INTEGER;
  v_tag_id INTEGER;
  v_contact_id INTEGER;
  v_match_email TEXT := NULLIF(LOWER(BTRIM(COALESCE(p_match_email, ''))), '');
  v_match_digits TEXT := regexp_replace(COALESCE(p_match_phone, ''), '\D', '', 'g');
  v_match_phone TEXT;
BEGIN
  -- A contact with no name is a row nobody can act on.
  IF v_first IS NULL OR v_last IS NULL THEN
    RETURN NULL;
  END IF;
  -- XXX-XXX-XXXX, matching what the three edge functions write. Stored in any
  -- other shape the same person's phone would not dedupe against theirs.
  IF LENGTH(v_digits) = 11 AND LEFT(v_digits, 1) = '1' THEN
    v_digits := SUBSTRING(v_digits FROM 2);
  END IF;
  v_phone := CASE
    WHEN LENGTH(v_digits) = 10
      THEN SUBSTRING(v_digits FROM 1 FOR 3) || '-' || SUBSTRING(v_digits FROM 4 FOR 3) || '-'
           || SUBSTRING(v_digits FROM 7 FOR 4)
    ELSE NULL
  END;

  -- ...and one with no way to reach them is the same problem. Checked AFTER the
  -- phone is normalised, not before: a half-typed number is not a way to reach
  -- anybody, and testing the raw digits would have let one through.
  IF v_email IS NULL AND v_phone IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_first_id FROM contact_first_names WHERE first_name = v_first;
  IF v_first_id IS NULL THEN
    INSERT INTO contact_first_names (first_name) VALUES (v_first) RETURNING id INTO v_first_id;
  END IF;

  SELECT id INTO v_last_id FROM contact_last_names WHERE last_name = v_last;
  IF v_last_id IS NULL THEN
    INSERT INTO contact_last_names (last_name) VALUES (v_last) RETURNING id INTO v_last_id;
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT id INTO v_email_id FROM contact_emails WHERE email = v_email;
    IF v_email_id IS NULL THEN
      INSERT INTO contact_emails (email) VALUES (v_email) RETURNING id INTO v_email_id;
    END IF;
  END IF;

  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_phone_id FROM contact_phones WHERE phone = v_phone;
    IF v_phone_id IS NULL THEN
      INSERT INTO contact_phones (phone) VALUES (v_phone) RETURNING id INTO v_phone_id;
    END IF;
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_source, '')), '') IS NOT NULL THEN
    SELECT id INTO v_source_id FROM contact_sources WHERE source = BTRIM(p_source);
    IF v_source_id IS NULL THEN
      INSERT INTO contact_sources (source) VALUES (BTRIM(p_source)) RETURNING id INTO v_source_id;
    END IF;
  END IF;

  -- Match on a way of reaching them, email first. There is deliberately no
  -- unique constraint on `contacts` — the original migration says so: Postgres
  -- unique constraints do not treat NULLs as equal, so a composite key over
  -- nullable columns would let duplicates through anyway.
  IF v_email_id IS NOT NULL THEN
    SELECT id INTO v_contact_id FROM contacts WHERE email_id = v_email_id ORDER BY id LIMIT 1;
  END IF;
  IF v_contact_id IS NULL AND v_phone_id IS NOT NULL THEN
    SELECT id INTO v_contact_id FROM contacts WHERE phone_id = v_phone_id ORDER BY id LIMIT 1;
  END IF;

  -- Still nothing: try who they were. This is what keeps a correction a
  -- correction rather than a second person.
  IF v_contact_id IS NULL AND v_match_email IS NOT NULL THEN
    SELECT c.id INTO v_contact_id
      FROM contacts c JOIN contact_emails e ON e.id = c.email_id
     WHERE e.email = v_match_email ORDER BY c.id LIMIT 1;
  END IF;
  IF v_contact_id IS NULL AND LENGTH(v_match_digits) >= 10 THEN
    IF LENGTH(v_match_digits) = 11 AND LEFT(v_match_digits, 1) = '1' THEN
      v_match_digits := SUBSTRING(v_match_digits FROM 2);
    END IF;
    v_match_phone := SUBSTRING(v_match_digits FROM 1 FOR 3) || '-'
                     || SUBSTRING(v_match_digits FROM 4 FOR 3) || '-'
                     || SUBSTRING(v_match_digits FROM 7 FOR 4);
    SELECT c.id INTO v_contact_id
      FROM contacts c JOIN contact_phones p ON p.id = c.phone_id
     WHERE p.phone = v_match_phone ORDER BY c.id LIMIT 1;
  END IF;

  IF v_contact_id IS NULL THEN
    INSERT INTO contacts (first_name_id, last_name_id, email_id, phone_id, source_id, is_active)
    VALUES (v_first_id, v_last_id, v_email_id, v_phone_id, v_source_id, TRUE)
    RETURNING id INTO v_contact_id;
  ELSE
    -- Somebody who signed in at an open house with only an email and now applies
    -- with a phone should gain the phone. Whether a value they ALREADY had gets
    -- replaced depends on who is speaking: `p_prefer_new` means the person typed
    -- this about themselves just now.
    --
    -- `source_id` is COALESCE either way. It records how they first arrived,
    -- which is not improved by being overwritten with how they arrived most
    -- recently — and it is the field the CRM filters on.
    UPDATE contacts
    SET first_name_id = CASE WHEN p_prefer_new THEN v_first_id
                             ELSE COALESCE(first_name_id, v_first_id) END,
        last_name_id = CASE WHEN p_prefer_new THEN v_last_id
                            ELSE COALESCE(last_name_id, v_last_id) END,
        email_id = CASE WHEN p_prefer_new AND v_email_id IS NOT NULL THEN v_email_id
                        ELSE COALESCE(email_id, v_email_id) END,
        phone_id = CASE WHEN p_prefer_new AND v_phone_id IS NOT NULL THEN v_phone_id
                        ELSE COALESCE(phone_id, v_phone_id) END,
        source_id = COALESCE(source_id, v_source_id),
        is_active = TRUE
    WHERE id = v_contact_id;
  END IF;

  -- Birthday lives in its own table, one row per contact.
  IF p_birthday IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM contact_birthdays WHERE contact_id = v_contact_id) THEN
      UPDATE contact_birthdays SET birthday = p_birthday WHERE contact_id = v_contact_id;
    ELSE
      INSERT INTO contact_birthdays (contact_id, birthday) VALUES (v_contact_id, p_birthday);
    END IF;
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_tag, '')), '') IS NOT NULL THEN
    SELECT id INTO v_tag_id FROM contact_tags WHERE tag = BTRIM(p_tag);
    IF v_tag_id IS NULL THEN
      INSERT INTO contact_tags (tag, color) VALUES (BTRIM(p_tag), p_tag_color)
      RETURNING id INTO v_tag_id;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM contact_tag_assignments
      WHERE contact_id = v_contact_id AND tag_id = v_tag_id
    ) THEN
      INSERT INTO contact_tag_assignments (contact_id, tag_id) VALUES (v_contact_id, v_tag_id);
    END IF;
  END IF;

  RETURN v_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.crm_upsert_contact IS
  'Find-or-create a CRM contact across the value tables, filling in blanks without overwriting. SECURITY DEFINER because the people who supply this data cannot write to the CRM.';

-- ---------------------------------------------------------------------------
-- The rental application side
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_rental_applicant_to_crm()
RETURNS TRIGGER AS $$
DECLARE
  v_dob DATE;
  v_property TEXT;
  v_source TEXT := 'Rental Application';
BEGIN
  -- Only when the identity actually changed. Autosave fires every two seconds
  -- while somebody types; without this the CRM upsert would run on every one of
  -- those saves to reach the same answer.
  IF TG_OP = 'UPDATE'
     AND NEW.applicant_first_name IS NOT DISTINCT FROM OLD.applicant_first_name
     AND NEW.applicant_last_name IS NOT DISTINCT FROM OLD.applicant_last_name
     AND NEW.applicant_email IS NOT DISTINCT FROM OLD.applicant_email
     AND NEW.applicant_phone IS NOT DISTINCT FROM OLD.applicant_phone
     AND NEW.data -> 'applicant' ->> 'dateOfBirth'
         IS NOT DISTINCT FROM OLD.data -> 'applicant' ->> 'dateOfBirth' THEN
    RETURN NULL;
  END IF;

  -- A date input gives YYYY-MM-DD, but the column is jsonb and a half-typed
  -- date is a normal thing to find in a draft. Anything unparseable is simply
  -- not a birthday yet.
  BEGIN
    v_dob := NULLIF(NEW.data -> 'applicant' ->> 'dateOfBirth', '')::DATE;
  EXCEPTION
    WHEN others THEN v_dob := NULL;
  END;

  -- Which unit they applied for, so the source says what the tag cannot. Same
  -- shape as the open-house sign-ins' "Open House & <address>".
  SELECT NULLIF(
           BTRIM(CONCAT_WS(', ', NULLIF(BTRIM(COALESCE(i.property_address, '')), ''),
                                 NULLIF(BTRIM(COALESCE(i.property_town, '')), ''))),
           '')
    INTO v_property
    FROM rental_application_invites i
   WHERE i.id = NEW.invite_id;

  IF v_property IS NOT NULL THEN
    v_source := v_source || ' & ' || v_property;
  END IF;

  -- A CRM write must never be able to fail an applicant's save. They are filling
  -- in a form; a duplicate-key race or a schema change on the CRM side is our
  -- problem to read in the logs, not theirs to be blocked by.
  BEGIN
    PERFORM public.crm_upsert_contact(
      NEW.applicant_first_name,
      NEW.applicant_last_name,
      NEW.applicant_email,
      NEW.applicant_phone,
      v_source,
      v_dob,
      'Renter',
      '#c5a572',
      -- The applicant is the authority on their own name, email and phone.
      TRUE,
      -- Who they were a moment ago, so editing both at once is still one person.
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.applicant_email END,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.applicant_phone END
    );
  EXCEPTION
    WHEN others THEN
      RAISE WARNING 'CRM sync failed for rental application %: %', NEW.id, SQLERRM;
  END;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- AFTER, so a failure here cannot roll back the application row, and the
-- denormalised name/email/phone columns are already their final values.
DROP TRIGGER IF EXISTS trg_rental_applications_crm ON rental_applications;
CREATE TRIGGER trg_rental_applications_crm
  AFTER INSERT OR UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_rental_applicant_to_crm();

-- The tag, created up front so it carries the brand accent rather than the
-- default purple the CRM falls back to.
INSERT INTO contact_tags (tag, color)
VALUES ('Renter', '#c5a572')
ON CONFLICT (tag) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------
-- The applications that already exist predate the trigger, and an applicant who
-- is in the portal but not in the CRM is the exact gap this closes.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, applicant_first_name, applicant_last_name, applicant_email,
           applicant_phone, data, invite_id
      FROM rental_applications
     WHERE applicant_first_name IS NOT NULL
       AND applicant_last_name IS NOT NULL
  LOOP
    -- Per row, so one unparseable stored date cannot abandon the backfill
    -- halfway through and leave an arbitrary subset of applicants filed.
    BEGIN
      PERFORM public.crm_upsert_contact(
        r.applicant_first_name,
        r.applicant_last_name,
        r.applicant_email,
        r.applicant_phone,
        'Rental Application',
        NULLIF(r.data -> 'applicant' ->> 'dateOfBirth', '')::DATE,
        'Renter'
      );
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'CRM backfill skipped rental application %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
