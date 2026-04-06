// SILA v2 — Bustamante & Opazo (2004) — Part 1: Helpers + Portada + Seccion A
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, PageOrientation,
  SectionType, Header, Footer, PageNumber, NumberFormat
} = require('docx');
const fs = require('fs');

const FONT = 'Arial';
const SZ = 18; const SZ_ANN = 17; const SZ_SM = 15;
const COLOR = '1A1A1A'; const ANN_COLOR = '444444';
const BF = '1F3864'; // banner fill
const TW_P = 9360; const TW_L = 14112; const LC = 7400; const RC = 6712;
const PM = { top: 1440, right: 1440, bottom: 1440, left: 1440 };
const LM = { top: 720, right: 864, bottom: 720, left: 864 };

// === HELPERS ===
const p = (text, o = {}) => new Paragraph({
  alignment: o.align || AlignmentType.LEFT,
  spacing: { after: o.after !== undefined ? o.after : 60, before: o.before || 0 },
  children: o.children ? o.children :
    Array.isArray(text) ? text : [new TextRun({
      text: text || '', font: FONT, size: o.size || SZ,
      color: o.color || COLOR, bold: !!o.bold, italics: !!o.italics,
    })],
});
const r = (text, o = {}) => new TextRun({
  text, font: FONT, size: o.size || SZ,
  color: o.color || COLOR, bold: !!o.bold, italics: !!o.italics,
});
const ep = () => p('', { after: 30 });
const cl = (ch, o = {}) => new TableCell({
  width: { size: o.w || TW_P, type: WidthType.DXA },
  shading: { type: ShadingType.CLEAR, fill: o.f || 'FFFFFF', color: 'auto' },
  borders: o.b, verticalAlign: 'top',
  children: Array.isArray(ch) ? ch : [ch],
});
const rw = (cells) => new TableRow({ children: cells });
const tbl = (rows, w, cw) => new Table({ width: { size: w, type: WidthType.DXA }, columnWidths: cw, rows });

// Banner
const banner = (t, w) => tbl([rw([cl([p(t, { bold: true, size: 21, color: 'FFFFFF', align: AlignmentType.CENTER })], { w, f: BF })])], w, [w]);

// Table 2 col
const t2 = (data, w, c1, c2, o = {}) => tbl(data.map(([a, b]) => rw([
  cl([p(a, { bold: o.bf, size: o.sz || SZ })], { w: c1, f: o.f1 }),
  cl([p(b, { size: o.sz || SZ })], { w: c2, f: o.f2 }),
])), w, [c1, c2]);

// Table 3 col
const t3 = (data, w, c1, c2, c3) => tbl(data.map(([a, b, c]) => rw([
  cl([p(a, { bold: true, size: SZ })], { w: c1 }),
  cl([p(b, { size: SZ })], { w: c2 }),
  cl([p(c, { size: SZ })], { w: c3 }),
])), w, [c1, c2, c3]);

// Header/Footer factory
const mkHeader = (secName) => new Header({
  children: [p(`SILA  ·  Bustamante & Opazo (2004)  ·  ${secName}`, { size: 14, color: '999999', align: AlignmentType.CENTER })],
});
const mkFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      r('Página ', { size: 14, color: '999999' }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: '999999' }),
      r(' de ', { size: 14, color: '999999' }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 14, color: '999999' }),
    ],
  })],
});

// ============================================================
// SOURCE TEXT — for verification
// ============================================================
const SOURCE_TEXT = fs.readFileSync('C:/Users/Alejandro Rudloff/bustamante_source.txt', 'utf8');

