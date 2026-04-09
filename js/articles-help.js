/**
 * articles-help.js — Help panel renderer (extracted from articles.js)
 *
 * Contains renderAyuda() which renders the CRISOL help panel.
 * ~283 lines of static HTML describing features, workflows, skills, and shortcuts.
 *
 * @module articles-help
 */

import { state } from './state.js';
import { getBreadcrumb } from './articles.js';

// ============================================================
// RENDER AYUDA (help panel) — large static HTML
// ============================================================
export function renderAyuda() {
  // Delegate to state if a full implementation exists there (help content is very long)
  if (state.renderAyudaFull) { state.renderAyudaFull(); return; }

  const ct = state.ct;
  ct.innerHTML = getBreadcrumb() + `
  <div class="sb"><h3>Ayuda — CRISOL v4</h3></div>
  <p style="font-size:15px;color:var(--tx2);margin-bottom:18px;">Plataforma de produccion doctoral con trazabilidad IA. CRISOL funciona como: <b>(1)</b> Espacio de trabajo — proyectos, kanban, editor, PRISMA; <b>(2)</b> Produccion doctoral — wizard DR con 10 fases, gates socraticos, skills /dr; <b>(3)</b> Control de calidad — verificacion de citas, humanizer, critico adversarial; <b>(4)</b> Colaboracion — invitaciones, roles, proyectos compartidos, feed de actividad; <b>(5)</b> Trazabilidad — bitacora, audit log, respaldos automaticos; <b>(6)</b> Seguridad — RLS por usuario, admin dinamico, CSP headers.</p>

  <div class="help-section"><div class="help-head open" onclick="togHelp(this)"><span class="hchv">▸</span> Novedades v4</div><div class="help-body open">
    <div class="help-item"><h4>Sistema de invitaciones</h4><p>Los nuevos investigadores solicitan acceso desde la landing page. El admin aprueba y genera un codigo unico (CR-XXXXXX) que el solicitante usa para registrarse.</p></div>
    <div class="help-item"><h4>Wizard de produccion doctoral (/dr)</h4><p>10 fases guiadas: lectura profunda, escritura, revision, humanizacion, verificacion de citas, evaluacion de impacto, benchmark, mentor socratico, abogado del diablo, y reporte de trazabilidad. Cada fase tiene tareas, prompts copiables y gates socraticos obligatorios.</p></div>
    <div class="help-item"><h4>Ramas de proyecto</h4><p>Explora lineas argumentales alternativas sin perder la rama principal. Cada rama tiene su propio estado (en curso, en espera, completada, descartada) y notas.</p></div>
    <div class="help-item"><h4>Registro de artefactos</h4><p>Documenta cada producto de tu investigacion con tags transversales (Sustancia, Proceso, Integridad) y genera un portfolio academico exportable.</p></div>
    <div class="help-item"><h4>Colaboracion multi-usuario</h4><p>Invita investigadores a tus proyectos por email o link. Roles: owner, reviewer, lector. Feed de actividad muestra quien hizo que. Deteccion de conflictos en edicion concurrente.</p></div>
    <div class="help-item"><h4>Respaldos automaticos</h4><p>Backup cada 30 minutos a Supabase (7 dias de retencion) + backup local diario programado. Restauracion completa desde archivo JSON.</p></div>
    <div class="help-item"><h4>Seguridad</h4><p>Row Level Security en todas las tablas. Admin dinamico desde base de datos. Headers de seguridad (CSP, HSTS, X-Frame-Options). Validacion de email y sanitizacion de inputs.</p></div>
    <div class="help-item"><h4>Observabilidad</h4><p>Errores se registran automaticamente en Supabase. Audit log para operaciones sensibles (aprobar, rechazar, borrar). Indicador de conexion en tiempo real.</p></div>
    <div class="help-item"><h4>Accesibilidad</h4><p>Navegacion completa por teclado (Tab + Enter). Modales con Escape para cerrar. Screen readers soportados (aria-live, role=alert). Labels en formularios.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head open" onclick="togHelp(this)"><span class="hchv">▸</span> Los tres niveles de la mente investigadora</div><div class="help-body open">
    <div class="help-item"><h4>Micro · Meso · Macro</h4><p>La mente del investigador opera en tres niveles <b>simultáneamente</b>, no secuencialmente. CRISOL replica esta simultaneidad:</p></div>
    <div class="help-item"><h4>Nivel 1 — Micro: El párrafo</h4><p><i>"¿Qué dice esta oración? ¿Apoya o contradice mi argumento?"</i><br><br>Decodificación + evaluación a nivel de párrafo. CRISOL lo cubre con <b>texto anotado, claims S/C/N, interrogación elaborativa, auto-explicación, TTS</b>. Este nivel produce la materia prima del conocimiento.</p></div>
    <div class="help-item"><h4>Nivel 2 — Meso: Las conexiones</h4><p><i>"¿Qué le diría Argyris a Nonaka? ¿Puedo articular una oración que conecte estos 3 autores?"</i><br><br>El investigador está <b>entre artículos</b> — busca tensiones, convergencias, gaps. Cuando escribe, no documenta lo que leyó: <b>descubre lo que piensa</b>. CRISOL lo cubre con <b>Mi tesis, Quiz interleaved, Comparar conceptos, Editor con citas vinculadas</b>.</p></div>
    <div class="help-item"><h4>Nivel 3 — Macro: La perspectiva</h4><p><i>"¿Mi marco teórico tiene sustento? ¿Qué sección está débil? ¿Para qué estoy leyendo este artículo?"</i><br><br>Sin perspectiva macro, el investigador lee sin saber para qué, escribe sin saber cómo encaja, y pierde motivación porque no ve progreso. <b>Los proyectos son el marco que da sentido a la lectura y la escritura.</b> Sin proyecto, leer es acumular. Con proyecto, leer es construir. CRISOL lo cubre con <b>Proyectos: dashboard, mapa fuentes→secciones, detección de gaps, KPIs, deadline</b>.</p></div>
    <div class="help-item"><h4>La espiral con eje</h4><p>La espiral hermenéutica ahora tiene un <b>eje central</b>: el proyecto. Cada vuelta tiene dirección — estás leyendo para tu paper, escribiendo tu marco teórico, descubriendo gaps en tu metodología. La navegación bidireccional (badges violeta, clicks entre niveles) convierte tres herramientas separadas en <b>tres vistas del mismo proceso cognitivo</b>.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> La espiral hermenéutica: cómo piensa un investigador</div><div class="help-body">
    <div class="help-item"><h4>El ciclo de vida del conocimiento</h4><p>La investigación no es lineal. No es "primero leo, después escribo." Es una <b>espiral</b> donde cada vuelta reconfigura las anteriores:<br><br>
    <b>PREGUNTAS</b> → Empieza con una incomodidad intelectual: algo que no calza, un fenómeno sin explicación satisfactoria.<br>
    <b>BUSCAR</b> → La pregunta te lleva a buscar interlocutores: quién apoya tu intuición, quién la contradice, quién la matiza.<br>
    <b>LEER</b> → No es lectura lineal. Es interrogación del texto: ¿qué dice? ¿desde qué tradición? ¿qué asume sin decirlo?<br>
    <b>EVALUAR</b> → El novato dice "interesante." El experto dice "esto apoya mi argumento en X pero contradice mi posición en Y."<br>
    <b>CONECTAR</b> → Un artículo solo no dice nada. El conocimiento emerge de las conexiones entre autores, tensiones entre teorías, gaps que tu investigación puede llenar.<br>
    <b>ESCRIBIR</b> → No documenta el pensamiento: lo produce. Al articular una oración que conecta 3 autores con tu hipótesis, descubres en tiempo real si tu argumento funciona.<br>
    <b>DESCUBRIR</b> → Al escribir descubres lo que no sabías que no sabías. Nuevas preguntas, nuevos gaps. El ciclo recomienza.</p></div>
    <div class="help-item"><h4>Lo que hace diferente al experto</h4><p>El novato recorre el ciclo <b>una vez</b>: lee todo, después escribe todo. El experto lo recorre <b>continuamente en espiral</b>: lee 3 artículos, escribe un párrafo, descubre un gap, busca 2 más, refina el párrafo. Y hay algo más profundo: <b>el conocimiento no se acumula, se reconfigura</b>. Cuando lees a Luhmann, entiendes la complejidad de una forma. Cuando después lees a Habermas criticándolo, lo que creías saber sobre Luhmann cambia de significado.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> CRISOL como exoesqueleto cognitivo</div><div class="help-body">
    <div class="help-item"><h4>El problema que resuelve</h4><p>La memoria de trabajo humana maneja ~4 items simultáneamente (Cowan, 2001). Leer un paper demanda: decodificar vocabulario (1 slot), mantener el hilo argumentativo (1 slot), recordar el contexto (1 slot), evaluar críticamente (1 slot). No queda espacio para lo más importante: <b>pensar qué significa esto para TU investigación</b>.<br><br>
    CRISOL es un exoesqueleto que <b>descarga las capas inferiores</b> para que tu mente se dedique a lo que ninguna máquina puede hacer: posicionar, juzgar, conectar, crear.</p></div>
    <div class="help-item"><h4>Las 4 capas cognitivas de la lectura</h4><p>
    <b>Capa 1 — Proposicional:</b> ¿Qué dice esta oración? CRISOL descarga esto con anotaciones pre-generadas.<br><br>
    <b>Capa 2 — Situacional:</b> ¿Qué fenómeno describe? CRISOL lo sostiene con highlights, ejemplos y estructura de acordeones.<br><br>
    <b>Capa 3 — Intertextual:</b> ¿Quién más dice esto? CRISOL lo externaliza con glosario cross-article, tensiones, búsqueda global.<br><br>
    <b>Capa 4 — Posicional:</b> ¿Qué significa para MI argumento? CRISOL protege esta capa con el claims tracker — fuerza la evaluación párrafo por párrafo.</p></div>
    <div class="help-item"><h4>Cómo CRISOL implementa cada fase del ciclo</h4><p>
    <b>PREGUNTAS</b> → Puente a tu tesis, Preguntas del Mapa inter-textual<br>
    <b>BUSCAR</b> → Directorio de fuentes académicas, búsqueda global cross-article<br>
    <b>LEER</b> → Texto anotado con TTS + word tracking, avance con Enter, auto-explicación<br>
    <b>EVALUAR</b> → Claims tracker (apoya/contrasta/neutro) + detector de sesgo de confirmación<br>
    <b>CONECTAR</b> → Comparar conceptos, quiz interleaved, Mi tesis cross-article<br>
    <b>ESCRIBIR</b> → Editor de documentos con citas vinculadas, plantillas académicas, exportar APA<br>
    <b>DESCUBRIR</b> → Artículos no citados, gaps detectados, revisión espaciada</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Base científica del aprendizaje</div><div class="help-body">
    <div class="help-item"><h4>El problema</h4><p>Lees un paper de 20 páginas. Te toma 4-6 horas. Una semana después recuerdas el 20%. Cuando escribes tu marco teórico, vuelves a leer todo desde cero. Multiplica eso por 40-80 artículos.</p></div>
    <div class="help-item"><h4>7 técnicas con evidencia sólida</h4><p>
    <b>1. Pre-lectura estructurada</b> (advance organizers, Ausubel 1960) — Leer posicionamiento y esqueleto ANTES del texto.<br><br>
    <b>2. Anotación elaborativa</b> (Pressley et al. 1987) — "¿Por qué?" fuerza conexiones causales.<br><br>
    <b>3. Auto-explicación</b> (Chi et al. 1989) — Explicar en tus palabras = mejor predictor de comprensión profunda.<br><br>
    <b>4. Evaluación posicional</b> — Claims apoya/contrasta/neutro operacionalizan la lectura crítica doctoral.<br><br>
    <b>5. Retrieval practice</b> (Roediger &amp; Karpicke 2006) — Responder de memoria consolida 3x más que releer.<br><br>
    <b>6. Interleaving</b> (Bjork) — Quiz mezcla preguntas de todos los artículos.<br><br>
    <b>7. Revisión espaciada</b> (Ebbinghaus 1885; Cepeda 2006) — 3 sesiones: hoy, 7 días, 30 días.</p></div>
    <div class="help-item"><h4>Antes vs después</h4><p>
    <b>Sin CRISOL:</b> 5-6h/artículo · 20% retención a 30 días · releer todo al escribir · notas dispersas<br>
    <b>Con CRISOL:</b> 2-3h en 3 sesiones · 80% retención · evaluación posicional lista · todo conectado</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Flujo de trabajo recomendado</div><div class="help-body">
    <div class="help-item"><h4>Día 0 — Procesamiento + Pre-lectura + Puente (25 min)</h4><p>
    Pega el texto del artículo en Claude Code + <span class="key">/sila</span>. Mientras se procesa, prepara café.<br>
    Abre Pre-lectura: posicionamiento, esqueleto, alertas, citables (7 min).<br>
    Completa el Puente: 5 preguntas que conectan con tu tesis (12 min).</p></div>
    <div class="help-item"><h4>Día 0 — Lectura anotada + Consolidación (50-70 min)</h4><p>
    Texto anotado párrafo por párrafo (Enter o TTS para avanzar).<br>
    Por cada párrafo: lee → evalúa claim (S/C/N) → responde ¿por qué? → auto-explicación si es difícil.<br>
    Al final de cada sección: retrieval + termómetro de confianza.</p></div>
    <div class="help-item"><h4>Día 7 — Sesión 2 (15 min)</h4><p>Quiz interleaved con artículos anteriores. Revisar claims.</p></div>
    <div class="help-item"><h4>Día 30 — Sesión 3 (10 min)</h4><p>Glosario como auto-examen. Retrieval difícil. 2 conexiones con otros artículos en el Mapa.</p></div>
    <div class="help-item"><h4>Al escribir tu investigación</h4><p>
    1. <b>Mi tesis</b> → claims cross-article listos para usar<br>
    2. <b>Mis escritos</b> → editor con citas vinculadas + plantillas académicas<br>
    3. No vuelves a releer. Todo está evaluado y conectado.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Navegación general</div><div class="help-body">
    <div class="help-item"><h4>📑 Pestañas por artículo (8)</h4><p>
    <b>Dashboard</b> — KPIs, revisión espaciada, continuar lectura, claims<br>
    <b>Pre-lectura</b> — 5 sub-tabs: posicionamiento, esqueleto, resumen, alertas, citables<br>
    <b>Puente</b> — 5 preguntas que conectan el texto con tu tesis<br>
    <b>Texto anotado</b> — Lectura principal con herramientas interactivas<br>
    <b>Glosario</b> — 3 sub-tabs: conceptos, mapa jerárquico, tensiones<br>
    <b>Reflexiones</b> — 8 bloques: impresión, conexiones, preguntas, textos, acciones, dudas, agenda, notas<br>
    <b>Mapa</b> — Diálogos inter-textuales: converge, tensiona, abre preguntas<br>
    <b>Flashcards</b> — Cards de estudio + modo estudio</p></div>
    <div class="help-item"><h4>📌 Sidebar jerárquico</h4><p>
    <b>📊 Vista general</b> — Home: proyectos, pipeline, Kanban, KPIs, búsqueda global<br>
    <b>▸ Proyectos</b> — Agrupados por eje, propios + compartidos<br>
    <b>▸ Mis escritos</b> — Agrupados por tags<br>
    <b>▸ Artículos</b> — Agrupados por categoría + importar .json<br>
    <b>▸ Herramientas</b> — PRISMA, Kanban, Pipeline, Mi tesis, Quiz, Comparar, Reporte</p></div>
    <div class="help-item"><h4>🔨 Workspace tabs</h4><p>Barra inferior con hasta 4 pestañas abiertas. 💡 Botón de captura rápida: anota ideas → Kanban.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Herramientas por párrafo</div><div class="help-body">
    <div class="help-item"><h4>📖 Párrafos (acordeones)</h4><p>Click para abrir. Solo uno abierto a la vez. Highlights de colores: <span style="background:var(--hla);padding:2px 5px;border-radius:3px;">Autores</span> <span style="background:var(--hlt);padding:2px 5px;border-radius:3px;">Términos</span> <span style="background:var(--hlk);padding:2px 5px;border-radius:3px;">Clave</span> <span style="background:var(--hle);padding:2px 5px;border-radius:3px;">Ejemplos</span></p></div>
    <div class="help-item"><h4>→ Avanzar</h4><p><b>"Siguiente párrafo →"</b> o <span class="key">Enter</span>. Marca como leído y abre el siguiente.</p></div>
    <div class="help-item"><h4>🔊 TTS con word tracking</h4><p>Cada palabra se ilumina mientras se pronuncia. Avanza automáticamente entre párrafos y secciones.</p></div>
    <div class="help-item"><h4>🎤 Dictado por voz</h4><p>Botón 🎤 al lado de cada textarea. Funciona en español.</p></div>
    <div class="help-item"><h4>✓/✗/― Claims</h4><p>Evalúa: <span style="color:var(--green);">apoya</span> / <span style="color:var(--red);">contrasta</span> / <span style="color:var(--tx3);">neutro</span>. Atajos: <span class="key">S</span> <span class="key">C</span> <span class="key">N</span>. Nota explicativa. Detector de sesgo si >85% apoyan.</p></div>
    <div class="help-item"><h4>📝❓💡✍</h4><p><b>Anotaciones</b> (pre-generadas) · <b>¿Por qué?</b> (elaborativa) · <b>Explicar</b> (auto-explicación) · <b>Reflexión</b> (notas libres)</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Proyectos y colaboración</div><div class="help-body">
    <div class="help-item"><h4>📁 Crear proyecto</h4><p>Sidebar → <b>"+ Nuevo proyecto"</b> → nombre, descripción, deadline, carpeta Drive. Agregar artículos y documentos desde el dashboard del proyecto.</p></div>
    <div class="help-item"><h4>🔄 Workflow</h4><p>Selecciona un modo de producción (🧬 /dr, 🔬 clo-author, o 🔗 Mixto) desde los botones en la cabecera del workflow. El modo activo reemplaza las fases estándar con un wizard especializado. Si no seleccionas ningún modo, se muestran las 9 fases genéricas (Ideación → Publicación).</p></div>
    <div class="help-item"><h4>🧬🔬🔗 Tres modos de producción doctoral</h4><p>En la barra de workflow, tres botones activan modos especializados:<br><br>
    <b>🧬 /dr</b> — Tesis y ensayos teóricos en español. 10 fases: 🔭 Exploración → 📖 Lectura → ✍ Escritura → 🔍 Crítica → 🧬 Humanización → 📎 Verificación → 🧠 Profundización → 💎 Impacto → ⚖ Benchmarking → 🚀 Entrega. Incluye 4 agentes en review, 30 principios de escritura, mentor socrático, abogado del diablo, evaluación de impacto con 4 agentes antagónicos, y benchmarking contra publicaciones ancla.<br><br>
    <b>🔬 clo-author</b> — Papers empíricos con R, LaTeX, inglés. 7 fases: Descubrimiento → Estrategia → Análisis → Escritura → Peer Review simulado → R&R → Submission. Basado en clo-author v3.1.1 (16 agentes, worker-critic pairs).<br><br>
    <b>🔗 Mixto</b> — Ambos simultáneamente. Marco teórico con /dr + validación empírica con clo-author. Los outputs de un sistema alimentan los prompts del otro automáticamente.<br><br>
    Cada proyecto elige su modo independientemente. Puedes tener un proyecto teórico en 🧬 /dr y otro empírico en 🔬 clo-author al mismo tiempo.</p></div>
    <div class="help-item"><h4>🚧 Gates socráticos obligatorios</h4><p>Al avanzar de fase, CRISOL muestra un gate con dos secciones:<br><br>
    <b>📋 Verificación:</b> Preguntas de check rápido (dropdowns).<br>
    <b>🧠 Reflexión socrática:</b> Preguntas abiertas que el investigador DEBE responder por escrito (mínimo 20 caracteres). Sin respuesta, no se pasa el gate. 19 preguntas socráticas distribuidas en 9 gates.<br><br>
    Las respuestas socráticas se guardan en Supabase para que Claude las lea y personalice las siguientes interacciones.<br><br>
    <b>🧬 /dr (9 gates):</b><br>
    Exploración (¿pregunta precisa? + reflexión sobre gap) · Lectura (¿conexiones reales? + reflexión sobre cambios) · Escritura (¿autoría verificable? + reflexión sobre contribución y decisiones) · Crítica (¿score ≥80? + reflexión sobre debilidades) · Humanización (¿anti-IA ≥85? + reflexión sobre voz) · Verificación (ZERO TOLERANCIA: gate NO se puede saltar + reflexión sobre citación) · Profundización (¿respondiste mentor y diablo? + respuestas escritas) · Impacto (¿contribución nombrable?) · Benchmarking (¿posición relativa conocida?)<br><br>
    <b>🔬 clo-author (5 gates con scores de critics)</b><br><br>
    Los gates son personales — cada investigador los pasa independientemente.</p></div>
    <div class="help-item"><h4>🌿 Ramas argumentativas</h4><p>Cuando emerge un replanteamiento, en vez de reabrir una fase (destruye trazabilidad), puedes <b>bifurcar el proyecto</b>:<br><br>
    Click <b>🌿 Bifurcar</b> en el wizard → nombra la rama → se crea una copia desde la fase actual.<br><br>
    La rama hereda todo el trabajo previo pero permite explorar un argumento alternativo sin afectar la línea principal.<br><br>
    <b>4 estados:</b> 🔵 En curso · ⏸ En espera · ✗ Descartada · ✅ Completada<br>
    <b>📌 Notas:</b> Agrega observaciones a cada rama — documenta por qué bifurcaste, qué descubriste, por qué descartaste.<br>
    <b>🧊 Congelar:</b> Crea un snapshot inmutable antes de presentar al comité. La rama sigue editable, el snapshot queda como registro permanente.<br>
    <b>Eliminar:</b> Solo ramas sin sub-ramas. Main nunca se elimina.<br><br>
    El portafolio incluye TODAS las ramas (activas, descartadas, completadas) como evidencia de exploración intelectual genuina.</p></div>
    <div class="help-item"><h4>📎 Artefactos del proceso</h4><p>Cada fase produce artefactos (borradores, scores, fichas, decisiones). La sección <b>"📎 Artefactos"</b> los registra con:<br><br>
    <b>11 tags transversales</b> en 3 categorías:<br>
    Sustancia: 📜 Argumento · 🔗 Síntesis · 📊 Evidencia · 🧭 Diseño<br>
    Proceso: 💭 Reflexión · ⚡ Decisión · 🔍 Crítica<br>
    Integridad: ✅ Verificación · 👣 Trazabilidad · 🎚 Calibración · 📌 Otro<br><br>
    Cada artefacto tiene: nombre, tag, score (opcional), delta vs iteración anterior, estado (borrador/revisado/final), enlaces Google Drive, y notas de reflexión.<br><br>
    La <b>trayectoria de scores</b> muestra visualmente la evolución: [72] → [78 +6] → [85 +7].<br>
    El botón <b>📊 Descargar portafolio</b> genera un .md completo para el comité.</p></div>
    <div class="help-item"><h4>🔄 Conexión Claude ↔ CRISOL</h4><p>Claude Code y CRISOL se comunican directamente vía Supabase:<br><br>
    <b>Claude → CRISOL:</b> Cuando /dr verify detecta una cita fabricada, escribe una alerta que CRISOL muestra como bloqueo rojo. Cuando /dr mentor dialoga, guarda las preguntas y respuestas para personalizar gates futuros.<br><br>
    <b>CRISOL → Claude:</b> Cuando completas un gate socrático, las respuestas se guardan para que Claude las lea y ajuste su evaluación. Cuando avanzas de fase, Claude sabe en qué fase estás y aplica severidad proporcional (×0.5 en exploración, ×1.25 en entrega).<br><br>
    Todo funciona automáticamente. Si no hay conexión, las skills funcionan igual — solo pierden el contexto personalizado.</p></div>
    <div class="help-item"><h4>👥 Colaboración</h4><p>
    <b>Invitar:</b> Dashboard del proyecto → <b>"Invitar"</b> → genera link con token (7 días)<br>
    <b>Roles:</b> Coautor (ve todo, gates propios) · Reviewer (lectura + comentarios) · Lector (solo docs publicados)<br>
    <b>Principio:</b> "Lo que produces es compartido, lo que piensas es personal"<br>
    <b>PRISMA:</b> Toggle "Mi vista / Vista de [coautor]" para ver el observatorio de otro miembro</p></div>
    <div class="help-item"><h4>📝 Bitácora</h4><p>Registra cada sesión de trabajo en 30 segundos: tipo, nota, enlaces, prompt usado, insight. Los insights se promueven a Decisiones clave.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> PRISMA — Observatorio de Investigación</div><div class="help-body">
    <div class="help-item"><h4>🔬 ¿Qué es PRISMA?</h4><p><b>Perspectiva de la Investigación: Síntesis, Mapa y Análisis</b> — un observatorio que construye sentido a partir de tus escritos. Opera a nivel de tu investigación completa.</p></div>
    <div class="help-item"><h4>Las 6 pestañas</h4><p>
    <b>🌱 Jardín</b> — Documentos como organismos: Semilla → Brote → Árbol<br>
    <b>📊 Matriz</b> — Documentos × temas con detección de gaps<br>
    <b>🎯 Argumento</b> — Pregunta → argumento central → premisas con nivel de soporte<br>
    <b>❓ Preguntas</b> — Preguntas emergentes con estado y tipo<br>
    <b>🕳 Vacíos</b> — Gaps y fortalezas de tu investigación<br>
    <b>📈 Evolución</b> — Timeline de tu pensamiento</p></div>
    <div class="help-item"><h4>💾 Export / 📂 Import</h4><p>PRISMA se regenera completo cada vez que /sila procesa tu corpus. Usa 💾 para exportar como JSON y 📂 para importar.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Datos, respaldo y seguridad</div><div class="help-body">
    <div class="help-item"><h4>☁ Auto-guardado</h4><p>Cada cambio se guarda en Supabase en tiempo real (2s debounce). Tus datos están en la nube, accesibles desde cualquier dispositivo.</p></div>
    <div class="help-item"><h4>💾 Sistema de respaldo (3 niveles)</h4><p>
    <b>Automático:</b> Cada 30 minutos, si hubo cambios, CRISOL guarda un backup completo en Supabase. No necesitas hacer nada — es silencioso.<br><br>
    <b>Manual:</b> Sidebar → ⚙ → <b>"💾 Backup completo"</b> descarga un JSON con TODOS tus datos de Supabase (proyectos, documentos, diálogo socrático, alertas, artefactos, todo). Úsalo para tener una copia física en tu máquina.<br><br>
    <b>Vía /sync:</b> Al ejecutar <span class="key">/sync</span> en Claude Code, además de sincronizar con Obsidian, se guarda un backup en <code>G:\Mi unidad\RESPALDOS\CRISOL\</code> con retención inteligente: último + 12 semanales + todos los mensuales (~100 MB/año).</p></div>
    <div class="help-item"><h4>📂 Restaurar</h4><p>Si pierdes datos, sube el JSON de backup con <b>"📂 Restaurar"</b> en ⚙. CRISOL reconstruye todo: proyectos, documentos, gates, ramas, artefactos.</p></div>
    <div class="help-item"><h4>🔐 Acceso por invitación</h4><p>CRISOL requiere código de invitación para registrarse. Los nuevos usuarios solicitan acceso con un formulario. Los administradores aprueban/rechazan desde ⚙ → 📨 Solicitudes de invitación.</p></div>
    <div class="help-item"><h4>📄 Importar artículo</h4><p>Sidebar → Artículos → <b>"+ Importar artículo (.json)"</b>. Sube un artículo procesado con /sila.</p></div>
    <div class="help-item"><h4>🔔 Notificaciones</h4><p>Badge en el sidebar. Se activan para invitaciones aceptadas y solicitudes de acceso pendientes (admin).</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Skills para Claude Code (descargables)</div><div class="help-body">
    <div class="help-item"><h4>¿Qué son las skills?</h4><p>Las skills son instrucciones que Claude Code ejecuta automáticamente. Se organizan en 3 categorías: procesamiento de artículos (/sila), producción doctoral (/dr), y paper empírico (clo-author). Descarga los archivos y colócalos en la carpeta de skills de tu Claude Code.</p></div>

    <div class="help-item"><h4 style="color:var(--gold);">— Procesamiento de artículos —</h4></div>

    <div class="help-item"><h4>📄 /sila — Procesar artículos académicos</h4><p>Transforma cualquier artículo académico en un documento Word (.docx) + datos JSON importables a CRISOL + notas Obsidian + flashcards Anki.<br><br>
    <b>Uso:</b> Pega el texto de un artículo en Claude Code y escribe <span class="key">/sila</span><br>
    <b>Resultado:</b> .docx + .json (importar en CRISOL → Artículos → Importar)<br><br>
    <a href="downloads/skills/SKILL_sila.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_sila.md</a><br>
    <a href="downloads/skills/sila_metodologia.md" download style="color:var(--blue);text-decoration:underline;">⬇ Referencia: metodologia.md</a><br>
    <a href="downloads/skills/sila_obsidian_schema.md" download style="color:var(--blue);text-decoration:underline;">⬇ Referencia: obsidian_schema.md</a></p></div>
    <div class="help-item"><h4>🔬 /prisma — Descubrir tu metarrelato investigativo</h4><p>Lee tus propios escritos (PDFs, borradores, ensayos) y descubre el argumento central emergente, los vacíos, las preguntas implícitas, y la evolución de tu pensamiento.<br><br>
    <b>Uso:</b> Adjunta tus PDFs en Claude Code y escribe <span class="key">/prisma</span><br>
    <b>Resultado:</b> PRISMA.json importable con merge inteligente<br><br>
    <a href="downloads/skills/SKILL_prisma.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_prisma.md</a></p></div>
    <div class="help-item"><h4>🔄 /sync — Sincronizar con Obsidian + Anki</h4><p>Descarga tus anotaciones desde Supabase y las escribe como notas en tu bóveda Obsidian local.<br><br>
    <b>Uso:</b> <span class="key">/sync</span> al volver a tu PC<br><br>
    <a href="downloads/skills/SKILL_sync.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_sync.md</a></p></div>

    <div class="help-item"><h4 style="color:var(--purple);">— 🧬 /dr — Producción doctoral (9 skills) —</h4></div>

    <div class="help-item"><h4>¿Qué es /dr?</h4><p>Sistema integral para producción de textos doctorales con IA. 9 comandos que cubren el ciclo completo: lectura → escritura → revisión → humanización → verificación → profundización → entrega. Incluye score compuesto de 6 componentes, quality gates numéricos, y reporte de trazabilidad. Calibrado al estilo del investigador.<br><br>
    <b>Activar:</b> En cualquier proyecto → botón 🧬 /dr en la barra de workflow<br>
    <b>El wizard guía paso a paso</b> con prompts copiables y campos para pegar outputs.</p></div>
    <div class="help-item"><h4>📖 /dr read — Lector profundo</h4><p>Lee con lente de tesis propia. Produce ficha de explotación: clasificación A/B/C/D, conexiones, citas textuales, tensiones, mapa de uso.<br>
    <b>Modos:</b> <span class="key">/dr read</span> · <span class="key">--gap</span> · <span class="key">--compare</span> · <span class="key">--scan</span></p></div>
    <div class="help-item"><h4>✍ /dr write — Escritor doctoral</h4><p>Genera borradores con esqueleto aprobado y estilo calibrado. Worker-critic con autoevaluación.<br>
    <b>Modos:</b> <span class="key">section</span> · <span class="key">draft</span> · <span class="key">extend</span> · <span class="key">rewrite</span></p></div>
    <div class="help-item"><h4>🔍 /dr review — Crítico adversarial (4 agentes)</h4><p>4 agentes independientes en paralelo: (1) Crítico de contenido (CT+PL+RM+IA), (2) Humanizer (15 patrones anti-IA), (3) Verificador de citas (F1-F5), (4) Evaluador de 30 principios de escritura. Phase-sensitive severity (×0.5 en exploración a ×1.25 en entrega). Cross-round learning (errores recurrentes ×1.5). Escribe alertas a CRISOL vía Supabase.</p></div>
    <div class="help-item"><h4>🧬 /dr humanize — Detector anti-IA</h4><p>15 patrones de escritura IA en 3 niveles: CRÍTICO (listitis, coletillas, hedging), ALTO (paralelismo, vocabulario hiperpulido), MEDIO (oraciones uniformes, verbos débiles). Score 0-100, objetivo ≥85.</p></div>
    <div class="help-item"><h4>📎 /dr verify — Verificador de citas</h4><p>Verifica TODAS las citas contra PDFs originales. 5 tipos de error: F1 Fabricada (-20, bloquea entrega), F2 Distorsionada (-10), F3 Descontextualizada (-6), F4 Inexacta (-3), F5 Inverificable (-5).</p></div>
    <div class="help-item"><h4>🧠 /dr mentor — Mentor socrático</h4><p>Preguntas que obligan a pensar más profundo. Anti-sycophancy: nunca halaga sin sustancia.<br>
    <b>Modos:</b> <span class="key">--defend</span> · <span class="key">--clarify</span> · <span class="key">--connect</span></p></div>
    <div class="help-item"><h4>😈 /dr devil — Abogado del diablo</h4><p>Ataques sistemáticos para fortalecer el argumento. Steelman antes de destruir. 4 niveles: amigable, reviewer, hostil, existencial.<br>
    <b>Modos:</b> <span class="key">--reviewer CMR</span> · <span class="key">--defense</span> · <span class="key">--steelman</span></p></div>
    <div class="help-item"><h4>💎 /dr impact — Evaluación de impacto</h4><p>4 agentes antagónicos evalúan la contribución del artículo en 6 dimensiones: Originalidad (Corley & Gioia), Novedad (Davis), Utilidad, Claridad (Suddaby), Generalidad (Whetten), Rigor causal. Identifica vacíos en la literatura, rankea aportes, detecta tensiones entre dimensiones, sugiere párrafos de posicionamiento explícito. Score max 24 por vacío.</p></div>
    <div class="help-item"><h4>⚖ /dr benchmark — Benchmarking contra anclas</h4><p>Compara tu artículo contra publicaciones de referencia en 12 dimensiones. Modo <span class="key">--suggest</span>: Claude analiza tus fuentes citadas y propone 5-8 anclas candidatas. Tú evalúas, seleccionas 3-4, descargas los PDFs, y Claude ejecuta la comparación. Anclas contextuales al artículo, no fijas.</p></div>
    <div class="help-item"><h4>📊 /dr report — Reporte de trazabilidad</h4><p>6 secciones: ficha técnica, genealogía del argumento, trayectoria de calidad, integridad de fuentes, decisiones del investigador, declaración metodológica. Documenta TODO el proceso para el comité.</p></div>
    <div class="help-item"><h4>📓 /dr journal — Diario de investigación</h4><p>Registro automático de cada acción /dr con timestamp, comando, documento, resultado, score.</p></div>
    <div class="help-item"><p><b>Descarga todas las skills /dr desde el wizard:</b> cada tarea con botón 📥 Skill descarga la guía correspondiente. O descarga el paquete completo:<br><br>
    <button class="btn bo" onclick="downloadDrSkill('dr_read')" style="font-size:12px;margin:2px;">📥 /dr read</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_write')" style="font-size:12px;margin:2px;">📥 /dr write</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_review')" style="font-size:12px;margin:2px;">📥 /dr review</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_humanize')" style="font-size:12px;margin:2px;">📥 /dr humanize</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_verify')" style="font-size:12px;margin:2px;">📥 /dr verify</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_mentor')" style="font-size:12px;margin:2px;">📥 /dr mentor</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_devil')" style="font-size:12px;margin:2px;">📥 /dr devil</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_report')" style="font-size:12px;margin:2px;">📥 /dr report</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_impact')" style="font-size:12px;margin:2px;">📥 /dr impact</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_benchmark')" style="font-size:12px;margin:2px;">📥 /dr benchmark</button></p></div>

    <div class="help-item"><h4 style="color:#2dd4bf;">— 🔬 clo-author — Paper empírico (10 comandos) —</h4></div>

    <div class="help-item"><h4>¿Qué es clo-author?</h4><p>Sistema para producción de papers empíricos cuantitativos. Basado en <a href="https://github.com/hugosantanna/clo-author" target="_blank" style="color:#2dd4bf;">clo-author v3.1.1</a> (Hugo Sant'Anna, Emory). 16 agentes organizados en 7 worker-critic pairs con separación estricta. Phase-sensitive severity. ~40 journal profiles.<br><br>
    <b>Activar:</b> En cualquier proyecto → botón 🔬 clo-author → configurar directorio del proyecto<br>
    <b>Requiere:</b> Claude Code + directorio local con estructura de proyecto</p></div>
    <div class="help-item"><h4>10 comandos clo-author</h4><p>
    <span class="key">/new-project</span> — Inicializar proyecto (estructura de carpetas, journal, agentes)<br>
    <span class="key">/discover</span> — Revisión de literatura (librarian) + evaluación de datos (explorer)<br>
    <span class="key">/strategize</span> — Estrategia de identificación causal (strategist)<br>
    <span class="key">/analyze</span> — Pipeline de datos + estimación en R/Stata (coder)<br>
    <span class="key">/write</span> — Manuscrito LaTeX + humanizer pass de 24 categorías (writer)<br>
    <span class="key">/review</span> — Peer review simulado: editor + 2 referees ciegos<br>
    <span class="key">/revise</span> — R&R: clasificación en 5 categorías + response letter<br>
    <span class="key">/talk</span> — Presentación académica (Beamer/RevealJS)<br>
    <span class="key">/submit</span> — Verificación final + replication package<br>
    <span class="key">/tools</span> — Utilidades: verify, domain-profile, etc.</p></div>
    <div class="help-item"><h4>Instalación clo-author</h4><p>
    1. En Claude Code, clona el repositorio: <span class="key">git clone https://github.com/hugosantanna/clo-author</span><br>
    2. Copia la carpeta <span class="key">.claude/</span> al directorio de tu proyecto<br>
    3. En CRISOL, activa 🔬 clo-author y configura la ruta al directorio<br>
    4. El wizard te guía paso a paso con prompts que incluyen <span class="key">cd [directorio]</span> automáticamente</p></div>

    <div class="help-item"><h4 style="color:var(--gold);">— Instalación general —</h4></div>

    <div class="help-item"><h4>Estructura de archivos</h4><p>
    <span class="key">~/.claude/skills/sila/SKILL.md</span> + references/<br>
    <span class="key">~/.claude/skills/prisma/SKILL.md</span><br>
    <span class="key">~/.claude/skills/sync/SKILL.md</span><br>
    <span class="key">~/.claude/skills/dr/SKILL.md</span> + references/ (8 archivos)<br>
    <span class="key">[proyecto]/.claude/</span> (clo-author, por proyecto)<br><br>
    Reinicia Claude Code después de instalar. Las skills aparecen como comandos con /.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Atajos de teclado</div><div class="help-body">
    <div class="help-item"><p>
    <span class="key">Enter</span> — Siguiente párrafo (marca como leído)<br>
    <span class="key">S</span> / <span class="key">C</span> / <span class="key">N</span> — Claim: apoya / contrasta / neutro<br>
    <span class="key">Ctrl+F</span> — Buscar en el texto<br>
    <span class="key">Ctrl+Z</span> — Deshacer en editor<br>
    <span class="key">Ctrl+S</span> — Guardar documento<br>
    <span class="key">Escape</span> — Cerrar modales</p></div>
  </div></div>`;
}
