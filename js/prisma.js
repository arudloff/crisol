// ============================================================
// CRISOL — prisma.js  (PRISMA module)
// Perspectiva de la Investigación: Síntesis, Mapa y Análisis
// Extracted from SILA v4 monolith
// ============================================================

import { state } from './state.js';
import { userKey } from './storage.js';
import { escH, showToast } from './utils.js';

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
  } catch (e) {}
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
  } catch (e) {}

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
  } catch (e) {}
  // Try global PRISMA (no project)
  try {
    const { data, error } = await state.sdb
      .from('prisma_data')
      .select('data')
      .eq('user_id', userId)
      .is('project_id', null)
      .single();
    if (!error && data) return data.data;
  } catch (e) {}
  return null;
}

// --- View toggle ---
export function setViewingUser(userId) {
  _viewingUserId = userId;
}
export function getViewingUser() {
  return _viewingUserId;
}
export function isViewingOther() {
  return !!_viewingUserId;
}

// --------------- navigation ---------------
window.goPrisma = function() {
  if (state._saveNavState) state._saveNavState();
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; state._isPrisma = true;
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
  } catch (e) {}
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

// === JARDIN DE DOCUMENTOS ===
if (!window._jardinTagFilter) window._jardinTagFilter = null;

export function renderPrismaJardin(prisma) {
  const allDocs = prisma.documents || [];
  if (allDocs.length === 0) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--tx3);"><p style="font-size:15px;margin-bottom:12px;">Tu jardín doctoral está vacío.</p><p style="font-size:13px;">Agrega tus ensayos, artículos y documentos para que PRISMA construya sentido a partir de ellos.</p><button class="btn bo" onclick="addPrismaDocument()" style="margin-top:12px;">+ Agregar primer documento</button></div>`;
  }

  // Collect all tags
  const allTags = new Set();
  allDocs.forEach(d => (d.tags || []).forEach(t => allTags.add(t)));
  const tagList = [...allTags].sort();

  // Filter
  const docs = window._jardinTagFilter ? allDocs.filter(d => (d.tags || []).includes(window._jardinTagFilter)) : allDocs;

  const maturityLabels = { seed: '🌱 Semilla', sprout: '🌿 Brote', tree: '🌳 Árbol' };
  let h = '';

  // Tag filter bar
  if (tagList.length > 0) {
    h += `<div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">`;
    h += `<span style="font-size:12px;color:var(--tx3);margin-right:4px;">Filtrar:</span>`;
    const activeTag = window._jardinTagFilter;
    h += `<button onclick="window._jardinTagFilter=null;renderPrisma();" style="padding:3px 10px;border-radius:12px;border:1px solid ${!activeTag ? 'var(--purple)' : 'rgba(220,215,205,0.1)'};background:${!activeTag ? 'rgba(155,125,207,0.12)' : 'var(--bg3)'};color:${!activeTag ? 'var(--purple)' : 'var(--tx3)'};cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;font-weight:${!activeTag ? '600' : '400'};">Todos (${allDocs.length})</button>`;
    tagList.forEach(tag => {
      const count = allDocs.filter(d => (d.tags || []).includes(tag)).length;
      const isActive = activeTag === tag;
      h += `<button onclick="window._jardinTagFilter='${tag.replace(/'/g, "\\'")}';renderPrisma();" style="padding:3px 10px;border-radius:12px;border:1px solid ${isActive ? 'var(--purple)' : 'rgba(220,215,205,0.1)'};background:${isActive ? 'rgba(155,125,207,0.12)' : 'var(--bg3)'};color:${isActive ? 'var(--purple)' : 'var(--tx3)'};cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;font-weight:${isActive ? '600' : '400'};">${escH(tag)} (${count})</button>`;
    });
    h += `</div>`;
  }

  h += `<div style="display:flex;gap:8px;margin-bottom:12px;font-size:13px;color:var(--tx3);">`;
  h += `<span>🌱 Semilla: idea/borrador</span><span>🌿 Brote: en desarrollo</span><span>🌳 Árbol: publicado/definitivo</span>`;
  h += `</div>`;

  docs.forEach((doc, di) => {
    h += `<div class="prisma-card">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div class="prisma-card-title">${escH(doc.title)}</div>`;
    h += `<div style="display:flex;gap:6px;align-items:center;">`;
    h += `<span class="prisma-maturity ${doc.maturity || 'seed'}">${maturityLabels[doc.maturity || 'seed']}</span>`;
    h += `<button onclick="event.stopPropagation();editPrismaDocument(${di})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:13px;">✎</button>`;
    h += `<button onclick="event.stopPropagation();removePrismaDocument(${di})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✕</button>`;
    h += `</div></div>`;
    h += `<div class="prisma-card-meta">`;
    h += `<span>${doc.date || ''}</span>`;
    if (doc.type) h += `<span>${escH(doc.type)}</span>`;
    if (doc.wordCount) h += `<span>${doc.wordCount} palabras</span>`;
    h += `</div>`;
    if (doc.summary) h += `<div class="prisma-card-summary">${escH(doc.summary)}</div>`;
    if (doc.tags && doc.tags.length > 0) {
      h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">`;
      doc.tags.forEach(t => { h += `<span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(232,168,56,0.1);color:var(--gold);cursor:pointer;" onclick="event.stopPropagation();window._jardinTagFilter='${t.replace(/'/g, "\\'")}';renderPrisma();">#${escH(t)}</span>`; });
      h += `</div>`;
    }
    if (doc.concepts && doc.concepts.length > 0) {
      h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">`;
      doc.concepts.forEach(c => { h += `<span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(155,125,207,0.1);color:var(--purple);">${escH(c)}</span>`; });
      h += `</div>`;
    }
    h += `<div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap;">`;
    // Snapshot
    if (doc.downloadUrl) {
      h += `<a href="${doc.downloadUrl}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(144,200,240,0.08);border:1px solid rgba(144,200,240,0.15);border-radius:6px;font-size:12px;color:var(--blue);text-decoration:none;font-weight:500;transition:all 0.12s;" onmouseover="this.style.background='rgba(144,200,240,0.15)'" onmouseout="this.style.background='rgba(144,200,240,0.08)'">📥 Snapshot${doc.snapshotDate ? ' (' + doc.snapshotDate + ')' : ''}</a>`;
    } else {
      h += `<a href="#" onclick="event.preventDefault();event.stopPropagation();setPrismaDocUrl(${di})" style="font-size:12px;color:var(--tx3);text-decoration:none;">+ Snapshot (versión congelada)</a>`;
    }
    // Live document
    if (doc.liveUrl) {
      h += `<a href="${doc.liveUrl}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(93,187,138,0.08);border:1px solid rgba(93,187,138,0.15);border-radius:6px;font-size:12px;color:var(--green);text-decoration:none;font-weight:500;transition:all 0.12s;" onmouseover="this.style.background='rgba(93,187,138,0.15)'" onmouseout="this.style.background='rgba(93,187,138,0.08)'">📄 Doc. vivo</a>`;
    } else {
      h += `<a href="#" onclick="event.preventDefault();event.stopPropagation();setPrismaLiveUrl(${di})" style="font-size:12px;color:var(--tx3);text-decoration:none;">+ Doc. vivo (Google Drive)</a>`;
    }
    h += `</div>`;
    h += `</div>`;
  });
  return h;
}

