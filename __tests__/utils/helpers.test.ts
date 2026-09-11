import {
  CACHE_INVALIDATION_PATTERNS,
  CACHE_KEYS,
  getInvalidationKeysForMutation,
} from '@/lib/cache/cacheKeys'

describe('cache key helpers', () => {
  it('returns static keys for list views', () => {
    expect(CACHE_KEYS.CLIENTS_LIST).toBe('clients:list')
    expect(CACHE_KEYS.PRODUCTS_LIST).toBe('products:list')
    expect(CACHE_KEYS.FIADOS_LIST).toBe('fiados:list')
    expect(CACHE_KEYS.PAGOS_LIST).toBe('pagos:list')
    expect(CACHE_KEYS.VENTAS_LIST).toBe('ventas:list')
  })

  it('builds entity keys with ids', () => {
    expect(CACHE_KEYS.CLIENT(7)).toBe('client:7')
    expect(CACHE_KEYS.PRODUCT(3)).toBe('product:3')
    expect(CACHE_KEYS.FIADO(11)).toBe('fiado:11')
    expect(CACHE_KEYS.PAGO(5)).toBe('pago:5')
    expect(CACHE_KEYS.VENTA(9)).toBe('venta:9')
  })

  it('normalizes search queries to lowercase', () => {
    expect(CACHE_KEYS.CLIENT_SEARCH('MarIA')).toBe('client:search:maria')
  })

  it('builds relation keys for client and fiado lookups', () => {
    expect(CACHE_KEYS.FIADOS_BY_CLIENT(4)).toBe('fiados:client:4')
    expect(CACHE_KEYS.PAGOS_BY_FIADO(8)).toBe('pagos:fiado:8')
    expect(CACHE_KEYS.VENTAS_BY_CLIENT(12)).toBe('ventas:client:12')
  })

  it('exposes dashboard and stock summary keys', () => {
    expect(CACHE_KEYS.PRODUCTS_LOW_STOCK).toBe('products:low-stock')
    expect(CACHE_KEYS.PRODUCTS_BY_STOCK).toBe('products:by-stock')
    expect(CACHE_KEYS.VENTAS_TODAY).toBe('ventas:today')
    expect(CACHE_KEYS.DASHBOARD_SUMMARY).toBe('dashboard:summary')
    expect(CACHE_KEYS.DASHBOARD_STATS).toBe('dashboard:stats')
  })

  it('keeps cliente mutations tied to related client and dashboard caches', () => {
    expect(CACHE_INVALIDATION_PATTERNS.CLIENTE_MUTATION).toEqual([
      'clients:list',
      'clients:with-balance',
      'dashboard:summary',
    ])
  })

  it('includes product stock caches in producto mutation invalidation', () => {
    expect(CACHE_INVALIDATION_PATTERNS.PRODUCTO_MUTATION).toEqual(
      expect.arrayContaining([
        'products:list',
        'products:low-stock',
        'products:by-stock',
        'dashboard:summary',
      ])
    )
  })

  it('includes related dashboard and product caches for ventas', () => {
    expect(CACHE_INVALIDATION_PATTERNS.VENTA_MUTATION).toEqual(
      expect.arrayContaining([
        'ventas:list',
        'ventas:today',
        'dashboard:summary',
        'dashboard:stats',
        'products:list',
        'products:low-stock',
      ])
    )
  })

  it('includes client balance caches for fiado and pago mutations', () => {
    expect(CACHE_INVALIDATION_PATTERNS.FIADO_MUTATION).toEqual(
      expect.arrayContaining([
        'fiados:list',
        'fiados:pending',
        'clients:with-balance',
        'dashboard:summary',
      ])
    )

    expect(CACHE_INVALIDATION_PATTERNS.PAGO_MUTATION).toEqual(
      expect.arrayContaining([
        'pagos:list',
        'fiados:list',
        'fiados:pending',
        'fiados:partial',
        'clients:with-balance',
        'dashboard:summary',
      ])
    )
  })

  it('returns invalidation keys for known mutations', () => {
    expect(getInvalidationKeysForMutation('CLIENTE_MUTATION')).toBe(
      CACHE_INVALIDATION_PATTERNS.CLIENTE_MUTATION
    )
  })

  it('returns an empty list for unknown mutations', () => {
    expect(getInvalidationKeysForMutation('UNKNOWN_MUTATION' as never)).toEqual([])
  })
})
