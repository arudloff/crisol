// CRISOL — Central state module
// All shared state lives here as a single mutable object

export const SUPABASE_URL = 'https://cupykpcsxjihnzwyflbm.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cHlrcGNzeGppaG56d3lmbGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTU1MjMsImV4cCI6MjA4OTE3MTUyM30.GFEW-prBl39zRGbqIhOfqKoWcVLICEIXXQvPkL9UaOU';

export const state = {
  // Auth
  sdb: null,
  currentUser: null,
  profile: null,
  syncEnabled: false,
  authMode: 'login', // 'login' or 'register'

  // Projects cache (loaded from Supabase)
  projects: [],

  // Navigation
  currentArticleKey: null,  // set after manifest loads
  currentPanel: 'dashboard',
  currentSubSec: 0,
  currentDocId: null,
  currentProjectId: null,
  isHome: true,
  isMiTesis: false,
  _isPrisma: false,
  _isAtlas: false,
  currentAtlasCorpus: null,   // selected corpus id
  currentAtlasPaper: null,    // selected paper id
  currentAtlasTab: 'corpus',  // corpus | glossary | map | genealogy | paper
  currentPrismaTab: 'jardin',

  // Article data (loaded per article)
  DATA: null,
  WORD_COUNTS: [],
  TOTAL_WORDS: 0,

  // UI state
  colCount: parseInt(localStorage.getItem('sila_cols')) || 2,
  fontSize: parseInt(localStorage.getItem('sila_fs')) || 15,
  hasUnsavedChanges: false,
  lastOpenPar: null,
  currentOpenPar: null,

  // Sub-panel indices
  currentPlSub: 0,
  currentGlSub: 0,

  // Search
  searchQuery: '',
  searchDebounce: null,
  globalSearchTimer: null,

  // Flashcard state
  fcEditMode: false,
  editingCardId: null,
  selectedText: '',

  // TTS state
  currentTTSId: null,
  ttsVoices: [],
  ttsQueue: [],
  ttsPaused: false,

  // Dictation state
  activeRecognition: null,
  activeRecBtn: null,

  // Drag state (doc editor)
  dragType: null,
  dragIdx: null,

  // Kanban drag state
  kbDragId: null,

  // Citation state
  citeInsertAfterIdx: -1,
  pendingCiteData: null,

  // Editor state
  docUndoStack: [],

  // Sources edit mode
  sourcesEditMode: false,

  // Navigation memory
  navMemory: (function(){ try { return JSON.parse(localStorage.getItem('sila_navMemory')) || {}; } catch(e) { return {}; } })(),

  // Sync timers
  syncTimer: null,
  settingsSyncTimer: null,
  projSyncTimer: null,
  projSyncPaused: false,
  kanbanSyncTimer: null,
  prismaSyncTimer: null,
  docSyncTimer: null,
  docSyncPaused: false,
};

// ============================================================
// Configuration constants (immutable)
// ============================================================

export const MAX_TABS = 4;

export const MAX_UNDO = 30;

