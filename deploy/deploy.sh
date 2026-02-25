#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/_common.sh
source "${SCRIPT_DIR}/_common.sh"

SKIP_PULL=0
ENV_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-pull)
      SKIP_PULL=1
      shift
      ;;
    -h|--help)
      cat <<'USAGE'
Usage:
  deploy/deploy.sh [--skip-pull] [path-to-env-file]

Default env file resolution order:
  .env.production -> .env.prod -> .env
USAGE
      exit 0
      ;;
    *)
      ENV_ARG="$1"
      shift
      ;;
  esac
done

ENV_FILE="$(resolve_env_file "${ENV_ARG}")" || {
  echo "[ERROR] No env file found. Provide one or create .env.production / .env.prod / .env"
  exit 1
}

cd "$PROJECT_ROOT"

require_runtime_tools || exit 1
load_env_file "$ENV_FILE"
validate_required_env "$ENV_FILE"
export_runtime_env

if [[ "$SKIP_PULL" -eq 0 ]]; then
  echo "[1/10] Pull latest code"
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "[ERROR] Working tree is dirty. Commit/stash local changes before deploy."
    git status --short
    exit 1
  fi

  DEPLOY_BRANCH="${DEPLOY_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
  git fetch origin "$DEPLOY_BRANCH"
  git pull --ff-only origin "$DEPLOY_BRANCH"
else
  echo "[1/10] Skip git pull (--skip-pull)"
fi

echo "[2/10] Install dependencies"
bun install --frozen-lockfile --ignore-scripts

echo "[3/10] Start infra (PostgreSQL + Redis)"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d postgres redis
wait_for_healthy "errorwatch-postgres" 90
wait_for_healthy "errorwatch-redis" 60

echo "[4/10] Build API and dashboard"
bun run build

echo "[5/10] Ensure DB role/database"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'" | grep -q 1 || \
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "CREATE ROLE \"${POSTGRES_USER}\" LOGIN PASSWORD '${POSTGRES_PASSWORD}';"

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | grep -q 1 || \
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE \"${POSTGRES_DB}\" OWNER \"${POSTGRES_USER}\";"

docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d postgres -c "ALTER DATABASE \"${POSTGRES_DB}\" OWNER TO \"${POSTGRES_USER}\";"

echo "[6/10] Run migrations"
(
  cd apps/monitoring-server
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DOCKER_POSTGRES_PORT}/${POSTGRES_DB}"
  bun run db:push
)

echo "[7/10] Start/reload PM2 apps"
bunx pm2 startOrReload deploy/ecosystem.config.cjs
bunx pm2 save

echo "[8/10] Start/reload Caddy (Docker)"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d caddy
if docker ps --format '{{.Names}}' | grep -q '^errorwatch-caddy$'; then
  wait_for_healthy "errorwatch-caddy" 60 || echo "[WARN] Caddy health check failed"
fi

echo "[9/10] Health checks"
run_health_checks

echo "[10/10] PM2 status"
bunx pm2 list

echo "[SUCCESS] Deployment completed."
