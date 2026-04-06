// ============================================================
// CRISOL — editor.js  (Document editor — full CRUD + blocks + citations + export)
// Extracted from SILA v4 monolith · document module
// ============================================================

import { state } from './state.js';
import { ld, sv, gC, gD, gF, svF, calcProgress, userKey } from './storage.js';
import {
  showToast, getBreadcrumb, loadArticle, closeSidebarMobile,
  saveNavState, restoreNavState, updateTopbar, buildSidebar,
  renderProjectBadges, getProjectsForDoc, goHome, dictWrap,
  buildDocSidebar, buildProjectSidebar, updateSidebarKPIs,
  ensureToolsOpen, getProjects
} from './utils.js';

// ============================================================
// DOC CRUD
// ============================================================
export function getDocs() {
  try { return JSON.parse(localStorage.getItem(userKey('sila_docs'))) || []; }
  catch (e) { return []; }
}

export function saveDocs(docs) {
  try {
    localStorage.setItem(userKey('sila_docs'), JSON.stringify(docs));
    localStorage.setItem(userKey('sila_docs_ts'), String(Date.now()));
  } catch (e) { alert('Error al guardar: almacenamiento lleno.'); }
  syncDocsToCloud(docs);
}

// Sync docs to Supabase (Level 2: full sync + realtime listener)
let docSyncTimer = null;
let docSyncPaused = false;
function syncDocsToCloud(docs) {
  if (!state.sdb || !state.currentUser || docSyncPaused) return;
  clearTimeout(docSyncTimer);
  docSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('sila_docs').upsert({
        user_id: state.currentUser.id,
        data: docs
      }, { onConflict: 'user_id' });
      console.log('Docs synced to cloud');
    } catch (e) { console.error('Doc sync error:', e); }
  }, 2000);
}

// Load docs from cloud on startup + subscribe to realtime changes
export async function initDocsSync() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_docs')
      .select('data,updated_at')
      .eq('user_id', state.currentUser.id)
      .single();
    if (!error && data && data.data) {
      const local = getDocs();
      const cloud = data.data;
      const localTime = localStorage.getItem('sila_docs_ts') || '0';
      const cloudTime = new Date(data.updated_at).getTime();
      if (cloud.length > 0 && (local.length === 0 || cloudTime > parseInt(localTime))) {
        localStorage.setItem('sila_docs', JSON.stringify(cloud));
        localStorage.setItem('sila_docs_ts', String(cloudTime));
        buildDocSidebar();
        console.log('Docs loaded from cloud (' + cloud.length + ' docs)');
      } else if (local.length > 0) {
        syncDocsToCloud(local);
      }
    }
    // Subscribe to realtime changes (Level 2) — ignore own echoes
    state.sdb.channel('docs-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sila_docs', filter: 'user_id=eq.' + state.currentUser.id }, payload => {
        const localTs = parseInt(localStorage.getItem('sila_docs_ts') || '0');
        const cloudTs = new Date(payload.new.updated_at || 0).getTime();
        if (localTs >= cloudTs - 2000) { console.log('Docs realtime: ignoring own echo'); return; }
        console.log('Docs updated from another device');
        docSyncPaused = true;
        const cloud = payload.new.data;
        if (cloud && Array.isArray(cloud)) {
          localStorage.setItem('sila_docs', JSON.stringify(cloud));
          localStorage.setItem('sila_docs_ts', String(cloudTs));
          buildDocSidebar();
          if (state.currentDocId) {
            const doc = cloud.find(d => d.id === state.currentDocId);
            if (doc) renderDocEditor();
          }
        }
        setTimeout(() => { docSyncPaused = false; }, 3000);
      })
      .subscribe();
    console.log('Docs realtime listener active');
  } catch (e) { console.error('Doc sync init error:', e); }
}

// ============================================================
// UNDO STACK
// ============================================================
let docUndoStack = [];
const MAX_UNDO = 30;

export function pushUndo() {
  if (!state.currentDocId) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  docUndoStack.push(JSON.parse(JSON.stringify(doc.blocks)));
  if (docUndoStack.length > MAX_UNDO) docUndoStack.shift();
}

export function docUndo() {
  if (!docUndoStack.length) { alert('Nada que deshacer.'); return; }
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  doc.blocks = docUndoStack.pop();
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.docUndo = docUndo;

// ============================================================
// TEMPLATES
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

// ============================================================
// DOC CREATION / OPEN / CLONE / DELETE / RENAME
// ============================================================
export function createDoc(title) {
  const ct = document.getElementById('ct');
  let h = '<div class="sb"><h3>Nuevo documento</h3></div>';
  h += '<p style="font-size:14px;color:var(--tx2);margin-bottom:14px;">Elige una plantilla para comenzar:</p>';
  Object.entries(DOC_TEMPLATES).forEach(([key, tpl]) => {
    h += `<div class="gd-card" onclick="createDocFromTemplate('${key}')" style="cursor:pointer;">`;
    h += `<h4>${tpl.name}</h4>`;
    h += `<div class="gd-meta">${tpl.blocks.filter(b => b.type === 'heading').length} secciones · ${tpl.blocks.filter(b => b.type === 'text').length} bloques de texto</div>`;
    h += `</div>`;
  });
  state.isHome = false; state.isMiTesis = false; state.currentDocId = null;
  ct.innerHTML = h;
}
window.createDoc = createDoc;

export function createDocFromTemplate(tplKey) {
  const tpl = DOC_TEMPLATES[tplKey]; if (!tpl) return;
  const name = prompt('Nombre del documento:', tpl.name); if (!name) return;
  const existingTags = [...new Set(getDocs().flatMap(d => d.tags || []).filter(t => t && t !== 'sin etiqueta'))];
  const hint = existingTags.length ? '\n\nTags existentes: ' + existingTags.join(', ') : '';
  const tags = prompt('Tags (separados por coma):' + hint, '');
  const tagList = tags ? [...new Set(tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t))] : ['sin etiqueta'];
  if (!tagList.length) tagList.push('sin etiqueta');
  const docs = getDocs();
  const doc = { id: 'doc_' + Date.now(), title: name, template: tplKey, tags: tagList, created: new Date().toISOString(), updated: new Date().toISOString(), blocks: JSON.parse(JSON.stringify(tpl.blocks)) };
  docs.push(doc); saveDocs(docs);
  state.currentDocId = doc.id;
  buildDocSidebar(); renderDocEditor();
}
window.createDocFromTemplate = createDocFromTemplate;

export function openDoc(id) {
  saveNavState();
  state.currentDocId = id; state.isHome = false; state.isMiTesis = false; state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  updateTopbar();
  if (!restoreNavState('doc_' + id)) { renderDocEditor(); }
  closeSidebarMobile();
  const docs = getDocs(); const doc = docs.find(d => d.id === id);
  openInTab('doc', id, doc ? doc.title : 'Documento');
}
window.openDoc = openDoc;

