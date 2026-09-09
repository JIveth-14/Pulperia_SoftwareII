# 🏪 Mora App - Plataforma SaaS de Gestión de Créditos

Mora App es una plataforma integral para la **gestión de créditos, cobranzas y pagos** diseñada para pequeños negocios (pulperías, comercios, prestamistas).

## 📋 Índice de Tareas Completadas

| Tarea | Descripción | Estado |
|-------|-------------|--------|
| **TAREA 4** | Arquitectura C4 + 2 ADRs | ✅ Completo |
| **TAREA 5** | Schema de BD + Migraciones SQL | ✅ Completo |
| **TAREA 6** | API Routes + Endpoints | ✅ Completo |
| **TAREA 7** | Auth Middleware + Security | ✅ Completo |
| **TAREA 8** | Frontend Components | ✅ Completo |
| **TAREA 9** | Tests Unitarios | ✅ Completo |
| **TAREA 10** | CI/CD Workflow | ✅ Completo |

---

## 🏗️ TAREA 4: Arquitectura C4 + ADRs

### Documentos
- `docs/arquitectura.md` - Diagramas C4 (Level 1-3), flujos de datos, stack tecnológico
- `docs/adr/ADR-001-supabase.md` - Decisión de usar Supabase (Auth + BD + Storage)
- `docs/adr/ADR-002-auth.md` - Estrategia OAuth2 + JWT en HttpOnly cookies

### Highlights de Arquitectura
- **Frontend**: React 18 + TypeScript (Vercel)
- **Backend**: Node.js + Express (Vercel Functions)
- **BD**: PostgreSQL en Supabase (con RLS)
- **Auth**: OAuth2 Google + Email
- **Notificaciones**: SendGrid (email) + Twilio (SMS)

---

## 🗄️ TAREA 5: Schema de BD + Migraciones

### Archivo
`supabase/migrations/001_create_tables.sql`

### Tablas Creadas (6 tablas)
1. **users** - Perfiles de usuarios (admin, cobrador, cliente)
2. **customers** - Clientes/deudores
3. **credits** - Créditos otorgados
4. **payments** - Pagos registrados
5. **assignments** - Asignación de cobradores
6. **audit_log** - Log de auditoría

### Features Implementados
- ✅ Índices en columnas de búsqueda frecuente
- ✅ Row-Level Security (RLS) para multi-tenant seguro
- ✅ Triggers automáticos (actualizar saldo, audit log)
- ✅ Funciones PL/pgSQL (cálculos, validaciones)
- ✅ Relaciones con FK y ON DELETE

### Ejecutar Migraciones
```bash
supabase db push
```

---

## 🔌 TAREA 6: API Routes + Endpoints

### Endpoints Implementados

#### Créditos
```bash
GET    /api/credits              # Listar créditos (filtrado por RLS)
POST   /api/credits              # Crear crédito (solo admin)
GET    /api/credits/:id          # Obtener detalles
PUT    /api/credits/:id          # Actualizar crédito
DELETE /api/credits/:id          # Eliminar crédito (solo admin)
```

#### Pagos
```bash
GET    /api/payments/:creditId   # Listar pagos de un crédito
POST   /api/payments             # Registrar pago
```

### Archivos
- `backend/api/credits.ts` - CRUD de créditos
- `backend/api/payments.ts` - Registrar pagos + notificaciones

### Ejemplo de Uso
```typescript
// Crear crédito
POST /api/credits
{
  "customer_id": 1,
  "amount": 100000,
  "interest_rate": 5,
  "due_date": "2026-12-31"
}

// Registrar pago
POST /api/payments
{
  "credit_id": 1,
  "amount": 50000,
  "payment_method": "cash",
  "receipt_number": "REC-001"
}
```

---

## 🔐 TAREA 7: Auth Middleware + Security

