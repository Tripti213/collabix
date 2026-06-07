const { createClient } = require('redis');

let client = null;
let isConnected = false;

async function connectRedis() {
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.log('Redis: max retries reached, running without cache');
            return false;
          }
          return Math.min(retries * 500, 3000);
        }
      }
    });

    client.on('connect', () => {
      isConnected = true;
      console.log('Redis connected');
    });

    client.on('error', (err) => {
      isConnected = false;
      console.warn('Redis error (app continues without cache):', err.message);
    });

    client.on('end', () => {
      isConnected = false;
      console.log('Redis disconnected');
    });

    await client.connect();
  } catch (err) {
    console.warn('Redis not available, running without cache:', err.message);
    isConnected = false;
  }
}

// Safe get — returns null if Redis is down
async function get(key) {
  if (!isConnected || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Redis GET error:', err.message);
    return null;
  }
}

// Safe set with TTL in seconds
async function set(key, value, ttlSeconds = 300) {
  if (!isConnected || !client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('Redis SET error:', err.message);
  }
}

// Safe delete — supports patterns with *
async function del(key) {
  if (!isConnected || !client) return;
  try {
    if (key.includes('*')) {
      const keys = await client.keys(key);
      if (keys.length > 0) await client.del(keys);
    } else {
      await client.del(key);
    }
  } catch (err) {
    console.warn('Redis DEL error:', err.message);
  }
}

// Increment a counter (for rate limiting etc)
async function incr(key, ttlSeconds = 60) {
  if (!isConnected || !client) return 0;
  try {
    const val = await client.incr(key);
    if (val === 1) await client.expire(key, ttlSeconds);
    return val;
  } catch (err) {
    return 0;
  }
}

// Add to blacklist (for logout / token invalidation)
async function blacklistToken(token, ttlSeconds = 604800) { // 7 days
  if (!isConnected || !client) return;
  try {
    await client.setEx(`blacklist:${token}`, ttlSeconds, '1');
  } catch (err) {
    console.warn('Redis blacklist error:', err.message);
  }
}

async function isTokenBlacklisted(token) {
  if (!isConnected || !client) return false;
  try {
    const val = await client.get(`blacklist:${token}`);
    return val === '1';
  } catch (err) {
    return false;
  }
}

function getClient() { return client; }
function getIsConnected() { return isConnected; }

module.exports = { connectRedis, get, set, del, incr, blacklistToken, isTokenBlacklisted, getClient, getIsConnected };