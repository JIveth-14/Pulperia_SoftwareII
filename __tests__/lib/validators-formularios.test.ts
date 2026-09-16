import {
  validarCampos,
  validateDireccionOpcional,
  validateEnteroNoNegativo,
  validateNombre,
  validatePrecio,
  validateTelefono,
} from '@/lib/security/validators'

describe('validadores de formularios', () => {
  it('formatea teléfonos hondureños', () => {
    expect(validateTelefono('98765432')).toBe('9876-5432')
    expect(validateTelefono('9876 5432')).toBe('9876-5432')
    expect(validateTelefono('+504 9876-5432')).toBe('9876-5432')
    expect(validateTelefono('12345678901')).toBe('12345678901')
    expect(() => validateTelefono('123')).toThrow('entre 6 y 15 dígitos')
  })

  it('convierte direcciones vacías en null', () => {
    expect(validateDireccionOpcional('')).toBeNull()
    expect(validateDireccionOpcional('   ')).toBeNull()
    expect(validateDireccionOpcional(undefined)).toBeNull()
    expect(validateDireccionOpcional(' Col. Kennedy ')).toBe('Col. Kennedy')
  })

  it('valida precios (0 permitido, negativos no)', () => {
    expect(validatePrecio('18.456')).toBe(18.46)
    expect(validatePrecio(0)).toBe(0)
    expect(() => validatePrecio('')).toThrow('Precio requerido')
    expect(() => validatePrecio('-1')).toThrow('negativo')
    expect(() => validatePrecio('abc')).toThrow('inválido')
  })

  it('valida enteros no negativos con el nombre del campo', () => {
    expect(validateEnteroNoNegativo('12', 'Stock')).toBe(12)
    expect(validateEnteroNoNegativo(0)).toBe(0)
    expect(() => validateEnteroNoNegativo('1.5', 'Stock')).toThrow('Stock debe ser un número entero')
    expect(() => validateEnteroNoNegativo('-2', 'Stock')).toThrow('Stock no puede ser negativo')
    expect(() => validateEnteroNoNegativo('', 'Stock mínimo')).toThrow('Stock mínimo requerido')
  })

  it('validarCampos reúne todos los errores, no solo el primero', () => {
    const { valores, errores } = validarCampos({
      nombre: () => validateNombre(''),
      telefono: () => validateTelefono('1'),
      precio: () => validatePrecio('10'),
    })

    expect(errores).toEqual({
      nombre: 'Nombre no puede estar vacío',
      telefono: 'Teléfono debe tener entre 6 y 15 dígitos',
    })
    expect(valores.precio).toBe(10)
  })
})

describe('validadores base', () => {
  const v = require('@/lib/security/validators')

  it('email: normaliza y rechaza formatos inválidos', () => {
    expect(v.validateEmail('  Ana@Pulperia.HN ')).toBe('ana@pulperia.hn')
    expect(() => v.validateEmail(5)).toThrow('Email requerido')
    expect(() => v.validateEmail('   ')).toThrow('vacío')
    expect(() => v.validateEmail('a'.repeat(250) + '@x.hn')).toThrow('muy largo')
    expect(() => v.validateEmail('sin-arroba')).toThrow('Formato')
  })

  it('contraseña: longitud mínima y máxima', () => {
    expect(v.validatePassword('Segura2026!')).toBe('Segura2026!')
    expect(() => v.validatePassword(null)).toThrow('requerida')
    expect(() => v.validatePassword('')).toThrow('vacía')
    expect(() => v.validatePassword('corta')).toThrow('mínimo 8')
    expect(() => v.validatePassword('x'.repeat(129))).toThrow('muy larga')
  })

  it('nombre, monto y dirección: tipos y límites', () => {
    expect(() => v.validateNombre(3)).toThrow('Nombre requerido')
    expect(() => v.validateNombre('A')).toThrow('muy corto')
    expect(() => v.validateNombre('x'.repeat(151))).toThrow('muy largo')
    expect(() => v.validatePhoneNumber(98765432)).toThrow('Teléfono requerido')
    expect(() => v.validateMontoPositivo({})).toThrow('debe ser un número')
    expect(() => v.validateMontoPositivo('abc')).toThrow('Monto inválido')
    expect(() => v.validateMontoPositivo(1_000_000)).toThrow('demasiado grande')
    expect(() => v.validateDireccion(1)).toThrow('debe ser texto')
    expect(() => v.validateDireccion('x'.repeat(301))).toThrow('muy larga')
    expect(() => v.validatePrecio(1_000_000)).toThrow('demasiado grande')
  })

  it('validarCampos usa un mensaje genérico para errores inesperados', () => {
    const { errores } = v.validarCampos({
      campo: () => {
        throw new Error('boom')
      },
    })
    expect(errores).toEqual({ campo: 'Valor inválido' })
  })
})
