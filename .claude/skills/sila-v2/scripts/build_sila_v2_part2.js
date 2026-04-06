// SILA v2 Part 2 — Section A.2 (Puente) + Section B (Annotated Table) — DATA-DRIVEN
const { p, r, ep, cl, rw, tbl, banner, t2, mkHeader, mkFooter, FONT, SZ, SZ_ANN, SZ_SM, COLOR, ANN_COLOR, BF, TW_P, TW_L, LC, RC, PM, LM } = require('./build_sila_v2_part1.js');
const { SectionType, PageOrientation, BorderStyle, AlignmentType } = require('docx');
const fs = require('fs');

// Load section B data
const data = JSON.parse(fs.readFileSync('C:/Users/Alejandro Rudloff/sila_secB_data.json', 'utf8'));

// === SECTION A.2: PUENTE ===
const puenteCard = (emoji, num, question, orientation) => tbl([rw([cl([
  p(`${emoji}  ${num}. ${question}`, { bold: true, size: SZ, color: BF }),
  p('Tu respuesta:', { size: SZ_SM, color: '777777' }),
  p('________________________________________________________________________________________________________', { size: SZ_SM, color: 'CCCCCC' }),
  p('________________________________________________________________________________________________________', { size: SZ_SM, color: 'CCCCCC' }),
  ep(),
  p(`💡 Orientación: ${orientation}`, { size: 14, color: '777777', italics: true }),
], { w: TW_P, f: 'EBF3FB', b: { left: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6' } } })])], TW_P, [TW_P]);

const seccionA2 = {
  properties: { page: { size: { width: 12240, height: 15840 }, margin: PM }, type: SectionType.NEXT_PAGE },
  headers: { default: mkHeader('SECCIÓN A.2: PUENTE A TU TESIS') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCIÓN A.2 — PUENTE A TU TESIS', TW_P),
    p('Completa esto ANTES de leer el artículo · Tiempo estimado: 10-12 min', { size: SZ_SM, color: '555577', italics: true }),
    p('La investigación doctoral no consiste en leer para comprender un texto: consiste en leer para posicionar tu investigación dentro de la conversación académica. Estas cinco preguntas transforman la lectura en trabajo de tesis.', { size: SZ, color: '333333' }),
    ep(),
    puenteCard('🎯', '1', '¿Qué argumento de MI tesis respalda este texto?',
      "Ej: 'La empresa como subsistema social complejo justifica mi enfoque sistémico para estudiar el aprendizaje organizacional en contextos de IA.'"),
    ep(),
    puenteCard('⚡', '2', '¿Con qué posición teórica de este texto quiero debatir o matizar?',
      "Ej: 'Los autores limitan la reducción de complejidad a procesos internos; mi tesis propone que la IA constituye un mecanismo externo de reducción no contemplado por Luhmann.'"),
    ep(),
    puenteCard('🔍', '3', '¿Qué gap de investigación me revela este texto?',
      "Ej: 'El texto no aborda cómo la IA y la robótica generan nuevas fuentes de complejidad no contempladas en el marco Luhmann-Habermas de 2004.'"),
    ep(),
    puenteCard('✍️', '4', '¿Cómo lo citaría en mi marco teórico? (borrador de oración)',
      "Ej: 'Siguiendo a Bustamante y Opazo (2004), la complejidad organizacional no es un estado a resolver sino un proceso continuo de adaptación sistémica que toda empresa debe gestionar.'"),
    ep(),
    puenteCard('❓', '5', '¿Qué sigo sin entender después de la pre-lectura?',
      'Registra tus dudas activas aquí. Serán las preguntas que guíen tu lectura del texto en la Sección B.'),
    ep(),
    // Workflow
    banner('FLUJO DE TRABAJO — 90 MINUTOS', TW_P),
    t2([
      ['Pre-lectura (Sección A)', '5-7 min'],
      ['Puente a tu tesis (Sección A.2)', '10-12 min'],
      ['Lectura anotada (Sección B)', '40-50 min'],
      ['Retrieval activo (dentro de B)', '15 min total'],
      ['Glosario (Sección C)', '10 min'],
      ['Protocolo de revisión (Sección C.2)', '5 min'],
    ], TW_P, 5500, 3860, { bf: true }),
  ],
};

// === SECTION B BUILDERS ===
const sectionBannerB = (text) => tbl([rw([
  cl([p(text, { bold: true, size: 21, color: 'FFFFFF', align: AlignmentType.CENTER })], { w: LC, f: BF }),
  cl([p('', { size: 17 })], { w: RC, f: BF }),
])], TW_L, [LC, RC]);

// === COLOR CODING for left column ===
// Blue bold (#0077AA): Author names
const AUTHORS = [
  'Niklas Luhmann', 'Luhmann', 'Jürgen Habermas', 'Habermas',
  'Humberto Maturana', 'Maturana y Varela', 'Maturana', 'Francisco Varela', 'Varela',
  'Peter Senge', 'Senge', 'Talcott Parsons', 'Parsons',
  'Gibson', 'Marlasca', 'Limone', 'Ashby',
  'Mintzberg y Quinn', 'Mintzberg y Waters', 'Mintzberg', 'Quinn',
  'Hitt, Ireland y Hotkinsson', 'Hitt', 'Barney', 'Rumelt', 'Ansof',
  'Hofer y Shendel', 'Bowan', 'Selznick',
  'Von Clausewitz', 'Von Newman y Morgenstern', 'Von Newman',
  'Álvarez de Novales', 'Mills And Laurence Shuman', 'David Mills',
  'Anthony', 'Etkin', 'Ohmae', 'Bertalanffy',
  'Bustamante', 'Opazo',
].sort((a, b) => b.length - a.length); // longer first to avoid partial matches

// Orange bold (#996600): Technical compound terms
const TERMS = [
  'reducción de la complejidad', 'reducción de complejidad',
  'complejidad del ambiente', 'complejidad del entorno',
  'complejidad del comportamiento',
  'límites de sentido', 'límites de la organización',
  'acoplamiento estructural', 'acoplamiento perfecto',
  'sistemas sociales', 'sistema social', 'sub sistemas sociales',
  'modelos mentales', 'interpretaciones codificadas',
  'planificación estratégica', 'planificación gerencial',
  'control administrativo',
  'homeostasis', 'autopoiético', 'Heteropoiéticas', 'heteropoiéticas',
  'autorreferente', 'autoorganización',
  'suprasistema', 'subsistemas sociales', 'subsistemas particulares',
  'espacios subsistémicos',
  'complejización interna', 'complejización social', 'complejización',
  'definición de sentido',
  'aprendizaje organizacional',
  'correspondencia',
  'organización social',
  'incertidumbre',
  'perspectiva sistémica',
].sort((a, b) => b.length - a.length);

// Bold italic: Key passages (max 5)
const KEY_PASSAGES = [
  'la reducción de la complejidad es el medio para la construcción de complejidad',
  'Llamamos complejo a un sistema que puede tomar a lo menos dos estados que sean compatibles con su estructura',
  'La complejidad se genera sistemática y recursivamente en el momento en que los sistemas reducen la complejidad del ambiente, aumentando la suya propia',
  'la complejidad de la sociedad, más que una característica espacio temporal, es un proceso',
  'Una organización que no es capaz de identificar claramente sus límites, que no es capaz de aprender del entorno y de reducir la complejidad de éste, es una organización condenada a la muerte',
];

// Green bold (#1A6B1A): Examples from the article
const EXAMPLES = [
  'sistema α', 'sistema ß',
  'tribu primitiva de África',
  'ciudad urbanizada',
  'rentabilidad de las acciones en el mercado de capitales',
  'partículas en el caos',
];

// Tokenize text into colored segments
function colorize(text) {
  // Build a list of {start, end, type} ranges
  const ranges = [];

  for (const kp of KEY_PASSAGES) {
    let idx = text.indexOf(kp);
    while (idx !== -1) {
      ranges.push({ start: idx, end: idx + kp.length, type: 'key' });
      idx = text.indexOf(kp, idx + kp.length);
    }
  }
  for (const ex of EXAMPLES) {
    let idx = text.indexOf(ex);
    while (idx !== -1) {
      ranges.push({ start: idx, end: idx + ex.length, type: 'example' });
      idx = text.indexOf(ex, idx + ex.length);
    }
  }
  for (const au of AUTHORS) {
    let idx = text.indexOf(au);
    while (idx !== -1) {
      // Check it's not inside a longer match
      const overlaps = ranges.some(rng => idx >= rng.start && idx < rng.end);
      if (!overlaps) ranges.push({ start: idx, end: idx + au.length, type: 'author' });
      idx = text.indexOf(au, idx + au.length);
    }
  }
  for (const tm of TERMS) {
    const tmLower = tm.toLowerCase();
    const textLower = text.toLowerCase();
    let idx = textLower.indexOf(tmLower);
    while (idx !== -1) {
      const overlaps = ranges.some(rng =>
        (idx >= rng.start && idx < rng.end) || (idx + tm.length > rng.start && idx + tm.length <= rng.end)
      );
      if (!overlaps) ranges.push({ start: idx, end: idx + tm.length, type: 'term' });
      idx = textLower.indexOf(tmLower, idx + tm.length);
    }
  }

  // Sort by start position
  ranges.sort((a, b) => a.start - b.start);

  // Remove overlapping ranges (keep first)
  const clean = [];
  let lastEnd = 0;
  for (const rng of ranges) {
    if (rng.start >= lastEnd) {
      clean.push(rng);
      lastEnd = rng.end;
    }
  }

  // Build TextRun array
  const runs = [];
  let pos = 0;
  for (const rng of clean) {
    // Plain text before this range
    if (pos < rng.start) {
      runs.push(r(text.substring(pos, rng.start), { size: SZ }));
    }
    // Colored text
    const segment = text.substring(rng.start, rng.end);
    // Word highlights: use real highlight property
    const { TextRun } = require('docx');
    if (rng.type === 'author') {
      runs.push(new TextRun({ text: segment, font: FONT, size: SZ, color: COLOR, highlight: 'cyan' }));
    } else if (rng.type === 'term') {
      runs.push(new TextRun({ text: segment, font: FONT, size: SZ, color: COLOR, highlight: 'yellow' }));
    } else if (rng.type === 'key') {
      runs.push(new TextRun({ text: segment, font: FONT, size: SZ, color: COLOR, highlight: 'lightGray' }));
    } else if (rng.type === 'example') {
      runs.push(new TextRun({ text: segment, font: FONT, size: SZ, color: COLOR, highlight: 'green' }));
    }
    pos = rng.end;
  }
  // Trailing plain text
  if (pos < text.length) {
    runs.push(r(text.substring(pos), { size: SZ }));
  }

  return runs;
}

const annRow = (leftText, anns) => rw([
  cl([p('', { children: colorize(leftText) })], { w: LC, f: 'FFFFFF' }),
  cl(anns.map(a => p('', { children: [r(a.t, { size: SZ_ANN, color: a.c || ANN_COLOR, bold: !!a.b })] })), { w: RC, f: 'FFFDE7' }),
]);

const progressMarker = (name) => tbl([rw([cl([p([
  r('✓ Sección completada: ' + name, { bold: true, size: SZ, color: '3B6E00' }),
  r('  ·  Fecha: ___  ·  Hora: ___', { size: SZ, color: '3B6E00' }),
])], { w: TW_L, f: 'F2FBF2', b: { left: { style: BorderStyle.SINGLE, size: 6, color: '3B6E00' } } })])], TW_L, [TW_L]);

const retrievalBlock = (qs, as) => tbl([rw([
  cl([
    p('✏ RETRIEVAL ACTIVO — Responde sin mirar el texto (3-5 min)', { bold: true, size: SZ_ANN, color: '3B6E00' }),
    ...qs.map((q, i) => p((i+1) + '. ' + q, { size: SZ_ANN, color: '333333' })),
  ], { w: LC, f: 'F0F7E6' }),
  cl([
    p('✔ RESPUESTAS DE VERIFICACIÓN', { bold: true, size: SZ_ANN, color: '3B6E00' }),
    ...as.map((a, i) => p((i+1) + '. ' + a, { size: SZ_ANN, color: ANN_COLOR })),
  ], { w: RC, f: 'F8FFEE' }),
])], TW_L, [LC, RC]);

const thermometer = () => tbl([rw([cl([
  p('🌡 Termómetro de confianza', { bold: true, size: SZ_ANN, color: '555577' }),
  p('¿Qué tan seguro/a te sientes explicando los conceptos de esta sección sin mirar el texto?', { size: SZ_ANN, color: ANN_COLOR }),
  p('  ☐ 1 No lo entendí    ☐ 2 Entendí con apoyo    ☐ 3 Lo entendí solo    ☐ 4 Puedo explicarlo    ☐ 5 Puedo debatirlo', { size: SZ_ANN, color: ANN_COLOR }),
  p('  Concepto que necesita refuerzo: _______________________________________________', { size: SZ_ANN, color: ANN_COLOR }),
], { w: TW_L, f: 'FAFAFA' })])], TW_L, [TW_L]);

// Build Section B children from data
const secBChildren = [
  banner('SECCIÓN B — TEXTO ANOTADO', TW_L),
  p('Instrucción: Marca con "?" al margen todo lo que no quede claro durante la lectura. Transfiere esas dudas a la Sección D al terminar cada sección.', { size: SZ_SM, color: '777777', italics: true }),
  ep(),
];

for (const sec of data.sections) {
  // Section banner
  secBChildren.push(sectionBannerB(sec.title));

  // Annotated table with all paragraphs
  const rows = sec.paragraphs.map(par => annRow(par.text, par.anns));
  secBChildren.push(tbl(rows, TW_L, [LC, RC]));
  secBChildren.push(ep());

  // Progress + Retrieval + Thermometer
  secBChildren.push(progressMarker(sec.title));
  secBChildren.push(ep());
  secBChildren.push(retrievalBlock(sec.retrieval.q, sec.retrieval.a));
  secBChildren.push(ep());
  secBChildren.push(thermometer());
  secBChildren.push(ep());
}

const seccionB = {
  properties: {
    page: { size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE }, margin: LM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCIÓN B: TEXTO ANOTADO') },
  footers: { default: mkFooter() },
  children: secBChildren,
};

module.exports = { seccionA2, seccionB };