// === MATRIZ DE SINTESIS ===
export function renderPrismaMatriz(prisma) {
  const docs = prisma.documents || [];
  const themes = prisma.matrix?.themes || [];
  if (docs.length === 0 || themes.length === 0) {
    let h = `<div style="padding:20px;color:var(--tx3);text-align:center;">`;
    if (docs.length === 0) h += `<p>Agrega documentos al jardín primero.</p>`;
    else h += `<p>Define los temas/conceptos de tu tesis para construir la matriz.</p>`;
    h += `<button class="btn bo" onclick="addPrismaTheme()" style="margin-top:8px;">+ Agregar tema</button></div>`;
    return h;
  }
  const cells = prisma.matrix?.cells || {};
  let h = `<div style="margin-bottom:8px;"><button class="btn bo" onclick="addPrismaTheme()" style="font-size:12px;">+ Tema</button></div>`;
  h += `<div style="overflow-x:auto;"><table class="prisma-matrix">`;
  // Header
  h += `<tr><th style="min-width:150px;">Documento</th>`;
  themes.forEach((t, ti) => {
    h += `<th style="min-width:120px;">${escH(t)} <span onclick="removePrismaTheme(${ti})" style="cursor:pointer;font-size:10px;color:var(--tx3);opacity:0.5;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">✕</span></th>`;
  });
  h += `</tr>`;
  // Rows
  docs.forEach((doc, di) => {
    h += `<tr><td style="font-weight:600;color:var(--tx);">${escH(doc.title.length > 30 ? doc.title.substring(0, 30) + '...' : doc.title)}</td>`;
    themes.forEach((t, ti) => {
      const key = di + '-' + ti;
      const val = cells[key] || '';
      const cls = val ? 'filled' : 'gap';
      h += `<td class="${cls}" onclick="editPrismaCell(${di},${ti})" style="cursor:pointer;" title="Click para editar">${val ? escH(val.length > 60 ? val.substring(0, 60) + '...' : val) : '<span style=color:var(--tx3);font-size:11px;>click para llenar</span>'}</td>`;
    });
    h += `</tr>`;
  });
  // Gap detection row
  h += `<tr style="border-top:2px solid var(--bg4);"><td style="font-weight:600;color:var(--tx3);">Cobertura</td>`;
  themes.forEach((t, ti) => {
    const filled = docs.filter((d, di) => cells[di + '-' + ti]).length;
    const pct = docs.length > 0 ? Math.round(filled / docs.length * 100) : 0;
    const color = pct === 0 ? 'var(--red)' : pct < 50 ? 'var(--gold)' : 'var(--green)';
    h += `<td style="font-weight:600;color:${color};">${filled}/${docs.length} (${pct}%)</td>`;
  });
  h += `</tr>`;
  h += `</table></div>`;
  return h;
}

