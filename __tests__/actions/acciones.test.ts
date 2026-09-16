/**
 * @jest-environment node
 */
import { crearCliente, eliminarCliente, registrarPago } from '@/actions/clientes'
import { registrarVenta } from '@/actions/ventas'
import { getRepositories } from '@/repositories/container'
import { exigirSesion } from '@/lib/supabase/server-utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

describe('Server Actions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('verifican la sesión antes de tocar datos', async () => {
    ;(exigirSesion as jest.Mock).mockRejectedValueOnce(new Error('NEXT_REDIRECT:/login'))

    await expect(crearCliente({}, form({ nombre: 'Ana', telefono: '98765432' }))).rejects.toThrow('/login')
    expect(mockRepos).not.toHaveBeenCalled()
  })

  it('devuelven errores y lo escrito si la validación falla', async () => {
    mockRepos.mockResolvedValue({ clientes: { create: jest.fn() } })

    const estado = await crearCliente({}, form({ nombre: '', telefono: '1', direccion: 'Centro' }))

    expect(estado).toMatchObject({
      error: 'Revisa los datos del formulario',
      campos: { nombre: expect.any(String), telefono: expect.any(String) },
      valores: { nombre: '', telefono: '1', direccion: 'Centro' },
    })
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirigen con aviso de éxito al guardar', async () => {
    mockRepos.mockResolvedValue({ clientes: { create: jest.fn().mockResolvedValue({ id: 12 }) } })

    await expect(crearCliente({}, form({ nombre: 'Ana', telefono: '98765432' }))).rejects.toThrow(
      'NEXT_REDIRECT:/clientes/12?exito=cliente-creado'
    )
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('el pago se limita a las deudas del cliente de la URL', async () => {
    const pagos = { create: jest.fn() }
    mockRepos.mockResolvedValue({
      fiados: { getById: jest.fn().mockResolvedValue({ id: 4, cliente_id: 99, saldo_pendiente: 50, estado: 'pendiente' }) },
      pagos,
    })

    const estado = await registrarPago(1, {}, form({ fiadoId: '4', monto: '10' }))

    expect(estado.error).toBe('La deuda no pertenece a este cliente')
    expect(pagos.create).not.toHaveBeenCalled()
  })

  it('eliminar un cliente con deuda devuelve el motivo', async () => {
    mockRepos.mockResolvedValue({
      clientes: { getById: jest.fn().mockResolvedValue({ id: 1 }), delete: jest.fn() },
      fiados: { getByCliente: jest.fn().mockResolvedValue([{ saldo_pendiente: 10 }]) },
    })

    const estado = await eliminarCliente(1)
    expect(estado.error).toContain('pendientes de pago')
  })

  it('la venta rechaza un carrito ilegible y redirige al detalle al registrar', async () => {
    mockRepos.mockResolvedValue({
      ventas: { create: jest.fn().mockResolvedValue({ id: 30 }) },
      productos: { getById: jest.fn() },
      clientes: { getById: jest.fn() },
    })

    await expect(registrarVenta({}, form({ lineas: '{roto', tipoPago: 'contado' }))).resolves.toMatchObject({
      error: expect.stringContaining('carrito'),
    })

    await expect(
      registrarVenta({}, form({ lineas: '[{"producto_id":1,"cantidad":2}]', tipoPago: 'contado', clienteId: '' }))
    ).rejects.toThrow('NEXT_REDIRECT:/ventas/30?exito=venta-registrada')
  })
})
