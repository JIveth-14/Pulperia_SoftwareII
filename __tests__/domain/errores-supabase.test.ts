import { aErrorDeDominio, lanzarSiError } from '@/repositories/supabase/errores'
import {
  DuplicadoError,
  ErrorDeDatos,
  NoEncontradoError,
  PagoExcedeSaldoError,
  ReglaNegocioError,
  StockInsuficienteError,
  ValidacionError,
} from '@/domain/errors'

const ctx = { entidad: 'Cliente', id: 7 }

describe('Adapter de errores de Supabase', () => {
  it('traduce .single() sin filas a NoEncontradoError', () => {
    const error = aErrorDeDominio({ code: 'PGRST116', message: 'no rows' }, ctx)
    expect(error).toBeInstanceOf(NoEncontradoError)
    expect(error.message).toBe('Cliente #7 no existe')
    expect(error.cause).toEqual({ code: 'PGRST116', message: 'no rows' })
  })

  it('reconoce los RAISE EXCEPTION de stock y saldo', () => {
    expect(
      aErrorDeDominio({ code: 'P0001', message: 'Stock insuficiente para producto 3 (disponible: 2, solicitado: 5)' }, ctx)
    ).toBeInstanceOf(StockInsuficienteError)
    expect(
      aErrorDeDominio({ code: 'P0001', message: 'El pago (500) supera el saldo pendiente del fiado (100)' }, ctx)
    ).toBeInstanceOf(PagoExcedeSaldoError)
    expect(aErrorDeDominio({ code: 'P0001', message: 'El total de la venta debe ser mayor a 0' }, ctx)).toBeInstanceOf(
      ReglaNegocioError
    )
  })

  it('traduce violaciones de restricciones', () => {
    const enUso = aErrorDeDominio(
      { code: '23503', message: 'update or delete on table "clientes" violates foreign key constraint' },
      ctx
    )
    expect(enUso).toBeInstanceOf(ReglaNegocioError)
    expect(enUso.message).toBe('No se puede modificar: cliente tiene registros asociados')

    expect(aErrorDeDominio({ code: '23505', message: 'duplicate key' }, ctx)).toBeInstanceOf(DuplicadoError)
    expect(aErrorDeDominio({ code: '23514', message: 'check constraint' }, ctx)).toBeInstanceOf(ValidacionError)
  })

  it('oculta el detalle técnico de errores desconocidos', () => {
    const error = aErrorDeDominio({ code: '08006', message: 'connection failure at 10.0.0.1' }, ctx)
    expect(error).toBeInstanceOf(ErrorDeDatos)
    expect(error.message).not.toContain('10.0.0.1')
  })

  it('lanzarSiError solo lanza cuando hay error', () => {
    expect(() => lanzarSiError(null, ctx)).not.toThrow()
    expect(() => lanzarSiError({ code: 'PGRST116', message: 'x' }, ctx)).toThrow(NoEncontradoError)
  })
})
