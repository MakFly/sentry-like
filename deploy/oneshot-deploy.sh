#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  deploy/oneshot-deploy.sh [path-to-env-file]

Default env file resolution order:
  .env.production -> .env.prod -> .env
USAGE
  exit 0
fi

resolve_env_file() {
  if [[ -n "${1:-}" ]]; then
    echo "$1"
    return 0
  fi

  for candidate in ".env.production" ".env.prod" ".env"; do
    if [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $1"
    exit 1
  fi
}

wait_for_healthy() {
  local container="$1"
  local timeout_seconds="$2"
  local elapsed=0

  while true; do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || true)"

    if [[ "$status" == "healthy" || "$status" == "running" ]]; then
      echo "[OK] $container is $status"
      return 0
    fi

    if (( elapsed >= timeout_seconds )); then
      echo "[ERROR] Timed out waiting for $container to become healthy (last status: ${status:-unknown})"
      docker logs "$container" --tail 100 || true
      exit 1
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done
}

ENV_FILE="$(resolve_env_file "${1:-}")" || {
  echo "[ERROR] No env file found. Provide one or create .env.production / .env.prod / .env"
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Env file not found: $ENV_FILE"
  exit 1
fi

require_cmd docker
require_cmd bun
require_cmd bunx
require_cmd node
require_cmd curl
require_cmd sed
require_cmd grep

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

: "${POSTGRES_DB:=errorwatch}"
: "${POSTGRES_USER:=errorwatch}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in ${ENV_FILE}}"
: "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required in ${ENV_FILE}}"
: "${DOMAIN:?DOMAIN is required in ${ENV_FILE}}"
: "${ACME_EMAIL:?ACME_EMAIL is required in ${ENV_FILE}}"
: "${DASHBOARD_URL:?DASHBOARD_URL is required in ${ENV_FILE}}"

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export ERRORWATCH_ROOT="$PROJECT_ROOT"
export PORT="${PORT:-3333}"
export DOCKER_POSTGRES_PORT="${DOCKER_POSTGRES_PORT:-55432}"
export DOCKER_REDIS_PORT="${DOCKER_REDIS_PORT:-56379}"
export CADDY_HTTP_PORT="${CADDY_HTTP_PORT:-80}"
export CADDY_HTTPS_PORT="${CADDY_HTTPS_PORT:-443}"
export DASHBOARD_UPSTREAM="${DASHBOARD_UPSTREAM:-host.docker.internal:4001}"
export API_UPSTREAM="${API_UPSTREAM:-host.docker.internal:3333}"
export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DOCKER_POSTGRES_PORT}/${POSTGRES_DB}}"
export REDIS_URL="${REDIS_URL:-redis://localhost:${DOCKER_REDIS_PORT}}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-${DASHBOARD_URL}}"
export NEXT_PUBLIC_MONITORING_API_URL="${NEXT_PUBLIC_MONITORING_API_URL:-${API_URL:-http://localhost:3333}}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${DASHBOARD_URL}}"

echo "[1/8] Install dependencies"
bun install --frozen-lockfile

echo "[2/8] Start infra (PostgreSQL + Redis)"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d postgres redis

wait_for_healthy "errorwatch-postgres" 90
wait_for_healthy "errorwatch-redis" 60

echo "[3/8] Build API and dashboard"
bun run build

echo "[4/8] Ensure DB role/database"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -v ew_user="${POSTGRES_USER}" -v ew_pass="${POSTGRES_PASSWORD}" \
  -c "DO \$\$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'ew_user') THEN
        EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'ew_user', :'ew_pass');
      ELSE
        EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', :'ew_user', :'ew_pass');
      END IF;
    END \$\$;"

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1 || \
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER DATABASE \"${POSTGRES_DB}\" OWNER TO \"${POSTGRES_USER}\";"

echo "[5/8] Run migrations"
(
  cd apps/monitoring-server
  DATABASE_URL="${DATABASE_URL}" bun run db:migrate
)

echo "[6/8] Start/reload PM2 apps"
bunx pm2 startOrReload deploy/ecosystem.config.cjs --update-env
bunx pm2 save

echo "[7/8] Start/reload Caddy (Docker)"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d caddy
wait_for_healthy "errorwatch-caddy" 60

echo "[8/8] Health checks"
API_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/health/live" || true)"
DASH_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/" || true)"

echo "API /health/live: ${API_CODE}"
echo "Dashboard /: ${DASH_CODE}"

if [[ "$API_CODE" != "200" || "$DASH_CODE" != "200" ]]; then
  echo "[ERROR] One or more health checks failed."
  echo "Inspect logs with: bunx pm2 logs"
  exit 1
fi

echo "[SUCCESS] Production oneshot deployment completed."
echo "PM2 status:"
bunx pm2 list
