# Frameworks de Diseño de Procesos — Referencia

## Arquitectura Tripartita (Oscar Barros)

Todo proceso tiene 3 componentes universales:

1. **Gestión**: Decisiones, regulación, control. ¿Quién decide qué? ¿Con qué información?
2. **Producción**: Transformación, creación de valor. El trabajo real que se hace.
3. **Mantención de estado**: Registro, informes, trazabilidad. Qué se guarda y qué se informa.

**Cómo usar:** Para cada feature, antes de diseñar pantallas o escribir código, identificar estos 3 componentes. Si falta alguno, el diseño está incompleto.

**Ejemplo CRISOL — Procesamiento de artículo:**
- Gestión: usuario decide qué artículo procesar, configura parámetros
- Producción: /sila genera el documento SILA con las 7 secciones
- Mantención: se guarda en sila_userdata, se registra progreso, se notifica si es proyecto

**Referencia:** Barros, O. *Ingeniería e-Business* (2004); *Rediseño de Procesos mediante Patrones* (2003)

---

## Patrones Macro (Barros)

Barros define patrones genéricos que se especializan por dominio:

| Patrón | Dominio | Estructura |
|--------|---------|-----------|
| Macro 1 | Venta y producción de bienes/servicios | Request → Process → Deliver → Maintain |
| Macro 1c | Procesos de crédito | Solicitud → Evaluación → Aprobación → Desembolso |
| Macro 1h | Atención hospitalaria | Ingreso → Diagnóstico → Tratamiento → Alta |
| Macro 4 | Adquisición de recursos | Necesidad → Búsqueda → Evaluación → Adquisición |

**Especialización:** Macro genérico → dominio → subdominio → caso específico.
Como herencia en OOP: cada nivel agrega especificidad manteniendo la estructura base.

---

## User Journey Map

Visualiza la experiencia completa del usuario:

```
PERSONA:    [quién]
ESCENARIO:  [qué intenta lograr]

FASE        | Descubre    | Evalúa      | Usa          | Vuelve
ACCIONES    | [qué hace]  | [qué hace]  | [qué hace]   | [qué hace]
TOUCHPOINTS | [dónde]     | [dónde]     | [dónde]      | [dónde]
EMOCIONES   | [😊😐😤]    | [😊😐😤]    | [😊😐😤]     | [😊😐😤]
PAIN POINTS | [frustra]   | [frustra]   | [frustra]    | [frustra]
OPORTUNIDAD | [mejorar]   | [mejorar]   | [mejorar]    | [mejorar]
```

**Cuándo usar:** Para features que involucran un flujo completo de usuario (onboarding, compra, procesamiento).

**Referencia:** Kalbach, J. *Mapping Experiences* (O'Reilly, 2016)

---

## Service Blueprint

Extiende el Journey Map con el "backstage":

```
EVIDENCIA FÍSICA    [emails, pantallas, notificaciones que ve el usuario]
═══ línea de interacción ═══
ACCIONES USUARIO    [clicks, inputs, decisiones del usuario]
═══ línea de visibilidad ═══
FRONTSTAGE          [respuestas del sistema visibles para el usuario]
═══ línea de interacción interna ═══
BACKSTAGE           [APIs, queries DB, procesamiento, jobs]
SOPORTE             [Supabase, Vercel, Resend, servicios externos]
```

**Cuándo usar:** Cuando necesitas entender QUÉ SISTEMA construir (no solo qué pantalla). Revela APIs, tablas, y procesos backend necesarios.

**Referencia:** Shostack, G.L. (1984) *Designing Services That Deliver*, HBR

---

## State Machine

Modela entidades con ciclo de vida:

```
[estado_1] --evento [guard]--> [estado_2]
```

**Elementos:**
- **Estado**: condición actual (draft, pending, active, archived)
- **Evento**: qué dispara la transición (SUBMIT, APPROVE, ARCHIVE)
- **Guard**: condición que debe cumplirse ([has_invite_code], [is_admin])
- **Acción**: efecto colateral (send_email, update_audit_log)

**Cuándo usar:** Cualquier entidad con estados: solicitudes, documentos, proyectos, usuarios, tareas.

**Referencia:** Harel, D. (1987) *Statecharts: A Visual Formalism for Complex Systems*

---

## SIPOC (Six Sigma)

Vista de alto nivel para scopear un proceso:

| S (Suppliers) | I (Inputs) | P (Process) | O (Outputs) | C (Customers) |
|---|---|---|---|---|
| ¿Quién provee? | ¿Qué entra? | 4-7 pasos | ¿Qué sale? | ¿Quién recibe? |

**Cuándo usar:** Al inicio, para establecer límites del proceso antes de diseñarlo en detalle.

---

## Event Storming (Alberto Brandolini)

Descubrimiento de dominio via eventos. Simplificado para trabajo con AI:

1. **Eventos** (naranja): qué pasó — "Artículo importado", "Lectura completada"
2. **Comandos** (azul): qué lo causó — "Importar artículo", "Completar lectura"
3. **Actores** (amarillo): quién — "Investigador", "Admin", "Sistema"
4. **Políticas** (lila): reglas reactivas — "Cuando lectura completa → actualizar PRISMA"
5. **Read Models** (verde): qué info necesita el actor para decidir

**Cuándo usar:** Para descubrir un dominio nuevo o mapear un dominio complejo.

**Referencia:** Brandolini, A. *Introducing EventStorming* (Leanpub, 2021)

---

## User Story Map (Jeff Patton)

Organiza stories en 2D: journey horizontal × prioridad vertical:

```
BACKBONE:   [Actividad 1]  →  [Actividad 2]  →  [Actividad 3]
             tarea 1.1         tarea 2.1         tarea 3.1
             tarea 1.2         tarea 2.2         tarea 3.2
─── MVP ──────────────────────────────────────────────────────
             tarea 1.3         tarea 2.3         tarea 3.3
─── v2 ───────────────────────────────────────────────────────
```

**El corte horizontal define el MVP** — la caminata más delgada que recorre todo el backbone.

**Cuándo usar:** Para planificar releases y definir MVP.

**Referencia:** Patton, J. *User Story Mapping* (O'Reilly, 2014)

---

## Wireframing

Niveles de fidelidad:

| Nivel | Cuándo | Herramientas |
|-------|--------|-------------|
| **Lo-fi** (papel/sketch) | Exploración inicial, muchas opciones | Papel, Excalidraw |
| **Mid-fi** (layout digital) | Layout definido, contenido real | Figma, Whimsical |
| **Hi-fi** (pixel-perfect) | Validación final, handoff a desarrollo | Figma |

**Para trabajo con AI:** Describir wireframes en texto estructurado es suficiente:
```
PANTALLA: [nombre]
HEADER: [logo] [nav: tab1 | tab2 | tab3] [avatar]
MAIN:
  [sidebar: lista de items]
  [content: editor de texto]
  [panel derecho: metadata]
FOOTER: [status bar]
```

**Referencia:** Krug, S. *Don't Make Me Think* (3rd ed., 2014)
