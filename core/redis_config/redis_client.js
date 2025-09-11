const Redis = require("ioredis");
const CONFIG = require('../config')



const redisClient = new Redis(CONFIG.REDIS);

async function redisInitialise(config) {
  const redis = new Redis(config);
  
  redis.on('connect', () => {
    console.log('Connected to Redis successfully');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  return redis;
}

async function getCacheValue(key) {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    cosole.log("Redis Get Error:", error);
    return null;
  }
}

async function setCacheValue(key, value, expiry = 3600) {
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", expiry);
    return "success";
  } catch (error) {
    console.log("Redis Set Error:", error);
    return "error";
  }
}

async function deleteCacheValue(key) {
  try {
    await redisClient.del(key);
    return "success";
  } catch (error) {
    cosole.log("Redis Delete Error:", error);
    return "error";
  }
}

async function flushCache() {
  try {
    await redisClient.flushdb();
    return "Cache cleared";
  } catch (error) {
    cosole.log("Redis Flush Error:", error);
    return "error";
  }
}

async function getKeysByPattern(pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    return keys;
  } catch (error) {
    cosole.log("Redis Get Keys Error:", error);
    return [];
  }
}

module.exports = { redisClient, getCacheValue, setCacheValue, deleteCacheValue, flushCache, redisInitialise, getKeysByPattern };
