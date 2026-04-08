---
name: ingenieria
description: >
  Diseño integrado pre-código (/ingeniería) — guía el proceso completo desde
  problematización hasta especificaciones verificables. Activar cuando el usuario
  diga 'ingeniería', '/ingeniería', 'diseñar', 'diseño de proceso', 'nueva solución',
  'quiero construir', 'tengo una idea', 'problematización', 'requisitos',
  'especificación', 'story mapping', 'journey map', 'blueprint', o cuando
  empiece a conceptualizar un nuevo proyecto o feature compleja.
---

# /ingeniería — Diseño Integrado Pre-Código

Guía el proceso de diseño desde la problematización hasta especificaciones verificables,
usando frameworks profesionales. Soporta el proceso recursivo/espiral del usuario:
no fuerza linealidad — puedes saltar entre fases y volver atrás.

## Filosofía

Este skill implementa la visión de Oscar Barros (Ingeniería de Negocios, U. de Chile):
el diseño de procesos y el diseño de IT son UNA sola disciplina integrada, no fases separadas.
Se complementa con frameworks anglosajones donde Barros no llega (JTBD, BDD, fitness functions).

El usuario NO es desarrollador. Este skill traduce su comprensión del problema
en artefactos que permitan un desarrollo profesional. El producto final siempre será
más amplio que la idea original — el proceso de diseño ES un proceso de descubrimiento.

## Sub-comandos

```
/ingeniería                    → Detecta fase actual, sugiere siguiente paso
/ingeniería estrategia         → ¿Por qué construir esto? ¿Para quién?
/ingeniería procesos           → ¿Cómo interactúa el usuario? ¿Qué pasa detrás?
/ingeniería requisitos         → ¿Qué exactamente debe hacer el software?
/ingeniería [tema libre]       → Explora el tema usando los frameworks disponibles
```

## Detección de fase

Si el usuario invoca `/ingeniería` sin sub-comando, Claude detecta la fase por señales:

| Señales | Fase detectada | Acción |
|---------|---------------|--------|
| "Tengo una idea", "quiero construir", "necesito resolver" | **Estrategia** | Guiar con JTBD + Value Proposition |
| "El usuario debería poder...", "el flujo sería..." | **Procesos** | Guiar con Journey Map + Service Blueprint |
| "Necesito que haga X", "la feature debe...", "cuando el usuario..." | **Requisitos** | Guiar con User Stories + BDD |
| Proyecto ya en desarrollo, nueva feature | **Requisitos** (atajo) | Story + Spec by Example directo |

## Soporte recursivo

El proceso del usuario es una espiral, no un waterfall:

```
problematización → investigación → diseño → descubrimiento → rediseño → ...
```

**Reglas para soportar la recursividad:**
- NUNCA decir "primero debes completar la fase anterior"
- Si el usuario salta de requisitos a estrategia, seguirlo — probablemente descubrió algo
- Cada iteración profundiza la comprensión — no es retroceso, es avance
- Mantener un registro de decisiones tomadas (para no perderlas en la espiral)
- Al final de cada sesión, producir un resumen de estado (qué se decidió, qué cambió, qué falta)

---

## FASE 1: Estrategia

**Pregunta central:** "¿Por qué construir esto y no otra cosa?"

### Flujo guiado

1. **Jobs To Be Done** — Empezar siempre aquí
   ```
   Pregunta al usuario:
   "¿Qué trabajo está tratando de hacer tu usuario que hoy es difícil, lento o imposible?"
   
   Formato de respuesta:
   JOB: [verbo] + [objeto] + [contexto]
   Ejemplo: "Procesar un artículo académico de forma profunda cuando preparo mi tesis"
   
   Descomponer en:
   - Job funcional: ¿qué tarea práctica?
   - Job emocional: ¿cómo quiere sentirse?
   - Job social: ¿cómo quiere ser percibido?
   ```

2. **Value Proposition Canvas** — Mapear dolores y ganancias
   ```
   PERFIL DEL USUARIO
   ├── Jobs: [lista de trabajos]
   ├── Pains: [qué le frustra hoy]
   └── Gains: [qué resultados desea]
   
   PROPUESTA DE VALOR
   ├── Productos/servicios: [qué ofrecemos]
   ├── Pain relievers: [cómo aliviamos cada dolor]
   └── Gain creators: [cómo creamos cada ganancia]
   ```

3. **Impact Map** — Conectar objetivo a features
   ```
   ¿POR QUÉ? (objetivo medible)
     └── ¿QUIÉN? (actores que afectan el objetivo)
         └── ¿CÓMO? (qué cambio de comportamiento buscamos)
             └── ¿QUÉ? (features/entregables)
   ```

4. **Kano** — Clasificar features
   ```
   Para cada feature candidata:
   - BÁSICA (must-have): sin esto no funciona
   - PERFORMANCE (competitiva): más = mejor
   - EXCITEMENT (diferenciador): sorprende, no se esperaba
   - INDIFERENTE: no invertir aquí
   ```

