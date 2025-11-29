#!/bin/sh
set -eu

# Optional env file path mounted into container (from Jenkins)
ENV_FILE_PATH="${ENV_FILE_PATH:-/etc/app/.env}"

# Normalize line endings if file is mounted
if [ -f "$ENV_FILE_PATH" ]; then
  if command -v dos2unix >/dev/null 2>&1; then
    dos2unix "$ENV_FILE_PATH" || true
  fi
fi

# Write runtime frontend config (adjust keys as your frontend expects)
cat > /usr/src/app/public/env-config.js <<'EOF'
window.__ENV__ = {
  HOST: "${HOST:-}",
  PORT: "${PORT:-}",
  QR_CODE_EXPIRY_IN_SECS: "${QR_CODE_EXPIRY_IN_SECS:-}",
  TOKEN_EXPIRY_IN_SECS: "${TOKEN_EXPIRY_IN_SECS:-}",
  GEMINI_API_KEY: "${GEMINI_API_KEY:-}"
};
EOF

# Create .env for server-side dotenv usage
cat > /usr/src/app/.env <<EOF
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

# Set permissions
chmod 600 /usr/src/app/.env || true
chmod 644 /usr/src/app/public/env-config.js || true

# Exec the container's CMD
exec "$@"
