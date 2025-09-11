'use strict'

const fs = require('fs');
const path = require('path');
require('make-promises-safe');
const fastify = require('fastify');
const { createServer } = require('http'); 
const helmet = require('@fastify/helmet');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const os = require('os');
const { ajvCompiler } = require('./core/schemas/index');
const { v4: uuid } = require('uuid');
const { knexClientCreate } = require('./core/knex_query_builder');
const { validateAccessToken } = require('./core/token_generate_validate');
const CONFIG = require('./core/config');
const { redisClientCreate } = require('./core/redis_config');
const fastifyCors = require("@fastify/cors");
const cronPlugin = require('./core/scheduler/scheduler');
const { logger } = require('./core/logger/logger')
const { AiModel } = require('./core/ai-config');


function getAllRoutes(filePath, routes = []) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach((file) => {
            if (file !== "node_modules") {
                const fullPath = path.join(filePath, file);
                if (!file.startsWith(".")) {
                    getAllRoutes(fullPath, routes);
                }
            }
        });
    } else if (stats.isFile() && path.basename(filePath) === "routes.js") {
        routes.push(filePath);
    }
    return routes;
}

const helmetConfig = {
    noCache: true,
    policy: 'same-origin',
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            imgSrc: ["'self'", 'data:'],
            scriptSrc: ["'self' 'unsafe-inline'"]
        }
    }
}

async function serverSetup(swaggerURL) {
    try {
        const app = fastify({
            logger: true,
            genReqId: req => req.headers['x-request-id'] || uuid(),
            disableRequestLogging: true,
            bodyLimit: 5000000,
        });
        app.decorate('host_name', os.hostname());
        app.decorate('CONFIG', CONFIG);
        app.register(require('@fastify/sensible'));
        app.register(require('@fastify/formbody'));
        app.register(fastifyCors, {
            origin: true,
            credentials: true,
        });
        app.decorate("AiModel", AiModel)
        app.register(helmet, helmetConfig);
        app.register(swagger, swaggerConfig(swaggerURL));
        app.register(swaggerUi, {
            routePrefix: swaggerURL + 'swagger/public/documentation',
        });
        app.addHook('onRequest', async (request, reply) => {
            request.log.info({
                method: request.method,
                url: request.url,
                headers: request.headers, 
                body: request.body
            }, 'Incoming Request');
        });

        app.addHook('onResponse', async (request, reply) => {
            request.log.info({
                statusCode: reply.statusCode,
                responseTime: reply.getResponseTime()
            }, 'Response Sent');
        });

        // Redis & Database Setup
        await redisClientCreate(app, CONFIG.REDIS, 'redis');
        await knexClientCreate(app, CONFIG.APP_DB_CONFIG, 'knex');

        const httpServer = createServer(app.server);

        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken({ request }, reply, app);
        });

        await app.register(cronPlugin);
        
        await ajvCompiler(app, {});
        

        return app  ;
    } catch (err) {
        logger.error(err, "Server setup error");
    }
};

const swaggerConfig = (url) => {
    url = url || 'http://localhost:3007';
    return {
        routePrefix: url + 'swagger/public/documentation',
        swagger: {
            info: {
                title: 'Swagger',
                description: 'Swagger for the project',
                version: '1.0.0'
            },
            schemes: ['http', 'https'],
            rbac: ['*'],
            consumes: [
                'application/json',
                'application/x-www-form-urlencoded',
                'application/xml',
                'text/xml'
            ],
            produces: [
                'application/json',
                'application/javascript',
                'application/xml',
                'text/xml',
                'text/javascript'
            ],
            securityDefinitions: {
                ApiToken: {
                    description: 'Authorization header token, sample: "Bearer #TOKEN#"',
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header'
                },
                StaticToken: {
                    description: 'Add the Static token : "Static Token"',
                    type: 'apiKey',
                    name: 'qp-tc-request-id',
                    in: 'header'
                }
            }
        },
        exposeRoute: true
    };
};

process.on('uncaughtException', (err) => {
    logger.error(err, "UNCAUGHT_EXCEPTION");
    setTimeout(() => {
        process.exit(1);
    })
});

module.exports = { getAllRoutes, serverSetup, logger };
