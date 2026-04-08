# Arquitectura de CRISOL — Referencia para /dev

## Módulos JS (22 archivos, ~14,000 líneas)

| Módulo | Líneas | Responsabilidad |
|--------|--------|----------------|
| projects.js | 4670 | UI de proyectos (god file, pendiente refactor) |
| articles.js | 1522 | Procesamiento y UI de artículos |
| editor.js | 1193 | Editor de documentos |
| app.js | 945 | Entry point, state registrations, boot |
| prisma.js | 891 | PRISMA (síntesis de investigación) |
| sync.js | 636 | Sincronización con Supabase |
| dashboard.js | 636 | Vista general / dashboard |
| auth.js | 600 | Autenticación, registro, invitaciones |
| projects-team.js | 364 | Funcionalidad de equipos en proyectos |
| kanban.js | 326 | Tablero Kanban |
| state.js | 303 | Estado global + constantes Supabase |
| tts.js | 275 | Text-to-speech |
| tabs.js | 252 | Navegación por pestañas |
| api.js | 237 | Capa centralizada Supabase (canónica) |
| utils.js | 220 | Utilidades + accessibility + late-bound wrappers |
| flashcards.js | 210 | Flashcards para Anki |
| search.js | 188 | Búsqueda de artículos |
| storage.js | 178 | Gestión de archivos/storage |
| projects-core.js | 142 | CRUD canónico de proyectos |
| notifications.js | 142 | Notificaciones in-app |
| dictation.js | 89 | Dictado por voz |
| db.js | 9 | (legacy, pendiente eliminación) |

## Patrones arquitectónicos

### Late-binding (rompe dependencias circulares)
```javascript
// En app.js — registro:
state._buildDocSidebar = buildDocSidebar;  // ← SIEMPRE con _ prefix

// En otro módulo — uso:
state._buildDocSidebar();  // ← SIEMPRE con _ prefix
```

### Window globals (para onclick inline)
```javascript
// En el módulo correspondiente:
window.openProject = openProject;

// En HTML dinámico:
onclick="openProject('id')"
```

### API centralizada (api.js)
```javascript
// CORRECTO — via api.js:
import { fetchDocs } from './api.js';
const docs = await fetchDocs(userId);

// INCORRECTO — acceso directo:
const { data } = await supabase.from('sila_docs').select('*');
```

## Tablas Supabase (20 tablas)

### Con datos de usuario (requieren RLS + user_id filter)
- sila_userdata, sila_docs, sila_kanban, sila_prisma, sila_settings
- projects, project_members, project_invitations
- articles, shared_articles
- prisma_data, notifications
- profiles, error_log, audit_log
- dr_socratic_log, dr_alerts, dr_wizard_context

### Administrativas
- invite_requests, schema_versions

## Migraciones SQL
- supabase_migration_full_schema.sql — Schema completo
- supabase_migration_rls_hardening.sql — RLS endurecido
- supabase_migration_versioning.sql — Schema versioning
- supabase_migration_observability.sql — Error log + audit trail
- supabase_migration_backups.sql — Backup tables
- supabase_migration_dr_tables.sql — Tablas /dr
- supabase_migration_invite_code.sql — Sistema de invitaciones
- supabase_migration_email_notify.sql — Notificaciones email
- supabase_migration_rls_sila_tables.sql — RLS sila tables

## Tests existentes
- tests/auth.test.js
- tests/backup.test.js
- tests/utils.test.js

## Documentación existente
- ARCHITECTURE.md — Arquitectura del proyecto
- README.md — Introducción
- SETUP.md — Guía de setup
- SMOKE_TEST.md — Checklist post-deploy
- CONTINGENCY.md — Plan de recuperación
