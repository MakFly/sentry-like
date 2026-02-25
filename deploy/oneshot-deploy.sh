#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[DEPRECATED] deploy/oneshot-deploy.sh"
echo "Use deploy/first-init-deploy.sh for first install and deploy/deploy.sh for updates."

exec "${SCRIPT_DIR}/first-init-deploy.sh" "$@"
