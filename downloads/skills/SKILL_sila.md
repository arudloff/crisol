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
Soporte bilingüe: artículos en inglés se procesan con traducción automática al español
(campo `translation` en cada párrafo del .js). La app web muestra la traducción como
texto principal con botón para ver el original. TTS lee solo español.

**IMPORTANTE — Entorno de ejecución: Claude Code en Windows**
- Node.js con paquete `docx` instalado globalmente
- Python 3 con `python-docx` disponible para verificación
- Usar `NODE_PATH` apuntando al global de npm en Windows

---

## Configuración de salida

| Salida | Ruta | Descripcion |
|---|---|---|
| **.docx** | `SILA/docx/SILA_[Apellido]_[Año].docx` | Documento Word con 6 secciones |
| **App data .js** | `SILA/crisol/data/[apellido]_[año].js` | JS de datos para la app web (legacy, sidebar estático) |
| **App data .json** | `SILA/crisol/data/[apellido]_[año].json` | JSON importable a CRISOL via drag & drop |
| **Obsidian Vault** | `SILA_Vault/` | Notas atomicas, conceptos, citas, MOCs |
| **Anki** | Via AnkiConnect puerto 8765 | ~30-35 flashcards por articulo |
| **App web** | https://crisol-psi.vercel.app | Lectura interactiva (CRISOL en Vercel) |

Ruta raiz del proyecto: `G:/Mi unidad/Doctorado MGT/SILA/`
Vault Obsidian: `G:/Mi unidad/Doctorado MGT/SILA_Vault/`

Cada articulo agrega notas al vault (nunca sobrescribe) y archivos a `crisol/data/`.

Despues de generar los datos del articulo:

1. Generar **archivo .js** en `SILA/crisol/data/[apellido]_[año].js` (formato legacy para sidebar estático)
2. Generar **archivo .json** en `SILA/crisol/data/[apellido]_[año].json` (para importar a CRISOL via modal)
3. Agregar entrada al manifiesto `SILA/crisol/data/manifest.js` (ver formato abajo)

**NO es necesario redesplegar.** El usuario importa el .json directamente en CRISOL:
- Abrir https://crisol-psi.vercel.app
- Sidebar → Artículos → "+ Importar artículo (.json)"
- Drag & drop del archivo .json generado
- El artículo se sube a Supabase y aparece en la biblioteca

**Formato del .json importable** — es el mismo objeto que el .js pero como JSON puro:
```json
{
  "meta": { "key": "apellido_año", "title": "...", "authors": "...", ... },
  "sections": [...],
  "prelectura": {...},
  "puente": [...],
  "flujo": {...},
  "glosario": [...],
  "glosario_mapa": {...},
  "reflexiones": [...],
  "mapa": {...},
  "defaultCards": [...]
}
```

**Formato de manifest.js** — agregar una línea al array (para artículos estáticos del sidebar):
```javascript
window.SILA_MANIFEST=[
  // ... entradas existentes ...
  {key:"apellido_año",authors:"Apellido & Apellido",year:2024,category:"Categoría",weight:"critico"}
];
```

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
3. **OBLIGATORIO**: Lee `SILA/crisol/data/bustamante_2004.js` como REFERENCIA VIVA de calidad y schema.
   Este archivo es el gold standard. Cada sección que generes debe igualar o superar su
   profundidad, extensión y estructura. Compara tu output contra este archivo antes de finalizar.

