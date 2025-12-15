const fp = require('fastify-plugin');
const { logger } = require('./logger');
const { generateCurlCommand } = require('../utils/curl-generator');
const CONFIG = require('../config');

async function requestLogger(fastify, options) {
    if (CONFIG.ENABLE_LOGS) {
        console.log("Logger enabled. Request logging active.");
    } else {
        console.log("Logger disabled. Request logging inactive.");
        return;
    }

    fastify.addHook('onRequest', async (request, reply) => {
        const curl = generateCurlCommand(request);
        logger.info({
            headers: request.headers,
            body: request.body,
            curl: curl
        }, 'Incoming Request');
    });

    fastify.addHook('onResponse', async (request, reply) => {
        request.log.info({
            statusCode: reply.statusCode,
            responseTime: reply.getResponseTime()
        }, 'Response Sent');
    });
}

module.exports = fp(requestLogger);
