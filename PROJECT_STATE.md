# CRISOL — Estado actual
> Última actualización: 2026-04-08

## Estado general
CRISOL es una plataforma web de investigación doctoral que integra lectura académica profunda, escritura, gestión de proyectos y herramientas de IA. Está en producción (v4.0) con modelo BYOK (Bring Your Own Key) y sistema de invitaciones para nuevos usuarios.

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
- Observabilidad (error_log, audit_trail) — completa
- Schema versioning — completa
- Accesibilidad (Lighthouse 100) — completa

## Último hito completado
**2026-04-08 — Sistema de desarrollo profesional (skills /dev + /ingeniería)**
- Qué se hizo: Creación de CLAUDE.md global (15 dimensiones de calidad) + CLAUDE.md CRISOL (6 invariantes) + skill /dev (19 fitness functions) + skill /ingeniería (3 fases: estrategia, procesos, requisitos)
- Decisiones clave:
  - CLAUDE.md global en ~/.claude/ para aplicar a todos los proyectos → porque el estándar de calidad es universal
  - /ingeniería con sub-comandos (no 3 skills separados) → porque el proceso de Alejandro es recursivo/espiral
  - Fitness functions ejecutables (grep/glob) → porque las verificaciones deben ser PASS/FAIL, no sugerencias
  - Oscar Barros como columna vertebral de diseño de procesos → porque integra proceso + IT en una disciplina
- Archivos creados: CLAUDE.md (proyecto), PROJECT_STATE.md

## Próximos pasos sugeridos
1. Probar /dev con una feature real (validar que las fitness functions detectan problemas)
2. Probar /ingeniería con un diseño real (validar el flujo estrategia → procesos → requisitos)
3. Refactorizar projects.js (4670 líneas — god file pendiente desde v4.0)

## Deuda técnica conocida
- projects.js tiene 4670 líneas — alta — debe partirse en módulos (projects-ui, projects-data, etc.)
- db.js tiene 9 líneas y parece legacy — baja — evaluar eliminación
- Migración gradual a api.js — media — aún hay accesos directos a Supabase en algunos módulos
- window globals (100+) — media — patrón legacy de onclick inline, migración gradual a event listeners

## Cómo retomar
1. Leer este archivo
2. Leer CLAUDE.md del proyecto (6 invariantes)
3. Ejecutar `/dev audit full` para verificar estado actual del codebase
4. Revisar ARCHITECTURE.md para mapa de módulos
5. `npm test` para verificar que tests pasan

## Arquitectura (C4 Level 2)
```
[Investigador] → usa → [Web App (Vanilla JS, ES modules)]
                              ↓
                        [Supabase]
                        ├── Auth (autenticación)
                        ├── PostgreSQL (20 tablas con RLS)
                        └── Storage (archivos)
                              ↓
                        [Vercel] (hosting, auto-deploy desde main)
                              ↓
                        [Resend] (emails de invitación)
```

## Decisiones arquitectónicas recientes
| Fecha | Decisión | Contexto | Alternativas descartadas |
|-------|----------|----------|------------------------|
| 2026-03 | BYOK para API keys de IA | Cada usuario trae su propia key, no hay costo de API para el proyecto | API key centralizada (costosa), proxy (complejidad) |
| 2026-03 | Vanilla JS sin framework | Simplicidad, sin build step, carga rápida | React (overhead para 1 dev), Svelte (dependency) |
| 2026-03 | Supabase (no Firebase) | PostgreSQL, RLS nativo, open source | Firebase (NoSQL, vendor lock-in) |
| 2026-04 | CLAUDE.md + /dev + /ingeniería | Sistema de calidad profesional integrado en el workflow de AI | Linting + CI/CD (requiere infra que no se tiene) |