export const DEFAULT_CARDS = [
  {id:'b1',type:'basic',front:'¿Qué es la complejidad según Bustamante y Opazo (2004)?',back:'Un proceso sistemático y recursivo por el cual los sistemas sociales, al reducir la complejidad del entorno, aumentan la propia.'},
  {id:'b2',type:'basic',front:'¿Cuándo se dice que un sistema es complejo?',back:'Cuando puede tomar al menos dos estados compatibles con su estructura. El entorno siempre es más complejo que el sistema.'},
  {id:'b3',type:'basic',front:'¿Qué son los "límites de sentido" según Luhmann?',back:'El mecanismo por el cual un sistema social define la porción del entorno que aprende y reduce, estableciendo las fronteras operativas.'},
  {id:'b4',type:'basic',front:'¿Qué es la autopoiesis aplicada a las empresas?',back:'Capacidad de un sistema de producirse y mantenerse a sí mismo. Las empresas son autopoiéticas: se autosostienen y autoorganizan.'},
  {id:'b5',type:'basic',front:'¿Qué es el acoplamiento estructural?',back:'Relación entre sistemas donde los cambios de uno generan perturbaciones en el otro sin determinar su respuesta. Autonomía mutua.'},
  {id:'b6',type:'basic',front:'¿Qué es la homeostasis organizacional?',back:'Capacidad de sustentarse a sí misma, aprendiendo y desarrollándose. Sin homeostasis, el sistema muere.'},
  {id:'b7',type:'basic',front:'¿Qué es la reducción de complejidad?',back:'Proceso INTERNO: definir límites de sentido para aprender del ambiente. Paradójicamente, reduce complejidad externa pero aumenta la interna.'},
  {id:'b8',type:'basic',front:'Diferencia: reducción de complejidad vs simplificación',back:'Reducción: proceso INTERNO vía límites de sentido. Simplificación: intento de cambiar el entorno (no funciona según Luhmann).'},
  {id:'b9',type:'basic',front:'Diferencia: planificación estratégica vs gerencial',back:'Estratégica (largo plazo): entorno fijo, define sentido. Gerencial (corto plazo): entorno volátil, sometida a los azotes del ambiente.'},
  {id:'b10',type:'basic',front:'Diferencia: autopoiesis vs heteropoiesis',back:'Autopoiesis: se autoproduce. Heteropoiesis: creación artificial. Personas creando empresas = "dato anecdótico".'},
  {id:'b11',type:'basic',front:'Parsons vs Luhmann/Habermas: ¿dónde están las personas?',back:'Parsons: en el AMBIENTE. Luhmann/Habermas: en el SISTEMA. Distinción crucial para fuentes de complejidad.'},
  {id:'b12',type:'basic',front:'Diferencia: complejidad vs incertidumbre',back:'Complejidad: sistémica, múltiples estados. Incertidumbre: dirigida a una decisión. Complejidad sin incertidumbre: sí. Al revés: no.'},
  {id:'b13',type:'basic',front:'¿Por qué el tiempo cataliza la complejidad?',back:'1) Capacidad limitada de abstracción temporal. 2) Variables volátiles en corto pero uniformes en largo plazo.'},
  {id:'b14',type:'basic',front:'¿Por qué las empresas son autopoiéticas?',back:'Surgen espontáneamente de la complejización social. Las personas son "partículas en el caos" cuya inventiva es anecdótica.'},
  {id:'b15',type:'basic',front:'¿Por qué "reducción de complejidad" es paradójico?',back:'Reducir complejidad del ENTORNO = AUMENTAR la propia. Esa complejidad se convierte en ambiental para otros sistemas.'},
  {id:'c1',type:'cloze',front:'La complejidad es un {{c1::proceso}} sistemático y {{c2::recursivo}} por el cual los sistemas, al {{c3::reducir}} la complejidad del entorno, {{c4::aumentan}} la propia.',back:'proceso, recursivo, reducir, aumentan'},
  {id:'c2',type:'cloze',front:'Un sistema es complejo cuando puede tomar al menos {{c1::dos estados}} compatibles con su {{c2::estructura}}.',back:'dos estados, estructura'},
  {id:'c3',type:'cloze',front:'Según Habermas, existen {{c1::dos}} fuentes de complejidad: la {{c2::externa}} (ambiente) y la {{c3::interna}} (propio sistema).',back:'dos, externa, interna'},
  {id:'c4',type:'cloze',front:'La reducción de complejidad se realiza mediante {{c1::límites de sentido}}, propuestos por {{c2::Luhmann}}.',back:'límites de sentido, Luhmann'},
  {id:'c5',type:'cloze',front:'Las empresas son de tipo {{c1::autopoiético}} ({{c2::Maturana y Varela}}). Lo contrario: {{c3::heteropoiéticas}}.',back:'autopoiético, Maturana y Varela, heteropoiéticas'},
  {id:'c6',type:'cloze',front:'Puede haber {{c1::complejidad}} sin incertidumbre, pero NO {{c2::incertidumbre}} sin complejidad.',back:'complejidad, incertidumbre'},
  {id:'c7',type:'cloze',front:'"La reducción de la complejidad es el {{c1::medio}} para la {{c2::construcción}} de complejidad." — Luhmann',back:'medio, construcción'},
];

