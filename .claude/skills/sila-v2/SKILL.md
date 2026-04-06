---
name: sila
description: >
  Genera el SILA — Sistema Integrado de Lectura Académica — un documento Word (.docx)
  completo para procesamiento doctoral profundo de artículos académicos. Úsala SIEMPRE
  que el usuario suba, pegue o mencione un artículo académico y pida procesarlo, anotarlo,
  analizarlo, o crear un documento de estudio. También cuando mencionen palabras como
  'SILA', 'lectura anotada', 'procesar artículo', 'documento de estudio', 'análisis de
  texto doctoral', 'lectura académica', o similares. Si el usuario adjunta un PDF o texto
  de paper académico sin instrucciones específicas, ofrece aplicar esta skill directamente.
---

# SILA — Sistema Integrado de Lectura Académica

Transforma cualquier artículo académico en un documento Word estructurado en 6 secciones
que cubre el ciclo completo de aprendizaje doctoral: antes, durante y después de la lectura.
Además genera una red de notas Obsidian con flashcards Anki y metadata para consulta doctoral.

**IMPORTANTE — Entorno de ejecución: Claude Code en Windows**
- Node.js con paquete `docx` instalado globalmente
- Python 3 con `python-docx` disponible para verificación
- Usar `NODE_PATH` apuntando al global de npm en Windows

---

## Configuración de salida

| Salida | Ruta por defecto | Configurable |
|---|---|---|
| **SILA .docx** | `G:/Mi unidad/Doctorado MGT/SILA/SILA_[Apellido]_[Año].docx` | Sí |
| **Obsidian Vault** | `G:/Mi unidad/Doctorado MGT/SILA_Vault/` | Sí |

Si el usuario especifica otra ruta para el vault, usarla.
Si la carpeta del vault no existe, crearla con la estructura inicial completa.
El vault es **aditivo**: cada articulo agrega notas, nunca sobrescribe las existentes.

### Estados de articulos

El frontmatter de cada nota de literatura incluye `estado_revision` con estos valores:

| Estado | Significado | Transicion |
|---|---|---|
| `cargado` | Articulo en el vault pero no procesado con SILA | Usuario sube archivo sin pedir SILA |
| `procesado` | SILA generado pero aun no leido | Al terminar /sila |
| `en_lectura` | Leyendo/trabajando el documento | Usuario lo marca manualmente |
| `sesion1_ok` | Primera lectura + retrieval completado | Usuario lo marca |
| `sesion2_ok` | Revision 7 dias completada | Usuario lo marca |
| `completo` | Revision 30 dias, texto integrado a la tesis | Usuario lo marca |

Si el usuario solo quiere **cargar un articulo sin procesarlo** (lista de lectura pendiente),
crear solo: subcarpeta en `Articulos/`, archivo original en `Original/`, y una nota de
literatura minima con `estado_revision: cargado` y frontmatter basico (titulo, autores, año).

### Marcas para flashcards adicionales (FC/CZ)

El usuario puede marcar texto durante la lectura (en el .docx o en Obsidian) para generar
flashcards adicionales sin afectar las existentes:

| Marca | Genera | Ejemplo |
|---|---|---|
| `[FC] texto [/FC]` | Card Basica (texto = respuesta, SILA genera pregunta) | `[FC] La autopoiesis implica autoproduccion [/FC]` |
| `[CZ] texto con ==blancos== [/CZ]` | Card Cloze (==texto== se convierte en {{c1::}}) | `[CZ] La complejidad es un ==proceso== ==recursivo== [/CZ]` |

Cuando el usuario pida "procesa las marcas FC del articulo Apellido_Año":
1. Leer el documento buscando marcas [FC] y [CZ]
2. Generar las cards adicionales
3. Enviarlas a Anki via AnkiConnect (AnkiConnect rechaza duplicados automaticamente)
4. NO modificar las cards existentes

---

## Flujo de trabajo obligatorio

### Paso 0 — Leer antes de codificar
1. Lee `references/metodologia.md` (estructura de las 6 secciones del .docx).
2. Lee `references/obsidian_schema.md` (esquemas de notas Obsidian, sintaxis Anki, Dataview).