export function cloneDoc(id) {
  const docs = getDocs(); const src = docs.find(d => d.id === id); if (!src) return;
  const clone = JSON.parse(JSON.stringify(src));
  clone.id = 'doc_' + Date.now(); clone.title = src.title + ' (copia)'; clone.created = new Date().toISOString();
  docs.push(clone); saveDocs(docs); buildDocSidebar();
  alert('Documento clonado: ' + clone.title);
}
window.cloneDoc = cloneDoc;

export function deleteDoc(id) {
  if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return;
  const docs = getDocs().filter(d => d.id !== id); saveDocs(docs);
  if (state.currentDocId === id) { state.currentDocId = null; goHome(); }
  buildDocSidebar();
}
window.deleteDoc = deleteDoc;

export function renameDoc(id) {
  const docs = getDocs(); const doc = docs.find(d => d.id === id); if (!doc) return;
  const name = prompt('Nuevo nombre:', doc.title); if (!name) return;
  doc.title = name; doc.updated = new Date().toISOString(); saveDocs(docs);
  buildDocSidebar(); if (state.currentDocId === id) renderDocEditor();
}
window.renameDoc = renameDoc;

// ============================================================
// DOC STATE — save / word count
// ============================================================
export function saveCurrentDoc() {
  if (!state.currentDocId) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  document.querySelectorAll('.doc-block[data-idx]').forEach(el => {
    const idx = parseInt(el.dataset.idx);
    if (isNaN(idx) || !doc.blocks[idx]) return;
    const type = doc.blocks[idx].type;
    if (type === 'text' || type === 'note') {
      const ta = el.querySelector('textarea');
      if (ta) doc.blocks[idx].content = ta.value;
    }
  });
  doc.updated = new Date().toISOString();
  saveDocs(docs);
}
window.saveCurrentDoc = saveCurrentDoc;

export function updateDocWordCount() {
  const el = document.getElementById('doc-wc'); if (!el) return;
  let words = 0;
  document.querySelectorAll('.doc-block[data-type="text"] textarea').forEach(ta => {
    if (ta.value.trim()) words += ta.value.trim().split(/\s+/).length;
  });
  document.querySelectorAll('.doc-block[data-type="cite"]').forEach(b => {
    const frag = b.dataset.fragment; if (frag) words += frag.trim().split(/\s+/).length;
  });
  const cites = document.querySelectorAll('.doc-block[data-type="cite"]').length;
  const secs = document.querySelectorAll('.doc-section').length;
  el.innerHTML = `<b>${words}</b> palabras · ${cites} citas · ${secs} secciones`;
}
window.updateDocWordCount = updateDocWordCount;

export function countDocWords(doc) {
  let words = 0;
  doc.blocks.forEach(b => {
    if (b.type === 'text' && b.content) words += b.content.trim().split(/\s+/).filter(w => w).length;
    if (b.type === 'cite' && b.fragment) words += b.fragment.trim().split(/\s+/).filter(w => w).length;
  });
  return words;
}

// ============================================================
// MARKDOWN RENDERER
// ============================================================
export function renderMd(text) {
  let h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/^---$/gm, '<hr>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;gap:6px;"><span style="color:var(--green);">✓</span><span style="text-decoration:line-through;color:var(--tx3);">$1</span></div>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;gap:6px;"><span style="color:var(--tx3);">☐</span><span>$1</span></div>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="doc-link">$1</a>');
  h = h.replace(/(<li>.*?<\/li>\n?)+/gs, m => '<ul>' + m + '</ul>');
  h = h.replace(/<\/blockquote>\n?<blockquote>/g, '\n');
  return '<p>' + h + '</p>';
}

// ============================================================
// MARKDOWN TOOLBAR
// ============================================================
export function mdInsert(taId, before, after) {
  const ta = document.getElementById(taId); if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = ta.value.substring(start, end);
  ta.setRangeText(before + (sel || 'texto') + after, start, end, 'select');
  ta.focus(); saveCurrentDoc();
}
window.mdInsert = mdInsert;

export function mdLine(taId, prefix) {
  const ta = document.getElementById(taId); if (!ta) return;
  const lineStart = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1;
  ta.setRangeText(prefix, lineStart, lineStart, 'end');
  ta.focus(); saveCurrentDoc();
}
window.mdLine = mdLine;

export function toggleMdPreview(idx) {
  const ta = document.getElementById('doc-ta-' + idx);
  const preview = document.getElementById('doc-preview-' + idx);
  if (!ta || !preview) return;
  if (preview.style.display === 'none') {
    preview.innerHTML = renderMd(ta.value); preview.style.display = 'block'; ta.parentElement.style.display = 'none';
  } else {
    preview.style.display = 'none'; ta.parentElement.style.display = '';
  }
}
window.toggleMdPreview = toggleMdPreview;

export function showMdGuide() {
  alert('Formato Markdown:\n\n**texto** → negrita\n*texto* → cursiva\n__texto__ → subrayado\n~~texto~~ → tachado\n==texto== → resaltado\n- item → viñeta\n1. item → numerado\n- [ ] tarea → checkbox\n> texto → cita\n## Título → encabezado\n--- → separador');
}
window.showMdGuide = showMdGuide;

// ============================================================
// BLOCK STATUS + TITLE + COLLAPSE
// ============================================================
export function renderBlockStatus(i, bs) {
  return `<div class="block-status">
    <button class="bs-idea ${bs === 'idea' ? 'bs-active' : ''}" onclick="event.stopPropagation();setBlockStatus(${i},'idea')" title="Idea">💡</button>
    <button class="bs-draft ${bs === 'draft' ? 'bs-active' : ''}" onclick="event.stopPropagation();setBlockStatus(${i},'draft')" title="Borrador">✏</button>
    <button class="bs-done ${bs === 'done' ? 'bs-active' : ''}" onclick="event.stopPropagation();setBlockStatus(${i},'done')" title="Terminado">✓</button>
    <button class="bs-stale ${bs === 'stale' ? 'bs-active' : ''}" onclick="event.stopPropagation();setBlockStatus(${i},'stale')" title="Desactualizado">⚠</button>
  </div>`;
}

