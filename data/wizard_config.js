// ============================================================
// YUNQUE — Configuración del Wizard y Checklist
// Editar este archivo para modificar tareas, explicaciones, herramientas y prompts.
// Después de editar, redesplegar: cd app && npx vercel --yes --prod
// ============================================================

var TAXONOMIA_NIVELES = [
  {nivel:1, nombre:'Usuario pasivo', descripcion:'Acepta outputs de IA sin cuestionamiento', deuda:'Máxima', color:'#C00000'},
  {nivel:2, nombre:'Delegador', descripcion:'Delega sin metaconocimiento para evaluar cuándo es apropiado', deuda:'Muy alta', color:'#E07050'},
  {nivel:3, nombre:'Firmante', descripcion:'Produce outputs de alta calidad pero no puede defenderlos sin IA', deuda:'Alta', color:'#C55A11'},
  {nivel:4, nombre:'Colaborador', descripcion:'Trabaja con IA de forma consciente y complementaria', deuda:'Moderada', color:'#E8A838'},
  {nivel:5, nombre:'Orquestador', descripcion:'Problematiza recursivamente, asimila, aporta voz propia, defiende todo', deuda:'Baja', color:'#5DBB8A'},
  {nivel:6, nombre:'Investigador potenciado', descripcion:'La IA delega al humano lo incierto; cada ciclo mejora al investigador', deuda:'Residual', color:'#2E75B6'}
];

var TAXONOMIA_INDICADORES = [
  {id:'cuestiona', texto:'¿Cuestionas los outputs de la IA?',
   opciones:['Nunca','Raramente','Solo si hay error obvio','Sí, verifico datos','Sí, busco vacíos y debilidades','Uso los outputs como hipótesis a refutar']},
  {id:'defiende', texto:'¿Puedes defender cada afirmación sin IA?',
   opciones:['No','No','Parcialmente','Mayoritariamente','Sí, puedo reconstruir el argumento','Sí, y puedo mejorarlo con mi experiencia']},
  {id:'aporta', texto:'¿Aportas conocimiento que la IA no tiene?',
   opciones:['No','No','Formato/estilo','Juicio parcial','Experiencia + juicio + conocimiento tácito','Mi experiencia DIRIGE la IA']},
  {id:'sinIA', texto:'¿Puedes producir sin IA?',
   opciones:['No','Con dificultad','Sí, pero peor calidad','Sí, similar calidad','Sí, pero elijo no hacerlo por eficiencia','Sí, y a veces lo hago para mantener capacidad']},
  {id:'declara', texto:'¿Declaras el proceso de hibridación?',
   opciones:['No','No','Vagamente','Sí, genéricamente','Sí, con detalle del aporte humano vs IA','Sí, como contribución metodológica']}
];

var DEFAULT_CHECKLIST=[
  {texto:'Abstract dentro del límite de palabras del journal',done:false,
   detalle:'Cada journal especifica un límite (generalmente 150-250 palabras). Verifica en "Instructions for Authors". Un abstract que excede el límite puede causar desk rejection automática.',
   herramientas:'Sitio del journal → Instructions for Authors',
   prompts:['Revisa este abstract y redúcelo a exactamente [N] palabras sin perder el mensaje central. Mantén: contexto, propósito, método, hallazgos, contribución. [PEGAR ABSTRACT]']},
  {texto:'Formato según guidelines del journal',done:false,
   detalle:'Márgenes, fuente (generalmente Times New Roman 12pt), espaciado (doble), numeración de páginas, estilo de títulos. Descarga las guidelines completas del sitio del journal y verifica punto por punto.',
   herramientas:'Sitio del journal → Instructions for Authors · Google Docs / Word',
   prompts:['Tengo este manuscrito y estas guidelines del journal [PEGAR GUIDELINES]. Identifica qué aspectos de formato necesito corregir.']},
  {texto:'Word count del manuscrito dentro del límite',done:false,
   detalle:'Los journals de Management típicamente aceptan 8,000-12,000 palabras incluyendo referencias. Algunos cuentan sin referencias. Verifica qué incluye el conteo en las guidelines.',
   herramientas:'YUNQUE → Editor (contador de palabras en footer) · Google Docs (Herramientas → Contar palabras)',
   prompts:['Mi manuscrito tiene [N] palabras y el límite del journal es [LÍMITE]. Sugiere qué secciones puedo condensar sin perder contenido esencial.']},
  {texto:'Referencias en formato correcto',done:false,
   detalle:'APA 7 es el más común en Management. Verifica: formato de citas en texto (Autor, Año), lista de referencias con sangría francesa, DOI incluido cuando existe. Usa Zotero para generar automáticamente.',
   herramientas:'<a href="https://www.zotero.org" target="_blank">Zotero</a> (plugin Google Docs para insertar citas) · <a href="https://apastyle.apa.org/style-grammar-guidelines/references" target="_blank">Guía APA 7</a>',
   prompts:['Verifica que estas referencias estén en formato APA 7 correcto. Corrige errores de formato, orden alfabético, y agrega DOI si falta: [PEGAR REFERENCIAS]']},
  {texto:'Figuras y tablas en resolución y formato requerido',done:false,
   detalle:'Generalmente 300 DPI mínimo para figuras. Tablas pueden ir en el texto o como archivos separados según el journal. Numera secuencialmente (Tabla 1, Figura 1). Cada una debe tener título descriptivo.',
   herramientas:'PowerPoint / Excel (figuras) · Google Docs / Word (tablas)',
   prompts:[]},
  {texto:'Declaración de conflicto de interés incluida',done:false,
   detalle:'La mayoría de journals requieren una declaración explícita, incluso si no hay conflictos: "The authors declare no conflict of interest." Algunos piden también declaración de financiamiento.',
   herramientas:'',
   prompts:[]},
  {texto:'Co-autores revisaron y aprobaron el manuscrito',done:false,
   detalle:'Todos los co-autores deben haber leído la versión final y dado su aprobación explícita antes del envío. Algunos journals requieren confirmación por email de cada co-autor.',
   herramientas:'Email · Google Docs (compartir con comentarios)',
   prompts:[]},
  {texto:'Cover letter preparada',done:false,
   detalle:'Carta al editor que "vende" tu paper: qué es, por qué es nuevo, por qué encaja en ESTE journal. No excedas 1 página. Estructura: motivación, contribución, novedad, fit con el journal.',
   herramientas:'YUNQUE → + Nuevo documento → Template "Cover letter"',
   prompts:['Genera un borrador de cover letter para [JOURNAL] basado en este abstract: [PEGAR ABSTRACT]. Destaca: (1) la contribución principal, (2) por qué es nuevo, (3) por qué encaja en este journal específico']},
  {texto:'Verificación anti-plagio completada',done:false,
   detalle:'Ejecuta tu manuscrito por Turnitin o iThenticate. Un porcentaje de similitud menor al 15% es generalmente aceptable (las citas textuales siempre generan similitud). Revisa los fragmentos marcados uno por uno.',
   herramientas:'<a href="https://www.turnitin.com" target="_blank">Turnitin</a> · <a href="https://www.ithenticate.com" target="_blank">iThenticate</a>',
   prompts:[]},
  {texto:'Properties del archivo borradas (anonimato)',done:false,
   detalle:'En Word: Archivo → Información → Comprobar si hay problemas → Inspeccionar documento → Quitar todo. En Google Docs: descargar como .docx y verificar propiedades. Tu nombre no debe aparecer en el manuscrito ni en las propiedades del archivo.',
   herramientas:'Microsoft Word (Inspector de documentos) · Google Docs',
   prompts:[]},
  {texto:'Datos suplementarios preparados (si aplica)',done:false,
   detalle:'Si tu paper incluye datos, código, instrumentos o materiales suplementarios, prepáralos según las guidelines. Algunos journals requieren que los datos estén en un repositorio público.',
   herramientas:'<a href="https://data.mendeley.com" target="_blank">Mendeley Data</a> · <a href="https://figshare.com" target="_blank">Figshare</a> · <a href="https://osf.io" target="_blank">OSF</a>',
   prompts:[]}
];

