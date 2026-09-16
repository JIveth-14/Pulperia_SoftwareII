/**
 * @jest-environment node
 */
import { actualizarProducto, crearProducto, eliminarProducto } from '@/actions/productos'
import { actualizarCliente, registrarFiado, registrarPago } from '@/actions/clientes'
import { getRepositories } from '@/repositories/container'
import { ReglaNegocioError } from '@/domain/errors'

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  }),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/supabase/server-utils', () => ({ exigirSesion: jest.fn() }))
jest.mock('@/repositories/container', () => ({ getRepositories: jest.fn() }))

const mockRepos = getRepositories as jest.Mock
const form = (datos: Record<string, string>) => {
  const f = new FormData()
  Object.entries(datos).forEach(([k, v]) => f.set(k, v))
  return f
}
const PRODUCTO = { nombre: 'Arroz 1lb', precio: '15', stock: '20', stock_minimo: '5' }

describe('acciones de productos', () => {
  beforeEach(() => jest.clearAllMocks())

  it('crear: errores por campo o redirección a la lista', async () => {
    const productos = { create: jest.fn().mockResolvedValue({ id: 3 }) }
    mockRepos.mockResolvedValue({ productos })

    await expect(crearProducto({}, form({ ...PRODUCTO, precio: '-1' }))).resolves.toMatchObject({
      campos: { precio: expect.any(String) },
      valores: { precio: '-1' },
    })
    await expect(crearProducto({}, form(PRODUCTO))).rejects.toThrow('NEXT_REDIRECT:/productos?exito=producto-creado')
  })

  it('actualizar: usa el id enlazado', async () => {
    const productos = { update: jest.fn().mockResolvedValue({ id: 3 }) }
    mockRepos.mockResolvedValue({ productos })

    await expect(actualizarProducto(3, {}, form(PRODUCTO))).rejects.toThrow('exito=producto-actualizado')
    expect(productos.update).toHaveBeenCalledWith(3, { nombre: 'Arroz 1lb', precio: 15, stock: 20, stock_minimo: 5 })

    await expect(actualizarProducto(3, {}, form({ ...PRODUCTO, stock: 'x' }))).resolves.toMatchObject({
      campos: { stock: expect.any(String) },
    })
  })

  it('eliminar: explica el bloqueo o redirige', async () => {
    const productos = {
      delete: jest
        .fn()
        .mockRejectedValueOnce(new ReglaNegocioError('No se puede modificar: producto tiene registros asociados'))
        .mockResolvedValueOnce(undefined),
    }
    mockRepos.mockResolvedValue({ productos })

    await expect(eliminarProducto(3)).resolves.toMatchObject({ error: expect.stringContaining('ventas registradas') })
    await expect(eliminarProducto(3)).rejects.toThrow('exito=producto-eliminado')
  })
})

describe('acciones de clientes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('actualizar cliente', async () => {
    const clientes = { update: jest.fn().mockResolvedValue({ id: 4 }) }
    mockRepos.mockResolvedValue({ clientes })

    await expect(actualizarCliente(4, {}, form({ nombre: '', telefono: '9876-5432' }))).resolves.toMatchObject({
      campos: { nombre: expect.any(String) },
    })
    await expect(actualizarCliente(4, {}, form({ nombre: 'Ana', telefono: '98765432' }))).rejects.toThrow(
      'NEXT_REDIRECT:/clientes/4?exito=cliente-actualizado'
    )
  })

  it('registrar fiado', async () => {
    mockRepos.mockResolvedValue({
      clientes: { getById: jest.fn().mockResolvedValue({ id: 4 }) },
      fiados: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    })

    await expect(registrarFiado(4, {}, form({ monto: '0' }))).resolves.toMatchObject({ campos: { monto: expect.any(String) } })
    await expect(registrarFiado(4, {}, form({ monto: '50' }))).rejects.toThrow('/clientes/4?exito=fiado-registrado')
  })

  it('registrar pago válido', async () => {
    mockRepos.mockResolvedValue({
      fiados: { getById: jest.fn().mockResolvedValue({ id: 7, cliente_id: 4, saldo_pendiente: 90, estado: 'pendiente' }) },
      pagos: { create: jest.fn().mockResolvedValue({ id: 1 }) },
    })

    await expect(registrarPago(4, {}, form({ fiadoId: '7', monto: '90' }))).rejects.toThrow(
      '/clientes/4?exito=pago-registrado'
    )
  })
})