// === MAPA ARGUMENTAL ===
export function renderPrismaArgumento(prisma) {
  const arg = prisma.argument || {};
  let h = '';
  // Research question
  h += `<div style="background:var(--bg2);border:2px solid var(--purple);border-radius:10px;padding:16px 20px;margin-bottom:12px;text-align:center;">`;
  h += `<div style="font-size:11px;color:var(--purple);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Pregunta doctoral</div>`;
  h += `<div style="font-size:16px;color:var(--tx);font-weight:600;cursor:pointer;" onclick="editArgField('question')">${arg.question ? escH(arg.question) : '<span style=color:var(--tx3);font-style:italic;>Click para definir tu pregunta de investigación</span>'}</div>`;
  h += `</div>`;

  // Central argument
  h += `<div style="background:var(--bg2);border:1px solid rgba(155,125,207,0.2);border-radius:10px;padding:14px 18px;margin-bottom:16px;text-align:center;">`;
  h += `<div style="font-size:11px;color:var(--purple);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Argumento central</div>`;
  h += `<div style="font-size:14px;color:var(--tx);cursor:pointer;" onclick="editArgField('central')">${arg.central ? escH(arg.central) : '<span style=color:var(--tx3);font-style:italic;>Click para definir tu argumento central</span>'}</div>`;
  h += `</div>`;

  // Premises
  h += `<div style="font-size:13px;font-weight:600;color:var(--tx2);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><span>Premisas / Pilares del argumento</span><button class="btn bo" onclick="addArgPremise()" style="font-size:12px;">+ Premisa</button></div>`;
  const premises = arg.premises || [];
  if (premises.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Agrega las premisas que sostienen tu argumento central.</div>`;
  }
  premises.forEach((p, pi) => {
    const supportLevel = p.support || 'gap';
    h += `<div class="prisma-arg ${supportLevel}">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div style="font-size:14px;font-weight:600;color:var(--tx);flex:1;">${escH(p.text)}</div>`;
    h += `<div style="display:flex;gap:4px;flex-shrink:0;">`;
    h += `<select onchange="updatePremiseSupport(${pi},this.value)" style="background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:4px;color:var(--tx);font-size:11px;padding:2px 4px;">`;
    [{ v: 'supported', l: '✅ Soportada' }, { v: 'partial', l: '⚠ Parcial' }, { v: 'gap', l: '❌ Sin soporte' }].forEach(o => {
      h += `<option value="${o.v}"${supportLevel === o.v ? ' selected' : ''}>${o.l}</option>`;
    });
    h += `</select>`;
    h += `<button onclick="editArgPremise(${pi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✎</button>`;
    h += `<button onclick="removeArgPremise(${pi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11px;">✕</button>`;
    h += `</div></div>`;
    if (p.evidence) h += `<div style="font-size:12px;color:var(--tx3);margin-top:4px;">Evidencia: ${escH(p.evidence)}</div>`;
    if (p.sources) h += `<div style="font-size:12px;color:var(--purple);margin-top:2px;">Fuentes: ${escH(p.sources)}</div>`;
    h += `</div>`;
  });

  // Summary
  const supported = premises.filter(p => p.support === 'supported').length;
  const partial = premises.filter(p => p.support === 'partial').length;
  const gaps = premises.filter(p => p.support === 'gap' || !p.support).length;
  if (premises.length > 0) {
    h += `<div style="display:flex;gap:12px;margin-top:12px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:13px;">`;
    h += `<span style="color:var(--green);">✅ ${supported} soportadas</span>`;
    h += `<span style="color:var(--gold);">⚠ ${partial} parciales</span>`;
    h += `<span style="color:var(--red);">❌ ${gaps} sin soporte</span>`;
    h += `</div>`;
  }
  return h;
}

