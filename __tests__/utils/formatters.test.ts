import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneySigned,
  LOCALE,
  MONEDA,
} from '@/lib/format'

// Intl puede usar espacios no separables; se normalizan para comparar.
const plain = (value: string) => value.replace(/[  ]/g, ' ')

describe('format (Lempira hondureño y hora de Honduras)', () => {
  it('usa la configuración regional de Honduras', () => {
    expect(LOCALE).toBe('es-HN')
    expect(MONEDA).toBe('HNL')
  })

  describe('formatMoney', () => {
    it('formatea montos en lempiras con dos decimales y separador de miles', () => {
      expect(plain(formatMoney(1234.5))).toBe('L 1,234.50')
      expect(plain(formatMoney(0))).toBe('L 0.00')
    })

    it('acepta los numeric que Supabase devuelve como string', () => {
      expect(plain(formatMoney('80.456'))).toBe('L 80.46')
    })

    it('trata null, undefined y valores inválidos como cero', () => {
      expect(plain(formatMoney(null))).toBe('L 0.00')
      expect(plain(formatMoney(undefined))).toBe('L 0.00')
      expect(plain(formatMoney('abc'))).toBe('L 0.00')
    })
  })

  describe('formatMoneySigned', () => {
    it('antepone + solo a montos positivos', () => {
      expect(plain(formatMoneySigned(150))).toBe('+L 150.00')
      expect(plain(formatMoneySigned(0))).toBe('L 0.00')
    })
  })

  describe('formatDate', () => {
    it('usa la fecha de Honduras aunque en UTC ya sea el día siguiente', () => {
      // 17 sep 02:00 UTC = 16 sep 20:00 en Honduras
      expect(plain(formatDate('2026-09-17T02:00:00Z'))).toMatch(/^16 sept? 2026$/)
    })

    it('devuelve el texto de respaldo para valores vacíos o inválidos', () => {
      expect(formatDate(null)).toBe('Sin fecha')
      expect(formatDate('no-es-fecha')).toBe('Sin fecha')
      expect(formatDate(undefined, '—')).toBe('—')
    })
  })

  describe('formatDateTime', () => {
    it('incluye la hora local de Honduras', () => {
      expect(plain(formatDateTime('2026-09-16T18:30:00Z'))).toContain('12:30')
    })

    it('devuelve el texto de respaldo para valores vacíos', () => {
      expect(formatDateTime(null)).toBe('Sin fecha')
    })
  })
})
