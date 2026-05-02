#!/bin/sh
set -e

cd /app/backend

# ── Wait for the database to actually accept connections ─────────────────────
# Compose's depends_on: condition: service_healthy fires as soon as MariaDB's
# healthcheck.sh succeeds, but there's still a small window where the TCP
# listener is up but the auth subsystem / network namespace is settling, and
# Prisma fails with P1001 ("Can't reach database server").
# Retry the schema push up to 30 times (60s total) before giving up.

MAX_ATTEMPTS=30
ATTEMPT=1

while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do
  echo "[Entrypoint] Syncing database schema (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
  if /app/node_modules/.bin/prisma db push --skip-generate --accept-data-loss; then
    echo "[Entrypoint] Schema synced."
    break
  fi

  if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
    echo "[Entrypoint] FAILED to reach the database after $MAX_ATTEMPTS attempts — giving up."
    exit 1
  fi

  echo "[Entrypoint] DB not ready yet — sleeping 2s before retry."
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

echo "[Entrypoint] Starting server..."
exec node /app/backend/dist/src/server.js