### Middleware Implementado
- ✅ `authMiddleware()` - Valida JWT de cookies HttpOnly
- ✅ `requireRole()` - Restringe por rol (admin, cobrador, cliente)
- ✅ `rateLimit()` - Limita requests (100/min por defecto)
- ✅ `corsMiddleware()` - CORS seguro
- ✅ `securityHeaders()` - Headers de seguridad (CSP, XSS, etc)
- ✅ `validateInput()` - Sanitización de entrada

### Archivo
`backend/middleware/auth.ts`

### Flujo de Autenticación
```
1. Usuario → Login con Google
2. Supabase Auth → Genera JWT
3. Backend → Valida JWT, lo guarda en HttpOnly cookie
4. Cookie → Enviada automáticamente en cada request
5. Middleware → Valida y extrae usuario
6. RLS en BD → Filtra datos por usuario
```

### Seguridad Implementada
- HttpOnly cookies (previene XSS)
- SameSite=Strict (previene CSRF)
- Refresh token rotation (15 min)
- Rate limiting (DOS protection)
- CORS restringido
- CSP headers
- SQL sanitization

---

## 🎨 TAREA 8: Frontend Components

### Componentes Creados
1. **CreditCard** - Tarjeta de crédito con detalles, progreso, acciones
2. **PaymentForm** - Formulario para registrar pagos

### Archivo
`frontend/components/`

### CreditCard Features
- ✅ Visualización de deuda
- ✅ Barra de progreso de pago
- ✅ Indicador de vencimiento
- ✅ Botones de acciones (editar, pagar, eliminar)
- ✅ Expandible para detalles

### PaymentForm Features
- ✅ Validación de monto
- ✅ Múltiples métodos de pago
- ✅ Número de recibo
- ✅ Notas
- ✅ Cálculo máximo permitido
- ✅ Feedback visual (loading, error, success)

### Uso
```tsx
<CreditCard
  credit={credit}
  onPayment={(id) => handlePayment(id)}
  onEdit={(credit) => handleEdit(credit)}
  onDelete={(id) => handleDelete(id)}
/>

<PaymentForm
  creditId={creditId}
  maxAmount={remaining}
  onSuccess={() => router.refresh()}
/>
```

---

## 🧪 TAREA 9: Tests Unitarios

### Archivo
`__tests__/credits.test.ts`

### Cobertura de Tests (50+ tests)
- ✅ Cálculos de crédito (saldo, interés, porcentaje)
- ✅ Validaciones (email, teléfono, estado)
- ✅ Transiciones de estado
- ✅ Procesamiento de pagos
- ✅ Métodos de pago válidos
- ✅ Acceso por rol (RBAC)
- ✅ Validación de tokens
- ✅ Sanitización de entrada
- ✅ Validación de fechas

### Ejecutar Tests
```bash
npm test                    # Todos los tests
npm test -- --coverage     # Con coverage report
npm test -- --watch        # Modo watch
```

---

## 🚀 TAREA 10: CI/CD Workflow

### Archivo
`.github/workflows/ci-cd.yml`

### Pipeline Completo
```
Push/PR → Tests → Lint → Build → Security Scan → Deploy → Notify
```

### Jobs Automáticos

| Job | Trigger | Acción |
|-----|---------|--------|
| **test** | push/PR | Ejecuta tests + coverage + Codecov |
| **lint** | push/PR | ESLint + TypeScript check |
| **build** | push/PR (después test) | Build frontend + backend |
| **security** | push/PR | Trivy vulnerability scanner |
| **deploy** | push main | Deploy a Vercel production |
| **migrate** | push main (post-deploy) | Aplica migraciones BD |
| **notify** | always | Notifica en Slack |
| **sonarcloud** | push/PR | Análisis SonarCloud |

