# CRISOL

**Donde tu investigacion toma forma.**

Plataforma de produccion doctoral con integridad verificable. Orquesta el ciclo completo de investigacion — desde la pregunta hasta la publicacion — con un sistema de skills de IA que asegura calidad sin perder autoria intelectual.

## Que es

- **Web app** para lectura academica, escritura, y gestion de proyectos doctorales
- **12 skills de IA** (/dr) para produccion, revision, humanizacion, verificacion, y mas
- **Wizard de 10 fases** con quality gates socraticos obligatorios
- **Comunicacion directa** Claude Code ↔ CRISOL via Supabase (alertas, bloqueos, dialogo socratico)
- **3 modos** por proyecto: /dr (tesis), clo-author (paper empirico), mixto

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Vanilla JS (ES modules) + CSS custom |
| Backend | Supabase (auth + DB + RLS + realtime) |
| Hosting | Vercel |
| IA | Claude Code con skills /dr |
| Archivos | Google Drive (PDFs, .docx, Obsidian vault) |

## Setup rapido

Ver [SETUP.md](SETUP.md) para instrucciones completas.

```bash
# 1. Configurar Supabase URL y KEY en js/state.js
# 2. Ejecutar supabase_migration_dr_tables.sql en Supabase Dashboard
# 3. Copiar .claude/skills/dr/ a ~/.claude/skills/dr/
# 4. Desplegar: npx vercel --yes --prod
```

## Arquitectura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para diagrama completo.

## Skills /dr

| Comando | Que hace |
|---------|---------|
| /dr read | Lectura con lente de tesis |
| /dr write | Escritor con esqueleto + estilo calibrado |
| /dr review | 4 agentes: contenido + humanizer + verificador + 30 principios |
| /dr humanize | Deteccion de 15 patrones de escritura IA |
| /dr verify | Verificacion de citas contra PDFs (F1-F5, zero tolerance) |
| /dr mentor | Preguntas socraticas, anti-sycophancy |
| /dr devil | Ataques adversariales, 4 niveles |
| /dr report | Reporte de trazabilidad (6 secciones) |
| /dr impact | Evaluacion de vacios (4 agentes, 6 dimensiones) |
| /dr benchmark | Comparacion vs publicaciones ancla (12 dimensiones) |
| /dr journal | Registro automatico de acciones |

## Licencia

Uso academico. Alejandro Rudloff Munoz, Universidad de Talca, 2026.
