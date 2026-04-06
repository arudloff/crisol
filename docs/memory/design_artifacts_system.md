---
name: Diseño sistema de artefactos y documentación - para revisión
description: Diseño completo del sistema de 3 niveles de documentación + registro de artefactos con URLs por fase. Listo para revisión del investigador antes de implementar.
type: project
---

# Sistema de Artefactos y Documentación del Proceso /dr

## El problema que resuelve

Hoy el proceso produce información valiosa que se pierde o queda dispersa:
- Outputs pegados en CRISOL sin estructura
- Archivos en Google Drive sin vínculo al proceso
- Scores sin trayectoria visible
- Decisiones de gates sin registro accesible
- Reflexiones del investigador sin lugar formal

El sistema propuesto hace visible lo invisible: convierte el proceso en
un portafolio trazable que demuestra rigor ante el comité.

---

## Dónde se agregan las URLs en cada fase

Cada fase del wizard tendría una sección **"📎 Artefactos"** colapsable
al final de las tareas. No reemplaza los outputs — los complementa con
estructura.

```
🔭 Exploración
  ☑ Formular pregunta
  ☑ Verificar gap
  ☑ Definir estrategia
  ☐ Ejecutar búsqueda
  ☐ Posicionar argumento
  ▸ 📎 Artefactos de esta fase (2)
      📊 Mapa de fuentes priorizadas — R1 — 2026-04-07 — [📁 Drive]
      💎 Posición tentativa v1 — R1 — 2026-04-07 — [📁 Drive]
      [+ Artefacto]
```

### Mapa de artefactos por fase

| Fase | Artefactos típicos | Trigger nivel 1 (automático) |
|------|-------------------|------------------------------|
| 🔭 **Exploración** | Mapa de fuentes, posición tentativa, string de búsqueda | Gate completado → doc de decisión |
| 📖 **Lectura** | Fichas de explotación, tabla de conexiones | Cada ficha pegada → sugerir registro |
| ✍ **Escritura** | Esqueleto aprobado, borrador v1/v2/v3 | Cada versión → auto-registrar con # iteración |
| 🔍 **Crítica** | Tabla de scores R1/R2/R3, lista de deducciones | Score pegado → auto-registrar con delta |
| 🧬 **Humanización** | Score anti-IA, tabla de patrones detectados | Score pegado → auto-registrar con delta |
| 📎 **Verificación** | Tabla de verificación, lista de errores F1-F5 | Score pegado → auto-registrar |
| 🧠 **Profundización** | Preguntas del mentor, ataques del diablo, respuestas | Gate completado → doc con pregunta clave + respuesta |
| 💎 **Impacto** | Mapa de vacíos, tabla O/N/U/C/G/R, párrafos posicionamiento | Cada vacío registrado → auto-registrar |
| ⚖ **Benchmarking** | Tabla comparativa vs anclas, análisis de brechas | Benchmarking completado → auto-registrar |
| 🚀 **Entrega** | Reporte trazabilidad, documento final, portafolio | Reporte generado → auto-registrar |

---

## Los 3 niveles de documentación

### Nivel 1 — Automático (el sistema genera sin preguntar)

Momentos donde SIEMPRE se crea artefacto:

| Trigger | Qué se genera | Contenido |
|---------|--------------|-----------|
| Gate completado | `Gate_[fase]_[fecha].md` | Respuestas del gate + decisión (pasó/saltó) |
| Score pegado en output con cambio vs anterior | `Score_[fase]_R[N]_[fecha].md` | Score actual + delta + componentes si están |
| Fase marcada como completada | `Resumen_[fase]_[fecha].md` | Artefactos de la fase + outputs + decisiones |
| Benchmarking ejecutado | `Benchmark_[fecha].md` | Tabla comparativa + brechas + techo |
| Reporte de trazabilidad generado | `Trazabilidad_[proyecto]_[fecha].md` | Ya existe esta función |

**Implementación:** Estos se generan como datos en `proj.drArtifacts[]`.
No son archivos en disco — son registros con metadata que el portafolio
luego agrega en un `.md` descargable.

**Para vincular con Google Drive:** Cuando el investigador genera el archivo
físico (ej: ejecuta `node gen_A1.js` y obtiene el .docx), agrega el enlace
al artefacto correspondiente haciendo click en "📁 Agregar enlace".

