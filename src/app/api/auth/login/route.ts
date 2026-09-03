import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function POST(request: NextRequest) {
  console.log('🚀 [POST /api/auth/login] REQUEST INICIADO')

  try {
    const { email, password } = await request.json()
    console.log('📥 Request body recibido:', { email, password, passwordLength: password?.length })

    const cookieStore = await cookies()
    console.log('🍪 Cookie store obtenido')

    const { url, anonKey } = getSupabaseEnv()
    console.log('🔐 Variables de Supabase saneadas:', {
      urlLength: url?.length,
      keyLength: anonKey?.length,
      urlStarts: url?.substring(0, 30),
    })

    const supabase = createServerClient(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            console.log('  ➡️ cookies.getAll() llamado')
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            console.log('  ⬅️ cookies.setAll() llamado, cookies a guardar:', cookiesToSet.length)
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    console.log('✅ Cliente Supabase creado exitosamente')

    console.log('🔓 Iniciando signInWithPassword:', { email, passwordLength: password?.length })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('📦 Respuesta de Supabase:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorStatus: error?.status,
      userID: data?.user?.id,
      sessionExists: !!data?.session,
    })

    if (error) {
      console.log('❌ Error en login:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✨ Login exitoso, devolviendo data')
    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('💥 ERROR NO CAPTURADO:', { error: errorMsg, stack: err instanceof Error ? err.stack : undefined })
    return NextResponse.json({ error: 'Error interno del servidor: ' + errorMsg }, { status: 500 })
  }
}