### Paso 1 — Analizar el artículo
Antes de escribir código, realiza este análisis interno:
- **Argumento central**: qué intenta demostrar y cómo lo demuestra
- **Estructura**: todas las secciones con sus títulos exactos
- **Autores y teorías citadas**: quiénes son, qué tradición teórica representan
- **Tensiones conceptuales**: pares de ideas que se oponen o compiten
- **Anidamientos**: qué conceptos contienen a otros
- **Alertas de lectura**: los 3-5 puntos más contraintuitivos o confusos
- **Posicionamiento**: a qué debate responde, con quién dialoga, qué gap llena
- **Afirmaciones citables**: las 6-8 frases directamente usables en un marco teórico

### Paso 2 — Generar el documento
Escribir el script Node.js en un archivo temporal y ejecutar:
```bash
NODE_PATH="$(npm root -g)" node /tmp/build_sila.js
```
En Windows, la ruta de npm global se obtiene con `npm root -g`.

Copiar el resultado a `G:/Mi unidad/Doctorado MGT/SILA/SILA_[Apellido]_[Año].docx`.

Convención de nombres: `SILA_[PrimerApellido]_[Año].docx`
Ejemplos: `SILA_Bustamante_2004.docx`, `SILA_Weick_1995.docx`

### Paso 2.5 — Generar notas Obsidian y flashcards Anki

Usando el mismo análisis del Paso 1, generar los archivos markdown para el vault Obsidian.
Leer `references/obsidian_schema.md` para esquemas exactos de frontmatter y sintaxis.

El script Node.js debe incluir una segunda fase (después de generar el .docx) que:

1. **Verificar/crear vault**: si la carpeta raíz no existe, crear estructura completa
   incluyendo `.obsidian/`, `HOME.md`, MOCs con Dataview queries, y carpetas vacías.
   Estructura: `Articulos/`, `Conceptos/`, `Citas/`, `MOCs/`, `Templates/`.

2. **Crear subcarpeta del artículo** (`Articulos/Apellido_Año/`):
   Cada artículo vive en su propia carpeta con todos sus archivos propios:
   ```
   Articulos/Apellido_Año/
   ├── _Index.md              # Mini-dashboard con links a todo
   ├── Apellido_Año.md        # Nota de literatura
   ├── Reflexion_Apellido_Año.md
   ├── Anki_Apellido_Año.md   # Flashcards
   └── Original/
       └── Apellido_Año.ext   # Artículo fuente
   ```

3. **Guardar artículo original** en `Articulos/Apellido_Año/Original/`:
   - **PDF, .docx, .doc**: copiar el archivo como `Apellido_Año.ext`
   - **Texto pegado** (portapapeles): guardar como `Apellido_Año.txt`
     con línea de metadatos al inicio: `Fuente: [Título] | Autor(es) | Fecha`
   - **Ruta a archivo local**: copiar manteniendo la extensión original
   - NUNCA sobrescribir si ya existe un archivo con el mismo nombre

4. **_Index.md** — mini-dashboard del artículo:
   - Links a: nota de literatura, flashcards, reflexión, artículo original
   - Lista de conceptos generados con peso (◆◆◆/◆◆/◆)
   - Lista de citas extraídas con uso en tesis
   - Tags emergentes del artículo

5. **Nota de literatura** (`Articulos/Apellido_Año/Apellido_Año.md`):
   - Frontmatter YAML completo (ver `obsidian_schema.md § Nota de Literatura`)
   - Secciones: Posicionamiento, Esqueleto argumentativo, Resumen, Alertas, Diálogos
   - Links internos a conceptos `[[Concepto]]` y citas `[[Cita_Apellido_Año_01]]`
   - Link al archivo original: `[[Original/Apellido_Año.ext|Artículo original]]`
   - Fechas de revisión espaciada: hoy, +7 días, +30 días
   - **Tags emergentes**: máx. 8-10 tags con prefijos `#tema/`, `#tradicion/`,
     `#rol/`, `#peso/`, `#autor/`, `#metodo/` (ver `obsidian_schema.md § Tags`)

6. **Notas de concepto** (`Conceptos/NombreConcepto.md`) — CROSS-ARTICLE:
   - Una nota atómica por cada concepto del Glosario (Sección C)
   - Si el concepto YA EXISTE (de otro artículo), NO sobrescribir:
     agregar sección `## También en [[nuevo_artículo]]`
   - Frontmatter con peso, autor origen, tags emergentes
   - Cuerpo: Definición, Anidamiento (↕), Tensiones (⇄), Origen

