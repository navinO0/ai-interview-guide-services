const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Create a Pino logger with file transport
const logger = pino(
    {
        level: 'info', // Change to 'debug' if needed
        formatters: {
            bindings: (bindings) => ({ pid: bindings.pid, host: bindings.hostname }),
            level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        messageKey: 'message',
    },
    pino.destination(path.join(logDirectory, 'app.log')) // Store logs in 'logs/app.log'
);

/**
 * ✅ Custom log function with log type
 * @param {string} type - Type of log (e.g., 'CRON', 'REQUEST', 'DB', 'ERROR')
 * @param {string} message - Log message
 * @param {object} [meta={}] - Additional metadata
 */
const logWithType = (type, message, meta = {}) => {
    console.log("logger started")
    logger.info({ type, ...meta }, message);
};

module.exports = { logger, logWithType };