var DEFAULT_WIZARD_TASKS = {
  ideacion: [
    {texto:'Registrar tu pregunta de investigación',
     detalle:'Documenta tu pregunta actual en el log de evolución del proyecto. Cada vez que la pregunta cambie (y va a cambiar), regístrala de nuevo. El historial de cómo evolucionó tu pregunta es invaluable para la defensa de tesis.',
     herramientas:'YUNQUE → Proyecto → Evolución de la pregunta',
     prompts:[]},
    {texto:'Buscar si alguien ya investigó esto',
     detalle:'Usa Elicit para buscar por pregunta natural (no keywords). Revisa los primeros 20 resultados. Si tu pregunta exacta ya fue respondida, necesitas refinarla. Si nadie la ha abordado, verifica por qué — puede ser que no sea investigable o que el campo no la considere relevante.',
     herramientas:'<a href="https://elicit.com" target="_blank">Elicit</a> · <a href="https://scholar.google.com" target="_blank">Google Scholar</a>',
     prompts:['Busca investigaciones recientes (2020-2026) sobre [MI PREGUNTA]. Para cada resultado relevante, indica: qué encontraron, qué metodología usaron, y qué quedó sin responder']},
    {texto:'Verificar que el gap existe',
     detalle:'Un gap no es "nadie ha estudiado X". Un gap válido es: (1) una contradicción entre hallazgos existentes, (2) un contexto no explorado para una teoría conocida, (3) una pregunta derivada que la literatura identifica pero no aborda, o (4) una limitación metodológica que tu diseño supera.',
     herramientas:'<a href="https://www.semanticscholar.org" target="_blank">Semantic Scholar</a> · <a href="https://www.connectedpapers.com" target="_blank">Connected Papers</a>',
     prompts:['Analiza la literatura sobre [TEMA]. Identifica: (1) qué se sabe con certeza, (2) dónde hay contradicciones entre autores, (3) qué contextos no han sido explorados, (4) qué preguntas quedan abiertas explícitamente']},
    {texto:'Discutir viabilidad con tutor/asesor',
     detalle:'Presenta tu pregunta, el gap identificado, y una idea preliminar de metodología. Pregunta: ¿es viable en el tiempo del doctorado? ¿Tengo acceso a los datos? ¿El tema es publicable en los journals target?',
     herramientas:'Reunión presencial o Zoom',
     prompts:[]},
    {texto:'Vincular artículos exploratorios al proyecto',
     detalle:'Agrega a este proyecto los primeros artículos que exploraste. No necesitan estar procesados con /sila todavía — solo vincúlalos para tener trazabilidad de qué leíste en la fase exploratoria.',
     herramientas:'YUNQUE → Proyecto → Mis fuentes → + Agregar',
     prompts:[]}
  ],
  fundamentacion: [
    {texto:'Definir protocolo de búsqueda',
     detalle:'Documenta: bases de datos a consultar (Web of Science, Scopus, Google Scholar), string de búsqueda con operadores booleanos, criterios de inclusión/exclusión, rango de años. Esto es obligatorio si tu paper incluye una revisión sistemática.',
     herramientas:'YUNQUE → Nuevo documento → Template "Protocolo de revisión sistemática"',
     prompts:['Genera un string de búsqueda booleano para encontrar artículos sobre [TEMA] en el contexto de [CAMPO]. Incluye sinónimos y términos relacionados. Formato: (term1 OR term2) AND (term3 OR term4)']},
    {texto:'Ejecutar búsqueda en bases de datos',
     detalle:'Ejecuta el string en cada base de datos. Registra cuántos resultados obtuviste en cada una. Descarga los que pasen el filtro de título/abstract.',
     herramientas:'<a href="https://elicit.com" target="_blank">Elicit</a> · <a href="https://scholar.google.com" target="_blank">Google Scholar</a> · Web of Science · Scopus',
     prompts:['Busca 10 artículos sobre [TEMA] publicados entre 2020-2026 en journals de Management. Para cada uno: título, autores, año, hallazgo principal, y relevancia para mi pregunta: [PREGUNTA]']},
    {texto:'Guardar referencias en Zotero',
     detalle:'Agrega cada paper a una colección dedicada en Zotero. Adjunta el PDF. Verifica que los metadatos (título, autores, año, journal) estén correctos — errores aquí se propagan a tus citas.',
     herramientas:'<a href="https://www.zotero.org" target="_blank">Zotero</a> (extensión de navegador para captura rápida)',
     prompts:[]},
    {texto:'Procesar artículos con /sila',
     detalle:'Para cada artículo clave, ejecuta /sila en Claude Code. Esto genera: documento .docx anotado, datos para la app web, notas Obsidian, y flashcards Anki. Es el paso que transforma un PDF en material de trabajo.',
     herramientas:'Claude Code → /sila · YUNQUE (lectura)',
     prompts:[]},
    {texto:'Leer con evaluación posicional (claims S/C/N)',
     detalle:'Lee cada artículo en YUNQUE y evalúa párrafo por párrafo: ¿Apoya (S), Contrasta (C) o es Neutro (N) respecto a tu argumento? Esta evaluación es la materia prima de tu marco teórico. No la saltes.',
     herramientas:'YUNQUE → Texto anotado → Claims (S/C/N)',
     prompts:[]},
    {texto:'Escribir marco teórico',
     detalle:'Usa "Mi tesis" para ver todos tus claims organizados. Escribe en el editor de YUNQUE con citas vinculadas. El orden recomendado: (1) presenta la tradición teórica, (2) muestra qué dicen los autores clave, (3) identifica las tensiones/convergencias, (4) revela el gap, (5) presenta tu posición.',
     herramientas:'YUNQUE → Mi tesis · Editor con citas · Zotero (plugin Google Docs)',
     prompts:['Tengo estos claims de mis lecturas: [PEGAR CLAIMS]. Ayúdame a construir un párrafo argumentativo que conecte estos autores para la sección [SECCIÓN] de mi paper','Compara las posiciones de [AUTOR1] y [AUTOR2] sobre [CONCEPTO]. ¿En qué convergen? ¿En qué divergen? ¿Qué gap queda entre ambas posiciones?']}
  ],
  diseno: [
    {texto:'Definir enfoque metodológico',
     detalle:'Cualitativo (busca comprender significados, procesos, experiencias), cuantitativo (busca medir, correlacionar, generalizar), o mixto. La elección depende de tu pregunta: si preguntas "cómo" o "por qué", probablemente cualitativo. Si preguntas "cuánto" o "qué relación", cuantitativo.',
     herramientas:'YUNQUE → Texto anotado (papers metodológicos)',
     prompts:['Mi pregunta de investigación es [PREGUNTA]. ¿Qué enfoque metodológico es más apropiado: cualitativo, cuantitativo o mixto? Justifica considerando la naturaleza de la pregunta']},
    {texto:'Leer fuentes metodológicas',
     detalle:'Procesa con /sila los textos clave de metodología según tu enfoque. Para estudio de caso: Yin (2018), Eisenhardt (1989). Para grounded theory: Glaser & Strauss. Para encuestas: Creswell. Para mixto: Tashakkori & Teddlie.',
     herramientas:'Claude Code → /sila',
     prompts:[]},
    {texto:'Diseñar instrumentos de recolección',
     detalle:'Guión de entrevista semi-estructurada, cuestionario, protocolo de observación, o guía de análisis documental. El instrumento debe derivarse directamente de tu pregunta y marco teórico.',
     herramientas:'Google Docs · Google Forms',
     prompts:['Diseña un guión de entrevista semi-estructurada para explorar [TEMA] con [PARTICIPANTES]. Incluye: preguntas de apertura, profundización, y cierre']},
    {texto:'Escribir sección de metodología',
     detalle:'Estructura: filosofía de investigación, diseño, selección de casos/muestra, técnicas de recolección, técnicas de análisis, criterios de validez/confiabilidad, consideraciones éticas.',
     herramientas:'YUNQUE → Editor → Template "Capítulo Metodología"',
     prompts:[]},
    {texto:'Obtener aprobación ética (si aplica)',
     detalle:'Si tu investigación involucra seres humanos (entrevistas, encuestas, observación), necesitas aprobación del comité de ética de tu universidad. Prepara: consentimiento informado, descripción del estudio, análisis de riesgos.',
     herramientas:'Formulario institucional de tu universidad',
     prompts:[]}
  ],
  escritura: [
    {texto:'Crear documento con template IMRaD',
     detalle:'IMRaD = Introduction, Methods, Results, and Discussion. Es la estructura estándar de papers en Management. Crea un nuevo documento en YUNQUE con este template.',
     herramientas:'YUNQUE → + Nuevo documento → Artículo científico (IMRaD)',
     prompts:[]},
    {texto:'Escribir Métodos (empieza por aquí)',
     detalle:'Es la sección más concreta — describes lo que hiciste. Empieza por aquí porque no requiere interpretación, solo descripción precisa. Esto te da momentum para las secciones más difíciles.',
     herramientas:'YUNQUE → Editor',
     prompts:[]},
    {texto:'Escribir Resultados',
     detalle:'Presenta los hallazgos sin interpretarlos. Tablas, figuras, citas de entrevistados (si es cualitativo). Cada hallazgo debe responder a un objetivo específico o pregunta de investigación.',
     herramientas:'YUNQUE → Editor · Excel/R (tablas)',
     prompts:[]},
    {texto:'Escribir Discusión',
     detalle:'La sección más difícil. Conecta tus hallazgos con la teoría. Para cada resultado: ¿confirma o contradice la literatura? ¿Por qué? ¿Qué implicaciones teóricas tiene? ¿Y prácticas? Usa tus claims S/C/N como guía.',
     herramientas:'YUNQUE → Mi tesis (claims) · Editor',
     prompts:['Tengo estos claims de mis lecturas: [PEGAR CLAIMS]. Ayúdame a construir un párrafo argumentativo que conecte estos autores para la sección [SECCIÓN] de mi paper','Revisa este párrafo de mi Discusión. ¿La conexión entre mis hallazgos y la teoría es clara? ¿Falta algún matiz? [PEGAR PÁRRAFO]']},
    {texto:'Escribir Introducción (al final)',
     detalle:'Paradójicamente, se escribe al final porque necesitas saber qué resultó para poder "vender" bien la historia. Estructura: hook (por qué importa), contexto, gap, pregunta, contribución, estructura del paper.',
     herramientas:'YUNQUE → Editor',
     prompts:['Genera 3 opciones de párrafo de apertura para un paper sobre [TEMA] que capture la atención del lector y establezca la relevancia del problema']},
    {texto:'Escribir Abstract',
     detalle:'150-250 palabras según el journal. Estructura: contexto (1-2 oraciones), propósito, método, hallazgos principales, contribución. Es lo último que escribes pero lo primero que lee el editor.',
     herramientas:'YUNQUE → Editor',
     prompts:['Genera un abstract de 200 palabras para un paper con este título: [TÍTULO], estos métodos: [MÉTODOS], y estos hallazgos: [HALLAZGOS]']}
  ],
  revision: [
    {texto:'Circular borrador a tutor/co-autores',
     detalle:'Comparte el manuscrito vía Google Docs con comentarios habilitados. Pide feedback específico: ¿el argumento es claro? ¿la metodología es sólida? ¿la contribución está bien articulada?',
     herramientas:'Google Docs (compartir con comentarios)',
     prompts:[]},
    {texto:'Incorporar feedback',
     detalle:'Revisa cada comentario. No tienes que aceptar todo — pero sí considerar todo. Si rechazas un comentario, ten claro por qué.',
     herramientas:'Google Docs',
     prompts:[]},
    {texto:'Verificar anti-plagio',
     detalle:'Ejecuta tu manuscrito por Turnitin o iThenticate. Un porcentaje de similitud <15% es generalmente aceptable (las citas textuales siempre generan similitud). Revisa los fragmentos marcados.',
     herramientas:'<a href="https://www.turnitin.com" target="_blank">Turnitin</a> · iThenticate',
     prompts:[]},
    {texto:'Corrección de estilo (inglés)',
     detalle:'Si publicas en inglés, pasa el texto por Grammarly o LanguageTool. Luego pide a Claude que revise el academic English. Los errores de idioma causan desk rejection.',
     herramientas:'<a href="https://www.grammarly.com" target="_blank">Grammarly</a> · Claude',
     prompts:['Revisa este texto académico en inglés. Corrige errores gramaticales, mejora la claridad, y asegura que el tono sea apropiado para un journal de Management: [PEGAR TEXTO]']},
    {texto:'Completar checklist pre-submission',
     detalle:'Revisa cada item del checklist del proyecto. Formato, word count, referencias, figuras, conflicto de interés, anonimato, co-autores aprobaron.',
     herramientas:'YUNQUE → Proyecto → Checklist pre-submission',
     prompts:[]}
  ],
  submission: [
    {texto:'Investigar y seleccionar journal',
     detalle:'Usa Journal Finder para identificar 3-5 candidatos. Evalúa: scope (¿tu tema encaja?), impact factor, tiempo promedio de review (3-6 meses es normal), tasa de aceptación (<10% en top journals). Lee 3-5 artículos recientes del journal para calibrar tono y estilo.',
     herramientas:'<a href="https://journalfinder.elsevier.com" target="_blank">Elsevier Journal Finder</a> · <a href="https://jane.biosemantics.org" target="_blank">JANE</a>',
     prompts:['Mi paper trata sobre [TEMA] con enfoque [METODOLOGÍA]. Sugiere 5 journals de Management donde podría publicar, con: scope, impact factor, tiempo de review, y tasa de aceptación']},
    {texto:'Formatear según guidelines del journal',
     detalle:'Cada journal tiene sus propias instrucciones para autores: márgenes, fuente, estilo de citas (APA/Chicago/IEEE), límite de palabras, formato de figuras. Descarga las guidelines y sigue cada punto.',
     herramientas:'Sitio web del journal → "Instructions for Authors"',
     prompts:[]},
    {texto:'Escribir cover letter',
     detalle:'La cover letter "vende" tu paper al editor. Estructura: qué es, por qué es nuevo, por qué encaja en ESTE journal, que no está en revisión en otro lugar. Sé conciso (1 página).',
     herramientas:'YUNQUE → Nuevo documento → Template "Cover letter"',
     prompts:['Genera un borrador de cover letter para [JOURNAL] basado en este abstract: [PEGAR ABSTRACT]. Destaca la contribución teórica y el fit con el journal']},
    {texto:'Subir a ScholarOne / Editorial Manager',
     detalle:'La mayoría de journals usan ScholarOne o Editorial Manager. Prepara: manuscrito anonimizado (sin nombres en properties del archivo), cover letter, figuras por separado si lo piden, datos suplementarios.',
     herramientas:'Portal del journal',
     prompts:[]},
    {texto:'Registrar fecha de envío en el proyecto',
     detalle:'Registra el journal y la fecha en la fase de Submission del proyecto. Esto te permite trackear el tiempo de espera.',
     herramientas:'YUNQUE → Proyecto → Fases → Submission → editar',
     prompts:[]}
  ],
  peer_review: [
    {texto:'Esperar respuesta del journal',
     detalle:'El tiempo típico es 2-6 meses. Si pasan más de 4 meses sin respuesta, es aceptable escribir al editor preguntando por el estado. No envíes el paper a otro journal mientras está en revisión.',
     herramientas:'Email al editor si excede el plazo',
     prompts:[]},
    {texto:'Registrar decisión cuando llegue',
     detalle:'Las decisiones posibles: Accept (raro en primera ronda), Minor revisions (buen signo), Major revisions (oportunidad real), Reject (normal — tasa >80% en top journals). Registra la decisión en la fase del proyecto.',
     herramientas:'YUNQUE → Proyecto → Fases → Peer Review → editar',
     prompts:[]},
    {texto:'Si reject: analizar y seleccionar otro journal',
     detalle:'Un reject con reviews detallados es valioso. Usa los comentarios para mejorar el paper antes de enviarlo a otro journal. No lo reenvíes sin cambios — los reviewers a veces coinciden entre journals.',
     herramientas:'YUNQUE → Proyecto → cambiar journal en Submission',
     prompts:['Los reviewers rechazaron mi paper con estos comentarios: [PEGAR REVIEWS]. Analiza: ¿cuáles son válidos? ¿Cuáles puedo abordar? ¿Qué journal alternativo sería apropiado?']}
  ],
  respuesta: [
    {texto:'Leer todos los reviews sin reaccionar (esperar 48h)',
     detalle:'La primera reacción siempre es emocional. Espera 48 horas antes de empezar a responder. Lee los reviews como feedback constructivo, no como ataque personal.',
     herramientas:'—',
     prompts:[]},
    {texto:'Clasificar comentarios: sustantivo vs editorial',
     detalle:'Sustantivos: cuestionan tu argumento, metodología, o contribución (requieren cambios reales). Editoriales: formato, redacción, referencias faltantes (cambios mecánicos). Empieza por los editoriales para ganar momentum.',
     herramientas:'YUNQUE → Nuevo documento → Template "Response to reviewers"',
     prompts:['Clasifica estos comentarios de los reviewers en: (1) sustantivos vs editoriales, (2) fácil vs difícil de abordar. [PEGAR REVIEWS]']},
    {texto:'Responder cada comentario punto a punto',
     detalle:'Para cada comentario: (1) cita textual del reviewer, (2) tu respuesta, (3) descripción del cambio realizado con referencia a página/sección. Sé diplomático siempre: "We thank the reviewer for this insightful observation..."',
     herramientas:'YUNQUE → Editor · Claude (asistencia)',
     prompts:['El Reviewer dice: "[COMENTARIO]". Mi paper argumenta [MI POSICIÓN]. Ayúdame a redactar una respuesta diplomática que: agradezca, explique mi razonamiento, y describa los cambios realizados']},
    {texto:'Modificar manuscrito según cambios',
     detalle:'Haz los cambios prometidos en la response letter. Usa tracked changes o highlighting para que el editor pueda ver qué cambió. Verifica que cada cambio sea consistente con el resto del paper.',
     herramientas:'Google Docs (tracked changes) · YUNQUE Editor',
     prompts:[]},
    {texto:'Resubmit con response letter',
     detalle:'Sube: (1) response letter, (2) manuscrito revisado con cambios marcados, (3) manuscrito limpio. Actualiza la ronda en el proyecto.',
     herramientas:'Portal del journal · YUNQUE → Proyecto → Fases',
     prompts:[]}
  ],
  publicacion: [
    {texto:'Revisar proofs/galeras del journal',
     detalle:'El journal te enviará una versión formateada para que revises. Busca: errores de tipografía, figuras mal posicionadas, ecuaciones rotas. NO hagas cambios de contenido en esta etapa.',
     herramientas:'PDF del journal',
     prompts:[]},
    {texto:'Registrar DOI y fecha de publicación',
     detalle:'Una vez publicado, registra el DOI y la fecha en la fase del proyecto. Agrega el link al artículo publicado.',
     herramientas:'YUNQUE → Proyecto → Fases → Publicación → editar',
     prompts:[]},
    {texto:'Difundir en redes académicas',
     detalle:'Sube a ResearchGate y Academia.edu. Publica en LinkedIn con un resumen breve de tu contribución. Comparte en X/Twitter con los hashtags del campo.',
     herramientas:'ResearchGate · Academia.edu · LinkedIn · X',
     prompts:['Genera un post de LinkedIn de 150 palabras anunciando la publicación de mi paper "[TÍTULO]" en [JOURNAL]. Destaca la contribución principal y por qué importa para practitioners']},
    {texto:'Actualizar CV y ORCID',
     detalle:'Agrega la publicación a tu CV académico, ORCID, y Google Scholar profile.',
     herramientas:'<a href="https://orcid.org" target="_blank">ORCID</a> · Google Scholar',
     prompts:[]},
    {texto:'Celebrar',
     detalle:'Publicar es un logro significativo. Tómate un momento para reconocerlo.',
     herramientas:'',
     prompts:[]}
  ]
};

