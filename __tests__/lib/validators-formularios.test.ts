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
