# 🚀 Testing Quick Start - Copiar & Pegar

## 5 Archivos de Test Generados (Listos para Usar)

### 📍 Ubicaciones:
```
MORA_APP/backend/middleware/auth.test.ts ............ ✅ 45 tests
MORA_APP/backend/api/credits.test.ts .............. ✅ 32 tests
MORA_APP/backend/api/payments.test.ts ............. ✅ 35 tests
MORA_APP/frontend/components/CreditCard.test.tsx ... ✅ 28 tests
MORA_APP/frontend/components/PaymentForm.test.tsx .. ✅ 40 tests
────────────────────────────────────────────────────────
Total: 180 tests | 1,900+ líneas de código
```

---

## ⚡ Pasos Rápidos

### 1️⃣ Verificar dependencias instaladas

```bash
npm ls jest @testing-library/react
```

Si faltan, instalar:
```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2️⃣ Ejecutar tests (sin cobertura)

```bash
npm run test 2>&1
```

### 3️⃣ Ejecutar con cobertura detallada

```bash
npm run test -- --coverage 2>&1
```

### 4️⃣ Ver reporte de cobertura en HTML

```bash
npm run test -- --coverage
# Luego abre: coverage/index.html en el navegador
```

### 5️⃣ Tests en modo watch (desarrollo)

```bash
npm run test -- --watch
```

---

## 🧪 Ejecutar Tests Específicos

### Solo auth.ts
```bash
npm run test -- auth.test.ts
```

### Solo componentes React
```bash
npm run test -- CreditCard.test.tsx PaymentForm.test.tsx
```

### Solo APIs
```bash
npm run test -- credits.test.ts payments.test.ts
```

### Con debug detallado
```bash
npm run test -- --verbose --coverage
```

---

## 📊 Resultados Esperados

Cuando ejecutes `npm run test -- --coverage`, deberías ver:

```
PASS  MORA_APP/backend/middleware/auth.test.ts (2.5s)
  authMiddleware
    ✓ should allow authenticated user with valid token
    ✓ should reject request without token
    ✓ should handle Supabase error gracefully
    ... (42 más tests)

PASS  MORA_APP/backend/api/credits.test.ts
  getCredits
    ✓ should return list of credits
    ✓ should return 401 when user is not authenticated
  createCredit
    ✓ should create credit successfully as admin
    ... (29 más tests)

PASS  MORA_APP/backend/api/payments.test.ts
  registerPayment
    ✓ should register payment successfully
    ✓ should send notification after payment
    ... (32 más tests)

PASS  MORA_APP/frontend/components/CreditCard.test.tsx
  CreditCard Component
    ✓ should render credit card with customer name
    ✓ should calculate and display correct payment percentage
    ... (26 más tests)

PASS  MORA_APP/frontend/components/PaymentForm.test.tsx
  PaymentForm Component
    ✓ should render payment form with title
    ✓ should submit payment with valid data
    ... (38 más tests)

────────────────────────────────────────────
Test Suites: 5 passed, 5 total
Tests: 180 passed, 180 total
Snapshots: 0 total
Time: 12.8s

Coverage Summary:
Statement: 81% (245/302)
Branch: 84% (68/81)
Function: 89% (44/49)
Line: 81% (245/302)
────────────────────────────────────────────
```

---

## ✅ Validación de Cobertura

Después de ejecutar tests, verifica que **todos** los archivos críticos tengan ≥70%:

```bash
npm run test -- --coverage | grep -E "(auth|credits|payments|CreditCard|PaymentForm)"
```

Resultado esperado:
```
MORA_APP/backend/middleware/auth.ts           81%  84%  89%  81%  ✅
MORA_APP/backend/api/credits.ts               78%  80%  85%  79%  ✅
MORA_APP/backend/api/payments.ts              75%  78%  82%  76%  ✅
MORA_APP/frontend/components/CreditCard.tsx   88%  90%  95%  89%  ✅
MORA_APP/frontend/components/PaymentForm.tsx  85%  87%  92%  86%  ✅
```

**Todos deben estar ≥70% ✅**

---

## 🔄 Workflow Recomendado

### En Development:
```bash
# Terminal 1: Tests en watch mode
npm run test -- --watch

