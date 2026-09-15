import { NextResponse } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo/demo-config';

/**
 * Salida del modo demo: limpia la sesión demo y vuelve al inicio.
 * GET para poder enlazarlo directamente desde el banner/navbar.
 */
export function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.delete({ name: DEMO_COOKIE, path: '/demo' });
  return res;
}
