import { RegistrarPago } from '@/services'
import type { Repositories } from '@/repositories/container'

const plain = (s: string) => s.replace(/[  ]/g, ' ')

function crear(fiado: object = { id: 4, cliente_id: 9, saldo_pendiente: '100.00', estado: 'parcial' }) {
  const repos = {
    fiados: { getById: jest.fn().mockResolvedValue(fiado) },
    pagos: { create: jest.fn().mockResolvedValue({ id: 1, fiado_id: 4, monto_pagado: 40 }) },
  }
  return { repos, caso: new RegistrarPago(repos as unknown as Repositories) }
}

describe('RegistrarPago (Command)', () => {
  it('registra un abono válido redondeado a centavos', async () => {
    const { repos, caso } = crear()

    const resultado = await caso.ejecutar({ fiadoId: '4', monto: '40.004', clienteId: 9 })

    expect(resultado.ok).toBe(true)
    expect(repos.pagos.create).toHaveBeenCalledWith({ fiado_id: 4, monto_pagado: 40 })
  })

  it('permite pagar exactamente el saldo', async () => {
    const { caso } = crear()
    await expect(caso.ejecutar({ fiadoId: 4, monto: 100 })).resolves.toMatchObject({ ok: true })
  })

  it('rechaza pagos mayores al saldo con los montos en lempiras', async () => {
    const { repos, caso } = crear()

    const resultado = await caso.ejecutar({ fiadoId: 4, monto: 150 })

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.error.codigo).toBe('PAGO_EXCEDE_SALDO')
      expect(plain(resultado.error.mensaje)).toBe('El pago (L 150.00) supera el saldo pendiente (L 100.00)')
    }
    expect(repos.pagos.create).not.toHaveBeenCalled()
  })

  it('rechaza montos inválidos con error por campo', async () => {
    const { caso } = crear()

    await expect(caso.ejecutar({ fiadoId: 4, monto: '-5' })).resolves.toMatchObject({
      ok: false,
      error: { codigo: 'VALIDACION' },
      campos: { monto: 'Monto debe ser mayor a 0' },
    })
  })

  it('rechaza deudas ya pagadas y de otro cliente', async () => {
    await expect(
      crear({ id: 4, cliente_id: 9, saldo_pendiente: 0, estado: 'pagado' }).caso.ejecutar({ fiadoId: 4, monto: 10 })
    ).resolves.toMatchObject({ error: { codigo: 'REGLA_NEGOCIO', mensaje: 'Esta deuda ya está pagada' } })

    await expect(crear().caso.ejecutar({ fiadoId: 4, monto: 10, clienteId: 1 })).resolves.toMatchObject({
      error: { codigo: 'REGLA_NEGOCIO', mensaje: 'La deuda no pertenece a este cliente' },
    })
  })
})
