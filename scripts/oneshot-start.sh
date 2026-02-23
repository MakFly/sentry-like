#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

set -a
source .env 2>/dev/null || true
set +a

echo "=== Starting Docker infra ==="
docker compose -f docker-compose.prod.yml up -d

echo "=== Waiting for postgres... ==="
sleep 5

echo "=== Creating database if not exists ==="
docker compose -f docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER:-errorwatch}" -d "${POSTGRES_DB:-errorwatch}" -c "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB:-errorwatch}'" 2>/dev/null | grep -q 1 || \
    docker compose -f docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER:-errorwatch}" -d "${POSTGRES_DB:-errorwatch}" -c "CREATE DATABASE ${POSTGRES_DB:-errorwatch};"

echo "=== Running migrations ==="
cd apps/monitoring-server
bun add drizzle-orm@latest drizzle-kit@latest
bun run db:migrate
cd ../..

export NODE_ENV=production

echo "=== Building services ==="
echo "Building monitoring-server..."
cd apps/monitoring-server
bun run build
cd ../..

echo "Building dashboard..."
cd apps/dashboard
bun run build
cd ../..

cd "$PROJECT_ROOT"

echo "=== Starting services via PM2 ==="

bunx pm2 delete errorwatch 2>/dev/null || true
bunx pm2 delete errorwatch-api 2>/dev/null || true
bunx pm2 delete errorwatch-dashboard 2>/dev/null || true

bunx pm2 start bun --name errorwatch-api -- \
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" \
    REDIS_URL="redis://localhost:6379" \
    BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
    NODE_ENV=production \
    -- run apps/monitoring-server/dist/index.js

bunx pm2 start bun --name errorwatch-dashboard -- \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    -- run apps/dashboard/node_modules/.bin/next start -p 4001

bunx pm2 save

echo "=== All services started! ==="
bunx pm2 list
