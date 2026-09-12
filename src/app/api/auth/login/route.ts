import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
