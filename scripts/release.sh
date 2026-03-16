#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/release.sh [--version vX.Y.Z | --type patch|minor|major] [--notes "text" | --notes-file path] [--dry-run]

Examples:
  scripts/release.sh --type patch
  scripts/release.sh --version v0.4.1 --notes "Bugfix release"
  scripts/release.sh --type minor --notes-file /tmp/release-notes.md
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] Missing required command: $1"
    exit 1
  fi
}

ensure_clean_tree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "[ERROR] Working tree is not clean. Commit/stash changes first."
    git status --short
    exit 1
  fi
}

ensure_on_main() {
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "main" ]]; then
    echo "[ERROR] Releases must be created from 'main' (current: $branch)."
    exit 1
  fi
}

ensure_synced_with_origin_main() {
  git fetch origin main --tags
  local local_head remote_head
  local_head="$(git rev-parse HEAD)"
  remote_head="$(git rev-parse origin/main)"
  if [[ "$local_head" != "$remote_head" ]]; then
    echo "[ERROR] Local main is not aligned with origin/main."
    echo "       Run: git pull --ff-only origin main"
    exit 1
  fi
}

latest_semver_tag() {
  git tag --list 'v*' --sort=-v:refname | head -n1
}

compute_next_version() {
  local bump="$1"
  local last major minor patch
  last="$(latest_semver_tag)"

  if [[ -z "$last" ]]; then
    echo "v0.1.0"
    return 0
  fi

  if [[ ! "$last" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "[ERROR] Latest tag '$last' is not semver (vX.Y.Z)." >&2
    exit 1
  fi

  major="${BASH_REMATCH[1]}"
  minor="${BASH_REMATCH[2]}"
  patch="${BASH_REMATCH[3]}"

  case "$bump" in
    patch) patch=$((patch + 1)) ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    major) major=$((major + 1)); minor=0; patch=0 ;;
    *)
      echo "[ERROR] Invalid bump type: $bump (expected patch|minor|major)" >&2
      exit 1
      ;;
  esac

  echo "v${major}.${minor}.${patch}"
}

generate_default_notes() {
  local version="$1"
  local prev_tag="$2"
  local log_range
  if [[ -n "$prev_tag" ]]; then
    log_range="${prev_tag}..HEAD"
  else
    log_range="HEAD"
  fi

  {
    echo "Release ${version}"
    echo
    echo "## Changelog"
    if [[ -n "$prev_tag" ]]; then
      git log --pretty=format:'- %s (%h)' "$log_range"
    else
      git log --pretty=format:'- %s (%h)' -n 20 "$log_range"
    fi
  }
}

VERSION=""
BUMP_TYPE=""
NOTES=""
NOTES_FILE=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="${2:-}"
      shift 2
      ;;
    --type)
      BUMP_TYPE="${2:-}"
      shift 2
      ;;
    --notes)
      NOTES="${2:-}"
      shift 2
      ;;
    --notes-file)
      NOTES_FILE="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -n "$VERSION" && -n "$BUMP_TYPE" ]]; then
  echo "[ERROR] Use either --version or --type, not both."
  exit 1
fi

if [[ -z "$VERSION" && -z "$BUMP_TYPE" ]]; then
  echo "[ERROR] Provide --version vX.Y.Z or --type patch|minor|major."
  exit 1
fi

if [[ -n "$NOTES" && -n "$NOTES_FILE" ]]; then
  echo "[ERROR] Use either --notes or --notes-file, not both."
  exit 1
fi

require_cmd git
require_cmd gh

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

ensure_clean_tree
ensure_on_main
ensure_synced_with_origin_main

if [[ -z "$VERSION" ]]; then
  VERSION="$(compute_next_version "$BUMP_TYPE")"
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "[ERROR] Version must match semver format vX.Y.Z (got: $VERSION)"
  exit 1
fi

if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "[ERROR] Tag already exists: $VERSION"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "[ERROR] GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

PREV_TAG="$(latest_semver_tag)"
TMP_NOTES="$(mktemp)"
trap 'rm -f "$TMP_NOTES"' EXIT

if [[ -n "$NOTES_FILE" ]]; then
  if [[ ! -f "$NOTES_FILE" ]]; then
    echo "[ERROR] Notes file not found: $NOTES_FILE"
    exit 1
  fi
  cp "$NOTES_FILE" "$TMP_NOTES"
elif [[ -n "$NOTES" ]]; then
  printf '%s\n' "$NOTES" > "$TMP_NOTES"
else
  generate_default_notes "$VERSION" "$PREV_TAG" > "$TMP_NOTES"
fi

echo "[INFO] Previous tag: ${PREV_TAG:-<none>}"
echo "[INFO] New tag: $VERSION"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[DRY RUN] Release notes preview:"
  echo "----------------------------------------"
  cat "$TMP_NOTES"
  echo "----------------------------------------"
  echo "[DRY RUN] No tag/release created."
  exit 0
fi

git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"
gh release create "$VERSION" --title "$VERSION" --notes-file "$TMP_NOTES" --latest

echo "[SUCCESS] Created and published release: $VERSION"
