import { conExito, estadoDeFallo, leerCampos, MENSAJES_EXITO } from '@/lib/formulario'
import { oNotFound } from '@/lib/params'
import { NoEncontradoError } from '@/domain/errors'
import { notFound } from 'next/navigation'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

describe('helpers de formularios', () => {
  it('lee solo los campos pedidos como texto', () => {
    const form = new FormData()
    form.set('nombre', 'Ana')
    form.set('archivo', new Blob(['x']))
    form.set('extra', 'ignorar')

    expect(leerCampos(form, ['nombre', 'archivo', 'telefono'])).toEqual({ nombre: 'Ana', archivo: '', telefono: '' })
  })

  it('convierte un fallo en estado con valores', () => {
    expect(
      estadoDeFallo(
        { ok: false, error: { codigo: 'VALIDACION', mensaje: 'Revisa' }, campos: { nombre: 'Requerido' } },
        { nombre: '' }
      )
    ).toEqual({ error: 'Revisa', campos: { nombre: 'Requerido' }, valores: { nombre: '' } })
  })

  it('agrega el aviso de éxito a la ruta', () => {
    expect(conExito('/clientes/3', 'cliente-creado')).toBe('/clientes/3?exito=cliente-creado')
    expect(conExito('/ventas?x=1', 'venta-registrada')).toBe('/ventas?x=1&exito=venta-registrada')
    expect(MENSAJES_EXITO['pago-registrado']).toBe('Pago registrado')
  })

  it('oNotFound responde 404 solo para registros inexistentes', async () => {
    await expect(oNotFound(Promise.resolve(1))).resolves.toBe(1)
    await expect(oNotFound(Promise.reject(new NoEncontradoError('Cliente', 1)))).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(oNotFound(Promise.reject(new Error('db')))).rejects.toThrow('db')
    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