export function setBlockStatus(idx, status) {
  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  doc.blocks[idx].blockStatus = doc.blocks[idx].blockStatus === status ? '' : status;
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.setBlockStatus = setBlockStatus;

export function setBlockTitle(idx, fromBtn) {
  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  if (fromBtn) {
    const title = prompt('Título del bloque (vacío para quitar):', doc.blocks[idx].blockTitle || '');
    if (title === null) return;
    doc.blocks[idx].blockTitle = title.trim() || undefined;
    if (!title.trim()) doc.blocks[idx].blockCollapsed = false;
    doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
    return;
  }
  const span = document.querySelector(`[data-idx="${idx}"] .bt-text`);
  if (!span || span.dataset.editing) return;
  span.dataset.editing = '1';
  const current = doc.blocks[idx].blockTitle || '';
  span.innerHTML = `<input type="text" value="${current.replace(/"/g, '&quot;')}" style="background:var(--bg);border:1px solid var(--gold);border-radius:4px;color:var(--tx);font-size:13px;padding:2px 6px;width:100%;font-family:Inter,sans-serif;" onblur="finishBlockTitle(${idx},this)" onkeydown="if(event.key==='Enter'){this.blur();event.stopPropagation();}if(event.key==='Escape'){this.value='${current.replace(/'/g, "\\'")}';this.blur();}">`;
  span.querySelector('input').focus();
  span.querySelector('input').select();
}
window.setBlockTitle = setBlockTitle;

export function finishBlockTitle(idx, input) {
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  const val = input.value.trim();
  doc.blocks[idx].blockTitle = val || undefined;
  if (!val) doc.blocks[idx].blockCollapsed = false;
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.finishBlockTitle = finishBlockTitle;

export function toggleBlockCollapse(idx) {
  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  doc.blocks[idx].blockCollapsed = !doc.blocks[idx].blockCollapsed;
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.toggleBlockCollapse = toggleBlockCollapse;

// ============================================================
// CITE FRAGMENT EDITING
// ============================================================
export function editCiteFragment(idx, el) {
  if (el.dataset.editing) return;
  el.dataset.editing = '1';
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  const current = doc.blocks[idx].fragment || '';
  el.innerHTML = `<textarea style="width:100%;min-height:60px;background:var(--bg);border:1px solid var(--gold);border-radius:4px;color:var(--tx);font-size:14px;padding:6px 8px;font-family:Inter,sans-serif;font-style:italic;resize:vertical;" onblur="finishCiteFragment(${idx},this)">${current.replace(/</g, '&lt;')}</textarea>`;
  el.querySelector('textarea').focus();
}
window.editCiteFragment = editCiteFragment;

export function finishCiteFragment(idx, ta) {
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.blocks[idx]) return;
  doc.blocks[idx].fragment = ta.value.trim();
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.finishCiteFragment = finishCiteFragment;

// ============================================================
// BLOCK RENDERING
// ============================================================
export function renderDocBlock(block, i, total) {
  const bs = block.blockStatus || '';
  const hasTitle = !!block.blockTitle;
  const isCollapsed = block.blockCollapsed && hasTitle;

  const borderLeft = bs === 'idea' ? 'border-left:4px solid var(--gold);' : bs === 'draft' ? 'border-left:4px solid var(--blue);' : bs === 'done' ? 'border-left:4px solid var(--green);' : bs === 'stale' ? 'border-left:4px solid rgba(255,255,255,0.7);' : '';
  let h = `<div class="doc-block" data-type="${block.type}" data-idx="${i}" style="${borderLeft}" draggable="true" title="Arrastrar para reordenar" ondragstart="dragBlock(event,${i})" ondragover="dragOverBlock(event)" ondragenter="dragEnterBlock(event)" ondragleave="dragLeaveBlock(event)" ondrop="dropBlock(event,${i})"`;
  if (block.type === 'cite') h += ` data-key="${block.articleKey}" data-si="${block.si}" data-pi="${block.pi}" data-fragment="${(block.fragment || '').replace(/"/g, '&quot;')}" data-ref="${(block.ref || '').replace(/"/g, '&quot;')}"`;
  h += `>`;

  // Block title (collapsible) + status
  if (hasTitle) {
    h += `<div class="block-title ${isCollapsed ? '' : 'bt-open'}" onclick="toggleBlockCollapse(${i})">`;
    h += `<span class="bt-chv">▸</span>`;
    h += `<span class="bt-text" ondblclick="event.stopPropagation();setBlockTitle(${i})">${block.blockTitle}</span>`;
    h += renderBlockStatus(i, bs);
    h += `</div>`;
  }

  // Content (hideable)
  h += `<div class="${isCollapsed ? 'block-collapsed' : ''}">`;

  if (block.type === 'text') {
    const safeContent = (block.content || '').replace(/</g, '&lt;');
    h += `<div class="md-toolbar">`;
    h += `<button onclick="mdInsert('doc-ta-${i}','**','**')" title="Negrita"><b>B</b></button>`;
    h += `<button onclick="mdInsert('doc-ta-${i}','*','*')" title="Cursiva"><i>I</i></button>`;
    h += `<button onclick="mdInsert('doc-ta-${i}','__','__')" title="Subrayado"><u>U</u></button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','- ')" title="Viñeta">•</button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','1. ')" title="Numerado">1.</button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','> ')" title="Cita">❝</button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','## ')" title="Título">H</button>`;
    h += `<button onclick="mdInsert('doc-ta-${i}','~~','~~')" title="Tachado" style="text-decoration:line-through;">S</button>`;
    h += `<button onclick="mdInsert('doc-ta-${i}','==','==')" title="Resaltado" style="color:var(--gold);">🖍</button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','- [ ] ')" title="Checkbox">☐</button>`;
    h += `<button onclick="mdLine('doc-ta-${i}','---\\n')" title="Separador">―</button>`;
    h += `<button onclick="toggleMdPreview(${i})" title="Vista previa" style="margin-left:auto;">👁</button>`;
    h += `</div>`;
    h += `<div class="doc-block-text">${dictWrap('<textarea id="doc-ta-' + i + '" onchange="saveCurrentDoc()" oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\';updateDocWordCount();" spellcheck="true">' + safeContent + '</textarea>', 'doc-ta-' + i)}</div>`;
    h += `<div class="md-preview" id="doc-preview-${i}" style="display:none;"></div>`;
  } else if (block.type === 'cite') {
    h += `<div class="doc-block-cite">`;
    h += `<div class="cite-text" ondblclick="editCiteFragment(${i},this)" title="Doble-click para editar">"${block.fragment || ''}"</div>`;
    h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">`;
    h += `<div class="cite-ref" onclick="goToArticlePar('${block.articleKey}',${block.si},${block.pi})">${block.ref || ''} [ver contexto]</div>`;
    h += `</div></div>`;
  } else if (block.type === 'note') {
    h += `<div class="doc-block-note"><textarea onchange="saveCurrentDoc()" placeholder="TODO / nota interna...">${block.content || ''}</textarea></div>`;
  }

  // Block toolbar with status color
  const barClass = bs ? 'bar-' + bs : 'bar-none';
  const statusLabelsMap = { idea: '💡 Idea', draft: '✏ Borrador', done: '✓ Terminado', stale: '⚠ Desactualizado' };
  const statusColorMap = { idea: 'var(--gold)', draft: 'var(--blue)', done: 'var(--green)', stale: 'rgba(255,255,255,0.7)' };
  h += `<div class="doc-block-bar ${barClass}">`;
  if (i > 0) h += `<button onclick="moveBlock(${i},-1)">↑</button>`;
  if (i < total - 1) h += `<button onclick="moveBlock(${i},1)">↓</button>`;
  if (block.type === 'text') h += `<button onclick="speakText(this,document.getElementById('doc-ta-${i}')?.value||'')">🔊</button>`;
  if (block.type === 'cite') h += `<button onclick="speakText(this,'${(block.fragment || '').replace(/'/g, "\\'").substring(0, 500)}')">🔊</button>`;
  h += `<button onclick="setBlockTitle(${i},true)" title="Título">📝</button>`;
  h += renderBlockStatus(i, bs);
  h += `<button class="danger" onclick="removeBlock(${i})">✕</button>`;
  if (bs) {
    const bgMap = { idea: 'rgba(232,168,56,0.2)', draft: 'rgba(93,155,213,0.2)', done: 'rgba(93,187,138,0.2)', stale: 'rgba(150,150,150,0.2)' };
    h += `<span class="bar-status-label" style="color:${statusColorMap[bs] || 'var(--tx3)'};background:${bgMap[bs] || 'transparent'}">${statusLabelsMap[bs] || ''}</span>`;
  }
  h += `</div>`;

  h += `</div>`; // close content wrapper
  h += `</div>`; // close doc-block
  return h;
}

// ============================================================
// SECTION GROUPING UTILITY
// ============================================================
export function getSectionGroups(blocks) {
  const sections = []; let current = { heading: null, headingIdx: -1, children: [] };
  blocks.forEach((b, i) => {
    if (b.type === 'heading') {
      if (current.heading !== null || current.children.length) sections.push(current);
      current = { heading: b, headingIdx: i, children: [] };
    } else {
      current.children.push(b);
    }
  });
  if (current.heading !== null || current.children.length) sections.push(current);
  return sections;
}

export function flattenSections(sections) {
  const blocks = [];
  sections.forEach(sec => {
    if (sec.heading) blocks.push(sec.heading);
    blocks.push(...sec.children);
  });
  return blocks;
}

// ============================================================
// DOC EDITOR RENDERING
// ============================================================
export function renderDocEditor() {
  const ct = document.getElementById('ct');
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId);
  if (!doc) { goHome(); return; }
  const wordCount = countDocWords(doc);
  const citeCount = doc.blocks.filter(b => b.type === 'cite').length;
  const secCount = doc.blocks.filter(b => b.type === 'heading').length;

  let h = getBreadcrumb() + `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
  h += `<h2 style="font-size:clamp(17px,2.5vw,22px);font-weight:800;color:#fff;cursor:pointer;" onclick="renameDoc('${doc.id}')" title="Click para renombrar">${doc.title}</h2>`;
  h += `<div style="display:flex;gap:6px;">`;
  h += `<button class="btn bo" onclick="cloneDoc('${doc.id}')" style="font-size:12px;">Duplicar</button>`;
  h += `<button class="btn bo" onclick="importBlocksUI('${doc.id}')" style="font-size:12px;">Importar</button>`;
  h += `<button class="btn bo" onclick="exportDocAPA('${doc.id}')" style="font-size:12px;">Exportar APA</button>`;
  h += `<button class="btn bo" onclick="deleteDoc('${doc.id}')" style="font-size:12px;color:var(--red);border-color:rgba(224,112,80,0.2);">Eliminar</button>`;
  h += `</div></div>`;
  const status = doc.status || 'borrador';
  const statusLabels = { borrador: 'Borrador', revision: 'En revisión', finalizado: 'Finalizado' };
  const isFrozen = status === 'finalizado';

  const bsIdea = doc.blocks.filter(b => b.blockStatus === 'idea').length;
  const bsDraft = doc.blocks.filter(b => b.blockStatus === 'draft').length;
  const bsDone = doc.blocks.filter(b => b.blockStatus === 'done').length;
  const bsStale = doc.blocks.filter(b => b.blockStatus === 'stale').length;
  const bsStats = (bsIdea + bsDraft + bsDone + bsStale) > 0 ? ` · <span style="color:var(--gold);">💡${bsIdea}</span> <span style="color:var(--blue);">✏${bsDraft}</span> <span style="color:var(--green);">✓${bsDone}</span> <span style="color:rgba(255,255,255,0.7);">⚠${bsStale}</span>` : '';
  h += `<div class="doc-wordcount" id="doc-wc"><b>${wordCount}</b> palabras · ${citeCount} citas · ${secCount} secciones${bsStats} · <span class="doc-status doc-status-${status}" onclick="cycleDocStatus()" title="Click para cambiar estado">${statusLabels[status]}</span></div>`;

  // Link a PDF/versión publicada
  if (doc.pdfLink) {
    h += `<div style="margin:4px 0;"><a href="${doc.pdfLink}" target="_blank" class="doc-link" style="font-size:13px;">📎 ${doc.pdfLink.length > 60 ? doc.pdfLink.substring(0, 60) + '...' : doc.pdfLink}</a> <span onclick="setDocPdfLink()" style="font-size:11px;color:var(--tx3);cursor:pointer;">editar</span></div>`;
  }

  // Tags pills
  const tags = doc.tags || [];
  h += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0 10px;align-items:center;">`;
  tags.forEach((tag, ti) => {
    h += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;background:rgba(232,168,56,0.1);border:1px solid rgba(232,168,56,0.2);font-size:12px;color:var(--gold);">${tag}<span onclick="removeDocTag(${ti})" style="cursor:pointer;opacity:0.5;font-size:10px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">✕</span></span>`;
  });
  h += `<span onclick="addDocTag()" style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:12px;border:1px dashed rgba(220,215,205,0.2);font-size:12px;color:var(--tx3);cursor:pointer;" onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'" onmouseout="this.style.borderColor='rgba(220,215,205,0.2)';this.style.color='var(--tx3)'">+ tag</span>`;
  if (!doc.pdfLink) h += `<span onclick="setDocPdfLink()" style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:12px;border:1px dashed rgba(220,215,205,0.2);font-size:12px;color:var(--tx3);cursor:pointer;" onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--blue)'" onmouseout="this.style.borderColor='rgba(220,215,205,0.2)';this.style.color='var(--tx3)'">📎 link PDF</span>`;
  h += `</div>`;

  // Project badges (bidirectional indicator)
  h += renderProjectBadges(getProjectsForDoc(doc.id));

  // Frozen warning
  if (isFrozen) {
    h += `<div style="padding:10px 14px;background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.15);border-radius:7px;margin-bottom:10px;font-size:13px;color:var(--green);">✓ Documento finalizado — solo lectura. Cambia el estado para editar.</div>`;
  }

  // Group blocks by sections using unified utility
  const rawSections = getSectionGroups(doc.blocks);
  const sections = []; let blockIdx = 0;
  rawSections.forEach(sec => {
    const s = { heading: sec.heading, headingIdx: sec.heading ? blockIdx : -1, blocks: [] };
    if (sec.heading) blockIdx++;
    sec.children.forEach(child => { s.blocks.push({ block: child, idx: blockIdx }); blockIdx++; });
    sections.push(s);
  });

  // Render grouped sections
  sections.forEach((sec, si) => {
    if (sec.heading) {
      const isOpen = sec.heading.open !== false;
      h += `<div class="doc-section" draggable="true" ondragstart="dragSection(event,${si})" ondragover="dragOverBlock(event)" ondragenter="event.currentTarget.classList.add('drag-over')" ondragleave="event.currentTarget.classList.remove('drag-over')" ondrop="dropSection(event,${si})">`;
      h += `<div class="doc-section-head ${isOpen ? 'dh-open' : ''}" onclick="toggleDocSection(${sec.headingIdx})">`;
      h += `<span class="dh-chv">▸</span>`;
      h += `<h3>${sec.heading.content || 'Sección'}</h3>`;
      h += `<div class="sec-actions">`;
      h += `<button onclick="event.stopPropagation();renameHeading(${sec.headingIdx})" title="Renombrar">✏</button>`;
      if (si > 0) h += `<button onclick="event.stopPropagation();moveSectionUp(${si})" title="Subir sección">↑</button>`;
      if (si < sections.length - 1) h += `<button onclick="event.stopPropagation();moveSectionDown(${si})" title="Bajar sección">↓</button>`;
      h += `<button onclick="event.stopPropagation();removeSection(${sec.headingIdx})" title="Eliminar sección" style="color:var(--red);">✕</button>`;
      h += `</div></div>`;
      h += `<div class="doc-section-body ${isOpen ? 'dh-open' : ''}">`;
      sec.blocks.forEach(b => { h += renderDocBlock(b.block, b.idx, doc.blocks.length); });
      const afterIdx = sec.blocks.length ? sec.blocks[sec.blocks.length - 1].idx : sec.headingIdx;
      h += `<div style="display:flex;gap:4px;padding:6px 4px;opacity:0.5;transition:opacity 0.12s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">`;
      h += `<button class="doc-toolbar button" onclick="addBlockAfter(${afterIdx},'text')" style="padding:3px 8px;border:1px dashed rgba(220,215,205,0.15);border-radius:5px;background:transparent;color:var(--tx3);cursor:pointer;font-size:12px;">+ texto</button>`;
      h += `<button class="doc-toolbar button" onclick="openCiteSearchAt(${afterIdx})" style="padding:3px 8px;border:1px dashed rgba(220,215,205,0.15);border-radius:5px;background:transparent;color:var(--tx3);cursor:pointer;font-size:12px;">+ cita</button>`;
      h += `<button class="doc-toolbar button" onclick="addBlockAfter(${afterIdx},'note')" style="padding:3px 8px;border:1px dashed rgba(220,215,205,0.15);border-radius:5px;background:transparent;color:var(--tx3);cursor:pointer;font-size:12px;">+ nota</button>`;
      h += `</div>`;
      h += `</div></div>`;
    } else {
      sec.blocks.forEach(b => { h += renderDocBlock(b.block, b.idx, doc.blocks.length); });
    }
  });

  // Toolbar
  h += `<div class="doc-toolbar">`;
  h += `<button onclick="addDocBlock('heading')">+ Sección</button>`;
  h += `<button onclick="addDocBlock('text')">+ Texto</button>`;
  h += `<button onclick="openCiteSearch()">+ Cita</button>`;
  h += `<button onclick="addDocBlock('note')">+ Nota</button>`;
  h += `<button onclick="docUndo()" title="Ctrl+Z">↩ Deshacer</button>`;
  h += `<button onclick="showMdGuide()" title="Guía de formato">Aa</button>`;
  h += `<button onclick="readDoc()" style="margin-left:auto;">🔊 Leer todo</button>`;
  h += `</div>`;

  // Coverage
  const cited = new Set();
  doc.blocks.filter(b => b.type === 'cite').forEach(b => cited.add(b.articleKey));
  const manifest = window.SILA_MANIFEST || [];
  const uncited = manifest.filter(a => !cited.has(a.key));
  if (uncited.length && cited.size > 0) {
    h += `<div style="margin-top:14px;padding:10px 14px;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.12);border-radius:7px;">`;
    h += `<div style="font-size:13px;color:var(--gold);font-weight:600;margin-bottom:4px;">Artículos no citados:</div>`;
    h += uncited.map(a => `<span style="font-size:13px;color:var(--tx3);">${a.authors} (${a.year})</span>`).join(' · ');
    h += `</div>`;
  }

  // Preserve scroll position and focused element before re-render
  const prevScroll = ct.scrollTop;
  const activeEl = document.activeElement;
  const activeId = activeEl?.id || '';
  const activeSelStart = activeEl?.selectionStart;
  const activeSelEnd = activeEl?.selectionEnd;

  ct.innerHTML = h;
  // Auto-resize textareas
  document.querySelectorAll('.doc-block textarea').forEach(ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; });
  // Apply frozen state
  if (isFrozen) ct.classList.add('doc-frozen'); else ct.classList.remove('doc-frozen');

  // Restore scroll position
  ct.scrollTop = prevScroll;
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) { el.focus(); if (typeof el.selectionStart === 'number') { el.selectionStart = activeSelStart || 0; el.selectionEnd = activeSelEnd || 0; } }
  }
}

