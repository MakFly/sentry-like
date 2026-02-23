#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Starting ErrorWatch services via PM2..."

export NODE_ENV=production

bunx pm2 delete errorwatch 2>/dev/null || true
bunx pm2 delete errorwatch-api 2>/dev/null || true
bunx pm2 delete errorwatch-dashboard 2>/dev/null || true

bunx pm2 start apps/monitoring-server/package.json \
    --name errorwatch-api \
    -- \
    start 2>/dev/null || \
    bunx pm2 start bun --name errorwatch-api -- run apps/monitoring-server/src/index.ts

bunx pm2 start apps/dashboard/package.json \
    --name errorwatch-dashboard \
    -- \
    start 2>/dev/null || \
    bunx pm2 start bun --name errorwatch-dashboard -- run apps/dashboard/src/server.ts -p 3001

bunx pm2 save

echo "Services started!"
bunx pm2 list
