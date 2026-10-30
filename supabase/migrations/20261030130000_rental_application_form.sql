-- Which form an application link asks for: the full application, or documents
-- only.
--
-- Kevin, 2026-10-29: some applicants have already filled in an application
-- somewhere else, and asking them to type it all again is the thing that makes
-- them give up. For them the link should ask only who they are, then for their
-- documents (their completed application among them), then the signature.
--
-- `form` on the INVITE is Kevin's choice when he makes the link. It is copied
-- onto the APPLICATION when the link is claimed (the rental-application-invite
-- function does that, under the service role), and from then on the
-- application's own copy decides which sections its form shows — on /apply, on
-- /rentals and in /admin/applications alike. One column per row rather than a
-- join back to the invite, because an application whose invite has gone must
-- still render the form it was filled in on.
--
-- Existing rows are 'full', which is what every one of them was.

ALTER TABLE rental_application_invites
  ADD COLUMN IF NOT EXISTS form TEXT NOT NULL DEFAULT 'full'
  CHECK (form IN ('full', 'documents'));

ALTER TABLE rental_applications
  ADD COLUMN IF NOT EXISTS form TEXT NOT NULL DEFAULT 'full'
  CHECK (form IN ('full', 'documents'));

-- --- Only Kevin changes it ------------------------------------------------
--
-- The applicant's UPDATE policy is scoped by row, not by column — the lesson
-- of guard_submitted_rental_application — so without this an applicant could
-- switch their own application from the full form to documents only. Nothing
-- the full form asks is required, so that would bypass no rule; it would still
-- be the applicant overriding what Kevin asked for, silently. A separate
-- trigger rather than another rule in the guard: that function is long and
-- re-creating it to add one line is how a rule in it gets lost.
--
-- It RAISES rather than quietly putting the old value back. A BEFORE trigger
-- that assigns to NEW reports success and changes nothing, which is exactly
-- the silent failure rule 6 of the guard once had.

CREATE OR REPLACE FUNCTION public.guard_rental_application_form()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.form IS DISTINCT FROM OLD.form
     AND NOT (COALESCE(public.is_admin(), FALSE) OR current_user = 'service_role') THEN
    RAISE EXCEPTION 'Only the admin can change which form an application asks for'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Supabase grants every new function to anon and authenticated BY NAME.
REVOKE ALL ON FUNCTION public.guard_rental_application_form() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_rental_application_form ON rental_applications;
CREATE TRIGGER trg_guard_rental_application_form
  BEFORE UPDATE OF form ON rental_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_rental_application_form();