### Secrets Requeridos
```bash
VERCEL_TOKEN          # Token de Vercel
VERCEL_PROJECT_ID     # ID del proyecto Vercel
VERCEL_ORG_ID         # Org ID Vercel
SUPABASE_DB_PASSWORD  # Contraseña BD Supabase
SUPABASE_ACCESS_TOKEN # Token CLI Supabase
SLACK_WEBHOOK_URL     # Webhook Slack (opcional)
SONAR_TOKEN           # Token SonarCloud (opcional)
```

### Status Badges (ejemplo)
```markdown
![Tests](https://github.com/user/mora-app/workflows/CI-CD/badge.svg)
[![codecov](https://codecov.io/gh/user/mora-app/branch/main/graph/badge.svg)](https://codecov.io/gh/user/mora-app)
```

---

## 📦 Stack Tecnológico Completo

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript | 18+ |
| **Backend** | Node.js + Express | 20+ |
| **BD** | PostgreSQL (Supabase) | 14+ |
| **Auth** | Supabase Auth | v2 |
| **Estilos** | Tailwind CSS | 3+ |
| **Testing** | Jest | 29+ |
| **CI/CD** | GitHub Actions | native |
| **Hosting** | Vercel | serverless |

---

## 🚦 Getting Started

### Prerequisitos
- Node.js 20+
- npm o yarn
- Cuenta Supabase (gratis)
- Cuenta Vercel (gratis)

### Instalación

1. **Clonar repositorio**
```bash
git clone https://github.com/user/mora-app.git
cd mora-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales Supabase
```

4. **Ejecutar migraciones**
```bash
supabase db push
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

6. **Abrir navegador**
```
http://localhost:3000
```

---

## 📊 Estructura de Proyecto

```
mora-app/
├── docs/
│   ├── arquitectura.md          # TAREA 4: Diagramas C4
│   └── adr/
│       ├── ADR-001-supabase.md  # TAREA 4: Por qué Supabase
│       └── ADR-002-auth.md      # TAREA 4: Auth strategy
├── supabase/
│   └── migrations/
│       └── 001_create_tables.sql # TAREA 5: Schema
├── backend/
│   ├── api/
│   │   ├── credits.ts           # TAREA 6: CRUD créditos
│   │   └── payments.ts          # TAREA 6: Pagos
│   └── middleware/
│       └── auth.ts              # TAREA 7: Auth + Security
├── frontend/
│   └── components/
│       ├── CreditCard.tsx       # TAREA 8: Tarjeta crédito
│       └── PaymentForm.tsx      # TAREA 8: Formulario pago
├── __tests__/
│   └── credits.test.ts          # TAREA 9: Tests
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # TAREA 10: Pipeline
└── README.md                    # Este archivo
```

---

## 🎯 Próximos Pasos

### MVP (v1.0)
- [ ] Integrar Stripe para pagos online
- [ ] Dashboard con gráficos de deudas
- [ ] Sistema de notificaciones (email + SMS)
- [ ] Generador de reportes PDF
- [ ] App mobile con React Native

### v1.1
- [ ] 2FA (autenticación de dos factores)
- [ ] Exportar datos (CSV, Excel)
- [ ] Integración con APIs de bancos
- [ ] Sistema de comisiones para cobradores
- [ ] Predicción de morosidad con ML

### v2.0
- [ ] Multi-tenancy (múltiples empresas)
- [ ] Módulo de inventario
- [ ] Punto de venta integrado
- [ ] Contabilidad automática
- [ ] Marketplace para cobros

---

## 📖 Documentación

- **Arquitectura**: `docs/arquitectura.md`
- **Decisiones**: `docs/adr/`
- **API**: Comentarios JSDoc en `backend/api/`
- **Tests**: `__tests__/credits.test.ts`
- **Deployment**: `.github/workflows/ci-cd.yml`

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver `LICENSE` para detalles.

---

## 📞 Soporte

¿Preguntas o problemas? Abre un issue en GitHub.

---

**Ultima actualización**: 2026-09-09  
**Versión**: 1.0.0 (MVP Completo)  
**Autor**: Development Team
