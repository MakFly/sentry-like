#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
bunx drizzle-kit push --force
echo "[entrypoint] Migrations complete."

echo "[entrypoint] Starting API server..."
exec bun run dist/index.js
