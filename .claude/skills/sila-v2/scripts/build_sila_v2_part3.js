// SILA v2 — Bustamante & Opazo (2004) — Part 3: Secciones C, C.2, D, E
const { p, r, ep, cl, rw, tbl, banner, t2, t3, mkHeader, mkFooter, FONT, SZ, SZ_ANN, SZ_SM, COLOR, ANN_COLOR, BF, TW_P, TW_L, LC, RC, PM, LM } = require('./build_sila_v2_part1.js');
const { SectionType, BorderStyle, AlignmentType, ShadingType, WidthType, TableCell, TableRow, Table, Paragraph, TextRun } = require('docx');

// ============================================================
// HELPERS — concept cards
// ============================================================
const NB = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };

function conceptCard(name, weight, author, def, anid, tens) {
  let fill, diamonds;
  if (weight === 3) { fill = '1F3864'; diamonds = '\u25C6\u25C6\u25C6 CR\u00CDTICO'; }
  else if (weight === 2) { fill = '2E75B6'; diamonds = '\u25C6\u25C6 IMPORTANTE'; }
  else { fill = '555577'; diamonds = '\u25C6 COMPLEMENTARIO'; }

  const headerRow = rw([cl([
    p(`${diamonds}: ${name}`, { bold: true, size: 19, color: 'FFFFFF', align: AlignmentType.LEFT }),
    p(author, { size: SZ_SM, color: 'DDDDDD', italics: true }),
  ], { w: TW_P, f: fill })]);

  const bodyRow = rw([cl([
    p('DEFINICI\u00D3N', { bold: true, size: SZ_SM, color: '1F3864' }),
    p(def, { size: SZ }),
    ep(),
    p('\u2195 ANIDAMIENTO', { bold: true, size: SZ_SM, color: '1F3864' }),
    p(anid, { size: SZ }),
    ep(),
    p('\u21C4 TENSIONES', { bold: true, size: SZ_SM, color: '1F3864' }),
    p(tens, { size: SZ }),
  ], { w: TW_P, f: 'F5F7FA' })]);

  return tbl([headerRow, bodyRow], TW_P, [TW_P]);
}

