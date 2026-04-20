// ============================================================
// CRISOL — prisma.js  (PRISMA module)
// Perspectiva de la Investigación: Síntesis, Mapa y Análisis
// Extracted from SILA v4 monolith
// ============================================================

import { state } from './state.js';
import { userKey } from './storage.js';
import { escH, showToast } from './utils.js';
import { renderPrismaJardin, renderPrismaMatriz, renderPrismaArgumento, renderPrismaVacios, renderPrismaPreguntas, renderPrismaEvolucion } from './prisma-tabs.js';

// --------------- state ---------------
export let currentPrismaTab = 'jardin';
let _viewingUserId = null; // null = viewing own, UUID = viewing someone else's (read-only)

const EMPTY_PRISMA = { documents: [], concepts: [], matrix: { themes: [], cells: {} }, argument: { question: '', central: '', premises: [] }, gaps: [], strengths: [], evolution: [], lastAnalysis: null };

// --------------- data accessors (Supabase-backed with localStorage cache) ---------------
export function getPrisma() {
  // If viewing another user's PRISMA, return from cache
  if (_viewingUserId && state._otherPrisma) return state._otherPrisma;

  // Own PRISMA: try localStorage cache first
  try {
    const stored = JSON.parse(localStorage.getItem(userKey('sila_prisma')));
    if (stored && (stored.documents?.length > 0 || stored.argument?.question)) return stored;
  } catch (e) { /* storage error */ }
  if (window.PRISMA_INITIAL) return window.PRISMA_INITIAL;
  return { ...EMPTY_PRISMA };
}

export function savePrisma(data) {
  // Don't save if viewing someone else's
  if (_viewingUserId) return;

  // Save to localStorage cache
  try {
    localStorage.setItem(userKey('sila_prisma'), JSON.stringify(data));
    localStorage.setItem(userKey('sila_prisma_ts'), String(Date.now()));
  } catch (e) { /* storage error */ }

  // Save to Supabase prisma_data table
  savePrismaToSupabase(data);
}

// --- Supabase sync ---
let _prismaSyncTimer = null;

function savePrismaToSupabase(data) {
  if (!state.sdb || !state.currentUser) return;
  clearTimeout(_prismaSyncTimer);
  _prismaSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('prisma_data').upsert({
        user_id: state.currentUser.id,
        project_id: state.currentProjectId || null,
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,project_id' });
    } catch (e) { console.error('PRISMA sync error:', e); }
  }, 2000);
}

// --- Load own PRISMA from Supabase on boot ---
export async function loadPrismaFromSupabase() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb
      .from('prisma_data')
      .select('data')
      .eq('user_id', state.currentUser.id)
      .is('project_id', null)
      .maybeSingle();
    if (!error && data && data.data) {
      const local = getPrisma();
      const cloud = data.data;
      // Use cloud if it has more content
      if (cloud.documents?.length > 0 || cloud.argument?.question) {
        localStorage.setItem(userKey('sila_prisma'), JSON.stringify(cloud));
      }
    }
  } catch (e) { /* no data yet, that's fine */ }
}

// --- Load another user's PRISMA (read-only) ---
export async function loadOtherPrisma(userId, projectId) {
  if (!state.sdb) return null;
  try {
    const { data, error } = await state.sdb
      .from('prisma_data')
      .select('data')
      .eq('user_id', userId)
      .eq('project_id', projectId || '')
      .single();
    if (!error && data) return data.data;
  } catch (e) { console.error('Load prisma data error:', e); }
  // Try global PRISMA (no project)
  try {
    const { data, error } = await state.sdb
      .from('prisma_data')
      .select('data')
      .eq('user_id', userId)
      .is('project_id', null)
      .single();
    if (!error && data) return data.data;
  } catch (e) { console.error('Load global prisma error:', e); }
  return null;
}

// --- View toggle ---
export function setViewingUser(userId) {
  _viewingUserId = userId;
}
export function isViewingOther() {
  return !!_viewingUserId;
}

// --------------- navigation ---------------
window.goPrisma = function() {
  if (state._saveNavState) state._saveNavState();
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; state._isPrisma = true; state._isAtlas = false;
  // Reset view to own
  setViewingUser(null); state._otherPrisma = null; state._viewingName = null;

  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('s-prisma'); if (el) el.classList.add('active');
  if (state._updateTopbar) state._updateTopbar();
  renderPrisma();
  if (state._closeSidebarMobile) state._closeSidebarMobile();
};

