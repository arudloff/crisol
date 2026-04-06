# Protocolo de Lectura Profunda — Lector /dr read v1

Referencia para el agente lector profundo de `/dr read`.
A diferencia de SILA (que procesa articulos para aprendizaje), /dr read
analiza textos con una pregunta especifica: **que le aporta esto a MI tesis?**

---

## Diferencia con SILA

| Dimension | SILA | /dr read |
|-----------|------|----------|
| **Proposito** | Aprender del articulo | Extraer valor para la tesis |
| **Perspectiva** | Neutral/estudiante | Posicionada/investigador |
| **Salida** | Documento Word 6 secciones | Ficha de explotacion + mapa de uso |
| **Pregunta guia** | Que dice este texto? | Como sirve esto a mi argumento? |
| **Profundidad** | Todo el articulo por igual | Foco en lo que conecta con la tesis |

---

## Tesis central del investigador (contexto obligatorio)

Antes de leer cualquier texto, el lector debe tener presente la tesis de Alejandro:

> El cerebro humano opera con dos procesadores: uno consciente (~10 bits/s, serial,
> reemplazable por IA) y uno inconsciente (masivo, paralelo, creativo, irreemplazable).
> 7 principios invariantes describen la coexistencia humano-IA, anclados en 7 barreras
> biologicas, diferenciados en 3 regimenes de tolerancia, y proyectados en 7 capacidades
> liberadas.

**Conceptos clave de la tesis:**
- Procesador consciente vs inconsciente
- Ancho de banda cognitivo (~10 bits/s)
- Hibridacion organizacional (6 niveles)
- Deuda intelectual organizacional
- Carga germinal
- Regimenes de tolerancia (3)
- Capacidades liberadas (7)
- G-LOC epistemico
- Diseño de organizaciones hibridadas (5 niveles)

---

## Protocolo de lectura en 4 fases

### Fase 1 — Escaneo de relevancia (2 min)

Leer abstract, introduccion, y conclusiones. Clasificar:

| Clasificacion | Criterio | Accion |
|---------------|----------|--------|
| **A — Central** | Toca directamente un concepto clave de la tesis | Lectura completa, ficha profunda |
| **B — Complementario** | Aporta evidencia o marco teorico util | Lectura selectiva, ficha parcial |
| **C — Periferico** | Relacionado pero no esencial | Solo afirmaciones citables |
| **D — Irrelevante** | No conecta con la tesis | Descartar con una linea de justificacion |

### Fase 2 — Lectura posicionada

Para cada seccion del texto, responder internamente:

1. **Que afirma** — en una oracion
2. **Con que concepto de MI tesis conecta** — nombrar el concepto exacto
3. **Como conecta** — apoya, contradice, extiende, matiza, o complementa
4. **Que tan fuerte es la conexion** — directa (cita explicita) / analogica (mismo fenomeno, otro campo) / tangencial

### Fase 3 — Extraccion estructurada

Producir la **ficha de explotacion** (ver formato abajo).

### Fase 4 — Mapa de uso

Indicar exactamente DONDE en la tesis se usaria cada hallazgo:
- En que articulo (A1-A7, Cap0, Protocolo)
- En que seccion del articulo
- Con que funcion (fundamentar, contrastar, ejemplificar, extender)

---

## Ficha de explotacion — Formato de salida

```markdown
# Ficha de lectura — [Autor, Año]

**Titulo:** [titulo completo]
**Clasificacion:** A/B/C/D
**Relevancia para la tesis:** [1 oracion]

## Argumento central del texto
[2-3 oraciones: que argumenta y como lo demuestra]

## Conexiones con la tesis

| # | Concepto de MI tesis | Hallazgo del texto | Tipo de conexion | Fuerza |
|---|---------------------|--------------------|-----------------|--------|
| 1 | — | — | apoya/contradice/extiende/matiza | directa/analogica/tangencial |

## Afirmaciones citables

| # | Cita textual (idioma original) | Uso en la tesis | Articulo destino |
|---|-------------------------------|-----------------|-----------------|
| 1 | "..." (p. X) | — | A1/A2/.../A7 |

## Tensiones y oportunidades

### Lo que fortalece mi argumento
- [punto 1]

### Lo que lo desafia
- [punto 1 — con propuesta de como responder]

### Vacios explotables
- [algo que el texto no cubre y mi tesis si puede]

## Mapa de uso en la tesis

| Articulo | Seccion | Funcion | Cita/Hallazgo a usar |
|----------|---------|---------|---------------------|
| A4 | 3.2 | fundamentar | "quote..." (p.X) |

## Veredicto
[1 parrafo: vale la pena incorporar? que prioridad tiene? cambia algo de mi argumento?]
```

---

## Modos especiales

### /dr read --compare [archivo1] [archivo2]
Leer dos textos y producir tabla comparativa de posiciones:
- Donde convergen
- Donde divergen
- Como se posiciona MI tesis respecto a ambos

### /dr read --scan [carpeta]
Escaneo rapido de multiples PDFs. Para cada uno: clasificacion (A/B/C/D) + 1 linea de relevancia.
No produce ficha completa — solo un inventario priorizado.

### /dr read --gap [texto]
Leer un texto buscando especificamente lo que MI tesis NO cubre:
- Que evidencia presenta que yo no tengo?
- Que contraargumento plantea que no he respondido?
- Que concepto introduce que deberia definir?

---

## Integracion con otros componentes de /dr

- **Con /dr verify:** Las citas extraidas se pueden verificar inmediatamente
- **Con /dr review:** Las conexiones identificadas alimentan el componente de posicionamiento en literatura (PL)
- **Con /dr humanize:** Si se genera texto a partir de la ficha, pasarlo por humanizer
- **Con journal:** Cada lectura se registra con clasificacion y # de citas extraidas
