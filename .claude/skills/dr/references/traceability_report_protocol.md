# Protocolo del Reporte de Trazabilidad — /dr report v1

Referencia para el comando `/dr report`.
Genera un documento que reconstruye la historia completa de cómo se produjo
un texto doctoral, con evidencia verificable de cada paso del proceso.

---

## Principio rector

El reporte NO es una declaración genérica de "usé IA responsablemente".
Es un registro con datos concretos: scores, decisiones, iteraciones, y
evidencia de que el investigador orquestó el proceso — no lo delegó.

---

## Estructura del reporte

### Sección 1 — Ficha técnica

```markdown
# Reporte de Trazabilidad

**Documento:** [título del texto producido]
**Investigador:** [nombre]
**Institución:** [universidad]
**Período de producción:** [fecha inicio — fecha fin]
**Fases completadas:** [N de 8]
**Iteraciones de revisión:** [N]
**Score final:** [score compuesto] — Gate: [BORRADOR/CAPITULO/ENTREGA]
```

### Sección 2 — Genealogía del argumento

Reconstruir cómo evolucionó el argumento a lo largo del proceso:

```markdown
## Genealogía del argumento

### Pregunta inicial
[output de exploración tarea 1]

### Gap identificado
[output de exploración tarea 2]

### Posición tentativa
[output de exploración tarea 5]

### Fuentes seleccionadas
[output de exploración tarea 4 — lista priorizada]

### Conexiones descubiertas en lectura
[resumen de fichas de explotación — conceptos conectados]

### Argumento después del mentor
[pregunta clave del mentor + respuesta del investigador]

### Argumento después del diablo
[ataque más peligroso + cómo se resolvió]

### Argumento final
[tesis tal como aparece en el texto entregado]
```

**Por qué importa:** Muestra que el argumento NO salió armado de la IA —
evolucionó a través de un proceso de descubrimiento, cuestionamiento, y
reconstrucción. La distancia entre la posición tentativa y el argumento
final es evidencia de pensamiento genuino.

### Sección 3 — Trayectoria de calidad

Tabla que muestra cómo evolucionaron los scores entre iteraciones:

```markdown
## Trayectoria de calidad

| Componente | Ronda 1 | Ronda 2 | ... | Final | Δ total |
|------------|---------|---------|-----|-------|---------|
| Coherencia teórica (25%) | 68 | 78 | | 88 | +20 |
| Posicionamiento (15%) | 72 | 82 | | 90 | +18 |
| Rigor metodológico (20%) | 75 | 80 | | 85 | +10 |
| Integración autoetnográfica (15%) | 80 | 85 | | 92 | +12 |
| Calidad anti-IA (15%) | 55 | 78 | | 88 | +33 |
| Trazabilidad (10%) | 60 | 85 | | 95 | +35 |
| **Score compuesto** | **68** | **80** | | **89** | **+21** |
| **Gate** | BORRADOR | CAPITULO | | ENTREGA | |

### Patrones anti-IA corregidos
| Patrón | Código | Instancias corregidas |
|--------|--------|----------------------|
| Listitis enumerativa | C01 | 3 |
| Coletilla inspiracional | C02 | 2 |
| Hedging sistemático | C03 | 4 |

### Debilidades de contenido corregidas
| Debilidad | Código | Dónde se corrigió |
|-----------|--------|-------------------|
| Salto de nivel de análisis | CT03 | Sección 3, párrafo 2 |
| Posicionamiento ausente | PL03 | Introducción, párrafo 4 |
```

**Por qué importa:** Evidencia de mejora iterativa. Un texto que pasó
de 68 a 89 demuestra que el investigador trabajó activamente en mejorar,
no solo generó y entregó.

### Sección 4 — Integridad de fuentes

```markdown
## Integridad de fuentes

**Total de fuentes citadas:** [N]
**Verificadas contra PDF original:** [N] ([%])
**Con cita textual en idioma original:** [N]

### Errores detectados y corregidos
| # | Fuente | Error original | Tipo | Corrección aplicada |
|---|--------|---------------|------|-------------------|
| 1 | Wu et al. 2025 | "167% mejora" (dato no existe) | F1b | Eliminado, reemplazado con d=0.25 |

### Fuentes inverificables declaradas
| Fuente | Razón | Tratamiento |
|--------|-------|-------------|
| Cui & Yasseri 2024 | PDF no disponible | Declarado como limitación |

**Citas fabricadas:** [0 / N detectadas y eliminadas]
```

