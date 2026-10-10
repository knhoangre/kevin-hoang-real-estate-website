-- A stand-in for Supabase Storage's two tables, for migrations that create a
-- bucket and write policies on storage.objects.
--
-- Only what those migrations touch: the bucket row's columns and an objects
-- table with row-level security switched on. The grants mirror the platform's,
-- where every role may reach storage.objects and the POLICIES decide what it
-- sees — so a migration that forgets a policy fails here the way it would
-- there, rather than passing because the test role could not reach the table
-- at all.

CREATE SCHEMA storage;

CREATE TABLE storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN NOT NULL DEFAULT FALSE,
  file_size_limit BIGINT,
  allowed_mime_types TEXT[]
);

CREATE TABLE storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT REFERENCES storage.buckets (id),
  name TEXT NOT NULL,
  owner UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;
GRANT SELECT ON storage.buckets TO anon, authenticated, service_role;
