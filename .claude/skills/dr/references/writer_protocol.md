# Protocolo de Escritura Doctoral — Escritor /dr write v1

Referencia para el agente escritor de `/dr write`.
Genera borradores de secciones o articulos completos con quality gates integrados.
Opera en par worker-critic: escribe, se autoevalua, corrige, y entrega.

---

## Principio rector

El escritor NO genera texto generico y luego lo "humaniza". Escribe desde el inicio
con la voz del investigador, usando sus conceptos, su estilo, y su estructura argumental.
El humanizer es red de seguridad, no muleta.

---

## Modos de escritura

### /dr write section [titulo] [--from notas|ficha|outline]
Genera una seccion especifica a partir de:
- Notas sueltas del investigador
- Ficha de explotacion de /dr read
- Outline proporcionado
- Instrucciones en lenguaje natural

#### Schema: Ficha de explotacion → Esqueleto argumental

Cuando el input es `--from ficha`, mapear campos asi:

| Campo de la ficha | Se convierte en | Campo del esqueleto |
|---|---|---|
| `Mapa de uso → Articulo` | Destino del texto | Articulo target (A1-A7) |
| `Mapa de uso → Seccion` | Ubicacion dentro del articulo | Seccion target |
| `Mapa de uso → Funcion` | Rol argumental | **Funcion en el articulo** (fundamentar/demostrar/sintetizar) |
| `Conexiones → Concepto de MI tesis` | Idea central a desarrollar | **Tesis de la seccion** |
| `Conexiones → Tipo de conexion` | Relacion con la tesis | Determina tono: apoya→afirmar, contradice→responder, extiende→proyectar |
| `Afirmaciones citables → Cita textual` | Evidencia para cada movimiento | **[Movimiento N] — [claim + evidencia + fuente]** |
| `Afirmaciones citables → Uso en la tesis` | Funcion de la cita | Posicion de la cita en el esqueleto |
| `Tensiones → Lo que lo desafia` | Contraargumentos a abordar | Movimiento de respuesta o parrafo de limitaciones |
| `Tensiones → Vacios explotables` | Oportunidad de contribucion | **Cierre** — implicacion o pregunta abierta |
| `Veredicto` | Prioridad y alcance | Determina extension y profundidad |

**Ejemplo de transformacion:**

Ficha dice:
```
Conexion: "procesador consciente" ← hallazgo: "behavioral throughput 10 bits/s" (apoya, directa)
Cita: "the capacity... is remarkably concordant at about 10 bits/s" (Zheng, 2024, p.3)
Mapa: A4 → seccion 3.1 → fundamentar
```

Esqueleto genera:
```
## Esqueleto: El cuello de botella consciente
Tesis: El procesador consciente opera a ~10 bits/s — dato empirico, no metafora
Funcion: fundamentar (seccion 3.1 de A4)
1. [Apertura] — plantear la paradoja: cerebro masivo, canal minimo
2. [Movimiento 1] — "remarkably concordant at about 10 bits/s" (Zheng, 2024, p.3)
3. [Movimiento 2] — implicacion para hibridacion: lo que cabe en 10 bits/s es reemplazable
4. [Cierre] — puente a seccion 3.2 (procesador inconsciente)
```

### /dr write draft [articulo] [--outline]
Genera borrador completo de un articulo. Requiere:
- Titulo y tesis central
- Outline de secciones (si no se provee, propone uno primero)
- Fuentes a usar (archivos, fichas, PDFs)

### /dr write extend [texto] [direccion]
Extiende un texto existente en una direccion especifica:
- Profundizar un argumento
- Agregar evidencia
- Desarrollar una implicacion
- Responder a un contraargumento

### /dr write rewrite [texto] [instruccion]
Reescribe un fragmento siguiendo una instruccion especifica:
- Cambiar registro (mas formal / mas accesible)
- Fortalecer argumento
- Integrar nueva fuente
- Reestructurar logica

---

## Flujo obligatorio (para todos los modos)

### Paso 1 — Entender el encargo
- Que tipo de texto? (seccion, articulo, parrafo)
- Donde va en la tesis? (A1-A7, Cap0, Protocolo, nuevo)
- Que funcion cumple? (fundamentar, argumentar, sintetizar, responder)
- Que fuentes usar? (PDFs, fichas, notas)
- Que tono? (el default es el estilo Alejandro; solo cambiar si se pide)

### Paso 2 — Construir esqueleto argumental
Antes de escribir prosa, producir esqueleto:

