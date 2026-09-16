import { EliminarCliente, EliminarProducto, GuardarCliente, GuardarProducto, RegistrarFiado } from '@/services'
import { NoEncontradoError, ReglaNegocioError } from '@/domain/errors'
import type { Repositories } from '@/repositories/container'

const plain = (s: string) => s.replace(/[  ]/g, ' ')
const repos = (r: object) => r as unknown as Repositories

describe('GuardarCliente', () => {
  it('crea con datos normalizados', async () => {
    const clientes = { create: jest.fn().mockResolvedValue({ id: 1 }), update: jest.fn() }

    const r = await new GuardarCliente(repos({ clientes })).ejecutar({
      nombre: '  María  ',
      telefono: '98765432',
      direccion: '',
    })

    expect(r).toEqual({ ok: true, data: { id: 1 } })
    expect(clientes.create).toHaveBeenCalledWith({ nombre: 'María', telefono: '9876-5432', direccion: null })
    expect(clientes.update).not.toHaveBeenCalled()
  })

  it('actualiza cuando hay id y devuelve todos los errores por campo', async () => {
    const clientes = { create: jest.fn(), update: jest.fn().mockResolvedValue({ id: 3 }) }
    const caso = new GuardarCliente(repos({ clientes }))

    await caso.ejecutar({ id: 3, nombre: 'Ana', telefono: '7654-3210' })
    expect(clientes.update).toHaveBeenCalledWith(3, { nombre: 'Ana', telefono: '7654-3210', direccion: null })

    await expect(caso.ejecutar({ nombre: '', telefono: '1' })).resolves.toMatchObject({
      ok: false,
      error: { codigo: 'VALIDACION' },
      campos: { nombre: expect.any(String), telefono: expect.any(String) },
    })
  })
})

describe('EliminarCliente', () => {
  it('bloquea clientes con deudas pendientes', async () => {
    const clientes = { getById: jest.fn().mockResolvedValue({ id: 1 }), delete: jest.fn() }
    const fiados = { getByCliente: jest.fn().mockResolvedValue([{ saldo_pendiente: '80.00' }, { saldo_pendiente: 20 }]) }

    const r = await new EliminarCliente(repos({ clientes, fiados })).ejecutar(1)

    expect(r.ok).toBe(false)
    if (!r.ok) expect(plain(r.error.mensaje)).toBe('No se puede eliminar: el cliente tiene L 100.00 pendientes de pago')
    expect(clientes.delete).not.toHaveBeenCalled()
  })

  it('elimina clientes sin saldo', async () => {
    const clientes = { getById: jest.fn().mockResolvedValue({ id: 1 }), delete: jest.fn() }
    const fiados = { getByCliente: jest.fn().mockResolvedValue([{ saldo_pendiente: 0 }]) }

    await expect(new EliminarCliente(repos({ clientes, fiados })).ejecutar(1)).resolves.toEqual({
      ok: true,
      data: undefined,
    })
    expect(clientes.delete).toHaveBeenCalledWith(1)
  })
})

describe('GuardarProducto', () => {
  it('usa stock mínimo 5 por defecto y valida números', async () => {
    const productos = { create: jest.fn().mockResolvedValue({ id: 2 }) }
    const caso = new GuardarProducto(repos({ productos }))

    await caso.ejecutar({ nombre: 'Arroz 1lb', precio: '15', stock: '20', stock_minimo: '' })
    expect(productos.create).toHaveBeenCalledWith({ nombre: 'Arroz 1lb', precio: 15, stock: 20, stock_minimo: 5 })

    await expect(caso.ejecutar({ nombre: 'X', precio: '-1', stock: '2.5' })).resolves.toMatchObject({
      campos: { nombre: expect.any(String), precio: expect.any(String), stock: expect.any(String) },
    })
  })
})

describe('EliminarProducto', () => {
  it('explica por qué no se puede borrar un producto vendido', async () => {
    const productos = {
      delete: jest.fn().mockRejectedValue(new ReglaNegocioError('No se puede modificar: producto tiene registros asociados')),
    }

    await expect(new EliminarProducto(repos({ productos })).ejecutar(4)).resolves.toMatchObject({
      ok: false,
      error: { mensaje: expect.stringContaining('tiene ventas registradas') },
    })
  })
})

describe('RegistrarFiado', () => {
  it('valida el monto y que el cliente exista', async () => {
    const fiados = { create: jest.fn().mockResolvedValue({ id: 9 }) }
    const ok = { getById: jest.fn().mockResolvedValue({ id: 1 }) }

    await expect(new RegistrarFiado(repos({ clientes: ok, fiados })).ejecutar({ clienteId: 1, monto: '0' })).resolves.toMatchObject({
      campos: { monto: 'Monto debe ser mayor a 0' },
    })

    await new RegistrarFiado(repos({ clientes: ok, fiados })).ejecutar({ clienteId: 1, monto: '120.5' })
    expect(fiados.create).toHaveBeenCalledWith({ cliente_id: 1, monto_total: 120.5 })

    const noExiste = { getById: jest.fn().mockRejectedValue(new NoEncontradoError('Cliente', 8)) }
    await expect(
      new RegistrarFiado(repos({ clientes: noExiste, fiados })).ejecutar({ clienteId: 8, monto: 10 })
    ).resolves.toMatchObject({ error: { codigo: 'NO_ENCONTRADO' } })
  })
})
