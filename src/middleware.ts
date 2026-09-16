import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { DEMO_COOKIE, isDemoPath } from '@/lib/demo/demo-config'

/**
 * Middleware.
 *
 * 1) MODO DEMO: si la ruta empieza por /demo, se maneja la sesión demo
 *    (cookie con expiración de 30 min) y se SALTA la autenticación real.
 *    Es el equivalente Next.js al `req.isDemoMode = true` de la spec original.
 * 2) Rutas protegidas (/dashboard, /clientes, /productos, /ventas): valida la
 *    sesión Supabase, renueva sus cookies y redirige a /login si falta.
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
  // Patrón de @supabase/ssr para middleware: las cookies se leen del request y
  // las renovadas se escriben en la response. Con `cookies()` de next/headers
  // los tokens refrescados nunca llegaban al navegador.
  let response = NextResponse.next({ request })
  const protegida = isProtectedPath(pathname)

  try {
    const { url, anonKey } = getSupabaseEnv()

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (protegida && !user) {
      return redirectKeepingCookies(request, response, '/login')
    }

    // Usuario autenticado que intenta ir a login -> dashboard
    if (pathname === '/login' && user) {
      return redirectKeepingCookies(request, response, '/dashboard')
    }

    return response
  } catch {
    // Si falla la verificación, una ruta privada nunca debe quedar abierta.
    if (protegida) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }
}

/** Prefijos de las rutas del grupo (app). Los grupos `(app)` no aparecen en la URL. */
const PROTECTED_PREFIXES = ['/dashboard', '/clientes', '/productos', '/ventas']

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Redirige conservando las cookies de sesión que Supabase haya renovado. */
function redirectKeepingCookies(request: NextRequest, from: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url))
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

export const config = {
  matcher: [
    '/demo/:path*',
    '/dashboard/:path*',
    '/clientes/:path*',
    '/productos/:path*',
    '/ventas/:path*',
    '/login',
  ],
}
