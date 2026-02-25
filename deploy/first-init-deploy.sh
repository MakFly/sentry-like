#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/_common.sh
source "${SCRIPT_DIR}/_common.sh"

ENV_ARG="${1:-}"

if [[ "${ENV_ARG}" == "-h" || "${ENV_ARG}" == "--help" ]]; then
  cat <<'USAGE'
Usage:
  deploy/first-init-deploy.sh [path-to-env-file]

Initial server bootstrap + first full deploy.
Default env file resolution order:
  .env.production -> .env.prod -> .env
USAGE
  exit 0
fi

ensure_system_prereqs() {
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "[WARN] apt-get not found, skipping system package installation"
    return 0
  fi

  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    SUDO=""
  fi

  echo "[bootstrap] Install system packages"
  $SUDO apt-get update -y || true
  $SUDO env DEBIAN_FRONTEND=noninteractive apt-get install -y curl git docker.io docker-compose-plugin ca-certificates

  if command -v systemctl >/dev/null 2>&1; then
    $SUDO systemctl enable --now docker || true
  fi

  if ! command -v bun >/dev/null 2>&1; then
    echo "[bootstrap] Install Bun"
    curl -fsSL https://bun.sh/install | bash
  fi

  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"

  if ! command -v bunx >/dev/null 2>&1; then
    echo "[ERROR] bunx not found after Bun installation"
    exit 1
  fi

  if ! bunx pm2 -v >/dev/null 2>&1; then
    echo "[bootstrap] Install PM2"
    bun add -g pm2
  fi
}

ENV_FILE="$(resolve_env_file "${ENV_ARG}")" || {
  echo "[ERROR] No env file found. Provide one or create .env.production / .env.prod / .env"
  exit 1
}

cd "$PROJECT_ROOT"

ensure_system_prereqs

# shellcheck disable=SC1090
"${SCRIPT_DIR}/deploy.sh" --skip-pull "$ENV_FILE"