```markdown
## Esqueleto: [titulo de la seccion]

**Tesis de la seccion:** [1 oracion — que argumenta esta seccion]
**Funcion en el articulo:** [fundamentar/demostrar/sintetizar/responder]

1. [Apertura] — [que hace: plantear problema / contextualizar / provocar]
2. [Movimiento 1] — [claim + evidencia + fuente]
3. [Movimiento 2] — [claim + evidencia + fuente]
4. [Movimiento N] — ...
5. [Cierre] — [que hace: implicacion / pregunta / puente a siguiente seccion]

**Fuentes involucradas:** [lista]
**Conexion con tesis central:** [como contribuye al argumento global]
```

Presentar esqueleto al investigador. Proceder solo si aprueba o ajusta.

### Paso 3 — Escribir borrador
Reglas de escritura:

**Estructura argumental:**
- Cada parrafo tiene UNA funcion clara (no mezclar)
- Los parrafos se conectan por logica del argumento, no por conectores mecanicos
- La evidencia va DENTRO del argumento, no en lista separada
- Las citas fundamentan, no decoran

**Estilo calibrado a Alejandro:**
- Metaforas tecnicas propias (no generar nuevas sin permiso)
- Oraciones con subordinadas multiples — OK, es su estilo
- Citas bilingues: claim en español, quote original en ingles entre comillas
- Registro: precision cientifica + sensibilidad humanistica
- Construir cascadas: dato biologico → implicacion cognitiva → consecuencia organizacional
- Primera persona cuando posiciona ("argumento que", "propongo", "mi lectura de X")

**Prohibiciones:**
- NO usar patrones del catalogo humanizer (C01-C05, A01-A06, M01-M06)
- NO cerrar con coletilla inspiracional
- NO hacer listas disfrazadas de prosa
- NO usar hedging sistematico ("es importante señalar que...")
- NO equilibrar artificialmente pros y contras — tomar posicion
- NO inventar fuentes, datos, ni citas
- NO agregar conceptos que el investigador no ha definido

### Paso 4 — Autoevaluacion (worker-critic)
Antes de entregar, correr internamente evaluacion rapida:

| Chequeo | Pregunta | Si falla |
|---------|----------|----------|
| Coherencia | Cada parrafo sigue logicamente del anterior? | Reorganizar |
| Tesis | Se puede identificar el argumento central en 1 oracion? | Explicitar |
| Evidencia | Cada claim tiene soporte? | Agregar fuente o marcar [FUENTE PENDIENTE] |
| Anti-IA | Hay patrones del catalogo humanizer? | Reescribir fragmento |
| Voz | Suena a Alejandro o a IA generica? | Ajustar registro |
| Longitud | Respeta extension pedida? | Recortar o expandir |

### Paso 5 — Entregar con metadata

```markdown
## Borrador: [titulo]

**Gate actual:** BORRADOR / CAPITULO / ENTREGA
**Score estimado:** [autoevaluacion rapida de 6 componentes]
**Fuentes usadas:** [N]
**Citas verificadas:** [N de M] — [M-N marcadas como PENDIENTE VERIFICACION]
**Advertencias:** [lo que falta, lo debil, lo que necesita decision del investigador]

---

[TEXTO DEL BORRADOR]

---

**Notas del escritor:**
- [decision estilistica que tome y por que]
- [alternativa que descarte]
- [pregunta para el investigador]
```

---

## Quality Gates — Criterios de paso

### Gate BORRADOR (score compuesto ≥70)
- Argumento identificable
- Fuentes citadas (no necesariamente todas verificadas)
- Sin citas fabricadas
- Estructura logica presente aunque imperfecta
- **Accion:** Listo para /dr review

### Gate CAPITULO (score compuesto ≥80, cada componente ≥70)
- Argumento pulido y explicito
- Todas las fuentes citadas correctamente
- Posicionamiento en literatura presente
- Metodo declarado (si aplica)
- Sin patrones anti-IA criticos
- **Accion:** Listo para revision de director/tutor

### Gate ENTREGA (score compuesto ≥90, cada componente ≥80, zero fabricadas)
- Todo lo anterior +
- Citas 100% verificadas contra PDFs
- Score anti-IA ≥85
- Limitaciones explicitadas
- Nota metodologica incluida
- **Accion:** Listo para enviar a revista/comite

---

## Integracion con otros componentes

- **Con /dr read:** Las fichas de explotacion son input ideal para write
- **Con /dr review:** Despues de escribir, pasar por review para score formal
- **Con /dr humanize:** Si el score anti-IA < 85, correr humanizer sobre el output
- **Con /dr verify:** Marcar citas no verificadas como [PENDIENTE VERIFICACION]
- **Con journal:** Registrar cada borrador con titulo, gate, y score estimado
