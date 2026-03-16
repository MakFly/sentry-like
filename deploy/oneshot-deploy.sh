#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# ErrorWatch - oneshot-deploy.sh (deprecated)
# ----------------------------------------------------------------------------
# Kept for backward compatibility only.
# This script now redirects to first-init-deploy.sh.
#
# Use instead:
# - First deploy: deploy/first-init-deploy.sh .env.production
# - Updates:      deploy/deploy.sh .env.production
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[DEPRECATED] deploy/oneshot-deploy.sh"
echo "Use deploy/first-init-deploy.sh for first install and deploy/deploy.sh for updates."

exec "${SCRIPT_DIR}/first-init-deploy.sh" "$@"
