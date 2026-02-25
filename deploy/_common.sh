#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

resolve_env_file() {
  if [[ -n "${1:-}" ]]; then
    echo "$1"
    return 0
  fi

  for candidate in ".env.production" ".env.prod" ".env"; do
    if [[ -f "${PROJECT_ROOT}/${candidate}" ]]; then
      echo "${PROJECT_ROOT}/${candidate}"
      return 0
    fi
  done

  return 1
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $1"
    return 1
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
      return 1
    fi

    sleep 2
    elapsed=$((elapsed + 2))
  done
}

load_env_file() {
  local env_file="$1"

  if [[ ! -f "$env_file" ]]; then
    echo "[ERROR] Env file not found: $env_file"
    return 1
  fi

  # shellcheck disable=SC1090
  set -a
  source "$env_file"
  set +a
}

validate_required_env() {
  local env_file="$1"

  : "${POSTGRES_DB:=errorwatch}"
  : "${POSTGRES_USER:=errorwatch}"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in ${env_file}}"
  : "${BETTER_AUTH_SECRET:?BETTER_AUTH_SECRET is required in ${env_file}}"
  : "${DOMAIN:?DOMAIN is required in ${env_file}}"
  : "${BASE_DOMAIN:?BASE_DOMAIN is required in ${env_file}}"
  : "${ACME_EMAIL:?ACME_EMAIL is required in ${env_file}}"
  : "${DASHBOARD_URL:?DASHBOARD_URL is required in ${env_file}}"
}

export_runtime_env() {
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
  export KUMA_UPSTREAM="${KUMA_UPSTREAM:-host.docker.internal:3001}"
  export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@host.docker.internal:${DOCKER_POSTGRES_PORT}/${POSTGRES_DB}}"
  export REDIS_URL="${REDIS_URL:-redis://host.docker.internal:${DOCKER_REDIS_PORT}}"
  export BETTER_AUTH_URL="${BETTER_AUTH_URL:-${API_URL:-${DASHBOARD_URL}}}"
  export NEXT_PUBLIC_MONITORING_API_URL="${NEXT_PUBLIC_MONITORING_API_URL:-${API_URL:-http://localhost:3333}}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${DASHBOARD_URL}}"
}

require_runtime_tools() {
  local missing=0
  for cmd in docker bun bunx node curl sed grep git; do
    if ! require_cmd "$cmd"; then
      missing=1
    fi
  done
  return $missing
}

run_health_checks() {
  local api_code dash_code

  api_code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/health/live" || true)"
  dash_code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/" || true)"

  echo "API /health/live: ${api_code}"
  echo "Dashboard /: ${dash_code}"

  if [[ "$api_code" != "200" || "$dash_code" != "200" ]]; then
    echo "[ERROR] One or more health checks failed."
    echo "Inspect logs with: bunx pm2 logs"
    return 1
  fi

  return 0
}
