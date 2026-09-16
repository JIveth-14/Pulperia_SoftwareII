# Graphify Setup y Configuración

## ✅ Configuración Completada

Este proyecto está configurado para usar **Graphify** como herramienta de análisis local.

### 📁 Estructura de directorios

```
.graphify/              # Repositorio de Graphify (clonado)
.claude/
  ├── settings.json     # Configuración de reglas y permisos
  ├── GRAPHIFY_SETUP.md # Este archivo
  └── skills/
      └── graphify-analyze.md  # Skill para usar Graphify
```

### 🔒 Protecciones de seguridad

**En `.gitignore` está configurado para ignorar:**
- `.graphify/` - Repositorio de graphify
- `graphify-cache/` - Cache de análisis
- `graphify-output/` - Resultados de análisis
- `graphify-*.json` - Archivos de configuración

**En `settings.json` está configurado:**
- No hay commits/pushes automáticos
- Todos requieren aprobación manual

### 🚀 Cómo usar Graphify

#### Opción 1: Usar el skill directamente
```bash
/graphify-analyze
```

#### Opción 2: Análisis manual
```bash
cd .graphify
npm install
npm run analyze ../
```

### 📊 Resultados generados

Graphify generará en `graphify-output/`:
- `graph.json` - Grafo de dependencias
- `architecture.html` - Visualización interactiva
- `report.md` - Reporte en markdown

Estos archivos NO se commitean al repositorio.

### ⚙️ Configuración personalizada

Para cambiar la configuración de Graphify, edita:
- `.graphify/config.json` - Configuración de Graphify
- `.claude/settings.json` - Reglas y permisos de Claude Code

### 🔍 Acceso a Graphify

Claude Code ahora tiene acceso automático a:
- Ejecutar análisis con Graphify
- Leer resultados generados
- Usar información del análisis en las conversaciones
- **NO** hacer commits o pushes automáticos

### 📝 Notas importantes

1. **Jamás se commitea Graphify** - La carpeta `.graphify/` está en .gitignore
2. **Jamás se commitean resultados** - Toda la carpeta `graphify-output/` está ignorada
3. **Seguridad** - Todos los git commands requieren confirmación manual
4. **Local only** - Graphify solo funciona localmente en tu máquina

### 🔗 Enlaces útiles

- [Graphify Repository](https://github.com/Graphify-Labs/graphify)
- [Graphify Documentation](https://graphify.dev)

---

**Última actualización:** 2026-09-16  
**Configurado por:** Claude Code Automation