5. **MoSCoW** — Priorizar para el MVP
   ```
   MUST HAVE    (60% del esfuerzo) — sin esto es inutilizable
   SHOULD HAVE  (20%) — importante pero hay workaround
   COULD HAVE   (20%) — deseable si hay tiempo
   WON'T HAVE   (this time) — explícitamente fuera de scope
   ```

### Artefacto de salida: Canvas de Estrategia
```markdown
# [Nombre del proyecto] — Canvas de Estrategia

## Job principal
[Job statement en formato JTBD]

## Dolores que alivia
1. [dolor → cómo lo alivia]

## Ganancias que crea
1. [ganancia → cómo la crea]

## Features priorizadas (MoSCoW)
### Must Have
- [ ] [feature] — [justificación]
### Should Have
- [ ] [feature]
### Could Have
- [ ] [feature]
### Won't Have (this time)
- [feature] — [por qué no ahora]

## Métricas de éxito
- [métrica medible]: [target]
```

---

## FASE 2: Diseño de Procesos

**Pregunta central:** "¿Cómo interactúa el usuario con la solución y qué pasa detrás del telón?"

### Arquitectura tripartita (Oscar Barros)

Todo proceso tiene tres componentes:

```
┌──────────────────────────────────┐
│  GESTIÓN                         │
│  Decisiones, regulación, control │
│  ¿Quién decide qué? ¿Cuándo?    │
├──────────────────────────────────┤
│  PRODUCCIÓN                      │
│  Transformación, creación de     │
│  valor, el trabajo real          │
│  ¿Qué hace el sistema?          │
├──────────────────────────────────┤
│  MANTENCIÓN DE ESTADO            │
│  Registro, informes, trazabilidad│
│  ¿Qué se guarda? ¿Qué se        │
│  informa? ¿A quién?             │
└──────────────────────────────────┘
```

Para cada feature/proceso, identificar estos tres componentes antes de diseñar.

### Frameworks de modelado (usar según complejidad)

**Para flujos simples (< 5 pasos, 1 actor):**
- **Flowchart** — Cajas y flechas, decisiones con diamantes

**Para flujos con usuario (experiencia completa):**
- **User Journey Map**
  ```
  FASES:     [Descubre] → [Evalúa] → [Usa] → [Vuelve]
  ACCIONES:  [qué hace en cada fase]
  EMOCIONES: [😊 😐 😤 en cada fase]
  PAIN POINTS: [dónde sufre]
  OPORTUNIDADES: [dónde mejorar]
  ```

**Para flujos con sistema (frontstage + backstage):**
- **Service Blueprint**
  ```
  EVIDENCIA FÍSICA:    [qué ve el usuario: pantallas, emails, notificaciones]
  ─── línea de interacción ───
  ACCIONES USUARIO:    [qué hace el usuario]
  ─── línea de visibilidad ───
  FRONTSTAGE:          [qué hace el sistema visible para el usuario]
  ─── línea de interacción interna ───
  BACKSTAGE:           [qué hace el sistema invisible: APIs, DB, jobs]
  SOPORTE:             [servicios externos: Supabase, Vercel, Resend]
  ```

**Para entidades con ciclo de vida:**
- **State Machine**
  ```
  ESTADOS: [draft] → [pending] → [approved] → [active] → [archived]
  TRANSICIONES: 
    draft → pending: usuario envía solicitud
    pending → approved: admin aprueba [guard: tiene invite_code]
    pending → draft: admin rechaza
    approved → active: usuario se registra
    active → archived: usuario desactiva
  ```

**Para scopear un proceso (vista de alto nivel):**
- **SIPOC**
  ```
  SUPPLIERS: ¿Quién provee inputs? (usuarios, APIs externas, DB)
  INPUTS:    ¿Qué datos/recursos entran?
  PROCESS:   4-7 pasos de alto nivel
  OUTPUTS:   ¿Qué produce?
  CUSTOMERS: ¿Quién recibe los outputs?
  ```

**Para descubrir el dominio (workshops):**
- **Event Storming** (simplificado para trabajo con AI)
  ```
  1. Listar EVENTOS del dominio (pasado): "Artículo importado", "Lectura completada"
  2. Para cada evento: ¿qué COMANDO lo causó? "Importar artículo"
  3. Para cada comando: ¿qué ACTOR lo ejecutó? "Investigador"
  4. ¿Qué POLÍTICAS reaccionan a eventos? "Cuando lectura completada → actualizar PRISMA"
  5. ¿Qué DATOS necesita el actor para decidir? (Read Models)
  ```

**Para organizar features por journey:**
- **User Story Map**
  ```
  BACKBONE (horizontal):  [Actividad 1] → [Actividad 2] → [Actividad 3]
  TAREAS (bajo cada act):  tarea 1a       tarea 2a        tarea 3a
                           tarea 1b       tarea 2b        tarea 3b
  ─── CORTE MVP ───────────────────────────────────────────────────
                           tarea 1c       tarea 2c        tarea 3c
  ─── CORTE v2 ────────────────────────────────────────────────────
  ```

