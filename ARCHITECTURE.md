# CRISOL — Arquitectura del Sistema

## Vision general

CRISOL es un exoesqueleto cognitivo para investigadores doctorales que trabajan
con IA. Orquesta el ciclo completo de produccion doctoral con integridad verificable.

```
┌─────────────────────────────────────────────────────────┐
│                    INVESTIGADOR                          │
│              (decisor, no ejecutor)                       │
├──────────────────────┬──────────────────────────────────┤
│                      │                                    │
│   CRISOL (web app)   │   Claude Code (skills /dr)        │
│   ┌──────────────┐   │   ┌──────────────────────┐       │
│   │ Wizard 10    │   │   │ 12 skills            │       │
│   │ fases        │◄──┼──►│ 4 agentes en review  │       │
│   │ Gates        │   │   │ 30 principios        │       │
│   │ socraticos   │   │   │ Phase-sensitive       │       │
│   │ Alertas      │   │   │ Cross-round learning  │       │
│   │ Trayectoria  │   │   │ Alertas/bloqueos     │       │
│   └──────┬───────┘   │   └──────────┬───────────┘       │
│          │           │              │                    │
│          └───────────┼──────────────┘                    │
│                      │                                    │
│              ┌───────▼───────┐                           │
│              │   SUPABASE    │                           │
│              │               │                           │
│              │ projects      │ ← datos de proyectos      │
│              │ documents     │ ← escritos del editor      │
│              │ sila_userdata │ ← anotaciones de lectura   │
│              │ dr_socratic   │ ← dialogo socratico       │
│              │ dr_alerts     │ ← alertas/bloqueos        │
│              │ dr_wizard_ctx │ ← contexto para Claude    │
│              └───────────────┘                           │
├─────────────────────────────────────────────────────────┤
│                    GOOGLE DRIVE                          │
│   PDFs de fuentes · .docx generados · Obsidian vault    │
└─────────────────────────────────────────────────────────┘
```

---

## Componentes principales

### 1. CRISOL (web app)

**Stack:** Vanilla JS (ES modules) + CSS custom + Supabase client
**Hosting:** Vercel
**Estado:** Objeto mutable centralizado (`state.js`)
**Patron:** Late-bound references para evitar dependencias circulares

**Modulos (19):**

| Modulo | Responsabilidad | Lineas |
|--------|----------------|--------|
| app.js | Entry point, router, globals | ~900 |
| state.js | Estado central + constantes | ~600 |
| projects.js | Proyectos + wizard DR/CLO + gates + alertas | ~3500 |
| articles.js | Lectura de articulos + seccion ayuda | ~2700 |
| editor.js | Editor de documentos | ~1800 |
| sync.js | Supabase sync + DR sync (socratic, alerts, context) | ~450 |
| dashboard.js | Dashboard global | ~1100 |
| kanban.js | Tablero Kanban | ~450 |
| prisma.js | PRISMA review tool | ~1300 |
| (otros 10) | Tabs, search, TTS, dictation, flashcards, etc. | ~1500 |

### 2. Skills /dr (Claude Code)

**Ubicacion:** `~/.claude/skills/dr/`
**Alcance:** Global (funciona en cualquier directorio)

**12 comandos:**

| Skill | Agentes | Funcion |
|-------|---------|---------|
| /dr read | 1 | Lectura con lente de tesis |
| /dr write | 1 | Escritor con esqueleto + estilo calibrado |
| /dr review | 4 paralelos | Evaluacion 6 comp + 30 principios |
| /dr humanize | 1 | Deteccion 15 patrones IA |
| /dr verify | 1 | Verificacion citas F1-F5 |
| /dr mentor | 1 | Preguntas socraticas |
| /dr devil | 1 | Ataques adversariales |
| /dr report | 1 | Reporte de trazabilidad |
| /dr impact | 4 paralelos | Evaluacion de vacios 6 dimensiones |
| /dr benchmark | 1 | Comparacion vs anclas 12 dimensiones |
| /dr journal | — | Registro de acciones |

**Principios arquitectonicos:**
- Separacion de agentes: "critics never create, creators never self-score"
- Phase-sensitive severity: x0.5 (exploracion) a x1.25 (entrega)
- Cross-round learning: errores recurrentes x1.5
- Cross-skill sharing: cruzar hallazgos entre agentes
- Anti-sycophancy: nunca validar sin cuestionar

### 3. Wizard DR (10 fases)

```
🔭 Exploracion
  → 📖 Lectura profunda
    → ✍ Escritura
      → 🔍 Revision critica
        → 🧬 Humanizacion
          → 📎 Verificacion de citas
            → 🧠 Profundizacion
              → 💎 Impacto
                → ⚖ Benchmarking
                  → 🚀 Entrega
```

**Cada fase tiene:**
- Tareas con prompts copiables y botones de descarga de skill
- Campo de output para pegar resultados de Claude
- Encadenamiento automatico (output de fase N → contexto de fase N+1)
- Gate socratico obligatorio con preguntas de verificacion + reflexion

**3 modos por proyecto:**
- 🧬 /dr — tesis, ensayos teoricos, espanol
- 🔬 clo-author — paper empirico, R, LaTeX, ingles
- 🔗 Mixto — ambos simultaneamente

### 4. Comunicacion Claude ↔ CRISOL

