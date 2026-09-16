import { NextResponse } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo/demo-config';

/** true si la petición es una precarga (prefetch) y no un clic real. */
function esPrecarga(request: Request): boolean {
  const h = request.headers;
  return (
    h.has('next-router-prefetch') ||
    h.get('purpose') === 'prefetch' ||
    h.get('sec-purpose')?.includes('prefetch') === true
  );
}

/**
 * Salida del modo demo: limpia la sesión demo y vuelve al inicio.
 * GET para poder enlazarlo directamente desde el banner/navbar.
 *
 * Las precargas se ignoran: si algún <Link> apunta aquí, Next hace un GET
 * de prefetch al renderizar la página y eso cerraba la sesión recién creada
 * (el usuario veía el login demo de nuevo al navegar).
 */
export function GET(request: Request) {
  if (esPrecarga(request)) {
    return new NextResponse(null, { status: 204 });
  }

  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.delete({ name: DEMO_COOKIE, path: '/demo' });
  return res;
}
