-- Assertions for 20261030100000_avatars_bucket.
--
-- Run with: sh supabase/tests/run.sh
--
-- A profile picture is public to look at and private to write. What matters is
-- the second half: one account must not be able to replace, delete or even
-- list another's picture, and the public key must not be able to upload at all.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

CREATE OR REPLACE FUNCTION raises(sql TEXT, state TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE = state;
END; $$;

CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-4000-8000-0000000000f1', 'first@example.com'),
  ('00000000-0000-4000-8000-0000000000f2', 'second@example.com');

SELECT ok((SELECT public AND file_size_limit = 2097152
                  AND allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
             FROM storage.buckets WHERE id = 'avatars'),
          'the avatars bucket is public to read, 2 MB, pictures only');

-- The second person's picture, put there as the owner.
INSERT INTO storage.objects (bucket_id, name)
  VALUES ('avatars', '00000000-0000-4000-8000-0000000000f2/avatar.jpg');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000f1');
INSERT INTO storage.objects (bucket_id, name)
  VALUES ('avatars', '00000000-0000-4000-8000-0000000000f1/avatar.jpg');
SELECT ok((SELECT count(*) FROM storage.objects
            WHERE bucket_id = 'avatars' AND name LIKE '00000000-0000-4000-8000-0000000000f1/%') = 1,
          'a person can upload a picture into their own folder');
WITH replaced AS (
  UPDATE storage.objects SET name = name
   WHERE bucket_id = 'avatars' AND name = '00000000-0000-4000-8000-0000000000f1/avatar.jpg'
  RETURNING 1)
SELECT ok((SELECT count(*) FROM replaced) = 1, 'and replace it, which is what upsert does');
SELECT ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars') = 1,
          'and sees only their own folder, not everyone''s');
SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name)
                   VALUES ('avatars', '00000000-0000-4000-8000-0000000000f2/avatar.jpg')$$, '42501'),
          'but cannot upload into someone else''s');
SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name) VALUES ('avatars', 'avatar.jpg')$$, '42501'),
          'or outside any folder');
WITH gone AS (
  DELETE FROM storage.objects
   WHERE bucket_id = 'avatars' AND name = '00000000-0000-4000-8000-0000000000f2/avatar.jpg'
  RETURNING 1)
SELECT ok((SELECT count(*) FROM gone) = 0, 'and cannot delete someone else''s picture');
RESET ROLE;

SELECT ok((SELECT count(*) FROM storage.objects
            WHERE name = '00000000-0000-4000-8000-0000000000f2/avatar.jpg') = 1,
          'the second person''s picture is still there');

SET ROLE anon;
SELECT become(NULL);
SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name)
                   VALUES ('avatars', '00000000-0000-4000-8000-0000000000f1/avatar.jpg')$$, '42501'),
          'the public key cannot upload at all');
SELECT ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'avatars') = 0,
          'nor list anyone''s folder');
RESET ROLE;