```
CRISOL escribe → Supabase ← Claude lee
  - Respuestas socraticas de gates (dr_socratic_log)
  - Fase activa del wizard (dr_wizard_context)

Claude escribe → Supabase ← CRISOL lee
  - Dialogo socratico de /dr mentor (dr_socratic_log)
  - Alertas y bloqueos (dr_alerts)
```

**Flujo del ciclo:**
1. Investigador avanza fase en CRISOL → contexto se sincroniza a Supabase
2. Investigador ejecuta /dr en Claude → Claude lee contexto (fase, severidad)
3. Claude detecta problema → escribe alerta en Supabase
4. Investigador abre CRISOL → ve alerta/bloqueo
5. Investigador completa gate → respuestas socraticas van a Supabase
6. Claude lee respuestas → personaliza siguiente interaccion

### 5. Quality gates

**9 gates con preguntas socraticas obligatorias (19 preguntas total).**

Cada gate tiene dos secciones:
- 📋 Verificacion (dropdowns): checks rapidos
- 🧠 Reflexion socratica (textareas obligatorios, min 20 chars): pensamiento profundo

**Gate de verificacion:** No se puede saltar. Zero-tolerance para defectos de cita F1-F5.

### 6. Sistema de evaluacion

**/dr review — 4 agentes paralelos:**
1. Critico de contenido (CT + PL + RM + IA)
2. Humanizer (anti-IA, 15 patrones)
3. Verificador de citas (TF, F1-F5)
4. Evaluador de 30 principios de escritura (A1-F5)

**Score compuesto:**
```
Score = (CT x 0.25) + (PL x 0.15) + (RM x 0.20) + (IA x 0.15) + (antiIA x 0.15) + (TF x 0.10)
```

**Quality gates:**
- BORRADOR: ≥70
- CAPITULO: ≥80, cada componente ≥70
- ENTREGA: ≥90, cada componente ≥80, zero defectos cita

**/dr impact — 4 agentes paralelos:**
1. Explorador de vacios
2. Evaluador de originalidad (O, N) — adversarial
3. Evaluador de utilidad (U, G) — adversarial
4. Evaluador de rigor (C, R) — adversarial

**6 dimensiones (max 24 por vacio):**
O (originalidad), N (novedad), U (utilidad), C (claridad), G (generalidad), R (rigor)

**/dr benchmark — 12 dimensiones vs anclas:**
Originalidad, base empirica, rigor, profundidad, alcance, actualidad,
verificabilidad, posicionamiento, constructos, interdisciplinariedad,
claridad de tesis, potencial de citacion.

---

## Flujo de datos

### Articulo nuevo (flujo completo)

```
1. Crear proyecto en CRISOL → activar modo /dr
2. Exploracion: formular pregunta → /dr mentor → gate socratico
3. Lectura: /dr read fuentes → fichas → gate
4. Escritura: /dr write borrador → gate autoria
5. Critica: /dr review (4 agentes) → score → correcciones → re-review
6. Humanizacion: /dr humanize → score anti-IA → correcciones
7. Verificacion: /dr verify → F1-F5 → zero tolerance → gate bloqueante
8. Profundizacion: /dr mentor + /dr devil → respuestas escritas → gate
9. Impacto: /dr impact (4 agentes) → vacios → posicionamiento
10. Benchmarking: /dr benchmark vs anclas → brechas → ajustes
11. Entrega: /dr report + portafolio → score ≥90 → exportar
```

### Datos que persisten

| Dato | Donde | Formato |
|------|-------|---------|
| Proyecto + wizard | Supabase projects.metadata | JSON |
| Outputs pegados | Supabase projects.metadata.drOutputs | JSON |
| Respuestas gates | Supabase projects.metadata.drGateRecords | JSON |
| Dialogo socratico | Supabase dr_socratic_log | Tabla |
| Alertas | Supabase dr_alerts | Tabla |
| Contexto wizard | Supabase dr_wizard_context | Tabla |
| Journal | Archivo local dr_journal.md | Markdown |
| Articulos procesados | Supabase sila_userdata | JSON |
| Documentos | Supabase documents | JSON |

---

## Inspiraciones

| Fuente | Que tomamos | Que adaptamos |
|--------|------------|--------------|
| clo-author (Sant'Anna) | Worker-critic pairs, phase-sensitive severity | Adaptado a escritura doctoral, no empirica |
| academic-research-skills | Socratic mentor, anti-sycophancy, integrity verification | 5-type taxonomy de citas, gates obligatorios |
| claude-scholar | Writing-anti-AI scoring | 15 patrones calibrados a estilo del investigador |
| academic-writing-agents | 30 writing principles, cross-agent sharing | Adaptado a management journals |
| Corley & Gioia (2011) | Originalidad + Utilidad como dimensiones | Framework de 6 dimensiones para impacto |
| Whetten (1989) | What-How-Why-When para teoria | Rigor causal como dimension evaluable |
| Edmondson (1999) | Ciclo concepto → validacion → adopcion | Norte para fase empirica futura |

---

## Versionamiento

| Version | Fecha | Cambio principal |
|---------|-------|-----------------|
| v1.0 | 2026-04-05 | 8 skills + wizard 8 fases + 3 modos |
| v2.0 | 2026-04-06 | Auditoria cluster + benchmarking + impact + 30 principios |
| v3.0 | 2026-04-07 | Conexion Claude↔CRISOL via Supabase + gates socraticos + zero-tolerance |
