#!/bin/sh
set -e

echo "[Entrypoint] Syncing database schema..."
cd /app/backend

# Use the local prisma binary directly — avoids npx PATH issues
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "[Entrypoint] Schema synced. Starting server..."
exec node /app/backend/dist/src/server.js
