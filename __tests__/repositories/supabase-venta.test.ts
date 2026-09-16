import { SupabaseVentaRepository } from '@/repositories/supabase/SupabaseVentaRepository'
import { StockInsuficienteError } from '@/domain/errors'

/** Query builder encadenable que resuelve con `resultado` al hacer await. */
function consulta(resultado: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'insert', 'update', 'eq', 'in', 'order', 'single']) {
    builder[m] = jest.fn(() => builder)
  }
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resultado).then(resolve)
  return builder
}

describe('SupabaseVentaRepository.create', () => {
  const lineas = [{ producto_id: 1, cantidad: 2 }]

  it('registra la venta en una transacción con el RPC crear_venta', async () => {
    const venta = { id: 10, total: 36, tipo_pago: 'contado' }
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: [{ venta_id: 10, total: 36 }], error: null }),
      from: jest.fn(() => consulta({ data: venta, error: null })),
    }

    const repo = new SupabaseVentaRepository(supabase as never)
    await expect(repo.create(lineas, undefined, 'contado')).resolves.toEqual(venta)

    expect(supabase.rpc).toHaveBeenCalledWith('crear_venta', {
      p_lineas: lineas,
      p_cliente_id: null,
      p_tipo_pago: 'contado',
    })
    // No inserta cabecera ni líneas por separado.
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('traduce el error de stock del RPC a un error de dominio', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'Stock insuficiente para producto 1 (disponible: 1, solicitado: 2)' },
      }),
      from: jest.fn(),
    }

    await expect(new SupabaseVentaRepository(supabase as never).create(lineas)).rejects.toBeInstanceOf(
      StockInsuficienteError
    )
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('usa la inserción paso a paso si el RPC no está instalado', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const tablas: string[] = []
    const respuestas: Record<string, { data: unknown; error: null }[]> = {
      productos: [{ data: [{ id: 1, precio: 18 }], error: null }],
      ventas: [
        { data: { id: 11, total: 0 }, error: null },
        { data: { id: 11, total: 36 }, error: null },
      ],
      detalle_venta: [{ data: null, error: null }],
      fiados: [{ data: null, error: null }],
    }
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'function not found' } }),
      from: jest.fn((tabla: string) => {
        tablas.push(tabla)
        return consulta(respuestas[tabla].shift()!)
      }),
    }

    const venta = await new SupabaseVentaRepository(supabase as never).create(lineas, 4, 'fiado')

    expect(venta).toEqual({ id: 11, total: 36 })
    expect(tablas).toEqual(['productos', 'ventas', 'detalle_venta', 'ventas', 'fiados'])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
