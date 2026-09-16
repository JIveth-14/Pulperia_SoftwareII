/**
 * Cache Keys
 * Centralized cache key generation for all cached queries.
 * Using consistent naming patterns ensures we can invalidate related caches easily.
 *
 * Pattern: {resource}:{identifier}
 * Example: client:123, clients:list, products:by-stock
 */

export const CACHE_KEYS = {
  // Clientes
  CLIENTS_LIST: 'clients:list',
  CLIENTS_WITH_BALANCE: 'clients:with-balance',
  CLIENT: (id: number) => `client:${id}`,
  CLIENT_SEARCH: (query: string) => `client:search:${query.toLowerCase()}`,

  // Productos
  PRODUCTS_LIST: 'products:list',
  PRODUCT: (id: number) => `product:${id}`,
  PRODUCTS_LOW_STOCK: 'products:low-stock',
  PRODUCTS_BY_STOCK: 'products:by-stock',

  // Fiados
  FIADOS_LIST: 'fiados:list',
  FIADO: (id: number) => `fiado:${id}`,
  FIADOS_BY_CLIENT: (clientId: number) => `fiados:client:${clientId}`,
  FIADOS_PENDING: 'fiados:pending',
  FIADOS_PARTIAL: 'fiados:partial',

  // Pagos
  PAGOS_LIST: 'pagos:list',
  PAGO: (id: number) => `pago:${id}`,
  PAGOS_BY_FIADO: (fiado_id: number) => `pagos:fiado:${fiado_id}`,
  PAGOS_BY_CLIENT: (clientId: number) => `pagos:client:${clientId}`,

  // Ventas
  VENTAS_LIST: 'ventas:list',
  VENTA: (id: number) => `venta:${id}`,
  VENTAS_TODAY: 'ventas:today',
  VENTAS_BY_CLIENT: (clientId: number) => `ventas:client:${clientId}`,

  // Dashboard
  DASHBOARD_SUMMARY: 'dashboard:summary',
  DASHBOARD_STATS: 'dashboard:stats',
};

/**
 * Claves fijas que invalida cada tipo de mutación. Las claves que dependen de
 * un id (cliente, producto, fiado) las agrega `clavesAInvalidar()` en
 * `invalidation.ts`, que es el único punto que decide qué se borra.
 */
export const CACHE_INVALIDATION_PATTERNS = {
  // Cliente creado/actualizado/eliminado
  CLIENTE_MUTATION: [
    CACHE_KEYS.CLIENTS_LIST,
    CACHE_KEYS.CLIENTS_WITH_BALANCE,
    CACHE_KEYS.DASHBOARD_SUMMARY,
  ],

  // Producto creado/actualizado/eliminado
  PRODUCTO_MUTATION: [
    CACHE_KEYS.PRODUCTS_LIST,
    CACHE_KEYS.PRODUCTS_LOW_STOCK,
    CACHE_KEYS.PRODUCTS_BY_STOCK,
    CACHE_KEYS.DASHBOARD_SUMMARY,
  ],

  // Venta registrada (descuenta stock; si es fiado, crea deuda)
  VENTA_MUTATION: [
    CACHE_KEYS.VENTAS_LIST,
    CACHE_KEYS.VENTAS_TODAY,
    CACHE_KEYS.DASHBOARD_SUMMARY,
    CACHE_KEYS.DASHBOARD_STATS,
    CACHE_KEYS.PRODUCTS_LIST,
    CACHE_KEYS.PRODUCTS_LOW_STOCK,
    CACHE_KEYS.PRODUCTS_BY_STOCK,
  ],

  // Fiado creado
  FIADO_MUTATION: [
    CACHE_KEYS.FIADOS_LIST,
    CACHE_KEYS.FIADOS_PENDING,
    CACHE_KEYS.FIADOS_PARTIAL,
    CACHE_KEYS.CLIENTS_WITH_BALANCE,
    CACHE_KEYS.DASHBOARD_SUMMARY,
  ],

  // Pago registrado (cambia saldo y estado del fiado)
  PAGO_MUTATION: [
    CACHE_KEYS.PAGOS_LIST,
    CACHE_KEYS.FIADOS_LIST,
    CACHE_KEYS.FIADOS_PENDING,
    CACHE_KEYS.FIADOS_PARTIAL,
    CACHE_KEYS.CLIENTS_WITH_BALANCE,
    CACHE_KEYS.DASHBOARD_SUMMARY,
  ],
};

export type TipoMutacion = keyof typeof CACHE_INVALIDATION_PATTERNS;

/**
 * Helper function to invalidate all keys related to a pattern
 */
export function getInvalidationKeysForMutation(mutationType: TipoMutacion): string[] {
  return CACHE_INVALIDATION_PATTERNS[mutationType] || [];
}