### Nivel 2 — Sugerido (Claude sugiere, el investigador decide)

Patrones que Claude detecta en el output pegado y sugiere formalizar:

| Patrón detectado | Sugerencia | Cómo se muestra |
|-----------------|-----------|-----------------|
| Output contiene tabla con `\| Componente \| Score` | "Este output parece contener scores. ¿Registrar como artefacto de score?" | Badge amarillo debajo del textarea |
| Output contiene `## Ficha de lectura` | "Parece una ficha de explotación. ¿Registrar?" | Badge amarillo |
| Output contiene `## Abogado del Diablo` o `## Mentor Socrático` | "Sesión de profundización detectada. ¿Registrar?" | Badge amarillo |
| Output contiene `Score anti-IA:` seguido de número | "Score anti-IA detectado: [N]. ¿Registrar con score?" | Badge amarillo con score pre-llenado |
| Segundo output en misma fase+tarea (iteración) | "Ya hay un artefacto R1 para esta tarea. ¿Registrar como R2?" | Badge con delta estimado |

**Implementación:** Al hacer `onblur` del textarea de output, una función
`detectArtifactPattern(value)` busca patrones regex. Si encuentra, muestra
un badge-sugerencia debajo del textarea. Un click registra. Ignorar es válido.

**No es intrusivo:** Es un badge pasivo, no un modal ni una alerta. El
investigador lo ve, decide, y sigue. Si lo ignora, no pasa nada.

### Nivel 3 — Discrecional (el investigador solicita)

El investigador decide que algo merece ser documentado:

| Acción | Cómo |
|--------|------|
| Desde el wizard | Click "📎 + Artefacto" en la sección de artefactos de la fase |
| Desde Claude Code | "Claude, formaliza esto como documento de [tipo]" |
| Desde el dashboard | Click "+ Artefacto" en la sección agregada |

**Formulario rápido (3 campos mínimos):**
- Nombre (pre-llenado con fase + fecha)
- Tipo (auto-sugerido según fase activa)
- Score (opcional, solo si aplica)

**Campos opcionales (expandibles):**
- Enlace Google Drive
- Notas/reflexión
- Status (draft/reviewed/final)

---

## Estructura visual en el wizard

### Vista por fase (inline)

```
┌─────────────────────────────────────────────────────┐
│ 🔍 /dr: Revisión crítica                    ocultar│
│                                                     │
│ ☑ Ejecutar /dr review sobre el borrador    📥 Skill │
│ ☐ Analizar tabla de scores                    ▸     │
│ ☐ Corregir debilidades                        ▸     │
│ ☐ Re-ejecutar /dr review                      ▸     │
│                                                     │
│ ▸ 📎 Artefactos de esta fase (3)                    │
│   ┌─────────────────────────────────────────────┐   │
│   │ 🎯 Score R1 — 72 — 2026-04-05 — draft      │   │
│   │ 🎯 Score R2 — 78 (+6) — 2026-04-06 — draft │   │
│   │ 🎯 Score R3 — 85 (+7) — 2026-04-07 — ✅    │   │
│   │                                             │   │
│   │ [+ Artefacto]                               │   │
│   └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Vista agregada (dashboard del proyecto)

```
┌─────────────────────────────────────────────────────┐
│ ▶ 📎 Artefactos del proceso                    23  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Trayectoria de scores:                              │
│ Review:  [72]──[78 +6]──[85 +7]──[91 +6]          │
│ Anti-IA: [68]──[82 +14]──[88 +6]                   │
│ TF:      [49]──[75 +26]                            │
│                                                     │
│ ▸ 🔭 Exploración (2 artefactos)                    │
│ ▸ 📖 Lectura (5 artefactos)                        │
│ ▾ 🔍 Revisión crítica (4 artefactos)               │
│   🎯 Score R1 — 72 — draft                         │
│   🎯 Score R2 — 78 (+6) — draft                    │
│   🎯 Score R3 — 85 (+7) — reviewed                 │
│   📝 Borrador v3 — 2026-04-07 — [📁 Drive]        │
│ ▸ 🧬 Humanización (2 artefactos)                   │
│ ▸ ⚖ Benchmarking (1 artefacto)                    │
│                                                     │
│ [+ Artefacto]  [📊 Descargar portafolio .md]       │
└─────────────────────────────────────────────────────┘
```

### Detalle de un artefacto (expandido)

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Score R2 — Revisión crítica                      │
│ Fecha: 2026-04-06 · Iteración: 2 · Delta: +6       │
│ Score: 78/100 · Status: draft                       │
│                                                     │
│ Enlace: [📁 Agregar enlace de Google Drive]         │
│                                                     │
│ Reflexión del investigador:                         │
│ ┌─────────────────────────────────────────────┐     │
│ │ Subió porque corregí CT03 (salto de nivel)  │     │
│ │ y agregué March. PL sigue bajo — falta      │     │
│ │ posicionamiento contra Dreyfus.             │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ⚠ Score bajó en TF (-3). Revisar refs faltantes.   │
└─────────────────────────────────────────────────────┘
```