// --------------- main render ---------------
export function renderPrisma() {
  const ct = document.getElementById('ct'); if (!ct) return;
  const prisma = getPrisma();
  const tabs = [
    { id: 'jardin', label: '📄 Jardín', icon: '📄' },
    { id: 'matriz', label: '📊 Matriz', icon: '📊' },
    { id: 'argumento', label: '🏗 Argumento', icon: '🏗' },
    { id: 'vacios', label: '⚠ Vacíos', icon: '⚠' },
    { id: 'preguntas', label: '❓ Preguntas', icon: '❓' },
    { id: 'evolucion', label: '📈 Evolución', icon: '📈' }
  ];

  const readOnly = isViewingOther();
  const viewLabel = readOnly ? `Vista de: ${state._viewingName || 'otro'}` : 'Mi vista';

  let h = getBreadcrumb();
  h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">`;
  h += `<div><h2 style="font-size:clamp(17px,2.5vw,24px);font-weight:800;color:#fff;margin-bottom:4px;">🔬 PRISMA</h2>`;
  h += `<p style="font-size:14px;color:var(--tx2);">Perspectiva de la Investigación: Síntesis, Mapa y Análisis</p></div>`;
  h += `<div style="display:flex;gap:6px;align-items:center;">`;
  // View toggle dropdown (only if in a project context with members)
  h += `<select id="prisma-view-toggle" onchange="switchPrismaView(this.value)" style="padding:5px 10px;background:var(--bg2);border:1px solid rgba(220,215,205,0.12);border-radius:6px;color:${readOnly ? 'var(--purple)' : 'var(--tx)'};font-size:12px;font-family:'Inter',sans-serif;">`;
  h += `<option value="me" ${!readOnly ? 'selected' : ''}>👤 Mi vista</option>`;
  h += `</select>`;
  if (!readOnly) {
    h += `<button class="btn bo" onclick="addPrismaDocument()" style="font-size:13px;">+ Documento</button>`;
    h += `<button class="btn bo" onclick="exportPrismaJson()" style="font-size:13px;" title="Descargar PRISMA como JSON">💾</button>`;
    h += `<button class="btn bo" onclick="document.getElementById('prisma-import-file').click()" style="font-size:13px;" title="Importar PRISMA desde JSON">📂</button>`;
    h += `<input type="file" id="prisma-import-file" accept=".json" style="display:none" onchange="importPrismaJson(event)">`;
  }
  h += `</div></div>`;

  // Populate member options async
  loadPrismaViewOptions();

  // Tabs
  h += `<div class="prisma-tabs">`;
  tabs.forEach(t => { h += `<div class="prisma-tab ${currentPrismaTab === t.id ? 'active' : ''}" onclick="switchPrismaTab('${t.id}')">${t.label}</div>`; });
  h += `</div>`;

  // Tab content
  if (currentPrismaTab === 'jardin') h += renderPrismaJardin(prisma);
  else if (currentPrismaTab === 'matriz') h += renderPrismaMatriz(prisma);
  else if (currentPrismaTab === 'argumento') h += renderPrismaArgumento(prisma);
  else if (currentPrismaTab === 'vacios') h += renderPrismaVacios(prisma);
  else if (currentPrismaTab === 'preguntas') h += renderPrismaPreguntas(prisma);
  else if (currentPrismaTab === 'evolucion') h += renderPrismaEvolucion(prisma);

  ct.innerHTML = h;
}

// --- Tab switching ---
function switchPrismaTab(tabId) {
  currentPrismaTab = tabId;
  renderPrisma();
}
window.switchPrismaTab = switchPrismaTab;
window.renderPrisma = renderPrisma;

