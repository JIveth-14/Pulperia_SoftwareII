# ADR-002: OAuth2 + JWT en HttpOnly Cookies

**Estado**: Aceptado  
**Fecha**: 2026-09-09  
**Impacto**: Alto - Seguridad crítica  

---

## 📋 Contexto

Mora App maneja dinero (pagos de créditos). Necesita autenticación **robusta y segura**.

**Requisitos:**
- Autenticación con contraseña (email + password)
- OAuth2 (login con Google)
- Sin exposición de JWT en localStorage (XSS-safe)
- Refresh token automático
- MFA eventual

**Restricciones:**
- Serverless (Vercel) - sin sesiones en servidor
- Mobile-friendly
- Simple de implementar

**Alternativas:**
1. **OAuth2 + JWT en HttpOnly Cookies** (elegida)
2. OAuth2 + localStorage (XSS vulnerable)
3. Session tradicional (no serverless)
4. API Key (no user-friendly)

---

## ✅ Decisión

**OAuth2 con Supabase Auth + JWT almacenado en HttpOnly cookies**

```
Usuario → Google OAuth Login
         ↓
    Supabase Auth
         ↓
    JWT generado
         ↓
    Guardado en HttpOnly cookie
         ↓
    Frontend recibe: "Autenticado" (no ve token)
```

---

## 🎯 Por Qué Este Enfoque

### 1. **OAuth2 (No Contraseños Directos)**
```typescript
// Seguro: OAuth Google
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'https://mora.app/auth/callback' }
});

// vs Riesgoso: guardar contraseños en cliente
```

**Beneficios:**
- Google maneja seguridad de contraseña
- Sin phishing en Mora App
- MFA de Google incluido
- Social login (user experience)

### 2. **HttpOnly Cookies (XSS-Safe)**
```typescript
// HttpOnly = no accesible vía JavaScript
// Previene: document.cookie robo en XSS

// Seguro
Set-Cookie: jwt=token123; HttpOnly; Secure; SameSite=Strict

// Riesgoso
localStorage.setItem('jwt', token123) // JS puede robar
```

**Beneficios:**
- XSS no puede robar token
- CSRF mitigado con SameSite
- Refresh automático posible

### 3. **JWT (Stateless)**
```typescript
// Vercel serverless: no hay sesiones en memoria
// JWT incluye: user_id, role, exp

const decoded = jwt_decode(token);
// { user_id, role: 'cobrador', exp: 1234567890 }
```

**Beneficios:**
- No necesita BD de sesiones
- Escalable infinito
- Refresh token rotation posible

### 4. **Refresh Token Rotation**
```typescript
// Token corto (15 min): más seguro si robado
// Refresh token (7 días): en HTTP-only cookie

// Si token expira:
const newToken = await supabase.auth.refreshSession();
// Genera nuevo token, invalida viejo
```

---

## 🔐 Implementación

### Frontend (React)

```typescript
// components/Auth.tsx
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export function LoginPage() {
  const { signInWithGoogle, signOut, user } = useSupabaseAuth();

  if (user) return <Dashboard />;

  return (
    <button onClick={() => signInWithGoogle()}>
      Login con Google
    </button>
  );
}
```

### Hook Custom
```typescript
// hooks/useSupabaseAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if already logged in (cookie exists)
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, signInWithGoogle, signOut };
}
```

### Backend (Node.js)

```typescript
// middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function authMiddleware(req, res, next) {
  try {
    // JWT en cookie es automáticamente enviado por navegador
    const { data, error } = await supabase.auth.getUser(
      req.cookies.session  // Cookie HttpOnly
    );

    if (error || !data) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = data;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Uso
app.post('/api/credits', authMiddleware, (req, res) => {
  // req.user.id está validado
  const userId = req.user.id;
  // ...
});
```

---

## 🛡️ Seguridad en Detalle

### Tabla Comparativa

| Amenaza | HttpOnly Cookie | localStorage |
|---------|-----------------|---------------|
| **XSS** | ✅ Seguro | ❌ Token robado |
| **CSRF** | ✅ SameSite | ⚠️ Custom headers |
| **Token Expiry** | ✅ Auto-refresh | ❌ Manual |
| **Refresh Rotation** | ✅ Soportado | ⚠️ Complejo |

### Configuración de Cookies

```typescript
// backend/auth.ts
res.cookie('jwt', token, {
  httpOnly: true,        // No accesible vía JS
  secure: true,          // Solo HTTPS
  sameSite: 'strict',    // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
});
```

### Flujo Seguro de Login

```
1. Usuario → Login con Google
2. Supabase Auth → Genera JWT + Refresh Token
3. Backend → Valida JWT, guarda en HttpOnly cookie
4. Cookie → Automáticamente enviada en cada request
5. Servidor → Valida cookie JWT, procesa request
6. Refresh → Cada 15 min, rota tokens
```

---

## ⚠️ Desventajas y Mitigación

| Desventaja | Riesgo | Mitigación |
|-----------|--------|-----------|
| **HttpOnly: CSRF posible** | Token reutilizado | SameSite=Strict + CSRF token |
| **JWT no revocable instantáneamente** | Usuario baneado, token vigente | Token corto (15 min) + blacklist si crítico |
| **Google OAuth dependency** | Google caído = no login | Fallback a email/password |

---

## 📊 Tabla de Flujos

### Flujo 1: Login Inicial
```
Google → Callback → JWT + Refresh → HttpOnly Cookie → Dashboard
```

### Flujo 2: Refresh Automático
```
Token expira (15 min) → Frontend nota 401 → Refresh token → Nuevo JWT → Cookie
```

### Flujo 3: Logout
```
Click Logout → Supabase.signOut() → Cookie eliminada → Login page
```

---

## 💾 Ejemplo Completo

### Setup Supabase
```typescript
// supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,  // Mantiene sesión en cookies
      autoRefreshToken: true  // Refresh automático
    }
  }
);
```

### Componente Protegido
```typescript
// pages/Dashboard.tsx
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export default function Dashboard() {
  const { user, signOut } = useSupabaseAuth();

  if (!user) return <Redirect to="/login" />;

  return (
    <div>
      <h1>Bienvenido, {user.email}</h1>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### API Protegida
```typescript
// api/credits.ts
import { authMiddleware } from '@/middleware/auth';

export default async function handler(req, res) {
  // Middleware valida cookie JWT
  await authMiddleware(req, res, async () => {
    const userId = req.user.id;
    
    const { data } = await supabase
      .from('credits')
      .select('*')
      .eq('user_id', userId);
      
    res.json(data);
  });
}
```

---

## 🎯 Consequencias

### Positivas ✅
1. **Seguro**: XSS-resistant, CSRF-mitigado
2. **User-friendly**: OAuth Google, sin contraseños
3. **Serverless-ready**: Stateless, JWT
4. **Escalable**: Infinitas sesiones
5. **Refresh automático**: User experience fluido

### Negativas ⚠️
1. **Google dependency**: Si Google cae, no hay login
2. **Cookie management**: Más complejo que localStorage (pero más seguro)

---

## 🔀 Decisiones Relacionadas
- [[ADR-001-supabase.md]] - Por qué Supabase
- [[ADR-003-api.md]] (futuro) - API design

---

**Revisor**: Security Lead  
**Aprobado**: 2026-09-09
