# CRISOL — Invariantes de Proyecto

Este archivo complementa el CLAUDE.md global (~/.claude/CLAUDE.md) con reglas específicas de CRISOL.

## Stack técnico
- Vanilla JS (ES modules), Supabase (PostgreSQL + Auth + RLS), Vercel
- 21 módulos JS, 14,000+ líneas
- 20 tablas Supabase con RLS
- Late-binding pattern: funciones registradas en `state._X` para romper dependencias circulares
- Window globals: 100+ funciones para onclick inline (legacy, migración gradual)
- api.js: capa centralizada de Supabase (canónica)

## Archivos clave
- `js/app.js` — entry point, state registrations, boot sequence
- `js/state.js` — state object + constants (Supabase URL/key en líneas 4-5)
- `js/api.js` — centralized Supabase layer
- `js/utils.js` — utilities + late-bound wrappers + accessibility
- `js/projects-core.js` — CRUD canónico de proyectos
- `supabase_migration_full_schema.sql` — schema completo

## Las 6 invariantes de CRISOL

### INV-1: Integridad referencial
- Cada `import { X }` tiene un `export` correspondiente en el archivo fuente
- Cada `state._X` usado tiene un `state._X = fn` registrado en app.js
- Cada `window.fn` en onclick inline tiene un `window.fn = fn` en algún JS
- **Por qué:** Bug real — `state._buildDocSidebar` vs `state.buildDocSidebar` rompió docs, kanban y badges

### INV-2: Fuente única de verdad
- Cada función existe en UN solo archivo
- Cada tabla Supabase se accede via api.js (no llamadas directas)
- Cada sync tiene UN solo timer por feature
- Cada localStorage key usa `userKey()` para namespace por usuario
- **Por qué:** Bug real — syncDocsToCloud existía en editor.js Y sync.js con diferente namespace

### INV-3: Aislamiento de datos
- Cada tabla tiene RLS con `auth.uid() = user_id`
- Cada query filtra por user_id (defense-in-depth)
- Cada tabla nueva se agrega al backup local Y web
- Cada migración SQL registra versión en schema_versions
- **Por qué:** Bug real — 11 políticas con `USING (true)` permitían leer datos de otros usuarios

### INV-4: Fallo visible
- Cada catch tiene `console.error('Contexto:', e)` con contexto descriptivo
- Operaciones críticas que fallan muestran `showToast('mensaje', 'error')`
- Sync failures actualizan el indicador visual
- window.onerror y unhandledrejection envían a error_log
- **Por qué:** Bug real — showToast no estaba en window, error silencioso

### INV-5: Recuperabilidad
- Toda tabla en el array TABLES de backup-local.cjs
- Toda tabla en tablesToRestore de restoreFromBackup
- Backup incluye integrity metadata (row counts)
- beforeunload flush de datos pendientes
- **Por qué:** Bug real — createFullBackup respaldaba 6 de 17 tablas, restore 11 de las respaldadas

### INV-6: Accesibilidad
- MutationObserver parchea tabindex y keydown en onclick divs
- Modales con role="dialog", aria-modal, Escape para cerrar
- Toasts con role="alert", aria-live="assertive"
- Inputs con aria-label o label for/id
- Contenido dinámico (#ct) con aria-live="polite"
- **Por qué:** Lighthouse Accessibility era ~60 antes de Sprint 10, ahora 100

## Comandos

```bash
# Tests
npm test

# Build/deploy
git push  # Vercel auto-deploy desde main

# Backup local
node backup-local.cjs
```

## Convenciones
- Commits: tipo + descripción. Ejemplo: "Sprint N: descripción del hito"
- Sin TypeScript (vanilla JS con JSDoc donde ayude)
- ES modules con import/export (no require/module.exports excepto backup-local.cjs)
- Funciones que necesitan onclick inline: registrar en window en el módulo correspondiente