### Paso 1 — Analizar el artículo
Antes de escribir código, realiza este análisis interno.
**Categoría**: inferir una categoría temática para el sidebar de la app (ej: "Teoría
Organizacional", "Economía", "Métodos Cuantitativos", "Aprendizaje Organizacional").
Si ya existen categorías en manifest.js, reutilizar la más cercana. NO preguntar al usuario.
Análisis:
- **Argumento central**: qué intenta demostrar y cómo lo demuestra
- **Estructura**: todas las secciones con sus títulos exactos
- **Autores y teorías citadas**: quiénes son, qué tradición teórica representan
- **Tensiones conceptuales**: pares de ideas que se oponen o compiten
- **Anidamientos**: qué conceptos contienen a otros
- **Alertas de lectura**: los 3-5 puntos más contraintuitivos o confusos
- **Posicionamiento**: a qué debate responde, con quién dialoga, qué gap llena
- **Afirmaciones citables**: las 6-8 frases directamente usables en un marco teórico
- **Titulo descriptivo por párrafo**: para CADA párrafo del artículo, generar un titulo
  corto (5-10 palabras) que sintetice la unidad de sentido del párrafo. Este titulo:
  - Debe capturar LA IDEA PRINCIPAL, no describir el contenido ("La paradoja fundacional
    de Luhmann" en vez de "Cita de Luhmann sobre complejidad")
  - Debe permitir al lector entender el flujo argumentativo SIN leer el párrafo
  - Debe usar lenguaje claro y directo, no jerga innecesaria
  - Se almacena como campo `title` en el JSON de datos de cada párrafo
  - Se muestra como cabecera de acordeón desplegable en la versión HTML interactiva

### Paso 2 — Generar salidas

El proyecto SILA usa la estructura organizada en `G:/Mi unidad/Doctorado MGT/SILA/`.
Generar las siguientes salidas:

**2a. Documento .docx** → `SILA/docx/SILA_[Apellido]_[Año].docx`
Escribir script Node.js temporal y ejecutar con `NODE_PATH="$(npm root -g)" node script.js`

**2b. Datos para CRISOL** → `SILA/crisol/data/[apellido]_[año].js` + `.json`
Generar DOS archivos: un .js (legacy para sidebar estático) y un .json (para importar via modal).
Formato del .js:
```javascript
window.SILA_ARTICLES = window.SILA_ARTICLES || {};
window.SILA_ARTICLES['apellido_año'] = {
  meta: {
    key: 'apellido_año',
    title: 'Titulo completo del articulo',
    authors: 'Apellido & Apellido',
    year: 2024,
    category: 'Categoria temática',  // Preguntar al usuario o inferir del analisis
    weight: 'critico',               // critico | importante | complementario
    journal: 'Nombre del journal',
    institution: 'Universidad',
    fidelity: 99.0,                  // % de fidelidad verbatim calculado
    cards: 33,                       // numero de flashcards generadas
    concepts: 9,                     // numero de conceptos en el glosario
    highlights: {                    // para highlighting dinámico en la app web
      authors: ['Apellido1', 'Apellido2'],  // nombres de autores citados (largo→corto)
      terms: ['término compuesto', 'otro término'],  // términos técnicos
      key: ['frase clave verbatim del texto'],  // 3-5 frases clave del artículo
      examples: ['ejemplo concreto mencionado']  // ejemplos del texto
    },
    downloads: {                             // rutas relativas para descarga
      docx: 'downloads/articles/SILA_Apellido_Año.docx',
      fuente: 'downloads/articles/Apellido_Año_fuente.txt'
    }
  },
  sections: [
    {
      title: 'NOMBRE DE SECCION',
      paragraphs: [
        {
          text: 'texto verbatim del parrafo',
          translation: 'traduccion al español (SOLO si el articulo es en ingles)',
          title: 'titulo descriptivo (5-10 palabras)',
          eq: 'pregunta elaborativa ¿por que? o ¿como?',
          anns: [
            { t: 'texto de anotacion', c: 'color hex', b: true/false }
          ]
        }
      ],
      retrieval: { q: ['pregunta1'], a: ['respuesta1'] }
    }
  ],
  // === SECCIONES COMPLETAS (v5) — mismo contenido que el .docx ===
  prelectura: {
    posicionamiento: [{q:'pregunta', a:'respuesta extensa (3-5 líneas)'}],
    esqueleto: {
      tesis: 'Qué intenta demostrar el artículo (1 párrafo)',
      pasos: [{paso:'PASO 1', desc:'descripción extensa', ref:'§N'}]
    },
    resumen: [{sec:'Nombre sección', desc:'resumen con coordenadas', ref:'pp.X-Y'}],
    alertas: [{n:1, texto:'alerta extensa: qué es confuso y POR QUÉ'}],
    citables: [{uso:'📌 Definir', cita:'texto verbatim', ref:'Apellido (Año, p.X)'}]
  },
  puente: [{emoji:'🎯', q:'pregunta', hint:'orientación específica al artículo'}],
  flujo: {
    sesiones: [{nombre:'Pre-lectura', tiempo:'5-7 min'}],
    revision: [{sesion:'Sesión 1 — Hoy', tiempo:'15-20 min', fecha:'YYYY-MM-DD', tareas:'desc'}]
  },
  glosario: [{
    concepto:'Nombre', peso:'critico|importante|complementario',
    definicion:'definición profunda', anidamiento:'relación jerárquica',
    tension:'par de tensión', origen:'autor y año'
  }],
  glosario_mapa: {
    anidamiento: [{concepto:'Nombre', nivel:0, hijos:['hijo1']}],
    tensiones: [{par:'A ↔ B', desc:'por qué importa la distinción'}]
  },
  reflexiones: [{emoji:'📖', titulo:'Primera impresión', hint:'orientación'}],
  mapa: {
    instruccion: 'texto de instrucción',
    converge: {titulo:'↔ Converge con', hint:'orientación'},
    tension: {titulo:'⇄ Entra en tensión con', hint:'orientación'},
    preguntas: {titulo:'→ Abre preguntas hacia', hint:'orientación'},
    preguntas_iniciales: ['pregunta abierta 1', 'pregunta abierta 2']
  },
  // === FLASHCARDS EMBEBIDAS (OBLIGATORIO) ===
  defaultCards: [
    { front: 'Pregunta o concepto', back: 'Respuesta', type: 'basic' },
    { front: 'Texto con {{c1::blancos}} estratégicos', back: '', type: 'cloze' }
    // 25-40 cards: conceptos, definiciones, distinciones, retrieval, relaciones, citas, alertas
  ]
};
```
Luego:
1. Generar el **archivo .json** con el mismo contenido (sin el wrapper `window.SILA_ARTICLES`):
```bash
# Extraer el objeto JSON del .js y guardarlo como .json
```
El .json es simplemente el objeto `{meta, sections, prelectura, puente, ...}` serializado.

2. Agregar entrada al manifiesto `SILA/crisol/data/manifest.js` (una línea al array).
**NO modificar index.html** — el sidebar se construye automáticamente desde el manifiesto.
**El usuario importa el .json via CRISOL** (drag & drop en el modal de importación).

Convención de nombres: `SILA_[PrimerApellido]_[Año]`

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

**Articulos en ingles — soporte bilingue:**
Cuando el articulo fuente esta en ingles:

**En el .docx (Seccion B):** Usar tablas SEPARADAS por parrafo (no filas fusionadas):
- Tabla 2-col (LC+RC): texto ingles verbatim + anotaciones en español
- Tabla 1-col (TW_L): traduccion al español con fondo E8F4FD
- Usar `TableLayoutType.FIXED` con anchos DXA explicitos para evitar desbordamiento
- Las anotaciones van SOLO junto al texto en ingles (no en la traduccion)

**En el .js (datos para app web):** Agregar campo `translation` a cada parrafo:
```javascript
paragraphs: [{
  text: 'English verbatim text',
  translation: 'Traduccion fiel al español',  // SOLO para articulos en ingles
  title: '...', eq: '...', anns: [...]
}]
```
La app web detecta automaticamente `par.translation`:
- Si existe: muestra traduccion como texto principal, boton "Original" para ver ingles
- Si no existe: muestra `par.text` directamente (articulos en español)
- TTS lee SOLO el texto principal (español), auto-avanza parrafo a parrafo
- Busqueda funciona en ambos idiomas

**En el .docx:** La traduccion debe ser fiel al original pero en español natural
- Para articulos en español: no hay traduccion, queda el formato normal de 2 columnas

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
// IMPORTANTE: en landscape, width y height se INTERCAMBIAN:
const landscapeProps = { page: { size: { width: 15840, height: 12240,
                                  orientation: PageOrientation.LANDSCAPE },
                         margin: { top: 720, right: 864, bottom: 720, left: 864 } } };
const TW_P = 9360;  const TW_L = 14112;  const LC = 7400;  const RC = 6712;

// Reglas criticas (Google Docs compatible):
// - Siempre WidthType.DXA, nunca PERCENTAGE
// - Siempre ShadingType.CLEAR con color: 'auto', nunca SOLID
// - Nunca \n dentro de TextRun — usar parrafos separados
// - Tablas: columnWidths[] + width en cada celda (ambos requeridos)
// - Tablas: SIEMPRE usar TableLayoutType.FIXED para evitar desbordamiento de margenes
// - Tablas bilingues: usar tablas SEPARADAS (2-col + 1-col) por parrafo, NO filas fusionadas
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
- [ ] (Si ingles) Tablas SEPARADAS por parrafo: 2-col (texto+anns) + 1-col (traduccion)
- [ ] (Si ingles) TableLayoutType.FIXED con anchos DXA explicitos en cada celda
- [ ] (Si ingles) TODAS las traducciones presentes (64/64, no omisiones)
- [ ] (Si ingles) Fondo E8F4FD en tablas de traduccion

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

---

## SCHEMA OBLIGATORIO PARA app/data/[key].js

**REFERENCIA CANÓNICA**: `SILA/crisol/data/bustamante_2004.js` es el estándar de calidad y estructura.
Cada artículo nuevo DEBE usar EXACTAMENTE estos schemas. NO inventar schemas alternativos.

### Schemas exactos (no negociables)

```javascript
// prelectura — 5 sub-tabs obligatorias
prelectura: {
  posicionamiento: [{q:'pregunta', a:'respuesta extensa (3-5 líneas)'}],  // mín. 5 items
  esqueleto: {
    tesis: 'Qué intenta demostrar (1 párrafo completo)',
    pasos: [{paso:'PASO 1', desc:'descripción extensa', ref:'§N'}]  // mín. 4 pasos
  },
  resumen: [{sec:'Nombre sección', desc:'resumen con coordenadas', ref:'pp.X-Y'}],  // mín. 8 items
  alertas: [{n:1, texto:'alerta extensa: qué es confuso y POR QUÉ'}],  // mín. 5 items
  citables: [{uso:'📌 Definir', cita:'texto verbatim', ref:'Apellido (Año, p.X)'}]  // mín. 5 items
},

// puente — EXACTAMENTE este schema
puente: [{emoji:'🎯', q:'pregunta', hint:'orientación específica al artículo'}],  // 5 items

// flujo — DEBE incluir sesiones Y revision
flujo: {
  sesiones: [{nombre:'Pre-lectura', tiempo:'5-7 min'}],  // mín. 5 sesiones
  revision: [{sesion:'Sesión 1 — Hoy', tiempo:'15-20 min', fecha:'YYYY-MM-DD', tareas:'desc'}]  // 3 items (hoy, 7d, 30d)
},

// glosario — cada item con TODOS los campos
glosario: [{
  concepto:'Nombre', peso:'critico|importante|complementario',
  definicion:'definición profunda (20+ palabras)',
  anidamiento:'relación jerárquica con otro concepto',
  tension:'descripción de la tensión (8+ palabras, NO solo el nombre del par)',
  origen:'autor y año'
}],

// glosario_mapa — EXACTAMENTE estas keys
glosario_mapa: {
  anidamiento: [{concepto:'Nombre', nivel:0, hijos:['hijo1']}],  // mín. 5 items
  tensiones: [{par:'A ↔ B', desc:'por qué importa la distinción'}]  // mín. 4 items
},

// reflexiones — EXACTAMENTE 8 items con este schema
reflexiones: [
  {emoji:'📖', titulo:'Primera impresión', hint:'¿Qué te sorprendió...'},
  {emoji:'🔗', titulo:'Conexiones doctorales', hint:'¿Cómo se conecta...'},
  {emoji:'❓', titulo:'Preguntas abiertas', hint:'¿Qué preguntas...'},
  {emoji:'📚', titulo:'Textos a explorar', hint:'¿Qué otros textos...'},
  {emoji:'✅', titulo:'Acciones concretas', hint:'¿Qué pasos...'},
  {emoji:'🔍', titulo:'Dudas activas', hint:'¿Qué conceptos...'},
  {emoji:'💬', titulo:'Agenda para discusión', hint:'¿Qué discutirías...'},
  {emoji:'📝', titulo:'Notas libres', hint:'Espacio libre...'}
],

// mapa — EXACTAMENTE estas keys con objetos {titulo, hint}
mapa: {
  instruccion: 'texto de instrucción (20+ palabras)',
  converge: {titulo:'↔ Converge con', hint:'orientación específica'},
  tension: {titulo:'⇄ Entra en tensión con', hint:'orientación específica'},
  preguntas: {titulo:'→ Abre preguntas hacia', hint:'orientación específica'},
  preguntas_iniciales: ['pregunta abierta 1', 'pregunta abierta 2']  // mín. 2
}
```

### Umbrales mínimos cuantitativos

| Métrica | Mínimo | Referencia (bustamante_2004) |
|---------|--------|------------------------------|
| Anotaciones por párrafo | **3.0** avg | 3.5 |
| Total anotaciones | **3 × total_párrafos** | 231 (66 párrafos) |
| highlights.authors | **10+** | 37 |
| highlights.terms | **10+** | 28 |
| highlights.key | **3+** | 5 |
| highlights.examples | **3+** | 5 |
| Prelectura: posicionamiento palabras | **150+** | 213 |
| Prelectura: esqueleto palabras | **100+** | 166 |
| Prelectura: resumen items | **8+** | 10 |
| Prelectura: resumen palabras | **150+** | 280 |
| Prelectura: alertas palabras | **120+** | 188 |
| Glosario: definición palabras avg | **20+** | 24.7 |
| Glosario: tensión palabras avg | **8+** | 9.6 |
| Reflexiones items | **8** (exacto) | 8 |
| Flujo: revision items | **3** (hoy/7d/30d) | 3 |
| Retrieval questions total | **30+** | 36 |

### Validación automática (Paso 3.5 — después de generar el .js)

Después de escribir el archivo `crisol/data/[key].js`, ejecutar esta validación:

```javascript
// Validar schema y umbrales — FALLA = NO desplegar
const art = window.SILA_ARTICLES['key'];
const errors = [];

// Schema checks
if (!art.prelectura?.posicionamiento) errors.push('FALTA prelectura.posicionamiento');
if (!art.prelectura?.esqueleto?.tesis) errors.push('FALTA prelectura.esqueleto.tesis');
if (!art.prelectura?.esqueleto?.pasos) errors.push('FALTA prelectura.esqueleto.pasos');
if (!art.prelectura?.resumen) errors.push('FALTA prelectura.resumen');
if (!art.prelectura?.alertas) errors.push('FALTA prelectura.alertas');
if (!art.prelectura?.citables) errors.push('FALTA prelectura.citables');
if (!art.puente?.[0]?.emoji) errors.push('puente: schema incorrecto, debe ser {emoji, q, hint}');
if (!art.flujo?.sesiones) errors.push('FALTA flujo.sesiones');
if (!art.flujo?.revision) errors.push('FALTA flujo.revision');
if (!art.glosario?.[0]?.tension) errors.push('glosario: falta campo tension');
if (!art.glosario_mapa?.anidamiento) errors.push('FALTA glosario_mapa.anidamiento');
if (!art.glosario_mapa?.tensiones) errors.push('FALTA glosario_mapa.tensiones');
if (art.reflexiones?.length !== 8) errors.push('reflexiones debe tener exactamente 8 items');
if (!art.reflexiones?.[0]?.emoji) errors.push('reflexiones: schema incorrecto, debe ser {emoji, titulo, hint}');
if (!art.mapa?.instruccion) errors.push('FALTA mapa.instruccion');
if (!art.mapa?.converge?.titulo) errors.push('mapa.converge: schema incorrecto, debe ser {titulo, hint}');
if (!art.mapa?.preguntas_iniciales) errors.push('FALTA mapa.preguntas_iniciales');

// Retrieval checks (CRITICO — sin retrieval.a la app web NO renderiza los parrafos)
art.sections.forEach((s,i) => {
  if (!s.retrieval?.q) errors.push(`FALTA retrieval.q en seccion ${i}`);
  if (!s.retrieval?.a) errors.push(`FALTA retrieval.a en seccion ${i} — LA APP NO RENDERIZARA`);
  else if (s.retrieval.q.length !== s.retrieval.a.length) errors.push(`retrieval q/a mismatch en seccion ${i}`);
});

// Bilingual check (si hay translation en algun parrafo, verificar que TODOS lo tengan)
const hasAnyTranslation = art.sections.some(s => s.paragraphs.some(p => p.translation));
if (hasAnyTranslation) {
  art.sections.forEach((s,i) => s.paragraphs.forEach((p,j) => {
    if (!p.translation) errors.push(`FALTA translation en seccion ${i} parrafo ${j}`);
  }));
}

// Quantity checks
const totalAnns = art.sections.reduce((a,s) => a + s.paragraphs.reduce((b,p) => b + (p.anns?.length||0), 0), 0);
const totalPars = art.sections.reduce((a,s) => a + s.paragraphs.length, 0);
if (totalAnns / totalPars < 3.0) errors.push(`Anotaciones avg ${(totalAnns/totalPars).toFixed(1)} < 3.0 mínimo`);
if (art.meta.highlights.authors.length < 10) errors.push(`highlights.authors: ${art.meta.highlights.authors.length} < 10`);
if (art.meta.highlights.terms.length < 10) errors.push(`highlights.terms: ${art.meta.highlights.terms.length} < 10`);
if (art.prelectura.resumen.length < 8) errors.push(`prelectura.resumen: ${art.prelectura.resumen.length} items < 8`);

if (errors.length) {
  console.error('VALIDACIÓN FALLIDA — NO desplegar:');
  errors.forEach(e => console.error('  ✗ ' + e));
} else {
  console.log('✓ Validación OK — listo para desplegar');
}
```

Si la validación falla, corregir ANTES de desplegar. NO pedir autorización al usuario para corregir — simplemente corregir y re-validar.

---

## EJECUCIÓN AUTÓNOMA

Esta skill debe ejecutarse de principio a fin SIN interrupciones ni preguntas intermedias.

### Decisiones que se toman automáticamente (NO preguntar):
- **Categoría**: inferir del contenido. Si ya existen categorías en manifest.js, reutilizar la más cercana.
- **Peso**: inferir del análisis (critico si es fundacional para la tesis, importante si aporta evidencia, complementario si es contexto).
- **Correcciones**: si la validación falla, corregir automáticamente y re-ejecutar.
- **Anki no disponible**: si AnkiConnect no responde, generar el archivo .md de flashcards y continuar. Informar al final.
- **Archivos existentes en vault**: agregar sección "También en [[nuevo_artículo]]" sin preguntar.

### Única pregunta permitida:
Si el texto fuente es ambiguo (fragmento vs artículo completo, idioma dudoso), preguntar UNA vez al inicio.

### Flujo sin interrupciones:
```
Paso 0: Leer referencias → Paso 1: Analizar → Paso 2: Generar .docx + .js + .json + manifest
→ Paso 2.5: Generar Obsidian + Anki → Paso 3: Verificar fidelidad
→ Paso 3.5: Validar schema .js → Paso 4: Presentar resumen
→ Informar al usuario: "Importa el .json en CRISOL → Artículos → Importar artículo"
```
