import { esDelDia, rangoDelDia, ZONA_HORARIA } from '@/lib/dates'

describe('dates (zona horaria de Honduras)', () => {
  it('usa America/Tegucigalpa por defecto', () => {
    expect(ZONA_HORARIA).toBe('America/Tegucigalpa')
  })

  it('calcula el día de Honduras aunque en UTC ya sea el día siguiente', () => {
    // 16 sep 2026, 20:00 en Honduras = 17 sep 02:00 UTC
    const ahora = new Date('2026-09-17T02:00:00Z')

    expect(rangoDelDia(ahora)).toEqual({
      inicio: '2026-09-16T06:00:00.000Z',
      fin: '2026-09-17T06:00:00.000Z',
    })
  })

  it('maneja el cambio de mes', () => {
    const ahora = new Date('2026-09-30T12:00:00Z')

    expect(rangoDelDia(ahora)).toEqual({
      inicio: '2026-09-30T06:00:00.000Z',
      fin: '2026-10-01T06:00:00.000Z',
    })
  })

  it('respeta una zona distinta si se indica', () => {
    const ahora = new Date('2026-09-16T12:00:00Z')

    expect(rangoDelDia(ahora, 'UTC')).toEqual({
      inicio: '2026-09-16T00:00:00.000Z',
      fin: '2026-09-17T00:00:00.000Z',
    })
  })

  it('esDelDia incluye el inicio y excluye el fin del rango', () => {
    const ahora = new Date('2026-09-16T18:00:00Z')

    expect(esDelDia('2026-09-16T06:00:00.000Z', ahora)).toBe(true)
    expect(esDelDia('2026-09-17T05:59:59.999Z', ahora)).toBe(true)
    expect(esDelDia('2026-09-17T06:00:00.000Z', ahora)).toBe(false)
    expect(esDelDia('2026-09-16T05:59:59.999Z', ahora)).toBe(false)
  })
})
