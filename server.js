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
// const { validateAccessToken } = require('./core/token_generate_validate'); // Deprecated, using submodule
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
        app.register(require('./core/logger/request-logger'));

        app.setErrorHandler((error, request, reply) => {
            request.log.error(error);
            const statusCode = error.statusCode || 500;
            reply.status(statusCode).send({
                statusCode,
                error: error.name || 'Internal Server Error',
                message: error.message
            });
        });

        await redisClientCreate(app, CONFIG.REDIS, 'redis');
        await knexClientCreate(app, CONFIG.APP_DB_CONFIG, 'knex');

        // Initialize the submodule's redis client with the main app's redis instance
        const { initializeRedis } = require('./user-management-services/utils/redisClient');
        await initializeRedis(app.redis);

        // User Management Service is now a separate process. 
        // We only keep the shared redis/token logic here for validation.


        const httpServer = createServer(app.server);

        const { validateAccessToken } = require('./user-management-services/utils/tokenGenerator');
        
        // Map main config to submodule config structure for token operations
        const authConfig = {
            JWT_SECRET: CONFIG.SECURITY_KEYS.JWT_SECRET,
            TOKEN_EXPIRY: CONFIG.REDIS.TOKEN_EXPIRY_IN_SECS,
            DEVICES_KEY: CONFIG.REDIS.DEVICES_KEY
        };

        app.addHook('onRequest', async (request, reply) => {
            return await validateAccessToken(request, reply, app, authConfig);
        });

        await app.register(cronPlugin);
        
        await ajvCompiler(app, {});
        

        // Graceful shutdown
        const closeGracefully = async (signal) => {
            app.log.info(`Received signal to terminate: ${signal}`);
            await app.close();
            // process.exit(0); // fastify.close() handles unlistening
        };
        process.on('SIGINT', () => closeGracefully('SIGINT'));
        process.on('SIGTERM', () => closeGracefully('SIGTERM'));

        await ajvCompiler(app, {});
        
        app.ready(() => {
            console.log(app.printRoutes());
        });

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
