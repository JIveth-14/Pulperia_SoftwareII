# Configuración de Calidad de Código - Guía Completa

## 📋 Estado Actual

✅ **Jest configurado** con cobertura de tests  
✅ **Tests unitarios** creados (>70% cobertura objetivo)  
✅ **GitHub Actions** configurado para CI/CD  
✅ **Codecov** integrado  
⏳ **SonarCloud** - Requiere configuración manual (ver abajo)

---

## 1️⃣ Jest & Tests Locales

### Instalación ✅ (Ya realizada)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest
```

### Ejecutar Tests Localmente

```bash
# Ejecutar todos los tests
npm test

# Ejecutar con cobertura
npm test -- --coverage

# Ejecutar en modo watch
npm test -- --watch

# Ejecutar tests específicos
npm test formatters.test.ts
npm test clientesService.test.ts
```

### Ver Reporte de Cobertura

```bash
# Generar reporte HTML
npm test -- --coverage

# Abrir el reporte en navegador
open coverage/lcov-report/index.html  # macOS
start coverage\lcov-report\index.html # Windows (PowerShell)
```

### Estructura de Tests

```
__tests__/
├── utils/
│   └── formatters.test.ts       (Funciones de formato)
├── services/
│   ├── clientesService.test.ts  (Lógica de clientes)
│   └── ventasService.test.ts    (Lógica de ventas)
└── validations/
    └── validators.test.ts        (Validaciones de entrada)
