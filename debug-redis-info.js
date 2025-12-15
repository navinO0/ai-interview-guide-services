const Redis = require("ioredis");
require('dotenv').config();

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

redis.on('connect', () => {
    console.log('Connected to Redis');
    redis.info('replication', (err, result) => {
        if (err) {
            console.error('INFO Error:', err.message);
        } else {
            console.log('INFO Replication:', result);
        }
        redis.quit();
    });
});

redis.on('error', (err) => {
    console.error('Connection Error:', err.message);
    redis.quit();
});