export const DEFAULT_SOURCES = [
  {name:'Google Scholar',url:'https://scholar.google.com/',desc:'El buscador más amplio de literatura académica. Gratis, indexa casi todo.'},
  {name:'Scopus',url:'https://www.scopus.com/',desc:'Base de Elsevier. Métricas de impacto, h-index. Requiere acceso institucional.'},
  {name:'Web of Science',url:'https://www.webofscience.com/',desc:'Base de Clarivate. JCR impact factors. El estándar para ranking de journals.'},
  {name:'JSTOR',url:'https://www.jstor.org/',desc:'Archivo digital de journals, libros y fuentes primarias. Fuerte en ciencias sociales.'},
  {name:'SciELO',url:'https://scielo.org/',desc:'Scientific Electronic Library Online. Acceso abierto, fuerte en Latinoamérica.'},
  {name:'ResearchGate',url:'https://www.researchgate.net/',desc:'Red social académica. Pide papers directamente a los autores. Preprints.'},
  {name:'arXiv',url:'https://arxiv.org/',desc:'Preprints de acceso abierto. Fuerte en IA, computación, física, matemáticas.'},
  {name:'SSRN',url:'https://ssrn.com/',desc:'Social Science Research Network. Working papers en management y economía.'},
  {name:'Semantic Scholar',url:'https://www.semanticscholar.org/',desc:'Buscador con IA de Allen Institute. Resúmenes automáticos, grafos de citas.'},
  {name:'Connected Papers',url:'https://connectedpapers.com/',desc:'Visualiza grafos de papers relacionados. Ideal para descubrir literatura desde un paper semilla.'},
  {name:'The Lens',url:'https://www.lens.org/',desc:'Buscador abierto con datos de citas y patentes. Alternativa gratuita a Scopus.'},
  {name:'DOAJ',url:'https://doaj.org/',desc:'Directory of Open Access Journals. Todo acceso abierto y peer-reviewed.'}
];

export const DEFAULT_FASES = [
  {id:'ideacion',nombre:'Ideación',estado:'pendiente'},
  {id:'fundamentacion',nombre:'Fundamentación',estado:'pendiente'},
  {id:'diseno',nombre:'Diseño',estado:'pendiente'},
  {id:'escritura',nombre:'Escritura',estado:'pendiente'},
  {id:'revision',nombre:'Revisión interna',estado:'pendiente'},
  {id:'submission',nombre:'Submission',estado:'pendiente',journal:'',fechaEnvio:'',coverLetter:''},
  {id:'peer_review',nombre:'Peer Review',estado:'pendiente',decision:'',ronda:1,fechaDecision:''},
  {id:'respuesta',nombre:'Respuesta',estado:'pendiente'},
  {id:'publicacion',nombre:'Publicación',estado:'pendiente',doi:'',fechaPublicacion:''}
];

export const PHASE_GATES = {
  entrada:{
    trigger:['ideacion','fundamentacion','diseno'],
    title:'Gate de entrada: ¿Estás listo para producir?',
    description:'Antes de pasar a escribir, verifica que tienes las bases para trabajar como orquestador, no como delegador.',
    questions:[
      {id:'nivel',label:'¿En qué nivel de la taxonomía estás operando en este proyecto?',type:'select',options:['Usuario pasivo','Delegador','Firmante','Colaborador','Orquestador','Investigador potenciado']},
      {id:'preguntas',label:'¿Qué preguntas propias traes a esta fase? (no las de la IA)',type:'textarea',placeholder:'Mis preguntas de investigación, dudas, hipótesis...'},
      {id:'lecturas',label:'¿Dominas las lecturas que alimentan este trabajo?',type:'select',options:['No he leído suficiente','He leído pero no procesado','He procesado con /sila y puedo defender claims']}
    ]
  },
  autoria:{
    trigger:['escritura'],
    title:'Gate de autoría: ¿Es tuyo lo que escribiste?',
    description:'Verifica que dominas y puedes defender lo que escribiste. ¿Suena a ti o suena a todos?',
    questions:[
      {id:'sila_propio',label:'¿Procesaste tu borrador con /sila como si fuera un paper ajeno?',type:'select',options:['No','Parcialmente','Sí, completé todas las secciones']},
      {id:'contribucion',label:'¿Cuál es TU contribución original en este texto?',type:'textarea',placeholder:'El concepto que propongo, la conexión que descubrí, el argumento que construí...'},
      {id:'defensa',label:'¿Puedes defender cada afirmación principal sin buscar?',type:'select',options:['No estoy seguro','La mayoría sí','Todas, puedo debatirlas']},
      {id:'voz',label:'¿Este texto suena a ti o suena genérico/IA?',type:'select',options:['Suena genérico','Tiene partes mías y partes genéricas','Tiene mi voz claramente']}
    ]
  },
  publicacion:{
    trigger:['revision'],
    title:'Gate de publicación: ¿Está listo para el mundo?',
    description:'Última verificación antes de enviar. Fuentes, sesgo, citación genuina.',
    questions:[
      {id:'fuentes',label:'¿Verificaste todas las fuentes citadas (existen, dicen lo que afirmas)?',type:'select',options:['No todas','La mayoría','Todas verificadas']},
      {id:'sesgo',label:'¿Buscaste activamente evidencia CONTRA tu tesis?',type:'select',options:['No','Algo','Sí, incluí contraargumentos']},
      {id:'citacion',label:'¿Cada cita es genuina (la leíste, no solo el abstract)?',type:'select',options:['Algunas son de segunda mano','La mayoría son de primera mano','Todas leídas integralmente']},
      {id:'plagio',label:'¿Revisaste similitud/plagio?',type:'select',options:['No','Sí, con herramienta automática','Sí, revisión manual + automática']}
    ]
  }
};

