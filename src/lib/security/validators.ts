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
