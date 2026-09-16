import { clavesAInvalidar } from '@/lib/cache/invalidation'
import { CACHE_KEYS } from '@/lib/cache/cacheKeys'

describe('invalidación de caché por evento (Mediator)', () => {
  it('un pago limpia saldo del cliente, su fiado y sus historiales', () => {
    const claves = clavesAInvalidar({ tipo: 'pago.registrado', fiadoId: 4, clienteId: 9 })

    expect(claves).toEqual(
      expect.arrayContaining([
        CACHE_KEYS.CLIENTS_WITH_BALANCE,
        CACHE_KEYS.FIADO(4),
        CACHE_KEYS.PAGOS_BY_FIADO(4),
        CACHE_KEYS.FIADOS_BY_CLIENT(9),
        CACHE_KEYS.PAGOS_BY_CLIENT(9),
        CACHE_KEYS.DASHBOARD_SUMMARY,
      ])
    )
  })

  it('una venta limpia el stock de cada producto vendido', () => {
    const claves = clavesAInvalidar({ tipo: 'venta.registrada', productoIds: [1, 2], fiado: false })

    expect(claves).toEqual(
      expect.arrayContaining([CACHE_KEYS.PRODUCT(1), CACHE_KEYS.PRODUCT(2), CACHE_KEYS.VENTAS_TODAY])
    )
    expect(claves).not.toContain(CACHE_KEYS.CLIENTS_WITH_BALANCE)
  })

  it('una venta al crédito también limpia las deudas del cliente', () => {
    const claves = clavesAInvalidar({ tipo: 'venta.registrada', productoIds: [1], clienteId: 3, fiado: true })

    expect(claves).toEqual(
      expect.arrayContaining([
        CACHE_KEYS.CLIENTS_WITH_BALANCE,
        CACHE_KEYS.FIADOS_BY_CLIENT(3),
        CACHE_KEYS.VENTAS_BY_CLIENT(3),
      ])
    )
  })

  it('actualizar un cliente limpia su ficha pero crear uno no necesita id', () => {
    expect(clavesAInvalidar({ tipo: 'cliente.actualizado', clienteId: 5 })).toContain(CACHE_KEYS.CLIENT(5))
    expect(clavesAInvalidar({ tipo: 'cliente.creado' })).toEqual(
      expect.arrayContaining([CACHE_KEYS.CLIENTS_LIST, CACHE_KEYS.CLIENTS_WITH_BALANCE])
    )
  })

  it('no repite claves', () => {
    const claves = clavesAInvalidar({ tipo: 'venta.registrada', productoIds: [1], clienteId: 3, fiado: true })
    expect(new Set(claves).size).toBe(claves.length)
  })
})