// ============================================================
// DR WIZARD — Flujo guiado de producción doctoral con /dr skills
// Cada fase corresponde a un comando /dr en Claude Code.
// El wizard guía paso a paso y verifica quality gates antes de avanzar.
// ============================================================

var DR_FASES = [
  {id:'dr_exploracion',nombre:'Exploración',estado:'pendiente',icon:'🔭'},
  {id:'dr_lectura',nombre:'Lectura profunda',estado:'pendiente',icon:'📖'},
  {id:'dr_escritura',nombre:'Escritura',estado:'pendiente',icon:'✍'},
  {id:'dr_critica',nombre:'Revisión crítica',estado:'pendiente',icon:'🔍'},
  {id:'dr_humanize',nombre:'Humanización',estado:'pendiente',icon:'🧬'},
  {id:'dr_verify',nombre:'Verificación de citas',estado:'pendiente',icon:'📎'},
  {id:'dr_depth',nombre:'Profundización',estado:'pendiente',icon:'🧠'},
  {id:'dr_impact',nombre:'Impacto',estado:'pendiente',icon:'💎'},
  {id:'dr_benchmark',nombre:'Benchmarking',estado:'pendiente',icon:'⚖'},
  {id:'dr_entrega',nombre:'Entrega',estado:'pendiente',icon:'🚀'}
];

