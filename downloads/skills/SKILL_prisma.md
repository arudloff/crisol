---
name: prisma
description: >
  Genera o actualiza el PRISMA — Perspectiva de la Investigación: Síntesis, Mapa y Análisis —
  a partir de los escritos del investigador (PDFs, .docx, .md). Lee todos los documentos
  proporcionados, descubre el metarrelato emergente de la investigación, y genera un archivo
  PRISMA.json importable a CRISOL. Activar cuando el usuario diga 'prisma', 'actualizar prisma',
  'generar prisma', 'analizar mis escritos', 'metarrelato', 'síntesis de investigación',
  o proporcione múltiples PDFs de sus propios textos para análisis cruzado.
---

# PRISMA — Detector de metarrelato investigativo

PRISMA no resume artículos ajenos — **descubre lo que el investigador está pensando**
a partir de lo que ya escribió. Lee el corpus completo de escritos del investigador
(ensayos, capítulos, borradores, informes) y genera una estructura de 6 dimensiones
que revela el argumento central emergente, los vacíos, las preguntas implícitas,
y la evolución del pensamiento.

**Principio rector**: El investigador sabe más de lo que cree saber. Sus textos
contienen un metarrelato que aún no ha articulado explícitamente. PRISMA lo hace visible.

---

## Flujo de trabajo

### Paso 0 — Recopilar escritos

El usuario proporciona sus escritos de una o más formas:
- PDFs adjuntos en el chat
- Rutas a archivos locales (.pdf, .docx, .md, .txt)
- Texto pegado directamente
- Referencia a documentos ya en CRISOL (exportados como .json)

**Si existe un PRISMA previo**: Leer también el PRISMA existente para hacer MERGE,
no reemplazo. El usuario puede exportar su PRISMA actual desde CRISOL (botón 💾).
Si proporciona un PRISMA.json previo, usarlo como base y enriquecerlo.

### Paso 1 — Lectura profunda del corpus

Leer TODOS los documentos completos. Para cada uno, analizar internamente:
- **Tesis central**: qué afirma este texto
- **Marco teórico usado**: qué autores y tradiciones invoca
- **Conceptos clave**: qué vocabulario teórico construye o utiliza
- **Evidencia citada**: qué datos empíricos maneja
- **Posición del autor**: desde dónde habla, qué da por sentado
- **Preguntas implícitas**: qué está preguntando sin formularlo explícitamente
- **Madurez**: qué tan desarrollado está (semilla/brote/árbol)
- **Tipo**: ensayo, capítulo, borrador, informe, propuesta, ponencia

### Paso 2 — Descubrir el metarrelato

Cruzar TODOS los documentos para detectar:
1. **Temas recurrentes**: conceptos que aparecen en 2+ documentos
2. **Argumento central emergente**: la tesis que conecta todos los textos
3. **Premisas**: las afirmaciones que sostienen ese argumento
4. **Evolución**: cómo cambia el pensamiento entre documentos (cronológicamente)
5. **Vacíos**: lo que falta — temas mencionados pero no desarrollados
6. **Fortalezas**: lo que está bien cubierto y sustentado
7. **Preguntas vivas**: las preguntas que el investigador se está haciendo
8. **Tensiones internas**: contradicciones o ambigüedades entre textos

**IMPORTANTE**: No inventar lo que el investigador no dijo. Todo debe ser
rastreable a los textos proporcionados. Las inferencias deben estar señaladas
como tales ("implícito en...", "se infiere de...").

### Paso 3 — Generar PRISMA.json

Generar un archivo JSON con la siguiente estructura exacta:

```json
{
  "documents": [
    {
      "title": "Título completo del documento",
      "summary": "Resumen de 2-3 oraciones que captura la contribución del texto",
      "type": "ensayo|capitulo|borrador|informe|propuesta|ponencia",
      "date": "YYYY-MM-DD",
      "wordCount": 8500,
      "maturity": "seed|sprout|tree",
      "concepts": ["concepto1", "concepto2", "..."],
      "downloadUrl": null
    }
  ],

  "concepts": [
    "concepto1", "concepto2", "..."
  ],

  "matrix": {
    "themes": [
      "Tema emergente 1 (nombre descriptivo, 3-8 palabras)",
      "Tema emergente 2",
      "..."
    ],
    "cells": {
      "0-0": "Cómo el documento 0 aborda el tema 0 (2-4 oraciones sustantivas)",
      "0-1": "Cómo el documento 0 aborda el tema 1",
      "1-0": "Cómo el documento 1 aborda el tema 0"
    }
  },

  "argument": {
    "question": "La pregunta de investigación emergente (inferida del corpus)",
    "central": "El argumento central que conecta todos los textos (1 párrafo)",
    "premises": [
      {
        "text": "Premisa 1: afirmación que sostiene el argumento",
        "evidence": "En qué texto(s) y cómo se sustenta",
        "sources": "Autores/año citados por el investigador",
        "support": "supported|partial|unsupported"
      }
    ]
  },

  "gaps": [
    { "text": "Descripción del vacío detectado", "priority": "alta|media|baja" }
  ],

  "strengths": [
    { "text": "Descripción de la fortaleza detectada" }
  ],

  "questions": [
    {
      "text": "Pregunta de investigación emergente",
      "type": "teorica|empirica|metodologica",
      "status": "abierta",
      "method": "Metodología sugerida para abordarla (si aplica)"
    }
  ],

  "evolution": [
    {
      "date": "YYYY-MM-DD",
      "text": "Descripción de cómo evolucionó el pensamiento en este punto",
      "impact": "Qué cambió a partir de esto (si es detectable)"
    }
  ]
}
```

