---
name: CRISOL v3.2 PRODUCCIÓN COMPLETA
description: Sistema de producción doctoral con integridad verificable. Landing page, 12 skills /dr, 10 fases wizard, 4 agentes review, 30 principios, gates socráticos, zero-tolerance citas, ramas argumentativas, artefactos 11 tags, conexión Claude↔CRISOL via Supabase, admin invitaciones, benchmarking.
type: project
---

## CRISOL v3.2 — Producción completa (7 abril 2026)

### URLs
- Producción: https://crisol-psi.vercel.app
- GitHub: https://github.com/arudloff/crisol (private)
- Supabase: proyecto investigacion-cch (cupykpcsxjihnzwyflbm)

### Commits en GitHub: 20+

### Stack
- Frontend: Vanilla JS (ES modules) + CSS custom
- Backend: Supabase (auth + DB + RLS + realtime)
- Hosting: Vercel (deploy via /tmp por Google Drive path issue)
- IA: Claude Code con 5 familias de skills
- Archivos: Google Drive

### Landing page (pre-login)
- Tagline: "De la pregunta a la solución. Sin atajos, sin riesgos."
- Sub: "Donde la asistencia de IA se convierte en autoría demostrable"
- 4 bloques: camino claro, preguntas adaptativas, asistentes que mejoran, documentado
- 4 audiencias: investigadores, universidades, profesionales, empresas
- Guía de inicio en 4 pasos
- Botón "Iniciar sesión" tenue (usuarios existentes)
- Registro con código de invitación

### Sistema de invitaciones
- Códigos válidos: CRISOL-2026, TALCA-MGT, DR-RESEARCH
- Formulario de solicitud → tabla invite_requests en Supabase
- Panel admin (solo alejandro@chenriquez.cl): ⚙ → 📨
- Pendientes + historial (aprobadas/rechazadas)
- Al aprobar: mensaje pre-escrito copiable con email + código

### Skills — 5 familias
- /dr (12 comandos + 11 references)
- /sila (procesamiento artículos)
- /sila-v2 (versión mejorada con build scripts)
- /prisma (metarrelato investigativo)
- /sync (Supabase ↔ Obsidian)

### /dr — 12 skills
read, write, review (4 agentes), verify, humanize, mentor, devil, report, impact (4 agentes), benchmark, journal

### Wizard — 10 fases
🔭→📖→✍→🔍→🧬→📎→🧠→💎→⚖→🚀

### 3 modos por proyecto
🧬 /dr · 🔬 clo-author · 🔗 Mixto

### Conexión Claude ↔ CRISOL (Supabase)
4 tablas: dr_socratic_log, dr_alerts, dr_wizard_context, invite_requests
4 flujos: gates→Claude, diálogo→CRISOL, fase→Claude, alertas→CRISOL

### Verificaciones implementadas
- Gates socráticos obligatorios (19 preguntas, 9 gates, min 20 chars)
- Zero-tolerance citas F1-F5 (gate no se salta)
- 30 principios escritura (Agente 4 en review)
- Phase-sensitive severity (×0.5 a ×1.25)
- Cross-round learning (errores recurrentes ×1.5)
- Cross-skill findings sharing

### Ramas argumentativas
- Fork desde fase activa
- 4 estados: En curso 🔵, En espera ⏸, Descartada ✗, Completada ✅
- Notas por rama (📌)
- Congelar snapshots inmutables (🧊)
- Eliminar protegido (sin sub-ramas)
- Rama activa sincronizada a Supabase para Claude

### Artefactos
- 11 tags transversales: Sustancia (4) + Proceso (3) + Integridad (3) + Otro
- Trayectoria de scores con deltas
- Portafolio descargable .md

### Auditoría cluster COEX-IA
- 21 agentes, 47 correcciones, score 79.2→87.3
- Benchmarking vs March/Teece/Kahneman/Edmondson/Bustamante
- Mapa de 35 vacíos con scores de impacto

### Documentación
- README.md, SETUP.md, ARCHITECTURE.md
- Protocolo_Workflow_Hibridado_CRISOL.docx (documento técnico para comité)
- REPORTE_AUDITORIA_DR_CLUSTER.md
- BENCHMARKING_ANCLAS_CLUSTER.md