var DR_WIZARD_TASKS = {
  dr_exploracion: [
    {texto:'Formular tu pregunta de investigación',
     detalle:'Antes de buscar, define qué quieres saber. La pregunta no tiene que ser perfecta — va a evolucionar. Pero necesitas un punto de partida claro. Escríbela como pregunta completa, no como tema. "¿Cómo X afecta Y en el contexto Z?" es mejor que "la relación entre X e Y".',
     herramientas:'CRISOL → Proyecto → Evolución de la pregunta',
     prompts:['Tengo interés en [TEMA]. Ayúdame a formular una pregunta de investigación doctoral precisa. Considera: qué fenómeno quiero entender, en qué contexto, con qué alcance, y por qué importa.']},
    {texto:'Verificar que el gap existe',
     detalle:'Un gap no es "nadie ha estudiado X". Un gap válido es: (1) contradicción entre hallazgos, (2) contexto no explorado, (3) pregunta derivada sin respuesta, o (4) limitación metodológica que tu diseño supera. Si tu pregunta ya fue respondida, refínala.',
     herramientas:'<a href="https://elicit.com" target="_blank">Elicit</a> · <a href="https://scholar.google.com" target="_blank">Google Scholar</a> · <a href="https://www.semanticscholar.org" target="_blank">Semantic Scholar</a> · <a href="https://www.connectedpapers.com" target="_blank">Connected Papers</a>',
     prompts:['Busca investigaciones recientes (2020-2026) sobre [MI PREGUNTA]. Para cada resultado relevante: qué encontraron, qué metodología usaron, y qué quedó sin responder. Necesito saber si mi pregunta tiene un gap real.']},
    {texto:'Definir estrategia de búsqueda',
     detalle:'Decide: qué bases de datos consultar, qué términos de búsqueda (en inglés y español), qué criterios de inclusión/exclusión, qué rango de años. Esto asegura que tu revisión sea sistemática y replicable, no una búsqueda al azar.',
     herramientas:'Google Scholar · Web of Science · Scopus · <a href="https://elicit.com" target="_blank">Elicit</a>',
     prompts:['Mi pregunta de investigación es: [PREGUNTA]. Genera: (1) string de búsqueda booleano para Google Scholar y Scopus, (2) criterios de inclusión/exclusión, (3) lista de journals relevantes en mi campo, (4) autores seminales que debo buscar.']},
    {texto:'Ejecutar búsqueda y seleccionar fuentes',
     detalle:'Ejecuta la búsqueda en las bases de datos. Filtra por título y abstract. Descarga los PDFs relevantes. No necesitas leerlos todos ahora — solo seleccionar los que merecen lectura profunda. Usa /dr read --scan para priorizar rápidamente.',
     herramientas:'Claude Code → /dr read --scan [carpeta]',
     prompts:['/dr read --scan [CARPETA DE PDFs DESCARGADOS]','Descargué estos [N] artículos sobre [TEMA]. Ayúdame a priorizarlos: ¿cuáles son centrales para mi pregunta [PREGUNTA], cuáles complementarios, y cuáles puedo descartar?'],
     skill:'dr_read'},
    {texto:'Posicionar tu argumento inicial',
     detalle:'Antes de leer en profundidad, declara tu posición tentativa: ¿qué crees que vas a encontrar? ¿cuál es tu hipótesis o intuición? Esto no es un compromiso — es un ancla que te permite leer con posición en vez de pasivamente. Podrás cambiarla después.',
     herramientas:'CRISOL → Editor · Tus notas',
     prompts:['Mi pregunta es [PREGUNTA]. Basado en lo que he leído hasta ahora, mi argumento tentativo es [ARGUMENTO]. Hazme preguntas que me ayuden a refinar esta posición antes de profundizar en las fuentes.'],
     skill:'dr_mentor'}
  ],
  dr_lectura: [
    {texto:'Seleccionar artículo/fuente a procesar',
     detalle:'Identifica el texto que vas a leer con lente de tesis. Puede ser un PDF nuevo, un artículo ya en CRISOL, o un borrador propio. El lector profundo analiza TODO desde la perspectiva de tu argumento — necesita tu pregunta y posición como contexto.',
     herramientas:'CRISOL → Artículos · Carpeta de PDFs en Google Drive',
     prompts:['Quiero procesar este artículo con /dr read. [PEGAR TEXTO O RUTA AL PDF]'],
     skill:'dr_read'},
    {texto:'Ejecutar /dr read con contexto de exploración',
     detalle:'El lector necesita saber TU pregunta y TU posición para leer con lente de tesis (no neutral). Si completaste la fase de Exploración, el prompt ya incluye ese contexto automáticamente. Si no, agrégalo manualmente.',
     herramientas:'Claude Code → /dr read [archivo]',
     prompts:['Contexto de mi investigación:\nPREGUNTA: [PEGAR PREGUNTA DE EXPLORACIÓN]\nPOSICIÓN TENTATIVA: [PEGAR ARGUMENTO DE EXPLORACIÓN]\n\n/dr read [RUTA O TEXTO DEL ARTÍCULO]','/dr read --gap [TEXTO] (buscar lo que tu tesis NO cubre)','/dr read --compare [TEXTO_A] [TEXTO_B] (comparar dos fuentes)','/dr read --scan [CARPETA] (escaneo rápido de múltiples PDFs)'],
     skill:'dr_read'},
    {texto:'Revisar ficha de explotación',
     detalle:'Lee la ficha que generó /dr read. Verifica: ¿la clasificación (A/B/C/D) es correcta? ¿las conexiones con la tesis son reales? ¿las citas textuales son las más relevantes? Ajusta lo que no encaje con tu criterio.',
     herramientas:'Output de Claude Code',
     prompts:[]},
    {texto:'Registrar decisiones de uso en CRISOL',
     detalle:'Para cada cita/hallazgo que vas a usar, registra en qué artículo, qué sección, y con qué función (fundamentar, contrastar, ejemplificar). Esto alimenta tu mapa de tesis.',
     herramientas:'CRISOL → Claims S/C/N · Editor',
     prompts:[]}
  ],
  dr_escritura: [
    {texto:'Definir qué vas a escribir',
     detalle:'Antes de pedirle a Claude que escriba, decide: ¿es una sección nueva? ¿un borrador completo? ¿extensión de algo existente? ¿reescritura con instrucción específica? El escritor necesita saber el encargo exacto.',
     herramientas:'Tu outline o notas previas',
     prompts:[]},
    {texto:'Revisar y aprobar esqueleto argumental',
     detalle:'El escritor primero genera un esqueleto: tesis de la sección, movimientos argumentales, fuentes involucradas. NO escribas prosa sin aprobar el esqueleto. Es tu oportunidad de corregir la dirección antes de invertir en texto.',
     herramientas:'Claude Code → /dr write',
     prompts:['/dr write section "[TÍTULO DE LA SECCIÓN]" --from [notas|ficha|outline]','/dr write draft "[TÍTULO DEL ARTÍCULO]" --outline','/dr write extend "[TEXTO EXISTENTE]" [profundizar|agregar evidencia|desarrollar implicación]','/dr write rewrite "[FRAGMENTO]" [instrucción específica]'],
     skill:'dr_write'},
    {texto:'Ejecutar /dr write con esqueleto aprobado',
     detalle:'Una vez aprobado el esqueleto, el escritor genera el borrador con tu estilo calibrado: metáforas propias, cascadas biológico→cognitivo→organizacional, citas bilingües, oraciones con subordinadas. Revisa que suene a TI.',
     herramientas:'Claude Code → /dr write',
     prompts:[]},
    {texto:'Verificar autoría intelectual',
     detalle:'Lee el borrador preguntándote: ¿puedo defender cada afirmación? ¿reconozco mi voz? ¿las decisiones argumentales son mías o de la IA? Si algo no es tuyo, reescríbelo o elimínalo.',
     herramientas:'Tu criterio como investigador',
     prompts:[]}
  ],
  dr_critica: [
    {texto:'Ejecutar /dr review sobre el borrador',
     detalle:'El crítico evalúa QUÉ DICES — contenido, argumento, fuentes, método. Usa códigos CT (coherencia), PL (literatura), RM (rigor), IA (autoetnografía), TF (trazabilidad). El componente anti-IA (15%) es una evaluación rápida aquí — el análisis profundo de CÓMO LO DICES lo hace el humanizer en la siguiente fase. Son complementarios: review = contenido, humanize = estilo.',
     herramientas:'Claude Code → /dr review [archivo]',
     prompts:['/dr review [RUTA O TEXTO DEL BORRADOR]'],
     skill:'dr_review'},
    {texto:'Analizar tabla de scores',
     detalle:'Revisa la tabla de 6 componentes. ¿Dónde están las deducciones más fuertes? ¿Cuáles son las 3 mejoras de mayor impacto? ¿El score compuesto pasa el gate que necesitas (borrador ≥70, capítulo ≥80, entrega ≥90)?',
     herramientas:'Output de Claude Code',
     prompts:[]},
    {texto:'Corregir debilidades identificadas',
     detalle:'Usa los códigos de deducción (CT01-CT06, PL01-PL05, etc.) como guía para corregir. No necesitas arreglar todo de una vez — prioriza las 3 de mayor impacto. Puedes usar /dr write rewrite para las correcciones.',
     herramientas:'CRISOL → Editor · Claude Code → /dr write rewrite',
     prompts:['/dr write rewrite "[FRAGMENTO CON DEBILIDAD]" "corregir [CÓDIGO]: [instrucción]"']},
    {texto:'Re-ejecutar /dr review para verificar mejora',
     detalle:'Después de corregir, vuelve a pasar /dr review. El score debería subir. Si no sube, revisa si las correcciones realmente abordan la debilidad señalada.',
     herramientas:'Claude Code → /dr review',
     prompts:[]}
  ],
  dr_humanize: [
    {texto:'Ejecutar /dr humanize sobre el texto',
     detalle:'El humanizer evalúa CÓMO LO DICES — estilo, patrones de escritura IA, voz del investigador. Complementa al crítico (que evaluó QUÉ DICES). Busca 15 patrones en 3 niveles: CRÍTICO (delata IA: listitis C01, coletillas C02, hedging C03), ALTO (sospechoso: paralelismo A01, vocabulario hiperpulido A02), MEDIO (estilístico: oraciones uniformes M01, verbos débiles M03). Score anti-IA de 0-100.',
     herramientas:'Claude Code → /dr humanize [archivo]',
     prompts:['/dr humanize [RUTA O TEXTO]'],
     skill:'dr_humanize'},
    {texto:'Revisar detecciones y aplicar correcciones',
     detalle:'Para cada patrón detectado, el humanizer muestra: fragmento original, código del patrón, propuesta de reescritura, y severidad. Aplica las correcciones que consideres válidas. No todo lo que marca es error — tu estilo puede justificar algunos patrones.',
     herramientas:'Output de Claude Code · CRISOL → Editor',
     prompts:[]},
    {texto:'Verificar que el score anti-IA ≥ 85',
     detalle:'El objetivo para entrega es ≥85. Si está debajo, revisa los patrones CRÍTICOS primero (restan 8 puntos cada uno). Un solo párrafo con listitis + coletilla puede bajarte 16 puntos.',
     herramientas:'Output de Claude Code',
     prompts:['/dr humanize [TEXTO CORREGIDO] (verificar mejora)']}
  ],
  dr_verify: [
    {texto:'Ejecutar /dr verify sobre el texto',
     detalle:'El verificador revisa TODAS las citas contra los PDFs originales. Clasifica errores en 5 tipos: F1 Fabricada (-20), F2 Distorsionada (-10), F3 Descontextualizada (-6), F4 Inexacta (-3), F5 Inverificable (-5). Si ya existen tablas de verificación previas (AX_tabla_verificacion_citas.md), las lee y no re-verifica lo ya confirmado.',
     herramientas:'Claude Code → /dr verify [archivo]',
     prompts:['/dr verify [RUTA O TEXTO]'],
     skill:'dr_verify'},
    {texto:'Resolver citas problemáticas',
     detalle:'Para cada error detectado: F1 (fabricada) → eliminar o reemplazar con fuente real. F2 (distorsionada) → corregir claim. F3 (descontextualizada) → agregar contexto. F4 (inexacta) → ajustar terminología. F5 (inverificable) → buscar PDF o marcar como limitaci��n.',
     herramientas:'PDFs en carpetas de fuentes · Google Scholar · DOI.org',
     prompts:[]},
    {texto:'Verificar zero citas fabricadas',
     detalle:'Para gate de ENTREGA, necesitas CERO citas fabricadas (F1). Cada F1 es -20 puntos y flag automático. Revisa especialmente datos numéricos y porcentajes — son los más propensos a fabricación.',
     herramientas:'Output de Claude Code',
     prompts:['/dr verify [TEXTO CORREGIDO] (re-verificar)']}
  ],
  dr_depth: [
    {texto:'Ejecutar /dr mentor para profundizar',
     detalle:'El mentor socrático no da respuestas — hace preguntas que obligan a pensar más profundo. Te ayuda a explicitar lo implícito, examinar supuestos, y encontrar la pregunta que más importa ahora. Anti-sycophancy: nunca halaga sin sustancia.',
     herramientas:'Claude Code → /dr mentor [idea o texto]',
     prompts:['/dr mentor [TU ARGUMENTO O IDEA]','/dr mentor --defend "[AFIRMACIÓN QUE QUIERES DEFENDER]"','/dr mentor --clarify "[CONCEPTO QUE NECESITAS PRECISAR]"','/dr mentor --connect "[IDEA A]" "[IDEA B]"'],
     skill:'dr_mentor'},
    {texto:'Responder las preguntas clave del mentor',
     detalle:'El mentor identifica LA pregunta que más importa ahora. Respóndela por escrito ��� no en tu cabeza. Escribir la respuesta es lo que produce claridad. Si no puedes responderla, eso es información valiosa.',
     herramientas:'CRISOL → Editor · Tus notas',
     prompts:[]},
    {texto:'Ejecutar /dr devil para stress-test',
     detalle:'El abogado del diablo ataca sistemáticamente tu argumento para fortalecerlo. Primero presenta la versión más fuerte de tu argumento (steelman) y luego la destruye. Produce 5-7 ataques de mayor a menor peligro. Lo que sobrevive al diablo sobrevive a un reviewer.',
     herramientas:'Claude Code → /dr devil [texto]',
     prompts:['/dr devil [TU ARGUMENTO O TEXTO]','/dr devil --reviewer "[TEXTO]" CMR (simular Reviewer 2 de California Management Review)','/dr devil --defense "[TEXTO]" (preguntas de comité de tesis)','/dr devil --steelman "[CONTRAARGUMENTO DÉBIL]" (fortalecer para preparar defensa)'],
     skill:'dr_devil'},
    {texto:'Abordar el ataque más peligroso',
     detalle:'El diablo identifica el ataque que más debería preocuparte. Si no lo resuelves, tu argumento tiene un flanco expuesto. Usa /dr write para reconstruir, /dr mentor para profundizar la respuesta.',
     herramientas:'Claude Code → /dr write · /dr mentor',
     prompts:[]}
  ],
  dr_impact: [
    {texto:'Ejecutar /dr impact — evaluación con 4 agentes independientes',
     detalle:'Lanza 4 agentes en paralelo que NO se ven entre sí: (1) Explorador de vacíos identifica qué falta en la literatura, (2) Evaluador de originalidad puntúa O y N — adversarial: "esto ya lo dijo X", (3) Evaluador de utilidad puntúa U y G — adversarial: "¿qué hace un gerente con esto?", (4) Evaluador de rigor puntúa C y R — adversarial: "¿cuál es el mecanismo exacto?". El orquestador integra los 4 reportes.',
     herramientas:'Claude Code → /dr impact [archivo o texto]',
     prompts:['/dr impact [RUTA O TEXTO DEL ARTÍCULO]'],
     skill:'dr_impact'},
    {texto:'Analizar tabla de vacíos y ranking de impacto',
     detalle:'Revisa la tabla de vacíos con scores en 6 dimensiones (O, N, U, C, G, R — max 24 por vacío). ¿Cuáles son los top 3 vacíos? ¿Hay tensiones entre dimensiones (ej: originalidad alta + rigor bajo = "interesante pero especulativo")? Los vacíos con score ≥20 son contribuciones excepcionales.',
     herramientas:'Output de /dr impact',
     prompts:[]},
    {texto:'Seleccionar vacíos para posicionamiento explícito',
     detalle:'De los vacíos identificados, elige 2-3 que mejor representan TU contribución. No necesitas llenar todos — elige los que más te identifican como investigador y los que más impacto tienen. Estos serán la base de tus párrafos de posicionamiento.',
     herramientas:'Tu criterio como investigador',
     prompts:[]},
    {texto:'Escribir párrafos de posicionamiento',
     detalle:'Para cada vacío seleccionado, escribe un párrafo que declare explícitamente: (1) qué dijeron las fuentes, (2) dónde se detuvieron, (3) qué aportas tú que ninguno articuló. Estructura: "[Autor A] hizo [X]. [Autor B] extendió a [Y]. Lo que ninguno articuló es [vacío] — este artículo llena ese vacío al proponer [tu contribución]." Ubícalos al final de la introducción o al inicio de la discusión.',
     herramientas:'Claude Code → /dr write rewrite · CRISOL → Editor',
     prompts:['/dr write rewrite "[SECCIÓN INTRODUCCIÓN]" "Agregar párrafo de posicionamiento explícito basado en vacíos [V1, V2, V3] identificados en /dr impact"']},
  ],
  dr_benchmark: [
    {texto:'Seleccionar 3-4 publicaciones ancla',
     detalle:'Elige publicaciones de referencia que representen el estándar al que aspira tu artículo. Criterios de selección: (1) al menos 1 teórica pura del campo (ej: March 1991), (2) al menos 1 cercana a tu tema específico, (3) idealmente 1 con validación empírica (ej: Edmondson 1999) — esa es tu norte para la fase experimental. Las anclas son contextuales a cada artículo, no fijas.',
     herramientas:'Google Scholar · Semantic Scholar · Tu conocimiento del campo',
     prompts:['Necesito seleccionar 3-4 publicaciones ancla para benchmarking de mi artículo sobre [TEMA]. Criterios: (1) teórica pura del campo, (2) cercana a mi tema, (3) con validación empírica. Mi artículo propone [CONSTRUCTO PRINCIPAL]. ¿Qué publicaciones canónicas debería usar como referencia?']},
    {texto:'Ejecutar /dr benchmark — comparación en 12 dimensiones',
     detalle:'Compara tu artículo contra las anclas seleccionadas en 12 dimensiones: originalidad, base empírica, rigor, profundidad, alcance, actualidad, verificabilidad, posicionamiento, constructos, interdisciplinariedad, claridad de tesis, potencial de citación. El framework es fijo; las anclas cambian. Produce tabla comparativa + deltas + brechas + techo realista.',
     herramientas:'Claude Code → /dr benchmark',
     prompts:['/dr benchmark\n\nArtículo: [PEGAR TEXTO O RUTA]\n\nAnclas seleccionadas:\n1. [Autor, Año, Título, Journal — tipo: teórica pura]\n2. [Autor, Año, Título, Journal — tipo: cercana al tema]\n3. [Autor, Año, Título, Journal — tipo: empírica]\n\nEvaluar ambos (artículo + anclas) en 12 dimensiones, escala 1-4.']},
    {texto:'Analizar brechas y definir techo realista',
     detalle:'Revisa la tabla de deltas. ¿Dónde estás más cerca de las anclas? ¿Dónde más lejos? Las brechas cerrables sin datos (posicionamiento, claridad) se abordan ahora. Las brechas que requieren empiria (base empírica, verificabilidad) definen tu agenda de investigación futura. El techo sin empiria es ~3.50 (nivel March). Con empiria sube a ~3.70-3.80 (nivel Edmondson).',
     herramientas:'Output de /dr benchmark',
     prompts:[]},
    {texto:'Incorporar aprendizajes del benchmarking al artículo',
     detalle:'Las brechas cerrables deben cerrarse antes de entregar: (1) si falta posicionamiento contra un ancla citada, agregar párrafo de diferenciación, (2) si falta claridad de constructo comparado con el ancla, precisar definición, (3) si el alcance es menor que el ancla, argumentar por qué la delimitación es válida. Las brechas no cerrables (empiria) se declaran como agenda futura en limitaciones.',
     herramientas:'Claude Code → /dr write rewrite · CRISOL → Editor',
     prompts:['/dr write rewrite "[SECCIÓN DISCUSIÓN]" "Posicionar mi constructo [X] respecto a [ANCLA AUTOR, AÑO]: en qué se distancia, qué extiende, qué agrega"']}
  ],
  dr_entrega: [
    {texto:'Verificar incorporación de mentor y diablo',
     detalle:'Antes del review final, confirma que incorporaste los insights de la fase de profundización. El mentor formuló LA pregunta clave — ¿dónde en tu texto está respondida? El diablo identificó el ataque más peligroso — ¿dónde está tu contrataque? Si no están, reescribe antes de continuar.',
     herramientas:'Outputs de /dr mentor y /dr devil · Claude Code → /dr write rewrite',
     prompts:['La pregunta más importante del mentor fue: [PEGAR PREGUNTA DEL MENTOR]. Revisa mi texto y señala dónde está respondida. Si no está, propón dónde y cómo incorporarla.\n\n[PEGAR TEXTO]','El ataque más peligroso del diablo fue: [PEGAR ATAQUE]. Revisa mi texto y señala dónde está mi respuesta. Si no está, propón una sección que lo aborde.\n\n[PEGAR TEXTO]']},
    {texto:'Re-ejecutar /dr review para score final',
     detalle:'Pasa el texto (ya con mentor y diablo incorporados) por /dr review. El score compuesto debe ser ≥90 con ≥80 en cada componente y zero citas fabricadas para gate de ENTREGA.',
     herramientas:'Claude Code → /dr review',
     prompts:['/dr review [TEXTO FINAL]']},
    {texto:'Verificar quality gate de entrega',
     detalle:'Score compuesto ≥90 · Cada componente ≥80 · Score anti-IA ≥85 · Zero citas fabricadas (F1) · Limitaciones explicitadas · Nota metodológica incluida.',
     herramientas:'Output de /dr review + /dr humanize + /dr verify',
     prompts:[]},
    {texto:'Generar reporte de trazabilidad',
     detalle:'Documenta el proceso completo: cuántas iteraciones, qué scores en cada ronda, qué debilidades se corrigieron, qué ataques del diablo se resolvieron. Esto alimenta tu Protocolo de Investigador Hibridado.',
     herramientas:'Claude Code → /dr journal show',
     prompts:['/dr journal show']},
    {texto:'Generar reporte de trazabilidad',
     detalle:'Genera un documento que reconstruye la historia completa de cómo se produjo este texto: genealogía del argumento, trayectoria de scores, fuentes verificadas, gates completados, y declaración metodológica. Puedes generarlo desde CRISOL (botón 📊) o con /dr report en Claude Code. Este reporte alimenta tu Protocolo de Investigador Hibridado.',
     herramientas:'CRISOL → 📊 Reporte · Claude Code → /dr report',
     prompts:['/dr report\n\nDatos del proceso:\n[PEGAR OUTPUTS ACUMULADOS DE TODAS LAS FASES]'],
     skill:'dr_report'},
    {texto:'Exportar texto final',
     detalle:'El texto está listo para incorporar al manuscrito, enviar al tutor, o preparar para submission. El proceso /dr garantiza calidad verificable en cada dimensión.',
     herramientas:'CRISOL → Editor → Exportar',
     prompts:[]}
  ]
};