// ============================================================
// SECTION C — GLOSARIO DE IDEAS FUERZA
// ============================================================
const seccionC = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCI\u00D3N C: GLOSARIO') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCI\u00D3N C \u2014 GLOSARIO DE IDEAS FUERZA', TW_P),
    p('Cada tarjeta contiene la definici\u00F3n profunda, el anidamiento jer\u00E1rquico y las tensiones te\u00F3ricas del concepto.', { size: SZ_SM, color: '777777', italics: true }),
    p('Peso: \u25C6\u25C6\u25C6 Cr\u00EDtico (azul oscuro) \u00B7 \u25C6\u25C6 Importante (azul medio) \u00B7 \u25C6 Complementario (gris)', { size: SZ_SM, color: '777777' }),
    ep(),

    // 1
    conceptCard(
      'COMPLEJIDAD COMO PROCESO',
      3,
      'Bustamante bas\u00E1ndose en Luhmann',
      'Proceso sistem\u00E1tico y recursivo por el cual los sistemas sociales, al reducir la complejidad del entorno, aumentan inevitablemente la propia. No es un adjetivo ni un estado, sino una din\u00E1mica relacional permanente e irreversible. Un sistema es complejo cuando puede tomar al menos dos estados compatibles con su estructura, y el entorno siempre supera al sistema en estados posibles.',
      'Contiene \u2192 Reducci\u00F3n de complejidad, Fuentes de complejidad. Es parte de \u2192 Teor\u00EDa de Sistemas Sociales (Luhmann). Produce \u2192 Nacimiento de organizaciones, complejizaci\u00F3n del suprasistema.',
      '\u21C4 Complejidad como adjetivo (uso coloquial que reduce el concepto a "dif\u00EDcil").'
    ),
    ep(),

    // 2
    conceptCard(
      'REDUCCI\u00D3N DE COMPLEJIDAD',
      3,
      'Luhmann',
      'Proceso interno de las organizaciones sociales donde el sistema define sus l\u00EDmites de sentido, aprendiendo y asimilando una porci\u00F3n del entorno. No es simplificar ni cambiar el entorno externamente. Parad\u00F3jicamente, cada acto de reducci\u00F3n aumenta la complejidad propia del sistema que reduce. Es la funci\u00F3n primera y b\u00E1sica de la existencia de las organizaciones.',
      'Contiene \u2192 L\u00EDmites de sentido, Aprendizaje del entorno. Es parte de \u2192 Complejidad como proceso. Produce \u2192 Complejizaci\u00F3n interna, nacimiento de nuevas organizaciones.',
      '\u21C4 Simplificaci\u00F3n del entorno (intentar cambiar al otro sistema, no funciona).'
    ),
    ep(),

    // 3
    conceptCard(
      'L\u00CDMITES DE SENTIDO',
      3,
      'Luhmann, 1971',
      'Mecanismo cognitivo (no f\u00EDsico ni geogr\u00E1fico) por el cual un sistema social define la porci\u00F3n del entorno que considera relevante, aprende y reduce. Establecen las fronteras operativas de la organizaci\u00F3n y determinan qu\u00E9 complejidad "ve" y gestiona. Son la base sobre la cual se construye la planificaci\u00F3n estrat\u00E9gica.',
      'Es parte de \u2192 Reducci\u00F3n de complejidad. Produce \u2192 Identidad del sistema, Planificaci\u00F3n estrat\u00E9gica. Requiere \u2192 Capacidad de aprendizaje.',
      '\u21C4 L\u00EDmites f\u00EDsicos/geogr\u00E1ficos (Parsons no pudo resolverlo con l\u00EDmites f\u00EDsicos).'
    ),
    ep(),

    // 4
    conceptCard(
      'AUTOPOIESIS / AUTOORGANIZACI\u00D3N',
      2,
      'Maturana & Varela, 1998',
      'Capacidad de un sistema de producirse, mantenerse y reproducirse a s\u00ED mismo. Concepto originado en la biolog\u00EDa (Maturana y Varela, bi\u00F3logos chilenos) y aplicado por Bustamante a las organizaciones sociales. Las empresas son autopoi\u00E9ticas: se autosostienen, autoorganizan y son autorreferenciales. Lo contrario ser\u00EDa "heteropoi\u00E9ticas" (creadas artificialmente).',
      'Contiene \u2192 Homeostasis, Autorreferencia. Requiere \u2192 Reducci\u00F3n de complejidad, Acoplamiento estructural. Produce \u2192 Permanencia del sistema.',
      '\u21C4 Heteropoiesis (que las personas creen empresas es "dato anecd\u00F3tico" para el an\u00E1lisis social).'
    ),
    ep(),

    // 5
    conceptCard(
      'FUENTES DE COMPLEJIDAD DUAL',
      2,
      'Habermas, 1996',
      'Habermas critica a Luhmann se\u00F1alando que existen DOS fuentes de complejidad en los sistemas sociales, posiblemente relacionadas entre s\u00ED: (1) la complejidad externa, del ambiente, que el sistema aprende y reduce v\u00EDa l\u00EDmites de sentido (reconocida por Luhmann); y (2) la complejidad interna, del propio sistema, generada por las personas como partes constituyentes. En las personas se unen capacidades destructivas y constructivas.',
      'Contiene \u2192 Complejidad externa, Complejidad interna. Es parte de \u2192 Complejidad como proceso.',
      '\u21C4 Fuente \u00FAnica ambiental (Luhmann original). \u21C4 Personas como parte del ambiente (Parsons).'
    ),
    ep(),

    // 6
    conceptCard(
      'ACOPLAMIENTO ESTRUCTURAL',
      2,
      'Maturana & Varela',
      'Relaci\u00F3n entre sistemas donde los cambios de uno generan perturbaciones en el otro sin determinar su respuesta. Los sistemas coexisten manteniendo su autonom\u00EDa operativa. En el contexto de la complejidad, cuando un sistema reduce la complejidad de su ambiente, todos los sistemas en acoplamiento estructural con \u00E9l ven aumentada su complejidad ambiental.',
      'Es parte de \u2192 Autopoiesis. Requiere \u2192 L\u00EDmites del sistema. Produce \u2192 Perturbaciones mutuas, complejizaci\u00F3n cruzada.',
      '\u21C4 Determinismo causal directo (un sistema NO causa cambios en otro; solo perturba).'
    ),
    ep(),

    // 7
    conceptCard(
      'PLANIFICACI\u00D3N ESTRAT\u00C9GICA',
      2,
      'Anthony, 1976; Mintzberg/Quinn, 1993',
      'Proceso mediante el cual la empresa define su sentido, asume la complejidad del entorno como aprendida y reducida, y establece metas de largo plazo. Es el mecanismo formal que operacionaliza la reducci\u00F3n de complejidad. El entorno se asume como "dado" o controlable, a diferencia de la planificaci\u00F3n gerencial donde es vol\u00E1til. La empresa es "un organismo racional con arreglo a fines" gracias a la planificaci\u00F3n estrat\u00E9gica.',
      'Es parte de \u2192 Reducci\u00F3n de complejidad. Requiere \u2192 L\u00EDmites de sentido. Produce \u2192 Identidad organizacional, misi\u00F3n, visi\u00F3n, estrategia.',
      '\u21C4 Planificaci\u00F3n gerencial (corto plazo, entorno vol\u00E1til). \u21C4 Estrategia como patr\u00F3n emergente (Mintzberg).'
    ),
    ep(),

    // 8
    conceptCard(
      'INCERTIDUMBRE',
      1,
      'Luhmann, 1992',
      'Condici\u00F3n dirigida a una decisi\u00F3n particular dentro de la empresa. No puede existir sin complejidad (condici\u00F3n necesaria), pero s\u00ED puede existir complejidad sin incertidumbre (cuando no est\u00E1 dirigida a una decisi\u00F3n). Luhmann la vincula con el riesgo como "forma de descripci\u00F3n presente del futuro".',
      'Requiere \u2192 Complejidad. Es parte de \u2192 Toma de decisiones. Se mitiga con \u2192 Planificaci\u00F3n estrat\u00E9gica.',
      '\u21C4 Complejidad (sist\u00E9mica/general vs puntual/decisional).'
    ),
    ep(),

    // 9
    conceptCard(
      'HOMEOSTASIS',
      1,
      'Maturana/Varela, Etkin',
      'Capacidad de una organizaci\u00F3n social de sustentarse a s\u00ED misma manteni\u00E9ndose viva, aprendiendo y desarroll\u00E1ndose. Una organizaci\u00F3n homeost\u00E1tica soporta los embates del cambio ambiental. Sin homeostasis, el sistema pierde su organizaci\u00F3n y muere. "La mantenci\u00F3n de la organizaci\u00F3n del sistema es la vida de \u00E9ste."',
      'Es parte de \u2192 Autopoiesis. Requiere \u2192 Reducci\u00F3n de complejidad, Capacidad de aprendizaje. Produce \u2192 Supervivencia organizacional.',
      '\u21C4 Muerte organizacional (incapacidad de aprender y reducir complejidad).'
    ),
    ep(),

    // MAPA DE ANIDAMIENTO Y TENSIONES
    banner('MAPA DE ANIDAMIENTO Y TENSIONES', TW_P),
    ep(),
    p('Complejidad como proceso \u25C6\u25C6\u25C6', { bold: true, size: SZ }),
    p('\u251C\u2500\u2500 Reducci\u00F3n de complejidad \u25C6\u25C6\u25C6', { size: SZ }),
    p('\u2502   \u251C\u2500\u2500 L\u00EDmites de sentido \u25C6\u25C6\u25C6', { size: SZ }),
    p('\u2502   \u2502   \u2514\u2500\u2500 Planificaci\u00F3n estrat\u00E9gica \u25C6\u25C6', { size: SZ }),
    p('\u2502   \u2514\u2500\u2500 Aprendizaje del entorno', { size: SZ }),
    p('\u2514\u2500\u2500 Fuentes de complejidad (dual) \u25C6\u25C6', { size: SZ }),
    ep(),
    p('Autopoiesis \u25C6\u25C6', { bold: true, size: SZ }),
    p('\u251C\u2500\u2500 Acoplamiento estructural \u25C6\u25C6', { size: SZ }),
    p('\u2514\u2500\u2500 Homeostasis \u25C6', { size: SZ }),
    ep(),
    p('Incertidumbre \u25C6', { bold: true, size: SZ }),
    ep(),

    // TENSION PAIRS TABLE
    banner('PARES DE TENSI\u00D3N TE\u00D3RICA', TW_P),
    p('Cada par representa una distinci\u00F3n cr\u00EDtica que el art\u00EDculo establece o implica.', { size: SZ_SM, color: '777777', italics: true }),
    ep(),
    tbl([
      rw([
        cl([p('CONCEPTO A', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 3120, f: '1F3864' }),
        cl([p('\u21C4', { bold: true, size: SZ_SM, color: 'FFFFFF', align: AlignmentType.CENTER })], { w: 600, f: '1F3864' }),
        cl([p('CONCEPTO B', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 3120, f: '1F3864' }),
        cl([p('IMPLICANCIA', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 2520, f: '1F3864' }),
      ]),
      rw([
        cl([p('Complejidad como proceso', { size: SZ })], { w: 3120 }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600 }),
        cl([p('Complejidad como adjetivo', { size: SZ })], { w: 3120 }),
        cl([p('Confundir ambas impide entender el mecanismo recursivo', { size: SZ_SM })], { w: 2520 }),
      ]),
      rw([
        cl([p('Reducci\u00F3n de complejidad', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600, f: 'F5F7FA' }),
        cl([p('Simplificaci\u00F3n del entorno', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('Solo se reduce internamente, no se cambia al otro sistema', { size: SZ_SM })], { w: 2520, f: 'F5F7FA' }),
      ]),
      rw([
        cl([p('L\u00EDmites de sentido (cognitivos)', { size: SZ })], { w: 3120 }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600 }),
        cl([p('L\u00EDmites f\u00EDsicos/geogr\u00E1ficos', { size: SZ })], { w: 3120 }),
        cl([p('Parsons fracas\u00F3 con l\u00EDmites f\u00EDsicos; Luhmann resuelve con sentido', { size: SZ_SM })], { w: 2520 }),
      ]),
      rw([
        cl([p('Fuente dual (Habermas)', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600, f: 'F5F7FA' }),
        cl([p('Fuente \u00FAnica ambiental (Luhmann)', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('Incluir personas como fuente interna cambia la gesti\u00F3n de RRHH', { size: SZ_SM })], { w: 2520, f: 'F5F7FA' }),
      ]),
      rw([
        cl([p('Autopoiesis (nacimiento espont\u00E1neo)', { size: SZ })], { w: 3120 }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600 }),
        cl([p('Heteropoiesis (creaci\u00F3n deliberada)', { size: SZ })], { w: 3120 }),
        cl([p('Las empresas son resultado sist\u00E9mico, no acci\u00F3n individual', { size: SZ_SM })], { w: 2520 }),
      ]),
      rw([
        cl([p('Complejidad (sist\u00E9mica)', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('\u21C4', { size: SZ, align: AlignmentType.CENTER })], { w: 600, f: 'F5F7FA' }),
        cl([p('Incertidumbre (decisional)', { size: SZ })], { w: 3120, f: 'F5F7FA' }),
        cl([p('Puede haber complejidad sin incertidumbre, pero no al rev\u00E9s', { size: SZ_SM })], { w: 2520, f: 'F5F7FA' }),
      ]),
    ], TW_P, [3120, 600, 3120, 2520]),
  ],
};

// ============================================================
// SECTION C.2 — PROTOCOLO DE REVISI\u00D3N ESPACIADA
// ============================================================
const seccionC2 = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCI\u00D3N C.2: REVISI\u00D3N ESPACIADA') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCI\u00D3N C.2 \u2014 PROTOCOLO DE REVISI\u00D3N ESPACIADA', TW_P),
    p('Basado en la curva del olvido de Ebbinghaus. Tres sesiones distribuidas en 30 d\u00EDas transforman la lectura en conocimiento permanente.', { size: SZ_SM, color: '777777', italics: true }),
    ep(),

    // CURVA DEL OLVIDO
    p('CURVA DEL OLVIDO \u2014 Visualizaci\u00F3n', { bold: true, size: 18, color: BF }),
    tbl([
      rw([
        cl([p('Inmediato', { bold: true, size: SZ_SM, align: AlignmentType.CENTER })], { w: 1872, f: 'E8E8E8' }),
        cl([p('24 horas', { bold: true, size: SZ_SM, align: AlignmentType.CENTER })], { w: 1872, f: 'E8E8E8' }),
        cl([p('7 d\u00EDas', { bold: true, size: SZ_SM, align: AlignmentType.CENTER })], { w: 1872, f: 'E8E8E8' }),
        cl([p('30 d\u00EDas', { bold: true, size: SZ_SM, align: AlignmentType.CENTER })], { w: 1872, f: 'E8E8E8' }),
        cl([p('30 d\u00EDas CON protocolo', { bold: true, size: SZ_SM, align: AlignmentType.CENTER })], { w: 1872, f: 'E8E8E8' }),
      ]),
      rw([
        cl([p('100%', { bold: true, size: 22, color: '1A5C38', align: AlignmentType.CENTER })], { w: 1872, f: 'F0FFF0' }),
        cl([p('~30%', { bold: true, size: 22, color: 'C00000', align: AlignmentType.CENTER })], { w: 1872, f: 'FFF0F0' }),
        cl([p('~15%', { bold: true, size: 22, color: 'C00000', align: AlignmentType.CENTER })], { w: 1872, f: 'FFF0F0' }),
        cl([p('~5%', { bold: true, size: 22, color: 'C00000', align: AlignmentType.CENTER })], { w: 1872, f: 'FFF0F0' }),
        cl([p('~80%', { bold: true, size: 22, color: '1A5C38', align: AlignmentType.CENTER })], { w: 1872, f: 'F0FFF0' }),
      ]),
    ], TW_P, [1872, 1872, 1872, 1872, 1872]),
    p('Sin revisi\u00F3n activa, retienes menos del 5% a los 30 d\u00EDas. Con el protocolo SILA, retienes ~80%.', { size: SZ_SM, color: 'C00000', italics: true }),
    ep(),

    // SESI\u00D3N 1
    banner('SESI\u00D3N 1 \u2014 HOY (15-20 min)', TW_P),
    p('Fecha sugerida: 2026-03-23', { size: SZ_SM, color: '777777', italics: true }),
    tbl([rw([cl([
      p('Retrieval completo de todas las secciones:', { bold: true, size: SZ }),
      p('\u25A1  Sin mirar el documento, escribe en una hoja los 5 conceptos que m\u00E1s recuerdas del art\u00EDculo.', { size: SZ }),
      p('\u25A1  Compara con el Glosario (Secci\u00F3n C). Marca los que olvidaste con \u2717.', { size: SZ }),
      p('\u25A1  Para cada concepto olvidado, relee SOLO la tarjeta correspondiente.', { size: SZ }),
      p('\u25A1  Revisa la Secci\u00F3n A.2 (Puente a tu tesis): \u00BFcambi\u00F3 alguna respuesta despu\u00E9s de leer el texto?', { size: SZ }),
      p('\u25A1  Agenda la Sesi\u00F3n 2 para el 2026-03-30 (7 d\u00EDas).', { size: SZ }),
    ], { w: TW_P, f: 'F5F7FA' })])], TW_P, [TW_P]),
    ep(),

    // SESI\u00D3N 2
    banner('SESI\u00D3N 2 \u2014 7 D\u00CDAS (10-12 min)', TW_P),
    p('Fecha sugerida: 2026-03-30', { size: SZ_SM, color: '777777', italics: true }),
    tbl([rw([cl([
      p('Retrieval focalizado + reconstrucci\u00F3n:', { bold: true, size: SZ }),
      p('\u25A1  Repite SOLO el retrieval de los conceptos que fallaste en la Sesi\u00F3n 1.', { size: SZ }),
      p('\u25A1  Sin mirar, reconstruye el mapa de tensiones: escribe al menos 4 pares de tensi\u00F3n.', { size: SZ }),
      p('\u25A1  Compara con la tabla de tensiones (Secci\u00F3n C). Anota discrepancias.', { size: SZ }),
      p('\u25A1  Escribe 3-4 l\u00EDneas sobre c\u00F3mo usar\u00EDas este texto en tu tesis doctoral.', { size: SZ }),
      p('\u25A1  Agenda la Sesi\u00F3n 3 para el 2026-04-22 (30 d\u00EDas desde la lectura original).', { size: SZ }),
    ], { w: TW_P, f: 'F5F7FA' })])], TW_P, [TW_P]),
    ep(),

    // SESI\u00D3N 3
    banner('SESI\u00D3N 3 \u2014 30 D\u00CDAS (8-10 min)', TW_P),
    p('Fecha sugerida: 2026-04-22', { size: SZ_SM, color: '777777', italics: true }),
    tbl([rw([cl([
      p('Consolidaci\u00F3n y decisi\u00F3n:', { bold: true, size: SZ }),
      p('\u25A1  Abre el Glosario (Secci\u00F3n C). Lee solo los nombres de los 9 conceptos. \u00BFPuedes definir cada uno sin leer la tarjeta?', { size: SZ }),
      p('\u25A1  Haz retrieval de 2-3 conceptos al azar.', { size: SZ }),
      p('\u25A1  Escribe 2 conexiones concretas entre este texto y otro que hayas le\u00EDdo para tu tesis.', { size: SZ }),
      p('\u25A1  Decide: \u00BFeste art\u00EDculo es una fuente central, complementaria o descartable para tu investigaci\u00F3n?', { size: SZ }),
      p('\u25A1  Registra la decisi\u00F3n en la Secci\u00F3n E (Mapa inter-textual).', { size: SZ }),
    ], { w: TW_P, f: 'F5F7FA' })])], TW_P, [TW_P]),
    ep(),

    // 5 REGLAS DE ORO
    banner('5 REGLAS DE ORO DE LA REVISI\u00D3N ESPACIADA', TW_P),
    tbl([rw([cl([
      p('1. RETRIEVAL ANTES DE RELECTURA \u2014 Siempre intenta recordar antes de releer. El esfuerzo de recuperaci\u00F3n es lo que fortalece la memoria.', { size: SZ }),
      p('2. ESPACIADO > MASIVO \u2014 Tres sesiones cortas de 10-20 min distribuidas en 30 d\u00EDas superan 3 horas de estudio continuo.', { size: SZ }),
      p('3. FOCALIZA EN FALLOS \u2014 En cada sesi\u00F3n, dedica m\u00E1s tiempo a lo que olvidaste, no a lo que ya sabes.', { size: SZ }),
      p('4. CONECTA, NO REPITAS \u2014 La memoria se consolida cuando conectas informaci\u00F3n nueva con conocimiento previo (elaboraci\u00F3n).', { size: SZ }),
      p('5. ESCRIBE A MANO \u2014 El acto de escribir a mano activa rutas neuronales diferentes y mejora la retenci\u00F3n. Usa papel f\u00EDsico para el retrieval.', { size: SZ }),
    ], {
      w: TW_P, f: 'FFFFF0',
      b: { left: { style: BorderStyle.SINGLE, size: 6, color: 'C55A11' } },
    })])], TW_P, [TW_P]),
  ],
};

