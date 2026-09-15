import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { validateEmail, validatePassword, ValidationError } from '@/lib/security/validators'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown') as string

  try {
    // Validar Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Parsear body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Validar estructura
    if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body)) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Validar inputs
    let email: string
    let password: string
    try {
      email = validateEmail((body as Record<string, unknown>).email)
      password = validatePassword((body as Record<string, unknown>).password)
    } catch (error) {
      const message = error instanceof ValidationError ? error.message : 'Invalid input'
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    // Crear cliente Supabase
    const cookieStore = await cookies()
    const { url, anonKey } = getSupabaseEnv()

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options || {})
          })
        },
      },
    })

    // Intentar login
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.warn(`[Security] Failed login attempt for ${email} from ${clientIp} after ${Date.now() - startTime}ms`)
      // Respuesta genérica (no revelar si email existe)
      return NextResponse.json(
        { error: 'Email o contraseña incorrecta' },
        { status: 401 }
      )
    }

    console.info(`[Security] Successful login for ${email} from ${clientIp}`)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[API] Unexpected error in login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
