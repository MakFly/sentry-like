#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== ErrorWatch Database Reset Script ==="

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  ./deploy/reset-db.sh [env-file]

Reset the database and re-run migrations.

Arguments:
  env-file     Optional path to environment file (default: .env.production)
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

ENV_FILE="$(resolve_env_file "${1:-}")" || {
  echo "[ERROR] No env file found"
  exit 1
}

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Env file not found: $ENV_FILE"
  exit 1
fi

source "$ENV_FILE"

: "${POSTGRES_DB:=errorwatch}"
: "${POSTGRES_USER:=errorwatch}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"

export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:55432/${POSTGRES_DB}"

echo "[1/4] Loading environment from $ENV_FILE"
echo "       Database: $POSTGRES_DB"
echo "       User: $POSTGRES_USER"

echo "[2/4] Dropping all tables..."
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO ${POSTGRES_USER};
    GRANT ALL ON SCHEMA public TO public;
  " 2>/dev/null || true

echo "[3/4] Running migrations..."
cd apps/monitoring-server
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:55432/${POSTGRES_DB}" bun run db:push

echo "[4/4] Database reset complete!"
echo ""
echo "Database has been reset and migrations re-applied."
echo "All data has been lost."
