/**
 * Redis Client
 * Singleton instance of the Redis client for caching.
 * Automatically handles connection/disconnection and fallback if unavailable.
 */

import { createClient } from 'redis';

type RedisClientType = ReturnType<typeof createClient>;

let redisClient: RedisClientType | null = null;
let isConnected = false;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

export async function getRedisClient(): Promise<RedisClientType | null> {
  // If already connected, return it
  if (isConnected && redisClient) {
    return redisClient;
  }

  // If currently connecting, wait for it to finish
  if (isConnecting) {
    let waitAttempts = 0;
    while (isConnecting && waitAttempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      waitAttempts++;
    }
    return isConnected ? redisClient : null;
  }

  // If we've exceeded max connection attempts, don't try again
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    return null;
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('[Cache] REDIS_URL not configured. Cache is disabled.');
      isConnecting = false;
      return null;
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis connected');
      isConnected = true;
    });

    redisClient.on('disconnect', () => {
      console.warn('[Cache] Redis disconnected');
      isConnected = false;
    });

    await redisClient.connect();
    isConnected = true;
  } catch (error) {
    console.error('[Cache] Failed to connect to Redis:', error instanceof Error ? error.message : String(error));
    redisClient = null;
    isConnected = false;
  } finally {
    isConnecting = false;
  }

  return isConnected ? redisClient : null;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && isConnected) {
    try {
      await redisClient.quit();
      isConnected = false;
      redisClient = null;
    } catch (error) {
      console.error('[Cache] Error disconnecting from Redis:', error);
    }
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return isConnected && redisClient !== null;
}