// ============================================================
// BLOCK OPERATIONS
// ============================================================
export function addDocBlock(type) {
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  if (type === 'heading') {
    const name = prompt('Nombre de la sección:'); if (!name) return;
    doc.blocks.push({ type: 'heading', content: name, open: true });
    doc.blocks.push({ type: 'text', content: '' });
  } else {
    doc.blocks.push({ type, content: '' });
  }
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
  setTimeout(() => { const tas = document.querySelectorAll('.doc-block textarea'); if (tas.length) tas[tas.length - 1].focus(); }, 100);
}
window.addDocBlock = addDocBlock;

let citeInsertAfterIdx = -1;

export function addBlockAfter(afterIdx, type) {
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  doc.blocks.splice(afterIdx + 1, 0, { type, content: '' });
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
  setTimeout(() => { const ta = document.querySelector('.doc-block[data-idx="' + (afterIdx + 1) + '"] textarea'); if (ta) ta.focus(); }, 100);
}
window.addBlockAfter = addBlockAfter;

export function openCiteSearchAt(afterIdx) {
  citeInsertAfterIdx = afterIdx;
  openCiteSearch();
}
window.openCiteSearchAt = openCiteSearchAt;

export function moveBlock(idx, dir) {
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const newIdx = idx + dir; if (newIdx < 0 || newIdx >= doc.blocks.length) return;
  [doc.blocks[idx], doc.blocks[newIdx]] = [doc.blocks[newIdx], doc.blocks[idx]];
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.moveBlock = moveBlock;

export function removeBlock(idx) {
  if (!confirm('¿Eliminar este bloque?')) return;
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  if (doc.blocks.length <= 1) { alert('Un documento necesita al menos un bloque.'); return; }
  doc.blocks.splice(idx, 1);
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.removeBlock = removeBlock;

// ============================================================
// SECTION OPERATIONS
// ============================================================
export function moveSectionDir(secIdx, dir) {
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const sections = getSectionGroups(doc.blocks);
  const newIdx = secIdx + dir;
  if (newIdx < 0 || newIdx >= sections.length) return;
  [sections[secIdx], sections[newIdx]] = [sections[newIdx], sections[secIdx]];
  doc.blocks = flattenSections(sections);
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}

export function moveSectionUp(secIdx) { moveSectionDir(secIdx, -1); }
window.moveSectionUp = moveSectionUp;

export function moveSectionDown(secIdx) { moveSectionDir(secIdx, 1); }
window.moveSectionDown = moveSectionDown;

export function removeSection(headingIdx) {
  if (!confirm('¿Eliminar esta sección y todo su contenido?')) return;
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  let end = doc.blocks.length;
  for (let i = headingIdx + 1; i < doc.blocks.length; i++) { if (doc.blocks[i].type === 'heading') { end = i; break; } }
  doc.blocks.splice(headingIdx, end - headingIdx);
  if (!doc.blocks.length) doc.blocks = [{ type: 'text', content: '' }];
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.removeSection = removeSection;

export function renameHeading(idx) {
  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const name = prompt('Renombrar sección:', doc.blocks[idx].content); if (!name) return;
  doc.blocks[idx].content = name; doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.renameHeading = renameHeading;

export function toggleDocSection(headingIdx) {
  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  doc.blocks[headingIdx].open = !doc.blocks[headingIdx].open;
  saveDocs(docs); renderDocEditor();
}
window.toggleDocSection = toggleDocSection;

// ============================================================
// DRAG & DROP for blocks and sections
// ============================================================
let dragType = null;
let dragIdx = null;

export function dragBlock(e, idx) {
  dragType = 'block'; dragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', idx);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}
window.dragBlock = dragBlock;

export function dragSection(e, secIdx) {
  dragType = 'section'; dragIdx = secIdx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'sec:' + secIdx);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}
window.dragSection = dragSection;

export function dragOverBlock(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
window.dragOverBlock = dragOverBlock;

export function dragEnterBlock(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
window.dragEnterBlock = dragEnterBlock;

export function dragLeaveBlock(e) { e.currentTarget.classList.remove('drag-over'); }
window.dragLeaveBlock = dragLeaveBlock;

export function dropBlock(e, targetIdx) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  if (dragType !== 'block' || dragIdx === null || dragIdx === targetIdx) return;
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const block = doc.blocks.splice(dragIdx, 1)[0];
  const insertAt = targetIdx > dragIdx ? targetIdx - 1 : targetIdx;
  doc.blocks.splice(insertAt, 0, block);
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
  dragType = null; dragIdx = null;
}
window.dropBlock = dropBlock;

export function dropSection(e, targetSecIdx) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  if (dragType !== 'section' || dragIdx === null || dragIdx === targetSecIdx) return;
  saveCurrentDoc(); pushUndo();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const sections = getSectionGroups(doc.blocks);
  const moved = sections.splice(dragIdx, 1)[0];
  sections.splice(targetSecIdx, 0, moved);
  doc.blocks = flattenSections(sections);
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
  dragType = null; dragIdx = null;
}
window.dropSection = dropSection;

// ============================================================
// CITATION SEARCH — find and insert citations
// ============================================================
export function openCiteSearch() {
  document.getElementById('cite-search-modal').classList.add('show');
  document.getElementById('cite-search-input').value = '';
  document.getElementById('cite-search-results').innerHTML = '<p style="color:var(--tx3);padding:20px;text-align:center;">Escribe para buscar en todos los artículos</p>';
  setTimeout(() => document.getElementById('cite-search-input').focus(), 100);
}
window.openCiteSearch = openCiteSearch;

export function closeCiteSearch() { document.getElementById('cite-search-modal').classList.remove('show'); }
window.closeCiteSearch = closeCiteSearch;

export async function searchCitations(q) {
  q = q.trim().toLowerCase();
  const results = document.getElementById('cite-search-results');
  if (q.length < 3) { results.innerHTML = '<p style="color:var(--tx3);padding:20px;text-align:center;">Escribe al menos 3 caracteres</p>'; return; }
  const manifest = window.SILA_MANIFEST || [];
  let h = '';
  for (const art of manifest) {
    try { await loadArticle(art.key); } catch (e) { console.warn('Search: could not load', art.key); continue; }
    const data = window.SILA_ARTICLES[art.key]; if (!data || !data.sections) continue;
    data.sections.forEach((sec, si) => {
      if (!sec.paragraphs) return;
      sec.paragraphs.forEach((par, pi) => {
        if (((par.title || '') + ' ' + (par.translation || '') + ' ' + (par.text || '')).toLowerCase().includes(q)) {
          const ref = art.authors + ' (' + art.year + ')';
          const fragment = (par.translation || par.text).substring(0, 200);
          h += `<div class="cite-result" onclick="insertCitation('${art.key}',${si},${pi})">`;
          h += `<div class="cr-ref">${ref} · ${sec.title}</div>`;
          h += `<div class="cr-text">${par.title}: ${fragment}...</div>`;
          h += `</div>`;
        }
      });
    });
  }
  results.innerHTML = h || '<p style="color:var(--tx3);padding:20px;text-align:center;">Sin resultados</p>';
}
window.searchCitations = searchCitations;

export function insertCitation(key, si, pi) {
  closeCiteSearch();
  if (!state.currentDocId) return;
  const data = window.SILA_ARTICLES[key];
  if (!data) { alert('Error: artículo no cargado.'); return; }
  const par = data.sections?.[si]?.paragraphs?.[pi];
  if (!par) { alert('Error: párrafo no encontrado (§' + si + ' p' + pi + ').'); return; }
  const meta = data.meta;
  const sel = window.getSelection().toString().trim();
  const rawFrag = sel.length > 10 ? sel : (par.text || '');
  const fragment = rawFrag.substring(0, 300);
  if (!fragment.trim()) { alert('Párrafo vacío. No se pudo crear cita.'); return; }
  const ref = meta.authors + ' (' + meta.year + ')';

  saveCurrentDoc();
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const citeBlock = { type: 'cite', articleKey: key, si, pi, fragment, ref };
  if (citeInsertAfterIdx >= 0) {
    doc.blocks.splice(citeInsertAfterIdx + 1, 0, citeBlock, { type: 'text', content: '' });
    citeInsertAfterIdx = -1;
  } else {
    doc.blocks.push(citeBlock);
    doc.blocks.push({ type: 'text', content: '' });
  }
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.insertCitation = insertCitation;

// ============================================================
// SEND TO DOC — cite from text selection
// ============================================================
let pendingCiteData = null;

export function citeSelection() {
  const popup = document.getElementById('sel-popup'); popup.classList.remove('show');
  if (!state.selectedText || !state.currentArticleKey || !state.DATA) return;
  const openAcc = document.querySelector('.pb-acc.open');
  if (!openAcc) return;
  const pid = openAcc.id.replace('acc-', '');
  const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
  const si = parseInt(m[1]), pi = parseInt(m[2]);
  pendingCiteData = { key: state.currentArticleKey, si, pi, fragment: state.selectedText, ref: state.DATA.meta.authors + ' (' + state.DATA.meta.year + ')' };
  const docs = getDocs();
  const list = document.getElementById('doc-select-list');
  if (docs.length === 0) {
    list.innerHTML = '<p style="color:var(--tx3);">No tienes documentos. Crea uno nuevo.</p>';
  } else {
    list.innerHTML = docs.map(d => `<div class="gd-card" style="padding:8px 12px;margin:4px 0;cursor:pointer;" onclick="sendCiteToDoc('${d.id}')">${d.title}</div>`).join('');
  }
  document.getElementById('doc-select-modal').classList.add('show');
}
window.citeSelection = citeSelection;

export function sendCiteToDoc(docId) {
  document.getElementById('doc-select-modal').classList.remove('show');
  if (!pendingCiteData) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === docId); if (!doc) return;
  doc.blocks.push({ type: 'cite', ...pendingCiteData });
  doc.blocks.push({ type: 'text', content: '' });
  doc.updated = new Date().toISOString(); saveDocs(docs);
  pendingCiteData = null;
  alert('Cita enviada a "' + doc.title + '"');
}
window.sendCiteToDoc = sendCiteToDoc;

export function createDocFromCite() {
  document.getElementById('doc-select-modal').classList.remove('show');
  if (!pendingCiteData) return;
  const docs = getDocs();
  const doc = { id: 'doc_' + Date.now(), title: 'Nuevo documento', created: new Date().toISOString(), updated: new Date().toISOString(), blocks: [{ type: 'text', content: '' }, { type: 'cite', ...pendingCiteData }, { type: 'text', content: '' }] };
  docs.push(doc); saveDocs(docs);
  pendingCiteData = null; buildDocSidebar();
  alert('Documento creado con la cita.');
}
window.createDocFromCite = createDocFromCite;

export async function createDocFromClaims() {
  const manifest = window.SILA_MANIFEST || [];
  const blocks = [{ type: 'text', content: '' }];
  for (const art of manifest) {
    await loadArticle(art.key);
    const data = window.SILA_ARTICLES[art.key]; if (!data) continue;
    let d = {}; try { const raw = localStorage.getItem('sila4_' + art.key); if (raw) d = JSON.parse(raw); } catch (e) {}
    const claims = d.claims || {}; const notes = d.claimNotes || {};
    Object.entries(claims).forEach(([pid, type]) => {
      if (type !== 'support' && type !== 'contrast') return;
      const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
      const si = parseInt(m[1]), pi = parseInt(m[2]);
      const sec = data.sections[si]; if (!sec) return;
      const par = sec.paragraphs[pi]; if (!par) return;
      blocks.push({ type: 'cite', articleKey: art.key, si, pi, fragment: par.text.substring(0, 300), ref: art.authors + ' (' + art.year + ')' });
      if (notes[pid]) blocks.push({ type: 'text', content: '// ' + notes[pid] });
      else blocks.push({ type: 'text', content: '' });
    });
  }
  if (blocks.length <= 1) { alert('No hay claims evaluados para generar el documento.'); return; }
  const docs = getDocs();
  const doc = { id: 'doc_' + Date.now(), title: 'Marco teórico desde claims', created: new Date().toISOString(), updated: new Date().toISOString(), blocks };
  docs.push(doc); saveDocs(docs); buildDocSidebar();
  state.currentDocId = doc.id; renderDocEditor();
}
window.createDocFromClaims = createDocFromClaims;

// ============================================================
// IMPORT BLOCKS
// ============================================================
export function importBlocksUI(targetId) {
  const docs = getDocs().filter(d => d.id !== targetId);
  if (docs.length === 0) { alert('No hay otros documentos para importar.'); return; }
  const src = prompt('Importar bloques de:\n' + docs.map((d, i) => (i + 1) + '. ' + d.title).join('\n') + '\n\nEscribe el número:');
  if (!src) return;
  const idx = parseInt(src) - 1; if (isNaN(idx) || !docs[idx]) return;
  saveCurrentDoc(); pushUndo();
  const allDocs = getDocs(); const target = allDocs.find(d => d.id === targetId); const source = allDocs.find(d => d.id === docs[idx].id);
  if (!target || !source) return;
  target.blocks.push(...JSON.parse(JSON.stringify(source.blocks)));
  target.updated = new Date().toISOString(); saveDocs(allDocs); renderDocEditor();
  alert('Importados ' + source.blocks.length + ' bloques de "' + source.title + '"');
}
window.importBlocksUI = importBlocksUI;

// ============================================================
// EXPORT APA
// ============================================================
export function buildDocExport(docId) {
  const docs = getDocs(); const doc = docs.find(d => d.id === docId); if (!doc) return '';
  let text = doc.title.toUpperCase() + '\n' + '═'.repeat(doc.title.length) + '\n\n';
  const refs = new Set();
  doc.blocks.forEach(b => {
    if (b.type === 'heading') text += '\n' + b.content + '\n' + '─'.repeat(b.content.length) + '\n\n';
    else if (b.type === 'text' && b.content) text += b.content + '\n\n';
    else if (b.type === 'cite') {
      text += '  "' + b.fragment + '"\n  — ' + b.ref + '\n\n';
      refs.add(b.ref);
    }
  });
  if (refs.size) {
    text += '\n' + '═'.repeat(30) + '\nREFERENCIAS\n' + '═'.repeat(30) + '\n\n';
    [...refs].sort().forEach(r => { text += r + '\n'; });
  }
  return text;
}

export function exportDocAPA(docId) {
  const text = buildDocExport(docId); if (!text) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === docId);
  const h = `<div style="text-align:center;padding:10px;">
    <h3 style="color:#fff;margin-bottom:14px;">Exportar documento</h3>
    <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
      <button class="btn bg" onclick="exportDocxAPA('${docId}');document.getElementById('export-modal').remove();" style="padding:10px 20px;">📄 Word APA (.docx)</button>
      <button class="btn bo" onclick="exportTxt('${docId}');document.getElementById('export-modal').remove();">📝 Texto plano (.txt)</button>
      <button class="btn bo" onclick="exportClipboard('${docId}');document.getElementById('export-modal').remove();">📋 Copiar al portapapeles</button>
    </div>
    <button class="btn bo" onclick="document.getElementById('export-modal').remove();" style="margin-top:12px;font-size:12px;color:var(--tx3);">Cancelar</button>
  </div>`;
  const modal = document.createElement('div');
  modal.id = 'export-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.1);border-radius:12px;padding:24px;max-width:400px;width:90%;">${h}</div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}
window.exportDocAPA = exportDocAPA;

export function exportTxt(docId) {
  const text = buildDocExport(docId);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const docs = getDocs(); const doc = docs.find(d => d.id === docId);
  a.download = (doc ? doc.title : 'documento').replace(/[^a-zA-Z0-9áéíóúñ ]/gi, '_') + '.txt'; a.click();
}
window.exportTxt = exportTxt;

export function exportClipboard(docId) {
  const text = buildDocExport(docId);
  navigator.clipboard.writeText(text).then(() => showToast('Copiado al portapapeles', 'success'));
}
window.exportClipboard = exportClipboard;

export async function exportDocxAPA(docId) {
  const docs = getDocs(); const doc = docs.find(d => d.id === docId); if (!doc) return;
  showToast('Generando .docx APA...', 'info');
  if (!window.docx) {
    try {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    } catch (e) { showToast('Error cargando librería docx', 'error'); return; }
  }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;
  const children = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: doc.title, bold: true, size: 24, font: 'Times New Roman' })] }));
  children.push(new Paragraph({ spacing: { after: 400 }, children: [] }));
  const refs = new Set();
  doc.blocks.forEach(b => {
    if (b.type === 'heading') {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 120 }, children: [new TextRun({ text: b.content || '', bold: true, size: 24, font: 'Times New Roman' })] }));
    } else if (b.type === 'text' && b.content) {
      const lines = b.content.split('\n');
      lines.forEach(line => {
        if (!line.trim()) return;
        const runs = [];
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        parts.forEach(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new TextRun({ text: part.slice(2, -2), bold: true, size: 24, font: 'Times New Roman' }));
          } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new TextRun({ text: part.slice(1, -1), italics: true, size: 24, font: 'Times New Roman' }));
          } else if (part) {
            runs.push(new TextRun({ text: part, size: 24, font: 'Times New Roman' }));
          }
        });
        if (runs.length) children.push(new Paragraph({ spacing: { line: 480, after: 0 }, indent: { firstLine: 720 }, children: runs }));
      });
    } else if (b.type === 'cite') {
      children.push(new Paragraph({
        spacing: { line: 480, after: 0 }, indent: { left: 720 }, children: [
          new TextRun({ text: '"' + (b.fragment || '') + '"', italics: true, size: 24, font: 'Times New Roman' }),
          new TextRun({ text: ' — ' + (b.ref || ''), size: 24, font: 'Times New Roman' })
        ]
      }));
      if (b.ref) refs.add(b.ref);
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    }
  });
  if (refs.size) {
    children.push(new Paragraph({ spacing: { before: 600 }, children: [] }));
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Referencias', bold: true, size: 24, font: 'Times New Roman' })] }));
    [...refs].sort().forEach(r => {
      children.push(new Paragraph({ spacing: { line: 480, after: 0 }, indent: { left: 720, hanging: 720 }, children: [new TextRun({ text: r, size: 24, font: 'Times New Roman' })] }));
    });
  }
  const docx = new Document({ sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children }] });
  const blob = await Packer.toBlob(docx);
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = (doc.title || 'documento').replace(/[^a-zA-Z0-9áéíóúñ ]/gi, '_') + '.docx'; a.click();
  showToast('📄 .docx APA descargado', 'success');
}
window.exportDocxAPA = exportDocxAPA;

