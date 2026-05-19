#!/usr/bin/env bash
# Launch a Claude Code dev session correctly scoped to the agency/ runtime.
#
# Why this exists: the Scout/Diagnoser runtime is the `agency/` subdirectory.
# Its `.mcp.json` (postgres-ro + google-maps), `/scout` command, and `scout`
# subagent only load when Claude is launched from `agency/`. Launching from
# the repo root silently loses all three (`claude mcp list` shows nothing).
# The `.env`, however, lives at the repo root. This script reads env from the
# root, validates it, then launches Claude from `agency/`.
#
# Env-loading note: we split each .env line on the FIRST `=` only and export
# the value literally. Do NOT switch to `set -a; . .env` — the unquoted `&`
# in the Neon connection strings truncates DATABASE_URL_UNPOOLED (the exact
# bug this whole arc was chasing).
#
# Usage:  ./scripts/dev-session.sh          # from anywhere in the repo
#         ./scripts/dev-session.sh --resume # extra args pass through to claude

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
AGENCY_DIR="$REPO_ROOT/agency"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: $ENV_FILE not found." >&2
  echo "       generate it with:  op inject -i .env.tpl -o .env --force" >&2
  exit 1
fi

if [[ ! -d "$AGENCY_DIR" ]]; then
  echo "error: $AGENCY_DIR not found — wrong repo?" >&2
  exit 1
fi

# Export .env, splitting on the first `=` only so `&` in values is harmless.
set -a
while IFS='=' read -r k v; do
  [[ $k =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && export "$k=$v"
done < <(grep -vE '^[[:space:]]*(#|$)' "$ENV_FILE")
set +a

# Fail fast if anything Scout needs is missing or visibly truncated.
missing=()
for var in DATABASE_URL_UNPOOLED GOOGLE_MAPS_API_KEY AGENT_API_KEY OPS_CONSOLE_URL; do
  [[ -n "${!var:-}" ]] || missing+=("$var")
done
if (( ${#missing[@]} )); then
  echo "error: missing required env vars: ${missing[*]}" >&2
  echo "       check $ENV_FILE." >&2
  exit 1
fi

if [[ "$DATABASE_URL_UNPOOLED" != postgresql://* || "$DATABASE_URL_UNPOOLED" == *"&" ]]; then
  echo "error: DATABASE_URL_UNPOOLED looks malformed or truncated at '&'." >&2
  echo "       it must be a full postgresql:// URL — re-inject .env." >&2
  exit 1
fi

echo "env ok  (.env from $REPO_ROOT)  →  launching claude in $AGENCY_DIR"
cd "$AGENCY_DIR"
exec claude "$@"