var DR_PHASE_GATES = {
  dr_gate_exploracion: {
    trigger: ['dr_exploracion'],
    title: 'Gate de exploración: ¿Tienes base para profundizar?',
    description: 'Antes de avanzar, responde las preguntas de reflexión. Sin respuesta escrita, no se pasa el gate.',
    questions: [
      {id:'pregunta', label:'¿Tienes una pregunta de investigación formulada?', type:'select', options:['No, solo un tema','Sí, pero vaga','Sí, pregunta precisa con gap identificado']},
      {id:'fuentes', label:'¿Cuántas fuentes relevantes identificaste?', type:'select', options:['Ninguna','1-5','6-15','Más de 15']},
      {id:'posicion', label:'¿Declaraste tu argumento/posición tentativa?', type:'select', options:['No','Sí, en mi cabeza','Sí, por escrito']}
    ],
    socratic: [
      {id:'s_pregunta', label:'Escribe tu pregunta de investigación completa. No un tema — una pregunta con sujeto, verbo, y alcance.', type:'textarea', placeholder:'¿Cómo [fenómeno] afecta [variable] en [contexto]?', required:true},
      {id:'s_gap', label:'¿Por qué nadie ha respondido esta pregunta antes? ¿Qué falta en la literatura existente?', type:'textarea', placeholder:'La literatura existente cubre X pero no Y porque...', required:true},
      {id:'s_importa', label:'¿A quién le importa la respuesta y por qué? Si tu tesis confirma tu hipótesis, ¿qué cambia?', type:'textarea', placeholder:'Importa porque las organizaciones que...', required:true}
    ]
  },
  dr_gate_lectura: {
    trigger: ['dr_lectura'],
    title: 'Gate de lectura: ¿Extrajiste valor real?',
    description: 'Demuestra que leíste con lente de tesis, no como estudiante pasivo.',
    questions: [
      {id:'clasificacion', label:'¿Clasificaste el texto (A/B/C/D)?', type:'select', options:['No','Sí, es periférico (C/D)','Sí, es complementario (B)','Sí, es central (A)']},
      {id:'conexiones', label:'¿Identificaste conexiones concretas con tu tesis?', type:'select', options:['Ninguna','1-2 conexiones vagas','3+ conexiones con concepto específico']},
      {id:'citas', label:'¿Tienes citas textuales en idioma original con página?', type:'select', options:['No','Algunas sin página','Sí, todas con página y fuente']}
    ],
    socratic: [
      {id:'s_cambio', label:'¿Algo de lo que leíste cambió tu posición tentativa? ¿Qué y por qué?', type:'textarea', placeholder:'Mi posición cambió/se fortaleció en... porque encontré que...', required:true},
      {id:'s_tension', label:'¿Dónde hay tensión entre lo que leíste y tu argumento? ¿Cómo la resuelves?', type:'textarea', placeholder:'La fuente X contradice mi argumento en... Mi respuesta es...', required:true}
    ]
  },
  dr_gate_escritura: {
    trigger: ['dr_escritura'],
    title: 'Gate de escritura: ¿Es tuyo lo que escribiste?',
    description: 'Demuestra autoría intelectual genuina, no delegación.',
    questions: [
      {id:'esqueleto', label:'¿Aprobaste el esqueleto argumental antes de escribir?', type:'select', options:['No, escribí directo','Sí, lo revisé por encima','Sí, lo ajusté y aprobé explícitamente']},
      {id:'defensa', label:'¿Puedes defender cada afirmación sin ayuda de IA?', type:'select', options:['No estoy seguro','La mayoría sí','Todas, puedo debatirlas']},
      {id:'voz', label:'¿El texto suena a ti o suena genérico?', type:'select', options:['Genérico','Partes mías y partes genéricas','Mi voz claramente']}
    ],
    socratic: [
      {id:'s_contribucion', label:'¿Cuál es TU contribución original en este texto? No lo que las fuentes dicen — lo que TÚ propones que ninguna fuente propone.', type:'textarea', placeholder:'Mi contribución es... que se distingue de la literatura en que...', required:true},
      {id:'s_sinIA', label:'Si la IA no existiera, ¿podrías escribir este argumento? ¿Qué parte sí y qué parte no?', type:'textarea', placeholder:'Podría argumentar X porque... pero necesité IA para...', required:true},
      {id:'s_decision', label:'¿Qué decidiste RECHAZAR de lo que la IA sugirió? ¿Por qué?', type:'textarea', placeholder:'Rechacé... porque no reflejaba mi posición / era incorrecto / no encajaba con...', required:true}
    ]
  },
  dr_gate_critica: {
    trigger: ['dr_critica'],
    title: 'Gate de revisión: ¿El score pasa el nivel requerido?',
    description: 'Interpreta los resultados de la revisión. Los números sin interpretación no valen.',
    questions: [
      {id:'score', label:'¿Cuál es el score compuesto actual?', type:'select', options:['< 70 (no pasa borrador)','70-79 (borrador)','80-89 (capítulo)','≥ 90 (entrega)']},
      {id:'top3', label:'¿Abordaste las 3 debilidades de mayor impacto?', type:'select', options:['No','Parcialmente','Sí, las 3 corregidas']},
      {id:'componentes', label:'¿Algún componente está debajo de 70?', type:'select', options:['Sí, varios','Sí, uno','No, todos ≥ 70']}
    ],
    socratic: [
      {id:'s_debilidad', label:'¿Cuál es la debilidad más peligrosa que detectó el review? ¿Por qué es la más peligrosa?', type:'textarea', placeholder:'La debilidad más peligrosa es... porque un reviewer la detectaría inmediatamente y...', required:true},
      {id:'s_desacuerdo', label:'¿Hay alguna deducción del review con la que NO estés de acuerdo? ¿Por qué?', type:'textarea', placeholder:'No estoy de acuerdo con... porque mi argumento funciona dado que...', required:true}
    ]
  },
  dr_gate_humanize: {
    trigger: ['dr_humanize'],
    title: 'Gate de humanización: ¿Suena a investigador humano?',
    description: 'La meta no es escritura perfecta sino escritura creíblemente humana.',
    questions: [
      {id:'score_ia', label:'¿Cuál es el score anti-IA?', type:'select', options:['< 70 (muy IA)','70-84 (necesita trabajo)','≥ 85 (objetivo cumplido)']},
      {id:'criticos', label:'¿Quedan patrones CRÍTICOS sin corregir?', type:'select', options:['Sí, varios','Sí, 1-2','No, zero críticos']},
      {id:'voz_post', label:'¿Después de humanizar, sigue sonando a ti?', type:'select', options:['Perdió mi voz','Mejoró pero perdió algo','Sí, es mi voz mejorada']}
    ],
    socratic: [
      {id:'s_voz', label:'Lee en voz alta el párrafo que más te representa. ¿Por qué ese y no otro? ¿Qué tiene de tuyo?', type:'textarea', placeholder:'El párrafo que más me representa es... porque refleja mi forma de...', required:true}
    ]
  },
  dr_gate_verify: {
    trigger: ['dr_verify'],
    title: 'Gate de verificación: ¿TODAS las citas son sólidas?',
    description: 'ZERO TOLERANCIA: cualquier defecto de cita no resuelto bloquea este gate. F1-F4 deben estar corregidos. F5 deben estar declarados como limitación.',
    questions: [
      {id:'defectos', label:'¿Quedan citas con CUALQUIER defecto sin resolver (F1-F5)?', type:'select', options:['Sí, hay defectos pendientes','Todas corregidas o declaradas como limitación']},
      {id:'f1_zero', label:'¿Citas fabricadas (F1)?', type:'select', options:['Hay F1 pendientes','Zero F1']},
      {id:'f2_zero', label:'¿Citas distorsionadas (F2)?', type:'select', options:['Hay F2 pendientes','Zero F2']},
      {id:'f5_declaradas', label:'¿Citas inverificables (F5)?', type:'select', options:['Hay F5 sin declarar','Todas F5 declaradas como limitación']}
    ],
    socratic: [
      {id:'s_cita_dificil', label:'¿Cuál fue la cita más difícil de verificar? ¿Qué encontraste al verificarla contra el PDF?', type:'textarea', placeholder:'La más difícil fue... porque el original dice X pero yo afirmaba Y...', required:true},
      {id:'s_aprendizaje', label:'¿Qué aprendiste sobre tu propio proceso de citación? ¿Dónde tiendes a ser impreciso?', type:'textarea', placeholder:'Tiendo a... lo cual es un patrón que debo vigilar porque...', required:true}
    ]
  },
  dr_gate_depth: {
    trigger: ['dr_depth'],
    title: 'Gate de profundización: ¿Tu argumento resiste?',
    description: 'El mentor preguntó, el diablo atacó. Demuestra que respondiste con profundidad.',
    questions: [
      {id:'mentor', label:'¿Respondiste por escrito la pregunta clave del mentor?', type:'select', options:['No','Respondí mentalmente','Sí, por escrito']},
      {id:'diablo', label:'¿Abordaste el ataque más peligroso del diablo?', type:'select', options:['No','Lo identifiqué pero no lo resolví','Sí, tengo respuesta']},
      {id:'reconstruccion', label:'¿Incorporaste las mejoras al texto?', type:'select', options:['No aún','Parcialmente','Sí, texto actualizado']}
    ],
    socratic: [
      {id:'s_mentor_resp', label:'Escribe tu respuesta a LA pregunta que más importa del mentor. No la evadas — respóndela.', type:'textarea', placeholder:'La pregunta fue: ... Mi respuesta es: ...', required:true},
      {id:'s_diablo_resp', label:'Escribe tu contrataque al ataque más peligroso del diablo. ¿Por qué tu argumento sobrevive?', type:'textarea', placeholder:'El ataque fue: ... Mi argumento sobrevive porque: ...', required:true},
      {id:'s_cambio_post', label:'¿Tu argumento cambió después del mentor y el diablo? ¿Cómo? Si no cambió, ¿por qué resistió?', type:'textarea', placeholder:'Cambió en... / Resistió porque...', required:true}
    ]
  },
  dr_gate_impact: {
    trigger: ['dr_impact'],
    title: 'Gate de impacto: ¿Tu contribución es clara y defendible?',
    description: 'Verifica que identificaste los vacíos que llenas y que tu posicionamiento es explícito.',
    questions: [
      {id:'vacios', label:'¿Cuántos vacíos con score ≥16 identificaste?', type:'select', options:['Ninguno','1-2','3 o más']},
      {id:'posicionamiento', label:'¿Escribiste párrafos de posicionamiento explícito?', type:'select', options:['No','Borrador','Sí, insertados en el texto']},
      {id:'tensiones', label:'¿Hay tensiones entre dimensiones (O alto + R bajo, etc.)?', type:'select', options:['Sí, sin resolver','Sí, declaradas como limitación','No, scores equilibrados']},
      {id:'top_vacio', label:'¿Puedes nombrar tu contribución principal en una oración?', type:'select', options:['No estoy seguro','Sí, pero es vaga','Sí, precisa y defendible']}
    ],
    socratic: [
      {id:'s_contribucion_1', label:'En una oración: ¿cuál es tu contribución principal? ¿Qué sabe el campo después de tu artículo que no sabía antes?', type:'textarea', placeholder:'Mi contribución es que... lo cual cambia la comprensión de...', required:true},
      {id:'s_quien_cita', label:'¿Qué investigador futuro citaría tu artículo y para qué? ¿Qué frase suya incluiría tu nombre?', type:'textarea', placeholder:'Un investigador de [campo] citaría mi concepto de [X] para fundamentar...', required:true}
    ]
  },
  dr_gate_benchmark: {
    trigger: ['dr_benchmark'],
    title: 'Gate de benchmarking: ¿Conoces tu posición relativa?',
    description: 'Verifica que sabes dónde estás respecto al campo.',
    questions: [
      {id:'anclas', label:'¿Cuántas anclas seleccionaste y comparaste?', type:'select', options:['Ninguna','1-2','3-4']},
      {id:'brechas', label:'¿Identificaste las brechas cerrables vs no cerrables?', type:'select', options:['No','Parcialmente','Sí, con acción para cada una']},
      {id:'techo', label:'¿Conoces tu techo realista (con y sin empiria)?', type:'select', options:['No','Aproximadamente','Sí, con score estimado']},
      {id:'incorporacion', label:'¿Incorporaste los aprendizajes al texto?', type:'select', options:['No aún','Parcialmente','Sí, posicionamiento + limitaciones actualizadas']}
    ],
    socratic: [
      {id:'s_distancia', label:'¿En qué dimensión estás más lejos de las anclas? ¿Es cerrable o requiere empiria?', type:'textarea', placeholder:'La brecha mayor es... que es cerrable/no cerrable porque...', required:true},
      {id:'s_ventaja', label:'¿En qué dimensión SUPERAS a alguna ancla? ¿Eso es defendible o es ilusión?', type:'textarea', placeholder:'Supero a [ancla] en [dimensión] porque... esto es genuino dado que...', required:true}
    ]
  }
};