// ============================================================
// SECTION D — REFLEXIONES Y APUNTES PERSONALES
// ============================================================

function reflBlock(title, color, children) {
  return tbl([rw([cl(
    [p(title, { bold: true, size: 18, color: color }), ...children],
    {
      w: TW_P, f: 'FFFFFF',
      b: { left: { style: BorderStyle.SINGLE, size: 8, color: color } },
    }
  )])], TW_P, [TW_P]);
}

const seccionD = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCI\u00D3N D: REFLEXIONES') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCI\u00D3N D \u2014 REFLEXIONES Y APUNTES PERSONALES', TW_P),
    p('Espacio libre para registrar tu di\u00E1logo con el texto. Completa durante o despu\u00E9s de la lectura.', { size: SZ_SM, color: '777777', italics: true }),
    ep(),

    // METADATA
    tbl([
      rw([
        cl([p('Art\u00EDculo', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }),
        cl([p('Bustamante & Opazo (2004) \u2014 Hacia un Concepto de Complejidad')], { w: 7020 }),
      ]),
      rw([
        cl([p('Fecha de lectura', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }),
        cl([p('______ / ______ / ________')], { w: 7020 }),
      ]),
      rw([
        cl([p('Sesi\u00F3n', { bold: true, size: SZ_SM })], { w: 2340, f: 'E8E8E8' }),
        cl([p('\u25A1 Primera lectura   \u25A1 Relectura   \u25A1 Revisi\u00F3n espaciada (S1 / S2 / S3)')], { w: 7020 }),
      ]),
    ], TW_P, [2340, 7020]),
    ep(),

    // 1. Primera impresi\u00F3n
    reflBlock('1. PRIMERA IMPRESI\u00D3N', '2E75B6', [
      p('\u00BFQu\u00E9 sentiste al terminar de leer? \u00BFQu\u00E9 te sorprendi\u00F3? \u00BFQu\u00E9 te confundi\u00F3?', { size: SZ_SM, color: '777777', italics: true }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
    ]),
    ep(),

    // 2. Conexiones con investigaci\u00F3n doctoral
    reflBlock('2. CONEXIONES CON INVESTIGACI\u00D3N DOCTORAL', '1A5C38', [
      p('\u00BFC\u00F3mo se relaciona con tu tema de tesis? \u00BFQu\u00E9 conceptos podr\u00EDas incorporar?', { size: SZ_SM, color: '777777', italics: true }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
    ]),
    ep(),

    // 3. Preguntas que genera
    reflBlock('3. PREGUNTAS QUE GENERA', 'C55A11', [
      p('\u00BFQu\u00E9 preguntas te deja el texto? \u00BFQu\u00E9 querr\u00EDas explorar m\u00E1s?', { size: SZ_SM, color: '777777', italics: true }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
    ]),
    ep(),

    // 4. Textos a explorar
    reflBlock('4. TEXTOS A EXPLORAR', '5B2C8C', [
      p('Referencias del art\u00EDculo que vale la pena buscar:', { size: SZ_SM, color: '777777', italics: true }),
      p('\u25A1  Luhmann, N. (1971). Politische Planung. Opladen, Westdeutscher Verlag.', { size: SZ }),
      p('\u25A1  Luhmann, N. (1992). Sociolog\u00EDa del Riesgo. Universidad Iberoamericana / Universidad de Guadalajara.', { size: SZ }),
      p('\u25A1  Luhmann, N. (1997). Organizaci\u00F3n y Decisi\u00F3n. Autopoiesis, Acci\u00F3n y Entendimiento Comunicativo. Anthropos.', { size: SZ }),
      p('\u25A1  Habermas, J. (1996). La L\u00F3gica de las Ciencias Sociales. Madrid, Tecnos.', { size: SZ }),
      p('\u25A1  Maturana, H. & Varela, F. (1998). De M\u00E1quinas y Seres Vivos. Autopoiesis: la Organizaci\u00F3n de lo Vivo. Santiago, Editorial Universitaria.', { size: SZ }),
      p('\u25A1  Senge, P. (1990). La Quinta Disciplina. Granica. / Senge, P. (1994). La Quinta Disciplina en la Pr\u00E1ctica. Granica.', { size: SZ }),
      p('\u25A1  Parsons, T. (1951). The Social System. New York, Free Press.', { size: SZ }),
      p('\u25A1  Gibson, R. (1987). Organizaciones: Comportamiento, Estructura, Procesos. Editorial Interamericana.', { size: SZ }),
      p('\u25A1  Limone, A. (1998). La Empresa como Sistema Autopoi\u00E9tico. U. Cat\u00F3lica de Valpara\u00EDso.', { size: SZ }),
    ]),
    ep(),

    // 5. Acciones concretas
    reflBlock('5. ACCIONES CONCRETAS', 'C00000', [
      p('Tareas espec\u00EDficas derivadas de la lectura:', { size: SZ_SM, color: '777777', italics: true }),
      p('\u25A1  ', { size: SZ, after: 150 }),
      p('\u25A1  ', { size: SZ, after: 150 }),
      p('\u25A1  ', { size: SZ, after: 150 }),
      p('\u25A1  ', { size: SZ, after: 150 }),
      p('\u25A1  ', { size: SZ, after: 150 }),
    ]),
    ep(),

    // 6. Dudas activas
    reflBlock('6. DUDAS ACTIVAS', '777777', [
      p('Puntos que necesitan resoluci\u00F3n (consulta con tutor, b\u00FAsqueda adicional, discusi\u00F3n):', { size: SZ_SM, color: '777777', italics: true }),
      p('1. ', { size: SZ, after: 150 }),
      p('2. ', { size: SZ, after: 150 }),
      p('3. ', { size: SZ, after: 150 }),
      p('4. ', { size: SZ, after: 150 }),
      p('5. ', { size: SZ, after: 150 }),
    ]),
    ep(),

    // 7. Agenda para discusi\u00F3n
    reflBlock('7. AGENDA PARA DISCUSI\u00D3N', '2E75B6', [
      p('Temas para llevar a tutor\u00EDa, grupo de estudio o seminario:', { size: SZ_SM, color: '777777', italics: true }),
    ]),
    tbl([
      rw([
        cl([p('TEMA', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: '2E75B6' }),
        cl([p('CON QUI\u00C9N', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 2340, f: '2E75B6' }),
        cl([p('FECHA', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 2340, f: '2E75B6' }),
      ]),
      rw([
        cl([p('')], { w: 4680 }),
        cl([p('')], { w: 2340 }),
        cl([p('')], { w: 2340 }),
      ]),
      rw([
        cl([p('')], { w: 4680, f: 'F5F7FA' }),
        cl([p('')], { w: 2340, f: 'F5F7FA' }),
        cl([p('')], { w: 2340, f: 'F5F7FA' }),
      ]),
      rw([
        cl([p('')], { w: 4680 }),
        cl([p('')], { w: 2340 }),
        cl([p('')], { w: 2340 }),
      ]),
      rw([
        cl([p('')], { w: 4680, f: 'F5F7FA' }),
        cl([p('')], { w: 2340, f: 'F5F7FA' }),
        cl([p('')], { w: 2340, f: 'F5F7FA' }),
      ]),
    ], TW_P, [4680, 2340, 2340]),
    ep(),

    // NOTAS LIBRES
    tbl([rw([cl([
      p('NOTAS LIBRES', { bold: true, size: 18, color: '999999' }),
      p('Espacio abierto para cualquier idea, esquema o conexi\u00F3n que surja durante la lectura.', { size: SZ_SM, color: '999999', italics: true }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
      p('', { after: 200 }),
    ], {
      w: TW_P, f: 'FAFAFA',
      b: { left: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    })])], TW_P, [TW_P]),
  ],
};

// ============================================================
// SECTION E — MAPA DE DI\u00C1LOGOS INTER-TEXTUALES
// ============================================================
const seccionE = {
  properties: {
    page: { size: { width: 12240, height: 15840 }, margin: PM },
    type: SectionType.NEXT_PAGE,
  },
  headers: { default: mkHeader('SECCI\u00D3N E: MAPA INTER-TEXTUAL') },
  footers: { default: mkFooter() },
  children: [
    banner('SECCI\u00D3N E \u2014 MAPA DE DI\u00C1LOGOS INTER-TEXTUALES', TW_P),
    p('Este mapa registra c\u00F3mo este texto conversa con otros que has le\u00EDdo o leer\u00E1s. Compl\u00E9talo progresivamente a medida que avanzas en tu revisi\u00F3n de literatura.', { size: SZ_SM, color: '777777', italics: true }),
    p('Instrucciones: Para cada texto que leas, decide si converge, entra en tensi\u00F3n o abre preguntas respecto a Bustamante & Opazo (2004). Registra la conexi\u00F3n en el bloque correspondiente.', { size: SZ_SM, color: '777777' }),
    ep(),

    // 1. CONVERGE CON
    tbl([rw([cl([
      p('\u2194 CONVERGE CON', { bold: true, size: 18, color: '1A5C38' }),
      p('Textos que comparten supuestos, conclusiones o marcos te\u00F3ricos con este art\u00EDculo.', { size: SZ_SM, color: '777777', italics: true }),
    ], {
      w: TW_P, f: 'EDF7ED',
      b: { left: { style: BorderStyle.SINGLE, size: 8, color: '1A5C38' } },
    })])], TW_P, [TW_P]),
    tbl([
      rw([
        cl([p('TEXTO / AUTOR', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: '1A5C38' }),
        cl([p('PUNTO DE CONVERGENCIA', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: '1A5C38' }),
      ]),
      rw([cl([p('')], { w: 4680 }), cl([p('')], { w: 4680 })]),
      rw([cl([p('')], { w: 4680, f: 'F5F7FA' }), cl([p('')], { w: 4680, f: 'F5F7FA' })]),
      rw([cl([p('')], { w: 4680 }), cl([p('')], { w: 4680 })]),
    ], TW_P, [4680, 4680]),
    ep(),

    // 2. ENTRA EN TENSI\u00D3N CON
    tbl([rw([cl([
      p('\u21C4 ENTRA EN TENSI\u00D3N CON', { bold: true, size: 18, color: 'C00000' }),
      p('Textos que contradicen, matizan o desaf\u00EDan los supuestos de este art\u00EDculo.', { size: SZ_SM, color: '777777', italics: true }),
    ], {
      w: TW_P, f: 'FDF0F0',
      b: { left: { style: BorderStyle.SINGLE, size: 8, color: 'C00000' } },
    })])], TW_P, [TW_P]),
    tbl([
      rw([
        cl([p('TEXTO / AUTOR', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: 'C00000' }),
        cl([p('PUNTO DE TENSI\u00D3N', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: 'C00000' }),
      ]),
      rw([cl([p('')], { w: 4680 }), cl([p('')], { w: 4680 })]),
      rw([cl([p('')], { w: 4680, f: 'F5F7FA' }), cl([p('')], { w: 4680, f: 'F5F7FA' })]),
      rw([cl([p('')], { w: 4680 }), cl([p('')], { w: 4680 })]),
    ], TW_P, [4680, 4680]),
    ep(),

    // 3. ABRE PREGUNTAS HACIA
    tbl([rw([cl([
      p('\u2192 ABRE PREGUNTAS HACIA', { bold: true, size: 18, color: '2E75B6' }),
      p('Textos o l\u00EDneas de investigaci\u00F3n que este art\u00EDculo sugiere explorar.', { size: SZ_SM, color: '777777', italics: true }),
    ], {
      w: TW_P, f: 'EBF3FB',
      b: { left: { style: BorderStyle.SINGLE, size: 8, color: '2E75B6' } },
    })])], TW_P, [TW_P]),
    tbl([
      rw([
        cl([p('DIRECCI\u00D3N / PREGUNTA', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: '2E75B6' }),
        cl([p('TEXTOS CANDIDATOS', { bold: true, size: SZ_SM, color: 'FFFFFF' })], { w: 4680, f: '2E75B6' }),
      ]),
      rw([
        cl([p('\u00BFC\u00F3mo cambia la din\u00E1mica de complejidad organizacional cuando la IA asume funciones de reducci\u00F3n de complejidad que antes eran exclusivamente humanas?', { size: SZ })], { w: 4680 }),
        cl([p('')], { w: 4680 }),
      ]),
      rw([
        cl([p('\u00BFEl aprendizaje organizacional descrito por Senge (1990) es compatible con la reducci\u00F3n de complejidad de Luhmann, o son marcos paralelos que no se cruzan?', { size: SZ })], { w: 4680, f: 'F5F7FA' }),
        cl([p('')], { w: 4680, f: 'F5F7FA' }),
      ]),
      rw([cl([p('')], { w: 4680 }), cl([p('')], { w: 4680 })]),
    ], TW_P, [4680, 4680]),
    ep(),

    // DIAGN\u00D3STICO DE POSICI\u00D3N
    banner('DIAGN\u00D3STICO DE POSICI\u00D3N EN TU REVISI\u00D3N DE LITERATURA', TW_P),
    p('Completa despu\u00E9s de la Sesi\u00F3n 3 del protocolo de revisi\u00F3n espaciada.', { size: SZ_SM, color: '777777', italics: true }),
    tbl([
      rw([
        cl([p('Clasificaci\u00F3n', { bold: true, size: SZ_SM })], { w: 3120, f: 'E8E8E8' }),
        cl([p('\u25A1 Fuente primaria   \u25A1 Fuente secundaria   \u25A1 Referencia contextual   \u25A1 Descartado')], { w: 6240 }),
      ]),
      rw([
        cl([p('Centralidad', { bold: true, size: SZ_SM })], { w: 3120, f: 'E8E8E8' }),
        cl([p('\u25A1 Central (marco te\u00F3rico)   \u25A1 De apoyo (argumento espec\u00EDfico)   \u25A1 Perif\u00E9rica')], { w: 6240 }),
      ]),
      rw([
        cl([p('Cap\u00EDtulo de la tesis', { bold: true, size: SZ_SM })], { w: 3120, f: 'E8E8E8' }),
        cl([p('\u25A1 Cap. 1 (Introducci\u00F3n)   \u25A1 Cap. 2 (Marco te\u00F3rico)   \u25A1 Cap. 3 (Metodolog\u00EDa)   \u25A1 Cap. 5 (Discusi\u00F3n)')], { w: 6240 }),
      ]),
      rw([
        cl([p('Nota para el futuro', { bold: true, size: SZ_SM })], { w: 3120, f: 'E8E8E8' }),
        cl([p('')], { w: 6240 }),
      ]),
    ], TW_P, [3120, 6240]),
    ep(),

    // NOTA METODOL\u00D3GICA
    tbl([rw([cl([
      p('Nota metodol\u00F3gica', { bold: true, size: SZ, color: '555577' }),
      p('Este mapa inter-textual implementa los principios de s\u00EDntesis de literatura acad\u00E9mica propuestos por Spivey (1990) \u2014 organizaci\u00F3n, selecci\u00F3n y conexi\u00F3n \u2014 y los criterios de calidad de revisi\u00F3n de literatura de Boote & Beile (2005): cobertura, s\u00EDntesis, metodolog\u00EDa, significancia y ret\u00F3rica. El objetivo no es acumular fichas aisladas, sino construir una red de significados progresiva que sostenga tu argumento doctoral.', { size: SZ_SM, color: '555577' }),
    ], {
      w: TW_P, f: 'F7F7F7',
      b: { left: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    })])], TW_P, [TW_P]),
  ],
};

module.exports = { seccionC, seccionC2, seccionD, seccionE };
