-- Assertions for saved investment analyses and Kevin's cost overrides.
--
-- Run with: sh supabase/tests/run.sh   (after favorites_test.sql, whose users
-- and listings it reuses)
--
-- What must NOT be possible, mostly:
--
--   * One account reading, changing or removing another's analysis.
--   * A browser writing the snapshot — address and price are the listing's — or
--     moving an analysis to another home or another person by an UPDATE.
--   * Anybody but the admin changing the cost book everybody's numbers start
--     from, or anybody signed out reading either table.
--
-- ok(), raises() and become() come from favorites_test.sql.

\set ON_ERROR_STOP on

-- favorites_test.sql moves this listing's price to test its own snapshot; this
-- file says what it expects instead of inheriting that.
RESET ROLE;
UPDATE idx_listings SET list_price = 900000 WHERE mls_number = '7000001';

-- ---------------------------------------------------------------------------
-- Saving
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');

-- Ann saves an analysis while claiming to be Bob, with a forged snapshot.
INSERT INTO investment_analyses (user_id, mls_number, strategy, inputs, address, list_price)
VALUES ('00000000-0000-4000-8000-00000000000b', '7000001', 'flip', '{"version":1,"price":850000}', 'FORGED', 1);

RESET ROLE;
SELECT ok((SELECT count(*) FROM investment_analyses
            WHERE user_id = '00000000-0000-4000-8000-00000000000a' AND mls_number = '7000001') = 1,
          'an analysis belongs to the caller, whatever user_id was sent');
SELECT ok((SELECT address = '1 Maple St' AND town = 'Newton' AND list_price = 900000
             FROM investment_analyses WHERE mls_number = '7000001'),
          'the snapshot is the listing''s, not what the browser sent');

SET ROLE authenticated;
SELECT ok(raises($$INSERT INTO investment_analyses (mls_number, inputs) VALUES ('7999999', '{}')$$, '23514'),
          'a number that is not a listing cannot be saved');
SELECT ok(raises($$INSERT INTO investment_analyses (mls_number, inputs) VALUES ('7000002', '[1,2]')$$, '23514'),
          'inputs must be a document, not a list');
SELECT ok(raises($$INSERT INTO investment_analyses (mls_number, strategy, inputs) VALUES ('7000002', 'lottery', '{}')$$, '23514'),
          'a strategy must be one the page has');
SELECT ok(raises(format($$INSERT INTO investment_analyses (mls_number, inputs) VALUES ('7000002', %L::jsonb)$$,
                        json_build_object('pad', repeat('x', 40000))::text), '23514'),
          'one analysis cannot hold 40 KB');
SELECT ok(raises($$INSERT INTO investment_analyses (mls_number, inputs) VALUES ('7000001', '{}')$$, '23505'),
          'one analysis per person per home');

-- An update may change the inputs and nothing else.
UPDATE investment_analyses
   SET inputs = '{"version":1,"price":800000}', strategy = 'brrrr',
       user_id = '00000000-0000-4000-8000-00000000000b', mls_number = '7000002',
       address = 'FORGED', list_price = 1
 WHERE mls_number = '7000001';
RESET ROLE;
SELECT ok((SELECT user_id = '00000000-0000-4000-8000-00000000000a' AND mls_number = '7000001'
                  AND address = '1 Maple St' AND list_price = 900000
                  AND strategy = 'brrrr' AND (inputs ->> 'price')::numeric = 800000
             FROM investment_analyses WHERE address = '1 Maple St'),
          'an update changes the inputs and the strategy, and puts owner, home and snapshot back');

-- ---------------------------------------------------------------------------
-- Other people
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000b');
SELECT ok((SELECT count(*) FROM investment_analyses) = 0, 'Bob cannot see Ann''s analysis');
UPDATE investment_analyses SET inputs = '{"hijacked":true}';
DELETE FROM investment_analyses;
RESET ROLE;
SELECT ok((SELECT count(*) FROM investment_analyses WHERE inputs ? 'hijacked') = 0,
          'nor change it');
SELECT ok((SELECT count(*) FROM investment_analyses) = 1, 'nor remove it');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000c');
SELECT ok((SELECT count(*) FROM investment_analyses) = 1, 'the admin reads every analysis');
UPDATE investment_analyses SET inputs = '{"admin":true}';
RESET ROLE;
SELECT ok((SELECT count(*) FROM investment_analyses WHERE inputs ? 'admin') = 0,
          'but cannot change an investor''s assumptions');

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000c');
SELECT ok((SELECT analysis_count = 1 FROM public.admin_client_activity() WHERE email = 'ann@example.com'),
          'the admin''s summary counts Ann''s analysis');
SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT ok(raises($$SELECT * FROM public.admin_client_activity()$$, '42501'),
          'nobody else can run the summary');
DELETE FROM investment_analyses WHERE mls_number = '7000001';
RESET ROLE;
SELECT ok((SELECT count(*) FROM investment_analyses) = 0, 'Ann can remove her own analysis');

SET ROLE anon;
SELECT ok(raises($$SELECT * FROM investment_analyses$$, '42501'), 'signed out, the analyses cannot be read at all');
SELECT ok(raises($$SELECT * FROM investment_cost_overrides$$, '42501'), 'nor the cost book');
RESET ROLE;

-- ---------------------------------------------------------------------------
-- Kevin's prices
-- ---------------------------------------------------------------------------

SET ROLE authenticated;
SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT ok(raises($$INSERT INTO investment_cost_overrides (key, low, mid, high) VALUES ('roof', 1, 2, 3)$$, '42501'),
          'an investor cannot change the cost book');

SELECT become('00000000-0000-4000-8000-00000000000c');
INSERT INTO investment_cost_overrides (key, low, mid, high, note, updated_by)
VALUES ('roof', 20000, 25000, 30000, 'Smith Roofing, Oct 2026', '00000000-0000-4000-8000-00000000000a');
SELECT ok(raises($$INSERT INTO investment_cost_overrides (key, low, mid, high) VALUES ('windows', 3, 2, 1)$$, '23514'),
          'figures out of order are refused');
SELECT ok(raises($$INSERT INTO investment_cost_overrides (key, low, mid, high) VALUES ('Bad Key!', 1, 2, 3)$$, '23514'),
          'a key that is not a cost-book key shape is refused');

SELECT become('00000000-0000-4000-8000-00000000000a');
SELECT ok((SELECT mid = 25000 FROM investment_cost_overrides WHERE key = 'roof'),
          'every account reads Kevin''s price');
UPDATE investment_cost_overrides SET mid = 1;
DELETE FROM investment_cost_overrides;
RESET ROLE;
SELECT ok((SELECT mid = 25000 AND updated_by = '00000000-0000-4000-8000-00000000000c'
             FROM investment_cost_overrides WHERE key = 'roof'),
          'an investor cannot change or remove it, and it records who really set it');

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

SELECT ok(NOT has_function_privilege('anon', 'public.fill_investment_analysis()', 'execute')
      AND NOT has_function_privilege('authenticated', 'public.fill_investment_analysis()', 'execute')
      AND NOT has_function_privilege('anon', 'public.admin_client_activity()', 'execute'),
          'the trigger functions and the summary are not callable by the public key');
