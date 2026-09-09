# ADR-001: Usar Supabase para Auth + BD

**Estado**: Aceptado  
**Fecha**: 2026-09-09  
**Impacto**: Alto - Core infraestructura  

---

## 📋 Contexto

Mora App necesita:
- Autenticación escalable (OAuth2, email)
- Base de datos relacional con RLS
- Storage para PDFs
- Sin ops (serverless preferido)

**Restricciones:**
- MVP rápido (máximo 4 semanas)
- Bajo presupuesto
- Equipo pequeño (2-3 devs)
- Escalabilidad eventual

**Alternativas evaluadas:**
1. **Supabase** (elegida) ← PostgreSQL + Auth + Storage
2. Firebase - NoSQL, vendor lock-in
3. Cognito + RDS - Más caro, más config
4. Auth0 + PostgreSQL - Más complejidad

---

## ✅ Decisión

**Usar Supabase como infraestructura unificada para Auth + PostgreSQL + Storage**

### Razón: 3 servicios en 1

```
Antes (3 servicios):
Auth0 ($100/mes) + RDS ($50/mes) + S3 ($5/mes) = $155/mes + ops

Después (Supabase):
Todo incluido: $25/mes + serverless
```

---

## 🎯 Ventajas Elegidas

### 1. **Auth Integrada**
```typescript
// Sin servidor Auth0 separado
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});

// SSO con 1 línea, no 100 líneas de config
```

**Beneficios:**
- OAuth2 nativo (Google, GitHub, etc)
- Email verification automática
- JWT tokens
- Session management
- MFA (futuro)

### 2. **PostgreSQL Relacional**
```sql
-- Relaciones naturales
CREATE TABLE credits (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  customer_id BIGINT REFERENCES customers
);

-- No hay "documentos anidados" propensos a inconsistencias
```

**Beneficios:**
- ACID garantizado
- Integridad referencial
- Consultas eficientes con JOINs
- Índices nativos

### 3. **Row-Level Security (RLS)**
```sql
-- Cada usuario solo ve sus datos
CREATE POLICY "Users see own credits"
ON credits FOR SELECT
USING (user_id = auth.uid());

-- No necesito lógica de autorización en app
```

**Beneficio:**
- Seguridad en BD (no solo app)
- Escalable (sin custom permiso checks)

### 4. **Storage Integrado**
```typescript
// PDFs de reportes en Supabase Storage
await supabase.storage
  .from('reports')
  .upload(`${creditId}.pdf`, pdfBuffer);

// Sin S3 separado
```

### 5. **Precio y Escalabilidad**
- **Tier gratuito**: 500MB, 50k filas (suficiente MVP)
- **Tier pagado**: $25/mes base + uso
- **Auto-scaling**: Sin preocupación por capacidad

### 6. **Developer Experience**
```typescript
// Supabase client es muy fluido
const { data } = await supabase
  .from('credits')
  .select('*, customer:customers(*)')
  .eq('user_id', userId);

// Type-safe si usas supabase-js con TypeScript
```

---

## ⚠️ Desventajas y Mitigación

| Desventaja | Riesgo | Mitigación |
|-----------|--------|-----------|
| **Vendor lock-in** | Salir de Supabase es difícil | PostgreSQL es open-source; migración posible |
| **Escalabilidad a millones** | PostgreSQL vertical primero | Mora App no aspira a escala web3; OK |
| **RLS curva aprendizaje** | Devs nuevos necesitan SQL | Docum. clara; SQL simple para MVP |
| **Límite de conexiones** | Conexiones simultáneas limitadas | Vercel + Supabase manejan bien serverless |

---

## 🏗️ Arquitectura Implementada

### Schema Base
```sql
-- auth.users (Supabase managed)
-- public.users (profile adicional)
-- public.credits (créditos)
-- public.payments (pagos)
-- public.customers (deudores)
-- public.audit_log (auditoría)
```

### Storage
```
├── credits/
│   └── {creditId}.pdf         (contrato)
├── reports/
│   └── {month}-report.pdf     (reporte mensual)
└── invoices/
    └── {paymentId}.pdf        (comprobante pago)
```

### Políticas de RLS
```sql
-- Gerentes ven todo (users.role = 'admin')
-- Cobradores ven solo sus créditos asignados
-- Clientes ven solo su deuda
```

---

## 📊 Comparativa: Supabase vs Alternativas

| Criterio | Supabase | Firebase | Cognito+RDS | Auth0+PG |
|----------|----------|----------|-------------|----------|
| **Setup** | 5 min | 5 min | 30 min | 20 min |
| **Costo (MVP)** | $0-25 | $0-30 | $50 | $100 |
| **SQL nativo** | ✅ | ❌ | ✅ | ✅ |
| **OAuth integrado** | ✅ | ✅ | ⚠️ | ✅ |
| **RLS en BD** | ✅ | ❌ | ⚠️ | ❌ |
| **Storage incluido** | ✅ | ✅ | ❌ | ❌ |
| **Escalabilidad** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

---

## 💻 Ejemplo Implementación

### Auth Setup
```typescript
// supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Uso
const { data, error } = await supabase.auth.signUp({
  email: 'cobrador@mora.app',
  password: 'secure-password'
});
```

### API Backend con Supabase Admin
```typescript
// api/credits.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // Server-only
);

export async function POST(req) {
  const { amount, customerId } = req.body;
  
  const { data, error } = await supabaseAdmin
    .from('credits')
    .insert([
      { amount, customer_id: customerId, user_id: req.user.id }
    ])
    .select();
    
  return Response.json(data);
}
```

### RLS en Acción
```typescript
// Frontend: usuario normal solo ve sus datos
const { data: myCredits } = await supabase
  .from('credits')
  .select('*');
// RLS: SELECT * WHERE user_id = auth.uid()

// Backend: admin ve todo (con service_key)
const { data: allCredits } = await supabaseAdmin
  .from('credits')
  .select('*');
```

---

## 🎯 Consequencias

### Positivas ✅
1. **MVP en 2 semanas** (no 4)
2. **Costo $0 inicialmente** (tier free)
3. **Escalabilidad automática**
4. **Seguridad en BD (RLS)**
5. **Sin ops**: Backups, patches, scaling automático

### Negativas ⚠️
1. **Vendor lock-in leve** (PostgreSQL es portable)
2. **SQL knowledge necesario** para features avanzadas
3. **Rate limits de Supabase** (pero generosos para MVP)

---

## 📞 Decisiones Relacionadas
- [[ADR-002-auth.md]] - Estrategia OAuth2
- [[ADR-003-api.md]] (futuro) - API REST design

---

**Revisor**: Product Lead  
**Aprobado**: 2026-09-09
