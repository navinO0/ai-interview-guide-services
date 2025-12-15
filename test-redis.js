const Redis = require("ioredis");
require('dotenv').config();

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

redis.on('connect', () => {
    console.log('Connected to Redis');
    redis.set('test_key', 'test_value', (err, result) => {
        if (err) {
            console.error('SET Error:', err.message);
        } else {
            console.log('SET Success:', result);
        }
        redis.quit();
    });
});

redis.on('error', (err) => {
    console.error('Connection Error:', err.message);
    redis.quit();
});
