import { RegistrarVenta } from '@/services'
import { NoEncontradoError, StockInsuficienteError } from '@/domain/errors'
import type { Repositories } from '@/repositories/container'

function crear(overrides: Partial<Record<'ventas' | 'productos' | 'clientes', object>> = {}) {
  const repos = {
    ventas: { create: jest.fn().mockResolvedValue({ id: 1, total: 36 }) },
    productos: { getById: jest.fn().mockResolvedValue({ id: 3, nombre: 'Arroz 1lb' }) },
    clientes: { getById: jest.fn().mockResolvedValue({ id: 5, nombre: 'María' }) },
    ...overrides,
  }
  return { repos, caso: new RegistrarVenta(repos as unknown as Repositories) }
}

describe('RegistrarVenta (Command)', () => {
  it('agrupa líneas repetidas y registra una venta de contado', async () => {
    const { repos, caso } = crear()

    const resultado = await caso.ejecutar({
      tipoPago: 'contado',
      lineas: [
        { producto_id: '3', cantidad: '1' },
        { producto_id: 3, cantidad: 2 },
        { producto_id: 4, cantidad: 1 },
      ],
    })

    expect(resultado).toEqual({ ok: true, data: { id: 1, total: 36 } })
    expect(repos.ventas.create).toHaveBeenCalledWith(
      [
        { producto_id: 3, cantidad: 3 },
        { producto_id: 4, cantidad: 1 },
      ],
      undefined,
      'contado'
    )
    expect(repos.clientes.getById).not.toHaveBeenCalled()
  })

  it('exige cliente en ventas al crédito', async () => {
    const { repos, caso } = crear()

    const resultado = await caso.ejecutar({ tipoPago: 'fiado', lineas: [{ producto_id: 1, cantidad: 1 }] })

    expect(resultado).toMatchObject({
      ok: false,
      error: { codigo: 'VALIDACION' },
      campos: { clienteId: 'Una venta al crédito necesita un cliente' },
    })
    expect(repos.ventas.create).not.toHaveBeenCalled()
  })

  it('rechaza ventas vacías, cantidades inválidas y tipos de pago desconocidos', async () => {
    const { caso } = crear()

    await expect(caso.ejecutar({ tipoPago: 'contado', lineas: [] })).resolves.toMatchObject({
      campos: { lineas: 'Agrega al menos un producto' },
    })
    await expect(
      caso.ejecutar({ tipoPago: 'contado', lineas: [{ producto_id: 1, cantidad: 1.5 }] })
    ).resolves.toMatchObject({ campos: { lineas: expect.stringContaining('entera') } })
    await expect(
      caso.ejecutar({ tipoPago: 'tarjeta', lineas: [{ producto_id: 1, cantidad: 1 }] })
    ).resolves.toMatchObject({ campos: { tipoPago: 'Selecciona contado o fiado' } })
  })

  it('verifica que el cliente exista', async () => {
    const { caso } = crear({
      clientes: { getById: jest.fn().mockRejectedValue(new NoEncontradoError('Cliente', 99)) },
    })

    await expect(
      caso.ejecutar({ tipoPago: 'fiado', clienteId: 99, lineas: [{ producto_id: 1, cantidad: 1 }] })
    ).resolves.toEqual({ ok: false, error: { codigo: 'NO_ENCONTRADO', mensaje: 'Cliente #99 no existe' } })
  })

  it('muestra el nombre del producto cuando no alcanza el stock', async () => {
    const { caso } = crear({
      ventas: {
        create: jest
          .fn()
          .mockRejectedValue(
            new StockInsuficienteError('Stock insuficiente para producto 3 (disponible: 2, solicitado: 5)')
          ),
      },
    })

    await expect(
      caso.ejecutar({ tipoPago: 'contado', lineas: [{ producto_id: 3, cantidad: 5 }] })
    ).resolves.toEqual({
      ok: false,
      error: { codigo: 'STOCK_INSUFICIENTE', mensaje: 'Stock insuficiente para "Arroz 1lb" (disponible: 2)' },
    })
  })
})
