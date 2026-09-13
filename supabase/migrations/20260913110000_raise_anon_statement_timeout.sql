-- Give an anonymous read long enough to finish a COLD query.
--
-- /search is the only page on this site that queries a large table live, and
-- `idx_listings` is 170 MB with 71 MB of indexes. An exact count has to scan
-- every matching row — about 16,000 for the default search — which answers in
-- 0.3s warm and over three seconds cold, when those pages come off disk after a
-- sync or a quiet spell.
--
-- Three seconds is the `anon` role's statement_timeout, so that first query of
-- the hour came back HTTP 500 and the visitor got an empty page. Refreshing
-- worked, because their own failed attempt had warmed the buffer cache. Measured
-- against this project: two 500s at 3.3s and 3.2s, then 0.27s for every call
-- afterwards.
--
-- 8 seconds is not an arbitrary number: it is Supabase's own default for the
-- `authenticated` role, so this brings an anonymous visitor in line with a
-- signed-in one rather than inventing a new ceiling. It buys the cold case
-- headroom; it does not let a pathological query run away.
--
-- This is the server half of the fix. The client half — retrying a failed read
-- twice, in searchListings — is independent and deliberately still there: it
-- covers a cold query slower than 8s, and it keeps working if this setting is
-- ever reset by a platform change or a project restore.
ALTER ROLE anon SET statement_timeout = '8s';

-- PostgREST caches role settings, so it has to be told to re-read them.
NOTIFY pgrst, 'reload config';