7. **Notas de cita** (`Citas/Cita_Apellido_Año_NN.md`) — CROSS-ARTICLE:
   - Una nota por cada afirmación citable de Sección A.5
   - Texto verbatim en bloque de cita `>`, metadatos, tags emergentes

8. **Archivo de flashcards** (`Articulos/Apellido_Año/Anki_Apellido_Año.md`):
   - `TARGET DECK`: `Doctorado::Apellido_Año`
   - `FILE TAGS`: autor y temas principales
   - **25-40 cards** organizadas en secciones:
     - Conceptos clave (~6-10 Basic) — del glosario
     - Definiciones (~5-8 Cloze) — con `{{c1::blancos}}` estratégicos
     - Distinciones críticas (~4-6 Basic) — pares que se confunden
     - Retrieval por secciones (~4-6 Basic) — de los bloques de retrieval de Sección B
     - Relaciones autor-teoría (~3-5 Basic/Cloze) — quién dijo qué
     - Citas memorizables (~3-5 Basic) — frases clave de A.5
     - Alertas de lectura (~2-3 Basic) — puntos contraintuitivos
   - Sintaxis: `###` heading = pregunta, párrafo = respuesta, `---` = separador
   - Cloze: `{{c1::texto}}` dentro de párrafos (sin heading)

9. **Nota de reflexión** (`Articulos/Apellido_Año/Reflexion_Apellido_Año.md`):
   - Template con bloques semi-estructurados de Sección D
   - Espacios en blanco para que el usuario complete en Obsidian

10. **Actualizar vault**:
    - HOME.md: agregar link `- [[Articulos/Apellido_Año/_Index|Apellido (Año)]]`
    - MOCs/MOC_Jerarquia.md: agregar nuevos conceptos al árbol jerárquico

**Convención de nombres de archivo**:
- Sin acentos ni caracteres especiales (normalizar con NFD + strip diacríticos)
- Guiones bajos en vez de espacios
- **NUNCA sobrescribir archivos existentes** — solo crear o agregar (append)

### Paso 3 — Verificar verbatim (requerido antes de entregar)
Ejecutar con Python:
```python
import re, difflib
from docx import Document
from docx.table import Table

def verificar_sila(docx_path, source_text):
    doc = Document(docx_path)
    def norm(t):
        t = re.sub(r'\s+', ' ', t).strip()
        for a,b in [('\u201c','"'),('\u201d','"'),('\u2018',"'"),('\u2019',"'"),
                    ('\u2013','-'),('\u2014','-')]:
            t = t.replace(a,b)
        return t
    src_n = norm(source_text)
    lb = []
    for el in doc.element.body:
        if el.tag.split('}')[-1] == 'tbl':
            tbl = Table(el, doc)
            for row in tbl.rows:
                c0 = row.cells[0].text.strip()
                c1 = row.cells[1].text.strip() if len(row.cells)>1 else ''
                if c0==c1 or not c1: continue
                if len(norm(c0))>100 and norm(c0)[:50] in src_n: lb.append(c0)
    left_n = norm('\n\n'.join(lb))
    sw, lw = src_n.split(), left_n.split()
    m = difflib.SequenceMatcher(None, sw, lw, autojunk=False)
    pct = 100 * sum(b.size for b in m.get_matching_blocks()) / max(len(sw), len(lw))
    print(f"Fidelidad: {pct:.2f}%")
    return pct >= 99.0
```

### Paso 4 — Presentar .docx
Informar al usuario la ruta del .docx generado y el porcentaje de fidelidad verbatim.

### Paso 4.5 — Presentar salida Obsidian
Informar al usuario:
- Ruta del vault y archivos generados (lista con rutas relativas)
- Número de notas creadas (literatura, conceptos, citas, reflexion)

### Paso 4.6 — Enviar flashcards a Anki via AnkiConnect
**NO usar el plugin Obsidian_to_Anki** (tiene problemas de carga y deteccion).
Enviar las cards directamente a Anki via AnkiConnect (puerto 8765).

Requisito: Anki Desktop debe estar abierto con AnkiConnect instalado (addon 2055492159).
Config de AnkiConnect en `%APPDATA%/Anki2/addons21/2055492159/config.json`:
```json
{
  "webCorsOriginList": ["http://localhost", "http://127.0.0.1"],
  "ignoreOriginList": ["http://localhost", "http://127.0.0.1"]
}
```