### Artefacto de salida: Blueprint de Proceso
```markdown
# [Feature/Proceso] — Blueprint

## Tripartita (Barros)
- Gestión: [decisiones y control]
- Producción: [transformación de valor]  
- Mantención de estado: [qué se registra]

## SIPOC
| S | I | P | O | C |
|---|---|---|---|---|

## Journey / Blueprint
[diagrama en texto o Mermaid]

## State Machine (si aplica)
[estados y transiciones]

## Datos necesarios
| Entidad | Campos clave | Relaciones |
```

---

## FASE 3: Requisitos

**Pregunta central:** "¿Qué exactamente debe hacer el software, verificablemente?"

### User Stories (INVEST)

```
COMO [rol],
QUIERO [acción/meta],
PARA [beneficio/valor].

CRITERIOS DE ACEPTACIÓN:
  Dado [contexto previo]
  Cuando [acción del usuario]
  Entonces [resultado esperado]
```

**Verificar INVEST:**
- **I**ndependiente: ¿se puede desarrollar sin otra story?
- **N**egociable: ¿los detalles son discutibles?
- **V**aliosa: ¿entrega valor al usuario?
- **E**stimable: ¿se puede dimensionar?
- **S**mall: ¿cabe en una sesión de desarrollo?
- **T**estable: ¿se puede verificar PASS/FAIL?

### Specification by Example

Para cada story, pedir al usuario **3 ejemplos concretos** mínimo:

```
| Caso | Input | Acción | Resultado esperado |
|------|-------|--------|-------------------|
| Normal | artículo PDF | importar | artículo aparece en lista con metadata |
| Edge | PDF corrupto | importar | error amigable, no crashea |
| Edge | artículo duplicado | importar | aviso "ya existe", opción de actualizar |
```

### Definition of Ready (gate antes de desarrollar)

Antes de pasar a `/dev`, la story debe cumplir:
- [ ] Story escrita en formato INVEST
- [ ] Mínimo 3 criterios de aceptación en Given-When-Then
- [ ] Mínimo 3 ejemplos concretos (normal + edge cases)
- [ ] Dependencias identificadas (APIs, tablas, módulos)
- [ ] UI clarificada (mockup, wireframe, o "sin cambios de UI")
- [ ] Datos necesarios definidos (campos, tipos, relaciones)
- [ ] NFRs especificados si aplica (performance, seguridad)

### Arquitectura (C4 simplificado)

**Level 1 — Contexto del sistema:**
```
¿Quién usa el sistema? (actores)
¿Con qué sistemas externos se conecta? (Supabase, Vercel, Resend, APIs)
```

**Level 2 — Containers:**
```
¿Qué componentes técnicos tiene? (web app, DB, storage, edge functions)
¿Cómo se comunican?
```

### NFRs (Non-Functional Requirements)

Para cada feature significativa, especificar:
```
PERFORMANCE:    [target medible, ej: "respuesta <200ms para búsqueda"]
SEGURIDAD:      [qué proteger, ej: "solo el dueño puede editar sus docs"]
ACCESIBILIDAD:  [nivel, ej: "WCAG AA, keyboard navigable"]
ESCALABILIDAD:  [límites, ej: "soportar 1000 artículos por usuario"]
```

### Artefacto de salida: Especificación
```markdown
# [Feature] — Especificación

## User Stories
[stories en formato INVEST con criterios Given-When-Then]

## Ejemplos concretos
[tabla de specification by example]

## Modelo de datos
[entidades, campos, relaciones]

## C4 Level 2
[diagrama de containers afectados]

## NFRs
[requisitos no funcionales con targets medibles]

## Definition of Ready: ✓ / ✗
[checklist verificada]
```

---

## Conexión con /dev

Cuando el diseño está listo (Definition of Ready cumplida), la transición es:

```
/ingeniería produce → Stories + Criterios + Ejemplos + Modelo de datos + NFRs
                              ↓
/dev consume → Implementa con fitness functions activas
                              ↓
/dev verifica → 15 dimensiones + 6 invariantes CRISOL
```

El usuario puede invocar `/dev` directamente sin pasar por `/ingeniería` para tareas pequeñas (fixes, refactors menores). `/ingeniería` es para features nuevas, rediseños, o proyectos nuevos.

---

## Registro de decisiones

Cada sesión de `/ingeniería` produce un registro persistente:

```markdown
## Decisión: [título]
**Fecha:** YYYY-MM-DD
**Contexto:** [por qué surgió esta decisión]
**Opciones consideradas:**
1. [opción A] — pros / contras
2. [opción B] — pros / contras
**Decisión:** [opción elegida]
**Consecuencias:** [qué implica]
```

Estos registros se acumulan en el artefacto de salida y sirven para resumabilidad (Sprint 4).
