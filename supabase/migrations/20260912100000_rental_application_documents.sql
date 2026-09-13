-- Rental application documents.
--
-- The paper flow this replaces arrives as a folder of attachments: a photo ID,
-- the last two pay stubs, a tax return, sometimes a completed application the
-- applicant filled in on a different form entirely. This table plus the
-- `rental-documents` bucket is where those live.
--
-- Two properties of the design are load-bearing:
--
--   1. The bucket is PRIVATE. `property-images` is public-read because a listing
--      photo is published anyway; a pay stub is not. Nothing here is ever served
--      through getPublicUrl — reads go through a short-lived signed URL minted
--      per click (see documentUrl in src/lib/rentalApplication.ts).
--
--   2. Documents are a SEPARATE table from rental_applications, so the
--      guard_submitted_rental_application trigger — which freezes the answers
--      once status leaves 'draft' — does not freeze the attachments. An
--      applicant can send a missing pay stub after submitting, and can upload
--      documents having filled in none of the form at all.

-- ---------------------------------------------------------------------------
-- Bucket
-- ---------------------------------------------------------------------------
-- Created here rather than in the dashboard, unlike the two older buckets: the
-- size and MIME limits below are enforced by Storage itself, so they have to be
-- in version control to be reviewable. The client-side check in uploadDocument
-- is for the error message, not for the control.
--
-- 15 MB covers a phone photo of an ID and a multi-page PDF tax return. heic is
-- listed because that is what an iPhone hands over by default.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rental-documents',
  'rental-documents',
  FALSE,
  15728640,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  application_id UUID NOT NULL
    REFERENCES rental_applications (id) ON DELETE CASCADE,

  -- Which ask this answers. A closed set rather than free text: the applicant
  -- needs to know what is wanted, and the admin needs to see at a glance what
  -- is missing. 'rental_application' is for a completed form on somebody
  -- else's paperwork; 'other' is the escape hatch and is the only kind where
  -- `label` is doing real work.
  kind TEXT NOT NULL CHECK (kind IN (
    'photo_id',
    'pay_stub',
    'tax_return',
    'credit_report',
    'financial',
    'reference_letter',
    'rental_application',
    'other'
  )),
  label TEXT,

  -- `<application_id>/<uuid>.<ext>` in the rental-documents bucket. The
  -- applicant's own filename never appears in the path — it is
  -- attacker-controlled text — and is kept in file_name for display only.
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 15728640),

  uploaded_by UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users (id) ON DELETE SET NULL,

  -- The admin's side of the conversation about one file: "this is cut off,
  -- please resend". Applicants can read these and cannot write them — see the
  -- absent UPDATE policy below.
  admin_note TEXT,
  needs_replacement BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_documents_application_kind
  ON rental_application_documents (application_id, kind);
CREATE INDEX IF NOT EXISTS idx_rental_documents_application_created
  ON rental_application_documents (application_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Abuse ceiling
-- ---------------------------------------------------------------------------
-- Reaching an INSERT here already requires a confirmed account that claimed an
-- unrevoked, unexpired invite, so this is not a public surface and needs no
-- captcha. What it does need is a ceiling on what that one account can do, both
-- because storage is billed and because an unbounded loop is the shape an
-- automated abuse attempt takes.
CREATE OR REPLACE FUNCTION public.guard_rental_document_count()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
  of_kind INTEGER;
  recent INTEGER;
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE kind = NEW.kind),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '10 minutes')
  INTO total, of_kind, recent
  FROM rental_application_documents
  WHERE application_id = NEW.application_id;

  IF total >= 40 THEN
    RAISE EXCEPTION 'This application already has the maximum of 40 documents. Remove one before adding another.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF of_kind >= 12 THEN
    RAISE EXCEPTION 'You have already attached 12 files in this category, which is the maximum.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF recent >= 10 THEN
    RAISE EXCEPTION 'Too many uploads in a short time. Please wait a few minutes and try again.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rental_documents_guard ON rental_application_documents;
CREATE TRIGGER trg_rental_documents_guard
  BEFORE INSERT ON rental_application_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_rental_document_count();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE rental_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins full access to rental application documents"
  ON rental_application_documents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Allow applicants to read their own rental application documents"
  ON rental_application_documents
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rental_applications a
    WHERE a.id = application_id AND a.applicant_user_id = auth.uid()
  ));

-- Unlike rental_applications, there IS an applicant INSERT policy here: the
-- application row is the thing that required a verified invite to create, and
-- owning one is what this predicate checks. `uploaded_by = auth.uid()` keeps a
-- row from being attributed to somebody else.
CREATE POLICY "Allow applicants to attach their own rental application documents"
  ON rental_application_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rental_applications a
      WHERE a.id = application_id AND a.applicant_user_id = auth.uid()
    )
  );