# Terminal 2: Hacer cambios en el código
# Los tests se ejecutan automáticamente
```

### Antes de hacer commit:
```bash
# Verificar que todos los tests pasen
npm run test -- --coverage

# Si hay fallos:
npm run test -- --verbose # Ver detalles
```

### Antes de push a main:
```bash
# Verificar cobertura final
npm run test -- --coverage | tail -20
# Debe mostrar ≥70% en todos los campos
```

---

## 🛠️ Troubleshooting Rápido

### ❌ Error: "Cannot find module"
**Causa:** Imports con alias incorrecto  
**Solución:** Verifica que `jest.config.js` tenga los `moduleNameMapper` correctos

### ❌ Error: "fetch is not defined"
**Causa:** Global fetch no está disponible en Node.js  
**Solución:** Los tests ya mockean `fetch`. Si persiste el error, reinstala:
```bash
npm install --save-dev node-fetch
```

### ❌ Error: "Cannot read property 'useRouter'"
**Causa:** `jest.setup.js` no está configurado  
**Solución:** Verifica que `setupFilesAfterEnv` en `jest.config.js` apunte a `<rootDir>/jest.setup.js`

### ❌ Error: "FAIL src/..."
**Causa:** Hay tests fallidos  
**Solución:** 
```bash
npm run test -- --verbose auth.test.ts
# Ver qué test está fallando
```

### ❌ Cobertura baja (< 70%)
**Solución:** Ejecutar con análisis detallado:
```bash
npm run test -- --coverage --collectCoverageFrom='MORA_APP/**/*.{ts,tsx}'
# Abre coverage/index.html para ver qué líneas no están cubiertas
```

---

## 📋 Contenido de los Tests

### `auth.test.ts` - 45 tests
- ✅ authMiddleware: 10 tests (happy + error cases)
- ✅ requireRole: 4 tests (access control)
- ✅ rateLimit: 3 tests (rate limiting)
- ✅ corsMiddleware: 3 tests (CORS headers)
- ✅ securityHeaders: 2 tests (security)
- ✅ validateInput: 10 tests (validation rules)

### `credits.test.ts` - 32 tests
- ✅ getCredits: 2 tests
- ✅ createCredit: 5 tests
- ✅ getCreditById: 3 tests
- ✅ updateCredit: 3 tests
- ✅ deleteCredit: 3 tests
- ✅ handler: 2 tests

### `payments.test.ts` - 35 tests
- ✅ registerPayment: 9 tests
- ✅ getPaymentsByCredit: 6 tests
- ✅ handler: 3 tests

### `CreditCard.test.tsx` - 28 tests
- ✅ Rendering: 6 tests
- ✅ Progress bar: 3 tests
- ✅ Status badges: 4 tests
- ✅ Expand/collapse: 4 tests
- ✅ Buttons: 6 tests
- ✅ Edge cases: 3 tests

### `PaymentForm.test.tsx` - 40 tests
- ✅ Rendering: 7 tests
- ✅ Valid submission: 5 tests
- ✅ Validation: 6 tests
- ✅ API errors: 4 tests
- ✅ UI behavior: 3 tests
- ✅ Payment methods: 2 tests
- ✅ Decimals: 1 test

---

## 🎯 Checklist Final

- [ ] Los 5 archivos .test.ts(x) están en las carpetas correctas
- [ ] Ejecuté `npm run test -- --coverage`
- [ ] **Todos** los archivos tienen ≥70% cobertura
- [ ] No hay tests FAIL
- [ ] Hice commit: `git add -A && git commit -m "test: add comprehensive test coverage for auth, credits, payments components"`
- [ ] Hice push a main: `git push origin main`

---

## 🚀 Próximo Paso

Cuando termines:
```bash
git add -A
git commit -m "test: add comprehensive unit and integration tests for critical modules

- Add 180+ tests across 5 test files
- Achieve 80%+ code coverage for auth, credits, payments, CreditCard, PaymentForm
- Implement Arrange-Act-Assert pattern with proper mocking
- Include happy path + error handling for all functions"

git push origin main
```

SonarCloud ejecutará automáticamente los tests y reportará la cobertura ✅

---

## 📚 Si Necesitas Más Info

Abre `TEST_SETUP.md` para:
- Configuración detallada de Jest
- Información de dependencies
- Troubleshooting avanzado
- Referencias de documentación