// === ANALISIS DE VACIOS + FORTALEZAS ===
export function renderPrismaVacios(prisma) {
  let h = '';
  // Gaps
  h += `<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:8px;">⚠ Vacíos identificados</div>`;
  const gaps = prisma.gaps || [];
  if (gaps.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Ejecuta /prisma con Claude para analizar tus documentos e identificar vacíos automáticamente, o agrégalos manualmente.</div>`;
  }
  gaps.forEach((g, gi) => {
    h += `<div style="padding:10px 14px;margin:4px 0;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.1);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;"><span style="font-size:14px;color:var(--tx);">${escH(g.text)}</span>`;
    h += `<span onclick="removePrismaGap(${gi})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span></div>`;
    if (g.priority) h += `<div style="font-size:12px;color:var(--gold);margin-top:2px;">Prioridad: ${escH(g.priority)}</div>`;
    h += `</div>`;
  });
  h += `<button class="btn bo" onclick="addPrismaGap()" style="font-size:12px;margin-top:6px;">+ Agregar vacío</button>`;

  // Strengths
  h += `<div style="font-size:15px;font-weight:700;color:var(--green);margin:20px 0 8px;">💪 Fortalezas</div>`;
  const strengths = prisma.strengths || [];
  if (strengths.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Ejecuta /prisma para identificar fortalezas, o agrégalas manualmente.</div>`;
  }
  strengths.forEach((s, si) => {
    h += `<div style="padding:10px 14px;margin:4px 0;background:rgba(93,187,138,0.04);border:1px solid rgba(93,187,138,0.1);border-left:3px solid var(--green);border-radius:0 8px 8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;"><span style="font-size:14px;color:var(--tx);">${escH(s.text)}</span>`;
    h += `<span onclick="removePrismaStrength(${si})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span></div>`;
    h += `</div>`;
  });
  h += `<button class="btn bo" onclick="addPrismaStrength()" style="font-size:12px;margin-top:6px;">+ Agregar fortaleza</button>`;

  // Last analysis
  if (prisma.lastAnalysis) {
    h += `<div style="margin-top:20px;padding:12px 16px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--tx3);">Último análisis: ${prisma.lastAnalysis}</div>`;
  }
  return h;
}

