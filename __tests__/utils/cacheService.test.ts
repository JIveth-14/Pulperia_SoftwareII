import {
  clearAllCache,
  deleteCacheKey,
  deleteCacheKeys,
  getCacheOrFetch,
  getCacheTTL,
  getCacheValue,
  setCacheValue,
} from '@/lib/cache/cacheService'
import { getRedisClient, isRedisAvailable } from '@/lib/cache/redis'

jest.mock('@/lib/cache/redis', () => ({
  getRedisClient: jest.fn(),
  isRedisAvailable: jest.fn(),
}))

const mockGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>
const mockIsRedisAvailable = isRedisAvailable as jest.MockedFunction<typeof isRedisAvailable>

describe('cacheService', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useRealTimers()
    process.env.CACHE_ENABLED = 'true'
    delete process.env.CACHE_TTL_CLIENTS
    mockIsRedisAvailable.mockReturnValue(false)
    mockGetRedisClient.mockResolvedValue(null)
    await clearAllCache()
  })

  afterEach(async () => {
    mockIsRedisAvailable.mockReturnValue(false)
    await clearAllCache()
    delete process.env.CACHE_ENABLED
    delete process.env.CACHE_TTL_CLIENTS
    jest.useRealTimers()
  })

  it('returns null immediately when cache is disabled', async () => {
    // Arrange
    process.env.CACHE_ENABLED = 'false'

    // Act
    const result = await getCacheValue('clients:list')

    // Assert
    expect(result).toBeNull()
  })

  it('stores and reads values from the in-memory cache', async () => {
    // Arrange
    const payload = { total: 3 }

    // Act
    await setCacheValue('dashboard:summary', payload, 60)
    const result = await getCacheValue<typeof payload>('dashboard:summary')

    // Assert
    expect(result).toEqual(payload)
  })

  it('expires in-memory entries after their ttl', async () => {
    // Arrange
    jest.useFakeTimers()
    await setCacheValue('ventas:today', { total: 10 }, 1)

    // Act
    jest.advanceTimersByTime(1001)
    const result = await getCacheValue('ventas:today')

    // Assert
    expect(result).toBeNull()
  })

  it('reads and parses values from redis when available', async () => {
    // Arrange
    const redis = {
      get: jest.fn().mockResolvedValue(JSON.stringify({ id: 1 })),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    const result = await getCacheValue<{ id: number }>('client:1')

    // Assert
    expect(redis.get).toHaveBeenCalledWith('client:1')
    expect(result).toEqual({ id: 1 })
  })

  it('returns null when redis returns invalid json', async () => {
    // Arrange
    const redis = {
      get: jest.fn().mockResolvedValue('not-json'),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    const result = await getCacheValue('client:2')

    // Assert
    expect(result).toBeNull()
  })

  it('writes to redis when a client is available', async () => {
    // Arrange
    const redis = {
      setEx: jest.fn().mockResolvedValue(undefined),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    await setCacheValue('fiados:list', ['a'], 120)

    // Assert
    expect(redis.setEx).toHaveBeenCalledWith('fiados:list', 120, JSON.stringify(['a']))
  })

  it('deletes a single in-memory key', async () => {
    // Arrange
    await setCacheValue('pago:1', { amount: 50 }, 60)

    // Act
    await deleteCacheKey('pago:1')

    // Assert
    await expect(getCacheValue('pago:1')).resolves.toBeNull()
  })

  it('delegates single-key deletion to redis when available', async () => {
    // Arrange
    const redis = {
      del: jest.fn().mockResolvedValue(1),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    await deleteCacheKey('venta:4')

    // Assert
    expect(redis.del).toHaveBeenCalledWith('venta:4')
  })

  it('deletes multiple keys from the in-memory cache', async () => {
    // Arrange
    await setCacheValue('client:1', { id: 1 }, 60)
    await setCacheValue('client:2', { id: 2 }, 60)

    // Act
    await deleteCacheKeys(['client:1', 'client:2'])

    // Assert
    await expect(getCacheValue('client:1')).resolves.toBeNull()
    await expect(getCacheValue('client:2')).resolves.toBeNull()
  })

  it('delegates multi-key deletion to redis when keys are provided', async () => {
    // Arrange
    const redis = {
      del: jest.fn().mockResolvedValue(2),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    await deleteCacheKeys(['a', 'b'])

    // Assert
    expect(redis.del).toHaveBeenCalledWith(['a', 'b'])
  })

  it('clears the in-memory cache', async () => {
    // Arrange
    await setCacheValue('product:1', { id: 1 }, 60)

    // Act
    await clearAllCache()

    // Assert
    await expect(getCacheValue('product:1')).resolves.toBeNull()
  })

  it('flushes redis when available', async () => {
    // Arrange
    const redis = {
      flushDb: jest.fn().mockResolvedValue('OK'),
    }
    mockIsRedisAvailable.mockReturnValue(true)
    mockGetRedisClient.mockResolvedValue(redis as any)

    // Act
    await clearAllCache()

    // Assert
    expect(redis.flushDb).toHaveBeenCalled()
  })

  it('returns cached data without calling the fetcher', async () => {
    // Arrange
    const fetcher = jest.fn().mockResolvedValue({ total: 10 })
    await setCacheValue('summary', { total: 5 }, 60)

    // Act
    const result = await getCacheOrFetch('summary', fetcher)

    // Assert
    expect(result).toEqual({ total: 5 })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches and caches data on a cache miss', async () => {
    // Arrange
    const fetcher = jest.fn().mockResolvedValue({ total: 22 })

    // Act
    const result = await getCacheOrFetch('missed-key', fetcher, 30)

    // Assert
    expect(result).toEqual({ total: 22 })
    await expect(getCacheValue('missed-key')).resolves.toEqual({ total: 22 })
  })

  it('bypasses cache lookup when caching is disabled', async () => {
    // Arrange
    process.env.CACHE_ENABLED = 'false'
    const fetcher = jest.fn().mockResolvedValue({ total: 7 })

    // Act
    const result = await getCacheOrFetch('disabled-key', fetcher)

    // Assert
    expect(result).toEqual({ total: 7 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('reads ttl overrides from the environment and falls back on invalid values', () => {
    // Arrange
    process.env.CACHE_TTL_CLIENTS = '900'
    const overridden = getCacheTTL('clients')
    process.env.CACHE_TTL_CLIENTS = 'invalid'

    // Act
    const fallback = getCacheTTL('clients', 45)

    // Assert
    expect(overridden).toBe(900)
    expect(fallback).toBe(45)
  })
})
