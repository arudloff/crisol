---
name: sync
description: >
  Sincroniza los datos de CRISOL (almacenados en Supabase) con la bóveda
  Obsidian local (Google Drive). Ejecutar cada vez que regreses a tu PC después de haber
  trabajado en la app web desde otro dispositivo. También útil como respaldo periódico.
  Activar cuando el usuario diga 'sync', 'sincronizar', 'bajar datos', 'actualizar vault',
  'traer anotaciones' o similar.
---

# CRISOL Sync — Supabase → Obsidian + Anki

Descarga las anotaciones de lectura, documentos, proyectos y PRISMA hechos en CRISOL
y los escribe como notas markdown en la bóveda Obsidian local.

**App web**: https://crisol-psi.vercel.app
**Supabase project**: cupykpcsxjihnzwyflbm

## Tablas de Supabase

| Tabla | Contenido | Sync a Obsidian |
|---|---|---|
| `sila_userdata` | Anotaciones de artículos (claims, notas, progreso) | ✅ |
| `sila_docs` | Documentos/escritos del editor | ✅ |
| `sila_kanban` | Tareas del tablero Kanban | ✅ |
| `sila_prisma` | PRISMA (legacy, blob por usuario) | ✅ |
| `sila_settings` | Settings (fuentes, font size, sources) | No |
| `projects` | Proyectos (Supabase directo, con metadata JSONB) | ✅ |
| `project_members` | Membresías de proyectos | No |
| `articles` | Artículos importados (sila_data JSONB) | ✅ |
| `prisma_data` | PRISMA (nuevo, por usuario/proyecto) | ✅ |
| `notifications` | Notificaciones in-app | No |
| `profiles` | Perfiles de usuario | No |
| `project_invitations` | Invitaciones pendientes | No |
| `shared_articles` | Artículos compartidos directo | No |

## Qué sincroniza

### Artículos (sila_userdata → Obsidian)
- Reflexiones por párrafo (diálogos con la fuente)
- Claims tracker (apoya/contrasta/neutro con notas)
- Interrogación elaborativa (respuestas a ¿por qué?)
- Puente a la tesis (5 preguntas)
- Reflexiones personales
- Mapa inter-textual
- Progreso de lectura y termómetro de confianza

### Documentos (sila_docs → Obsidian)
- Todos los documentos del editor como archivos .md en `SILA_Vault/Escritos/`
- Frontmatter con metadata (título, estado, tags, template, fechas)
- Bloques de texto, citas vinculadas, notas, secciones
- Referencias al final del documento

### Proyectos (projects table → Obsidian)
- Todos los proyectos como archivos .md en `SILA_Vault/Proyectos/`
- Datos del proyecto desde `projects.metadata` JSONB
- Frontmatter con metadata (título, deadline, estado, eje, fechas)
- Lista de artículos vinculados con rol
- Lista de documentos vinculados
- Fases del workflow con estado
- Bitácora de sesiones
- Decisiones clave

### Kanban (sila_kanban → Obsidian)
- Tareas como archivo .md en `SILA_Vault/Kanban.md`
- Agrupadas por columna (Por hacer / En progreso / Hecho)

### PRISMA (prisma_data + sila_prisma → Obsidian)
- Datos de PRISMA como archivo .md en `SILA_Vault/PRISMA.md`
- 6 tabs: Jardín, Matriz, Argumento, Vacíos, Preguntas, Evolución
- Primero intentar `prisma_data` (tabla nueva), fallback a `sila_prisma` (legacy)

### Artículos importados (articles table → Obsidian)
- Artículos importados via JSON como notas de literatura en `SILA_Vault/Articulos/`
- Metadata + secciones desde `articles.sila_data`

### Flashcards (sila_userdata → Anki)
- Sincroniza flashcards: crea nuevas, actualiza editadas, elimina borradas
- Solo afecta cards con tag "SILA"
- Requiere Anki Desktop abierto con AnkiConnect (addon 2055492159)

## Cómo ejecutar

```bash
NODE_PATH="$(npm root -g)" node "G:/Mi unidad/Doctorado MGT/SILA/scripts/sync_from_cloud.js"
```

**Nota**: El script `sync_from_cloud.js` puede necesitar actualizaciones para las nuevas tablas.
Si el script no existe o está desactualizado, regenerarlo leyendo las tablas actuales de Supabase.

## Backup completo (incluido en /sync)

Cada vez que se ejecuta /sync, ADEMAS de sincronizar con Obsidian, se genera
un backup completo de todos los datos de Supabase en formato JSON.

**Carpeta de backups:** `G:/Mi unidad/RESPALDOS/CRISOL/`

**Estructura:**
```
CRISOL_backups/
├── latest.json              ← siempre el más reciente (se sobreescribe)
├── weekly/
│   ├── 2026-W14.json        ← uno por semana (mantener 12)
│   └── 2026-W15.json
└── monthly/
    ├── 2026-03.json         ← uno por mes (mantener todos)
    └── 2026-04.json
```

**Datos incluidos en el backup:**
- projects (con metadata: fases, outputs, gates, ramas, artefactos)
- documents (escritos del editor)
- dr_socratic_log (diálogo socrático)
- dr_alerts (alertas y bloqueos)
- dr_wizard_context (contexto del wizard)
- sila_userdata (anotaciones de artículos)
- invite_requests (solicitudes de invitación)

**Retención:**
- `latest.json`: se sobreescribe cada vez
- `weekly/`: guardar solo si es domingo o no existe de esta semana. Borrar mayores a 12 semanas.
- `monthly/`: guardar solo si no existe de este mes. No borrar nunca.

**Al ejecutar /sync, el flujo es:**
1. Sincronizar con Obsidian (existente)
2. Leer TODOS los datos de Supabase
3. Escribir latest.json
4. Si corresponde, escribir weekly y monthly
5. Limpiar weeklies antiguos (> 12 semanas)

## Configuración

| Variable | Valor |
|---|---|
| Supabase URL | `https://cupykpcsxjihnzwyflbm.supabase.co` |
| Supabase Anon Key | (en `SILA/crisol/js/state.js` líneas 4-5) |
| Vault Obsidian | `G:/Mi unidad/Doctorado MGT/SILA_Vault/` |
| Ruta raíz SILA | `G:/Mi unidad/Doctorado MGT/SILA/` |
| AnkiConnect | `http://127.0.0.1:8765` |

## Resultado
1. **Obsidian**: Crea/actualiza notas en el vault con frontmatter YAML compatible con Dataview
2. **Anki** (si está abierto): Sincroniza flashcards
3. **Timestamp**: Registra fecha de sync en Supabase `sila_settings` (visible en Vista General de CRISOL)

## Cuándo usar
- Al volver a tu PC después de trabajar en CRISOL desde otro dispositivo
- Como respaldo periódico de tus anotaciones
- Antes de procesar un nuevo artículo (para tener todo sincronizado)
- Después de crear/editar/eliminar flashcards en CRISOL

## Requisitos
- Anki Desktop abierto (para sync de flashcards). Si no está abierto, el sync
  de Obsidian funciona igual y muestra aviso sobre Anki.
- Conexión a internet (para acceder a Supabase)

## Artículos registrados
El script tiene un ARTICLE_MAP con los artículos conocidos. Al agregar nuevos artículos
con /sila, recordar agregar la entrada al ARTICLE_MAP en el script.
Artículos importados via JSON en CRISOL se sincronizan automáticamente desde la tabla `articles`.
