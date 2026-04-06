# Protocolo de Evaluacion de Impacto — /dr impact v1

Referencia para el comando `/dr impact`.
Evalua el impacto potencial de un articulo doctoral identificando vacios en la
literatura y puntuando cada aporte en 6 dimensiones estandar de contribucion teorica.

Basado en: Corley & Gioia (2011), Whetten (1989), Davis (1971),
Carton (2024), Suddaby (2010).

---

## Principio rector

El impacto de un articulo no es lo que dice — es lo que la literatura
NO decia antes de que el articulo existiera. Cada vacio llenado es un
aporte; cada aporte se evalua en 6 dimensiones con agentes independientes
y antagonicos.

---

## Dos momentos de uso

### Pre-escritura (fase Exploracion)
Pregunta: "¿Que vacio voy a llenar y cuanto vale?"
Input: pregunta de investigacion + fuentes exploradas + posicion tentativa
Output: mapa de vacios potenciales con score de impacto estimado

### Post-auditoria (fase Entrega)
Pregunta: "¿Que vacios llene y cuanto impacto tienen?"
Input: articulo completo + review de /dr review
Output: tabla de vacios con score de impacto + ranking + recomendaciones de posicionamiento

---

## Las 6 dimensiones de impacto

| Dim | Nombre | Definicion | Fuente |
|-----|--------|-----------|--------|
| **O** | Originalidad | ¿El vacio revela algo que nadie articulo (revelatorio) o extiende lo conocido (incremental)? | Corley & Gioia 2011 |
| **N** | Novedad/Interes | ¿Desafia supuestos aceptados? ¿Niega una "verdad" del campo? Lo interesante niega lo aceptado. | Davis 1971 |
| **U** | Utilidad practica | ¿Un gerente/disenador/educador puede actuar diferente con esto? | Corley & Gioia 2011 |
| **C** | Claridad de constructo | ¿El concepto propuesto es preciso, distinguible, operacionalizable? ¿Tiene nombre? | Suddaby 2010 |
| **G** | Generalidad/Alcance | ¿Aplica a multiples dominios o solo al caso estudiado? ¿Es transversal? | Whetten 1989, Carton 2024 |
| **R** | Rigor causal | ¿El mecanismo WHY esta articulado? ¿Hay cadena causal, no solo correlacion o analogia? | Whetten 1989 |

### Escala
- **1** — Bajo: incremental, predecible, caso unico, sin mecanismo
- **2** — Moderado: extension valida, parcialmente novedoso, algunos dominios
- **3** — Alto: contribucion clara, desafia supuestos, multiples dominios, mecanismo articulado
- **4** — Excepcional: revelatorio, invierte un marco existente, utilidad inmediata, constructo nombrable, universal, cadena causal completa

### Score maximo: 24 puntos (6 dimensiones × 4 max)

### Umbrales de impacto
- 20-24: Contribucion excepcional — articulo central del campo
- 16-19: Contribucion solida — publicable en top journal
- 12-15: Contribucion moderada — publicable con fortalecimiento
- 8-11: Contribucion debil — requiere reposicionamiento
- <8: No hay contribucion clara — reconsiderar

---

## Arquitectura de agentes (4 + orquestador)

### Agente 1 — Explorador de vacios
**Rol:** Identifica que falta en la literatura citada.
**Metodo:**
1. Leer el articulo completo (o la posicion tentativa si es pre-escritura)
2. Para cada fuente citada, responder: ¿que dice? ¿donde se detiene? ¿que no ve?
3. Para cada par de fuentes, responder: ¿hay tension no resuelta entre ellas?
4. Producir lista de vacios con formato:

```markdown
| Codigo | Vacio | Quien lo circunda | Que aporta el articulo |
```

**Principio:** Buscar lo que NO se ha dicho, no lo que se ha dicho.
**NO ve** los reportes de los otros agentes.

### Agente 2 — Evaluador de originalidad + novedad (O, N)
**Rol:** Puntua originalidad e interes de cada vacio.
**Preguntas guia:**
- ¿Es revelatorio (nadie lo dijo) o incremental (extiende lo conocido)?
- ¿Desafia un supuesto aceptado del campo? ¿Cual?
- ¿Invierte un marco existente? (ej: Kahneman de sesgos a capacidades)
- ¿Davis (1971) lo calificaria como "interesante"?
**Postura:** Adversarial — busca demostrar que "esto ya lo dijo X en [año]"
**NO ve** los reportes de utilidad ni rigor.

### Agente 3 — Evaluador de utilidad + alcance (U, G)
**Rol:** Puntua utilidad practica y generalidad de cada vacio.
**Preguntas guia:**
- ¿Un gerente que lee esto, que hace diferente el lunes?
- ¿Un disenador organizacional puede usar este constructo?
- ¿Aplica a mas de un dominio? ¿A cuantos?
- ¿Hay prescripcion concreta o solo descripcion?
**Postura:** Adversarial — "¿y que hace un practitioner con esto?"
**NO ve** los reportes de originalidad ni rigor.