// === PREGUNTAS DE INVESTIGACION EMERGENTES ===
export function renderPrismaPreguntas(prisma) {
  const preguntas = prisma.researchQuestions || [];
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">`;
  h += `<div style="font-size:15px;font-weight:700;color:var(--tx);">❓ Preguntas de investigación emergentes</div>`;
  h += `<button class="btn bo" onclick="addPrismaQuestion()" style="font-size:12px;">+ Pregunta</button>`;
  h += `</div>`;
  h += `<p style="font-size:13px;color:var(--tx3);margin-bottom:14px;">Preguntas que emergen del análisis conjunto de tus escritos. Cada una podría convertirse en un capítulo, un artículo o una línea de investigación.</p>`;

  if (preguntas.length === 0) {
    return h + `<div style="padding:20px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Aún no hay preguntas registradas. Agrega las preguntas de investigación que emergen de tus escritos, o ejecuta /prisma para que Claude las genere automáticamente.</div>`;
  }

  const statusLabels = { open: '🔓 Abierta', partial: '🔶 Parcialmente abordada', addressed: '✅ Abordada', future: '🔮 Futura' };
  const statusColors = { open: 'var(--blue)', partial: 'var(--gold)', addressed: 'var(--green)', future: 'var(--purple)' };
  const priorityLabels = { alta: '🔴', media: '🟡', baja: '🟢' };

  preguntas.forEach((q, qi) => {
    const status = q.status || 'open';
    const priority = q.priority || 'media';
    h += `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-left:3px solid ${statusColors[status]};border-radius:0 10px 10px 0;padding:14px 18px;margin:8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div style="flex:1;">`;
    h += `<div style="font-size:15px;font-weight:600;color:var(--tx);line-height:1.5;">${escH(q.text)}</div>`;
    h += `<div style="display:flex;gap:10px;margin-top:6px;font-size:12px;">`;
    h += `<span style="color:${statusColors[status]};">${statusLabels[status]}</span>`;
    h += `<span>${priorityLabels[priority]} ${escH(priority)}</span>`;
    if (q.type) h += `<span style="color:var(--tx3);">Tipo: ${escH(q.type)}</span>`;
    h += `</div>`;
    if (q.context) h += `<div style="font-size:13px;color:var(--tx2);margin-top:6px;line-height:1.6;">${escH(q.context)}</div>`;
    if (q.sources) h += `<div style="font-size:12px;color:var(--purple);margin-top:4px;">Emerge de: ${escH(q.sources)}</div>`;
    if (q.methodology) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Metodología sugerida: ${escH(q.methodology)}</div>`;
    h += `</div>`;
    h += `<div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px;">`;
    h += `<select onchange="updateQuestionStatus(${qi},this.value)" style="background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:4px;color:var(--tx);font-size:11px;padding:2px;">`;
    ['open', 'partial', 'addressed', 'future'].forEach(s => { h += `<option value="${s}"${status === s ? ' selected' : ''}>${statusLabels[s]}</option>`; });
    h += `</select>`;
    h += `<button onclick="editPrismaQuestion(${qi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✎</button>`;
    h += `<button onclick="removePrismaQuestion(${qi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11px;">✕</button>`;
    h += `</div></div></div>`;
  });

  // Summary
  const open = preguntas.filter(q => (q.status || 'open') === 'open').length;
  const partial = preguntas.filter(q => q.status === 'partial').length;
  const addressed = preguntas.filter(q => q.status === 'addressed').length;
  const future = preguntas.filter(q => q.status === 'future').length;
  h += `<div style="display:flex;gap:12px;margin-top:14px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:13px;">`;
  h += `<span style="color:var(--blue);">🔓 ${open} abiertas</span>`;
  h += `<span style="color:var(--gold);">🔶 ${partial} parciales</span>`;
  h += `<span style="color:var(--green);">✅ ${addressed} abordadas</span>`;
  h += `<span style="color:var(--purple);">🔮 ${future} futuras</span>`;
  h += `</div>`;

  return h;
}

// === EVOLUCION ===
export function renderPrismaEvolucion(prisma) {
  const evo = prisma.evolution || [];
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">`;
  h += `<div style="font-size:15px;font-weight:700;color:var(--tx);">📈 Evolución del pensamiento</div>`;
  h += `<button class="btn bo" onclick="addPrismaEvolution()" style="font-size:12px;">+ Registrar hito</button>`;
  h += `</div>`;
  if (evo.length === 0) {
    return h + `<div style="padding:20px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Registra cómo evoluciona tu pensamiento doctoral. Cada hito marca un cambio, descubrimiento o decisión.</div>`;
  }
  evo.forEach((e, ei) => {
    h += `<div class="prisma-timeline-item">`;
    h += `<div class="prisma-timeline-dot"></div>`;
    h += `<div style="flex:1;">`;
    h += `<div style="font-size:12px;color:var(--purple);font-weight:600;">${e.date || ''}</div>`;
    h += `<div style="font-size:14px;color:var(--tx);margin-top:2px;">${escH(e.text)}</div>`;
    if (e.impact) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Impacto: ${escH(e.impact)}</div>`;
    h += `</div>`;
    h += `<span onclick="removePrismaEvolution(${ei})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.3;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3">✕</span>`;
    h += `</div>`;
  });
  return h;
}

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