// Skill files — contenido de cada skill para descarga directa desde CRISOL
var DR_SKILL_FILES = {
  dr_read: {
    name: '/dr read — Lector Profundo',
    filename: 'dr_read_skill.md',
    description: 'Lee textos con lente de tesis. Produce ficha de explotación con conexiones, citas textuales, tensiones, y mapa de uso en A1-A7.'
  },
  dr_write: {
    name: '/dr write — Escritor Doctoral',
    filename: 'dr_write_skill.md',
    description: 'Genera borradores con esqueleto argumental, estilo calibrado, y autoevaluación. Modos: section, draft, extend, rewrite.'
  },
  dr_review: {
    name: '/dr review — Crítico Adversarial',
    filename: 'dr_review_skill.md',
    description: 'Evalúa en 6 componentes con 25 deducciones trazables. Score compuesto ponderado y quality gates.'
  },
  dr_humanize: {
    name: '/dr humanize — Humanizer Pass',
    filename: 'dr_humanize_skill.md',
    description: 'Detecta 15 patrones de escritura IA (5 críticos, 6 altos, 6 medios). Score anti-IA 0-100.'
  },
  dr_verify: {
    name: '/dr verify — Verificador de Citas',
    filename: 'dr_verify_skill.md',
    description: 'Verifica citas contra PDFs originales. Taxonomía de 5 tipos de error (fabricada, distorsionada, descontextualizada, inexacta, inverificable).'
  },
  dr_mentor: {
    name: '/dr mentor — Mentor Socrático',
    filename: 'dr_mentor_skill.md',
    description: 'Preguntas socrátias que obligan a profundizar. 6 tipos de pregunta, anti-sycophancy. Modos: defend, clarify, connect.'
  },
  dr_devil: {
    name: '/dr devil — Abogado del Diablo',
    filename: 'dr_devil_skill.md',
    description: 'Ataques sistemáticos para fortalecer el argumento. 7 tipos de ataque, 4 niveles de agresividad, steelman.'
  },
  dr_report: {
    name: '/dr report — Reporte de Trazabilidad',
    filename: 'dr_report_skill.md',
    description: 'Genera reporte completo del proceso: genealogía del argumento, trayectoria de scores, integridad de fuentes, decisiones del investigador, declaración metodológica.'
  },
  dr_impact: {
    name: '/dr impact — Evaluación de Impacto',
    filename: 'dr_impact_skill.md',
    description: 'Evalúa impacto con 4 agentes antagónicos. 6 dimensiones (O, N, U, C, G, R). Identifica vacíos, puntúa contribución, sugiere posicionamiento. Basado en Corley & Gioia, Whetten, Davis, Carton.'
  }
};

