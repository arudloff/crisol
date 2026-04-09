# CRISOL — Estado actual
> Última actualización: 2026-04-08

## Estado general
CRISOL es una plataforma web de investigación doctoral que integra lectura académica profunda, escritura, gestión de proyectos y herramientas de IA. En producción (v4.0) con BYOK y sistema de invitaciones. Post-refactorización de projects.js completada.

## Lo que funciona hoy
- Procesamiento de artículos académicos (SILA) — completa
- Editor de documentos con auto-save y sync — completa
- Sistema de proyectos con equipos — completa
- Tablero Kanban — completa
- PRISMA (síntesis de investigación) — completa
- Flashcards con sync a Anki — completa
- Autenticación + invitaciones — completa
- Backup local y web — completa
- Búsqueda de artículos — completa
- Text-to-speech y dictado — completa
- Notificaciones in-app — completa
- Dashboard con métricas — completa
- Observabilidad (error_log, audit_trail, window.onerror) — completa
- Schema versioning — completa

## Último hito completado
**2026-04-08 — Sprint S5: Limpieza fina (FF-U4.2, FF-DU1b, FF-C1.3, FF-C3.1)**
- Dependencias circulares: 0 encontradas (PASS — estimado original era impreciso)
- Tablas sin RLS: 0 (PASS — todas las 19+ tablas tienen RLS + hardening)
- Write ops sin feedback: 8 toasts agregados (editor: create/clone/delete/rename, projects: removeArticle, flashcards: create/edit/delete)
- state._ fuera de app.js: 12 instancias identificadas (mayoría son `_isPrisma` toggle en navegación). Documentado como deuda técnica menor — requiere refactorización de navegación centralizada
- 33/33 tests pasan

**2026-04-08 — Sprint S4: God files (FF-DU1)**
- articles.js: 1,463 → 867 líneas (-41%), 3 módulos nuevos
  - articles-help.js (296): renderAyuda
  - articles-panels.js (234): 6 renderers de paneles
  - articles-notes.js (115): notas, export IA, keyboard
- editor.js: 1,191 → 971 líneas (-18%), 2 módulos nuevos
  - editor-templates.js (109): DOC_TEMPLATES (datos estáticos)
  - editor-export.js (131): export APA/txt/clipboard/docx
- prisma.js: 888 → 592 líneas (-33%), 1 módulo nuevo
  - prisma-tabs.js (310): 6 renderers de tabs PRISMA
- Total: 6 módulos nuevos, todos <310 líneas
- 33/33 tests pasan

**2026-04-08 — Sprint S3: Código muerto + duplicados (FF-U2.1, FF-U2.2)**
- Dead export eliminado: `getViewingUser()` en prisma.js
- Export innecesario: `moveSectionDir()` en editor.js → private
- `calcProgress()` consolidado: eliminada copia duplicada de utils.js, storage.js es canónico
- `hl()` consolidado: eliminada copia de articles.js, importa de utils.js
- `DOC_TEMPLATES`: re-export eliminado de editor.js, copia muerta en state.js marcada
- El conteo original de "197 exports sin import" era un artefacto de herramienta imprecisa; auditoría manual confirmó 1 export muerto real + 3 duplicados
- 33/33 tests pasan

