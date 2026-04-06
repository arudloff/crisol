# SILA Obsidian — Esquema de referencia

Referencia técnica para la generación de notas Obsidian con flashcards Anki.
Plugin de flashcards: [Obsidian_to_Anki](https://github.com/ObsidianToAnki/Obsidian_to_Anki)
Plugin de queries: Dataview

---

## § Estructura del Vault

Ruta por defecto: `G:/Mi unidad/Doctorado MGT/SILA_Vault/`
(configurable: si el usuario indica otra ruta, usarla)

```
SILA_Vault/
├── .obsidian/                    # Config del vault (creado una sola vez)
│   ├── app.json
│   ├── core-plugins.json
│   └── community-plugins.json
├── HOME.md                       # Dashboard con queries Dataview
├── MOCs/                         # Maps of Content (queries automáticas)
│   ├── MOC_Autores.md
│   ├── MOC_Teorias.md
│   ├── MOC_Conceptos.md
│   ├── MOC_Capitulos_Tesis.md
│   ├── MOC_Cronologico.md
│   └── MOC_Jerarquia.md          # Árbol conceptual del corpus
├── Articulos/                    # Subcarpeta por artículo procesado
│   └── Apellido_Año/
│       ├── _Index.md             # Mini-dashboard del artículo
│       ├── Apellido_Año.md       # Nota de literatura
│       ├── Reflexion_Apellido_Año.md
│       ├── Anki_Apellido_Año.md  # Flashcards
│       └── Original/
│           └── Apellido_Año.ext  # Artículo fuente (PDF/docx/doc/txt)
├── Conceptos/                    # Plano (cross-article) — 1 nota atómica por concepto
├── Citas/                        # Plano (cross-article) — 1 nota por afirmación citable
└── Templates/                    # Plantillas para notas manuales
```

### Principio de organización
- **Por artículo** (`Articulos/Apellido_Año/`): todo lo que es propio de un artículo
  vive junto — nota de literatura, reflexión, flashcards, archivo original.
  Navegación manual intuitiva: una carpeta = un artículo completo.
- **Cross-article** (`Conceptos/`, `Citas/`): lo que es transversal se mantiene plano
  para que un concepto compartido por varios artículos viva en un solo lugar.
- **Jerarquía conceptual**: expresada por links internos (`↕ Anidamiento`) y
  por `MOC_Jerarquia.md`, NO por subcarpetas. Así no se rompen links al crecer el corpus.

### _Index.md — Mini-dashboard por artículo
Cada subcarpeta de artículo incluye un `_Index.md` que sirve como punto de entrada:
```markdown
---
type: index
fuente: "[[Apellido_Año]]"
---
# Apellido (Año) — Título del artículo

## Archivos de este artículo
- [[Apellido_Año|Nota de literatura]]
- [[Anki_Apellido_Año|Flashcards]] (N cards)
- [[Reflexion_Apellido_Año|Reflexiones]]
- [[Original/Apellido_Año.pdf|Artículo original]]

## Conceptos generados
- [[Concepto_1]] ◆◆◆
- [[Concepto_2]] ◆◆
- [[Concepto_3]] ◆

## Citas extraídas
- [[Cita_Apellido_Año_01]] — uso en tesis
- [[Cita_Apellido_Año_02]] — uso en tesis

## Tags emergentes
`#tema/...` · `#tradicion/...` · `#rol/...`
```

### Carpeta Original/ (dentro de cada artículo)
Contiene una copia del artículo fuente tal como fue proporcionado.

**Casos de uso según formato de entrada:**

| Entrada del usuario | Acción | Archivo en Original/ |
|---|---|---|
| Adjunta un **PDF** | Copiar al vault | `Apellido_Año.pdf` |
| Adjunta un **.docx** | Copiar al vault | `Apellido_Año.docx` |
| Adjunta un **.doc** | Copiar al vault | `Apellido_Año.doc` |
| **Pega texto** en el chat (portapapeles) | Guardar como .txt | `Apellido_Año.txt` |
| Proporciona una **ruta a un archivo** local | Copiar al vault | Mantener extensión original |

**Reglas:**
- Siempre normalizar el nombre: `Apellido_Año.extension` (sin acentos, sin espacios)
- Si el archivo ya existe, NO sobrescribir (puede ser una versión previa)
- El link desde la nota de literatura usa la extensión real:
  `[[Original/Apellido_Año.pdf|Artículo original]]`
- Para texto pegado: incluir al inicio del .txt una línea con los metadatos:
  `Fuente: [Título] | Autor(es): [Nombres] | Pegado el: [fecha]`

---

## § Convenciones de nombres de archivo

- Sin acentos ni tildes: normalizar con `String.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
- Espacios → guiones bajos
- Sin caracteres especiales que rompan links Obsidian: `[ ] # ^ | \`

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Literatura | `Apellido_Año.md` | `Weick_1995.md` |
| Concepto | `Nombre_Concepto.md` | `Sensemaking.md`, `Loose_Coupling.md` |
| Cita | `Cita_Apellido_Año_NN.md` | `Cita_Weick_1995_01.md` |
| Flashcard | `Anki_Apellido_Año.md` | `Anki_Weick_1995.md` |
| Reflexión | `Reflexion_Apellido_Año.md` | `Reflexion_Weick_1995.md` |

Si dos artículos comparten autor+año, agregar letra: `Weick_1995a.md`, `Weick_1995b.md`.

---

## § Sistema de tags emergentes

Los tags NO son una taxonomía predefinida. Emergen del contenido de cada artículo,
pero usan **prefijos dimensionales** para que con el tiempo se auto-organicen en patrones.

### Prefijos dimensionales (obligatorios)

| Prefijo | Propósito | Ejemplo | Quién lo asigna |
|---|---|---|---|
| `#rol/` | Función epistémica en la tesis | `#rol/fundamento`, `#rol/debate`, `#rol/gap` | SILA automático |
| `#peso/` | Centralidad del contenido | `#peso/critico`, `#peso/importante`, `#peso/complementario` | SILA automático |
| `#autor/` | Apellido del autor | `#autor/Weick`, `#autor/Nonaka` | SILA automático |
| `#tema/` | Tema sustantivo del artículo | `#tema/sensemaking`, `#tema/aprendizaje_organizacional` | SILA emergente |
| `#tradicion/` | Tradición o escuela teórica | `#tradicion/interpretivismo`, `#tradicion/sistemas` | SILA emergente |
| `#metodo/` | Enfoque metodológico | `#metodo/cualitativo`, `#metodo/estudio_caso` | SILA emergente |

### Reglas de generación de tags

1. **Máximo 8-10 tags por nota** — suficientes para filtrar, pocos para no diluir
2. **Tags emergentes del artículo**: el SILA analiza el contenido y propone tags `#tema/` y
   `#tradicion/` basándose en los conceptos, teorías y temas que encuentra
3. **Reutilizar tags existentes**: antes de crear un tag nuevo, verificar si ya existe uno
   similar en el vault (revisar HOME.md o notas previas). Ejemplo: si ya existe
   `#tema/aprendizaje_organizacional`, no crear `#tema/aprendizaje_en_organizaciones`
4. **Formato**: siempre minúsculas, sin acentos, guiones bajos para espacios
5. **El tag `#rol/` se asigna según la función del contenido**:
   - `#rol/fundamento` — concepto o cita que sirve de base teórica
   - `#rol/debate` — posición con la que se puede discutir o matizar
   - `#rol/metodo` — aporta herramienta metodológica o analítica
   - `#rol/evidencia` — ofrece datos, casos o ejemplos empíricos
   - `#rol/gap` — revela un vacío o pregunta abierta para la investigación
   - `#rol/definicion` — define o acota un término clave

### Meta-lectura con tags

Los tags habilitan queries de Dataview para detectar patrones del corpus:

```dataview
// ¿Cuáles son los temas más recurrentes?
TABLE length(rows) as "Frecuencia"
FROM "Conceptos" OR "Citas"
FLATTEN tags as tag
WHERE startswith(tag, "#tema/")
GROUP BY tag
SORT length(rows) DESC
```

```dataview
// ¿Qué roles epistémicos domino y cuáles me faltan?
TABLE length(rows) as "Notas"
FROM ""
FLATTEN tags as tag
WHERE startswith(tag, "#rol/")
GROUP BY tag
SORT length(rows) DESC
```

```dataview
// ¿Qué tradiciones teóricas he cubierto?
TABLE length(rows) as "Artículos"
FROM "Articulos"
FLATTEN tags as tag
WHERE startswith(tag, "#tradicion/")
GROUP BY tag
```

Estos patrones emergen naturalmente conforme crece el corpus. No se necesita
definir la taxonomía de antemano — los prefijos garantizan que sea navegable.

---

## § MOC de Jerarquía Conceptual

`MOCs/MOC_Jerarquia.md` — mapa visual del árbol conceptual del corpus.
Se **actualiza** cada vez que se procesa un nuevo artículo (append de nuevos conceptos).

```markdown
---
type: moc
---
# Árbol conceptual del corpus

Mapa de cómo los conceptos se contienen, requieren y producen entre sí.
Actualizado automáticamente con cada artículo procesado.

## Jerarquía
(El SILA agrega aquí los conceptos en formato de árbol indentado)

- [[Concepto_Padre]] ◆◆◆ (Autor, Año)
  - [[Concepto_Hijo_1]] ◆◆
  - [[Concepto_Hijo_2]] ◆◆
    - [[Concepto_Nieto]] ◆

## Pares en tensión
| Concepto A | ⇄ | Concepto B | Fuente |
|---|---|---|---|
| [[Concepto_1]] | ⇄ | [[Concepto_2]] | Apellido (Año) |

## Conceptos huérfanos
(Conceptos que aún no se conectan con otros del corpus)
```

**Lógica de actualización:**
- Al agregar nuevos conceptos, ubicarlos en la jerarquía según su `↕ Anidamiento`
- Si un concepto ya existe en el árbol y el nuevo artículo agrega relaciones,
  actualizar la posición/indentación
- Los conceptos sin relaciones van a "Conceptos huérfanos" hasta que otro artículo los conecte

---

## § Frontmatter YAML por tipo de nota

### Nota de Literatura (`Articulos/Apellido_Año/Apellido_Año.md`)

```yaml
---
type: literatura
title: "Título completo del artículo"
authors:
  - Nombre Apellido
year: 1995
journal: "Nombre del journal"
doi: "10.xxxx/xxxxx"
tags:
  - autor/Apellido
  - teoria/nombre_teoria
  - tema/nombre_tema
  - peso/critico
capitulo_tesis:
  - "Cap 2 Marco Teorico"
tradicion_teorica: "Nombre de la tradición"
argumento_central: "Resumen en 1-2 oraciones"
peso_global: critico
fecha_procesamiento: YYYY-MM-DD
sila_docx: "G:/Mi unidad/Doctorado MGT/SILA/SILA_Apellido_Año.docx"
revision_espaciada:
  sesion_1: YYYY-MM-DD
  sesion_2: YYYY-MM-DD
  sesion_3: YYYY-MM-DD
estado_revision: procesado
---
```

Valores válidos:
- `peso_global`: `critico` | `importante` | `complementario`
- `estado_revision`: `cargado` | `procesado` | `en_lectura` | `sesion1_ok` | `sesion2_ok` | `completo`
  - `cargado`: articulo en vault pero sin SILA (lista de lectura pendiente)
  - `procesado`: SILA generado, aun no leido
  - `en_lectura`: leyendo/trabajando el documento
  - `sesion1_ok` / `sesion2_ok` / `completo`: sesiones de revision espaciada
- `revision_espaciada`: sesion_1 = fecha de procesamiento, sesion_2 = +7 días, sesion_3 = +30 días

**Cuerpo de la nota** — secciones en este orden:
```markdown
## Posicionamiento en la literatura
(Contenido de Sección A.1)

## Esqueleto argumentativo
(Contenido de Sección A.2 — pasos numerados)

## Resumen por secciones
| Sección | Síntesis | Coord. |
|---|---|---|
(Contenido de Sección A.3)

## Alertas de lectura
> [!warning] Alerta 1
> Descripción...
(Contenido de Sección A.4)

## Diálogos inter-textuales
### ↔ Converge con
- [[Autor_Año]] — punto de convergencia

### ⇄ Entra en tensión con
- [[Autor_Año]] — punto de tensión

### → Abre preguntas hacia
- [[Autor_Año]] — pregunta abierta
(Contenido de Sección E)

## Notas
Links: [[Anki_Apellido_Año|Flashcards]] · [[Reflexion_Apellido_Año|Reflexiones]]
Conceptos: [[Concepto_1]] · [[Concepto_2]] · [[Concepto_3]]
```

---

### Nota de Concepto (`Conceptos/Nombre_Concepto.md`)

```yaml
---
type: concepto
nombre: Nombre del Concepto
aliases:
  - nombre alternativo 1
  - nombre alternativo 2
autor_origen: Nombre Apellido
fuente: "[[Apellido_Año]]"
peso: critico
tags:
  - concepto/nombre_concepto
  - autor/Apellido
  - peso/critico
capitulo_tesis:
  - "Cap 2 Marco Teorico"
fecha_creacion: YYYY-MM-DD
---
```

**Cuerpo de la nota**:
```markdown
## Definición
2-3 oraciones claras y directas.

## ↕ Anidamiento
- **Contiene →** [[Concepto_Hijo_1]], [[Concepto_Hijo_2]]
- **Es parte de →** [[Concepto_Padre]]
- **Requiere →** [[Concepto_Requisito]]
- **Produce →** [[Concepto_Resultado]]

## ⇄ Tensiones
| Este concepto | ⇄ | Concepto opuesto | Implicación |
|---|---|---|---|
| Nombre | ⇄ | [[Otro_Concepto]] | Descripción de la tensión |

## Origen
- [ ] Propio del autor
- [ ] Tomado de: ___
- [ ] Síntesis original

## Fuentes
- [[Apellido_Año]] (fuente principal)
```

**Cuando un concepto ya existe** (procesando un segundo artículo que lo menciona):
NO sobrescribir. Agregar al final:
```markdown
## También en [[Nuevo_Apellido_Año]]
Perspectiva de este autor: breve descripción de cómo este autor usa/define el concepto.
```

---

### Nota de Cita (`Citas/Cita_Apellido_Año_NN.md`)

```yaml
---
type: cita
autor: Nombre Apellido
year: 1995
fuente: "[[Apellido_Año]]"
pagina: "p. 14"
seccion_articulo: "Nombre de la sección"
uso_tesis: "Función argumental"
tags:
  - cita/funcion_argumental
  - autor/Apellido
capitulo_tesis:
  - "Cap 2 Marco Teorico"
peso: critico
fecha_creacion: YYYY-MM-DD
---
```

**Cuerpo de la nota**:
```markdown
## Cita textual
> "Texto verbatim exacto de la afirmación citable."
> — Apellido (Año, p. XX)

## Uso en la tesis
Descripción de cómo usar esta cita: definir concepto, justificar enfoque, etc.

## Contexto en el artículo
Breve descripción de dónde aparece y qué papel juega en el argumento.

---
Fuente: [[Apellido_Año]]
```

---

### Nota de Reflexión (`Reflexiones/Reflexion_Apellido_Año.md`)

```yaml
---
type: reflexion
fuente: "[[Apellido_Año]]"
fecha_lectura: YYYY-MM-DD
estado_sesion: "1a lectura"
tags:
  - reflexion
  - autor/Apellido
capitulo_tesis:
  - "Cap 2 Marco Teorico"
---
```

**Cuerpo de la nota** (template con blancos para completar):
```markdown
## Puente a la tesis
1. **¿Qué argumento de MI tesis respalda este texto?**
   _Espacio para escribir..._

2. **¿Con qué posición teórica quiero debatir o matizar?**
   _Espacio para escribir..._

3. **¿Qué gap de investigación me revela este texto?**
   _Espacio para escribir..._

4. **¿Cómo lo citaría en mi marco teórico?** (borrador de oración)
   _Espacio para escribir..._

5. **¿Qué sigo sin entender después de la pre-lectura?**
   _Espacio para escribir..._

## Primera impresión general
_¿Qué fue lo más sorprendente o confuso?_

## Conexiones con mi investigación doctoral
_¿Qué encaja con mi marco teórico?_

## Preguntas que me genera este texto
_Dudas teóricas, aspectos a profundizar..._

## Textos a explorar
- [ ] Referencia 1
- [ ] Referencia 2

## Acciones concretas
- [ ] Acción 1
- [ ] Acción 2

## Dudas activas
_Transferir aquí las marcas '?' hechas durante la lectura:_
1. _¿...?_
2. _¿...?_

## Agenda para discusión
| Pregunta | Respuesta |
|---|---|
| ¿Con quién discutirías este texto? | _..._ |
| ¿Qué pregunta específica llevarías? | _..._ |
| ¿Potencial para seminario o coloquio? | ☐ Sí  ☐ No |
| ¿En qué sección de tu tesis lo citarías? | _..._ |

## Notas libres
_Espacio sin estructura para pensamiento libre..._

---
Fuente: [[Apellido_Año]]
```

---

## § Flashcards — Envio directo via AnkiConnect

**NO usar el plugin Obsidian_to_Anki** (tiene problemas de carga: no registra comandos
si Anki no esta corriendo al iniciar Obsidian). En su lugar, enviar cards directamente
a Anki via AnkiConnect (puerto 8765) usando un script Node.js con `fetch`.

El archivo .md se genera en el vault como referencia, pero las cards se envian por API.
Cada archivo `Articulos/Apellido_Año/Anki_Apellido_Año.md` contiene ~30-35 cards.

### Estructura del archivo

```yaml
---
type: flashcard
fuente: "[[Apellido_Año]]"
autor: Nombre Apellido
year: 1995
tags:
  - anki
  - autor/Apellido
fecha_creacion: YYYY-MM-DD
---
```

Inmediatamente después del frontmatter:

```markdown
TARGET DECK
Doctorado::Apellido_Año

FILE TAGS
autor::Apellido tema1 tema2
```

### Tipos de cards y sintaxis

**Basic card** — heading `###` = pregunta, párrafo = respuesta:
```markdown
### ¿Qué es [concepto] según [Autor] ([Año])?
Respuesta clara y concisa en 2-4 líneas.
```

**Cloze card** — `{{c1::texto}}` dentro de párrafo (sin heading):
```markdown
El {{c1::sensemaking}} es el proceso mediante el cual las personas
{{c2::construyen interpretaciones plausibles}} de situaciones ambiguas.
```

**Separador entre cards**: `---` (línea horizontal)

### Secciones del archivo de flashcards (en este orden)

```markdown
## Conceptos clave
(~6-10 Basic cards: una por concepto del glosario)

### ¿Qué es [concepto] según [Autor]?
Definición...

---

## Definiciones (Cloze)
(~5-8 Cloze cards: definiciones con blancos estratégicos)

El {{c1::término}} es {{c2::definición}}...

---

## Distinciones críticas
(~4-6 Basic cards: pares de conceptos que se confunden)

### ¿Cuál es la diferencia entre [A] y [B]?
**A**: descripción...
**B**: descripción...

---

## Retrieval por secciones
(~4-6 Basic cards: extraídas de los bloques de retrieval de Sección B)

### Pregunta de retrieval
Respuesta...

---

## Relaciones autor-teoría
(~3-5 Basic o Cloze: quién dijo qué, tradiciones teóricas)

### ¿Qué tradición teórica representa [Autor]?
Respuesta...

{{c1::Autor}} se ubica en la tradición {{c2::nombre}}, que se diferencia de {{c3::otra}} en...

---

## Citas memorizables
(~3-5 Basic: frases clave para recordar y poder citar)

### Completar la cita de [Autor] ([Año]): "[inicio]..."
"[cita completa]" — Ilustra el principio de {{c1::concepto}}.

---

## Alertas de lectura
(~2-3 Basic: puntos contraintuitivos del artículo)

### ¿Por qué es contraintuitivo que [afirmación]?
Explicación...
```

### Reglas de generación de flashcards

1. **Preguntas en español**, respuestas en español
2. **Nunca copiar párrafos completos** como respuesta — sintetizar en 2-4 líneas
3. **Cloze**: máximo 5 blancos por card, elegir palabras clave no obvias
4. **Cada card debe ser autocontenida** — entendible sin leer el artículo
5. **Incluir contexto mínimo** en la pregunta: autor, año, concepto
6. **Las respuestas de retrieval** vienen de Sección B del SILA
7. **Las citas memorizables** vienen de Sección A.5 del SILA
8. **Total objetivo**: 25-40 cards por artículo

---

## § MOCs — Queries Dataview

Los MOCs usan Dataview para auto-actualizarse. NO necesitan edición manual.

### HOME.md
```markdown
---
type: home
---
# SILA Vault — Corpus Doctoral

## Pendientes de lectura
```dataview
TABLE authors as Autores, year as Año
FROM "Articulos"
WHERE type = "literatura" AND estado_revision = "cargado"
SORT fecha_procesamiento DESC
```

## Procesados (listos para leer)
```dataview
TABLE authors as Autores, year as Año, peso_global as Peso
FROM "Articulos"
WHERE type = "literatura" AND estado_revision = "procesado"
SORT fecha_procesamiento DESC
```

## En lectura / revision
```dataview
TABLE authors as Autores, year as Año, estado_revision as Estado
FROM "Articulos"
WHERE type = "literatura" AND (estado_revision = "en_lectura" OR estado_revision = "sesion1_ok" OR estado_revision = "sesion2_ok")
SORT fecha_procesamiento ASC
```

## Completados
```dataview
TABLE authors as Autores, year as Año, peso_global as Peso
FROM "Articulos"
WHERE type = "literatura" AND estado_revision = "completo"
SORT year ASC
```

## Meta-lectura: patrones del corpus
```dataview
TABLE length(rows) as "Notas"
FROM "Conceptos" OR "Citas"
FLATTEN tags as tag
WHERE startswith(tag, "#tema/")
GROUP BY tag
SORT length(rows) DESC
```

## Navegación
- [[MOC_Autores|Por Autor]]
- [[MOC_Teorias|Por Teoría]]
- [[MOC_Conceptos|Por Concepto]]
- [[MOC_Jerarquia|Árbol Conceptual]]
- [[MOC_Capitulos_Tesis|Por Capítulo de Tesis]]
- [[MOC_Cronologico|Cronológico]]

## Índice manual
(El script agrega una línea aquí por cada artículo procesado)
```

### MOC_Autores.md
```markdown
---
type: moc
---
# Autores en el corpus

```dataview
TABLE year as Año, peso_global as Peso, tradicion_teorica as Tradición
FROM "Articulos"
WHERE type = "literatura"
SORT authors ASC
```
```

### MOC_Teorias.md
```markdown
---
type: moc
---
# Tradiciones teóricas

```dataview
TABLE rows.file.link as Artículos
FROM "Articulos"
WHERE type = "literatura"
GROUP BY tradicion_teorica
```
```

### MOC_Conceptos.md
```markdown
---
type: moc
---
# Conceptos del corpus

## Críticos (◆◆◆)
```dataview
TABLE autor_origen as Autor, fuente as Fuente
FROM "Conceptos"
WHERE peso = "critico"
SORT nombre ASC
```

## Importantes (◆◆)
```dataview
TABLE autor_origen as Autor, fuente as Fuente
FROM "Conceptos"
WHERE peso = "importante"
SORT nombre ASC
```

## Complementarios (◆)
```dataview
TABLE autor_origen as Autor, fuente as Fuente
FROM "Conceptos"
WHERE peso = "complementario"
SORT nombre ASC
```
```

### MOC_Capitulos_Tesis.md
```markdown
---
type: moc
---
# Notas por capítulo de tesis

## Cap 2 Marco Teórico
```dataview
TABLE type as Tipo, peso as Peso
FROM "Articulos" OR "Conceptos" OR "Citas"
WHERE contains(capitulo_tesis, "Cap 2 Marco Teorico")
SORT type ASC
```

(Repetir para cada capítulo relevante)
```

### MOC_Cronologico.md
```markdown
---
type: moc
---
# Artículos por fecha de procesamiento

```dataview
TABLE title as Título, authors as Autores, peso_global as Peso
FROM "Articulos"
WHERE type = "literatura"
SORT fecha_procesamiento DESC
```
```

---

## § Queries útiles para escritura de tesis

Colocar en cualquier nota o en un MOC dedicado.

**Todas las citas para un capítulo específico:**
```dataview
TABLE autor as Autor, year as Año, uso_tesis as "Uso en tesis", pagina as Página
FROM "Citas"
WHERE contains(capitulo_tesis, "Cap 2 Marco Teorico")
SORT peso ASC
```

**Conceptos críticos del corpus completo:**
```dataview
TABLE autor_origen as Autor, fuente as Fuente
FROM "Conceptos"
WHERE peso = "critico"
SORT nombre ASC
```

**Artículos de un autor específico:**
```dataview
LIST
FROM "Articulos"
WHERE type = "literatura" AND contains(authors, "Weick")
```

**Citas por tradición teórica:**
```dataview
TABLE fuente as Fuente, pagina as Página
FROM "Citas"
WHERE contains(tags, "tradicion/sensemaking")
```

**Revisiones pendientes esta semana:**
```dataview
TABLE estado_revision as Estado
FROM "Articulos"
WHERE type = "literatura" AND estado_revision != "completo"
SORT fecha_procesamiento ASC
```

**Meta-lectura: ¿Qué roles epistémicos domino?**
```dataview
TABLE length(rows) as "Notas"
FROM ""
FLATTEN tags as tag
WHERE startswith(tag, "#rol/")
GROUP BY tag
SORT length(rows) DESC
```

**Meta-lectura: gaps identificados (ideas para contribución original)**
```dataview
TABLE fuente as Fuente, uso_tesis as "Uso"
FROM "Citas"
WHERE contains(tags, "rol/gap")
```

---

## § Lógica aditiva del script

```
function ensureVaultExists(vaultRoot):
  if NOT exists vaultRoot:
    crear: .obsidian/, HOME.md, MOCs/*, Articulos/, Conceptos/, Citas/, Templates/
  // Si ya existe: no tocar nada, solo agregar archivos nuevos

function processArticle(data, vaultRoot):
  articleId = sanitize(apellido + "_" + año)

  // NUNCA sobrescribir archivos existentes
  if exists Articulos/articleId/:
    ADVERTIR al usuario, NO continuar sin confirmación

  CREAR: Articulos/articleId/              // subcarpeta del artículo
  CREAR: Articulos/articleId/_Index.md     // mini-dashboard
  CREAR: Articulos/articleId/articleId.md  // nota de literatura
  CREAR: Articulos/articleId/Reflexion_articleId.md
  CREAR: Articulos/articleId/Anki_articleId.md
  CREAR: Articulos/articleId/Original/     // copiar artículo fuente aquí

  for each concepto in glosario:
    if exists Conceptos/concepto.md:
      APPEND sección "## También en [[articleId]]"
    else:
      CREAR: Conceptos/concepto.md

  CREAR: Citas/Cita_articleId_01.md ... _NN.md

  APPEND a HOME.md: "- [[Articulos/articleId/_Index|Apellido (Año)]]"
  ACTUALIZAR: MOCs/MOC_Jerarquia.md (agregar nuevos conceptos al árbol)
```

---

## § Envio directo a Anki via AnkiConnect

### Requisitos
- Anki Desktop abierto con AnkiConnect (addon 2055492159)
- Config: `%APPDATA%/Anki2/addons21/2055492159/config.json` debe tener:
  `"ignoreOriginList": ["http://localhost", "http://127.0.0.1"]`

### Script de envio (Node.js con fetch)
```javascript
// USAR fetch nativo de Node.js (NO el modulo http — falla con AnkiConnect)
async function anki(action, params = {}) {
  const res = await fetch('http://127.0.0.1:8765', {
    method: 'POST',
    body: JSON.stringify({ action, version: 6, params })
  });
  const r = await res.json();
  if (r.error) throw new Error(r.error);
  return r.result;
}

// Crear mazo
await anki('createDeck', { deck: 'Doctorado::Apellido_Año' });

// Basic card (Anki en español: tipo "Basico", campos "Anverso"/"Reverso")
await anki('addNote', { note: {
  deckName: 'Doctorado::Apellido_Año',
  modelName: 'Básico',
  fields: { Anverso: 'pregunta', Reverso: 'respuesta' },
  tags: ['SILA', 'Apellido_Año']
}});

// Cloze card (tipo "Respuesta anidada", campo "Texto")
await anki('addNote', { note: {
  deckName: 'Doctorado::Apellido_Año',
  modelName: 'Respuesta anidada',
  fields: { Texto: 'La complejidad es un {{c1::proceso}} recursivo.' },
  tags: ['SILA', 'Apellido_Año']
}});

// IMPORTANTE: 150ms de delay entre cada card para no saturar AnkiConnect
await new Promise(r => setTimeout(r, 150));
```

### Tipos de cards y distribucion (~30-35 por articulo)
- ~8 Basic: conceptos clave (del glosario)
- ~5 Basic: distinciones criticas
- ~6 Basic: retrieval por secciones
- ~3 Basic: relaciones autor-teoria
- ~2 Basic: alertas de lectura
- ~7 Cloze: definiciones con blancos
- ~3 Cloze: citas memorizables con blancos
- ~2 Cloze: relaciones autor-teoria

### Notas importantes
- Anki en español usa tipos "Básico" y "Respuesta anidada" (no "Basic"/"Cloze")
- Campos: "Anverso"/"Reverso" para Basic, "Texto" para Cloze
- Si Anki esta en ingles: "Basic" con "Front"/"Back", "Cloze" con "Text"
- Verificar tipos disponibles: `anki('modelNames')`

---

## § Configuración .obsidian (primera vez)

### app.json
```json
{
  "alwaysUpdateLinks": true,
  "newLinkFormat": "shortest",
  "useMarkdownLinks": false,
  "showFrontmatter": true
}
```

### community-plugins.json
```json
["dataview", "obsidian-to-anki-plugin"]
```

### core-plugins.json
```json
{
  "file-explorer": true,
  "global-search": true,
  "graph-view": true,
  "tag-pane": true,
  "backlink": true,
  "page-preview": true,
  "templates": true
}
```

Nota: los plugins community se listan en `community-plugins.json` pero el usuario
debe instalarlos manualmente desde Obsidian (Settings → Community plugins → Browse).
El archivo solo indica que están habilitados una vez instalados.
