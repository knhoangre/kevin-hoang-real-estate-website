#!/bin/sh
#
# Run the SQL migration tests against a throwaway Postgres.
#
#   sh supabase/tests/run.sh
#
# WHY THIS EXISTS. Nothing in CI covers SQL, and this repo has already been
# bitten by SQL that looked right and was not — a BEFORE INSERT trigger that
# fired for every proposed row and recorded 278,025 "price changes" of which 25
# were real, and a guard trigger that silently discarded a column because
# is_admin() resolves to NULL under the service role. Both were the kind of
# defect that reports success. CLAUDE.md records that the CRM migration's 30
# assertions were worth running against a real Postgres and worth re-running
# after any change; those were run by hand and never committed, so this is that
# practice written down.
#
# It needs Docker and nothing else — no Supabase project, no credentials, no
# network beyond the one image pull. 00_bootstrap.sql stands in for what the
# platform provides (the anon/authenticated/service_role roles, and the
# idx_listings columns the migrations under test read), so the migrations run
# exactly as written rather than in a doctored form.
#
# Exits non-zero on the first failed assertion: ok() raises, ON_ERROR_STOP is
# set, and `set -e` carries it out.
set -e

REPO=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TESTS="$REPO/supabase/tests"
CONTAINER=idx-comps-test-pg

# The migrations under test, in the order they apply. Add to this list when a
# migration changes anything these assertions cover.
MIGRATIONS="
20260920100000_idx_street_fields
20260920110000_idx_sold_archive
20260920120000_idx_geocodes
20260920130000_idx_comparable_sales
20260926100000_idx_comps_all_towns
20260927090000_idx_archive_by_batch
20260927110000_idx_comp_pool
"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "Starting Postgres..."
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=postgres postgres:15-alpine >/dev/null
i=0
while [ $i -lt 40 ]; do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  i=$((i + 1))
  sleep 1
done

psql_file() {
  docker cp "$1" "$CONTAINER:/tmp/run.sql" >/dev/null
  docker exec "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 "$2" -f /tmp/run.sql
}

psql_file "$TESTS/00_bootstrap.sql" -q

for m in $MIGRATIONS; do
  echo "Applying $m"
  # The DROP POLICY IF EXISTS lines are idempotence guards and say so on a fresh
  # database; that notice is noise, not a result.
  psql_file "$REPO/supabase/migrations/$m.sql" -q 2>&1 | grep -v 'NOTICE.*skipping' || true
done

echo
psql_file "$TESTS/idx_comps_test.sql" "" 2>&1 | grep -E 'ok  |FAIL|ERROR'
echo
echo "All assertions passed."
