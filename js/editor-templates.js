// ============================================================
// CRISOL — editor-templates.js
// Document templates (static data)
// Extracted from editor.js (Sprint S4)
// ============================================================

const DOC_TEMPLATES = {
  libre: { name: 'Documento libre', blocks: [{ type: 'text', content: '' }] },
  imrad: {
    name: 'Artículo científico (IMRaD)', blocks: [
      { type: 'heading', content: 'Resumen / Abstract', open: true }, { type: 'text', content: '' },
      { type: 'heading', content: '1. Introducción' }, { type: 'note', content: 'Contexto, problema, gap, pregunta, contribución' }, { type: 'text', content: '' },
      { type: 'heading', content: '2. Marco teórico' }, { type: 'text', content: '' },
      { type: 'heading', content: '3. Metodología' }, { type: 'note', content: 'Diseño, muestra, instrumentos, análisis' }, { type: 'text', content: '' },
      { type: 'heading', content: '4. Resultados' }, { type: 'text', content: '' },
      { type: 'heading', content: '5. Discusión' }, { type: 'note', content: 'Interpretación, implicaciones teóricas y prácticas' }, { type: 'text', content: '' },
      { type: 'heading', content: '6. Conclusiones' }, { type: 'note', content: 'Resumen, limitaciones, investigación futura' }, { type: 'text', content: '' }
    ]
  },
  marco: {
    name: 'Capítulo: Marco teórico', blocks: [
      { type: 'heading', content: 'Introducción al capítulo', open: true }, { type: 'note', content: 'Qué cubre este capítulo y por qué' }, { type: 'text', content: '' },
      { type: 'heading', content: '2.1 Pilar teórico 1' }, { type: 'note', content: 'Constructos clave, autores seminales, debates' }, { type: 'text', content: '' },
      { type: 'heading', content: '2.2 Pilar teórico 2' }, { type: 'text', content: '' },
      { type: 'heading', content: '2.3 Intersección' }, { type: 'note', content: 'Cómo se conectan los pilares, qué queda inexplorado' }, { type: 'text', content: '' },
      { type: 'heading', content: '2.4 Marco conceptual' }, { type: 'note', content: 'TU síntesis original — modelo visual + proposiciones' }, { type: 'text', content: '' },
      { type: 'heading', content: '2.5 Síntesis del capítulo' }, { type: 'note', content: 'Tabla resumen: constructo | definición | autores | rol en la tesis' }, { type: 'text', content: '' }
    ]
  },
  metodo: {
    name: 'Capítulo: Metodología', blocks: [
      { type: 'heading', content: 'Introducción', open: true }, { type: 'text', content: '' },
      { type: 'heading', content: '3.1 Filosofía de investigación' }, { type: 'note', content: 'Ontología, epistemología, paradigma' }, { type: 'text', content: '' },
      { type: 'heading', content: '3.2 Diseño y enfoque' }, { type: 'text', content: '' },
      { type: 'heading', content: '3.3 Selección de casos / Muestra' }, { type: 'text', content: '' },
      { type: 'heading', content: '3.4 Recolección de datos' }, { type: 'text', content: '' },
      { type: 'heading', content: '3.5 Análisis de datos' }, { type: 'text', content: '' },
      { type: 'heading', content: '3.6 Validez, confiabilidad y ética' }, { type: 'text', content: '' }
    ]
  },
  propuesta: {
    name: 'Propuesta de conferencia', blocks: [
      { type: 'heading', content: 'Título', open: true }, { type: 'text', content: '' },
      { type: 'heading', content: 'Resumen (300 palabras)' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Contribución' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Palabras clave' }, { type: 'text', content: '' }
    ]
  },
  cover: {
    name: '📨 Cover letter (submission)', blocks: [
      { type: 'heading', content: 'Datos del envío', open: true },
      { type: 'note', content: 'Journal, editor, fecha de envío' },
      { type: 'text', content: '**Journal:** \n**Editor:** \n**Fecha:** ' },
      { type: 'heading', content: 'Cuerpo de la carta' },
      { type: 'text', content: 'Dear Editor,\n\nWe are pleased to submit our manuscript entitled "[TÍTULO]" for consideration in [JOURNAL].\n\n**Context and motivation:**\n[Describe the research problem and why it matters to the journal audience]\n\n**Key contribution:**\n[State the main theoretical/empirical contribution in 2-3 sentences]\n\n**Novelty:**\n[Explain what is new — what gap this fills that existing literature does not]\n\n**Fit with the journal:**\n[Explain why this manuscript belongs in THIS journal specifically]\n\n**Methodology:**\n[Brief description of method and data]\n\nThis manuscript has not been published elsewhere and is not under consideration by another journal. All authors have approved the manuscript and agree with its submission.\n\nWe look forward to your response.\n\nSincerely,\n[AUTHORS]' },
      { type: 'heading', content: 'Checklist pre-envío' },
      { type: 'text', content: '- [ ] Formato según guidelines del journal\n- [ ] Word count dentro del límite\n- [ ] Abstract según estructura requerida\n- [ ] Referencias en formato correcto\n- [ ] Figuras/tablas en resolución requerida\n- [ ] Declaración de conflicto de interés\n- [ ] Co-autores revisaron y aprobaron\n- [ ] Verificación anti-plagio completada\n- [ ] Datos suplementarios preparados\n- [ ] Properties del archivo borradas (anonimato)' }
    ]
  },
  response: {
    name: '📝 Response to reviewers', blocks: [
      { type: 'heading', content: 'Carta al editor', open: true },
      { type: 'text', content: 'Dear Editor,\n\nThank you for the opportunity to revise our manuscript "[TÍTULO]" (Manuscript ID: [ID]).\n\nWe appreciate the constructive feedback from the reviewers. Below we provide a point-by-point response to each comment, describing the changes made in the revised manuscript.\n\nSignificant changes are highlighted in [yellow/tracked changes] in the revised manuscript.\n\nSincerely,\n[AUTHORS]' },
      { type: 'heading', content: 'Reviewer 1' },
      { type: 'note', content: 'Copiar cada comentario del reviewer y responder punto a punto. Indicar página/sección del cambio.' },
      { type: 'text', content: '**Comment 1.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio, referencia a página/sección]\n\n---\n\n**Comment 1.2:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]' },
      { type: 'heading', content: 'Reviewer 2' },
      { type: 'text', content: '**Comment 2.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]\n\n---\n\n**Comment 2.2:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]' },
      { type: 'heading', content: 'Reviewer 3 (si aplica)' },
      { type: 'text', content: '**Comment 3.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n\n**Changes made:**\n' },
      { type: 'heading', content: 'Resumen de cambios' },
      { type: 'text', content: '| Sección | Cambio realizado | Motivado por |\n|---|---|---|\n| Introducción | | Reviewer 1, Comment 1 |\n| Metodología | | Reviewer 2, Comment 3 |\n| Resultados | | Reviewer 1, Comment 4 |\n| Discusión | | Reviewer 2, Comment 1 |' }
    ]
  },
  revision_sistematica: {
    name: '🔬 Protocolo de revisión sistemática', blocks: [
      { type: 'heading', content: '1. Pregunta de investigación', open: true },
      { type: 'note', content: 'Definir con formato PICO/PEO o similar. Toda la revisión depende de esta pregunta.' },
      { type: 'text', content: '**Pregunta:** \n\n**Población/Contexto:** \n**Exposición/Intervención:** \n**Comparación:** \n**Outcome/Resultado:** ' },
      { type: 'heading', content: '2. Criterios de inclusión y exclusión' },
      { type: 'text', content: '**Criterios de inclusión:**\n- Publicaciones entre [AÑO] y [AÑO]\n- Idiomas: inglés, español\n- Tipo: artículos en journals peer-reviewed\n- Temática: [describir]\n\n**Criterios de exclusión:**\n- Artículos de opinión, editoriales\n- Estudios no empíricos (si aplica)\n- [Otros criterios]' },
      { type: 'heading', content: '3. Estrategia de búsqueda' },
      { type: 'text', content: '**Bases de datos:**\n- Web of Science\n- Scopus\n- Google Scholar\n- [Otras]\n\n**String de búsqueda:**\n```\n("organizational learning" OR "organisational learning") AND ("artificial intelligence" OR "machine learning") AND ("complexity" OR "complex systems")\n```\n\n**Fecha de ejecución:** [FECHA]' },
      { type: 'heading', content: '4. Proceso de selección (PRISMA)' },
      { type: 'text', content: '**Identificación:**\n- Registros encontrados en bases de datos: ___\n- Registros adicionales (referencias, recomendaciones): ___\n\n**Screening:**\n- Registros después de eliminar duplicados: ___\n- Registros excluidos por título/abstract: ___\n\n**Elegibilidad:**\n- Artículos evaluados en texto completo: ___\n- Artículos excluidos con razón: ___\n\n**Incluidos:**\n- Artículos incluidos en la síntesis: ___' },
      { type: 'heading', content: '5. Extracción de datos' },
      { type: 'note', content: 'Definir qué datos se extraen de cada artículo. Esto alimenta la matriz de análisis.' },
      { type: 'text', content: '| Variable | Descripción |\n|---|---|\n| Autor(es) y año | |\n| Objetivo del estudio | |\n| Marco teórico | |\n| Metodología | |\n| Hallazgos principales | |\n| Limitaciones | |\n| Relevancia para mi investigación | |' },
      { type: 'heading', content: '6. Síntesis y análisis' },
      { type: 'note', content: '¿Análisis temático? ¿Meta-análisis? ¿Narrative synthesis? Describir el método de síntesis.' },
      { type: 'text', content: '**Método de síntesis:** \n\n**Temas emergentes:**\n1. \n2. \n3. \n\n**Gaps identificados:**\n1. \n2. ' }
    ]
  },
  plan: {
    name: '🎯 Plan de investigación', blocks: [
      { type: 'heading', content: 'Pregunta de investigación', open: true }, { type: 'note', content: 'La pregunta central que guía tu tesis. Reescríbela cada vez que evolucione.' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Objetivos' }, { type: 'note', content: 'Objetivo general (1) + específicos (3-5). Marca con ✓ los completados.' }, { type: 'text', content: '**Objetivo general:**\n\n**Objetivos específicos:**\n1. \n2. \n3. ' },
      { type: 'heading', content: 'Hilos de investigación' }, { type: 'note', content: 'Líneas temáticas que estás explorando. Vincula artículos de YUNQUE como citas.' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Gaps y preguntas abiertas' }, { type: 'note', content: 'Lo que falta por investigar. Cada gap puede convertirse en búsqueda de artículos.' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Argumento central (tu posición)' }, { type: 'note', content: '¿Qué afirmas TÚ? Tu voz en la conversación académica. Vincula los claims que la sustentan.' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Cronograma e hitos' }, { type: 'text', content: '- [ ] Propuesta de tesis: \n- [ ] Comité 1: \n- [ ] Comité 2: \n- [ ] Defensa: \n\n**Próximas acciones:**\n- [ ] \n- [ ] ' },
      { type: 'heading', content: 'Red de colaboración' }, { type: 'text', content: '**Tutor:**\n\n**Comité:**\n\n**Notas de reuniones:**\n' },
      { type: 'heading', content: 'Recursos y herramientas' }, { type: 'text', content: '' },
      { type: 'heading', content: 'Subproductos' }, { type: 'note', content: 'Papers, presentaciones, datasets. Vincula documentos de YUNQUE.' }, { type: 'text', content: '' }
    ]
  }
};

export { DOC_TEMPLATES };
