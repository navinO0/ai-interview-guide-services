# Use official Node LTS as the base image
FROM node:23-alpine

# Create app directory
WORKDIR /usr/src/app

# Non-secret default config (SAFE)
ENV HOST=0.0.0.0 \
    PORT=3000 \
    DB_CLIENT=postgres \
    DB_POOL_MIN=3 \
    DB_POOL_MAX=3000 \
    DB_TIMEOUT=30000 \
    DB_PORT=5432 \
    REDIS_PORT=6379 \
    QR_CODE_EXPIRY_IN_SECS=180 \
    TOKEN_EXPIRY_IN_SECS=3600 \
    STROKES_KEY="ROOM-STROKES_" \
    MESSAGES_KEY="ROOM-MESSAGES_" \
    DEVICES_KEY="_TOKEN_DEVICES" \
    BACKUP_CRON_SCHEDULE="0 * * * *"

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source (includes entrypoint.sh)
COPY . .

# Copy entrypoint and make executable (entrypoint will generate runtime config)
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Use entrypoint to generate runtime config, then execute the CMD
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Expose port
EXPOSE 3000

# Start the app (adjust if your app's main is different)
CMD ["node", "main.js"]
