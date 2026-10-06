-- What each of the two logins may do. Run AFTER creating the SQL users
-- `sold_rw` and `sold_ro` in the CockroachDB Cloud console, where their
-- passwords are set — a password does not belong in a file in this repository.
--
--   sold_rw   idx-sync, under the service role. Adds and corrects rows.
--             NO DELETE: nothing is ever removed from this table, and a login
--             that cannot delete cannot be made to by a bug.
--
--   sold_ro   the public sold-api function. SELECT and nothing else, with a
--             statement timeout, because it answers requests from the open
--             internet and every statement it runs spends request units.

GRANT SELECT, INSERT, UPDATE ON TABLE idx_sold TO sold_rw;
GRANT SELECT, INSERT ON TABLE idx_sold_runs TO sold_rw;

GRANT SELECT ON TABLE idx_sold TO sold_ro;
ALTER ROLE sold_ro SET statement_timeout = '8s';