CREATE POLICY "Allow applicants to remove their own rental application documents"
  ON rental_application_documents
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rental_applications a
    WHERE a.id = application_id AND a.applicant_user_id = auth.uid()
  ));

-- No applicant UPDATE policy, deliberately. admin_note and needs_replacement
-- are the only mutable columns and both are the admin's. RLS is scoped by ROW
-- and not by column — the same reason rental_applications needed a trigger to
-- stop an applicant setting their own status to 'approved' — so the way to keep
-- an applicant out of a column is to grant them no UPDATE at all.

GRANT SELECT, INSERT, DELETE ON rental_application_documents TO authenticated;

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------
-- The predicate is keyed on the application rather than the uploader, so one
-- expression covers the applicant and the admin, and a co-applicant added later
-- inherits access from the application rather than from the path.
--
-- Note there is no `TO public` SELECT policy, unlike property-images: an
-- unauthenticated request cannot read an object here even with the exact path.
DROP POLICY IF EXISTS "Applicants and admins can view rental documents" ON storage.objects;
CREATE POLICY "Applicants and admins can view rental documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rental-documents' AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rental_applications a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND a.applicant_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Applicants and admins can upload rental documents" ON storage.objects;
CREATE POLICY "Applicants and admins can upload rental documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rental-documents' AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rental_applications a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND a.applicant_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Applicants and admins can delete rental documents" ON storage.objects;
CREATE POLICY "Applicants and admins can delete rental documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rental-documents' AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.rental_applications a
      WHERE a.id::text = (storage.foldername(name))[1]
        AND a.applicant_user_id = auth.uid()
    )
  )
);

-- No UPDATE policy on storage.objects either. Uploads use upsert:false and a
-- fresh uuid per file, so an object is written once and replaced by deleting it
-- and adding another — which keeps the metadata row and the object in step.

-- ---------------------------------------------------------------------------
-- Invite email delivery
-- ---------------------------------------------------------------------------
-- Stamped by the rental-application-invite edge function's `send` action, so
-- /admin/applications can show "Emailed <date>" rather than leaving the admin
-- guessing whether the link ever went out.
ALTER TABLE rental_application_invites
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- The same ceiling, at the storage layer
-- ---------------------------------------------------------------------------
-- guard_rental_document_count() counts rows in rental_application_documents,
-- and a client that skipped the metadata insert — uploading straight to Storage
-- and never recording the file — would never reach it. Those objects are
-- invisible to the UI and to the admin, so nothing would ever surface them, but
-- they are still stored and still billed.
--
-- 60 rather than 40: an object briefly outlives its row during a delete, and
-- this is the backstop, not the limit the applicant is shown.
CREATE OR REPLACE FUNCTION public.guard_rental_object_count()
RETURNS TRIGGER AS $$
DECLARE
  folder TEXT;
  existing INTEGER;
BEGIN
  IF NEW.bucket_id <> 'rental-documents' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  folder := (storage.foldername(NEW.name))[1];

  SELECT COUNT(*) INTO existing
  FROM storage.objects
  WHERE bucket_id = 'rental-documents'
    AND (storage.foldername(name))[1] = folder;

  IF existing >= 60 THEN
    RAISE EXCEPTION 'Too many files have been uploaded for this application.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_rental_objects_guard ON storage.objects;
CREATE TRIGGER trg_rental_objects_guard
  BEFORE INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION public.guard_rental_object_count();

-- ---------------------------------------------------------------------------
-- The property, as fields rather than as one line
-- ---------------------------------------------------------------------------
-- `property_address` held the whole thing as free text, which made it the one
-- part of an invite that could not be reused: "12 Elm St, Needham MA 02492" and
-- "12 Elm Street Needham" are the same unit and no query can tell. Splitting it
-- lets /admin/applications offer the properties already used, and lets the
-- applicant's tenancy address be seeded field by field.
--
-- `property_address` keeps its meaning — the STREET line — so existing invites
-- stay readable and no data has to be re-parsed. The town/state/zip of an
-- invite created before this are simply absent, which is what compact display
-- already handles everywhere else on this site.
ALTER TABLE rental_application_invites
  ADD COLUMN IF NOT EXISTS property_town TEXT,
  ADD COLUMN IF NOT EXISTS property_state TEXT,
  ADD COLUMN IF NOT EXISTS property_zip TEXT;

-- The reuse picker reads the distinct properties off the invite list the admin
-- page already loads, so no view is needed — but ordering that list by most
-- recently used is worth an index once there are more than a screenful.
CREATE INDEX IF NOT EXISTS idx_rental_invites_property
  ON rental_application_invites (property_address, property_town, created_at DESC);
