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

# DB is which database a file runs in; everything but the CRM privacy tests
# shares the default one.
DB=postgres
psql_file() {
  docker cp "$1" "$CONTAINER:/tmp/run.sql" >/dev/null
  docker exec "$CONTAINER" psql -U postgres -d "$DB" -v ON_ERROR_STOP=1 "$2" -f /tmp/run.sql
}

# One file of assertions. Its output is filtered to the ok/FAIL lines for
# reading, and that is exactly why its status is checked here rather than left
# to `set -e`: in a pipeline the shell sees only grep's status, so until
# 2026-10-20 a file that stopped on a FAIL was followed by "All assertions
# passed".
run_tests() {
  if out=$(psql_file "$1" "" 2>&1); then
    printf '%s\n' "$out" | grep -E 'ok  |FAIL|ERROR' || true
  else
    printf '%s\n' "$out" | grep -E 'ok  |FAIL|ERROR' || true
    echo
    echo "FAILED in $(basename "$1")"
    exit 1
  fi
}

psql_file "$TESTS/00_bootstrap.sql" -q

for m in $MIGRATIONS; do
  echo "Applying $m"
  # The DROP POLICY IF EXISTS lines are idempotence guards and say so on a fresh
  # database; that notice is noise, not a result.
  psql_file "$REPO/supabase/migrations/$m.sql" -q 2>&1 | grep -v 'NOTICE.*skipping' || true
done

echo
run_tests "$TESTS/idx_comps_test.sql"

# Saved homes and viewing history. Per-user data, so these need the stand-ins
# for Supabase Auth; they are applied here, after the comps tests, which run as
# the owner and want none of it.
echo
psql_file "$TESTS/01_auth_bootstrap.sql" -q
echo "Applying 20261006120000_listing_favorites_and_views"
psql_file "$REPO/supabase/migrations/20261006120000_listing_favorites_and_views.sql" -q 2>&1 \
  | grep -v 'NOTICE.*skipping' || true
echo
run_tests "$TESTS/favorites_test.sql"

# Saved investment analyses and Kevin's cost book, on the same users and
# listings as the saved homes; the migration replaces admin_client_activity().
echo "Applying 20261020100000_investment_analyses"
psql_file "$REPO/supabase/migrations/20261020100000_investment_analyses.sql" -q 2>&1 \
  | grep -v 'NOTICE.*skipping' || true
echo
run_tests "$TESTS/investment_test.sql"

# The people on a showing tour, and filing them in the CRM. crm_upsert_contact()
# comes from its own migration, as written, over stand-ins for the CRM's tables.
# The seed goes in BETWEEN the two showing-tour migrations: half of what the
# second one does is carry existing single-client tours over.
echo
psql_file "$TESTS/02_crm_bootstrap.sql" -q
for m in 20260913120000_rental_applicant_to_crm 20261006110000_showing_tours; do
  echo "Applying $m"
  psql_file "$REPO/supabase/migrations/$m.sql" -q 2>&1 | grep -v 'NOTICE.*skipping' || true
done
psql_file "$TESTS/showing_tours_seed.sql" -q
echo "Applying 20261008100000_showing_tour_people"
psql_file "$REPO/supabase/migrations/20261008100000_showing_tour_people.sql" -q 2>&1 \
  | grep -v 'NOTICE.*skipping' || true
echo
run_tests "$TESTS/showing_tours_test.sql"

# Marketing documents and the bucket their uploaded pictures go in. The
# migration writes policies on storage.objects, so Storage's two tables get a
# stand-in first.
echo
psql_file "$TESTS/03_storage_bootstrap.sql" -q
echo "Applying 20261010100000_marketing_documents"
psql_file "$REPO/supabase/migrations/20261010100000_marketing_documents.sql" -q 2>&1 \
  | grep -v 'NOTICE.*skipping' || true
echo
run_tests "$TESTS/marketing_documents_test.sql"

# The morning showing reminders: the claim that sends each one once. Applied
# twice, because the schedule must survive the migration being re-run.
echo
for pass in 1 2; do
  echo "Applying 20261028110000_showing_reminders (pass $pass)"
  psql_file "$REPO/supabase/migrations/20261028110000_showing_reminders.sql" -q 2>&1 \
    | grep -v 'NOTICE.*skipping' || true
done
echo
run_tests "$TESTS/showing_reminders_test.sql"

# Who can read the CRM. Its own database, over the LIVE state of the CRM,
# sign-in and property-management tables (04_crm_live_state.sql, from a dump)
# rather than the stand-ins above: the leak this closes was in policies no
# migration created. The "before" file proves the fixture reproduces the leak,
# which is what makes the test after the migration mean anything.
echo
docker exec "$CONTAINER" createdb -U postgres crm_privacy
DB=crm_privacy
psql_file "$TESTS/01_auth_bootstrap.sql" -q
psql_file "$TESTS/04_crm_live_state.sql" -q
psql_file "$TESTS/crm_privacy_seed.sql" -q
run_tests "$TESTS/crm_privacy_before.sql"
echo "Applying 20261028100000_close_public_crm_reads"
psql_file "$REPO/supabase/migrations/20261028100000_close_public_crm_reads.sql" -q 2>&1 \
  | grep -v 'NOTICE.*skipping' || true
echo
run_tests "$TESTS/crm_privacy_test.sql"
DB=postgres

echo
echo "All assertions passed."
