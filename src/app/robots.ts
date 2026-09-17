import type { MetadataRoute } from 'next';

// Next genera /robots.txt a partir de este archivo (Metadata API).
// El host coincide con el metadataBase declarado en layout.tsx.
const SITIO = 'https://pulperia.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rutas detras de sesion o sin valor para un buscador: no se indexan.
      disallow: [
        '/api/',
        '/login',
        '/dashboard',
        '/clientes',
        '/productos',
        '/ventas',
        '/demo',
      ],
    },
    host: SITIO,
  };
}
