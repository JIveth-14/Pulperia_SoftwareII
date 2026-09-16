import { CachedPagoRepository, CachedProductoRepository, CachedVentaRepository } from '@/repositories/cached'
import { getCacheOrFetch } from '@/lib/cache/cacheService'
import { invalidar } from '@/lib/cache/invalidation'
import type { FiadoRepository, PagoRepository, ProductoRepository, VentaRepository } from '@/repositories'

jest.mock('@/lib/cache/cacheService', () => ({
  getCacheOrFetch: jest.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
  getCacheTTL: jest.fn((_k: string, d = 300) => d),
  deleteCacheKeys: jest.fn(),
}))
jest.mock('@/lib/cache/invalidation', () => ({ invalidar: jest.fn() }))
jest.mock('@/lib/cache/redis', () => ({}))

const mockGetCacheOrFetch = getCacheOrFetch as jest.Mock
const mockInvalidar = invalidar as jest.Mock

describe('repositorios con caché (Decorator)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lee a través de la caché con la clave de la entidad', async () => {
    const inner = { getById: jest.fn().mockResolvedValue({ id: 3 }) } as unknown as ProductoRepository
    const repo = new CachedProductoRepository(inner)

    await expect(repo.getById(3)).resolves.toEqual({ id: 3 })
    expect(mockGetCacheOrFetch).toHaveBeenCalledWith('product:3', expect.any(Function), expect.any(Number))
  })

  it('invalida después de escribir y no antes', async () => {
    const orden: string[] = []
    const inner = {
      update: jest.fn(async () => {
        orden.push('update')
        return { id: 3 }
      }),
    } as unknown as ProductoRepository
    mockInvalidar.mockImplementation(async () => orden.push('invalidar'))

    await new CachedProductoRepository(inner).update(3, { precio: 10 })

    expect(orden).toEqual(['update', 'invalidar'])
    expect(mockInvalidar).toHaveBeenCalledWith({ tipo: 'producto.actualizado', productoId: 3 })
  })

  it('no invalida si la escritura falla', async () => {
    const inner = { delete: jest.fn().mockRejectedValue(new Error('fk')) } as unknown as ProductoRepository

    await expect(new CachedProductoRepository(inner).delete(3)).rejects.toThrow('fk')
    expect(mockInvalidar).not.toHaveBeenCalled()
  })

  it('un pago invalida usando el cliente dueño del fiado', async () => {
    const inner = { create: jest.fn().mockResolvedValue({ id: 1 }) } as unknown as PagoRepository
    const fiados = { getById: jest.fn().mockResolvedValue({ id: 4, cliente_id: 9 }) } as unknown as FiadoRepository

    await new CachedPagoRepository(inner, fiados).create({ fiado_id: 4, monto_pagado: 50 })

    expect(mockInvalidar).toHaveBeenCalledWith({ tipo: 'pago.registrado', fiadoId: 4, clienteId: 9 })
  })

  it('una venta invalida cada producto una sola vez', async () => {
    const inner = { create: jest.fn().mockResolvedValue({ id: 1 }) } as unknown as VentaRepository

    await new CachedVentaRepository(inner).create(
      [
        { producto_id: 2, cantidad: 1 },
        { producto_id: 2, cantidad: 3 },
      ],
      5,
      'fiado'
    )

    expect(mockInvalidar).toHaveBeenCalledWith({ tipo: 'venta.registrada', productoIds: [2], clienteId: 5, fiado: true })
  })
})
