import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/supabase/env'

/**
 * Middleware para validar autenticación en rutas protegidas
 * Redirige a login si no hay sesión válida
 */
export async function middleware(request: NextRequest) {
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
    '/(app)/:path*',
    '/app/:path*',
    '/dashboard/:path*',
    '/clientes/:path*',
    '/productos/:path*',
    '/ventas/:path*',
  ],
}
