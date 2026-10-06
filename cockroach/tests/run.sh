#!/bin/sh
#
# Run the CockroachDB tests against a throwaway single-node cluster.
#
#   sh cockroach/tests/run.sh
#
# The counterpart of supabase/tests/run.sh, for the other database. It needs
# Docker and nothing else: no CockroachDB Cloud account, no credentials. The
# schema in cockroach/schema is applied exactly as written, the two logins the
# real cluster has are created without passwords (the local node is --insecure),
# and the tests run in Deno because the code under test is an edge function's.
#
# The first run pulls two images. Exits non-zero on the first failed assertion.
set -e

REPO=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
DB=sold-test-crdb
NET=sold-test-net
CRDB_IMAGE=cockroachdb/cockroach:latest-v25.2
DENO_IMAGE=denoland/deno:alpine-2.1.4

cleanup() {
  docker rm -f "$DB" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

docker network create "$NET" >/dev/null
echo "Starting CockroachDB..."
docker run -d --name "$DB" --network "$NET" "$CRDB_IMAGE" start-single-node --insecure >/dev/null
i=0
while [ $i -lt 60 ]; do
  docker exec "$DB" cockroach sql --insecure -e "select 1" >/dev/null 2>&1 && break
  i=$((i + 1))
  sleep 1
done

sql_file() {
  docker cp "$1" "$DB:/tmp/run.sql" >/dev/null
  docker exec "$DB" cockroach sql --insecure -f /tmp/run.sql >/dev/null
}

echo "Applying 001_idx_sold"
sql_file "$REPO/cockroach/schema/001_idx_sold.sql"
docker exec "$DB" cockroach sql --insecure -e "CREATE USER sold_rw; CREATE USER sold_ro;" >/dev/null
echo "Applying 002_roles"
sql_file "$REPO/cockroach/schema/002_roles.sql"

# The repo is mounted read-only and is a Node project, so Deno is told not to
# write a lockfile beside package.json or to resolve anything from node_modules.
URL="postgresql://root@$DB:26257/defaultdb?sslmode=disable"
for t in "$REPO"/cockroach/tests/*_test.ts; do
  echo
  echo "== $(basename "$t")"
  docker run --rm --network "$NET" -v "$REPO":/app:ro -w /app \
    -e SOLD_DB_URL_RW="$URL" -e SOLD_DB_URL_RO="$URL" \
    -e DENO_NO_PACKAGE_JSON=1 \
    "$DENO_IMAGE" run --quiet --no-lock --no-config --allow-net --allow-env \
    "cockroach/tests/$(basename "$t")"
done

echo
echo "All CockroachDB assertions passed."
