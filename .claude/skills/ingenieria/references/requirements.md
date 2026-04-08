# Frameworks de Requisitos — Referencia

## User Stories (Mike Cohn)

### Formato
```
COMO [rol],
QUIERO [acción/meta],
PARA [beneficio/valor].
```

### INVEST Criteria
- **I**ndependent — puede desarrollarse sin depender de otra story
- **N**egotiable — los detalles son discutibles, no es un contrato
- **V**aluable — entrega valor al usuario o al negocio
- **E**stimable — el equipo puede dimensionar el esfuerzo
- **S**mall — cabe en una iteración/sesión de desarrollo
- **T**estable — tiene criterios claros de PASS/FAIL

### Las 3 C's
- **Card**: la story escrita (breve)
- **Conversation**: la discusión que clarifica detalles
- **Confirmation**: los criterios de aceptación que verifican

**Referencia:** Cohn, M. *User Stories Applied* (2004)

---

## BDD — Behavior-Driven Development (Dan North)

### Given-When-Then
```gherkin
Dado [contexto previo / estado del sistema]
Cuando [acción del usuario o evento]
Entonces [resultado esperado observable]
```

### Ejemplos
```gherkin
Escenario: Importar artículo exitosamente
  Dado que estoy autenticado y en la vista de artículos
  Cuando subo un archivo PDF válido
  Entonces el artículo aparece en mi lista con título y autores extraídos
  Y recibo una notificación "Artículo importado exitosamente"

Escenario: Importar artículo duplicado
  Dado que ya tengo un artículo con DOI "10.1234/abc"
  Cuando intento importar otro artículo con el mismo DOI
  Entonces veo un aviso "Este artículo ya existe"
  Y se me ofrece la opción de "Actualizar" o "Cancelar"
```

### Valor
- Los escenarios son especificaciones ejecutables (se convierten en tests)
- Eliminan ambigüedad usando ejemplos concretos
- Sirven como documentación viva

**Referencia:** North, D. "Introducing BDD" (2006); Adzic, G. *Specification by Example* (2011)

---

## Specification by Example (Gojko Adzic)

### Principio
Los requisitos abstractos causan malentendidos. Los ejemplos concretos eliminan ambigüedad.

### Formato tabla
```
| Caso     | Input              | Acción     | Resultado esperado              |
|----------|--------------------|------------|---------------------------------|
| Normal   | PDF de 10 páginas  | Importar   | Artículo con metadata completa  |
| Edge     | PDF corrupto       | Importar   | Error amigable, no crashea      |
| Edge     | PDF de 500 páginas | Importar   | Importa con warning de tamaño   |
| Edge     | Artículo duplicado | Importar   | Opción actualizar/cancelar      |
| Boundary | Sin conexión       | Importar   | Guarda local, sync al reconectar|
```

### Regla
Mínimo **3 ejemplos** por story: 1 happy path + 2 edge cases. Si no se pueden escribir 3 ejemplos, la story no está clara.

### Three Amigos
Sesión donde negocio + desarrollo + testing revisan ejemplos juntos antes de desarrollar. En tu caso: tú (negocio) + Claude (desarrollo) + criterios de aceptación (testing).

**Referencia:** Adzic, G. *Specification by Example* (2011)

---

## Definition of Ready (DoR)

Gate de entrada: ¿está listo para desarrollar?

### Checklist
- [ ] Story en formato "Como/Quiero/Para"
- [ ] Mínimo 3 criterios de aceptación (Given-When-Then)
- [ ] Mínimo 3 ejemplos concretos (tabla Spec by Example)
- [ ] Dependencias identificadas (APIs, tablas, módulos existentes)
- [ ] UI clarificada (mockup, descripción, o "sin cambios de UI")
- [ ] Datos definidos (campos, tipos, relaciones, tabla nueva o existente)
- [ ] NFRs especificados si aplica (performance, seguridad, accesibilidad)
- [ ] Estimación de tamaño (S/M/L)

### Por qué importa
El costo de corregir un defecto de requisitos se multiplica 10-100x a medida que avanza a código y producción (Barry Boehm). La DoR previene que requisitos ambiguos entren en desarrollo.

---

## Definition of Done (DoD)

Gate de salida: ¿está realmente terminado?

### Checklist (complementa las 15 dimensiones del CLAUDE.md)
- [ ] Código escrito y funcionando
- [ ] Criterios de aceptación verificados (Given-When-Then pasan)
- [ ] Tests escritos para lógica de negocio
- [ ] Sin linting errors
- [ ] Sin console.log de debug
- [ ] Accesibilidad verificada (si hay cambios de UI)
- [ ] Documentación actualizada (si aplica)
- [ ] Code review completado (o auto-review con /dev audit)
- [ ] Desplegable a producción

---

## C4 Model (Simon Brown)

### Level 1 — Contexto
```
[Usuario] → usa → [SISTEMA] → conecta → [Sistema Externo]
```
Un diagrama. Muestra QUÉ es el sistema y QUIÉN lo usa.

### Level 2 — Containers
```
[Web App] → API → [Supabase DB]
[Web App] → Storage → [Supabase Storage]
[Web App] → Auth → [Supabase Auth]
[Vercel] → deploys → [Web App]
```
Muestra los bloques técnicos y cómo se comunican.

### Level 3 — Components (opcional)
Módulos internos de cada container. Para CRISOL: los 22 archivos JS y sus dependencias.

### Level 4 — Code (raramente necesario)
Clases y funciones. El IDE ya cumple esta función.

**Regla:** Level 1 + Level 2 son suficientes para la mayoría de proyectos. Actualizar cuando la arquitectura cambia.

**Referencia:** Brown, S. *The C4 Model* (c4model.com)

---

## NFRs — Non-Functional Requirements

Especificar con targets SMART (Specific, Measurable, Achievable, Relevant, Time-bound):

| Dimensión | Mal especificado | Bien especificado |
|-----------|-----------------|-------------------|
| Performance | "Debe ser rápido" | "Búsqueda responde <200ms con 1000 artículos" |
| Seguridad | "Debe ser seguro" | "Solo el dueño puede ver sus documentos (RLS)" |
| Accesibilidad | "Debe ser accesible" | "WCAG AA, Lighthouse Accessibility >90" |
| Escalabilidad | "Debe escalar" | "Soportar 500 usuarios concurrentes" |
| Disponibilidad | "Siempre disponible" | "99.9% uptime mensual" |

**Referencia:** ISO/IEC 25010:2023 — Software Product Quality Model
