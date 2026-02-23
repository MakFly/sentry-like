#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Building ErrorWatch services..."

export NODE_ENV=production

echo "Building monitoring-server..."
cd apps/monitoring-server
bun run build
cd ../..

echo "Building dashboard..."
cd apps/dashboard
bun run build
cd ../..

cd "$PROJECT_ROOT"

echo "Starting ErrorWatch services via PM2..."

bunx pm2 delete errorwatch 2>/dev/null || true
bunx pm2 delete errorwatch-api 2>/dev/null || true
bunx pm2 delete errorwatch-dashboard 2>/dev/null || true

bunx pm2 start apps/monitoring-server/package.json \
    --name errorwatch-api \
    -- \
    start

bunx pm2 start apps/dashboard/package.json \
    --name errorwatch-dashboard \
    -- \
    start

bunx pm2 save

echo "Services started!"
bunx pm2 list
