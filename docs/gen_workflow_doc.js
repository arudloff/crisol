/**
 * gen_workflow_doc.js
 * Genera el documento "Protocolo de Producción Doctoral Hibridada con IA"
 * Ejecutar: NODE_PATH=/tmp/docgen/node_modules node gen_workflow_doc.js
 */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  PageNumber, NumberFormat, Header, Footer, Tab, TabStopPosition, TabStopType,
  SectionType, LevelFormat, convertInchesToTwip
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Constants ──────────────────────────────────────────────────────────────
const FONT = "Times New Roman";
const BODY_SIZE = 24;       // half-points → 12pt
const H1_SIZE = 32;         // 16pt
const H2_SIZE = 28;         // 14pt
const H3_SIZE = 24;         // 12pt
const LINE_SPACING = 276;   // 1.15

const OUTPUT = path.join(__dirname, "Protocolo_Workflow_Hibridado_CRISOL.docx");

// ── Helper functions ───────────────────────────────────────────────────────

function bodyParagraph(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, font: FONT, size: BODY_SIZE, bold: opts.bold || false, italics: opts.italics || false }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") {
        runs.push(new TextRun({ text: t, font: FONT, size: BODY_SIZE }));
      } else {
        runs.push(new TextRun({ text: t.text, font: FONT, size: BODY_SIZE, bold: t.bold || false, italics: t.italics || false }));
      }
    });
  }
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: LINE_SPACING },
    ...(opts.indent ? { indent: { left: opts.indent } } : {}),
  });
}

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: H1_SIZE, bold: true })],
    spacing: { before: 400, after: 200, line: LINE_SPACING },
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_1,
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: H2_SIZE, bold: true })],
    spacing: { before: 360, after: 180, line: LINE_SPACING },
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_2,
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: H3_SIZE, bold: true, italics: true })],
    spacing: { before: 300, after: 160, line: LINE_SPACING },
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_3,
  });
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 100 } });
}

const BORDER_STYLE = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "000000",
};

const TABLE_BORDERS = {
  top: BORDER_STYLE,
  bottom: BORDER_STYLE,
  left: BORDER_STYLE,
  right: BORDER_STYLE,
};

function tableCell(text, opts = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({
          text,
          font: FONT,
          size: opts.size || BODY_SIZE,
          bold: opts.bold || false,
          italics: opts.italics || false,
        })],
        alignment: opts.alignment || AlignmentType.LEFT,
        spacing: { after: 40, line: 260 },
      }),
    ],
    borders: TABLE_BORDERS,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { fill: opts.shading } : undefined,
  });
}

function headerCell(text, width) {
  return tableCell(text, { bold: true, shading: "D9E2F3", width });
}

// ── CONTENT ────────────────────────────────────────────────────────────────

const children = [];

// ── Title page ─────────────────────────────────────────────────────────────
children.push(emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine());
children.push(new Paragraph({
  children: [new TextRun({
    text: "Protocolo de Produccion Doctoral Hibridada con Inteligencia Artificial:",
    font: FONT, size: 40, bold: true,
  })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
}));
children.push(new Paragraph({
  children: [new TextRun({
    text: "Arquitectura, Verificacion y Trazabilidad del Sistema CRISOL + /dr",
    font: FONT, size: 40, bold: true,
  })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
}));
children.push(emptyLine(), emptyLine());
children.push(new Paragraph({
  children: [new TextRun({ text: "Alejandro Rudloff Munoz", font: FONT, size: 28 })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Universidad de Talca", font: FONT, size: 28 })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 100 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Programa de Doctorado en Management (MGT)", font: FONT, size: 28 })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 400 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "Abril 2026", font: FONT, size: 28 })],
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
}));
children.push(new Paragraph({
  children: [],
  pageBreakBefore: true,
}));

// ── Table of contents summary ──────────────────────────────────────────────
children.push(heading1("Indice de contenidos"));
const tocEntries = [
  ["1.", "Introduccion y proposito", "3"],
  ["2.", "Arquitectura del sistema", "5"],
  ["3.", "Las 10 fases del workflow", "8"],
  ["4.", "Sistema de verificacion multinivel", "13"],
  ["5.", "Preservacion de la autoria intelectual", "17"],
  ["6.", "Evaluacion de impacto y benchmarking", "20"],
  ["7.", "Registro de artefactos y trazabilidad", "22"],
  ["8.", "Ejemplo aplicado: auditoria del cluster COEX-IA", "24"],
  ["9.", "Declaracion de roles", "26"],
  ["10.", "Conclusion", "27"],
];
tocEntries.forEach(([num, title, page]) => {
  children.push(new Paragraph({
    children: [
      new TextRun({ text: `${num} ${title}`, font: FONT, size: BODY_SIZE }),
      new TextRun({ text: `\t${page}`, font: FONT, size: BODY_SIZE }),
    ],
    tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: "dot" }],
    spacing: { after: 80, line: LINE_SPACING },
  }));
});

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 1 — Introduccion y proposito
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("1. Introduccion y proposito"));

children.push(bodyParagraph(
  "La integracion de modelos de inteligencia artificial generativa en los procesos de investigacion doctoral ha suscitado un debate amplio y necesario en las comunidades academicas. Las preocupaciones son legitimas y multidimensionales: la autoria intelectual puede diluirse cuando un modelo de lenguaje genera texto que el investigador presenta como propio; las fuentes bibliograficas pueden ser fabricadas o distorsionadas por las denominadas alucinaciones de los modelos; y la originalidad del argumento academico —el nucleo de cualquier contribucion doctoral— puede quedar comprometida si el proceso de pensamiento critico es delegado a un algoritmo en lugar de ser ejercido por el investigador."
));

children.push(bodyParagraph(
  "Frente a este panorama, las respuestas institucionales han oscilado entre dos polos: la prohibicion total del uso de herramientas de IA en la produccion academica, y la permisividad sin protocolos que deja al criterio individual la gestion de los riesgos. Ninguna de estas posiciones resulta satisfactoria. La prohibicion ignora que los modelos de lenguaje, utilizados de manera responsable, pueden amplificar significativamente la capacidad analitica del investigador —permitiendole procesar volumenes de literatura que serian inabordables manualmente, detectar patrones argumentativos en corpus amplios, y someter sus propios textos a evaluaciones criticas multidimensionales. La permisividad, por su parte, ignora los riesgos reales de integridad que estos sistemas introducen."
));

children.push(bodyParagraph(
  "El presente documento propone una tercera via: un protocolo de produccion doctoral que no prohibe la inteligencia artificial sino que la orquesta con verificaciones sistematicas en cada etapa del proceso investigativo. Este protocolo opera bajo un principio fundamental: la IA es un procesador, no un autor. El investigador toma cada decision sustantiva —formula la pregunta, aprueba la estructura, elige que rechazar, defiende su posicion— mientras que la IA ejecuta tareas de procesamiento a escala que amplifican la capacidad humana sin sustituirla."
));

children.push(bodyParagraph(
  "El sistema esta compuesto por dos componentes interconectados que trabajan en sinergia. El primero es CRISOL, una plataforma web desarrollada con JavaScript vanilla y Supabase como backend, desplegada en Vercel, que funciona como el centro de gestion de proyectos doctorales. CRISOL almacena los artefactos de investigacion, visualiza las trayectorias de calidad, gestiona las alertas en tiempo real y provee al investigador de una interfaz donde puede supervisar todo el proceso. El segundo componente es /dr, un conjunto de 12 skills especializados que operan dentro de Claude Code —el entorno de desarrollo con inteligencia artificial de Anthropic— y que ejecutan tareas especificas como lectura profunda, escritura calibrada, revision critica con multiples agentes, humanizacion de textos, verificacion de citas, evaluacion de impacto y benchmarking contra publicaciones de referencia."
));

children.push(bodyParagraph(
  "Ambos componentes se comunican a traves de Supabase mediante tres tablas especificas: dr_socratic_log (que registra las respuestas del investigador a las preguntas socraticas obligatorias), dr_alerts (que permite a Claude escribir alertas y bloqueos que CRISOL muestra en tiempo real), y dr_wizard_context (que comparte el estado del proyecto entre la web y el entorno de Claude Code). Esta arquitectura garantiza que cada interaccion, cada decision y cada verificacion queda registrada de manera persistente y auditable."
));

children.push(bodyParagraph(
  "Es esencial subrayar que en cada punto de decision del workflow, el investigador es el decisor. Claude no avanza automaticamente de una fase a otra; el investigador debe responder preguntas socraticas que demuestran comprension y agencia intelectual, debe aprobar explicitamente los esqueletos de escritura, debe decidir que sugerencias acepta y cuales rechaza, y debe justificar sus decisiones. Este diseno no es accidental sino deliberado: un protocolo que permitiera la automatizacion completa seria, en esencia, una forma sofisticada de plagio algoritmico."
));