**Por qué importa:** Demuestra diligencia. El investigador no solo
confió en la IA para las citas — las verificó contra los PDFs originales
y corrigió los errores.

### Sección 5 — Decisions del investigador

```markdown
## Decisiones del investigador

### Gates completados
| Gate | Fecha | Decisión clave |
|------|-------|----------------|
| Exploración | 2026-04-05 | Pregunta precisa, 12 fuentes, posición escrita |
| Escritura | 2026-04-06 | Esqueleto aprobado, puedo defender todas las afirmaciones |
| Revisión | 2026-04-07 | Score 85, top 3 debilidades corregidas |
| Humanización | 2026-04-07 | Anti-IA 88, zero patrones críticos |
| Verificación | 2026-04-08 | Zero fabricadas, 2 inverificables declaradas |
| Profundización | 2026-04-08 | Pregunta mentor respondida, ataque diablo resuelto |

### Gates saltados
[Si se saltó algún gate, registrar cuál y por qué]

### Intervenciones manuales del investigador
- [Decisiones que tomó el investigador que la IA no sugirió]
- [Correcciones que rechazó y por qué]
- [Secciones que reescribió completamente sin IA]
```

**Por qué importa:** Los gates son declaraciones explícitas de autoría
intelectual. Cada gate completado es el investigador diciendo "sí,
esto es mío y puedo defenderlo".

### Sección 6 — Declaración metodológica

```markdown
## Declaración metodológica

Este texto fue producido siguiendo el protocolo /dr (Doctoral Research)
del sistema CRISOL, que estructura la producción doctoral en 8 fases
con quality gates entre cada una.

### Rol de la IA en este texto
- **Lectura:** Extracción de conexiones y citas (verificadas por el investigador)
- **Escritura:** Borrador a partir de esqueleto aprobado (voz calibrada al investigador)
- **Revisión:** Evaluación en 6 componentes (interpretada y priorizada por el investigador)
- **Humanización:** Detección de patrones de escritura IA (correcciones aplicadas selectivamente)
- **Verificación:** Contraste de citas contra PDFs (errores corregidos por el investigador)
- **Profundización:** Preguntas socráticas y ataques adversariales (respondidos por el investigador)

### Rol del investigador
- Formulación de pregunta y posición inicial
- Aprobación de esqueletos argumentales
- Decisiones en cada quality gate
- Verificación de autoría intelectual
- Respuesta a cuestionamientos del mentor socrático
- Reconstrucción después de ataques del abogado del diablo
- Corrección manual de citas y datos

### Criterios de calidad alcanzados
- Score compuesto: [N] (gate: [NIVEL])
- Score anti-IA: [N]
- Citas fabricadas: 0
- Fuentes verificadas: [N]%
```

---

## Fuentes de datos para el reporte

| Dato | Dónde está | Cómo acceder |
|------|-----------|-------------|
| Outputs de cada tarea | `proj.drOutputs[faseId][tareaIdx]` | CRISOL → proyecto |
| Progreso de tareas | `proj.drWizardProgress[faseId][tareaIdx]` | CRISOL → proyecto |
| Respuestas de gates | `proj.drGateRecords[]` | CRISOL → proyecto |
| Estados de fases | `proj.drFases[]` | CRISOL → proyecto |
| Log de acciones Claude | `dr_journal.md` | Archivo local |
| Scores por ronda | Output de /dr review (pegado en drOutputs) | CRISOL → outputs |
| Patrones anti-IA | Output de /dr humanize (pegado en drOutputs) | CRISOL → outputs |
| Errores de citas | Output de /dr verify (pegado en drOutputs) | CRISOL → outputs |
| Preguntas del mentor | Output de /dr mentor (pegado en drOutputs) | CRISOL → outputs |
| Ataques del diablo | Output de /dr devil (pegado en drOutputs) | CRISOL → outputs |

---

## Formato de salida

El reporte se genera como **archivo .md descargable** desde CRISOL
(botón "Reporte de trazabilidad" en la fase de Entrega).

También puede generarse desde Claude Code con `/dr report` pasando
los datos del proyecto como contexto.

---

## Integracion con documentos existentes

- **Protocolo de Investigador Hibridado:** El reporte alimenta la sección
  de legitimación metodológica con datos concretos
- **Anexo de Apropiación Estilística:** Los patrones anti-IA corregidos
  y el score final demuestran apropiación activa del estilo
- **Nota metodológica de cada artículo:** El resumen de la sección 6
  puede incluirse directamente como nota al pie o apéndice