Escribir un script Node.js temporal que:
1. Verifica conexion: `fetch('http://127.0.0.1:8765', {action: 'version'})`
2. Crea el mazo: `Doctorado::Apellido_Año`
3. Envia cards Basic (tipo `Basico`, campos `Anverso`/`Reverso`)
4. Envia cards Cloze (tipo `Respuesta anidada`, campo `Texto`)
5. **Usar `fetch` nativo de Node.js** (NO el modulo `http`, que falla con AnkiConnect)
6. **Delay de 150ms entre cada card** para no saturar AnkiConnect
7. Tags por card: `['SILA', 'Apellido_Año']`

Objetivo: ~30-35 cards por articulo (20+ Basic + 12+ Cloze).

Al terminar, informar al usuario:
- Numero de cards creadas y errores
- Nombre del mazo
- Recordar: Sync en Anki Desktop para enviar al celular via AnkiWeb

---

## Reglas criticas de contenido

### ESTANDAR DE CALIDAD DOCTORAL

El .docx SILA debe tener la calidad de un documento de trabajo doctoral profesional.
No es un resumen ni un esquema: es un instrumento de estudio exhaustivo.

### Columna izquierda — texto original (VERBATIM ABSOLUTO)
- CADA PARRAFO del articulo copiado caracter a caracter, sin excepcion
- TODOS los parrafos, TODAS las secciones, SIN cortes, SIN resumenes, SIN omisiones
- Mantener tildes, ñ, comillas tipograficas, guiones largos, italicas en citas
- Incluir epigrafe, resumen, abstract si los tiene el articulo
- Incluir notas al pie y referencias si son parte del cuerpo del texto
- Fidelidad minima aceptable: 99% verificada con Python antes de entregar
- **VERIFICACION EN PORTADA**: incluir en la primera pagina una tabla con:
  - Conteo de palabras del texto fuente
  - Conteo de palabras de la columna izquierda
  - Conteo de caracteres del texto fuente
  - Conteo de caracteres de la columna izquierda
  - Porcentaje de coincidencia (palabras y caracteres)
  - Estado: ✓ APROBADO (>=99%) o ✗ REQUIERE REVISION (<99%)

### Columna derecha — anotaciones (ESTANDAR DE PROFUNDIDAD)
Cada parrafo del articulo debe tener anotaciones que cumplan TODOS estos criterios:

1. **Indicador de nivel** (obligatorio): ◆◆◆ Critico / ◆◆ Importante / ◆ Contextual
2. **3-5 anotaciones por parrafo** (minimo 3), seleccionando entre:
   - AUTOR / TEORIA: nombre completo, fechas, nacionalidad, obra principal, tradicion.
     Ejemplo: "Niklas Luhmann (1927-1998), sociologo aleman. Creo la Teoria de
     Sistemas Sociales: la sociedad es un sistema de comunicaciones, no de individuos."
   - CONCEPTO CLAVE: definicion tecnica clara, distinguir de uso cotidiano.
   - EJEMPLO ORIGINAL: generar un ejemplo propio que ilustre el concepto.
     Ejemplo: "Crear un depto. de atencion al cliente reduce confusion externa,
     pero genera nuevas jerarquias y procedimientos internos (nueva complejidad)."
   - DISTINCION / ACLARACION: que se confunde con que y por que importa.
   - CONEXION CONCEPTUAL: como se vincula con otros conceptos del mismo articulo.
   - IMPLICACION: consecuencia practica para la gestion o la investigacion.
3. **Referencias cruzadas** (minimo 1 por parrafo):
   - ↩ RETOMA: concepto ya introducido antes (indicar donde)
   - → REAPARECE EN: concepto que se desarrolla mas adelante (indicar seccion)
4. **Pregunta reflexiva** (1 por seccion minimo):
   - ❓ REFLEXION: pregunta critica que conecte con la tesis del doctorando
5. **Referencia con pagina**: cuando el articulo tiene paginas, citar "p. X" o "pp. X-Y"

### Headers y paginacion
- Cada pagina del .docx debe tener un header: "SILA · Apellido & Apellido (Año) · SECCION X: NOMBRE"
- Numeracion de pagina en el footer: "Pagina N de M"

### Código de color en columna izquierda
Máximo 4 colores. Google Docs compatible: NO usar `highlight` de TextRun (Google Docs
lo ignora). En su lugar, usar texto coloreado con negrita:

