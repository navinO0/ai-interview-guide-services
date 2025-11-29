#!/bin/sh
set -eu

# Optional env file path mounted into container (from Jenkins)
ENV_FILE_PATH="${ENV_FILE_PATH:-/etc/app/.env}"

log() { printf '%s %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }

log "entrypoint: starting"

# Normalize line endings for mounted env file if it exists
if [ -f "$ENV_FILE_PATH" ]; then
  if command -v dos2unix >/dev/null 2>&1; then
    dos2unix "$ENV_FILE_PATH" || true
  fi
fi

# Candidate directories where frontend static file might live
CANDIDATE_DIRS="
/usr/src/app/public
/usr/src/app/build
/usr/src/app/dist
/usr/src/app
"

# Choose first existing candidate, or create the first one (/usr/src/app/public) if none exist
TARGET_DIR=""
for d in $CANDIDATE_DIRS; do
  if [ -d "$d" ]; then
    TARGET_DIR="$d"
    break
  fi
done

if [ -z "$TARGET_DIR" ]; then
  # nothing exists — try to create public dir (common convention)
  TARGET_DIR="/usr/src/app/public"
  log "No candidate dir found; creating ${TARGET_DIR}"
  if ! mkdir -p "$TARGET_DIR" 2>/dev/null; then
    log "WARNING: Failed to create ${TARGET_DIR} (permission issue?). Will try app root instead."
    TARGET_DIR="/usr/src/app"
    # ensure app root exists
    mkdir -p "$TARGET_DIR" 2>/dev/null || true
  fi
else
  log "Found existing target dir: ${TARGET_DIR}"
fi

# Write runtime frontend config into chosen location
ENV_JS_PATH="${TARGET_DIR%/}/env-config.js"
log "Writing frontend runtime config to ${ENV_JS_PATH}"

# Use a here-doc with safe expansion: expand env variables
cat > "${ENV_JS_PATH}" <<EOF
window.__ENV__ = {
  HOST: "${HOST:-}",
  PORT: "${PORT:-}",
  QR_CODE_EXPIRY_IN_SECS: "${QR_CODE_EXPIRY_IN_SECS:-}",
  TOKEN_EXPIRY_IN_SECS: "${TOKEN_EXPIRY_IN_SECS:-}",
  GEMINI_API_KEY: "${GEMINI_API_KEY:-}"
};
EOF

# Ensure readable permissions for web server/user
chmod 644 "${ENV_JS_PATH}" || true

# Create .env for server-side dotenv usage
ENV_FILE_APP="/usr/src/app/.env"
log "Writing server .env to ${ENV_FILE_APP}"
cat > "${ENV_FILE_APP}" <<EOF
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-3000}

DB_CLIENT=${DB_CLIENT:-postgres}
DB_POOL_MIN=${DB_POOL_MIN:-3}
DB_POOL_MAX=${DB_POOL_MAX:-3000}
DB_TIMEOUT=${DB_TIMEOUT:-30000}

DB_HOST=${DB_HOST:-}
DB_USER=${DB_USER:-}
DB_PASSWORD=${DB_PASSWORD:-}
DB_DATABASE=${DB_DATABASE:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_SSL=${DB_SSL:-false}

REDIS_HOST=${REDIS_HOST:-}
REDIS_PORT=${REDIS_PORT:-6379}

QR_CODE_EXPIRY_IN_SECS=${QR_CODE_EXPIRY_IN_SECS:-180}
TOKEN_EXPIRY_IN_SECS=${TOKEN_EXPIRY_IN_SECS:-3600}

STROKES_KEY=${STROKES_KEY:-ROOM-STROKES_}
MESSAGES_KEY=${MESSAGES_KEY:-ROOM-MESSAGES_}
DEVICES_KEY=${DEVICES_KEY:-_TOKEN_DEVICES}

KEY_HEX=${KEY_HEX:-}
IV_HEX=${IV_HEX:-}
JWT_SECRET=${JWT_SECRET:-}

BACKUP_CRON_SCHEDULE=${BACKUP_CRON_SCHEDULE:-"0 * * * *"}

GEMINI_API_KEY=${GEMINI_API_KEY:-}
EOF

chmod 600 "${ENV_FILE_APP}" || true

log "entrypoint: finished writing runtime config. Exec'ing command -> $*"

# Exec the container's CMD (so signals propagate)
exec "$@"