children.push(bodyParagraph(
  "El proposito de este documento es describir el protocolo completo —sus componentes, sus fases, sus mecanismos de verificacion y sus garantias de integridad— para que el comite de metodologia de la investigacion de la facultad pueda evaluar su rigor, identificar posibles debilidades, y determinar si las salvaguardas implementadas son suficientes para asegurar que la produccion doctoral resultante cumple con los estandares academicos exigidos. El documento esta estructurado en diez secciones que cubren desde la arquitectura tecnica hasta un ejemplo aplicado de auditoria, pasando por los mecanismos de verificacion multinivel y la preservacion de la autoria intelectual."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 2 — Arquitectura del sistema
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("2. Arquitectura del sistema"));

children.push(heading2("2.1 CRISOL: plataforma web de gestion doctoral"));

children.push(bodyParagraph(
  "CRISOL es una aplicacion web monopagiria desarrollada con JavaScript vanilla —sin frameworks como React, Vue o Angular— que utiliza Supabase como servicio de backend (autenticacion, base de datos PostgreSQL, almacenamiento y funciones en tiempo real). La aplicacion esta desplegada en Vercel y es accesible desde cualquier dispositivo con navegador web. La decision de utilizar JavaScript vanilla responde a un criterio de simplicidad y mantenibilidad: al ser un proyecto desarrollado por un investigador individual, la ausencia de dependencias de frameworks reduce la superficie de complejidad y facilita la iteracion rapida."
));

children.push(bodyParagraph(
  "CRISOL gestiona proyectos doctorales organizados por fases. Cada proyecto tiene un estado que incluye la fase actual, los artefactos producidos, las alertas activas, los scores de calidad y las ramas argumentativas. La interfaz presenta un panel principal donde el investigador puede ver el progreso de cada proyecto, acceder a los artefactos, revisar las alertas y bloqueos, y visualizar la trayectoria de scores a lo largo del tiempo. Los datos se almacenan en Supabase con Row Level Security (RLS) activado, lo que garantiza que cada investigador solo accede a sus propios datos."
));

children.push(bodyParagraph(
  "La arquitectura de CRISOL sigue un patron modular con 19 modulos ES6 organizados en un barrel (utils.js) y un patron de estado de enlace tardio (late-bound state) que permite que los modulos se inicialicen sin dependencias circulares. Este diseno —denominado internamente YUNQUE v9.1 modularizado— ha sido verificado y estabilizado durante la Fase 0 del desarrollo."
));

children.push(heading2("2.2 Skills /dr: 12 comandos especializados en Claude Code"));

children.push(bodyParagraph(
  "El sistema /dr implementa 12 skills que operan dentro de Claude Code, cada uno disenado para una tarea especifica del workflow doctoral. Estos skills no son scripts independientes sino configuraciones de Claude Code que combinan prompts especializados, logica de verificacion y comunicacion con Supabase. Los 12 skills son los siguientes:"
));

// Table of 12 skills
children.push(new Table({
  rows: [
    new TableRow({
      children: [
        headerCell("Skill", 15),
        headerCell("Funcion principal", 45),
        headerCell("Fase(s)", 40),
      ],
    }),
    new TableRow({ children: [
      tableCell("/dr read"), tableCell("Lectura profunda con lente de tesis. Genera ficha de explotacion con citas exactas, conexiones al argumento y lagunas detectadas."), tableCell("Exploracion, Lectura profunda"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr write"), tableCell("Escritura calibrada. Genera esqueleto para aprobacion, luego borrador con estilo calibrado al investigador."), tableCell("Escritura"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr review"), tableCell("Revision critica con 4 agentes independientes. Evalua 6 componentes y 30 principios de escritura doctoral."), tableCell("Revision critica"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr humanize"), tableCell("Deteccion y correccion de 15 patrones de escritura tipicos de IA. Score 0-100."), tableCell("Humanizacion"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr verify"), tableCell("Verificacion de citas con taxonomia F1-F5. Zero tolerance: no avanza si hay defectos no resueltos."), tableCell("Verificacion de citas"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr mentor"), tableCell("Dialogo socratico para profundizar el argumento. El agente pregunta, el investigador responde."), tableCell("Profundizacion"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr devil"), tableCell("Abogado del diablo. Ataca el argumento desde multiples angulos para fortalecer las defensas."), tableCell("Profundizacion"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr report"), tableCell("Genera reporte de trazabilidad con 6 secciones: ficha tecnica, genealogia, trayectoria, integridad, decisiones, declaracion."), tableCell("Entrega"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr impact"), tableCell("Evaluacion de impacto con 4 agentes antagonicos en 6 dimensiones (ONUCGR)."), tableCell("Impacto"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr benchmark"), tableCell("Comparacion contra 3-4 publicaciones ancla seleccionadas por el investigador. 12 dimensiones."), tableCell("Benchmarking"),
    ]}),
    new TableRow({ children: [
      tableCell("/dr journal"), tableCell("Diario de investigacion. Registro reflexivo del proceso, decisiones y aprendizajes."), tableCell("Transversal"),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(emptyLine());

children.push(heading2("2.3 Conexion Claude - CRISOL via Supabase"));

children.push(bodyParagraph(
  "La comunicacion entre Claude Code y CRISOL se realiza a traves de tres tablas de Supabase que actuan como canal de datos bidireccional. Esta arquitectura desacoplada permite que ambos componentes operen de manera independiente pero sincronizada, sin necesidad de conexiones directas o APIs propietarias."
));

children.push(bodyParagraph([
  { text: "dr_socratic_log: ", bold: true },
  { text: "Esta tabla registra cada respuesta del investigador a las preguntas socraticas obligatorias (gates). Cada registro incluye el identificador del proyecto, la fase, el numero de gate, la pregunta formulada, la respuesta del investigador (con un minimo obligatorio de 20 caracteres), y la marca temporal. Esta tabla constituye la evidencia primaria de la agencia intelectual del investigador." },
]));

children.push(bodyParagraph([
  { text: "dr_alerts: ", bold: true },
  { text: "Permite a Claude escribir alertas que CRISOL muestra en tiempo real. Existen dos niveles: bloqueos (rojos, impiden avanzar de fase) y advertencias (amarillas, sugieren correccion pero no bloquean). Cada alerta incluye severidad, mensaje, skill de origen, fase, y estado (activa/resuelta). Las alertas se resuelven cuando el investigador toma accion correctiva verificable." },
]));

children.push(bodyParagraph([
  { text: "dr_wizard_context: ", bold: true },
  { text: "Comparte el estado completo del proyecto entre la web y Claude Code. Incluye la fase actual, los scores por componente, las ramas argumentativas activas, las decisiones del investigador en cada gate, y los metadatos del proyecto. Esta tabla permite que cuando el investigador trabaja en CRISOL desde un dispositivo movil y luego regresa a Claude Code en su computador, el contexto se mantiene integramente." },
]));

children.push(heading2("2.4 Modos de operacion por proyecto"));

children.push(bodyParagraph(
  "El sistema soporta tres modos de operacion que determinan cuales skills y verificaciones se activan. El modo /dr esta disenado para la tesis teorica y activa el workflow completo de 10 fases con todos los gates socraticos. El modo clo-author esta orientado a papers empiricos y activa un subconjunto de skills optimizado para la co-autoria de articulos con datos experimentales. El modo mixto permite combinar fases de ambos modos segun las necesidades del proyecto, y es especialmente util para investigadores que trabajan simultaneamente en su tesis y en publicaciones derivadas."
));

children.push(heading2("2.5 Diagrama textual de la arquitectura"));

children.push(new Paragraph({
  children: [new TextRun({ text: "┌─────────────────────┐         ┌─────────────────────┐", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│     CRISOL          │         │   Claude Code       │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  (Web App - Vercel) │         │   (12 Skills /dr)   │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│                     │         │                     │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  - Dashboard        │         │  - /dr read          │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  - Alertas          │         │  - /dr write         │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  - Artefactos       │         │  - /dr review (x4)   │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  - Trayectorias     │         │  - /dr verify        │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│  - Portafolio       │         │  - /dr impact (x4)   │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "│                     │         │  - ...8 mas          │", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "└──────────┬──────────┘         └──────────┬──────────┘", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "           │                               │           ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "           └───────────┐     ┌─────────────┘           ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "                       ▼     ▼                         ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              ┌─────────────────────┐                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              │      SUPABASE       │                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              │                     │                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              │  - dr_socratic_log  │                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              │  - dr_alerts        │                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              │  - dr_wizard_context│                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
}));
children.push(new Paragraph({
  children: [new TextRun({ text: "              └─────────────────────┘                   ", font: "Courier New", size: 20 })],
  alignment: AlignmentType.CENTER, spacing: { after: 200 },
}));

children.push(bodyParagraph(
  "Este diagrama ilustra la separacion de responsabilidades: CRISOL gestiona la interfaz, la visualizacion y la gestion de proyectos; los skills /dr ejecutan el procesamiento analitico y las evaluaciones; y Supabase actua como la capa de persistencia y comunicacion que conecta ambos componentes, manteniendo un registro auditable de cada interaccion."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 3 — Las 10 fases del workflow
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("3. Las 10 fases del workflow doctoral"));

children.push(bodyParagraph(
  "El workflow doctoral implementado en CRISOL + /dr consta de 10 fases secuenciales. Cada fase produce artefactos especificos, utiliza uno o mas skills del sistema, y esta protegida por gates de verificacion que el investigador debe superar antes de avanzar a la siguiente fase. A continuacion se describe cada fase en detalle."
));

// Phase 1
children.push(heading2("Fase 1: Exploracion"));
children.push(bodyParagraph(
  "La fase de exploracion constituye el punto de partida del workflow doctoral y tiene como objetivo fundamental que el investigador formule su pregunta de investigacion, verifique la existencia de un gap genuino en la literatura, y posicione un argumento inicial que servira como hipotesis de trabajo. En esta fase se utiliza principalmente el skill /dr read para realizar lecturas exploratorias de la literatura existente, identificando corrientes teoricas, debates abiertos y espacios no explorados. El artefacto principal que se produce es un documento de posicionamiento inicial que explicita la pregunta de investigacion, el gap identificado, y la tesis preliminar del investigador. El gate de verificacion de esta fase requiere que el investigador responda por escrito preguntas socraticas como: '¿Que vacio especifico en la literatura justifica tu investigacion?' y '¿Cual es tu argumento central en una sola oracion?' Estas preguntas obligan al investigador a articular su pensamiento de manera precisa antes de avanzar. El multiplicador de severidad en esta fase es de 0.5, reconociendo que los textos son preliminares y explorartorios."
));

// Phase 2
children.push(heading2("Fase 2: Lectura profunda"));
children.push(bodyParagraph(
  "La fase de lectura profunda lleva la exploracion inicial a un nivel de analisis sistematico. El investigador selecciona las fuentes clave identificadas en la fase anterior y las procesa una a una utilizando /dr read con lente de tesis —es decir, cada lectura esta orientada por la pregunta de investigacion y el argumento preliminar del investigador. Para cada fuente procesada, el skill genera una ficha de explotacion que incluye citas textuales exactas con numero de pagina, conexiones explicitas al argumento del investigador, tensiones o contradicciones con otras fuentes, y lagunas que la fuente revela. Los artefactos producidos son las fichas de explotacion individuales y un mapa de la literatura que visualiza las relaciones entre fuentes. El gate de verificacion pregunta al investigador: '¿Que fuentes contradice tu argumento y como respondes a esas contradicciones?' La respuesta debe demostrar que el investigador ha procesado criticamente las lecturas, no simplemente acumulado fichas. Este gate asegura que la lectura profunda no sea un ejercicio mecanico sino un dialogo critico con la literatura."
));

// Phase 3
children.push(heading2("Fase 3: Escritura"));
children.push(bodyParagraph(
  "La fase de escritura transforma el material recopilado y analizado en texto academico estructurado. El proceso se divide en dos etapas gestionadas por /dr write. Primero, el skill genera un esqueleto del texto —estructura de secciones, argumentos por seccion, fuentes asignadas, transiciones logicas— que el investigador debe aprobar explicitamente antes de que se genere cualquier prosa. Esta aprobacion del esqueleto es un gate critico porque garantiza que la estructura argumentativa es una decision del investigador, no del modelo. Una vez aprobado el esqueleto, /dr write genera un borrador con estilo calibrado al investigador —utilizando parametros de vocabulario, densidad argumentativa, longitud de oracion y uso de metaforas derivados de sus textos previos. El artefacto producido es un borrador que respeta la estructura aprobada y el estilo del investigador. El gate de verificacion pregunta: '¿Que secciones del esqueleto modificaste respecto a lo que propuso la IA y por que?' Esta pregunta fuerza al investigador a documentar su agencia sobre la estructura del texto."
));

// Phase 4
children.push(heading2("Fase 4: Revision critica"));
children.push(bodyParagraph(
  "La fase de revision critica somete el borrador a una evaluacion multidimensional mediante /dr review, que despliega 4 agentes independientes que trabajan en paralelo sin ver los resultados de los demas. El primer agente evalua el contenido academico (solidez del argumento, uso de evidencia, posicionamiento en la literatura). El segundo agente analiza la humanizacion del texto (deteccion de patrones de escritura IA). El tercero verifica la integridad de las citas y referencias. El cuarto evalua el cumplimiento de los 30 principios de escritura doctoral derivados de Corley y Gioia, Whetten, Davis, Bem, Thomson y Kamler, y Sword. Los artefactos producidos son cuatro informes de revision independientes y un informe consolidado con scores por componente y recomendaciones priorizadas por severidad. El gate de esta fase requiere que el investigador revise los cuatro informes y declare: '¿Cuales de las recomendaciones rechazas y cual es tu justificacion academica para rechazarlas?' Este diseno —inspirado en el modelo de revision por pares— asegura que la revision sea genuinamente critica y que el investigador ejerza juicio sobre las recomendaciones recibidas."
));

// Phase 5
children.push(heading2("Fase 5: Humanizacion"));
children.push(bodyParagraph(
  "La fase de humanizacion aborda una preocupacion central en la produccion academica asistida por IA: que el texto resultante sea detectablemente artificial. El skill /dr humanize analiza el texto en busca de 15 patrones especificos que caracterizan la escritura generada por modelos de lenguaje, incluyendo: uso excesivo de conectores formales ('no obstante', 'en este sentido'), estructuras paralelisticas repetitivas, ausencia de voz propia, metaforas genericas, coletillas inspiracionales al final de parrafos, transiciones formulaicas entre secciones, vocabulario excesivamente homogeneo, y otros. Para cada patron detectado, el skill propone una correccion que acerca el texto al estilo natural del investigador. El artefacto producido es un informe de humanizacion con un score de 0 a 100 y las correcciones sugeridas. El gate de verificacion no exige un score perfecto, sino que el investigador declare cuales correcciones acepta y cuales rechaza, reconociendo que algunas expresiones formales pueden ser genuinamente propias del estilo del investigador y no artefactos de IA."
));

// Phase 6
children.push(heading2("Fase 6: Verificacion de citas"));
children.push(bodyParagraph(
  "La fase de verificacion de citas implementa el mecanismo de integridad mas estricto del protocolo. El skill /dr verify examina cada cita y referencia del texto utilizando una taxonomia de defectos de cinco niveles: F1 (fabricada — la fuente no existe), F2 (distorsionada — la fuente existe pero dice algo diferente), F3 (descontextualizada — la cita es correcta pero se usa fuera de su contexto original), F4 (inexacta — errores menores en ano, pagina o autores), y F5 (inverificable — no se puede confirmar la existencia o contenido de la fuente con los medios disponibles). Este gate opera bajo una politica de zero tolerance: cualquier defecto no resuelto, de cualquier nivel, bloquea el avance a la siguiente fase. El investigador debe corregir cada defecto senalado — reemplazando fuentes fabricadas, corrigiendo distorsiones, recontextualizando citas, y eliminando referencias inverificables. El artefacto producido es un informe de verificacion que documenta cada cita revisada, su clasificacion y su estado de resolucion. Este mecanismo es la principal defensa contra las alucinaciones bibliograficas de los modelos de lenguaje."
));

// Phase 7
children.push(heading2("Fase 7: Profundizacion"));
children.push(bodyParagraph(
  "La fase de profundizacion utiliza dos skills complementarios para llevar el argumento del investigador a un nivel superior de sofisticacion intelectual. El skill /dr mentor implementa un dialogo socratico donde Claude actua como un mentor academico que formula preguntas profundas sobre el argumento, las suposiciones implicitas, las implicaciones no exploradas y las conexiones interdisciplinarias. El investigador responde por escrito a cada pregunta, y estas respuestas alimentan las preguntas subsiguientes, creando un dialogo genuino que profundiza progresivamente. El skill /dr devil complementa al mentor actuando como abogado del diablo: ataca el argumento desde multiples angulos —logico, empirico, metodologico, teorico— buscando debilidades que el investigador debe defender o reconocer. El artefacto producido es un registro del dialogo socratico y una lista de defensas articuladas por el investigador frente a los ataques del abogado del diablo. El gate de verificacion evalua la calidad de las respuestas del investigador, no la del cuestionamiento de la IA."
));

// Phase 8
children.push(heading2("Fase 8: Impacto"));
children.push(bodyParagraph(
  "La fase de impacto evalua la contribucion potencial del texto a traves de /dr impact, que despliega 4 agentes antagonicos —es decir, agentes disenados para evaluar con escepticismo, no con complacencia— que analizan el texto en 6 dimensiones: Originalidad (¿ofrece una perspectiva genuinamente nueva?), Novedad (¿introduce conceptos, marcos o relaciones no existentes en la literatura?), Utilidad (¿es aplicable a problemas reales de management?), Claridad (¿se comunica de manera accesible sin sacrificar rigor?), Generalidad (¿trasciende el caso especifico para ofrecer insights transferibles?), y Rigor (¿la evidencia y el razonamiento son solidos?). Estas dimensiones estan fundamentadas en los marcos de Corley y Gioia (2011), Whetten (1989), Davis (1971), Carton (2024) y Suddaby (2010). El artefacto producido es un informe de impacto con scores por dimension, vacios identificados en la contribucion, y recomendaciones para fortalecer el impacto. El gate de verificacion requiere que el investigador priorice los vacios identificados y declare cuales abordara y cuales considera fuera del alcance de su investigacion."
));

// Phase 9
children.push(heading2("Fase 9: Benchmarking"));
children.push(bodyParagraph(
  "La fase de benchmarking compara el texto del investigador contra publicaciones de referencia seleccionadas por el propio investigador. El skill /dr benchmark recibe 3 a 4 publicaciones ancla —articulos seminales o de alto impacto que el investigador considera relevantes como punto de comparacion— y evalua el texto en 12 dimensiones que incluyen claridad del argumento central, profundidad teorica, uso de evidencia, originalidad de la contribucion, calidad de la escritura, estructura logica, posicionamiento en la literatura, implicaciones practicas, limitaciones reconocidas, y coherencia interna. Es importante senalar que las publicaciones ancla son contextuales al articulo especifico, no fijas: diferentes textos del mismo investigador pueden benchmarkearse contra diferentes anclas segun su tematica. El artefacto producido es una matriz comparativa con scores por dimension para el texto del investigador y para cada publicacion ancla, junto con un analisis de brechas y una hoja de ruta para cerrar las distancias identificadas. El gate de verificacion requiere que el investigador analice la matriz y establezca prioridades de mejora."
));

// Phase 10
children.push(heading2("Fase 10: Entrega"));
children.push(bodyParagraph(
  "La fase de entrega es la culminacion del workflow y tiene dos propositos: producir la version final del texto y generar la documentacion completa de trazabilidad. El skill /dr report genera un reporte de trazabilidad con 6 secciones: ficha tecnica del proyecto (fechas, fases completadas, skills utilizados), genealogia del argumento (como evoluciono desde la exploracion hasta la version final), trayectoria de calidad (scores por componente a lo largo del tiempo), integridad de fuentes (resultado de la verificacion de citas), decisiones del investigador (registro de gates socraticos con las respuestas del investigador), y declaracion metodologica (descripcion del protocolo utilizado). Adicionalmente, se genera un portafolio descargable en formato Markdown que compila todos los artefactos producidos durante el proceso. El gate de verificacion final requiere que el investigador revise el reporte de trazabilidad completo y declare que refleja fielmente el proceso seguido. El multiplicador de severidad en esta fase es de 1.25, el mas alto del protocolo, reconociendo que los errores en la version final tienen consecuencias directas sobre la integridad del producto academico. Una vez superado este gate, el texto y su documentacion de trazabilidad estan listos para ser presentados al comite."
));

// Summary table
children.push(heading2("Resumen de las 10 fases"));
children.push(new Table({
  rows: [
    new TableRow({ children: [
      headerCell("#", 5), headerCell("Fase", 18), headerCell("Skill principal", 15), headerCell("Artefacto clave", 30), headerCell("Multiplicador", 12),
    ]}),
    new TableRow({ children: [
      tableCell("1"), tableCell("Exploracion"), tableCell("/dr read"), tableCell("Documento de posicionamiento"), tableCell("x0.50"),
    ]}),
    new TableRow({ children: [
      tableCell("2"), tableCell("Lectura profunda"), tableCell("/dr read"), tableCell("Fichas de explotacion"), tableCell("x0.50"),
    ]}),
    new TableRow({ children: [
      tableCell("3"), tableCell("Escritura"), tableCell("/dr write"), tableCell("Borrador calibrado"), tableCell("x0.75"),
    ]}),
    new TableRow({ children: [
      tableCell("4"), tableCell("Revision critica"), tableCell("/dr review"), tableCell("4 informes + consolidado"), tableCell("x1.00"),
    ]}),
    new TableRow({ children: [
      tableCell("5"), tableCell("Humanizacion"), tableCell("/dr humanize"), tableCell("Informe de patrones"), tableCell("x1.00"),
    ]}),
    new TableRow({ children: [
      tableCell("6"), tableCell("Verificacion"), tableCell("/dr verify"), tableCell("Informe F1-F5"), tableCell("x1.00"),
    ]}),
    new TableRow({ children: [
      tableCell("7"), tableCell("Profundizacion"), tableCell("/dr mentor + devil"), tableCell("Dialogo socratico"), tableCell("x1.00"),
    ]}),
    new TableRow({ children: [
      tableCell("8"), tableCell("Impacto"), tableCell("/dr impact"), tableCell("Evaluacion ONUCGR"), tableCell("x1.10"),
    ]}),
    new TableRow({ children: [
      tableCell("9"), tableCell("Benchmarking"), tableCell("/dr benchmark"), tableCell("Matriz comparativa"), tableCell("x1.10"),
    ]}),
    new TableRow({ children: [
      tableCell("10"), tableCell("Entrega"), tableCell("/dr report"), tableCell("Reporte + portafolio"), tableCell("x1.25"),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 4 — Sistema de verificacion multinivel
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("4. Sistema de verificacion multinivel"));

children.push(bodyParagraph(
  "El protocolo CRISOL + /dr implementa un sistema de verificacion multinivel disenado para garantizar la integridad del proceso investigativo en cada etapa. Este sistema no se limita a una revision final, sino que integra controles sistematicos a lo largo de todo el workflow. A continuacion se describen los siete mecanismos de verificacion que componen este sistema."
));

// 4.1
children.push(heading2("4.1 Gates socraticos obligatorios"));

children.push(bodyParagraph(
  "El mecanismo central de verificacion de la agencia intelectual del investigador son los gates socraticos obligatorios. El sistema implementa 19 preguntas distribuidas en 9 gates a lo largo del workflow. Cada gate debe ser respondido por escrito por el investigador, con un minimo obligatorio de 20 caracteres por respuesta —un umbral deliberadamente bajo para no forzar extensiones artificiales, pero suficiente para impedir respuestas vacias o monosilabicas. Las respuestas se registran en la tabla dr_socratic_log de Supabase con marca temporal, creando un registro auditable de la participacion intelectual del investigador."
));

children.push(bodyParagraph(
  "Los gates estan disenados para forzar tres tipos de pensamiento critico. Primero, preguntas de articulacion que requieren que el investigador explicite su posicion: '¿Cual es la contribucion unica de tu investigacion que ningun otro autor ha articulado?' Segundo, preguntas de reflexion sobre el proceso que obligan al investigador a documentar sus decisiones: '¿Que recomendaciones de la IA decidiste rechazar y por que razon academica las rechazaste?' Tercero, preguntas de defensa que simulan un escenario de tribunal doctoral: '¿Como responderias a un revisor que argumenta que tu marco teorico es eclectico en lugar de integrado?'"
));

children.push(bodyParagraph(
  "Las preguntas no son genericas sino sensibles a la fase. En la fase de exploracion, los gates preguntan sobre la identificacion del gap y la formulacion de la pregunta. En la fase de escritura, preguntan sobre decisiones estructurales y de estilo. En la fase de entrega, preguntan sobre la coherencia global del argumento y la preparacion para la defensa ante el comite. Esta sensibilidad al contexto asegura que los gates sean relevantes y no meros tramites burocraticos."
));

// 4.2
children.push(heading2("4.2 Separacion de agentes"));

children.push(bodyParagraph(
  "El sistema implementa un principio fundamental de separacion de roles entre los agentes de IA: los criticos nunca crean y los creadores nunca se autoevaluan. Este principio, inspirado en la arquitectura de clo-author (sistema de co-autoria academica), previene el sesgo de confirmacion algoritmico que ocurre cuando el mismo modelo que genera un texto es el que lo evalua."
));

children.push(bodyParagraph(
  "En la practica, esta separacion se manifiesta de manera mas evidente en /dr review, que despliega 4 agentes paralelos que operan de forma independiente y no ven los resultados de los demas hasta que todos han completado su evaluacion. El agente de contenido evalua la solidez academica del argumento sin preocuparse por el estilo. El agente humanizador analiza los patrones de escritura IA sin evaluar la calidad del argumento. El agente verificador revisa las citas sin juzgar como se usan argumentativamente. El agente de principios aplica los 30 criterios de escritura doctoral sin considerar los hallazgos de los otros tres agentes. Solo despues de que los cuatro han emitido sus evaluaciones independientes se genera un informe consolidado que integra los hallazgos, identifica coincidencias y discrepancias, y prioriza las recomendaciones."
));

children.push(bodyParagraph(
  "Esta separacion no es una sofisticacion tecnica innecesaria sino una salvaguarda critica. Si un unico agente evaluara todos los aspectos simultaneamente, tenderia a generar evaluaciones internamente consistentes pero potencialmente sesgadas: si decide que el argumento es fuerte, tendera a ser mas indulgente con las citas y el estilo. La independencia de agentes introduce tension genuina entre las evaluaciones, lo que produce retroalimentacion mas util y mas honesta para el investigador."
));

// 4.3
children.push(heading2("4.3 Zero-tolerance para citas"));

children.push(bodyParagraph(
  "La verificacion de citas opera bajo una politica de tolerancia cero que constituye el mecanismo de bloqueo mas estricto del protocolo. Esta politica reconoce que las alucinaciones bibliograficas —referencias fabricadas que los modelos de lenguaje generan con apariencia de legitimidad— representan el riesgo de integridad mas grave en la produccion academica asistida por IA. Un solo dato fabricado o una sola referencia inexistente que llegue al texto final puede desacreditar toda la investigacion."
));

children.push(bodyParagraph("El skill /dr verify implementa una taxonomia de cinco niveles de defectos bibliograficos:"));

children.push(new Table({
  rows: [
    new TableRow({ children: [
      headerCell("Codigo", 10), headerCell("Tipo", 20), headerCell("Descripcion", 40), headerCell("Severidad", 15),
    ]}),
    new TableRow({ children: [
      tableCell("F1"), tableCell("Fabricada"), tableCell("La fuente no existe. El modelo invento autores, titulo, revista o ano."), tableCell("Critica"),
    ]}),
    new TableRow({ children: [
      tableCell("F2"), tableCell("Distorsionada"), tableCell("La fuente existe pero dice algo sustancialmente diferente a lo citado."), tableCell("Critica"),
    ]}),
    new TableRow({ children: [
      tableCell("F3"), tableCell("Descontextualizada"), tableCell("La cita es textualmente correcta pero se usa fuera de su contexto original, alterando su significado."), tableCell("Alta"),
    ]}),
    new TableRow({ children: [
      tableCell("F4"), tableCell("Inexacta"), tableCell("Errores menores: ano incorrecto, numero de pagina erroneo, nombre de autor mal escrito."), tableCell("Media"),
    ]}),
    new TableRow({ children: [
      tableCell("F5"), tableCell("Inverificable"), tableCell("No se puede confirmar la existencia o contenido de la fuente con los medios disponibles."), tableCell("Alta"),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(emptyLine());

children.push(bodyParagraph(
  "Cualquier defecto no resuelto, de cualquier nivel de severidad, bloquea el avance del proyecto a la siguiente fase. No existen excepciones ni mecanismos para saltar este gate. El investigador debe corregir cada defecto: reemplazar fuentes F1 por fuentes reales, corregir las distorsiones F2 citando lo que la fuente realmente dice, recontextualizar las citas F3, corregir los errores F4, y eliminar o sustituir las referencias F5. Este mecanismo asegura que ninguna alucinacion bibliografica sobreviva al proceso de produccion."
));

// 4.4
children.push(heading2("4.4 Treinta principios de escritura doctoral"));

children.push(bodyParagraph(
  "El agente de principios de /dr review evalua el texto contra un conjunto de 30 principios de escritura doctoral derivados de seis fuentes metodologicas reconocidas: Corley y Gioia (2011) sobre contribucion teorica, Whetten (1989) sobre que constituye una contribucion, Davis (1971) sobre lo interesante en teoria social, Bem (1995) sobre escritura de articulos de revision, Thomson y Kamler (2013) sobre escritura doctoral como practica social, y Sword (2012) sobre escritura academica estilistica. Los 30 principios estan organizados en 6 categorias:"
));

children.push(new Table({
  rows: [
    new TableRow({ children: [
      headerCell("Categoria", 20), headerCell("Principios", 8), headerCell("Niveles de severidad", 40), headerCell("Ejemplos", 32),
    ]}),
    new TableRow({ children: [
      tableCell("Argumento"), tableCell("5"), tableCell("2 criticos, 2 altos, 1 medio"), tableCell("Tesis explicita, progresion logica, posicionamiento claro"),
    ]}),
    new TableRow({ children: [
      tableCell("Evidencia"), tableCell("5"), tableCell("1 critico, 3 altos, 1 medio"), tableCell("Citas con proposito, triangulacion, datos verificables"),
    ]}),
    new TableRow({ children: [
      tableCell("Estructura"), tableCell("5"), tableCell("1 critico, 2 altos, 2 medios"), tableCell("Coherencia seccional, transiciones, proporcion"),
    ]}),
    new TableRow({ children: [
      tableCell("Voz"), tableCell("5"), tableCell("1 critico, 2 altos, 2 medios"), tableCell("Autoridad, consistencia, matiz"),
    ]}),
    new TableRow({ children: [
      tableCell("Integridad"), tableCell("5"), tableCell("2 criticos, 2 altos, 1 medio"), tableCell("Precision referencial, atribucion, transparencia"),
    ]}),
    new TableRow({ children: [
      tableCell("Presentacion"), tableCell("5"), tableCell("0 criticos, 2 altos, 3 medios"), tableCell("Formato, legibilidad, concision"),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(emptyLine());

children.push(bodyParagraph(
  "En total, de los 30 principios, 7 tienen severidad critica (su incumplimiento bloquea el avance), 13 tienen severidad alta (generan advertencias prominentes), y 10 tienen severidad media (se reportan pero no bloquean). Esta gradacion permite que la revision sea exigente sin ser paralizante, concentrando la atencion del investigador en los problemas mas graves primero."
));

// 4.5
children.push(heading2("4.5 Phase-sensitive severity: multiplicadores por fase"));

children.push(bodyParagraph(
  "No todos los errores pesan igual en todas las fases del workflow. Un error de estilo en la fase de exploracion es una observacion para tener en cuenta; el mismo error en la fase de entrega es un defecto que debe corregirse. Para capturar esta realidad, el sistema implementa multiplicadores de severidad sensibles a la fase. El multiplicador va desde 0.5 en las fases de exploracion y lectura profunda (donde los textos son borradores de trabajo), pasando por 0.75 en la fase de escritura, 1.0 en las fases de revision, humanizacion, verificacion y profundizacion, 1.10 en las fases de impacto y benchmarking, hasta 1.25 en la fase de entrega. Esto significa que un error con severidad base de 8 puntos pesara 4 puntos en exploracion pero 10 puntos en entrega. Este mecanismo evita que las fases tempranas sean excesivamente punitivas —lo que desalentaria la exploracion creativa— mientras asegura que las fases finales sean rigurosas."
));

// 4.6
children.push(heading2("4.6 Cross-round learning y cross-skill sharing"));

children.push(bodyParagraph(
  "El sistema implementa dos mecanismos de aprendizaje cruzado que mejoran la calidad de las evaluaciones a lo largo del tiempo. El primero, cross-round learning, aplica un multiplicador de 1.5 a los errores recurrentes: si un error fue senalado en una revision anterior y reaparece sin haber sido corregido, su severidad aumenta en un 50 por ciento. Este mecanismo incentiva al investigador a abordar los problemas cuando se detectan por primera vez, en lugar de postergarlos. El segundo mecanismo, cross-skill sharing, permite que los hallazgos de un agente informen a otros agentes en evaluaciones subsecuentes. Por ejemplo, si el agente verificador detecta que una seccion tiene citas problematicas, esta informacion se comparte con el agente de contenido para que pueda evaluar si los argumentos basados en esas citas necesitan revision. Este flujo de informacion entre agentes replica la dinamica de un equipo de revision donde los revisores pueden leer los comentarios de sus pares."
));

// 4.7
children.push(heading2("4.7 Alertas y bloqueos en tiempo real"));

children.push(bodyParagraph(
  "El ultimo componente del sistema de verificacion es el mecanismo de alertas y bloqueos en tiempo real. Cuando Claude detecta un problema durante la ejecucion de cualquier skill, escribe una alerta en la tabla dr_alerts de Supabase. CRISOL, que monitorea esta tabla en tiempo real mediante suscripciones de Supabase, muestra la alerta inmediatamente en la interfaz del investigador. Las alertas se clasifican en dos niveles: bloqueos rojos, que impiden que el investigador avance a la siguiente fase hasta que el problema sea resuelto, y advertencias amarillas, que senalan problemas que deben abordarse pero no bloquean el avance. Cada alerta incluye el skill que la genero, la fase del proyecto, la severidad, un mensaje descriptivo y, cuando es posible, una sugerencia de correccion. Las alertas permanecen activas hasta que el investigador toma una accion correctiva que Claude puede verificar, momento en el cual se marcan como resueltas. Este mecanismo asegura que los problemas no se pierdan en la complejidad del proceso y que el investigador siempre tenga visibilidad sobre el estado de integridad de su proyecto."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 5 — Preservacion de la autoria intelectual
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("5. Preservacion de la autoria intelectual"));

children.push(bodyParagraph(
  "La preservacion de la autoria intelectual es, quizas, la preocupacion mas profunda que suscita el uso de inteligencia artificial en la investigacion doctoral. No se trata unicamente de evitar el plagio algoritmico —que un modelo genere texto que el investigador presenta como propio— sino de asegurar que el proceso de pensamiento critico, la formulacion de argumentos, y las decisiones intelectuales que constituyen el nucleo de una tesis doctoral sean genuinamente del investigador. Esta seccion describe los cuatro mecanismos que el protocolo CRISOL + /dr implementa para garantizar esta autoria."
));

// 5.1
children.push(heading2("5.1 El dialogo socratico como mecanismo de sinergia"));

children.push(bodyParagraph(
  "En cinco de las diez fases del workflow —exploracion, escritura, profundizacion, impacto y entrega— el investigador participa en dialogos socraticos con Claude. Estos dialogos no son cuestionarios estandar sino interacciones adaptativas donde las preguntas de Claude se derivan de las respuestas previas del investigador. En la fase de exploracion, el dialogo ayuda al investigador a articular su pregunta de investigacion y a descubrir supuestos implicitos que podrian debilitar su argumento. En la fase de escritura, el dialogo se centra en las decisiones estructurales y estilisticas. En la fase de profundizacion, el mentor socratico y el abogado del diablo llevan el argumento a territorios que el investigador quizas no habia considerado."
));

children.push(bodyParagraph(
  "Lo crucial de este mecanismo es la direccion del flujo de conocimiento: las respuestas del investigador alimentan las siguientes interacciones de Claude, no al reves. Es el investigador quien aporta la sustancia intelectual —su conocimiento del campo, su intuicion teorica, su posicion argumentativa— y Claude quien estructura, cuestiona y profundiza a partir de esa sustancia. En este sentido, el agente aprende del investigador para poder ayudarlo mejor, no el investigador quien depende del agente para pensar. Las respuestas socraticas quedan registradas en dr_socratic_log como evidencia auditable de esta dinamica."
));

// 5.2
children.push(heading2("5.2 Decisiones del investigador documentadas"));

children.push(bodyParagraph(
  "Cada gate socratico registra no solo la respuesta del investigador sino tambien las decisiones que tomo. El diseno del protocolo incluye preguntas especificamente formuladas para documentar la agencia del investigador: '¿Que decidiste rechazar de lo que la IA sugirio?' Esta pregunta, presente en diferentes variaciones en multiples gates, fuerza al investigador a ejercer y documentar su juicio critico. No basta con aceptar todas las sugerencias de la IA; el protocolo exige que el investigador demuestre que evaluo cada sugerencia y tomo decisiones informadas sobre cuales aceptar y cuales rechazar."
));

children.push(bodyParagraph(
  "Las decisiones documentadas cubren multiples niveles: decisiones sobre la estructura del argumento (que secciones incluir, en que orden, con que profundidad), decisiones sobre el uso de fuentes (que autores citar, como posicionar sus contribuciones, que criticas incorporar), decisiones sobre el estilo (que correcciones de humanizacion aceptar, que expresiones mantener a pesar de parecer 'artificiales'), y decisiones sobre el alcance (que limitaciones reconocer, que lineas de investigacion futura sugerir). Este registro cumple una doble funcion: permite al comite verificar la agencia intelectual del investigador, y permite al propio investigador reflexionar sobre su proceso de toma de decisiones, fortaleciendo su identidad como academico independiente."
));

// 5.3
children.push(heading2("5.3 Ramas argumentativas"));

children.push(bodyParagraph(
  "Durante el proceso de investigacion es comun que surjan replanteamientos fundamentales del argumento. Un hallazgo inesperado en la literatura, una critica devastadora del abogado del diablo, o una insight durante el dialogo socratico pueden llevar al investigador a reconsiderar su tesis central. En un workflow lineal sin control de versiones argumentativo, estos replanteamientos obligarian a destruir la trazabilidad reabriendo fases ya completadas. El protocolo CRISOL + /dr resuelve este problema mediante un mecanismo de ramas argumentativas."
));

children.push(bodyParagraph(
  "Cuando surge un replanteamiento significativo, en lugar de reabrir fases anteriores, el investigador bifurca el proyecto. La rama original preserva intacta toda su historia —gates socraticos, scores, artefactos, alertas— y la nueva rama hereda el contexto pero inicia su propio recorrido desde la fase donde ocurrio el replanteamiento. El investigador puede explorar la nueva linea argumentativa sin perder la evidencia del camino original. Si la nueva rama resulta ser un callejon sin salida, la rama original sigue disponible. Si la nueva rama produce un argumento superior, la rama original queda como evidencia de la exploracion intelectual genuina que condujo al replanteamiento."
));

children.push(bodyParagraph(
  "Las ramas descartadas no son desperdicios sino evidencia. Un comite que revisa el portafolio del investigador puede ver no solo el argumento final sino los argumentos que fueron explorados y abandonados, lo cual demuestra un proceso de investigacion autentico. Ningun investigador llega a su tesis final en linea recta; las ramas argumentativas documentan los giros, retrocesos y descubrimientos que caracterizan la investigacion genuina."
));

// 5.4
children.push(heading2("5.4 Calibracion de voz"));

children.push(bodyParagraph(
  "El skill /dr humanize no busca producir 'escritura perfecta' sino 'escritura creiblemente humana' —y, mas especificamente, escritura que sea creiblemente del investigador particular que la produce. Para lograr esto, el humanizador esta calibrado al estilo especifico del investigador, utilizando parametros derivados del analisis de sus textos previos: sus metaforas recurrentes, su estructura argumentativa preferida, su vocabulario caracteristico, su longitud tipica de oracion, su densidad de citas, y sus habitos de transicion entre secciones."
));

children.push(bodyParagraph(
  "Esta calibracion tiene una implicacion importante para la autoria: el texto resultante no converge hacia un 'estilo IA generico' sino que se aproxima al estilo natural del investigador. Cuando el humanizador sugiere reemplazar una expresion, lo hace proponiendo alternativas consistentes con el patron de escritura del investigador, no con un ideal abstracto de 'buena escritura academica'. El investigador, ademas, tiene la ultima palabra sobre cada correccion: puede aceptar la sugerencia, modificarla, o rechazarla si considera que la expresion original —aunque potencialmente detectada como 'artificial'— refleja genuinamente su forma de pensar y escribir. Este mecanismo respeta la voz del investigador como componente esencial de su autoria intelectual."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 6 — Evaluacion de impacto y benchmarking
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("6. Evaluacion de impacto y benchmarking"));

children.push(heading2("6.1 Evaluacion de impacto con /dr impact"));

children.push(bodyParagraph(
  "La evaluacion de impacto del sistema CRISOL + /dr esta disenada para responder una pregunta que los modelos de lenguaje tipicamente evaden: ¿realmente contribuye algo este texto al campo? Para abordar esta pregunta con rigor, /dr impact despliega 4 agentes antagonicos —agentes configurados para ser escepticos, no complacientes— que evaluan el texto en 6 dimensiones fundamentadas en la literatura sobre contribucion teorica en management."
));

children.push(bodyParagraph([
  { text: "Las 6 dimensiones ONUCGR son: ", bold: true },
  { text: "Originalidad (¿ofrece una perspectiva genuinamente nueva que no es un simple refrito de ideas existentes?), basada en Corley y Gioia (2011); Novedad (¿introduce conceptos, marcos o relaciones causales que no existian previamente en la literatura?), basada en Davis (1971); Utilidad (¿es aplicable a problemas reales que enfrentan los practitioners de management?), basada en Whetten (1989); Claridad (¿se comunica de manera accesible para su audiencia sin sacrificar el rigor analitico?), basada en Carton (2024); Generalidad (¿trasciende el caso especifico estudiado para ofrecer insights transferibles a otros contextos?), basada en Suddaby (2010); y Rigor (¿la evidencia, el razonamiento logico y la metodologia son solidos y verificables?), transversal a todas las fuentes." },
]));

children.push(bodyParagraph(
  "Cada agente evalua las 6 dimensiones de forma independiente, lo que produce 4 evaluaciones potencialmente divergentes. Las divergencias entre agentes son informativas, no problematicas: si un agente otorga alta originalidad pero otro la cuestiona, la discrepancia senala que la originalidad del argumento no es autoevidente y necesita ser comunicada de manera mas clara. El informe consolidado presenta los rangos de evaluacion por dimension, identifica los vacios mas criticos, y propone lineas de fortalecimiento priorizadas."
));

children.push(heading2("6.2 Benchmarking comparativo con /dr benchmark"));

children.push(bodyParagraph(
  "El benchmarking implementado por /dr benchmark complementa la evaluacion de impacto proporcionando un punto de referencia concreto: ¿como se compara este texto con publicaciones reconocidas del campo? El investigador selecciona 3 a 4 publicaciones ancla —articulos seminales o de alto impacto que considera relevantes como estandar de comparacion— y el skill evalua tanto el texto del investigador como las publicaciones ancla en 12 dimensiones que incluyen claridad del argumento central, profundidad teorica, uso de evidencia, originalidad de la contribucion, calidad de la escritura, estructura logica, posicionamiento en la literatura, implicaciones practicas, limitaciones reconocidas, coherencia interna, contribucion metodologica, y potencial de citacion."
));

children.push(bodyParagraph(
  "Es fundamental senalar que las publicaciones ancla son contextuales, no fijas. Un articulo sobre ambidextria organizacional puede benchmarkearse contra March (1991) y Tushman y OReilly (1996), mientras que un articulo sobre capacidades dinamicas se compara contra Teece, Pisano y Shuen (1997) y Eisenhardt y Martin (2000). El investigador elige las anclas basandose en su conocimiento del campo, lo que en si mismo es un ejercicio de posicionamiento intelectual."
));

children.push(bodyParagraph([
  { text: "Ejemplo aplicado: ", bold: true },
  { text: "El cluster COEX-IA —conjunto de 7 articulos doctorales sobre coexistencia organizacional con inteligencia artificial— fue benchmarkeado contra cuatro publicaciones ancla: March (1991) sobre exploracion y explotacion, Teece (1997) sobre capacidades dinamicas, Kahneman (2003) sobre racionalidad limitada y sesgos cognitivos, y Edmondson (1999) sobre seguridad psicologica. El score promedio del cluster fue de 3.20 sobre 4.00, comparado con March (3.50), Teece (3.35), Kahneman (3.42) y Edmondson (3.28). La distancia respecto a las anclas fue identificada como cerrable en las dimensiones de posicionamiento y profundidad teorica, lo que oriento las revisiones subsecuentes del cluster." },
]));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 7 — Registro de artefactos y trazabilidad
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("7. Registro de artefactos y trazabilidad"));

children.push(heading2("7.1 Sistema de tags transversales"));

children.push(bodyParagraph(
  "Cada artefacto producido durante el workflow doctoral se clasifica mediante un sistema de 11 tags transversales organizados en 3 categorias mas una categoria general. Este sistema de tags permite al investigador y al comite filtrar, buscar y analizar los artefactos por naturaleza, facilitando la revision del proceso investigativo."
));

children.push(new Table({
  rows: [
    new TableRow({ children: [
      headerCell("Categoria", 20), headerCell("Tags", 50), headerCell("Descripcion", 30),
    ]}),
    new TableRow({ children: [
      tableCell("Sustancia"), tableCell("argumento, sintesis, evidencia, diseno"), tableCell("Artefactos que contribuyen directamente al contenido academico"),
    ]}),
    new TableRow({ children: [
      tableCell("Proceso"), tableCell("reflexion, decision, critica"), tableCell("Artefactos que documentan el proceso de pensamiento y toma de decisiones"),
    ]}),
    new TableRow({ children: [
      tableCell("Integridad"), tableCell("verificacion, trazabilidad, calibracion"), tableCell("Artefactos relacionados con la garantia de calidad e integridad"),
    ]}),
    new TableRow({ children: [
      tableCell("General"), tableCell("otro"), tableCell("Artefactos que no encajan en las categorias anteriores"),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(emptyLine());

children.push(heading2("7.2 Metadatos de cada artefacto"));

children.push(bodyParagraph(
  "Cada artefacto almacenado en CRISOL incluye un conjunto estandar de metadatos que facilitan su rastreo y evaluacion. Estos metadatos incluyen: nombre descriptivo del artefacto, tag de clasificacion, score numerico (cuando aplica), delta respecto al score anterior (para visualizar la trayectoria de mejora), estado (borrador, en revision, aprobado, archivado), enlaces a los archivos en Google Drive, y notas del investigador. Los scores se visualizan como trayectorias temporales, por ejemplo: [72] -> [78 +6] -> [85 +7], lo que permite al investigador y al comite ver no solo el estado actual sino la evolucion del texto a lo largo del proceso."
));

children.push(heading2("7.3 Portafolio descargable"));

children.push(bodyParagraph(
  "Al completar un proyecto, CRISOL genera un portafolio descargable en formato Markdown que compila todos los artefactos producidos, organizados por fase y tag. Este portafolio esta disenado para ser presentado al comite de metodologia como evidencia del proceso investigativo. Incluye el texto final, los informes de revision, los dialogos socraticos, las decisiones documentadas, los resultados de verificacion de citas, las evaluaciones de impacto, la matriz de benchmarking, y cualquier otro artefacto relevante. El formato Markdown fue elegido por su portabilidad, legibilidad sin software especializado, y compatibilidad con herramientas de versionado."
));

children.push(heading2("7.4 Reporte de trazabilidad /dr report"));

children.push(bodyParagraph(
  "El skill /dr report genera un reporte de trazabilidad integral que sintetiza todo el proceso en un documento estructurado con 6 secciones:"
));

children.push(bodyParagraph([
  { text: "1. Ficha tecnica: ", bold: true },
  { text: "Identificacion del proyecto, fechas de inicio y finalizacion de cada fase, skills utilizados, numero de iteraciones por fase, y tiempo total del proceso." },
]));

children.push(bodyParagraph([
  { text: "2. Genealogia del argumento: ", bold: true },
  { text: "Como evoluciono el argumento central desde la formulacion inicial en la fase de exploracion hasta la version final en la fase de entrega, incluyendo los puntos de inflexion, los replanteamientos y las ramas argumentativas exploradas." },
]));

children.push(bodyParagraph([
  { text: "3. Trayectoria de calidad: ", bold: true },
  { text: "Scores por componente (contenido, humanizacion, citas, principios) a lo largo del tiempo, mostrando la curva de mejora del texto." },
]));

children.push(bodyParagraph([
  { text: "4. Integridad de fuentes: ", bold: true },
  { text: "Resultado completo de la verificacion de citas: numero total de citas verificadas, defectos detectados por tipo (F1-F5), defectos resueltos, y estado final." },
]));

children.push(bodyParagraph([
  { text: "5. Decisiones del investigador: ", bold: true },
  { text: "Compilacion de todas las respuestas a gates socraticos y decisiones documentadas, organizadas cronologicamente." },
]));

children.push(bodyParagraph([
  { text: "6. Declaracion metodologica: ", bold: true },
  { text: "Descripcion del protocolo utilizado, los componentes del sistema, las verificaciones implementadas, y las limitaciones reconocidas del proceso." },
]));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 8 — Ejemplo aplicado: auditoria del cluster COEX-IA
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("8. Ejemplo aplicado: auditoria del cluster COEX-IA"));

children.push(bodyParagraph(
  "Para ilustrar el funcionamiento del protocolo en un caso real, esta seccion describe la auditoria del cluster COEX-IA, un conjunto de 7 articulos doctorales sobre la coexistencia organizacional con inteligencia artificial. Este cluster fue sometido al protocolo completo de CRISOL + /dr, proporcionando evidencia empirica de la capacidad del sistema para detectar y corregir problemas de integridad."
));

children.push(heading2("8.1 Alcance de la auditoria"));

children.push(bodyParagraph(
  "Los 7 articulos del cluster fueron auditados utilizando 21 agentes independientes —3 agentes por articulo— configurados para evaluar contenido academico, integridad de citas, y cumplimiento de principios de escritura doctoral. Los agentes operaron de forma independiente, sin compartir hallazgos entre articulos, lo que aseguro que cada evaluacion fuera genuina y no influenciada por los resultados de los demas."
));

children.push(heading2("8.2 Correcciones aplicadas"));

children.push(bodyParagraph(
  "La auditoria produjo un total de 47 correcciones aplicadas a lo largo de los 7 articulos. Las correcciones mas significativas incluyeron:"
));

children.push(bodyParagraph([
  { text: "Dato fabricado (F1): ", bold: true },
  { text: "Se detecto que un dato atribuido a Wu con un efecto d=0.09 no era verificable en la fuente citada. El dato fue eliminado y reemplazado por evidencia verificable de otra fuente." },
]));

children.push(bodyParagraph([
  { text: "Referencias faltantes (F4/F5): ", bold: true },
  { text: "El articulo A3 presentaba 8 referencias con errores de ano, nombre de autor o titulo. Todas fueron corregidas contra las fuentes originales." },
]));

children.push(bodyParagraph([
  { text: "Coletillas inspiracionales: ", bold: true },
  { text: "Se detectaron multiples instancias de parrafos que terminaban con frases inspiracionales tipicas de la escritura de modelos de lenguaje ('en un mundo cada vez mas...', 'el futuro de las organizaciones depende de...', 'es imperativo que los lideres...'). Todas fueron eliminadas o reemplazadas por conclusiones analiticas sustantivas." },
]));

children.push(bodyParagraph([
  { text: "Estructura paralelistica: ", bold: true },
  { text: "Varios articulos presentaban secciones con estructura excesivamente simetrica (3 argumentos con exactamente la misma longitud y formato), lo cual es un patron de escritura IA. Las estructuras fueron diversificadas para reflejar la naturaleza asimetrica del analisis academico genuino." },
]));

children.push(heading2("8.3 Trayectoria de scores"));

children.push(bodyParagraph(
  "El score medio de los 7 articulos antes de las correcciones era de 79.2 sobre 100. Despues de aplicar las 47 correcciones, el score medio aumento a aproximadamente 87.3, representando una mejora de 8.1 puntos. Esta mejora no fue uniforme: los articulos con mas problemas de integridad de citas experimentaron mejoras mayores, mientras que los articulos con problemas principalmente de estilo mostraron mejoras mas modestas."
));

children.push(heading2("8.4 Principales flancos detectados"));

children.push(bodyParagraph(
  "El analisis transversal de los 7 articulos revelo patrones sistematicos de debilidad:"
));

children.push(new Table({
  rows: [
    new TableRow({ children: [
      headerCell("Flanco", 30), headerCell("Score medio", 15), headerCell("Descripcion del problema", 55),
    ]}),
    new TableRow({ children: [
      tableCell("Trazabilidad de fuentes (TF)"), tableCell("55/100"), tableCell("Las fuentes se citaban pero no se explicaba como cada cita contribuia al argumento. Citas ornamentales en lugar de funcionales."),
    ]}),
    new TableRow({ children: [
      tableCell("Posicionamiento en la literatura (PL)"), tableCell("76/100"), tableCell("Faltaba un posicionamiento explicito del investigador frente a los debates del campo. Las fuentes se presentaban pero no se evaluaban criticamente."),
    ]}),
    new TableRow({ children: [
      tableCell("Patrones anti-IA (AI)"), tableCell("81/100"), tableCell("A pesar de la humanizacion, persistian patrones detectables: conectores formulaicos, simetria excesiva, vocabulario homogeneo entre articulos."),
    ]}),
  ],
  width: { size: 100, type: WidthType.PERCENTAGE },
}));

children.push(emptyLine());

children.push(heading2("8.5 Reflexion sobre la auditoria"));

children.push(bodyParagraph(
  "La auditoria del cluster COEX-IA demostro que el sistema CRISOL + /dr es capaz de detectar problemas que el investigador, trabajando sin herramientas de verificacion sistematica, no habria detectado. El dato fabricado de Wu, por ejemplo, habia sido incluido de buena fe —el investigador creia que la fuente contenia ese dato— pero la verificacion automatizada revelo que no era asi. Las 8 referencias con errores en A3 habrian pasado desapercibidas en una revision manual, dado que los errores eran menores (anos incorrectos por un digito, iniciales invertidas). Y los patrones de escritura IA, por definicion, son dificiles de detectar para quien los produce, ya que parecen 'escritura normal' durante el proceso de redaccion. El sistema no reemplazo el juicio del investigador sino que lo amplifico, permitiendole producir un cluster de articulos con un nivel de integridad significativamente superior al que habria logrado sin las herramientas."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 9 — Declaracion de roles
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("9. Declaracion de roles"));

children.push(bodyParagraph(
  "Para que el comite pueda evaluar adecuadamente el protocolo, es necesario explicitar con precision que hace la inteligencia artificial, que hace el investigador, que no puede hacer la IA, y que no puede hacer el investigador sin asistencia. Esta declaracion no pretende ser una defensa del uso de IA sino una delimitacion honesta de las capacidades y limitaciones de cada actor en el proceso."
));

children.push(heading2("9.1 Rol de la inteligencia artificial"));

children.push(bodyParagraph(
  "La inteligencia artificial, implementada a traves de los 12 skills de /dr y la infraestructura de CRISOL, cumple los siguientes roles en el protocolo: procesamiento a escala de volumenes de literatura que exceden la capacidad humana de lectura sistematica; evaluacion multidimensional simultanea de textos contra 30 principios de escritura, 15 patrones de IA, y 5 niveles de defectos bibliograficos; deteccion de patrones recurrentes a lo largo de multiples textos y versiones; stress-testing adversarial del argumento del investigador mediante agentes configurados para ser escepticos; y verificacion de citas contra fuentes originales, con clasificacion de defectos y seguimiento de resoluciones."
));

children.push(heading2("9.2 Rol del investigador"));

children.push(bodyParagraph(
  "El investigador, como autor intelectual del trabajo doctoral, es responsable de: formulacion de la pregunta de investigacion y del argumento central; aprobacion explicita de los esqueletos de escritura antes de la generacion de borradores; toma de decisiones en cada gate socratico, con respuestas escritas que documentan su razonamiento; respuestas a las preguntas socraticas que demuestran comprension profunda del campo y del argumento propio; posicionamiento critico frente a la literatura, evaluando y no meramente citando las fuentes; seleccion de las publicaciones ancla para benchmarking, lo que requiere conocimiento del campo; reconstruccion del argumento despues de los ataques del abogado del diablo; y correccion manual de todas las citas con defectos detectados."
));

children.push(heading2("9.3 Lo que la IA no puede hacer"));

children.push(bodyParagraph(
  "Es igualmente importante explicitar lo que la inteligencia artificial no puede hacer en este protocolo, independientemente de su sofisticacion tecnica. La IA no puede formular la pregunta de investigacion —puede ayudar a refinarla, pero la pregunta emerge de la experiencia, la curiosidad y la intuicion del investigador. La IA no puede tomar posicion frente a la literatura —puede identificar tensiones y contradicciones, pero posicionarse es un acto intelectual que requiere juicio humano. La IA no puede decidir que rechazar —puede senalar opciones, pero la decision sobre que sugerencias aceptar y cuales descartar es una expresion de autoria intelectual. Y, fundamentalmente, la IA no puede defender el trabajo ante el comite —la defensa oral de una tesis es un acto de conocimiento encarnado que ningun modelo de lenguaje puede realizar en lugar del investigador."
));

children.push(heading2("9.4 Lo que el investigador no puede hacer solo"));

children.push(bodyParagraph(
  "Reciprocamente, existen tareas que un investigador individual, sin asistencia computacional, no puede realizar con la misma eficiencia o exhaustividad. Un investigador no puede procesar 50 fuentes de 8 campos disciplinarios diferentes de manera simultanea y sistematica, manteniendo la coherencia de las conexiones entre ellas. No puede verificar 232 citas contra sus fuentes originales en un dia de trabajo. No puede detectar consistentemente 15 patrones de escritura IA en cada parrafo de un texto de 30 paginas. No puede generar 4 evaluaciones independientes y genuinamente divergentes de su propio texto. Estas limitaciones no son deficiencias del investigador sino realidades de la cognicion humana —y es precisamente en estas areas donde la IA aporta valor sin comprometer la autoria intelectual."
));

children.push(new Paragraph({ children: [], pageBreakBefore: true }));

// ════════════════════════════════════════════════════════════════════════════
// SECCION 10 — Conclusion
// ════════════════════════════════════════════════════════════════════════════
children.push(heading1("10. Conclusion"));

children.push(bodyParagraph(
  "El protocolo de produccion doctoral hibridada descrito en este documento no es una defensa del uso de inteligencia artificial en la investigacion academica. Es, en cambio, un sistema de gestion de la hibridacion que asegura integridad verificable en cada etapa del proceso investigativo. La distincion es importante: defender el uso de IA implica una posicion ideologica; gestionar la hibridacion implica un compromiso metodologico con la transparencia y el rigor."
));

children.push(bodyParagraph(
  "Los 9 gates socraticos obligatorios, distribuidos a lo largo de las 10 fases del workflow, fuerzan al investigador a articular su pensamiento, documentar sus decisiones, y demostrar su comprension en cada punto critico del proceso. Las 19 preguntas socraticas no son tramites burocraticos sino instrumentos de reflexion que obligan al investigador a ejercer agencia intelectual de manera continua y documentada."
));

children.push(bodyParagraph(
  "La politica de tolerancia cero para citas, implementada a traves de la taxonomia F1-F5 y el gate de verificacion no saltable, constituye la principal defensa contra las alucinaciones bibliograficas. En la auditoria del cluster COEX-IA, este mecanismo detecto un dato fabricado y 8 referencias con errores que habrian pasado desapercibidos sin verificacion sistematica. Ningun texto producido bajo este protocolo puede contener una sola cita no verificada."
));

children.push(bodyParagraph(
  "Las ramas argumentativas documentan la exploracion intelectual genuina que caracteriza todo proceso de investigacion doctoral. Los replanteamientos, los callejones sin salida, y los giros argumentativos no se ocultan sino que se preservan como evidencia del pensamiento critico del investigador. Un portafolio que muestra unicamente el argumento final es menos creible que uno que muestra los caminos explorados para llegar a ese argumento."
));

children.push(bodyParagraph(
  "El reporte de trazabilidad generado por /dr report compila en un documento estructurado la ficha tecnica del proyecto, la genealogia del argumento, la trayectoria de calidad, la integridad de fuentes, las decisiones del investigador, y la declaracion metodologica. Este reporte permite al comite verificar cada paso del proceso sin necesidad de acceder al sistema CRISOL, proporcionando una auditoria autonoma y completa del proceso investigativo."
));

children.push(bodyParagraph(
  "El resultado de este protocolo no es un investigador que produce porque la IA escribe por el, ni un investigador que produce a pesar de las limitaciones de la IA. Es un investigador que produce mejor porque usa inteligencia artificial de manera responsable, orquestada y verificable. La IA amplifica sus capacidades de procesamiento, deteccion y evaluacion; el investigador aporta la pregunta, el argumento, la posicion, las decisiones, y la defensa. La hibridacion, gestionada con rigor, no compromete la autoria intelectual sino que la fortalece al someter cada componente del trabajo a niveles de escrutinio que serian inalcanzables sin asistencia computacional."
));

children.push(bodyParagraph(
  "Este documento queda a disposicion del comite de metodologia de la investigacion de la facultad para su evaluacion. El investigador se compromete a responder cualquier pregunta sobre el protocolo, a demostrar el funcionamiento del sistema, y a proporcionar acceso al portafolio completo de artefactos y al reporte de trazabilidad de cualquier proyecto producido bajo este protocolo."
));

// ── Build and save ─────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: BODY_SIZE },
        paragraph: { spacing: { line: LINE_SPACING } },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1440,
          bottom: 1440,
          left: 1800,
          right: 1440,
        },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({
            text: "Protocolo de Produccion Doctoral Hibridada — CRISOL + /dr",
            font: FONT, size: 18, italics: true, color: "888888",
          })],
          alignment: AlignmentType.RIGHT,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Alejandro Rudloff Munoz — Universidad de Talca — ", font: FONT, size: 18, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "888888" }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Document saved to: ${OUTPUT}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error("Error generating document:", err);
  process.exit(1);
});