// ============================================================
// REVISION STATE MANAGEMENT
// ============================================================
export function setRevState(ri, stateVal) {
  const d = ld();
  if (!d.revState) d.revState = {};
  d.revState['rev' + ri] = stateVal === 'done' ? new Date().toISOString() : stateVal;
  if (!d.revDone) d.revDone = {};
  if (stateVal === 'done') d.revDone['rev' + ri] = new Date().toISOString();
  else if (stateVal === 'discarded') d.revDone['rev' + ri] = 'discarded';
  else delete d.revDone['rev' + ri];
  sv(d); state.render();
}
window.setRevState = setRevState;

export function setRevisionBaseDate() {
  if (!state.DATA || !state.DATA.flujo || !state.DATA.flujo.revision) return;
  const now = new Date(); const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const base = prompt('Fecha base (día que leíste el artículo, formato YYYY-MM-DD):', localDate);
  if (!base || !/^\d{4}-\d{2}-\d{2}$/.test(base)) return;
  const d0 = new Date(base);
  const intervals = [0, 7, 30];
  const newDates = [];
  state.DATA.flujo.revision.forEach((r, i) => {
    const nd = new Date(d0); nd.setDate(nd.getDate() + intervals[i]);
    r.fecha = nd.toISOString().split('T')[0];
    newDates.push(r.fecha);
  });
  const ud = ld();
  ud.revDates = newDates;
  delete ud.revState; delete ud.revDone;
  sv(ud); state.render();
  alert('Fechas recalculadas:\n' + state.DATA.flujo.revision.map(r => r.sesion + ': ' + r.fecha).join('\n'));
}
window.setRevisionBaseDate = setRevisionBaseDate;