| Estilo | Uso | Criterio | Implementacion |
|---|---|---|---|
| Azul negrita (#0077AA) | Autores citados | Solo apellido/nombre del autor | `bold: true, color: '0077AA'` |
| Naranja negrita (#996600) | Terminos tecnicos compuestos | Frases de 2+ palabras | `bold: true, color: '996600'` |
| Negrita cursiva | Momentos clave | Max 3-5 frases en todo el texto | `bold: true, italics: true` |
| Verde negrita (#1A6B1A) | Ejemplos concretos | Solo ejemplos explicitos | `bold: true, color: '1A6B1A'` |

Nunca destacar palabras sueltas de alta frecuencia. Solo frases compuestas o nombres propios.

### Colores de etiquetas de anotacion (columna derecha)

| Etiqueta | Color hex | Uso |
|---|---|---|
| `◆◆◆/◆◆/◆  NIVEL:` | `555577` | Peso: Critico / Importante / Contextual |
| `AUTOR / TEORIA:` | `2E75B6` | Contexto completo del autor o teoria citada |
| `CONCEPTO CLAVE:` | `2E75B6` | Definicion tecnica clara |
| `EJEMPLO:` | `1A5C38` | Ejemplo ORIGINAL generado (no del texto) |
| `DISTINCIÓN / ACLARACIÓN:` | `C00000` | Punto de confusión frecuente |
| `CONEXIÓN CONCEPTUAL:` | `5B2C8C` | Relación con otros conceptos |
| `IMPLICACIÓN / REFLEXIÓN:` | `C55A11` | Consecuencias prácticas |
| `↩ RETOMA:` | `006B6B` | Concepto ya introducido antes |
| `→ REAPARECE EN:` | `2D2D8F` | Término que se desarrolla más adelante |
| `❓ REFLEXIÓN:` | `7B5800` | Pregunta crítica al cierre de sección |

Por cada sección del artículo la celda de anotaciones debe incluir:
indicador de nivel + 2-3 anotaciones + referencias cruzadas (↩/→) + 1 pregunta ❓

---

## Estructura del documento SILA

### Portada (retrato)
- Titulo: SISTEMA INTEGRADO DE LECTURA ACADEMICA
- Subtitulo: titulo completo y autores del articulo procesado
- Datos: journal/revista, año, DOI si disponible
- Linea: SILA — Sistema Integrado de Lectura Academica
- Descripcion: Protocolo de procesamiento doctoral para lectura tecnica potenciada

- **TABLA DE VERIFICACION DE FIDELIDAD** (obligatoria, fondo F0F7E6):
  | Metrica | Texto fuente | Columna izquierda | Coincidencia |
  |---|---|---|---|
  | Palabras | N | N | XX.X% |
  | Caracteres | N | N | XX.X% |
  | Estado | | | ✓ APROBADO / ✗ REQUIERE REVISION |
  Esta tabla se calcula DESPUES de generar el documento, comparando el texto fuente
  original con el texto efectivamente incluido en la columna izquierda de la Seccion B.
  Fidelidad minima aceptable: 99%.

- Indice de navegacion: tabla 3 columnas (codigo / subseccion / contenido)
  + fila de busqueda rapida con Ctrl+F y nombres exactos de los banners de Seccion B
- Leyenda de codigo de color (4 estilos) y leyenda de tipos de anotacion
- Nota de normalizacion (bloque gris, borde izquierdo, 5-7 lineas):
  Contextualiza la dificultad del texto como esperable y normal.
  Explica que el documento existe porque el texto es exigente.
  Recuerda que la comprension se profundiza en 3 sesiones.
  Menciona especificamente que conceptos o autores del articulo son los mas exigentes.
  Tono calido, no condescendiente. Personalizado al articulo (no generico).

### Seccion A — Pre-lectura (retrato, ~7 min)
Ver detalle en references/metodologia.md § Pre-lectura.

**Estandar de calidad para Pre-lectura:**
- A.1 Posicionamiento: respuestas de 3-5 lineas cada una (no una frase)
- A.2 Esqueleto: incluir "¿Que intenta demostrar?" como parrafo introductorio
  antes de los pasos. Cada paso con referencia a seccion del articulo.
- A.3 Resumen: incluir coordenada con pagina exacta cuando sea posible
- A.4 Alertas: explicar POR QUE es confuso, no solo QUE es confuso.
  Incluir la consecuencia de confundir: "si se pierde esta distincion, el resto parece X"
- A.5 Citables: incluir referencia con pagina: "Bustamante & Opazo (2004, p. 3)"
  Usar emojis de funcion: 📌 Definir, 🏛 Justificar, ♻ Explicar, ⚖ Debatir, 🌱 Fundamentar

### Seccion A.2 — Puente a la tesis (retrato, ~12 min)
Ver detalle en references/metodologia.md § Puente.
5 tarjetas con espacio para escribir + flujo de trabajo de 90 min al final.

**Estandar de calidad para Puente:**
- Cada tarjeta tiene: emoji + numero + pregunta + espacio para escribir (lineas vacias)
- La orientacion (💡) debe ser especifica al articulo procesado, con ejemplo concreto
  Ejemplo: "Ej: 'La empresa como subsistema social complejo justifica mi enfoque
  sistemico para estudiar X.'" — NO orientaciones genericas.
- Incluir parrafo introductorio: "La investigacion doctoral no consiste en leer para
  comprender un texto: consiste en leer para posicionar tu investigacion dentro de
  la conversacion academica."

### Sección B — Tabla anotada (landscape)
- Tabla 2 columnas: LC=7400, RC=6712, TW=14112 (todos DXA)
- Cabecera incluye instruccion de monitoreo durante la lectura (marca '?' al margen)
- Fondo col. izquierda: FFFFFF. Fondo col. derecha: FFFDE7.
- Banners de seccion: fill 1F3864, texto blanco.
- Al final de cada seccion, insertar en orden:
  1. Marcador de avance ✓ (fill F2FBF2, borde izquierdo SINGLE size 6 color 3B6E00)
  2. Retrieval activo (preguntas F0F7E6 / respuestas F8FFEE)
  3. Termometro de confianza (FAFAFA, escala 1-5 + concepto a reforzar)

**Articulos en ingles — filas alternas (Opcion A):**
Cuando el articulo fuente esta en ingles, la Seccion B usa filas alternas:
```
Fila 1: [Texto ingles verbatim (LC)] + [Anotaciones en español (RC)]  ← fondo FFFFFF/FFFDE7
Fila 2: [Traduccion al español (TW_L completo, 1 celda)]              ← fondo E8F4FD
Fila 3: [Siguiente parrafo ingles]   + [Anotaciones]                  ← fondo FFFFFF/FFFDE7
Fila 4: [Traduccion español]                                          ← fondo E8F4FD
...
```
- Las filas de traduccion ocupan TODO el ancho (1 celda, merge visual) con fondo E8F4FD
- La traduccion debe ser fiel al original pero en español natural (no literal)
- Las anotaciones van SOLO junto al texto en ingles (no en la traduccion)
- Para articulos en español: no hay filas de traduccion, queda el formato normal de 2 columnas

### Sección C — Glosario de ideas fuerza (retrato)
Ver references/metodologia.md § Glosario.
Tarjetas: definición · anidamiento · tensiones · origen · peso estructural.
Mapa de anidamiento y tensiones al final.

### Sección C.2 — Protocolo de revisión espaciada (retrato)
Ver references/metodologia.md § Protocolo.
Curva del olvido + 3 sesiones (hoy / 7 días / 30 días) + 5 reglas de oro.

### Sección D — Reflexiones y apuntes personales (retrato)
Ver references/metodologia.md § Reflexiones.
Contiene: metadatos · primera impresión · conexiones con la tesis · preguntas abiertas
· textos a explorar · acciones con checkboxes · dudas activas (transferidas desde '?')
· agenda para discusión · notas libres.

### Sección E — Mapa de diálogos inter-textuales (retrato)
Ver references/metodologia.md § Mapa.
Bloques: ↔ Converge con · ⇄ Entra en tensión con · → Abre preguntas hacia.
Diagnóstico de posición del texto en el corpus doctoral.

---

## Especificaciones técnicas

```javascript
const portraitProps  = { page: { size: { width: 12240, height: 15840 },
                         margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };
const landscapeProps = { page: { size: { width: 12240, height: 15840,
                                  orientation: PageOrientation.LANDSCAPE },
                         margin: { top: 720, right: 864, bottom: 720, left: 864 } } };
const TW_P = 9360;  const TW_L = 14112;  const LC = 7400;  const RC = 6712;

// Reglas criticas (Google Docs compatible):
// - Siempre WidthType.DXA, nunca PERCENTAGE
// - Siempre ShadingType.CLEAR con color: 'auto', nunca SOLID
// - Nunca \n dentro de TextRun — usar parrafos separados
// - Tablas: columnWidths[] + width en cada celda (ambos requeridos)
// - Fuente base: Arial size 18, color "1A1A1A"
// - Anotaciones: Arial size 17, color "444444"
// - NO usar highlight en TextRun (Google Docs lo ignora) — usar color+bold
// - NO usar BorderStyle.THICK (Google Docs lo ignora) — usar SINGLE con size 6+
// - Shading explicito en TODAS las celdas (fill + color: 'auto')
```

---

## Checklist de calidad mínima

### Documento .docx — ESTANDAR DOCTORAL
- [ ] **FIDELIDAD VERBATIM >= 99%** verificada con Python
- [ ] **TABLA DE VERIFICACION** en portada (palabras, caracteres, % coincidencia)
- [ ] TODOS los parrafos del articulo incluidos (sin omisiones, sin resumenes)
- [ ] Codigo de color aplicado en col. izquierda (autores, terminos, momentos clave, ejemplos)
- [ ] **3-5 anotaciones por parrafo** (no 1-2) con profundidad doctoral
- [ ] Cada anotacion de AUTOR incluye: nombre completo, fechas, nacionalidad, obra, tradicion
- [ ] **Ejemplos ORIGINALES generados** (no del texto) en anotaciones tipo EJEMPLO
- [ ] Indicador de nivel ◆◆◆/◆◆/◆ en CADA celda de anotaciones
- [ ] Al menos 1 ↩ RETOMA y 1 → REAPARECE EN por parrafo
- [ ] Al menos 1 ❓ REFLEXION por seccion (conectada con la tesis)
- [ ] Referencias con pagina exacta cuando disponible: "(p. X)"
- [ ] Marcador de avance + retrieval (3-4 preguntas) + termometro al final de cada seccion
- [ ] Pre-lectura: 5 subsecciones completas con profundidad (3-5 lineas por respuesta)
- [ ] Afirmaciones citables con referencia completa: "Apellido & Apellido (Año, p. X)"
- [ ] Puente: orientaciones ESPECIFICAS al articulo (no genericas)
- [ ] Nota de normalizacion PERSONALIZADA al articulo (menciona conceptos/autores dificiles)
- [ ] Header en cada pagina: "SILA · Apellido & Apellido (Año) · SECCION X"
- [ ] Numeracion de pagina en footer
- [ ] Nombre: SILA_[Apellido]_[Año].docx

### Vault Obsidian
- [ ] Vault existe y tiene estructura de carpetas correcta
- [ ] Subcarpeta `Articulos/Apellido_Año/` creada con todos los archivos
- [ ] `_Index.md` con links a todos los archivos generados
- [ ] Artículo original copiado a `Articulos/Apellido_Año/Original/`
- [ ] Nota de literatura con frontmatter completo, fechas de revisión y tags emergentes
- [ ] Al menos 3 notas de concepto en `Conceptos/` (o actualizadas si ya existían)
- [ ] Notas de cita en `Citas/` (una por afirmación citable de A.5)
- [ ] Archivo de flashcards (.md) generado en subcarpeta del articulo
- [ ] Nota de reflexion creada con template completo
- [ ] Tags emergentes con prefijos correctos (max. 8-10 por nota)
- [ ] Links internos `[[]]` usan nombres de archivo correctos (sin acentos)
- [ ] HOME.md actualizado con link al nuevo articulo
- [ ] MOC_Jerarquia.md actualizado con nuevos conceptos
- [ ] Ningun archivo existente fue sobrescrito (solo append en conceptos repetidos)

### Anki (via AnkiConnect)
- [ ] Anki Desktop abierto y AnkiConnect respondiendo en puerto 8765
- [ ] Mazo `Doctorado::Apellido_Año` creado
- [ ] ~20+ cards Basic enviadas (tipo `Basico`, campos Anverso/Reverso)
- [ ] ~12+ cards Cloze enviadas (tipo `Respuesta anidada`, campo Texto)
- [ ] 0 errores en el envio
- [ ] Informar al usuario que haga Sync para enviar al celular
