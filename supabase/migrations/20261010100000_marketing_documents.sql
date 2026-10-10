-- Marketing documents: listing booklets, and home expense and upgrade sheets.
--
-- Kevin made these by hand in a slide program, one per listing: a folded
-- booklet for an open house, a sheet of what the house costs to run, a sheet of
-- what has been done to it. /admin/marketing builds them instead — the booklet
-- from an MLS number — and this is where a document is kept between visits, so
-- the twenty-six upgrade lines typed on Tuesday are still there on Saturday.
--
-- ONE ROW IS ONE DOCUMENT, AND `doc` IS ALL OF IT. The words, the rows, which
-- photograph sits in which frame and how it is cropped — one jsonb column,
-- edited as a set and saved with one UPDATE. src/lib/marketing.ts is the
-- contract for its shape, the way rentalApplication.ts is for an application's;
-- the columns beside it (`kind`, `design`, `title`, `mls_number`) are copies
-- written at save time so the list of documents can be read without opening
-- every one.
--
-- WHAT IS DELIBERATELY NOT HERE.
--
--   * No foreign key from `mls_number` to idx_listings. That table is a cache
--     of the feed and idx-sync deletes from it; a key would either block that
--     delete or cascade it into a booklet Kevin has already printed. Same
--     reasoning as showing_tour_stops and open_house_sign_ins.
--
--   * No copy of the listing's photographs. A frame holding an MLS photo holds
--     the MLS number and the photo's index, and the page shows it from MLS
--     PIN's own host — the decision photoUrl() in idxSearch.ts records. Only
--     what Kevin uploads himself is stored, in the bucket below.

CREATE TABLE IF NOT EXISTS marketing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  kind TEXT NOT NULL CHECK (kind IN ('booklet', 'expenses', 'upgrades')),
  -- Which layout. A name from DESIGNS in src/lib/marketing.ts, not an
  -- enumeration here: adding a design must not need a migration.
  design TEXT NOT NULL CHECK (length(btrim(design)) > 0),

  -- The address, for the list. Empty until one is typed.
  title TEXT NOT NULL DEFAULT '',
  -- Null for a home that is not in the feed.
  mls_number TEXT,

  doc JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(doc) = 'object'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS marketing_documents_recent ON marketing_documents (updated_at DESC);

-- `updated_at` is what the list sorts by, so it is the database's to write. A
-- browser's clock deciding which document is "most recent" is the same mistake
-- as a browser deciding what `submitted_at` means on an application.
CREATE OR REPLACE FUNCTION public.touch_marketing_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

-- Supabase grants every new function to anon and authenticated BY NAME. A
-- trigger function cannot be called directly anyway, but nothing here should
-- depend on that being the only thing in the way.
REVOKE ALL ON FUNCTION public.touch_marketing_document() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_touch_marketing_document ON marketing_documents;
CREATE TRIGGER trg_touch_marketing_document
  BEFORE UPDATE ON marketing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_marketing_document();

-- --- RLS ------------------------------------------------------------------
--
-- Admin only, like showing_tours and lockboxes. A booklet in progress can be a
-- listing nobody has been told about yet.

ALTER TABLE marketing_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages marketing documents" ON marketing_documents;
CREATE POLICY "Admin manages marketing documents"
  ON marketing_documents
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Supabase's default privileges hand every new table to anon as well. RLS would
-- refuse anon anyway — there is no anon policy — but it should not be the only
-- layer.
REVOKE ALL ON marketing_documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON marketing_documents TO authenticated;

-- --- Uploaded pictures ----------------------------------------------------
--
-- Kevin's own photographs, floor plans and a brokerage logo: the pictures the
-- MLS feed does not have, or has too small to print.
--
-- PUBLIC TO READ, and that is a decision rather than a default. These are
-- pictures made to be handed out at an open house, and a public object can sit
-- in an <img> for as long as the editor is open — a signed URL expires, and a
-- booklet whose photographs vanish an hour into laying it out, or at the moment
-- of printing, is worse than a marketing photo being reachable by anyone who
-- has its 36-character name. `rental-documents` next door is the opposite case
-- and stays private.
--
-- ONLY THE ADMIN CAN WRITE OR DELETE. The limits are the real control and are
-- here, where they can be reviewed, rather than in a dashboard field: the page
-- resizes a picture to 2400px before sending it, so 8 MB is far above anything
-- it will produce and far below a camera original.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing-images',
  'marketing-images',
  TRUE,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- A SELECT policy as well as INSERT and DELETE: removing an object reads it
-- first, so without one a delete succeeds and removes nothing. It is the
-- admin's alone — reading a public object through its URL needs no policy.
DROP POLICY IF EXISTS "Admin lists marketing images" ON storage.objects;
CREATE POLICY "Admin lists marketing images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'marketing-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin uploads marketing images" ON storage.objects;
CREATE POLICY "Admin uploads marketing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'marketing-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin deletes marketing images" ON storage.objects;
CREATE POLICY "Admin deletes marketing images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'marketing-images' AND public.is_admin());

-- No UPDATE policy. Uploads use upsert:false and a fresh uuid per file, so an
-- object is written once and replaced by adding another.