// ============================================================
// CLO-AUTHOR WIZARD — Paper empírico con R, LaTeX, peer review
// Basado en clo-author v3.1.1 (Hugo Sant'Anna, Emory)
// 16 agentes, worker-critic pairs, phase-sensitive severity
// ============================================================

var CLO_FASES = [
  {id:'clo_discover',nombre:'Descubrimiento',estado:'pendiente',icon:'🔎'},
  {id:'clo_strategize',nombre:'Estrategia',estado:'pendiente',icon:'🎯'},
  {id:'clo_analyze',nombre:'Análisis',estado:'pendiente',icon:'💻'},
  {id:'clo_write',nombre:'Escritura',estado:'pendiente',icon:'📝'},
  {id:'clo_review',nombre:'Peer Review',estado:'pendiente',icon:'👥'},
  {id:'clo_revise',nombre:'R&R',estado:'pendiente',icon:'🔄'},
  {id:'clo_submit',nombre:'Submission',estado:'pendiente',icon:'📮'}
];

var CLO_WIZARD_TASKS = {
  clo_discover: [
    {texto:'Inicializar proyecto clo-author',
     detalle:'En Claude Code, navega al directorio del proyecto y ejecuta /new-project. Esto crea la estructura de carpetas (src/, data/, output/, paper/), inicializa el research journal, y configura los agentes.',
     herramientas:'Claude Code → cd [directorio] → /new-project',
     prompts:['/new-project'],
     needsCd:true},
    {texto:'Ejecutar /discover — revisión de literatura',
     detalle:'El agente librarian busca literatura relevante, identifica gaps, y evalúa recencia. El librarian-critic revisa cobertura y señala autores faltantes. En paralelo, el explorer evalúa factibilidad de datos y calidad de las fuentes disponibles.',
     herramientas:'Claude Code → /discover',
     prompts:['/discover'],
     needsCd:true},
    {texto:'Revisar quality report del descubrimiento',
     detalle:'clo-author genera quality reports en quality_reports/. Revisa el score del librarian-critic (cobertura de literatura) y del explorer-critic (calidad de datos). Si alguno está debajo de 80, el sistema automáticamente solicita correcciones.',
     herramientas:'quality_reports/ en el directorio del proyecto',
     prompts:[]},
    {texto:'Definir domain profile',
     detalle:'Configura el perfil de dominio: campo (management, economics, finance), journals target, datasets típicos, estrategias de identificación comunes, convenciones del campo, y referencias seminales.',
     herramientas:'Claude Code → /tools domain-profile',
     prompts:['/tools domain-profile'],
     needsCd:true}
  ],
  clo_strategize: [
    {texto:'Ejecutar /strategize — estrategia de identificación',
     detalle:'El agente strategist define la estrategia empírica: variable dependiente, tratamiento, identificación causal (DiD, IV, RDD, matching, etc.), supuestos clave, y amenazas. El strategist-critic evalúa validez interna y sugiere robustness checks.',
     herramientas:'Claude Code → /strategize',
     prompts:['/strategize'],
     needsCd:true},
    {texto:'Revisar y aprobar estrategia',
     detalle:'El strategist produce un plan con MUST/SHOULD/MAY requirements. Revisa los supuestos de identificación — aquí es donde se decide si el paper es creíble. Si el strategist-critic score <80, hay un problema fundamental que debe resolverse antes de codificar.',
     herramientas:'quality_reports/plans/ en el directorio del proyecto',
     prompts:[]},
    {texto:'Definir robustness checks',
     detalle:'Lista de checks que fortalecen la identificación: placebo tests, alternative specifications, sample splits, falsification tests. El strategist-critic verifica que cubren las amenazas principales.',
     herramientas:'Claude Code',
     prompts:[]}
  ],
  clo_analyze: [
    {texto:'Ejecutar /analyze — implementar análisis',
     detalle:'El agente coder implementa el pipeline en R (o Stata): limpieza de datos, variables, estimación principal, robustness checks, tablas y figuras. El coder-critic evalúa calidad del código, reproducibilidad, y alineación con la estrategia aprobada.',
     herramientas:'Claude Code → /analyze',
     prompts:['/analyze'],
     needsCd:true},
    {texto:'Verificar reproducibilidad',
     detalle:'El verifier ejecuta el pipeline completo y verifica: ¿compila sin errores? ¿los resultados son reproducibles? ¿los paths son relativos? ¿el master script corre de principio a fin?',
     herramientas:'Claude Code → /tools verify',
     prompts:['/tools verify'],
     needsCd:true},
    {texto:'Revisar tablas y figuras',
     detalle:'Las tablas deben tener formato de publicación (booktabs, threeparttable). Las figuras deben ser PDF vectoriales, colorblind-friendly, sin títulos internos. Revisa que los resultados cuenten la historia que tu estrategia predice.',
     herramientas:'output/ en el directorio del proyecto',
     prompts:[]},
    {texto:'Iterar si coder-critic score < 80',
     detalle:'Si el score del coder-critic está debajo de 80, el sistema entra en fix cycle (máximo 3 rondas). Si no converge después de 3 rondas, escala al strategist-critic (Three Strikes Escalation).',
     herramientas:'Claude Code → automático',
     prompts:[]}
  ],
  clo_write: [
    {texto:'Ejecutar /write — escribir paper en LaTeX',
     detalle:'El agente writer genera el manuscrito en LaTeX (XeLaTeX + biblatex + biber). Secciones IMRaD en paper/sections/. El writer-critic evalúa claridad, estructura, hedging, y calidad de la narrativa. Incluye humanizer pass automático (24 categorías de patrones IA).',
     herramientas:'Claude Code → /write',
     prompts:['/write'],
     needsCd:true},
    {texto:'Ejecutar humanizer pass',
     detalle:'El writer aplica un pass anti-IA que elimina 24 categorías de patrones: significance inflation, promotional language, "Additionally/Furthermore/Delve/Foster/Interplay/Landscape/Leverage", em dash overuse, rule-of-three, filler phrases. Verifica que el paper suene al investigador, no a Claude.',
     herramientas:'Claude Code → /write humanize [file]',
     prompts:['/write humanize paper/main.tex'],
     needsCd:true},
    {texto:'Compilar y verificar PDF',
     detalle:'Compila el LaTeX a PDF. Verifica: ¿compila sin errores? ¿las tablas y figuras se ven correctas? ¿la bibliografía está completa? ¿el abstract cabe en el límite del journal?',
     herramientas:'Claude Code → /tools verify',
     prompts:['/tools verify --submission'],
     needsCd:true},
    {texto:'Revisar writer-critic score',
     detalle:'El writer-critic evalúa el manuscrito completo. Penaliza: hedging language (-5 por instancia, max -15), secciones desbalanceadas, conclusiones que exceden los resultados, y claims sin soporte. Score ≥80 requerido para avanzar a peer review.',
     herramientas:'quality_reports/',
     prompts:[]}
  ],
  clo_review: [
    {texto:'Ejecutar /review — peer review simulado',
     detalle:'Simulación completa del proceso editorial: (1) Editor hace desk review (puede desk reject), (2) Editor selecciona 2 referees con disposiciones distintas (STRUCTURAL, CREDIBILITY, MEASUREMENT, POLICY, THEORY, SKEPTIC), (3) Cada referee produce report independiente con scores, (4) Editor clasifica concerns como FATAL/ADDRESSABLE/TASTE y toma decisión editorial.',
     herramientas:'Claude Code → /review',
     prompts:['/review'],
     needsCd:true},
    {texto:'Analizar reports de los referees',
     detalle:'Domain-referee evalúa: contribución (30%), literatura (25%), argumentos (20%), validez externa (15%), fit con journal (10%). Methods-referee evalúa: identificación (35%), estimación (25%), inferencia (20%), robustness (15%), replicación (5%). Ambos incluyen "what would change my mind" para cada concern.',
     herramientas:'quality_reports/ → referee reports',
     prompts:[]},
    {texto:'Revisar decisión editorial',
     detalle:'El editor clasifica cada concern: FATAL (unjustifiable — requiere cambio estructural), ADDRESSABLE (fixable — requiere trabajo), TASTE (preference — responder diplomáticamente). La decisión es independiente de los scores: Accept / Minor / Major / Reject.',
     herramientas:'quality_reports/ → editorial decision',
     prompts:[]}
  ],
  clo_revise: [
    {texto:'Ejecutar /revise — responder a referees',
     detalle:'clo-author clasifica cada comentario de los referees en 5 categorías: NEW ANALYSIS (requiere nueva estimación → coder), CLARIFICATION (revisión de texto → writer), REWRITE (restructuración → writer), DISAGREE (pushback → SIEMPRE requiere tu aprobación), MINOR (typos → writer directo). Genera response letter punto por punto.',
     herramientas:'Claude Code → /revise',
     prompts:['/revise'],
     needsCd:true},
    {texto:'Revisar items DISAGREE',
     detalle:'Los items clasificados como DISAGREE son SIEMPRE flaggeados para tu revisión. Claude nunca pushback autónomamente contra un referee. Tú decides si y cómo argumentar el desacuerdo. Protocolo diplomático: acknowledge, evidence, concession.',
     herramientas:'Tu criterio como investigador',
     prompts:[]},
    {texto:'Verificar cambios y resubmit',
     detalle:'Revisa: ¿cada comentario del referee tiene una respuesta en la letter? ¿cada cambio prometido está implementado? ¿el manuscrito revisado es coherente? ¿las tablas/figuras cambiaron si hubo new analysis? Ejecuta /tools verify antes de resubmit.',
     herramientas:'Claude Code → /tools verify --submission',
     prompts:['/tools verify --submission'],
     needsCd:true}
  ],
  clo_submit: [
    {texto:'Verificación final (10 checks)',
     detalle:'El verifier en modo submission ejecuta 10 verificaciones: compilación LaTeX, reproducibilidad del código, paths relativos, tablas formateadas, figuras en PDF, bibliografía completa, abstract word count, anonimato, replication package, y master script.',
     herramientas:'Claude Code → /submit',
     prompts:['/submit'],
     needsCd:true},
    {texto:'Preparar replication package',
     detalle:'AEA-compliant: master script que corre todo de principio a fin, README con instrucciones, documentación de datos, licencias. El verifier confirma que el paquete es autocontenido.',
     herramientas:'Directorio del proyecto → replication/',
     prompts:[]},
    {texto:'Subir a journal',
     detalle:'Sube manuscrito anonimizado + cover letter + datos suplementarios al portal del journal (ScholarOne, Editorial Manager, etc.). Registra journal, fecha, y decisión en CRISOL.',
     herramientas:'Portal del journal',
     prompts:[]}
  ]
};