---

## Alertas contextuales (cuando algo baja)

Cuando un artefacto tiene delta negativo, se muestra inline:

| Condición | Alerta |
|-----------|--------|
| Score review baja | "⚠ Score bajó [N] puntos. Revisar deducciones CT/PL/RM." |
| Score anti-IA baja | "⚠ Anti-IA bajó. Revisar patrones C01-C03 en última edición." |
| Score TF baja | "⚠ Trazabilidad bajó. ¿Se agregaron citas sin verificar?" |
| Gate saltado | "⚠ Gate [fase] fue saltado. Considerar completar antes de entrega." |

No son modales ni bloqueos — son badges informativos que aparecen en la
trayectoria de scores. Recompensan atención, no interrumpen.

---

## Portafolio descargable

Botón "📊 Descargar portafolio .md" genera:

```markdown
# Portafolio del Proceso Investigativo
## [Nombre del proyecto]
### Generado: [fecha]

## Trayectoria de scores
| Fase | Tipo | R | Fecha | Score | Δ | Estado |
|------|------|---|-------|-------|---|--------|
| Crítica | Score | 1 | 2026-04-05 | 72 | — | draft |
| Crítica | Score | 2 | 2026-04-06 | 78 | +6 | draft |
| Crítica | Score | 3 | 2026-04-07 | 85 | +7 | final |

## Artefactos por fase

### 🔭 Exploración (2)
- Posición tentativa v1 — 2026-04-01 — [Drive](url)
  > "Partí con hipótesis demasiado amplia..."

### 🔍 Revisión crítica (4)
- Score R1 — 72 — draft
- Score R2 — 78 (+6) — draft
  > "Subió por CT03 corregido + March agregado"
- Score R3 — 85 (+7) — final
- Borrador v3 — [Drive](url)

## Reflexiones del investigador
[Todas las notas en orden cronológico]

## Decisiones en gates
[Gates completados con respuestas]

## Benchmarking
[Tabla vs anclas si existe]
```

---

## Datos técnicos

### Modelo de datos

```javascript
proj.drArtifacts = [
  {
    id: '1kx4f7',              // Date.now().toString(36)
    name: 'Score R2',           // Nombre del artefacto
    phase: 'dr_critica',        // Fase del wizard
    task: 0,                    // Índice de tarea (nullable)
    type: 'score',              // Tipo (ver ARTIFACT_TYPES)
    date: '2026-04-06',         // Fecha ISO
    iteration: 2,               // Auto-calculado
    score: 78,                  // Numérico (nullable)
    delta: 6,                   // vs iteración anterior (auto)
    status: 'draft',            // draft | reviewed | final
    link: '',                   // URL Google Drive
    notes: 'Subió por CT03...',  // Reflexión del investigador
    auto: false                 // true si fue auto-generado
  }
]
```

### Tipos de artefacto

```javascript
var ARTIFACT_TYPES = {
  score:     { label: 'Tabla de scores',       icon: '🎯' },
  draft:     { label: 'Borrador',              icon: '📝' },
  ficha:     { label: 'Ficha de explotación',  icon: '📖' },
  verify:    { label: 'Verificación de citas', icon: '📎' },
  mentor:    { label: 'Sesión mentor/diablo',  icon: '🧠' },
  position:  { label: 'Posicionamiento',       icon: '💎' },
  benchmark: { label: 'Benchmark comparativo', icon: '⚖' },
  report:    { label: 'Reporte',               icon: '📊' },
  gate:      { label: 'Decisión de gate',      icon: '🚧' },
  final:     { label: 'Documento final',       icon: '🚀' },
  humanize:  { label: 'Análisis anti-IA',      icon: '🧬' },
  other:     { label: 'Otro',                  icon: '📌' }
};
```