**2026-04-08 — Sprint S2: Accesibilidad (FF-U5.1, FF-U5.2, FF-U5.3)**
- `patchInteractiveElements()` extendido: auto-parchea TODOS los `[onclick]` no interactivos con `tabindex="0"`, `role`, Enter/Space
- Tabs: `role="tab"` para `.tab`, `role="tablist"` para `.topbar`
- Modales: patching extendido a `.cite-search-overlay` y `.modal-overlay` (no solo `.proj-modal-overlay`)
- 6 modales estáticos en index.html: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` con IDs en h3
- Auto-association de `<label>` sin `for` con su input sibling (cubre ~40 labels dinámicas)
- 15 inputs estáticos: `aria-label` agregado (login, profile, request, search, quick capture)
- 6 inputs de projects-team.js: `aria-label` explícito (email, checkboxes, selects sin label)
- Bonus S1: 2 escapados parciales adicionales en kanban.js corregidos con `escH()`
- 33/33 tests pasan

**2026-04-08 — Sprint S1: Auditoría y remediación XSS (FF-DU3.2)**
- Auditoría completa de 106 innerHTML en 18 archivos JS
- **28 vulnerabilidades corregidas** (4 CRITICAL, 6 HIGH, 18 WAVE-2)
- 13 archivos modificados: editor.js, search.js, app.js, tabs.js, articles.js, dashboard.js, projects-render.js, projects-logbook.js, projects-dr.js, projects-team.js, projects.js, kanban.js, flashcards.js, auth.js
- Patrón: agregar `escH()` (utils.js) a todo dato de usuario interpolado en innerHTML
- Escapado manual parcial (.replace(/"/g, '&quot;')) reemplazado por escH() completo
- 96 innerHTML confirmados SAFE (HTML estático o ya escapados)
- `escH` importado en 4 archivos que no lo tenían (editor, search, tabs, dashboard, logbook, dr, flashcards, projects)
- 33/33 tests pasan

**2026-04-08 — Refactorización de projects.js + fixes de calidad**
- projects.js: 4,670 → 714 líneas (-85%), 7 módulos nuevos
- renderProjectDash: 1,190 → 20 sub-renders de <100 líneas cada uno
- 21 state._ centralizados en app.js
- window.onerror + onunhandledrejection agregados (FF-U4.3)
- 24 catch vacíos arreglados (FF-U4.1)
- Score YUNQUE: 37% → 54% (24 checks, 13 PASS, 10 WARN, 1 FAIL)
- 33/33 tests pasan

## Audit actual (YUNQUE v2.0, 24 checks)
- **Score: 54%** — 13 PASS, 10 WARN, 1 FAIL
- **FAIL:** FF-DU1 (10 archivos > 500 líneas)
- **WARN principales:** 106 innerHTML/XSS, 148 div onclick sin keyboard, 56 modales sin ARIA, 30 duplicados, 197 exports sin import

## Próximos sprints (quality fixes)

### S1: Seguridad (XSS) — ✅ COMPLETADO (2026-04-08)
Auditados 106 innerHTML: 28 corregidos con escH(), 96 confirmados SAFE.
- FF afectada: FF-DU3.2 → debería pasar de WARN a PASS

### S2: Accesibilidad — ✅ COMPLETADO (2026-04-08)
- FF-U5.1: MutationObserver auto-parchea todos los onclick con tabindex+role+keydown
- FF-U5.2: Modales patched con role="dialog", aria-modal, aria-labelledby, Escape handler
- FF-U5.3: Labels auto-asociadas + aria-label en inputs sin label

### S3: Código muerto + duplicados — ✅ COMPLETADO (2026-04-08)
- 1 dead export eliminado, 3 duplicados consolidados (calcProgress, hl, DOC_TEMPLATES)
- Conteos originales (197/30) eran imprecisos; auditoría manual confirmó alcance real

### S4: God files — ✅ COMPLETADO (2026-04-08)
- articles.js: 1,463 → 867 (-41%), editor.js: 1,191 → 971 (-18%), prisma.js: 888 → 592 (-33%)
- 6 módulos nuevos extraídos, todos <310 líneas
- FF-DU1: de 10 archivos >500 a 7 (articles, editor, prisma aún >500 pero <1000)

### S5: Limpieza fina — ✅ COMPLETADO (2026-04-08)
- Circulares: 0 (PASS). RLS: 0 faltantes (PASS)
- 8 toasts agregados para write ops silenciosas
- state._: documentado, requiere refactorización de navegación para centralizar

## Deuda técnica conocida
- 10 archivos > 500 líneas — alta — S4 los refactoriza
- ~~106 innerHTML — media/alta — S1 los audita~~ ✅ 28 corregidos, 96 SAFE
- ~~148 divs sin keyboard — media — S2 los arregla~~ ✅ auto-patched por MutationObserver
- Migración gradual a api.js (55 llamadas directas) — media — gradual
- db.js (9 líneas, legacy) — baja — evaluar eliminación

## Cómo retomar
1. Leer este archivo
2. `cd G:\Mi unidad\Doctorado MGT\SILA\crisol`
3. `npm test` — verificar que 33/33 pasan
4. `/dev audit full` para estado actual detallado
5. Elegir sprint (S1-S5) según prioridad

## Arquitectura (C4 Level 2)
```
[Investigador] → usa → [Web App (Vanilla JS, ES modules)]
                              ↓
                        [Supabase]
                        ├── Auth (autenticación)
                        ├── PostgreSQL (22 tablas con RLS)
                        └── Storage (archivos)
                              ↓
                        [Vercel] (hosting, auto-deploy desde main)
                              ↓
                        [Resend] (emails de invitación)
```

### Módulos JS post-refactorización (29 archivos)
| Módulo | Líneas | Responsabilidad |
|--------|--------|----------------|
| projects-render.js | 1,513 | 20 sub-renders del dashboard |
| articles.js | 1,477 | Artículos (candidato a refactor S4) |
| editor.js | 1,193 | Editor de docs (candidato a refactor S4) |
| app.js | 985 | Entry point + state registrations |
| prisma.js | 891 | PRISMA (candidato a refactor S4) |
| projects-dr.js | 828 | Modo doctoral |
| projects.js | 714 | Orquestador/barrel |
| sync.js | 636 | Sync con Supabase |
| dashboard.js | 636 | Vista general |
| auth.js | 600 | Autenticación |
| (19 módulos más) | <500 | Cada uno con responsabilidad única |

## Decisiones arquitectónicas recientes
| Fecha | Decisión | Contexto | Alternativas descartadas |
|-------|----------|----------|------------------------|
| 2026-04-08 | Barrel pattern para projects.js | app.js no cambia durante migración | Cambiar todos los imports |
| 2026-04-08 | Sub-renders reciben datos (no globals) | Testeabilidad | Sub-renders leen globals |
| 2026-04-08 | state._ centralizados en app.js | Un punto canónico | Dispersos en cada módulo |
| 2026-04-08 | window.onerror + audit trail | Observabilidad | Solo console.error |
| 2026-04-08 | escH() como único sanitizador innerHTML | Consistencia, prevención XSS | DOMPurify (overkill para este caso), escapado manual parcial |
| 2026-04-08 | MutationObserver para a11y runtime patching | Cubre dinámico sin tocar cada template | Atributos inline en cada template (frágil, propenso a omisiones) |
