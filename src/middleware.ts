import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { DEMO_COOKIE, isDemoPath } from '@/lib/demo/demo-config'

/**
 * Middleware.
 *
 * 1) MODO DEMO: si la ruta empieza por /demo, se maneja la sesión demo
 *    (cookie con expiración de 30 min) y se SALTA la autenticación real.
 *    Es el equivalente Next.js al `req.isDemoMode = true` de la spec original.
 * 2) Rutas protegidas: valida sesión Supabase y redirige a /login si falta.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ==========================================
  // 1) MODO DEMO
  // ==========================================
  if (isDemoPath(pathname)) {
    // Rutas demo públicas: login, procesado del login, expiración y salida.
    // No requieren sesión (de lo contrario no se podría entrar nunca).
    const publicDemo =
      pathname.startsWith('/demo/login') ||
      pathname.startsWith('/demo/entrar') ||
      pathname.startsWith('/demo/expirado') ||
      pathname.startsWith('/demo/salir')

    if (publicDemo) {
      return NextResponse.next()
    }

    // El resto de /demo requiere una sesión demo válida (creada en /demo/entrar
    // tras validar las credenciales estáticas demo@app.com / Demo2026!).
    const existing = request.cookies.get(DEMO_COOKIE)?.value
    const expiresAt = existing ? Number(existing) : NaN
    const valid = Number.isFinite(expiresAt) && Date.now() <= expiresAt

    if (!valid) {
      // Sin sesión -> a login demo. Con sesión expirada -> a /demo/expirado.
      const res = NextResponse.redirect(
        new URL(existing ? '/demo/expirado' : '/demo/login', request.url)
      )
      if (existing) res.cookies.delete({ name: DEMO_COOKIE, path: '/demo' })
      return res
    }

    const res = NextResponse.next()
    res.headers.set('x-demo-mode', '1')
    return res
  }

  // ==========================================
  // 2) AUTENTICACIÓN REAL (Supabase)
  // ==========================================
  try {
    const cookieStore = await cookies()
    const { url, anonKey } = getSupabaseEnv()

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    // Proteger rutas de (app) - requieren autenticación
    if (request.nextUrl.pathname.startsWith('/(app)') || request.nextUrl.pathname.startsWith('/app/')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Redirigir a dashboard si usuario intenta ir a login ya autenticado
    if (request.nextUrl.pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch {
    // Si hay error de autenticación, redirigir a login
    if (request.nextUrl.pathname.startsWith('/(app)') || request.nextUrl.pathname.startsWith('/app/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/demo/:path*',
    '/(app)/:path*',
    '/app/:path*',
    '/dashboard/:path*',
    '/clientes/:path*',
    '/productos/:path*',
    '/ventas/:path*',
    '/login',
  ],
}