### Funciones principales

| Función | Qué hace |
|---------|----------|
| `addArtifact(projId, data)` | Crea artefacto, auto-calcula iteración y delta |
| `quickRegisterArtifact(projId, phase, task)` | Pre-llena desde contexto, formulario mínimo |
| `removeArtifact(projId, id)` | Elimina con confirmación |
| `updateArtifactNotes(projId, id, notes)` | Guarda reflexión |
| `updateArtifactLink(projId, id, url)` | Agrega enlace Drive |
| `generatePortfolio(projId)` | Genera .md descargable |
| `detectArtifactPattern(text)` | Regex para sugerencias nivel 2 |
| `autoCreateGateArtifact(projId, gate, data)` | Hook en completeDrGate |

---

## Flujo del investigador (ejemplo concreto)

1. Ejecuta `/dr review` en Claude Code → obtiene tabla de scores
2. Pega output en CRISOL → aparece badge: "🎯 Score detectado: 78. ¿Registrar?"
3. Click → formulario pre-llenado: nombre "Score R2", tipo "score", score 78, delta +6
4. Click "Guardar" → artefacto registrado
5. En la vista agregada, la trayectoria muestra: [72]──[78 +6]
6. Genera `.docx` con `node gen_A1.js` → sube a Drive → copia enlace
7. Click "📁 Agregar enlace" en el artefacto "Borrador v3" → pega URL
8. Escribe reflexión: "Subió porque corregí CT03..."
9. Al final del proceso, click "📊 Descargar portafolio" → `.md` completo

---

## Tipos de enlace por artefacto

Cada artefacto puede tener:
- **Un enlace** a un documento específico (ej: el .docx del borrador)
- **Varios enlaces** a documentos relacionados (ej: el .docx + el PDF compilado)
- **Un enlace a carpeta** (ej: carpeta "Fuentes A1" con los PDFs verificados)

Cada enlace lleva su propia descripción corta.

### Modelo de enlaces

```javascript
// Dentro de cada artefacto:
links: [
  { url: 'https://drive.google.com/...', desc: 'Borrador A1 v3.docx', tag: 'borrador' },
  { url: 'https://drive.google.com/...', desc: 'PDFs de fuentes verificadas', tag: 'fuentes' }
]
```

### Tags predefinidos + campo libre

```javascript
var ARTIFACT_TAGS = [
  { id: 'borrador',      label: 'Borrador',           color: '#90C8F0' },
  { id: 'final',         label: 'Documento final',    color: '#5DBB8A' },
  { id: 'score',         label: 'Score / Evaluación',  color: '#E8A838' },
  { id: 'fuentes',       label: 'Fuentes / PDFs',     color: '#9B7DCF' },
  { id: 'verificacion',  label: 'Verificación',       color: '#E07050' },
  { id: 'ficha',         label: 'Ficha de lectura',   color: '#2dd4bf' },
  { id: 'posicionamiento', label: 'Posicionamiento',  color: '#C5A3FF' },
  { id: 'benchmark',     label: 'Benchmarking',       color: '#FFD700' },
  { id: 'reflexion',     label: 'Reflexión',          color: '#F0A0C0' },
  { id: 'gate',          label: 'Decisión de gate',   color: '#A0D0A0' },
  { id: 'reporte',       label: 'Reporte',            color: '#80B0E0' },
  { id: 'otro',          label: 'Otro',               color: 'var(--tx3)' }
];
```

Visual de un enlace con tag:

```
[borrador] Borrador A1 v3.docx  📁
[fuentes]  Carpeta PDFs A1      📁
[otro: metodología] Notas de campo  📁
```

Los tags se muestran como pills de color. "Otro" muestra campo de texto
para que el investigador escriba el tag personalizado.

Selección en el formulario:

```
Tag: [borrador ▾] [score ▾] [fuentes ▾] ... [otro: ________]
```