### Agente 4 — Evaluador de rigor + claridad (C, R)
**Rol:** Puntua claridad de constructo y rigor causal de cada vacio.
**Preguntas guia:**
- ¿El constructo tiene nombre propio, definicion precisa, limites claros?
- ¿Se distingue de constructos existentes? ¿En que se diferencia?
- ¿Hay cadena causal WHY articulada? ¿O es solo correlacion/analogia?
- ¿El mecanismo es verificable empiricamente?
**Postura:** Adversarial — "¿cual es exactamente el mecanismo?"
**NO ve** los reportes de originalidad ni utilidad.

### Orquestador
**Rol:** Integra los 4 reportes en tabla consolidada.
**Acciones:**
1. Recibe vacios del Agente 1
2. Recibe scores O, N del Agente 2
3. Recibe scores U, G del Agente 3
4. Recibe scores C, R del Agente 4
5. Calcula total por vacio (O+N+U+C+G+R)
6. Rankea vacios por score
7. Detecta discrepancias entre agentes (ej: Agente 2 dice O=4, Agente 4 dice R=1 → "interesante pero especulativo")
8. Recomienda top 3 vacios para posicionamiento explicito
9. Registra en journal

---

## Deteccion de tensiones entre dimensiones

Las tensiones son informativas, no defectos:

| Tension | Significado | Accion recomendada |
|---------|------------|-------------------|
| O alto + R bajo | Interesante pero especulativo | Fortalecer cadena causal o declarar como hipotesis |
| R alto + O bajo | Solido pero incremental | Buscar el angulo revelatorio que lo haga interesante |
| U alto + O bajo | Practico pero no novedoso | Posicionar como operacionalizacion de marco existente |
| O alto + U bajo | Novedoso pero sin aplicacion inmediata | Agregar seccion de implicaciones practicas |
| G alto + C bajo | Aplica a todo pero el concepto es vago | Precisar definicion y limites |
| C alto + G bajo | Constructo preciso pero de nicho | Argumentar transferibilidad a otros dominios |

---

## Formato de salida

```markdown
# Evaluacion de Impacto — [titulo del articulo]

## Vacios identificados

| # | Vacio | Quien lo circunda | Que aporta el articulo |
|---|-------|-------------------|----------------------|

## Tabla de impacto

| Vacio | O | N | U | C | G | R | Total /24 | Evaluacion |
|-------|---|---|---|---|---|---|----------|-----------|

## Tensiones detectadas
- [tension 1: dimension alta vs dimension baja — significado]

## Top 3 vacios para posicionamiento
1. [vacio + score + por que es el mas potente]
2. ...
3. ...

## Parrafo de posicionamiento sugerido
[Para cada top vacio, un parrafo modelo que el investigador puede adaptar]
```

---

## Benchmarking contra publicaciones ancla (`/dr impact --benchmark`)

### Proposito
Comparar el articulo contra 3-4 publicaciones de referencia que representan
el estandar al que aspira. Las anclas son contextuales al articulo, no fijas.

### Seleccion de anclas
El investigador elige 3-4 publicaciones considerando:
- **1 teorica pura** del campo (ej: March 1991 para aprendizaje org)
- **1 teorica-conceptual** cercana al tema (ej: Teece 1997 para capacidades)
- **1 con validacion empirica** (ej: Edmondson 1999 para psychological safety)
- **1 aspiracional** opcional (ej: Kahneman 2003 para modelo dual)

### Framework de 12 dimensiones (fijo)
Se evalua CADA ancla y el articulo en las mismas 12 dimensiones:

1. Originalidad teorica
2. Base empirica
3. Rigor metodologico
4. Profundidad argumental
5. Alcance/generalidad
6. Actualidad de fuentes
7. Verificabilidad
8. Posicionamiento del autor
9. Constructos nombrados
10. Interdisciplinariedad
11. Claridad de tesis
12. Potencial de citacion

### Output
- Tabla comparativa (articulo vs anclas × 12 dimensiones)
- Delta por ancla (distancia global)
- Brechas criticas con accion concreta para cerrarlas
- Techo realista (que score es alcanzable sin empiria vs con empiria)

### Principio
Las anclas no son metas inalcanzables — son puntos de referencia que revelan
exactamente donde invertir esfuerzo. La brecha mas rentable es la cerrable
con menor esfuerzo y mayor impacto.

---

## Integracion con otros componentes de /dr

- **Con /dr review:** El impacto se evalua DESPUES del review (necesita saber que dice el articulo y que tan bien lo dice)
- **Con /dr read:** Las fichas de explotacion alimentan al explorador de vacios (que dicen las fuentes y donde se detienen)
- **Con /dr devil:** El diablo ataca el argumento; el impacto evalua el vacio que el argumento llena. Son complementarios.
- **Con /dr report:** El ranking de vacios se incluye en la seccion de contribucion del reporte de trazabilidad
- **Con journal:** Registrar evaluacion con top vacio + score