export const LOGBOOK_TYPES = [
  {id:'lectura',label:'Lectura',icon:'📖'},
  {id:'escritura',label:'Escritura',icon:'✍'},
  {id:'revision',label:'Revisión',icon:'🔍'},
  {id:'busqueda',label:'Búsqueda',icon:'🔎'},
  {id:'otro',label:'Otro',icon:'📌'}
];

export const PROJ_ROLES = ['','teoria','metodo','evidencia','contexto','contra'];

export const PROJ_ESTADOS = [
  {id:'en_ejecucion',label:'En ejecución',icon:'🔵',color:'var(--blue)'},
  {id:'pausado',label:'Pausado',icon:'⏸',color:'var(--gold)'},
  {id:'finalizado',label:'Finalizado',icon:'✅',color:'var(--green)'},
  {id:'archivado',label:'Archivado',icon:'📦',color:'var(--tx3)'}
];

export const PROJ_ROLE_LABELS = {
  '':'Sin rol',
  'teoria':'Teoría',
  'metodo':'Método',
  'evidencia':'Evidencia',
  'contexto':'Contexto',
  'contra':'Contraargumento'
};

export const srcColors = ['var(--blue)','var(--gold)','var(--green)','var(--purple)','var(--red)','var(--amber)'];

// DOC_TEMPLATES: canonical source is editor.js (only consumer)
// Removed from state.js to eliminate duplication
const _UNUSED_DOC_TEMPLATES = {
  libre:{name:'Documento libre',blocks:[{type:'text',content:''}]},
  imrad:{name:'Artículo científico (IMRaD)',blocks:[
    {type:'heading',content:'Resumen / Abstract',open:true},{type:'text',content:''},
    {type:'heading',content:'1. Introducción'},{type:'note',content:'Contexto, problema, gap, pregunta, contribución'},{type:'text',content:''},
    {type:'heading',content:'2. Marco teórico'},{type:'text',content:''},
    {type:'heading',content:'3. Metodología'},{type:'note',content:'Diseño, muestra, instrumentos, análisis'},{type:'text',content:''},
    {type:'heading',content:'4. Resultados'},{type:'text',content:''},
    {type:'heading',content:'5. Discusión'},{type:'note',content:'Interpretación, implicaciones teóricas y prácticas'},{type:'text',content:''},
    {type:'heading',content:'6. Conclusiones'},{type:'note',content:'Resumen, limitaciones, investigación futura'},{type:'text',content:''}
  ]},
  marco:{name:'Capítulo: Marco teórico',blocks:[
    {type:'heading',content:'Introducción al capítulo',open:true},{type:'note',content:'Qué cubre este capítulo y por qué'},{type:'text',content:''},
    {type:'heading',content:'2.1 Pilar teórico 1'},{type:'note',content:'Constructos clave, autores seminales, debates'},{type:'text',content:''},
    {type:'heading',content:'2.2 Pilar teórico 2'},{type:'text',content:''},
    {type:'heading',content:'2.3 Intersección'},{type:'note',content:'Cómo se conectan los pilares, qué queda inexplorado'},{type:'text',content:''},
    {type:'heading',content:'2.4 Marco conceptual'},{type:'note',content:'TU síntesis original — modelo visual + proposiciones'},{type:'text',content:''},
    {type:'heading',content:'2.5 Síntesis del capítulo'},{type:'note',content:'Tabla resumen: constructo | definición | autores | rol en la tesis'},{type:'text',content:''}
  ]},
  metodo:{name:'Capítulo: Metodología',blocks:[
    {type:'heading',content:'Introducción',open:true},{type:'text',content:''},
    {type:'heading',content:'3.1 Filosofía de investigación'},{type:'note',content:'Ontología, epistemología, paradigma'},{type:'text',content:''},
    {type:'heading',content:'3.2 Diseño y enfoque'},{type:'text',content:''},
    {type:'heading',content:'3.3 Selección de casos / Muestra'},{type:'text',content:''},
    {type:'heading',content:'3.4 Recolección de datos'},{type:'text',content:''},
    {type:'heading',content:'3.5 Análisis de datos'},{type:'text',content:''},
    {type:'heading',content:'3.6 Validez, confiabilidad y ética'},{type:'text',content:''}
  ]},
  propuesta:{name:'Propuesta de conferencia',blocks:[
    {type:'heading',content:'Título',open:true},{type:'text',content:''},
    {type:'heading',content:'Resumen (300 palabras)'},{type:'text',content:''},
    {type:'heading',content:'Contribución'},{type:'text',content:''},
    {type:'heading',content:'Palabras clave'},{type:'text',content:''}
  ]},
  cover:{name:'📨 Cover letter (submission)',blocks:[
    {type:'heading',content:'Datos del envío',open:true},
    {type:'note',content:'Journal, editor, fecha de envío'},
    {type:'text',content:'**Journal:** \n**Editor:** \n**Fecha:** '},
    {type:'heading',content:'Cuerpo de la carta'},
    {type:'text',content:'Dear Editor,\n\nWe are pleased to submit our manuscript entitled "[TÍTULO]" for consideration in [JOURNAL].\n\n**Context and motivation:**\n[Describe the research problem and why it matters to the journal audience]\n\n**Key contribution:**\n[State the main theoretical/empirical contribution in 2-3 sentences]\n\n**Novelty:**\n[Explain what is new — what gap this fills that existing literature does not]\n\n**Fit with the journal:**\n[Explain why this manuscript belongs in THIS journal specifically]\n\n**Methodology:**\n[Brief description of method and data]\n\nThis manuscript has not been published elsewhere and is not under consideration by another journal. All authors have approved the manuscript and agree with its submission.\n\nWe look forward to your response.\n\nSincerely,\n[AUTHORS]'},
    {type:'heading',content:'Checklist pre-envío'},
    {type:'text',content:'- [ ] Formato según guidelines del journal\n- [ ] Word count dentro del límite\n- [ ] Abstract según estructura requerida\n- [ ] Referencias en formato correcto\n- [ ] Figuras/tablas en resolución requerida\n- [ ] Declaración de conflicto de interés\n- [ ] Co-autores revisaron y aprobaron\n- [ ] Verificación anti-plagio completada\n- [ ] Datos suplementarios preparados\n- [ ] Properties del archivo borradas (anonimato)'}
  ]},
  response:{name:'📝 Response to reviewers',blocks:[
    {type:'heading',content:'Carta al editor',open:true},
    {type:'text',content:'Dear Editor,\n\nThank you for the opportunity to revise our manuscript "[TÍTULO]" (Manuscript ID: [ID]).\n\nWe appreciate the constructive feedback from the reviewers. Below we provide a point-by-point response to each comment, describing the changes made in the revised manuscript.\n\nSignificant changes are highlighted in [yellow/tracked changes] in the revised manuscript.\n\nSincerely,\n[AUTHORS]'},
    {type:'heading',content:'Reviewer 1'},
    {type:'note',content:'Copiar cada comentario del reviewer y responder punto a punto. Indicar página/sección del cambio.'},
    {type:'text',content:'**Comment 1.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio, referencia a página/sección]\n\n---\n\n**Comment 1.2:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]'},
    {type:'heading',content:'Reviewer 2'},
    {type:'text',content:'**Comment 2.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]\n\n---\n\n**Comment 2.2:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n[Tu respuesta]\n\n**Changes made:**\n[Descripción del cambio]'},
    {type:'heading',content:'Reviewer 3 (si aplica)'},
    {type:'text',content:'**Comment 3.1:**\n> "[Copiar texto del reviewer]"\n\n**Response:**\n\n**Changes made:**\n'},
    {type:'heading',content:'Resumen de cambios'},
    {type:'text',content:'| Sección | Cambio realizado | Motivado por |\n|---|---|---|\n| Introducción | | Reviewer 1, Comment 1 |\n| Metodología | | Reviewer 2, Comment 3 |\n| Resultados | | Reviewer 1, Comment 4 |\n| Discusión | | Reviewer 2, Comment 1 |'}
  ]},
  revision_sistematica:{name:'🔬 Protocolo de revisión sistemática',blocks:[
    {type:'heading',content:'1. Pregunta de investigación',open:true},
    {type:'note',content:'Definir con formato PICO/PEO o similar. Toda la revisión depende de esta pregunta.'},
    {type:'text',content:'**Pregunta:** \n\n**Población/Contexto:** \n**Exposición/Intervención:** \n**Comparación:** \n**Outcome/Resultado:** '},
    {type:'heading',content:'2. Criterios de inclusión y exclusión'},
    {type:'text',content:'**Criterios de inclusión:**\n- Publicaciones entre [AÑO] y [AÑO]\n- Idiomas: inglés, español\n- Tipo: artículos en journals peer-reviewed\n- Temática: [describir]\n\n**Criterios de exclusión:**\n- Artículos de opinión, editoriales\n- Estudios no empíricos (si aplica)\n- [Otros criterios]'},
    {type:'heading',content:'3. Estrategia de búsqueda'},
    {type:'text',content:'**Bases de datos:**\n- Web of Science\n- Scopus\n- Google Scholar\n- [Otras]\n\n**String de búsqueda:**\n```\n("organizational learning" OR "organisational learning") AND ("artificial intelligence" OR "machine learning") AND ("complexity" OR "complex systems")\n```\n\n**Fecha de ejecución:** [FECHA]'},
    {type:'heading',content:'4. Proceso de selección (PRISMA)'},
    {type:'text',content:'**Identificación:**\n- Registros encontrados en bases de datos: ___\n- Registros adicionales (referencias, recomendaciones): ___\n\n**Screening:**\n- Registros después de eliminar duplicados: ___\n- Registros excluidos por título/abstract: ___\n\n**Elegibilidad:**\n- Artículos evaluados en texto completo: ___\n- Artículos excluidos con razón: ___\n\n**Incluidos:**\n- Artículos incluidos en la síntesis: ___'},
    {type:'heading',content:'5. Extracción de datos'},
    {type:'note',content:'Definir qué datos se extraen de cada artículo. Esto alimenta la matriz de análisis.'},
    {type:'text',content:'| Variable | Descripción |\n|---|---|\n| Autor(es) y año | |\n| Objetivo del estudio | |\n| Marco teórico | |\n| Metodología | |\n| Hallazgos principales | |\n| Limitaciones | |\n| Relevancia para mi investigación | |'},
    {type:'heading',content:'6. Síntesis y análisis'},
    {type:'note',content:'¿Análisis temático? ¿Meta-análisis? ¿Narrative synthesis? Describir el método de síntesis.'},
    {type:'text',content:'**Método de síntesis:** \n\n**Temas emergentes:**\n1. \n2. \n3. \n\n**Gaps identificados:**\n1. \n2. '}
  ]},
  plan:{name:'🎯 Plan de investigación',blocks:[
    {type:'heading',content:'Pregunta de investigación',open:true},{type:'note',content:'La pregunta central que guía tu tesis. Reescríbela cada vez que evolucione.'},{type:'text',content:''},
    {type:'heading',content:'Objetivos'},{type:'note',content:'Objetivo general (1) + específicos (3-5). Marca con ✓ los completados.'},{type:'text',content:'**Objetivo general:**\n\n**Objetivos específicos:**\n1. \n2. \n3. '},
    {type:'heading',content:'Hilos de investigación'},{type:'note',content:'Líneas temáticas que estás explorando. Vincula artículos de YUNQUE como citas.'},{type:'text',content:''},
    {type:'heading',content:'Gaps y preguntas abiertas'},{type:'note',content:'Lo que falta por investigar. Cada gap puede convertirse en búsqueda de artículos.'},{type:'text',content:''},
    {type:'heading',content:'Argumento central (tu posición)'},{type:'note',content:'¿Qué afirmas TÚ? Tu voz en la conversación académica. Vincula los claims que la sustentan.'},{type:'text',content:''},
    {type:'heading',content:'Cronograma e hitos'},{type:'text',content:'- [ ] Propuesta de tesis: \n- [ ] Comité 1: \n- [ ] Comité 2: \n- [ ] Defensa: \n\n**Próximas acciones:**\n- [ ] \n- [ ] '},
    {type:'heading',content:'Red de colaboración'},{type:'text',content:'**Tutor:**\n\n**Comité:**\n\n**Notas de reuniones:**\n'},
    {type:'heading',content:'Recursos y herramientas'},{type:'text',content:''},
    {type:'heading',content:'Subproductos'},{type:'note',content:'Papers, presentaciones, datasets. Vincula documentos de YUNQUE.'},{type:'text',content:''}
  ]}
};