export function applyCustomRevDates() {
  if (!state.DATA || !state.DATA.flujo || !state.DATA.flujo.revision) return;
  const ud = ld();
  if (ud.revDates && ud.revDates.length === state.DATA.flujo.revision.length) {
    ud.revDates.forEach((d, i) => { state.DATA.flujo.revision[i].fecha = d; });
  }
}

export function cycleDocStatus() {
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const states = ['borrador', 'revision', 'finalizado'];
  const current = doc.status || 'borrador';
  const next = states[(states.indexOf(current) + 1) % states.length];
  if (next === 'finalizado' && !confirm('¿Marcar como finalizado? El documento quedará en solo lectura.')) return;
  doc.status = next; doc.updated = new Date().toISOString(); saveDocs(docs);
  buildDocSidebar(); renderDocEditor();
}
window.cycleDocStatus = cycleDocStatus;

export function setDocPdfLink() {
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  const link = prompt('Link al PDF o versión publicada (Google Drive, Dropbox, URL del journal):', doc.pdfLink || '');
  if (link === null) return;
  doc.pdfLink = link.trim() || undefined;
  doc.updated = new Date().toISOString(); saveDocs(docs); renderDocEditor();
}
window.setDocPdfLink = setDocPdfLink;

export function addDocTag() {
  const existingTags = [...new Set(getDocs().flatMap(d => d.tags || []).filter(t => t && t !== 'sin etiqueta'))];
  const hint = existingTags.length ? '\n\nTags existentes: ' + existingTags.join(', ') : '';
  const tag = prompt('Nuevo tag:' + hint); if (!tag) return;
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc) return;
  if (!doc.tags) doc.tags = [];
  const t = tag.trim().toLowerCase();
  if (!doc.tags.includes(t)) doc.tags.push(t);
  doc.updated = new Date().toISOString(); saveDocs(docs); buildDocSidebar(); renderDocEditor();
}
window.addDocTag = addDocTag;

export function removeDocTag(idx) {
  const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId); if (!doc || !doc.tags) return;
  doc.tags.splice(idx, 1);
  if (doc.tags.length === 0) doc.tags = ['sin etiqueta'];
  doc.updated = new Date().toISOString(); saveDocs(docs); buildDocSidebar(); renderDocEditor();
}
window.removeDocTag = removeDocTag;

// ============================================================
// RE-EXPORT openInTab (used by openDoc and tabs.js)
// ============================================================
// openInTab is defined in tabs.js but needed here — use late-binding via window
function openInTab(type, key, label) {
  if (typeof window.openInTab === 'function') window.openInTab(type, key, label);
}
