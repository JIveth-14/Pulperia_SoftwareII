/**
 * Input validation utilities
 * Centralized validation for all user inputs across the app
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new ValidationError('Email requerido')
  }

  const trimmed = email.trim().toLowerCase()

  if (trimmed.length === 0) {
    throw new ValidationError('Email no puede estar vacío')
  }

  if (trimmed.length > 254) {
    throw new ValidationError('Email muy largo (máximo 254 caracteres)')
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  if (!emailRegex.test(trimmed)) {
    throw new ValidationError('Formato de email inválido')
  }

  return trimmed
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw new ValidationError('Contraseña requerida')
  }

  if (password.length === 0) {
    throw new ValidationError('Contraseña no puede estar vacía')
  }

  if (password.length < 8) {
    throw new ValidationError('Contraseña debe tener mínimo 8 caracteres')
  }

  // Max reasonable length
  if (password.length > 128) {
    throw new ValidationError('Contraseña muy larga (máximo 128 caracteres)')
  }

  return password
}

export function validatePhoneNumber(phone: unknown): string {
  if (typeof phone !== 'string') {
    throw new ValidationError('Teléfono requerido')
  }

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length < 6 || cleaned.length > 15) {
    throw new ValidationError('Teléfono debe tener entre 6 y 15 dígitos')
  }

  return cleaned
}

export function validateNombre(nombre: unknown): string {
  if (typeof nombre !== 'string') {
    throw new ValidationError('Nombre requerido')
  }

  const trimmed = nombre.trim()

  if (trimmed.length === 0) {
    throw new ValidationError('Nombre no puede estar vacío')
  }

  if (trimmed.length < 2) {
    throw new ValidationError('Nombre muy corto (mínimo 2 caracteres)')
  }

  if (trimmed.length > 150) {
    throw new ValidationError('Nombre muy largo (máximo 150 caracteres)')
  }

  return trimmed
}

export function validateMontoPositivo(monto: unknown): number {
  if (typeof monto !== 'number' && typeof monto !== 'string') {
    throw new ValidationError('Monto debe ser un número')
  }

  const num = typeof monto === 'string' ? parseFloat(monto) : monto

  if (isNaN(num)) {
    throw new ValidationError('Monto inválido')
  }

  if (num <= 0) {
    throw new ValidationError('Monto debe ser mayor a 0')
  }

  if (num > 999999.99) {
    throw new ValidationError('Monto demasiado grande')
  }

  return Math.round(num * 100) / 100 // Round to 2 decimals
}

export function validateDireccion(direccion: unknown): string {
  if (typeof direccion !== 'string') {
    throw new ValidationError('Dirección debe ser texto')
  }

  const trimmed = direccion.trim()

  if (trimmed.length > 300) {
    throw new ValidationError('Dirección muy larga (máximo 300 caracteres)')
  }

  return trimmed
}

/**
 * Teléfono hondureño o internacional. Devuelve 8 dígitos como `9876-5432`
 * (formato local) y cualquier otro largo válido solo con dígitos.
 */
export function validateTelefono(telefono: unknown): string {
  const digitos = validatePhoneNumber(telefono)
  if (digitos.length === 8) return `${digitos.slice(0, 4)}-${digitos.slice(4)}`
  if (digitos.length === 11 && digitos.startsWith('504')) {
    return `${digitos.slice(3, 7)}-${digitos.slice(7)}`
  }
  return digitos
}

/** Dirección opcional: vacía → null. */
export function validateDireccionOpcional(direccion: unknown): string | null {
  if (direccion === undefined || direccion === null) return null
  const limpia = validateDireccion(direccion)
  return limpia.length === 0 ? null : limpia
}

/** Precio en lempiras: puede ser 0 (regalías), nunca negativo. */
export function validatePrecio(precio: unknown): number {
  if (typeof precio === 'string' && precio.trim() === '') {
    throw new ValidationError('Precio requerido')
  }
  const num = typeof precio === 'string' ? Number(precio) : precio
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw new ValidationError('Precio inválido')
  }
  if (num < 0) {
    throw new ValidationError('El precio no puede ser negativo')
  }
  if (num > 999999.99) {
    throw new ValidationError('Precio demasiado grande')
  }
  return Math.round(num * 100) / 100
}

/** Entero mayor o igual a 0 (stock, stock mínimo). */
export function validateEnteroNoNegativo(valor: unknown, campo = 'Cantidad'): number {
  if (typeof valor === 'string' && valor.trim() === '') {
    throw new ValidationError(`${campo} requerido`)
  }
  const num = typeof valor === 'string' ? Number(valor) : valor
  if (typeof num !== 'number' || !Number.isSafeInteger(num)) {
    throw new ValidationError(`${campo} debe ser un número entero`)
  }
  if (num < 0) {
    throw new ValidationError(`${campo} no puede ser negativo`)
  }
  return num
}

/**
 * Valida varios campos a la vez y reúne TODOS los errores (no solo el
 * primero), para mostrarlos junto a cada input del formulario.
 */
export function validarCampos<T extends Record<string, () => unknown>>(
  reglas: T
): { valores: { [K in keyof T]: ReturnType<T[K]> }; errores: Partial<Record<keyof T, string>> } {
  const valores = {} as { [K in keyof T]: ReturnType<T[K]> }
  const errores: Partial<Record<keyof T, string>> = {}

  for (const campo of Object.keys(reglas) as (keyof T)[]) {
    try {
      valores[campo] = reglas[campo]() as ReturnType<T[typeof campo]>
    } catch (error) {
      errores[campo] = error instanceof ValidationError ? error.message : 'Valor inválido'
    }
  }

  return { valores, errores }
}
