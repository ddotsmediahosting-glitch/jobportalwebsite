#!/bin/sh
set -e

echo "[Entrypoint] Syncing database schema..."
cd /app/backend

# Use the root workspace prisma binary (monorepo — prisma lives at /app/node_modules)
/app/node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "[Entrypoint] Schema synced. Starting server..."
exec node /app/backend/dist/src/server.js
