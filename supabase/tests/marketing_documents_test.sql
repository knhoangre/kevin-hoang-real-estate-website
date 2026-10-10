-- Assertions for marketing documents and their uploaded pictures.
--
-- Run with: sh supabase/tests/run.sh
--
-- The table is the admin's alone, and the browser holds a key that can talk to
-- it directly, so what is asserted is mostly what must NOT be possible:
--
--   * Nobody but the admin reads, writes, changes or deletes a document — not
--     a signed-out visitor, and not a signed-in client.
--   * `updated_at` is the database's. The list of documents sorts by it, and a
--     browser's clock does not get to say which one is newest.
--   * Only the admin can put a picture in the bucket or take one out, and the
--     policies that allow it reach this bucket and no other.
--
-- ok() raises on failure and the runner sets ON_ERROR_STOP.

\set ON_ERROR_STOP on

CREATE OR REPLACE FUNCTION ok(cond BOOLEAN, label TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF cond THEN RAISE NOTICE 'ok   %', label;
  ELSE RAISE EXCEPTION 'FAIL %', label; END IF;
END; $$;

/* True when running `sql` raises the given SQLSTATE; false if it succeeds or raises another. */
CREATE OR REPLACE FUNCTION raises(sql TEXT, state TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE sql;
  RETURN FALSE;
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE = state;
END; $$;

/* How many rows `sql` changed, run as whoever is current. */
CREATE OR REPLACE FUNCTION affected(sql TEXT) RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE n BIGINT;
BEGIN
  EXECUTE sql;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

/* Become a signed-in user, the way a request does. */
CREATE OR REPLACE FUNCTION become(who UUID) RETURNS VOID LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', COALESCE(who::TEXT, ''), FALSE);
$$;

INSERT INTO auth.users (id, email, raw_app_meta_data) VALUES
  ('00000000-0000-4000-8000-0000000000a1', 'client@example.com', '{}'),
  ('00000000-0000-4000-8000-0000000000c1', 'kevin-marketing@example.com', '{"is_admin": true}')
ON CONFLICT (id) DO NOTHING;

-- A second bucket, so "the policies reach this bucket only" has something to
-- be wrong about.
INSERT INTO storage.buckets (id, name, public) VALUES ('some-other-bucket', 'some-other-bucket', FALSE);

-- ---------------------------------------------------------------------------
-- The bucket
-- ---------------------------------------------------------------------------

SELECT ok((SELECT public AND file_size_limit = 8388608
                  AND allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
             FROM storage.buckets WHERE id = 'marketing-images'),
          'the bucket is public to read, capped at 8 MB, and takes only pictures');

-- ---------------------------------------------------------------------------
-- A signed-out visitor
-- ---------------------------------------------------------------------------

SET ROLE anon;
SELECT become(NULL);

SELECT ok(raises($$SELECT count(*) FROM marketing_documents$$, '42501'),
          'a signed-out visitor cannot read documents');
SELECT ok(raises($$INSERT INTO marketing_documents (kind, design) VALUES ('booklet', 'classic')$$, '42501'),
          'a signed-out visitor cannot create one');
SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name) VALUES ('marketing-images', 'x/a.jpg')$$, '42501'),
          'a signed-out visitor cannot upload a picture');

RESET ROLE;

-- ---------------------------------------------------------------------------
-- The admin
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000c1');

INSERT INTO marketing_documents (id, kind, design, title, mls_number, doc, updated_at)
VALUES ('00000000-0000-4000-8000-00000000d001', 'booklet', 'classic', '151 Washington St',
        '73000001', '{"street":"151 Washington St"}', '2001-01-01');

SELECT ok((SELECT count(*) FROM marketing_documents) = 1, 'the admin can create and read a document');

SELECT ok(raises($$INSERT INTO marketing_documents (kind, design) VALUES ('flyer', 'classic')$$, '23514'),
          'a kind that is not booklet, expenses or upgrades is refused');
SELECT ok(raises($$INSERT INTO marketing_documents (kind, design) VALUES ('booklet', '  ')$$, '23514'),
          'a document needs a design');
SELECT ok(raises($$INSERT INTO marketing_documents (kind, design, doc) VALUES ('booklet', 'classic', '[]')$$, '23514'),
          'the document itself must be an object');

-- The row above was inserted claiming it was last touched in 2001. An update
-- that claims the same must still come out as now.
UPDATE marketing_documents
   SET doc = '{"street":"151 Washington Street"}', updated_at = '2001-01-01', created_at = '1999-01-01'
 WHERE id = '00000000-0000-4000-8000-00000000d001';

SELECT ok((SELECT updated_at > NOW() - INTERVAL '1 minute' FROM marketing_documents
            WHERE id = '00000000-0000-4000-8000-00000000d001'),
          'saving stamps updated_at with the database''s clock, whatever was sent');
SELECT ok((SELECT created_at > NOW() - INTERVAL '1 minute' FROM marketing_documents
            WHERE id = '00000000-0000-4000-8000-00000000d001'),
          'created_at cannot be rewritten by a save');
SELECT ok((SELECT doc->>'street' = '151 Washington Street' FROM marketing_documents
            WHERE id = '00000000-0000-4000-8000-00000000d001'),
          'and the save itself went through');

INSERT INTO storage.objects (bucket_id, name)
VALUES ('marketing-images', '00000000-0000-4000-8000-00000000d001/cover.jpg');
SELECT ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'marketing-images') = 1,
          'the admin can upload a picture and see it listed');

SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name) VALUES ('some-other-bucket', 'a.jpg')$$, '42501'),
          'the upload policy reaches this bucket and no other');

RESET ROLE;

-- ---------------------------------------------------------------------------
-- A signed-in client who is not the admin
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000a1');

SELECT ok((SELECT count(*) FROM marketing_documents) = 0,
          'a signed-in client sees no documents');
SELECT ok(raises($$INSERT INTO marketing_documents (kind, design) VALUES ('booklet', 'classic')$$, '42501'),
          'a signed-in client cannot create one');
SELECT ok(affected($$UPDATE marketing_documents SET title = 'defaced'$$) = 0,
          'a signed-in client cannot change one');
SELECT ok(affected($$DELETE FROM marketing_documents$$) = 0,
          'a signed-in client cannot delete one');

SELECT ok(raises($$INSERT INTO storage.objects (bucket_id, name) VALUES ('marketing-images', 'x/b.jpg')$$, '42501'),
          'a signed-in client cannot upload a picture');
SELECT ok(affected($$DELETE FROM storage.objects WHERE bucket_id = 'marketing-images'$$) = 0,
          'a signed-in client cannot delete a picture');

RESET ROLE;

SELECT ok((SELECT title = '151 Washington St' FROM marketing_documents
            WHERE id = '00000000-0000-4000-8000-00000000d001'),
          'the document is as the admin left it');
SELECT ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'marketing-images') = 1,
          'and so is the picture');

-- ---------------------------------------------------------------------------
-- The admin, deleting
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-0000000000c1');

SELECT ok(affected($$DELETE FROM storage.objects WHERE bucket_id = 'marketing-images'$$) = 1,
          'the admin can delete a picture');
SELECT ok(affected($$DELETE FROM marketing_documents$$) = 1,
          'the admin can delete a document');

RESET ROLE;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_function_privilege('anon', 'public.touch_marketing_document()', 'EXECUTE')
          AND NOT has_function_privilege('authenticated', 'public.touch_marketing_document()', 'EXECUTE'),
          'the trigger function is not callable with a browser''s key');
SELECT ok(NOT has_table_privilege('anon', 'marketing_documents', 'SELECT'),
          'anon holds no privilege on the table at all');