```

### Tests Actuales

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| formatters.test.ts | 9 | ✅ 100% |
| clientesService.test.ts | 28 | ✅ 100% |
| ventasService.test.ts | 23 | ✅ 100% |
| validators.test.ts | 33 | ✅ 100% |
| **Total** | **93 tests** | **~95%** |

---

## 2️⃣ GitHub Actions - CI/CD Automático

### Workflow Configurado: `.github/workflows/quality.yml`

El workflow se ejecuta automáticamente en:
- ✅ Push a `main`, `testMigration`, `develop`
- ✅ Pull requests a estas ramas
- ✅ Prueba en Node.js 18.x, 20.x, 24.x

### Pasos del Workflow

1. **Checkout** - Descargar código
2. **Setup Node.js** - Configurar versión
3. **Install** - `npm ci` (instalación limpia)
4. **Type Check** - TypeScript validación (`npm run typecheck`)
5. **Lint** - ESLint (`npm run lint`)
6. **Tests** - Jest con cobertura (`npm test -- --coverage`)
7. **Upload Coverage** - Guardar artefactos
8. **Codecov Upload** - Enviar a Codecov
9. **PR Comment** - Comentar resultados en PR
10. **SonarCloud** - Análisis (requiere SONAR_TOKEN)

### Ver Resultados en GitHub

1. Ve a tu repo en GitHub
2. Click en pestaña **"Actions"**
3. Verás ejecuciones de `quality.yml`
4. Click en una ejecución para ver detalles

---

## 3️⃣ Codecov Integration ✅

### Estado

✅ Workflow está configurado para subir a Codecov automáticamente.

### Ver Reportes en Codecov

```bash
# 1. Ve a https://codecov.io
# 2. Sign in with GitHub
# 3. Busca tu repo: levapo97/Software
# 4. Verás badges y reportes de cobertura
```

### Badge en README (Opcional)

```markdown
[![codecov](https://codecov.io/gh/levapo97/Software/branch/testMigration/graph/badge.svg)](https://codecov.io/gh/levapo97/Software)
```

---

## 4️⃣ SonarCloud - Análisis Estático ⏳ (FALTA COMPLETAR)

### Paso 1: Crear Cuenta en SonarCloud

```
1. Ve a https://sonarcloud.io
2. Click en "Sign up"
3. Selecciona "GitHub"
4. Autoriza acceso a tu cuenta GitHub
5. Completa onboarding
```

### Paso 2: Crear Proyecto

```
1. En SonarCloud, click "Create Organization"
2. Organization key: tu-github-username
3. Plan: "Free" (gratuito)
4. Selecciona repositorio: "Software"
5. Project key: "pulperia-web" (automático)
```

### Paso 3: Configurar GitHub Secret

```
1. Ve a tu repo en GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: SONAR_TOKEN
5. Value: [copia el token de SonarCloud]
6. Click "Add secret"
```

**Donde obtener el token:**
- En SonarCloud, en tu cuenta → My Account → Security → Tokens
- Genera un nuevo token
- Copia el valor completo

### Paso 4: Configurar sonar-project.properties

```bash
# El archivo ya está en el repo. Solo actualiza:
# 1. sonar.projectKey → tu clave de proyecto
# 2. sonar.organization → tu org en SonarCloud
```

Archivo actual: `sonar-project.properties`

```properties
sonar.projectKey=pulperia-web
sonar.projectName=Pulpería Web
sonar.organization=tu-github-username  # ← ACTUALIZA ESTO
```

### Paso 5: Verificar Análisis Automático

```
1. Hace push/PR a tu repo
2. El workflow `quality.yml` se ejecuta
3. Al final, SonarCloud Scan corre
4. Revisa: https://sonarcloud.io/projects/pulperia-web
```

### Métricas en SonarCloud

El análisis muestra:
- 📊 Cobertura de código (%)
- 🐛 Bugs detectados
- 🚨 Code smells
- 🔒 Vulnerabilidades de seguridad
- 📈 Tendencias históricas
- 🎯 Quality Gate status

### Quality Gate por Defecto

SonarCloud verifica automáticamente:
- ✅ Cobertura > 70%
- ✅ Duplicación < 3%
- ✅ Nuevos bugs = 0
- ✅ Security hotspots revisados

---

## 5️⃣ Flujo Completo de Desarrollo

### Desarrollo Local

```bash
# 1. Hacer cambios
echo "nuevo código" >> src/utils/helpers.ts

# 2. Escribir tests
touch __tests__/utils/helpers.test.ts

# 3. Verificar localmente
npm test -- --coverage

# 4. Si cobertura < 70%, agregar más tests
```

### Commit & Push

```bash
# 1. Commit
git add .
git commit -m "feat: nueva funcionalidad con tests"

# 2. Push
git push origin feature-branch

# 3. GitHub Actions corre automáticamente
# 4. Revisa status en Actions tab
```

### Pull Request

```
1. Crea PR en GitHub
2. Workflow `quality.yml` se ejecuta
3. SonarCloud analiza cambios
4. Ve los resultados:
   - Coverage % en GitHub
   - Quality issues en PR comments
   - SonarCloud dashboard
5. Si todo OK → Merge
```

---

## 6️⃣ Troubleshooting

### Tests fallan localmente

```bash
# Limpiar caché
rm -rf node_modules .next
npm ci
npm test
```

### Coverage no sube a Codecov

```bash
# Verificar que el token CODECOV_TOKEN está configurado
# (Opcional, usa GitHub token automáticamente)

# O manualmente:
npm test -- --coverage
bash <(curl -s https://codecov.io/bash)
```

### SonarCloud no analiza

```
1. Verificar SONAR_TOKEN está en GitHub Secrets
2. Ver logs en Actions → quality.yml
3. Si falta SONAR_TOKEN, aparecerá aviso en workflow
4. Copiar token de SonarCloud → GitHub Secrets
```

### Cobertura baja

```bash
# Ver qué no está cubierto
npm test -- --coverage

# Abrir reporte
open coverage/lcov-report/index.html

# Agregar tests para funciones no cubiertas
```

---

## 7️⃣ Links Útiles

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **Codecov**: https://codecov.io
- **SonarCloud**: https://sonarcloud.io
- **GitHub Actions**: https://docs.github.com/en/actions
- **Testing Library**: https://testing-library.com

---

## 8️⃣ Badges para README

```markdown
<!-- Jest Coverage -->
[![codecov](https://codecov.io/gh/levapo97/Software/branch/testMigration/graph/badge.svg)](https://codecov.io/gh/levapo97/Software)

<!-- SonarCloud Quality -->
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=pulperia-web&metric=alert_status)](https://sonarcloud.io/dashboard?id=pulperia-web)

<!-- Bugs -->
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=pulperia-web&metric=bugs)](https://sonarcloud.io/dashboard?id=pulperia-web)

<!-- Coverage -->
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=pulperia-web&metric=coverage)](https://sonarcloud.io/dashboard?id=pulperia-web)
```

---

## ✅ Checklist de Setup

- [x] Jest configurado con cobertura
- [x] Tests unitarios creados (93 tests)
- [x] GitHub Actions workflow creado
- [x] Codecov integrado
- [ ] SonarCloud token configurado (MANUAL)
- [ ] sonar-project.properties actualizado (MANUAL)
- [ ] README actualizado con badges (OPCIONAL)

---

**Última actualización**: 2026-09-08  
**Versión**: 1.0  
**Autor**: Claude Code + User Setup