### Paso 4 — Merge con PRISMA existente (si aplica)

Si el usuario proporcionó un PRISMA.json previo:
- **documents**: agregar nuevos documentos. Si un documento ya existe (mismo título),
  actualizar su summary, maturity, concepts y wordCount.
- **concepts**: unir arrays sin duplicados.
- **matrix.themes**: agregar nuevos temas descubiertos. NO eliminar temas existentes.
- **matrix.cells**: agregar celdas para nuevos documentos/temas. Actualizar celdas
  existentes solo si el nuevo análisis tiene más profundidad.
- **argument**: si el argumento cambió, actualizar. Si no cambió, mantener el existente.
  Agregar nuevas premisas. Actualizar `support` de premisas existentes si hay nueva evidencia.
- **gaps**: agregar nuevos gaps. Si un gap existente fue resuelto por los nuevos textos,
  marcarlo con un note: "Parcialmente abordado en [nuevo documento]".
- **strengths**: agregar nuevas fortalezas.
- **questions**: agregar nuevas preguntas. Si una pregunta existente fue respondida,
  cambiar su status a "respondida" o "en_exploracion".
- **evolution**: agregar nuevas entradas cronológicamente. NUNCA eliminar entradas previas.

### Paso 5 — Guardar y presentar

1. Guardar el archivo como: `SILA/crisol/data/PRISMA_[YYYY-MM-DD].json`
2. Si hay vault Obsidian, guardar también en: `SILA_Vault/PRISMA.md` (versión markdown)
3. Presentar al usuario un resumen:
   - Documentos analizados (N)
   - Temas emergentes descubiertos (N)
   - Premisas del argumento (N, con nivel de soporte)
   - Gaps detectados (N, por prioridad)
   - Preguntas emergentes (N)
4. Instruir: "Importa el archivo en CRISOL → PRISMA → 📂"

---

## Estándares de calidad

### Temas (matrix.themes)
- Mínimo 6 temas, máximo 15
- Nombres descriptivos (3-8 palabras), no genéricos
- Deben emerger del corpus, no ser impuestos desde fuera
- Cada tema debe aparecer en al menos 2 documentos

### Argumento central
- Debe ser una tesis, no una descripción ("X genera Y" no "Este trabajo estudia X")
- Debe conectar al menos 3 documentos del corpus
- Debe ser falseable (puede estar equivocado)

### Premisas
- Mínimo 5 premisas
- Cada premisa con evidencia rastreable a los textos
- Al menos 1 premisa debe ser "partial" o "unsupported" (honestidad intelectual)

### Cells (matrix)
- 2-4 oraciones sustantivas por celda
- Si un documento no aborda un tema, dejar la celda vacía (no inventar)
- Distinguir "aborda directamente" de "referencia tangencial"

### Gaps
- Mínimo 3 gaps
- Al menos 1 de prioridad "alta"
- Deben ser accionables (el investigador puede hacer algo al respecto)

### Preguntas
- Mínimo 3 preguntas emergentes
- Deben ser genuinas (no retóricas)
- Al menos 1 con sugerencia de metodología

### Evolution
- 1 entrada por documento analizado (como mínimo)
- Ordenar cronológicamente
- Detectar giros conceptuales, no solo progreso lineal

---

## Reglas de integridad

1. **No inventar**: todo debe ser rastreable a los textos. Si inferes algo, señalarlo.
2. **No juzgar**: PRISMA describe el metarrelato, no lo evalúa. Los gaps son oportunidades,
   no deficiencias.
3. **Voz del investigador**: usar el vocabulario que el investigador usa, no sustituirlo
   por sinónimos académicos "correctos".
4. **Merge aditivo**: NUNCA eliminar datos del PRISMA previo. Solo agregar o enriquecer.
5. **Honestidad epistémica**: si una premisa no tiene soporte empírico, decirlo.
   Si un gap es crítico, decirlo. El investigador necesita verdad, no validación.

---

## Ejecución autónoma

Esta skill se ejecuta de principio a fin SIN interrupciones.

### Decisiones automáticas:
- **Tipo de documento**: inferir del contenido (ensayo, capítulo, etc.)
- **Madurez**: inferir de la extensión, profundidad y grado de desarrollo
- **Temas**: descubrir del corpus, no preguntar al usuario
- **Fecha**: usar fecha del archivo o la más reciente mencionada en el texto

### Única pregunta permitida:
Si el corpus es ambiguo (¿son textos del investigador o artículos de terceros?),
preguntar UNA vez al inicio. PRISMA solo procesa **escritos del propio investigador**,
no artículos de otros autores (para eso existe /sila).

### Flujo:
```
Paso 0: Recopilar escritos + PRISMA previo (si existe)
→ Paso 1: Lectura profunda de cada documento
→ Paso 2: Descubrir metarrelato cruzado
→ Paso 3: Generar PRISMA.json
→ Paso 4: Merge con PRISMA previo (si aplica)
→ Paso 5: Guardar + presentar resumen
→ Instruir al usuario: "Importa en CRISOL → PRISMA → 📂"
```