Beneficio: permite filtrar en la vista agregada — "mostrar solo borradores"
o "mostrar solo scores" — y en el portafolio agrupar por tag.

### El wizard indica qué enlaces espera

Cada fase tiene artefactos **esperados** con placeholder que guía al
investigador. No son obligatorios — son sugerencias de qué vincular.

```
📎 Artefactos de esta fase

  Esperados:
  🎯 Tabla de scores — [📁 Agregar enlace] — "Pega aquí el enlace al reporte de scores"
  📝 Borrador revisado — [📁 Agregar enlace] — "Pega el enlace al .docx corregido"

  Registrados:
  🎯 Score R1 — 72 — 2026-04-05
     📁 Reporte scores R1.md — https://drive.google.com/...
  🎯 Score R2 — 78 (+6) — 2026-04-06
     📁 Reporte scores R2.md — https://drive.google.com/...
     📁 Borrador A1 v2.docx — https://drive.google.com/...

  [+ Artefacto personalizado]
```

### Artefactos esperados por fase

| Fase | Artefactos esperados | Descripción guía |
|------|---------------------|-----------------|
| 🔭 **Exploración** | Pregunta de investigación | "Documento con pregunta formulada, gap identificado" |
| | Mapa de fuentes | "Carpeta o lista de PDFs priorizados" |
| | Posición tentativa | "Documento con argumento inicial" |
| 📖 **Lectura** | Fichas de explotación | "Una por cada fuente leída con /dr read" |
| | Carpeta de PDFs | "Carpeta Drive con los PDFs de fuentes" |
| ✍ **Escritura** | Esqueleto aprobado | "Esqueleto argumental que aprobaste" |
| | Borrador | "Cada versión del borrador (.docx)" |
| 🔍 **Crítica** | Tabla de scores | "Reporte de /dr review con scores por componente" |
| | Lista de correcciones | "Documento con las deducciones corregidas" |
| 🧬 **Humanización** | Score anti-IA | "Reporte de /dr humanize con detecciones" |
| | Texto corregido | "Versión con patrones IA eliminados" |
| 📎 **Verificación** | Tabla de verificación | "Tabla de citas verificadas vs PDFs" |
| | PDFs faltantes | "Lista de PDFs pendientes de obtener" |
| 🧠 **Profundización** | Sesión mentor | "Output de /dr mentor con preguntas clave" |
| | Sesión diablo | "Output de /dr devil con ataques" |
| | Respuestas escritas | "Tus respuestas al mentor y al diablo" |
| 💎 **Impacto** | Mapa de vacíos | "Tabla de vacíos con scores O/N/U/C/G/R" |
| | Párrafos de posicionamiento | "Documento con párrafos insertados" |
| ⚖ **Benchmarking** | Tabla comparativa | "Reporte de benchmarking vs anclas" |
| | Análisis de brechas | "Brechas cerrables vs no cerrables" |
| 🚀 **Entrega** | Reporte de trazabilidad | "Reporte /dr report descargado" |
| | Portafolio de artefactos | "Portafolio .md generado por CRISOL" |
| | Documento final | "Versión final del artículo (.docx o .tex)" |

### Interacción para agregar enlace

1. Click en "📁 Agregar enlace" del artefacto esperado o registrado
2. Se expande inline (no modal):
   ```
   URL:  [https://drive.google.com/____________]
   Desc: [Borrador A1 v3 con correcciones_____]
   [Guardar]  [+ Otro enlace]
   ```
3. "Guardar" cierra. "+ Otro enlace" agrega otro par URL+desc al mismo artefacto.
4. Los enlaces guardados se muestran como pills clicables:
   ```
   📁 Borrador A1 v3.docx   📁 PDFs verificadas   [+ enlace]
   ```

---

## Preguntas para resolver mañana

1. ¿Los artefactos auto-generados (nivel 1) deben poder eliminarse o son permanentes?
2. ¿El portafolio incluye los outputs completos o solo los resume?
3. ¿Quieres que la trayectoria de scores sea visible desde la vista general (home) o solo dentro del proyecto?
4. ¿Los artefactos del modo clo-author siguen el mismo esquema?
5. ¿Los artefactos esperados son los mismos para todos los proyectos o se configuran por proyecto?