// ============================================================
// PORTADA
// ============================================================
const portada = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('PORTADA') },
  footers: { default: mkFooter() },
  children: [
    ep(),
    p('SISTEMA INTEGRADO DE LECTURA ACADÉMICA', { bold: true, size: 36, color: BF, align: AlignmentType.CENTER }),
    ep(),
    p('Hacia un Concepto de Complejidad: Sistema, Organización y Empresa', { size: 22, align: AlignmentType.CENTER, italics: true }),
    p('Miguel A. Bustamante U. y Pablo A. Opazo B.', { size: 20, align: AlignmentType.CENTER }),
    p('Serie Documentos Docentes FACE SDD Nº 03, Año 2, Diciembre 2004 · Universidad de Talca', { size: 16, align: AlignmentType.CENTER, color: '777777' }),
    ep(),
    p('SILA — Sistema Integrado de Lectura Académica', { size: 16, align: AlignmentType.CENTER, color: '555577' }),
    p('Protocolo de procesamiento doctoral para lectura técnica potenciada', { size: 14, align: AlignmentType.CENTER, color: '999999' }),
    ep(),

    // VERIFICATION TABLE
    banner('VERIFICACIÓN DE FIDELIDAD VERBATIM', TW_P),
    // Placeholder — will be updated after generation
    tbl([
      rw([cl([p('Métrica', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }), cl([p('Texto fuente', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }), cl([p('Col. izquierda', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }), cl([p('Coincidencia', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' })]),
      rw([cl([p('Palabras')], { w: 2340 }), cl([p('PENDING')], { w: 2340 }), cl([p('PENDING')], { w: 2340 }), cl([p('PENDING')], { w: 2340, f: 'F0F7E6' })]),
      rw([cl([p('Caracteres')], { w: 2340 }), cl([p('PENDING')], { w: 2340 }), cl([p('PENDING')], { w: 2340 }), cl([p('PENDING')], { w: 2340, f: 'F0F7E6' })]),
      rw([cl([p('Estado', { bold: true })], { w: 2340 }), cl([p('')], { w: 2340 }), cl([p('')], { w: 2340 }), cl([p('PENDING', { bold: true, color: '1A5C38' })], { w: 2340, f: 'F0F7E6' })]),
    ], TW_P, [2340, 2340, 2340, 2340]),
    ep(),

    // NAVIGATION INDEX
    banner('ÍNDICE DE NAVEGACIÓN', TW_P),
    p('Usa Ctrl+F para saltar directamente a cualquier sección por su nombre.', { size: 14, color: '777777', italics: true }),
    t3([
      ['SEC.', 'SUBSECCIÓN', 'CONTENIDO'],
      ['A', 'Pre-lectura', 'Posicionamiento · Esqueleto argumentativo · Resumen · Alertas · Citas'],
      ['A.2', 'Puente a tu tesis', '5 preguntas de conexión · Flujo de trabajo 90 min'],
      ['B', 'Texto anotado', 'Verbatim completo con código de color + anotaciones doctorales'],
      ['C', 'Glosario', 'Tarjetas de conceptos · Anidamiento · Tensiones · Mapa jerárquico'],
      ['C.2', 'Revisión espaciada', 'Curva del olvido · 3 sesiones · 5 reglas de oro'],
      ['D', 'Reflexiones', 'Primera impresión · Conexiones · Dudas activas · Agenda'],
      ['E', 'Mapa inter-textual', 'Convergencias · Tensiones · Preguntas abiertas'],
    ], TW_P, 680, 1660, 7020),
    ep(),
    p('Búsqueda rápida: EPÍGRAFE Y RESUMEN · INTRODUCCIÓN · 1. Un concepto · 2. Fuentes · 3. Génesis · 4. La reducción · 4.1 El tiempo · 4.2 La complejidad · 5. Nacimiento · 6. Conclusiones', { size: 13, color: '555577', italics: true }),
    ep(),

    // COLOR LEGEND
    banner('LEYENDA — CÓDIGO DE COLOR (Sección B)', TW_P),
    tbl([
      rw([
        cl([p('', { children: [new TextRun({ text: '  Autores citados  ', font: FONT, size: SZ, highlight: 'cyan' })] })], { w: 2800 }),
        cl([p('Navegación teórica: nombre del autor o teórico citado en el texto.', { size: SZ_SM })], { w: 6560 }),
      ]),
      rw([
        cl([p('', { children: [new TextRun({ text: '  Términos técnicos  ', font: FONT, size: SZ, highlight: 'yellow' })] })], { w: 2800 }),
        cl([p('Vocabulario propio del texto: frases compuestas de 2+ palabras con significado técnico.', { size: SZ_SM })], { w: 6560 }),
      ]),
      rw([
        cl([p('', { children: [new TextRun({ text: '  Paradoja / momentos clave  ', font: FONT, size: SZ, highlight: 'lightGray' })] })], { w: 2800 }),
        cl([p('El corazón del argumento: máximo 3-5 frases en todo el texto.', { size: SZ_SM })], { w: 6560 }),
      ]),
      rw([
        cl([p('', { children: [new TextRun({ text: '  Ejemplos concretos  ', font: FONT, size: SZ, highlight: 'green' })] })], { w: 2800 }),
        cl([p('Anclas empíricas: ejemplos ilustrativos del autor o generados en las anotaciones.', { size: SZ_SM })], { w: 6560 }),
      ]),
    ], TW_P, [2800, 6560]),
    ep(),

    // ANNOTATION LEGEND
    t2([
      ['AUTOR / TEORÍA:', 'Contexto completo del autor: nombre, fechas, nacionalidad, obra, tradición.'],
      ['CONCEPTO CLAVE:', 'Definición técnica del término. Distingue uso técnico de cotidiano.'],
      ['EJEMPLO:', 'Caso concreto ORIGINAL generado para ilustrar (no del texto).'],
      ['DISTINCIÓN / ACLARACIÓN:', 'Punto de confusión frecuente. Consecuencia de confundir.'],
      ['◆◆◆ / ◆◆ / ◆ NIVEL:', 'Peso conceptual: Crítico / Importante / Contextual.'],
      ['↩ RETOMA:', 'Concepto ya introducido antes (indica dónde).'],
      ['→ REAPARECE EN:', 'Término que se retomará más adelante (indica sección).'],
      ['❓ REFLEXIÓN:', 'Pregunta crítica que conecta con tu tesis.'],
    ], TW_P, 2800, 6560, { bf: true, sz: SZ_SM }),
    ep(),

    // NORMALIZATION NOTE
    tbl([rw([cl([
      p('Antes de empezar', { bold: true, size: SZ, color: '555577' }),
      p('Este artículo trabaja con la Teoría de Sistemas Sociales de Niklas Luhmann y la Teoría de la Acción Comunicativa de Jürgen Habermas, dos marcos conceptuales densos por diseño. Sentir que la distinción entre "reducción de complejidad del entorno" y "reducción de la propia complejidad" es confusa, o que el debate Parsons-Luhmann-Habermas sobre las fuentes de complejidad parece abstracto, es la respuesta normal de cualquier lector, incluidos investigadores con experiencia en el área.', { size: SZ_SM, color: '555577' }),
      p('Este documento existe precisamente porque el texto es exigente. Cada sección tiene anotaciones con contexto de los autores, ejemplos concretos, alertas de confusión y preguntas de retrieval que te acompañan. No necesitas entenderlo todo de una vez — el protocolo de revisión espaciada está diseñado para que la comprensión se profundice en tres sesiones distribuidas en 30 días.', { size: SZ_SM, color: '555577' }),
    ], {
      w: TW_P, f: 'F7F7F7',
      b: { left: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    })])], TW_P, [TW_P]),
  ],
};

// ============================================================
// SECCION A — PRE-LECTURA
// ============================================================
const seccionA = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCIÓN A: PRE-LECTURA') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCIÓN A — PRE-LECTURA', TW_P),
    p('Bustamante & Opazo (2004) · Hacia un Concepto de Complejidad: Sistema, Organización y Empresa', { size: 16, color: '555577', italics: true }),
    p('Lee esta sección antes de abrir el artículo. Te tomará 5-7 minutos y reducirá significativamente tu tiempo de procesamiento del texto base.', { size: SZ_SM, color: '777777' }),
    ep(),

    // A.1 POSICIONAMIENTO
    p('1. POSICIONAMIENTO EN LA LITERATURA', { bold: true, size: 20, color: BF }),
    t2([
      ['¿A qué debate responde?', 'Al debate sobre cómo las organizaciones y empresas pueden sobrevivir y adaptarse en entornos sociales cada vez más inestables e impredecibles. Es una respuesta al problema de gobernar la complejidad, no de eliminarla. Se inscribe en la discusión sobre los límites del funcionalismo (Parsons) y la necesidad de marcos sistémicos más sofisticados.'],
      ['¿Con quién dialoga?', 'Principalmente con Niklas Luhmann (Teoría de Sistemas Sociales) y Jürgen Habermas (Teoría de la Acción Comunicativa). Incorpora también a Maturana & Varela (autopoiesis biológica), Senge (aprendizaje organizacional), Parsons (sistema social clásico) y Gibson (aprendizaje organizacional). La empresa es el campo empírico donde aterriza el debate teórico.'],
      ['¿Qué gap llena?', 'Traduce conceptos de la sociología sistémica alemana (muy abstracta) al lenguaje y las necesidades de la gestión de empresas. Su aporte es de síntesis y aplicación, no de teoría original. Sirve como puerta de entrada al pensamiento de Luhmann para investigadores en management.'],
      ['Tradición teórica', 'Teoría de Sistemas Sociales (Luhmann) + Teoría Organizacional. Emparentado con el pensamiento complejo (Morin), la cibernética de segundo orden (von Foerster) y los sistemas adaptativos complejos (Santa Fe Institute).'],
      ['Relevancia doctoral', 'Útil como marco teórico para investigaciones sobre: cambio organizacional, gestión estratégica en entornos inciertos, aprendizaje organizacional, innovación y adaptación. Citable como fundamento epistemológico para justificar la visión sistémica de la empresa en contextos de IA y supercomputación.'],
    ], TW_P, 2400, 6960, { bf: true }),
    ep(),

    // A.2 ESQUELETO
    p('2. ESQUELETO ARGUMENTATIVO', { bold: true, size: 20, color: BF }),
    p('¿Qué intenta demostrar el artículo? Que la complejidad no es un problema a resolver sino una propiedad estructural e inevitable de toda organización social, y que la única respuesta válida es aprender a gestionarla —no eliminarla— mediante la planificación estratégica y gerencial.', { size: SZ, italics: true }),
    t2([
      ['PASO 1', 'Definir qué es complejidad en términos técnicos precisos (no como adjetivo). Un sistema es complejo si puede tomar ≥ 2 estados compatibles con su estructura. El entorno siempre es más complejo que el sistema. → Sección 1'],
      ['PASO 2', 'Identificar las fuentes: la complejidad viene del ambiente (externo) Y del propio sistema (interno, especialmente de las personas). Habermas amplía a Luhmann en este punto. → Sección 2'],
      ['PASO 3', 'Explicar la génesis: la complejidad se crea recursivamente. Al reducir complejidad del entorno, el sistema aumenta la propia. Es un proceso sin fin, no un estado resoluble. → Sección 3'],
      ['PASO 4', 'Establecer cómo se gestiona: mediante redefinición de límites de sentido, aprendizaje continuo y planificación. El tiempo es un catalizador que amplifica la complejidad. → Sección 4'],
      ['CONCLUSIÓN', 'Planificación gerencial + planificación estratégica son las dos herramientas que permiten operacionalizar la reducción de complejidad en la empresa. → Sección 4.2, 5, 6'],
    ], TW_P, 1800, 7560, { bf: true }),
    ep(),

    // A.3 RESUMEN CON COORDENADAS
    p('3. RESUMEN DE CONTENIDO CON COORDENADAS', { bold: true, size: 20, color: BF }),
    p('Cada bloque resume una sección del texto. La coordenada indica dónde encontrar el desarrollo completo.', { size: SZ_SM, color: '777777', italics: true }),
    t3([
      ['SECCIÓN', 'SÍNTESIS', 'COORD.'],
      ['Epígrafe y Resumen', 'La cita de Luhmann ("reducir complejidad es el medio para construirla") es la paradoja central. El resumen anticipa que la empresa es el referente empírico y la perspectiva sistémica el marco teórico.', 'p. 1'],
      ['Introducción', 'La sociedad genera espacios donde nacen organizaciones que reducen complejidad del entorno, pero al hacerlo crean nueva complejidad interna. Ningún sistema reduce su propia complejidad; solo reduce la del entorno.', 'pp. 1-2'],
      ['1. Concepto', 'Definición técnica: sistema complejo = ≥ 2 estados posibles. El entorno siempre supera en complejidad al sistema. Las personas son la fuente primaria de complejidad porque operan en dos dominios simultáneos (Maturana). La complejidad se genera recursivamente.', 'pp. 2-4'],
      ['2. Fuentes', 'Dos fuentes: externa (del entorno, Luhmann) e interna (del propio sistema, Habermas). Las personas son la fuente interna más importante. El debate Parsons/Luhmann define si la psicología pertenece al sistema o al ambiente.', 'pp. 4-6'],
      ['3. Génesis', 'La complejidad no es un estado sino un proceso continuo. Ilustrado con los sistemas α y ß: cada sistema que reduce su complejidad genera nueva complejidad en el que lo toma como entorno.', 'pp. 6-8'],
      ['4. Reducción', 'Reducir complejidad es un proceso INTERNO (redefinir límites de sentido), no externo. Homeostasis = organización que aprende. Sin aprendizaje, la organización muere. Habermas distingue tres tipos de aprendizaje.', 'pp. 8-10'],
      ['4.1 Tiempo', 'El tiempo cataliza la complejidad porque: (1) las personas deben abstraerse del presente para planificar, y (2) las variables se estabilizan en el largo plazo.', 'pp. 10-11'],
      ['4.2 Incertidumbre', 'Distinción clave: complejidad ≠ incertidumbre. La incertidumbre requiere complejidad pero no al revés. Las dos herramientas de gestión son: planificación gerencial (corto plazo) y estratégica (largo plazo).', 'pp. 11-14'],
      ['5. Nacimiento', 'La complejización social genera condiciones para nuevas organizaciones. Las empresas son autopoiéticas: se autosostienen, no son creación deliberada. Las personas son "dato anecdótico".', 'pp. 14-16'],
      ['6. Conclusiones', 'Confirma que la complejidad es un proceso recursivo. Las empresas nacen por necesidad de reducción de complejidad. Son autopoiéticas, no heteropoiéticas.', 'pp. 16-17'],
    ], TW_P, 1400, 6560, 1400),
    ep(),

    // A.4 ALERTAS
    p('4. ALERTAS DE LECTURA — PUNTOS DONDE ES FÁCIL PERDERSE', { bold: true, size: 20, color: BF }),
    t2([
      ['⚠️ 1', 'La paradoja del epígrafe no es un juego de palabras. "Reducir complejidad crea complejidad" significa literalmente que cada vez que un sistema simplifica su relación con el entorno, se hace internamente más complejo. Si lees "reducir" como "eliminar", todo el artículo parece contradictorio.'],
      ['⚠️ 2', 'El texto usa "reducir complejidad del entorno" y "reducir la complejidad" como expresiones distintas. La primera es lo que hacen los sistemas (y es posible). La segunda (reducir la propia) es lo que NO hacen: al contrario, la aumentan. Confundir ambas produce una lectura opuesta a la correcta.'],
      ['⚠️ 3', 'El debate Luhmann/Habermas sobre fuentes de complejidad (Sección 2) parece un detalle académico pero es el corazón práctico: define si las características psicológicas de las personas son o no gestionables por la empresa. La conclusión —que sí pertenecen al sistema— tiene implicaciones directas para la gestión de personas.'],
      ['⚠️ 4', 'El ejemplo de los sistemas α y ß (Sección 3) es una simplificación extrema que el propio artículo reconoce. No interpretar como si describiera relaciones reales entre dos sistemas específicos: es solo herramienta didáctica para ilustrar el mecanismo recursivo.'],
      ['⚠️ 5', 'Complejidad e incertidumbre (Sección 4.2) son conceptos distintos aunque relacionados. Muchos lectores los equiparan. El artículo es explícito: puede haber complejidad sin incertidumbre, pero no al revés. Esta distinción es fundamental para entender cómo la planificación estratégica gestiona específicamente la incertidumbre, no la complejidad en abstracto.'],
    ], TW_P, 700, 8660, { bf: true }),
    ep(),

    // A.5 AFIRMACIONES CITABLES
    p('5. AFIRMACIONES CITABLES — Uso directo en tu tesis', { bold: true, size: 20, color: BF }),
    p('Frases del artículo directamente utilizables en un marco teórico doctoral, organizadas por función argumental.', { size: SZ_SM, color: '777777', italics: true }),
    t3([
      ['USO EN LA TESIS', 'AFIRMACIÓN CITABLE (verbatim)', 'REFERENCIA'],
      ['📌 DEFINIR complejidad técnicamente', '"Llamamos complejo a un sistema que puede tomar a lo menos dos estados que sean compatibles con su estructura […] el entorno es siempre más complejo que un sistema."', 'Bustamante & Opazo (2004, p. 3) — cita a Luhmann (1992)'],
      ['🏛 JUSTIFICAR visión sistémica', '"La empresa resulta ser un interesante y muy importante referente […] el más estudiado de todos los sistemas sociales, y donde se pueden hallar la mayor cantidad de evidencias empíricas."', 'Bustamante & Opazo (2004, pp. 1, 8)'],
      ['♻ EXPLICAR la paradoja', '"La complejidad se genera sistemática y recursivamente en el momento en que los sistemas reducen la complejidad del ambiente, aumentando la suya propia."', 'Bustamante & Opazo (2004, p. 4)'],
      ['⚖ DEBATIR fuentes internas vs externas', '"Habermas (1996) dice que posiblemente Luhmann no se ha percatado de que en los sistemas sociales existen dos fuentes de complejidad […] la que proviene del ambiente […] y la que proviene del propio sistema."', 'Bustamante & Opazo (2004, p. 5)'],
      ['🌱 FUNDAMENTAR aprendizaje como respuesta', '"Una organización social que se sustenta a si misma –homeostasis–, manteniéndose viva, es una organización que aprende y se desarrolla, y por lo tanto, es capaz de soportar los embates del cambio ambiental."', 'Bustamante & Opazo (2004, p. 9)'],
      ['⚡ ARGUMENTAR supervivencia', '"Una organización que no es capaz de identificar claramente sus límites, que no es capaz de aprender del entorno y de reducir la complejidad de éste, es una organización condenada a la muerte."', 'Bustamante & Opazo (2004, p. 9)'],
      ['🎯 VINCULAR con planificación', '"La empresa es un organismo racional con arreglo a fines, y que éste es su sentido, y que este sentido está especificado en la planificación estratégica."', 'Bustamante & Opazo (2004, p. 13)'],
      ['🔄 EXPLICAR génesis organizacional', '"Las empresas nacen como consecuencia de esta necesidad de reducción de la complejidad del ambiente que perturba a un espacio social determinado."', 'Bustamante & Opazo (2004, p. 17)'],
    ], TW_P, 1800, 5560, 2000),
  ],
};

module.exports = { portada, seccionA, p, r, ep, cl, rw, tbl, banner, t2, t3, mkHeader, mkFooter, SOURCE_TEXT, FONT, SZ, SZ_ANN, SZ_SM, COLOR, ANN_COLOR, BF, TW_P, TW_L, LC, RC, PM, LM };
