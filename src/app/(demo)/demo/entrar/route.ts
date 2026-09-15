import { NextResponse } from 'next/server';
import {
  DEMO_COOKIE,
  DEMO_SESSION_MS,
  validateDemoCredentials,
} from '@/lib/demo/demo-config';
import { newDemoExpiry } from '@/lib/demo/session';

/**
 * Procesa el formulario de login demo.
 *
 * Valida contra las credenciales estáticas (NO Supabase). Si son correctas,
 * crea la sesión demo (cookie de 30 min) y redirige al dashboard demo.
 * El redirect 303 garantiza que la nueva petición GET a /demo ya lleve la
 * cookie, evitando problemas de lectura de cookies en el mismo render.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  if (!validateDemoCredentials(email, password)) {
    return NextResponse.redirect(new URL('/demo/login?error=1', request.url), 303);
  }

  const res = NextResponse.redirect(new URL('/demo', request.url), 303);
  res.cookies.set(DEMO_COOKIE, String(newDemoExpiry()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/demo',
    maxAge: DEMO_SESSION_MS / 1000,
  });
  return res;
}
