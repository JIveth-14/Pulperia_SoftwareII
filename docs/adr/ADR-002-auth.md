# ADR-002: Estrategia de Autenticación y Autorización

**Estado**: Aceptado  
**Fecha**: 2026-08-29  
**Responsable**: Equipo Desarrollo  

## Contexto

La aplicación Pulpería requiere:
- Autenticación segura de usuarios (propietarios, empleados futuros)
- Sesiones persistentes (usuario regresa a la app sin re-loguearse)
- Protección de rutas públicas vs privadas
- Integración con arquitectura serverless (Next.js 15 en Vercel)
- Compatible con Server Components y middleware

Restricciones técnicas:
- Backend serverless (sin sesiones de servidor persistentes)
- SSR en Next.js 15 (Server Components)
- Escalabilidad sin estado (stateless)
- Seguridad OAuth2 / OIDC idealmente

Alternativas consideradas:
1. **Supabase Auth + @supabase/ssr** ← **ELEGIDA**
2. JWT manual + HttpOnly cookies
3. NextAuth.js v5 (Auth.js)
4. Firebase Authentication
5. Auth0

## Decisión

**Usar Supabase Auth con @supabase/ssr para autenticación y almacenamiento de sesiones en cookies.**

### Justificación

#### ✅ Ventajas

1. **Integración perfecta con Supabase**: Mismo vendor para auth + BD.
   - Usuario se autentica en Supabase Auth
   - Datos de usuario y clientes en PostgreSQL (mismo proveedor)
   - SDK unificado TypeScript

2. **Server Components + Middleware**: @supabase/ssr permite:
   ```typescript
   // app/middleware.ts - Proteger rutas
   export async function middleware(request: NextRequest) {
     const supabase = createMiddlewareClient({ req, res });
     const { data } = await supabase.auth.getSession();
     
     if (!data.session && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
   }
   
   // app/(dashboard)/page.tsx - Server Component
   export default async function DashboardPage() {
     const supabase = createServerComponentClient();
     const { data } = await supabase.auth.getUser();
     
     return <div>Bienvenido, {data.user.email}</div>;
   }
   ```

3. **Seguridad de sesiones**: Cookies HttpOnly, SameSite, Secure.
   - @supabase/ssr genera refresh tokens automáticamente
   - No expone JWT en localStorage (XSS-safe)
   - CSRF mitigation incluida

4. **PKCE Flow (OAuth2)**: Soporta proveedores OAuth (Google, GitHub futuros).
   ```typescript
   const { data } = await supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${origin}/auth/callback` }
   });
   ```

5. **MFA nativo**: Supabase Auth soporta 2FA (TOTP, SMS) sin código adicional.

6. **Row-Level Security (RLS)**: PostgreSQL + Supabase permiten políticas de acceso a nivel fila.
   ```sql
   -- Solo el dueño de la pulpería ve sus propios datos
   CREATE POLICY "Usuarios ven solo sus fiados"
   ON fiados FOR SELECT
   USING (auth.uid()::text = user_id);
   ```

7. **Free tier**: Hasta 50k MAU (monthly active users) sin costo.

8. **No cookies de sesión manual**: @supabase/ssr maneja refresh automático.
   - No bloat de código de seguridad
   - No riesgo de errores de implementación (ej: token expiry no manejado)

#### ❌ Desventajas

1. **Vendor lock-in**: Supabase Auth no es fácil de reemplazar por otra solución.
   - *Mitigación*: Supabase es open-source (PostgREST, GoTrue). Migración es posible si es necesario.

2. **RLS requiere PL/pgSQL**: Políticas complejas exigen knowledge de base de datos.
   - *Mitigación*: Para MVP, uso simple (un usuario = un propietario). RLS puede crecer después.

3. **Debugging RLS**: Errores de acceso denegado pueden ser oscuros.
   - *Mitigación*: Logging en Supabase dashboard.

4. **Límites de sesiones**: Supabase Auth tiene límites en número de sesiones (por defecto 10).
   - *Mitigación*: Suficiente para 1 propietario usando app desde múltiples dispositivos.

#### ❌ Desventajas (Alternativas rechazadas)

**JWT manual + HttpOnly cookies**
- ❌ Requiere implementar refresh token rotation
- ❌ Middleware custom para validar
- ❌ Mayor superficie de ataque
- ❌ Sin MFA nativa

**NextAuth.js v5**
- ❌ Overhead: soporta 50+ proveedores (overkill para Pulpería)
- ❌ Menor integración con BD (requiere adaptadores)
- ❌ Sin RLS nativa

**Firebase Authentication**
- ❌ Lock-in fuerte a Google
- ❌ Sin integración con PostgreSQL (datos en Firestore)
- ❌ Arquitectura incompatible con @supabase/ssr

**Auth0**
- ❌ Pago obligatorio ($23/mes mínimo)
- ❌ Overhead para startup

## Consecuencias

### Positivas

1. **Seguridad robusta**: Sin riesgo de bugs de JWT manual.
2. **Developer experience**: Setup mínimo (`npm install @supabase/ssr`).
3. **SSR-friendly**: Server Components acceden a sesión sin latency.
4. **Escalabilidad**: Supabase maneja miles de usuarios sin cambios.
5. **Futuro: MFA y OAuth**: Ruta clara para agregar Google login, 2FA.

### Negativas

1. **Vendor lock-in**: Cambiar proveedor auth requiere reescritura.
2. **RLS curva de aprendizaje**: Políticas de seguridad en SQL son nuevas para algunos devs.
3. **Costos futuros**: Pasado 50k MAU, se cobra ($3/1k usuarios extra).

## Ejemplos de Implementación

### Setup Inicial

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### Middleware de Autenticación

```typescript
// app/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getSession();

  // Proteger rutas /dashboard
  if (
    !data.session &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirigir login si ya está autenticado
  if (data.session && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

### Server Component con Sesión

```typescript
// app/(dashboard)/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  // Este dato viene del servidor; no expone token en cliente
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // Obtener datos del usuario desde BD
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div>
      <h1>Bienvenido, {profile?.nombre || user?.email}</h1>
      <p>Pulpería: {profile?.pulperia_nombre}</p>
    </div>
  );
}
```

### Formulario de Login (Client Component)

```typescript
// app/(auth)/login/LoginForm.tsx
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@pulperia.com"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="contraseña"
        required
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit">Ingresar</button>
    </form>
  );
}
```

### Row-Level Security (RLS)

```sql
-- Habilitar RLS en tabla de fiados
ALTER TABLE fiados ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo ve fiados de su pulpería
CREATE POLICY "Usuarios ven sus propios fiados"
ON fiados FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clientes
    WHERE clientes.id = fiados.cliente_id
    AND clientes.pulperia_id = (
      SELECT pulperia_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Política: solo pueden crear fiados en su pulpería
CREATE POLICY "Usuarios crean fiados en su pulpería"
ON fiados FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clientes
    WHERE clientes.id = cliente_id
    AND clientes.pulperia_id = (
      SELECT pulperia_id FROM profiles WHERE id = auth.uid()
    )
  )
);
```

## Decisiones Relacionadas

- [[ADR-001-persistencia.md]] - PostgreSQL con Row-Level Security
- Hosting en Vercel (integración con Next.js)

## Referencias

- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [@supabase/ssr for Next.js](https://supabase.io/docs/guides/auth/auth-helpers/nextjs)
- [OAuth 2.0 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
