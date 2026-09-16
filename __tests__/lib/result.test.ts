import { ejecutar, exito, fallo } from '@/lib/result'
import { NoEncontradoError, ValidacionError } from '@/domain/errors'
import { ValidationError } from '@/lib/security/validators'
import { DemoReadOnlyError } from '@/repositories/memory'

describe('Result', () => {
  it('envuelve datos exitosos', async () => {
    expect(exito(3)).toEqual({ ok: true, data: 3 })
    await expect(ejecutar(async () => 'listo')).resolves.toEqual({ ok: true, data: 'listo' })
  })

  it('conserva código, mensaje y campos de los errores de dominio', () => {
    expect(fallo(new ValidacionError('Revisa', { monto: 'Requerido' }))).toEqual({
      ok: false,
      error: { codigo: 'VALIDACION', mensaje: 'Revisa' },
      campos: { monto: 'Requerido' },
    })
    expect(fallo(new NoEncontradoError('Fiado', 2))).toEqual({
      ok: false,
      error: { codigo: 'NO_ENCONTRADO', mensaje: 'Fiado #2 no existe' },
    })
  })

  it('trata la escritura en demo como error de dominio', () => {
    expect(fallo(new DemoReadOnlyError('ventas.create'))).toMatchObject({
      ok: false,
      error: { codigo: 'DEMO_SOLO_LECTURA' },
    })
  })

  it('acepta los ValidationError de lib/security', () => {
    expect(fallo(new ValidationError('Monto inválido'))).toEqual({
      ok: false,
      error: { codigo: 'VALIDACION', mensaje: 'Monto inválido' },
    })
  })

  it('no filtra mensajes de errores inesperados', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const resultado = await ejecutar(async () => {
      throw new Error('password=secreto')
    })
    expect(resultado).toMatchObject({ ok: false, error: { codigo: 'ERROR_DATOS' } })
    expect(JSON.stringify(resultado)).not.toContain('secreto')
    spy.mockRestore()
  })
})
