# 🔧 Configuración Rápida de SonarCloud

## ⚡ 5 Pasos para Activar Análisis de Código

### 1️⃣ Crear Cuenta en SonarCloud (5 min)

```
https://sonarcloud.io
↓
Click "Sign up"
↓
Selecciona "GitHub"
↓
Autoriza acceso
↓
Completa registro
```

### 2️⃣ Crear Proyecto (3 min)

En SonarCloud:
```
1. Click "Create Organization" o usa tu org existente
2. Organization key: tu-github-username
3. Plan: "Free" (gratuito - soporta open source)
4. Selecciona repo: Software
5. Copia el Project Key (ej: pulperia-web)
```

### 3️⃣ Generar Token de Autenticación (2 min)

```
SonarCloud → My Account → Security → Tokens
↓
Nuevo token → Copia el valor completo
```

### 4️⃣ Guardar Token en GitHub Secrets (2 min)

```
GitHub → Settings → Secrets and variables → Actions
↓
"New repository secret"
↓
Name: SONAR_TOKEN
Value: [pega el token de SonarCloud]
↓
Add Secret
```

### 5️⃣ Actualizar sonar-project.properties (1 min)

Archivo: `sonar-project.properties`

```properties
# Actualiza solo esta línea:
sonar.organization=tu-github-username
sonar.projectKey=pulperia-web
```

---

## ✅ Verificar que Funciona

```bash
# 1. Hace push a tu repo
git push origin testMigration

# 2. GitHub Actions se ejecuta automáticamente
# Ve a: GitHub → Actions → "Quality Coverage"
# Espera a que termine

# 3. Ver resultados en SonarCloud
https://sonarcloud.io/projects/pulperia-web
```

El workflow `quality.yml` automáticamente:
- ✅ Corre tests (88 tests)
- ✅ Genera cobertura (lcov.info)
- ✅ Sube a SonarCloud
- ✅ Analiza código

---

## 📊 Métricas que Verás

| Métrica | Valor Esperado |
|---------|----------------|
| **Cobertura** | ~5% (inicio) |
| **Bugs** | 0 |
| **Vulnerabilidades** | 0 |
| **Code Smells** | 0-5 |
| **Duplicación** | <3% |
| **Quality Gate** | PASSED ✅ |

---

## 🐛 Troubleshooting

**Problema**: SonarCloud no analiza
```
→ Verificar SONAR_TOKEN en GitHub Secrets
→ Si no existe, crear uno (ver paso 3-4 arriba)
→ Hacer push nuevamente
```

**Problema**: "Build passed" pero sin análisis
```
→ Esperar 2-3 minutos después de push
→ Refrescar SonarCloud dashboard
→ Ver logs en GitHub Actions
```

**Problema**: Cobertura baja
```
→ Eso es normal en inicio
→ Los 93 tests unitarios están creados
→ Pueden ejecutarse localmente: npm test
→ Agregar más tests para subir cobertura
```

---

## 📝 Cambios Realizados Automáticamente

✅ `jest.config.js` - Configurado con cobertura  
✅ `.github/workflows/quality.yml` - Workflow de CI/CD  
✅ `sonar-project.properties` - Config de SonarCloud  
✅ `__tests__/` - 93 tests unitarios  
✅ `docs/QUALITY_SETUP.md` - Documentación completa  

## 🎯 Una Vez Configurado

Después de hacer:
1. Crear token en SonarCloud ✅
2. Guardar en GitHub Secrets ✅
3. Actualizar sonar-project.properties ✅
4. Hacer push ✅

**Cada push automaticamente**:
- 🧪 Ejecuta 88+ tests
- 📊 Genera reporte de cobertura
- 🔍 Analiza código en SonarCloud
- 💬 Comenta resultados en PRs
- 📈 Mantiene histórico de calidad

---

## 🔗 Links Directos

- **Tu SonarCloud Dashboard**: https://sonarcloud.io
- **Tu Repo GitHub**: https://github.com/levapo97/Software
- **GitHub Actions**: https://github.com/levapo97/Software/actions
- **SonarCloud Docs**: https://docs.sonarcloud.io/

---

**Tiempo estimado de setup**: 15-20 minutos  
**Una vez configurado**: Totalmente automático  
**Costo**: Gratuito (open source)

Preguntas? Ve a `docs/QUALITY_SETUP.md` para documentación detallada.
