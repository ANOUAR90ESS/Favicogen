#!/usr/bin/env bash
#
# Runs the migrations against a throwaway PostgreSQL and attacks the policies.
#
# Not wired into CI: it needs a PostgreSQL server, and this SQL changes rarely
# enough that paying for a service container on every push is the wrong trade.
# Run it whenever a migration or a policy changes — which is exactly when a
# mistake here would be invisible and total.
#
# The harness stands in for the parts of Supabase the policies lean on:
# auth.uid() reading the request JWT, the anon and authenticated roles, and the
# storage tables. It proves the policies' logic, not Supabase's own behaviour.
#
#   ./supabase/tests/run.sh
#
set -euo pipefail

PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}
[ -x "$PGBIN/initdb" ] || { echo "No PostgreSQL found. Set PGBIN."; exit 1; }

# PostgreSQL refuses to start as root, which is most CI images and some
# containers. Hand the whole script to an unprivileged user rather than failing
# with a hint the caller then has to act on themselves.
if [ "$(id -u)" -eq 0 ]; then
  AS=${PGUSER_LOCAL:-postgres}
  id "$AS" >/dev/null 2>&1 || { echo "Running as root and no '$AS' user to drop to."; exit 1; }
  work=$(mktemp -d); chmod 777 "$work"
  cp -r "$(cd "$(dirname "$0")/.." && pwd)" "$work/supabase"
  chown -R "$AS" "$work"
  exec su "$AS" -c "PGBIN='$PGBIN' '$work/supabase/tests/run.sh'"
fi

ROOTDIR=$(mktemp -d)
# initdb insists on an empty directory, so the socket cannot live inside it.
DATA="$ROOTDIR/data"
SOCK="$ROOTDIR/sock"
mkdir -p "$SOCK"
trap '"$PGBIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$ROOTDIR"' EXIT

# Its own socket directory and a port nobody is on, so this never collides with
# a PostgreSQL the developer is already running — including a previous run of
# this script that did not get to clean up.
PORT=$(python3 -c "import socket;s=socket.socket();s.bind(('127.0.0.1',0));print(s.getsockname()[1]);s.close()" 2>/dev/null || echo 55432)

"$PGBIN/initdb" -D "$DATA" -A trust -U postgres >/dev/null
"$PGBIN/pg_ctl" -D "$DATA" -o "-k $SOCK -h '' -p $PORT" -l "$DATA/log" start >/dev/null || {
  echo "PostgreSQL would not start:"; tail -20 "$DATA/log"; exit 1;
}

run() { psql -h "$SOCK" -p "$PORT" -U postgres "$@"; }

here=$(cd "$(dirname "$0")" && pwd)
run -q -f "$here/00_supabase_harness.sql" >/dev/null
for migration in "$here"/../migrations/*.sql; do
  echo "applying $(basename "$migration")"
  run -v ON_ERROR_STOP=1 -q -f "$migration" 2>&1 | grep -v NOTICE || true
done

echo
run -q -f "$here/01_policies_test.sql" 2>&1 \
  | grep -Ev '^(SET|INSERT|UPDATE|DELETE|TRUNCATE|DETAIL|HINT|CONTEXT|$)'
