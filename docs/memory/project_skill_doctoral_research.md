---
name: Skill doctoral-research - v3.0 (Claude ↔ CRISOL via Supabase)
description: Sistema híbrido con comunicación directa Claude-CRISOL. 12 skills, 10 fases, 4 agentes en review, 30 principios escritura, gates socráticos obligatorios, zero-tolerance citas, phase-sensitive severity, cross-round learning, alertas/bloqueos en tiempo real.
type: project
---

## v3.0 — Claude y CRISOL conversan directamente (7 abril 2026)

### Cambio arquitectónico fundamental

ANTES: Claude ←(investigador copia/pega)→ CRISOL
AHORA: Claude ←(Supabase)→ CRISOL

### 4 puntos de conexión implementados

| # | Flujo | Tabla Supabase | Estado |
|---|-------|---------------|--------|
| 1 | Respuestas gates → Claude lee contexto | dr_wizard_context | Código listo, tabla pendiente |
| 2 | Diálogo socrático → CRISOL personaliza gates | dr_socratic_log | Código listo, tabla pendiente |
| 3 | Fase activa wizard → Claude ajusta severidad | dr_wizard_context | Código listo, tabla pendiente |
| 4 | Alertas/bloqueos → CRISOL muestra y bloquea | dr_alerts | Código listo, tabla pendiente |

### PENDIENTE MANUAL: Ejecutar SQL en Supabase Dashboard
Archivo: G:\Mi unidad\Doctorado MGT\SILA\crisol\supabase_migration_dr_tables.sql
Crea 3 tablas: dr_socratic_log, dr_alerts, dr_wizard_context

### Skills /dr — 12 activas
humanize, journal, review (4 agentes), verify, read, write, mentor, devil, report, impact (4 agentes), benchmark

### Elementos restaurados de las inspiraciones originales
- Gates socráticos obligatorios (19 preguntas en 9 gates, min 20 chars)
- Zero-tolerance citas F1-F5 (gate verificación no se puede saltar)
- 30 principios de escritura (Agente 4 en /dr review)
- Phase-sensitive severity (×0.5 exploración a ×1.25 entrega)
- Cross-round learning (errores recurrentes ×1.5)
- Cross-skill findings sharing (cruce de hallazgos entre agentes)

### Wizard — 10 fases
🔭→📖→✍→🔍→🧬→📎→🧠→💎→⚖→🚀

### Archivos del sistema
- Skills: ~/.claude/skills/dr/ (SKILL.md + 9 references)
- CRISOL: data/wizard_config.js, js/projects.js, js/sync.js, js/articles.js
- SQL: supabase_migration_dr_tables.sql
- Auditoría: REPORTE_AUDITORIA_DR_CLUSTER.md, BENCHMARKING_ANCLAS_CLUSTER.md
- Journal: dr_journal.md
- 30 principios: references/writing_principles_30.md
