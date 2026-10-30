-- Profile pictures: the bucket /profile uploads to, and who may write in it.
--
-- /profile has uploaded to `avatars/<user id>/avatar.<ext>` with upsert, then
-- linked the picture by its public URL — but no migration ever made the bucket
-- or a single policy for it, so every upload was refused (found 2026-10-28, in
-- the security review). Made here rather than in the dashboard, like
-- rental-documents and marketing-images, because the size cap, the types and
-- the policies are the real control and should be reviewable.
--
-- PUBLIC TO READ, so the picture works as a plain <img src> anywhere it is
-- shown. Public-read is a property of the BUCKET: a file is served to anyone
-- holding its URL. Listing is not — that is a SELECT policy on storage.objects,
-- and the one below shows a person only their own folder. So nobody can page
-- through every account's folder (each named by a user id) to collect them.
--
-- WRITES ONLY IN YOUR OWN FOLDER. The first path segment must be the caller's
-- user id. Upsert needs SELECT, INSERT and UPDATE together, so all three exist,
-- each scoped the same way, and DELETE so a picture can be replaced cleanly.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  -- The page uploads a 512px JPEG crop, tens of kilobytes. Two megabytes is
  -- room for that and no room for anything that is not a profile picture.
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users see their own avatar folder" ON storage.objects;
CREATE POLICY "Users see their own avatar folder"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);

DROP POLICY IF EXISTS "Users upload to their own avatar folder" ON storage.objects;
CREATE POLICY "Users upload to their own avatar folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);

DROP POLICY IF EXISTS "Users replace their own avatar" ON storage.objects;
CREATE POLICY "Users replace their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);

DROP POLICY IF EXISTS "Users delete their own avatar" ON storage.objects;
CREATE POLICY "Users delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);