var CLO_PHASE_GATES = {
  clo_gate_discover: {
    trigger: ['clo_discover'],
    title: 'Gate: ¿La base es sólida?',
    description: 'Verifica cobertura de literatura y factibilidad de datos.',
    questions: [
      {id:'lit_score', label:'¿Score del librarian-critic?', type:'select', options:['< 80 (literatura insuficiente)','80-89 (aceptable)','≥ 90 (excelente cobertura)']},
      {id:'data_score', label:'¿Score del explorer-critic?', type:'select', options:['< 80 (datos problemáticos)','80-89 (factible)','≥ 90 (datos sólidos)']},
      {id:'gap', label:'¿El gap está claro y es publicable?', type:'select', options:['No','Parcialmente','Sí, gap claro y relevante']}
    ]
  },
  clo_gate_strategize: {
    trigger: ['clo_strategize'],
    title: 'Gate: ¿La identificación es creíble?',
    description: 'Verifica validez interna de la estrategia empírica.',
    questions: [
      {id:'strat_score', label:'¿Score del strategist-critic?', type:'select', options:['< 80 (identificación débil)','80-89 (aceptable)','≥ 90 (sólida)']},
      {id:'threats', label:'¿Las amenazas principales tienen robustness checks?', type:'select', options:['No','Parcialmente','Sí, todas cubiertas']},
      {id:'assumptions', label:'¿Los supuestos son justificables?', type:'select', options:['Algunos problemáticos','Mayoritariamente','Todos justificados']}
    ]
  },
  clo_gate_analyze: {
    trigger: ['clo_analyze'],
    title: 'Gate: ¿El código es reproducible y los resultados confiables?',
    description: 'Verifica calidad del análisis antes de escribir.',
    questions: [
      {id:'code_score', label:'¿Score del coder-critic?', type:'select', options:['< 80 (código con problemas)','80-89 (aceptable)','≥ 90 (limpio y reproducible)']},
      {id:'verifier', label:'¿El verifier pasó?', type:'select', options:['FAIL','PASS con warnings','PASS limpio']},
      {id:'results', label:'¿Los resultados son coherentes con la estrategia?', type:'select', options:['Sorpresas sin explicar','Mayoritariamente coherentes','Sí, historia clara']}
    ]
  },
  clo_gate_write: {
    trigger: ['clo_write'],
    title: 'Gate: ¿El paper está listo para review?',
    description: 'Verifica calidad del manuscrito y humanización.',
    questions: [
      {id:'writer_score', label:'¿Score del writer-critic?', type:'select', options:['< 80 (necesita trabajo)','80-89 (aceptable)','≥ 90 (pulido)']},
      {id:'humanizer', label:'¿Pasó el humanizer pass?', type:'select', options:['No','Con correcciones pendientes','Sí, limpio']},
      {id:'compile', label:'¿Compila sin errores?', type:'select', options:['Errores','Warnings','Limpio']}
    ]
  },
  clo_gate_review: {
    trigger: ['clo_review'],
    title: 'Gate: ¿Qué dijo el review simulado?',
    description: 'Evalúa la decisión editorial simulada.',
    questions: [
      {id:'decision', label:'¿Decisión editorial?', type:'select', options:['Reject','Major revisions','Minor revisions','Accept']},
      {id:'fatal', label:'¿Hay concerns FATAL?', type:'select', options:['Sí, irresolubles','Sí, pero abordables','No']},
      {id:'overall', label:'¿Score overall de los referees?', type:'select', options:['< 65 (reject range)','65-79 (major)','80-89 (minor)','≥ 90 (accept)']}
    ]
  }
};
