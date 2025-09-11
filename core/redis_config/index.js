'use strict';

const { redisInitialise } = require('./redis_client'); // Ensure correct import

async function redisClientCreate(app, config, key = 'redis') {
  try {
    const redis = await redisInitialise(config);
    app.decorate(key, redis); 
  } catch (e) {
    console.error('Redis connection failed:', e);
    setTimeout(() => process.exit(1), 1000);
    throw new Error(`Connection Failed: ${e.message}`);
  }
}

module.exports = {
  redisClientCreate
};