#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Resolve production env file in priority order.
ENV_FILE=""
for candidate in ".env.production" ".env.prod" ".env"; do
    if [ -f "$candidate" ]; then
        ENV_FILE="$candidate"
        break
    fi
done

if [ -z "$ENV_FILE" ]; then
    echo "Error: no env file found (.env.production, .env.prod, or .env)."
    exit 1
fi

# Read a single key from .env-like files without sourcing shell syntax.
read_env_var() {
    local key="$1"
    local value
    value="$(sed -n -E "s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$/\1/p" "$ENV_FILE" | tail -n 1)"
    # Strip surrounding single or double quotes if present.
    if [[ "$value" =~ ^\".*\"$ ]]; then
        value="${value:1:${#value}-2}"
    elif [[ "$value" =~ ^\'.*\'$ ]]; then
        value="${value:1:${#value}-2}"
    fi
    printf '%s' "$value"
}

POSTGRES_USER="$(read_env_var POSTGRES_USER)"
POSTGRES_DB="$(read_env_var POSTGRES_DB)"
POSTGRES_PASSWORD="$(read_env_var POSTGRES_PASSWORD)"
BETTER_AUTH_SECRET="$(read_env_var BETTER_AUTH_SECRET)"

: "${POSTGRES_USER:=errorwatch}"
: "${POSTGRES_DB:=errorwatch}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in ${ENV_FILE}}"

echo "=== Starting Docker infra ==="
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d

echo "=== Waiting for postgres... ==="
sleep 5

echo "=== Forcing PostgreSQL credentials sync ==="
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 -v ew_user="${POSTGRES_USER}" -v ew_pass="${POSTGRES_PASSWORD}" \
    -c "DO \$\$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'ew_user') THEN
                EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'ew_user', :'ew_pass');
            ELSE
                EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'ew_user', :'ew_pass');
            END IF;
        END \$\$;"

echo "=== Creating database if not exists ==="
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'" 2>/dev/null | grep -q 1 || \
    docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"

echo "=== Enforcing database ownership ==="
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d postgres -c "ALTER DATABASE \"${POSTGRES_DB}\" OWNER TO \"${POSTGRES_USER}\";" >/dev/null

echo "=== Running migrations ==="
cd apps/monitoring-server
bun add drizzle-orm@latest drizzle-kit@latest 2>/dev/null || true
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}" bun run db:migrate
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