// --- PRISMA view toggle helpers ---
async function loadPrismaViewOptions() {
  const sel = document.getElementById('prisma-view-toggle');
  if (!sel || !state.sdb || !state.currentUser) return;
  // Only show toggle if we have shared projects
  const projects = state.projects || [];
  const sharedProjectIds = projects.filter(p => p._isShared || true).map(p => p.id); // all projects
  if (sharedProjectIds.length === 0) return;
  try {
    // Get all members from all my projects
    const { data } = await state.sdb
      .from('project_members')
      .select('user_id, profiles(display_name)')
      .in('project_id', sharedProjectIds);
    if (!data) return;
    // Deduplicate by user_id, exclude self
    const seen = new Set();
    data.forEach(m => {
      if (m.user_id === state.currentUser.id || seen.has(m.user_id)) return;
      seen.add(m.user_id);
      const name = m.profiles?.display_name || 'Sin nombre';
      const opt = document.createElement('option');
      opt.value = m.user_id;
      opt.textContent = '👁 ' + name;
      if (_viewingUserId === m.user_id) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch (e) { console.error('Load prisma collaborators error:', e); }
}

async function switchPrismaView(value) {
  if (value === 'me') {
    setViewingUser(null);
    state._otherPrisma = null;
    state._viewingName = null;
  } else {
    setViewingUser(value);
    // Get the user's name
    try {
      const { data } = await state.sdb.from('profiles').select('display_name').eq('id', value).single();
      state._viewingName = data?.display_name || 'Colaborador';
    } catch (e) { state._viewingName = 'Colaborador'; }
    // Load their PRISMA data
    const otherData = await loadOtherPrisma(value, state.currentProjectId);
    state._otherPrisma = otherData || { ...EMPTY_PRISMA };
  }
  renderPrisma();
}
window.switchPrismaView = switchPrismaView;

// --- Export/Import PRISMA as JSON ---
function exportPrismaJson() {
  const data = getPrisma();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PRISMA_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('PRISMA exportado', 'success', 2000);
}
window.exportPrismaJson = exportPrismaJson;

function importPrismaJson(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const incoming = JSON.parse(e.target.result);
      if (!incoming.documents && !incoming.argument && !incoming.matrix) {
        showToast('Formato no reconocido', 'error'); return;
      }

      const mode = confirm('¿Mergear con PRISMA actual?\n\nOK = Mergear (agrega sin perder datos)\nCancelar = Reemplazar todo')
        ? 'merge' : 'replace';

      if (mode === 'replace') {
        savePrisma(incoming);
      } else {
        // MERGE: enrich existing with incoming
        const current = getPrisma();
        const merged = mergePrisma(current, incoming);
        savePrisma(merged);
      }

      renderPrisma();
      const docCount = incoming.documents?.length || 0;
      const themeCount = incoming.matrix?.themes?.length || 0;
      showToast(`PRISMA ${mode === 'merge' ? 'mergeado' : 'importado'} (${docCount} docs, ${themeCount} temas)`, 'success', 4000);
    } catch (err) {
      showToast('Error al leer JSON: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
window.importPrismaJson = importPrismaJson;

// --- MERGE logic: enrich existing PRISMA with incoming data ---
function mergePrisma(current, incoming) {
  const m = JSON.parse(JSON.stringify(current)); // deep clone

  // Documents: add new, update existing by title
  (incoming.documents || []).forEach(newDoc => {
    const existing = (m.documents || []).find(d => d.title === newDoc.title);
    if (existing) {
      // Update fields if incoming has more info
      if (newDoc.summary) existing.summary = newDoc.summary;
      if (newDoc.maturity) existing.maturity = newDoc.maturity;
      if (newDoc.wordCount) existing.wordCount = newDoc.wordCount;
      if (newDoc.concepts) existing.concepts = [...new Set([...(existing.concepts || []), ...newDoc.concepts])];
    } else {
      if (!m.documents) m.documents = [];
      m.documents.push(newDoc);
    }
  });

  // Concepts: union without duplicates
  if (incoming.concepts) {
    m.concepts = [...new Set([...(m.concepts || []), ...incoming.concepts])];
  }

  // Matrix themes: add new themes
  if (incoming.matrix?.themes) {
    if (!m.matrix) m.matrix = { themes: [], cells: {} };
    const existingThemes = m.matrix.themes || [];
    incoming.matrix.themes.forEach(t => {
      if (!existingThemes.includes(t)) existingThemes.push(t);
    });
    m.matrix.themes = existingThemes;
  }

  // Matrix cells: add new cells, update existing if incoming is longer
  if (incoming.matrix?.cells) {
    if (!m.matrix) m.matrix = { themes: [], cells: {} };
    if (!m.matrix.cells) m.matrix.cells = {};
    Object.entries(incoming.matrix.cells).forEach(([key, val]) => {
      if (!m.matrix.cells[key] || val.length > (m.matrix.cells[key] || '').length) {
        m.matrix.cells[key] = val;
      }
    });
  }

  // Argument: update if incoming has one
  if (incoming.argument) {
    if (!m.argument) m.argument = { question: '', central: '', premises: [] };
    if (incoming.argument.question) m.argument.question = incoming.argument.question;
    if (incoming.argument.central) m.argument.central = incoming.argument.central;
    // Merge premises: add new, update support of existing
    (incoming.argument.premises || []).forEach(newP => {
      const existing = (m.argument.premises || []).find(p => p.text === newP.text);
      if (existing) {
        if (newP.evidence) existing.evidence = newP.evidence;
        if (newP.support) existing.support = newP.support;
        if (newP.sources) existing.sources = newP.sources;
      } else {
        if (!m.argument.premises) m.argument.premises = [];
        m.argument.premises.push(newP);
      }
    });
  }

  // Gaps: add new (by text match)
  (incoming.gaps || []).forEach(g => {
    if (!m.gaps) m.gaps = [];
    if (!m.gaps.find(e => e.text === g.text)) m.gaps.push(g);
  });

  // Strengths: add new
  (incoming.strengths || []).forEach(s => {
    if (!m.strengths) m.strengths = [];
    if (!m.strengths.find(e => e.text === s.text)) m.strengths.push(s);
  });

  // Questions: add new, update status of existing
  (incoming.questions || []).forEach(q => {
    if (!m.questions) m.questions = [];
    const existing = m.questions.find(e => e.text === q.text);
    if (existing) {
      if (q.status) existing.status = q.status;
      if (q.method) existing.method = q.method;
    } else {
      m.questions.push(q);
    }
  });

  // Evolution: add new entries chronologically, never remove
  (incoming.evolution || []).forEach(ev => {
    if (!m.evolution) m.evolution = [];
    if (!m.evolution.find(e => e.date === ev.date && e.text === ev.text)) {
      m.evolution.push(ev);
    }
  });
  if (m.evolution) m.evolution.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return m;
}


// Tab renderers → prisma-tabs.js


// === PRISMA CRUD Functions ===
window.addPrismaDocument = function() {
  const overlay = document.createElement('div'); overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  let html = `<div class="logbook-modal" style="max-width:500px;">`;
  html += `<h3>📄 Agregar documento al jardín</h3>`;
  html += `<label>Título *</label><input id="pd-title" placeholder="Ej: Ensayo sobre deuda intelectual organizacional">`;
  html += `<label>Resumen</label><textarea id="pd-summary" placeholder="Breve descripción del contenido y contribución..."></textarea>`;
  html += `<label>Tipo</label><input id="pd-type" placeholder="Ej: Ensayo, Artículo, Informe, Capítulo...">`;
  html += `<label>Fecha</label><input type="date" id="pd-date" value="${new Date().toISOString().split('T')[0]}">`;
  html += `<label>Palabras (aprox)</label><input type="number" id="pd-words" placeholder="5000">`;
  html += `<label>Madurez</label><select id="pd-maturity" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  html += `<option value="seed">🌱 Semilla (idea, borrador)</option><option value="sprout">🌿 Brote (en desarrollo)</option><option value="tree">🌳 Árbol (publicado/definitivo)</option></select>`;
  html += `<label>Conceptos clave (separados por coma)</label><input id="pd-concepts" placeholder="Ej: deuda intelectual, hibridación, complejidad">`;
  html += `<label>Tags (separados por coma)</label><input id="pd-tags" placeholder="Ej: ensayo, complejidad, primer-trimestre">`;
  html += `<label>📥 Snapshot — versión congelada (link de descarga)</label><input id="pd-url" placeholder="Link al .docx congelado en Drive o repositorio">`;
  html += `<label>📄 Documento vivo (Google Drive, opcional)</label><input id="pd-live" placeholder="Link al documento que sigue evolucionando">`;
  html += `<div class="lb-actions"><button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="savePrismaDocument(-1)" style="background:var(--purple);color:#fff;font-weight:600;">Agregar</button></div></div>`;
  overlay.innerHTML = html; document.body.appendChild(overlay); document.getElementById('pd-title').focus();
};

window.editPrismaDocument = function(idx) {
  const prisma = getPrisma(); const doc = prisma.documents[idx]; if (!doc) return;
  const overlay = document.createElement('div'); overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  let html = `<div class="logbook-modal" style="max-width:500px;"><h3>✎ Editar documento</h3>`;
  html += `<label>Título *</label><input id="pd-title" value="${escH(doc.title)}">`;
  html += `<label>Resumen</label><textarea id="pd-summary">${doc.summary || ''}</textarea>`;
  html += `<label>Tipo</label><input id="pd-type" value="${doc.type || ''}">`;
  html += `<label>Fecha</label><input type="date" id="pd-date" value="${doc.date || ''}">`;
  html += `<label>Palabras</label><input type="number" id="pd-words" value="${doc.wordCount || ''}">`;
  html += `<label>Madurez</label><select id="pd-maturity" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  ['seed', 'sprout', 'tree'].forEach(m => { const labels = { seed: '🌱 Semilla', sprout: '🌿 Brote', tree: '🌳 Árbol' }; html += `<option value="${m}"${(doc.maturity || 'seed') === m ? ' selected' : ''}>${labels[m]}</option>`; });
  html += `</select>`;
  html += `<label>Conceptos clave</label><input id="pd-concepts" value="${(doc.concepts || []).join(', ')}">`;
  html += `<label>Tags</label><input id="pd-tags" value="${(doc.tags || []).join(', ')}">`;
  html += `<label>📥 Snapshot (versión congelada)</label><input id="pd-url" value="${doc.downloadUrl || ''}">`;
  html += `<label>📄 Documento vivo</label><input id="pd-live" value="${doc.liveUrl || ''}">`;
  html += `<div class="lb-actions"><button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="savePrismaDocument(${idx})" style="background:var(--purple);color:#fff;font-weight:600;">Guardar</button></div></div>`;
  overlay.innerHTML = html; document.body.appendChild(overlay);
};

window.savePrismaDocument = function(idx) {
  const title = document.getElementById('pd-title').value.trim(); if (!title) { alert('El título es obligatorio.'); return; }
  const snapshotUrl = document.getElementById('pd-url').value.trim() || null;
  const liveUrl = (document.getElementById('pd-live') || {}).value?.trim() || null;
  const tags = (document.getElementById('pd-tags') || {}).value?.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) || [];
  const doc = {
    title: title,
    summary: document.getElementById('pd-summary').value.trim(),
    type: document.getElementById('pd-type').value.trim(),
    date: document.getElementById('pd-date').value,
    wordCount: parseInt(document.getElementById('pd-words').value) || null,
    maturity: document.getElementById('pd-maturity').value,
    concepts: document.getElementById('pd-concepts').value.split(',').map(c => c.trim()).filter(Boolean),
    tags: tags,
    downloadUrl: snapshotUrl,
    snapshotDate: snapshotUrl ? new Date().toISOString().split('T')[0] : null,
    liveUrl: liveUrl
  };
  const prisma = getPrisma();
  if (idx >= 0) { prisma.documents[idx] = doc; } else { prisma.documents.push(doc); }
  savePrisma(prisma);
  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  renderPrisma(); showToast(idx >= 0 ? 'Documento actualizado' : 'Documento agregado', 'success', 2000);
};

window.setPrismaDocUrl = function(idx) {
  const url = prompt('URL del snapshot (versión congelada del documento):');
  if (!url || !url.trim()) return;
  const prisma = getPrisma();
  prisma.documents[idx].downloadUrl = url.trim();
  prisma.documents[idx].snapshotDate = new Date().toISOString().split('T')[0];
  savePrisma(prisma); renderPrisma();
};

window.setPrismaLiveUrl = function(idx) {
  const url = prompt('URL del documento vivo (Google Drive):');
  if (!url || !url.trim()) return;
  const prisma = getPrisma(); prisma.documents[idx].liveUrl = url.trim(); savePrisma(prisma); renderPrisma();
};

window.removePrismaDocument = function(idx) {
  if (!confirm('¿Eliminar este documento del jardín?')) return;
  const prisma = getPrisma(); prisma.documents.splice(idx, 1); savePrisma(prisma); renderPrisma();
};

window.addPrismaTheme = function() {
  const t = prompt('Tema/concepto de tu tesis:'); if (!t || !t.trim()) return;
  const prisma = getPrisma(); if (!prisma.matrix) prisma.matrix = { themes: [], cells: {} };
  prisma.matrix.themes.push(t.trim()); savePrisma(prisma); renderPrisma();
};
window.removePrismaTheme = function(idx) {
  const prisma = getPrisma(); prisma.matrix.themes.splice(idx, 1); savePrisma(prisma); renderPrisma();
};
window.editPrismaCell = function(di, ti) {
  const prisma = getPrisma(); const key = di + '-' + ti;
  const val = prompt('¿Qué aporta este documento a este tema?', (prisma.matrix?.cells || {})[key] || '');
  if (val === null) return;
  if (!prisma.matrix) prisma.matrix = { themes: [], cells: {} };
  if (!prisma.matrix.cells) prisma.matrix.cells = {};
  prisma.matrix.cells[key] = val.trim(); savePrisma(prisma); renderPrisma();
};

window.editArgField = function(field) {
  const prisma = getPrisma(); if (!prisma.argument) prisma.argument = {};
  const labels = { question: 'Pregunta doctoral:', central: 'Argumento central:' };
  const val = prompt(labels[field], prisma.argument[field] || ''); if (val === null) return;
  prisma.argument[field] = val.trim(); savePrisma(prisma); renderPrisma();
};
window.addArgPremise = function() {
  const text = prompt('Premisa / pilar del argumento:'); if (!text || !text.trim()) return;
  const evidence = prompt('Evidencia que la soporta (opcional):', '');
  const sources = prompt('Fuentes (opcional):', '');
  const prisma = getPrisma(); if (!prisma.argument) prisma.argument = {}; if (!prisma.argument.premises) prisma.argument.premises = [];
  prisma.argument.premises.push({ text: text.trim(), evidence: evidence?.trim() || null, sources: sources?.trim() || null, support: 'gap' });
  savePrisma(prisma); renderPrisma();
};
window.editArgPremise = function(idx) {
  const prisma = getPrisma(); const p = prisma.argument?.premises?.[idx]; if (!p) return;
  const text = prompt('Premisa:', p.text); if (!text || !text.trim()) return;
  const evidence = prompt('Evidencia:', p.evidence || '');
  const sources = prompt('Fuentes:', p.sources || '');
  p.text = text.trim(); p.evidence = evidence?.trim() || null; p.sources = sources?.trim() || null;
  savePrisma(prisma); renderPrisma();
};
window.removeArgPremise = function(idx) { const prisma = getPrisma(); prisma.argument.premises.splice(idx, 1); savePrisma(prisma); renderPrisma(); };
window.updatePremiseSupport = function(idx, val) { const prisma = getPrisma(); prisma.argument.premises[idx].support = val; savePrisma(prisma); renderPrisma(); };

window.addPrismaGap = function() { const t = prompt('Vacío identificado:'); if (!t || !t.trim()) return; const p = prompt('Prioridad (alta/media/baja):', 'media'); const prisma = getPrisma(); prisma.gaps.push({ text: t.trim(), priority: p?.trim() || 'media' }); savePrisma(prisma); renderPrisma(); };
window.removePrismaGap = function(idx) { const prisma = getPrisma(); prisma.gaps.splice(idx, 1); savePrisma(prisma); renderPrisma(); };
window.addPrismaStrength = function() { const t = prompt('Fortaleza identificada:'); if (!t || !t.trim()) return; const prisma = getPrisma(); prisma.strengths.push({ text: t.trim() }); savePrisma(prisma); renderPrisma(); };
window.removePrismaStrength = function(idx) { const prisma = getPrisma(); prisma.strengths.splice(idx, 1); savePrisma(prisma); renderPrisma(); };

window.addPrismaQuestion = function() {
  const overlay = document.createElement('div'); overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  let html = `<div class="logbook-modal" style="max-width:500px;">`;
  html += `<h3>❓ Nueva pregunta de investigación</h3>`;
  html += `<label>Pregunta *</label><textarea id="pq-text" placeholder="¿Cómo...? ¿En qué medida...? ¿Cuál es la relación entre...?" style="min-height:60px;"></textarea>`;
  html += `<label>Contexto (¿de dónde emerge?)</label><textarea id="pq-context" placeholder="Esta pregunta surge al observar que..." style="min-height:40px;"></textarea>`;
  html += `<label>Emerge de (documentos/fuentes)</label><input id="pq-sources" placeholder="Ej: Ensayo 1, sección 2.3 + Ensayo 2, sección 7">`;
  html += `<label>Tipo de pregunta</label><select id="pq-type" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  html += `<option value="descriptiva">Descriptiva (¿qué ocurre?)</option><option value="relacional">Relacional (¿cómo se relaciona X con Y?)</option><option value="causal">Causal (¿X causa Y?)</option><option value="exploratoria">Exploratoria (¿cómo se experimenta X?)</option><option value="evaluativa">Evaluativa (¿funciona X?)</option><option value="diseño">Diseño (¿cómo debería diseñarse X?)</option></select>`;
  html += `<label>Metodología sugerida</label><input id="pq-method" placeholder="Ej: Estudio de caso, experimento, revisión sistemática...">`;
  html += `<label>Prioridad</label><select id="pq-priority" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  html += `<option value="alta">🔴 Alta</option><option value="media" selected>🟡 Media</option><option value="baja">🟢 Baja</option></select>`;
  html += `<div class="lb-actions"><button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="savePrismaQuestion(-1)" style="background:var(--purple);color:#fff;font-weight:600;">Agregar</button></div></div>`;
  overlay.innerHTML = html; document.body.appendChild(overlay); document.getElementById('pq-text').focus();
};

window.editPrismaQuestion = function(idx) {
  const prisma = getPrisma(); const q = (prisma.researchQuestions || [])[idx]; if (!q) return;
  const overlay = document.createElement('div'); overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  let html = `<div class="logbook-modal" style="max-width:500px;"><h3>✎ Editar pregunta</h3>`;
  html += `<label>Pregunta *</label><textarea id="pq-text" style="min-height:60px;">${escH(q.text)}</textarea>`;
  html += `<label>Contexto</label><textarea id="pq-context" style="min-height:40px;">${q.context || ''}</textarea>`;
  html += `<label>Emerge de</label><input id="pq-sources" value="${q.sources || ''}">`;
  html += `<label>Tipo</label><select id="pq-type" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  ['descriptiva', 'relacional', 'causal', 'exploratoria', 'evaluativa', 'diseño'].forEach(t => { html += `<option value="${t}"${(q.type || 'descriptiva') === t ? ' selected' : ''}>${t}</option>`; });
  html += `</select>`;
  html += `<label>Metodología sugerida</label><input id="pq-method" value="${q.methodology || ''}">`;
  html += `<label>Prioridad</label><select id="pq-priority" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  ['alta', 'media', 'baja'].forEach(p => { html += `<option value="${p}"${(q.priority || 'media') === p ? ' selected' : ''}>${p}</option>`; });
  html += `</select>`;
  html += `<div class="lb-actions"><button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="savePrismaQuestion(${idx})" style="background:var(--purple);color:#fff;font-weight:600;">Guardar</button></div></div>`;
  overlay.innerHTML = html; document.body.appendChild(overlay);
};

window.savePrismaQuestion = function(idx) {
  const text = document.getElementById('pq-text').value.trim(); if (!text) { alert('La pregunta es obligatoria.'); return; }
  const q = { text: text, context: document.getElementById('pq-context').value.trim() || null, sources: document.getElementById('pq-sources').value.trim() || null, type: document.getElementById('pq-type').value, methodology: document.getElementById('pq-method').value.trim() || null, priority: document.getElementById('pq-priority').value, status: 'open' };
  const prisma = getPrisma(); if (!prisma.researchQuestions) prisma.researchQuestions = [];
  if (idx >= 0) { q.status = (prisma.researchQuestions[idx] || {}).status || 'open'; prisma.researchQuestions[idx] = q; } else { prisma.researchQuestions.push(q); }
  savePrisma(prisma); const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  renderPrisma(); showToast(idx >= 0 ? 'Pregunta actualizada' : 'Pregunta agregada', 'success', 2000);
};

window.removePrismaQuestion = function(idx) {
  if (!confirm('¿Eliminar esta pregunta?')) return;
  const prisma = getPrisma(); prisma.researchQuestions.splice(idx, 1); savePrisma(prisma); renderPrisma();
};

window.updateQuestionStatus = function(idx, status) {
  const prisma = getPrisma(); prisma.researchQuestions[idx].status = status; savePrisma(prisma); renderPrisma();
};

window.addPrismaEvolution = function() {
  const text = prompt('Hito de evolución (qué cambió en tu pensamiento):'); if (!text || !text.trim()) return;
  const impact = prompt('Impacto (cómo afecta tu tesis):', '');
  const prisma = getPrisma(); prisma.evolution.unshift({ date: new Date().toISOString().split('T')[0], text: text.trim(), impact: impact?.trim() || null });
  savePrisma(prisma); renderPrisma();
};
window.removePrismaEvolution = function(idx) { const prisma = getPrisma(); prisma.evolution.splice(idx, 1); savePrisma(prisma); renderPrisma(); };
