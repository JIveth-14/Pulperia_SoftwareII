/**
 * Cache Service
 * Provides a unified interface for caching operations.
 * Handles both Redis and fallback to in-memory if Redis is unavailable.
 */

import { getRedisClient, isRedisAvailable } from './redis';

const DEFAULT_TTL = 300; // 5 minutes
const inMemoryCache = new Map<string, { value: unknown; expiresAt: number }>();

/**
 * Get a value from cache
 */
export async function getCacheValue<T>(key: string): Promise<T | null> {
  // Check environment flag
  if (process.env.CACHE_ENABLED !== 'true') {
    return null;
  }

  try {
    // Try Redis first if available
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (redis) {
        const value = await redis.get(key);
        if (value) {
          try {
            return JSON.parse(value) as T;
          } catch {
            return null;
          }
        }
      }
    }

    // Fallback to in-memory cache
    const cached = inMemoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    // Remove expired entry
    if (cached) {
      inMemoryCache.delete(key);
    }

    return null;
  } catch (error) {
    console.error(`[Cache] Error getting value for key "${key}":`, error);
    return null;
  }
}

/**
 * Set a value in cache with TTL
 */
export async function setCacheValue<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  // Check environment flag
  if (process.env.CACHE_ENABLED !== 'true') {
    return;
  }

  try {
    // Serialize the value
    const serialized = JSON.stringify(value);

    // Try Redis first if available
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (redis) {
        await redis.setEx(key, ttl, serialized);
        return;
      }
    }

    // Fallback to in-memory cache
    inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  } catch (error) {
    console.error(`[Cache] Error setting value for key "${key}":`, error);
  }
}

/**
 * Delete a specific key from cache
 */
export async function deleteCacheKey(key: string): Promise<void> {
  try {
    // Try Redis first if available
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(key);
        return;
      }
    }

    // Fallback to in-memory cache
    inMemoryCache.delete(key);
  } catch (error) {
    console.error(`[Cache] Error deleting key "${key}":`, error);
  }
}

/**
 * Delete multiple keys from cache
 */
export async function deleteCacheKeys(keys: string[]): Promise<void> {
  try {
    // Try Redis first if available
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (redis) {
        if (keys.length > 0) {
          await redis.del(keys);
        }
        return;
      }
    }

    // Fallback to in-memory cache
    for (const key of keys) {
      inMemoryCache.delete(key);
    }
  } catch (error) {
    console.error('[Cache] Error deleting keys:', error);
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    // Try Redis first if available
    if (isRedisAvailable()) {
      const redis = await getRedisClient();
      if (redis) {
        await redis.flushDb();
        return;
      }
    }

    // Fallback to in-memory cache
    inMemoryCache.clear();
  } catch (error) {
    console.error('[Cache] Error clearing all cache:', error);
  }
}

/**
 * Get or set pattern: if key doesn't exist, call fetcher and cache the result
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check environment flag
  if (process.env.CACHE_ENABLED !== 'true') {
    // If cache is disabled, just fetch directly
    return fetcher();
  }

  try {
    // Try to get from cache
    const cached = await getCacheValue<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss: fetch the data
    const data = await fetcher();

    // Store in cache
    await setCacheValue(key, data, ttl);

    return data;
  } catch (error) {
    console.error(`[Cache] Error in getCacheOrFetch for key "${key}":`, error);
    // If there's an error, still try to fetch directly
    return fetcher();
  }
}

/**
 * Get TTL from environment variable or use default
 */
export function getCacheTTL(ttlKey: string, defaultTtl: number = DEFAULT_TTL): number {
  const envKey = `CACHE_TTL_${ttlKey.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    return !isNaN(parsed) ? parsed : defaultTtl;
  }
  return defaultTtl;
}
