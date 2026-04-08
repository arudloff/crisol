// ============================================================
// CRISOL — projects.js
// All project-related functionality extracted from YUNQUE v9.1
// ============================================================

import { state, PROJ_ESTADOS, PROJ_ROLE_LABELS } from './state.js';
import { showToast, closeSidebarMobile } from './utils.js';
import { getDocs, saveDocs, countDocWords } from './editor.js';
import { saveNavState } from './articles.js';
import { openInTab } from './tabs.js';
import { renderGlobalDash } from './dashboard.js';

// CRUD imported from projects-core.js
import { getProjects, saveOneProject, saveProjects, loadProjects, createProjectInDb, deleteProjectFromDb, canEditProject } from './projects-core.js';
import './projects-logbook.js';
import { getActivePhase } from './projects-phases.js';
// Render functions imported from projects-render.js
import { renderProjectDash, renderPipeline, renderProjectsSummary, renderMiTesis, toggleProjFilter } from './projects-render.js';

// Config fallbacks moved to projects-render.js, projects-dr.js, projects-clo.js

// ============================================================
// PROJECTS — CRUD imported from projects-core.js
// Team features imported from projects-team.js
// ============================================================

// Re-export CRUD from projects-core.js (consumed by app.js, dashboard.js, etc.)
export { getProjects, saveProjects, loadProjects, canEditProject } from './projects-core.js';
// Re-export migration from projects-migration.js
export { migrateLocalProjects } from './projects-migration.js';

// ============================================================
// Pipeline view
// ============================================================

function goPipeline() {
  state.isHome = false;
  state.isMiTesis = false;
  state.currentDocId = null;
  state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  state._updateTopbar();
  renderPipeline();
}

// renderPipeline moved to projects-render.js

// ============================================================
// CRUD — create, edit, delete, modal
// ============================================================

function createProject() {
  showProjectModal(null);
}

function editProject(projId) {
  showProjectModal(projId);
}

async function deleteProject(projId) {
  if (!confirm('¿Eliminar este proyecto? Los artículos y documentos NO se eliminarán.')) return;
  const proj = getProjects().find(p => p.id === projId);
  await deleteProjectFromDb(projId);
  if (window.logAudit) window.logAudit('delete_project', 'project', projId, proj?.nombre || '');
  await loadProjects();
  if (state.currentProjectId === projId) { state.currentProjectId = null; state._goHome(); }
  buildProjectSidebar();
}

function showProjectModal(projId) {
  const projects = getProjects();
  const existing = projId ? projects.find(p => p.id === projId) : null;
  const isEdit = !!existing;

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal">`;
  html += `<h3>${isEdit ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>`;
  html += `<label>Nombre *</label><input id="proj-name" value="${isEdit ? existing.nombre.replace(/"/g, '&quot;') : ''}" placeholder="Ej: Primer artículo">`;
  html += `<label>Descripción</label><textarea id="proj-desc" placeholder="Breve descripción del objetivo...">${isEdit ? existing.descripcion || '' : ''}</textarea>`;
  html += `<label>Eje (opcional)</label><input id="proj-eje" value="${isEdit ? (existing.eje || '').replace(/"/g, '&quot;') : ''}" placeholder="Ej: Marco teórico, Metodología, Revisión...">`;
  html += `<label>Deadline</label><input type="date" id="proj-deadline" value="${isEdit ? existing.fechaLimite || '' : ''}">`;
  html += `<label>Carpeta Google Drive (URL)</label><input id="proj-drive" value="${isEdit ? (existing.carpetaDrive || '').replace(/"/g, '&quot;') : ''}" placeholder="https://drive.google.com/drive/folders/...">`;
  const curEstado = isEdit ? (existing.estado || 'en_ejecucion') : 'en_ejecucion';
  html += `<label>Estado</label><select id="proj-estado" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  PROJ_ESTADOS.forEach(e => { html += `<option value="${e.id}"${e.id === curEstado ? ' selected' : ''}>${e.icon} ${e.label}</option>`; });
  html += `</select>`;
  const isProjPriority = isEdit ? !!existing.priority : false;
  html += `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:8px 0;">`;
  html += `<input type="checkbox" id="proj-priority" ${isProjPriority ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--red);cursor:pointer;">`;
  html += `<span style="color:${isProjPriority ? 'var(--red)' : 'var(--tx2)'};font-weight:${isProjPriority ? '600' : '400'};">🔴 Prioritario</span></label>`;
  html += `<div class="proj-modal-actions">`;
  if (isEdit) html += `<button class="proj-btn-danger" onclick="deleteProject('${projId}');this.closest('.proj-modal-overlay').remove();">Eliminar</button>`;
  html += `<button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cancelar</button>`;
  html += `<button class="proj-btn-primary" id="proj-save-btn">${isEdit ? 'Guardar' : 'Crear'}</button>`;
  html += `</div></div>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  document.getElementById('proj-save-btn').onclick = async function () {
    const nombre = document.getElementById('proj-name').value.trim().substring(0, 150);
    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    const desc = document.getElementById('proj-desc').value.trim().substring(0, 1000);
    const eje = document.getElementById('proj-eje').value.trim().substring(0, 200);
    const deadline = document.getElementById('proj-deadline').value;
    const drive = document.getElementById('proj-drive').value.trim().substring(0, 500);
    const estado = document.getElementById('proj-estado').value;
    const priority = document.getElementById('proj-priority')?.checked || false;

    if (isEdit) {
      existing.nombre = nombre;
      existing.descripcion = desc;
      existing.eje = eje;
      existing.fechaLimite = deadline;
      existing.carpetaDrive = drive;
      existing.estado = estado;
      existing.priority = priority;
      existing.updated = new Date().toISOString();
      await saveOneProject(existing);
    } else {
      const newId = await createProjectInDb({
        nombre, descripcion: desc, eje, fechaLimite: deadline,
        carpetaDrive: drive, estado, priority,
        articulos: [], documentos: [], secciones: []
      });
      if (!newId) return;
    }
    await loadProjects();
    buildProjectSidebar();
    if (state.currentProjectId && isEdit) renderProjectDash(state.currentProjectId);
    else if (state.isHome) renderGlobalDash();
    overlay.remove();
    showToast(isEdit ? 'Proyecto actualizado' : 'Proyecto creado', 'success', 2000);
  };

  document.getElementById('proj-name').focus();
}

// ============================================================
// Add/remove articles
// ============================================================

function addArticleToProject(projId) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  const manifest = window.SILA_MANIFEST || [];
  const existingKeys = proj.articulos.map(a => a.key);
  const available = manifest.filter(a => !existingKeys.includes(a.key));

  if (available.length === 0) { alert('Todos los artículos ya están en este proyecto.'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal"><h3>Agregar artículos</h3>`;
  html += `<input id="proj-art-search" placeholder="Buscar artículo..." oninput="filterProjArticles(this.value)" style="margin-bottom:12px;">`;
  html += `<div class="proj-resource-list" id="proj-art-list">`;
  available.forEach(a => {
    html += `<div class="proj-resource-item" data-key="${a.key}" onclick="toggleProjResource(this,'${a.key}')">`;
    html += `<div class="proj-resource-check"></div>`;
    html += `<div><div style="font-size:14px;color:#fff;">${a.authors} (${a.year})</div><div style="font-size:12px;color:var(--tx3);">${a.category || ''}</div></div>`;
    html += `</div>`;
  });
  html += `</div>`;
  html += `<div class="proj-modal-actions"><button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cancelar</button>`;
  html += `<button class="proj-btn-primary" id="proj-add-arts-btn">Agregar</button></div></div>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  window._projSelectedResources = [];

  document.getElementById('proj-add-arts-btn').onclick = function () {
    if (window._projSelectedResources.length === 0) { alert('Selecciona al menos un artículo.'); return; }
    window._projSelectedResources.forEach(key => {
      proj.articulos.push({ key: key, rol: '' });
    });
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
    buildProjectSidebar();
    overlay.remove();
    showToast(window._projSelectedResources.length + ' artículo(s) agregado(s)', 'success', 2000);
    window._projSelectedResources = [];
  };
}

function toggleProjResource(el, key) {
  const idx = window._projSelectedResources.indexOf(key);
  if (idx >= 0) {
    window._projSelectedResources.splice(idx, 1);
    el.classList.remove('selected');
    el.querySelector('.proj-resource-check').textContent = '';
  } else {
    window._projSelectedResources.push(key);
    el.classList.add('selected');
    el.querySelector('.proj-resource-check').textContent = '✓';
  }
}

function filterProjArticles(q) {
  q = q.toLowerCase();
  document.querySelectorAll('#proj-art-list .proj-resource-item').forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = text.includes(q) ? '' : 'none';
  });
}

function removeArticleFromProject(e, projId, articleKey) {
  e.stopPropagation();
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.articulos = proj.articulos.filter(a => a.key !== articleKey);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  buildProjectSidebar();
}

// ============================================================
// Add/remove documents
// ============================================================

function addDocToProject(projId) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  const docs = getDocs();
  const existingIds = proj.documentos.map(d => d.id);
  const available = docs.filter(d => !existingIds.includes(d.id));

  if (available.length === 0) { alert('Todos los documentos ya están en este proyecto.'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal"><h3>Agregar documentos</h3>`;
  html += `<div class="proj-resource-list" id="proj-doc-list">`;
  available.forEach(d => {
    const st = d.status || 'borrador';
    const stIcon = st === 'finalizado' ? '✓' : st === 'revision' ? '⏳' : '✍';
    html += `<div class="proj-resource-item" data-key="${d.id}" onclick="toggleProjResource(this,'${d.id}')">`;
    html += `<div class="proj-resource-check"></div>`;
    html += `<div><div style="font-size:14px;color:#fff;">${stIcon} ${d.title}</div><div style="font-size:12px;color:var(--tx3);">${countDocWords(d)} palabras</div></div>`;
    html += `</div>`;
  });
  html += `</div>`;
  html += `<div class="proj-modal-actions"><button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cancelar</button>`;
  html += `<button class="proj-btn-primary" id="proj-add-docs-btn">Agregar</button></div></div>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);

  window._projSelectedResources = [];

  document.getElementById('proj-add-docs-btn').onclick = function () {
    if (window._projSelectedResources.length === 0) { alert('Selecciona al menos un documento.'); return; }
    window._projSelectedResources.forEach(id => {
      proj.documentos.push({ id: id, linkDrive: '' });
    });
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
    buildProjectSidebar();
    overlay.remove();
    showToast(window._projSelectedResources.length + ' documento(s) agregado(s)', 'success', 2000);
    window._projSelectedResources = [];
  };
}

function removeDocFromProject(e, projId, docId) {
  e.stopPropagation();
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.documentos = proj.documentos.filter(d => d.id !== docId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  buildProjectSidebar();
}

// Create document from project (pre-linked)
function createDocFromProject(projId) {
  const name = prompt('Nombre del nuevo documento:');
  if (!name || !name.trim()) return;
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  const docs = getDocs();
  const doc = {
    id: 'doc_' + Date.now(),
    title: name.trim(),
    template: 'libre',
    tags: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    blocks: [{ type: 'text', content: '' }]
  };
  docs.push(doc);
  saveDocs(docs);
  // Auto-link to project
  if (!proj.documentos) proj.documentos = [];
  proj.documentos.push({ id: doc.id, linkDrive: '' });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  state._buildDocSidebar();
  buildProjectSidebar();
  renderProjectDash(projId);
  showToast('Documento creado y vinculado al proyecto', 'success', 2000);
}

// Set Google Drive link for a doc in project
function setDocDriveLink(projId, docId) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  const entry = proj.documentos.find(d => d.id === docId); if (!entry) return;
  const url = prompt('Link al Google Doc:', entry.linkDrive || '');
  if (url === null) return;
  entry.linkDrive = url.trim();
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// Set article role in project
function setArticleRole(projId, articleKey, role) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  const entry = proj.articulos.find(a => a.key === articleKey); if (!entry) return;
  entry.rol = role;
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// Sections management (source -> section map)
// ============================================================

function addProjectSection(projId) {
  const nombre = prompt('Nombre de la sección del manuscrito:');
  if (!nombre || !nombre.trim()) return;
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.secciones) proj.secciones = [];
  proj.secciones.push({ nombre: nombre.trim(), targetPalabras: 0, articulosFuente: [] });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeProjectSection(projId, secIdx) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj || !proj.secciones) return;
  proj.secciones.splice(secIdx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function setSeccionTarget(projId, secIdx) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj || !proj.secciones) return;
  const sec = proj.secciones[secIdx]; if (!sec) return;
  const val = prompt('Meta de palabras para "' + sec.nombre + '":', sec.targetPalabras || '');
  if (val === null) return;
  sec.targetPalabras = parseInt(val) || 0;
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function toggleSeccionArticulo(projId, secIdx, articleKey) {
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId); if (!proj || !proj.secciones) return;
  const sec = proj.secciones[secIdx]; if (!sec) return;
  if (!sec.articulosFuente) sec.articulosFuente = [];
  const idx = sec.articulosFuente.indexOf(articleKey);
  if (idx >= 0) sec.articulosFuente.splice(idx, 1);
  else sec.articulosFuente.push(articleKey);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// Phase system, gates, checklist, wizard tasks → projects-phases.js
// generateProjectStructure → projects-reports.js

// ============================================================
// DR Wizard — Toggle mode and skill downloads
// ============================================================

// generateDrReport moved to projects-reports.js

// CLO-Author functions moved to projects-clo.js
// DR mode (artifacts, branches, phases, gates, questions) → projects-dr.js
// --- CUT: all DR functions removed (lines 474-1248 original) ---


// ============================================================
// Sidebar KPIs and project sidebar
// ============================================================

function updateSidebarKPIs() {
  const a = document.getElementById('s-total-arts');
  const d = document.getElementById('s-total-docs');
  const p = document.getElementById('s-total-projs');
  if (a) a.textContent = (window.SILA_MANIFEST || []).length;
  if (d) d.textContent = getDocs().length;
  if (p) p.textContent = getProjects().length;
}

function buildProjectSidebar() {
  const el = document.getElementById('sidebar-projects'); if (!el) return;
  const projects = getProjects();
  if (projects.length === 0) { el.innerHTML = ''; updateSidebarKPIs(); return; }

  // Helper: render one project item in sidebar
  function projItem(p, extraStyle) {
    const nA = p.articulos ? p.articulos.length : 0;
    const nD = p.documentos ? p.documentos.length : 0;
    const dimmed = (p.estado === 'pausado' || p.estado === 'finalizado') ? 'opacity:0.5;' : '';
    const estIcon = (p.estado === 'pausado') ? '⏸ ' : (p.estado === 'finalizado') ? '✅ ' : '';
    const shared = p._isShared ? '<span style="font-size:10px;color:var(--purple);margin-left:4px;" title="Compartido: ' + (p._myRole || '') + '">👥</span>' : '';
    const roleLabel = p._isShared ? `<span style="font-size:10px;color:var(--purple);display:block;padding-left:22px;">${PROJ_ROLE_LABELS[p._myRole] || p._myRole}</span>` : '';
    let h = `<div class="s-proj ${state.currentProjectId === p.id ? 'active' : ''}${p.priority ? ' priority' : ''}" onclick="goToProject('${p.id}')" style="${extraStyle || ''}${dimmed}">`;
    h += `<span>${estIcon}${p.nombre}${shared}</span><span class="s-proj-count">${nA}/${nD}</span>`;
    h += `</div>`;
    if (roleLabel) h += roleLabel;
    return h;
  }

  // Separate own and shared projects
  const ownProjects = projects.filter(p => !p._isShared);
  const sharedProjects = projects.filter(p => p._isShared);

  // Group own projects by eje
  const byEje = {};
  ownProjects.forEach(p => {
    const eje = p.eje || 'Sin eje';
    if (!byEje[eje]) byEje[eje] = [];
    byEje[eje].push(p);
  });

  let h = '';
  const ejeKeys = Object.keys(byEje).sort((a, b) => a === 'Sin eje' ? 1 : b === 'Sin eje' ? -1 : a.localeCompare(b));
  if (ejeKeys.length === 1 && ejeKeys[0] === 'Sin eje') {
    ownProjects.filter(p => (p.estado || 'en_ejecucion') !== 'archivado').forEach(p => {
      h += projItem(p, '');
    });
  } else {
    ejeKeys.forEach(eje => {
      const hasActive = byEje[eje].some(p => state.currentProjectId === p.id);
      h += `<div class="s-cat-head ${hasActive ? 'open' : ''}" onclick="toggleCat(this)" style="padding:6px 16px;font-size:11px;color:var(--purple);"><span class="chv">▸</span> ${eje}</div>`;
      h += `<div class="s-cat-body ${hasActive ? 'open' : ''}">`;
      byEje[eje].filter(p => (p.estado || 'en_ejecucion') !== 'archivado').forEach(p => {
        h += projItem(p, 'padding-left:28px;');
      });
      h += `</div>`;
    });
  }

  // Shared projects section
  if (sharedProjects.length > 0) {
    h += `<div style="font-size:10px;color:var(--purple);padding:8px 16px 2px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Compartidos conmigo</div>`;
    sharedProjects.forEach(p => {
      h += projItem(p, '');
    });
  }
  el.innerHTML = h;
  // Auto-open parent section wrapper if a project is active AND we're viewing it
  if (state.currentProjectId && !state.isHome && !state.isMiTesis) {
    const wrap = document.getElementById('sidebar-projects-wrap');
    const head = wrap?.previousElementSibling;
    if (wrap && !wrap.classList.contains('open')) { wrap.classList.add('open'); if (head) head.classList.add('open'); }
  }
  updateSidebarKPIs();
}

// ============================================================
// Navigation
// ============================================================

function goToProject(projId) {
  saveNavState();
  state.currentProjectId = projId;
  state.currentDocId = null;
  state.isHome = false;
  state.isMiTesis = false;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  const projEls = document.querySelectorAll('.s-proj');
  projEls.forEach(el => { if (el.onclick && el.onclick.toString().includes(projId)) el.classList.add('active'); });
  state._updateTopbar();
  renderProjectDash(projId);
  buildProjectSidebar();
  closeSidebarMobile();
  // Update tab
  const projs = getProjects(); const p = projs.find(p => p.id === projId);
  openInTab('project', projId, p ? p.nombre : 'Proyecto');
}

// ============================================================
// Project claims and calculation helpers
// ============================================================

function getProjectClaims(proj) {
  const manifest = window.SILA_MANIFEST || [];
  const allClaims = { support: [], contrast: [], neutral: [] };
  (proj.articulos || []).forEach(a => {
    const raw = localStorage.getItem('sila4_' + a.key);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (!data.claims) return;
      const meta = manifest.find(m => m.key === a.key);
      const art = window.SILA_ARTICLES && window.SILA_ARTICLES[a.key];
      Object.entries(data.claims).forEach(([k, v]) => {
        if (v !== 'support' && v !== 'contrast' && v !== 'neutral') return;
        const parts = k.split('_');
        const si = parseInt(parts[0]), pi = parseInt(parts[1]);
        let text = '', secTitle = '';
        if (art && art.sections && art.sections[si]) {
          secTitle = art.sections[si].title || '';
          if (art.sections[si].paragraphs && art.sections[si].paragraphs[pi]) {
            text = art.sections[si].paragraphs[pi].text || '';
            if (text.length > 200) text = text.substring(0, 200) + '...';
          }
        }
        allClaims[v].push({
          key: a.key,
          authors: meta ? meta.authors : '',
          year: meta ? meta.year : '',
          sec: secTitle,
          text: text,
          si: si, pi: pi
        });
      });
    } catch (e) { console.error('Claims extraction error:', e); }
  });
  return allClaims;
}

// Find which projects contain a given article or document
function getProjectsForArticle(articleKey) {
  return getProjects().filter(p => (p.articulos || []).some(a => a.key === articleKey));
}
function getProjectsForDoc(docId) {
  return getProjects().filter(p => (p.documentos || []).some(d => d.id === docId));
}

// Render project badges (used in article dashboard and doc editor)
function renderProjectBadges(projects) {
  if (!projects || projects.length === 0) return '';
  let h = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:8px 0;align-items:center;">';
  h += '<span style="font-size:12px;color:var(--tx3);">Proyectos:</span>';
  projects.forEach(p => {
    h += `<span class="proj-badge" onclick="goToProject('${p.id}')" title="Ir al proyecto">${p.nombre}</span>`;
  });
  h += '</div>';
  return h;
}

// Calculation helpers
function calcArticleProgress(articleKey) {
  const raw = localStorage.getItem('sila4_' + articleKey);
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw);
    // Count sections with at least one claim or annotation
    if (!data.claims && !data.d) return 0;
    // We need the article loaded to know total sections
    const art = window.SILA_ARTICLES && window.SILA_ARTICLES[articleKey];
    if (!art || !art.sections) return 0;
    const total = art.sections.length; if (total === 0) return 0;
    let worked = 0;
    art.sections.forEach((sec, si) => {
      // Check claims for paragraphs in this section
      let hasWork = false;
      sec.paragraphs.forEach((par, pi) => {
        const claimKey = si + '_' + pi;
        if (data.claims && data.claims[claimKey]) hasWork = true;
        // Check annotations
        const annKey = si + '_' + pi;
        if (data.d && data.d[annKey] && data.d[annKey].length > 0) hasWork = true;
      });
      if (hasWork) worked++;
    });
    return Math.round((worked / total) * 100);
  } catch (e) { return 0; }
}

function calcArticleClaims(articleKey) {
  const raw = localStorage.getItem('sila4_' + articleKey);
  const result = { support: 0, contrast: 0, neutral: 0 };
  if (!raw) return result;
  try {
    const data = JSON.parse(raw);
    if (data.claims) Object.values(data.claims).forEach(c => {
      if (c === 'support') result.support++;
      else if (c === 'contrast') result.contrast++;
      else if (c === 'neutral') result.neutral++;
    });
  } catch (e) { console.error('Claims count error:', e); }
  return result;
}

function calcDocBlockStates(doc) {
  const counts = { idea: 0, borrador: 0, terminado: 0, desactualizado: 0 };
  if (!doc || !doc.blocks) return counts;
  doc.blocks.forEach(b => {
    if (b.type === 'heading' || b.type === 'section') return;
    const st = b.blockStatus || 'borrador';
    if (counts.hasOwnProperty(st)) counts[st]++;
    else counts.borrador++;
  });
  return counts;
}

function calcDaysRemaining(fechaLimite) {
  if (!fechaLimite) return Infinity;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const end = new Date(fechaLimite + 'T00:00:00');
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function calcDaysElapsed(created, fechaLimite) {
  if (!created || !fechaLimite) return 0;
  const start = new Date(created);
  const end = new Date(fechaLimite + 'T00:00:00');
  const now = new Date();
  const total = end - start;
  if (total <= 0) return 100;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function calcProjectAlert(project, projDocs) {
  const days = calcDaysRemaining(project.fechaLimite);
  if (days < 7 && days !== Infinity) return '🔴 Entrega en ' + days + ' día' + (days !== 1 ? 's' : '');

  let desact = 0;
  projDocs.forEach(d => { const s = calcDocBlockStates(d); desact += s.desactualizado; });
  if (desact > 0) return '⚠ ' + desact + ' bloque' + (desact !== 1 ? 's' : '') + ' desactualizado' + (desact !== 1 ? 's' : '');

  const unread = (project.articulos || []).filter(a => calcArticleProgress(a.key) === 0).length;
  if (unread > 0) return '⚠ ' + unread + ' artículo' + (unread !== 1 ? 's' : '') + ' sin leer';

  const borradores = projDocs.filter(d => (d.status || 'borrador') === 'borrador').length;
  if (borradores > 0) return '✏️ ' + borradores + ' documento' + (borradores !== 1 ? 's' : '') + ' en borrador';

  return '✅ Proyecto al día';
}

// renderProjectDash, renderPipeline, renderProjectsSummary, renderMiTesis,
// toggleProjFilter moved to projects-render.js
// ~1200 lines of render code moved to projects-render.js
// state._ registrations moved to app.js (Paso 9)

// ============================================================
// Register window globals for onclick handlers
// ============================================================
window.createProject = createProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.goToProject = goToProject;
window.goPipeline = goPipeline;
window.showProjectModal = showProjectModal;
window.addArticleToProject = addArticleToProject;
window.toggleProjResource = toggleProjResource;
window.filterProjArticles = filterProjArticles;
window.removeArticleFromProject = removeArticleFromProject;
window.addDocToProject = addDocToProject;
window.removeDocFromProject = removeDocFromProject;
window.createDocFromProject = createDocFromProject;
window.setDocDriveLink = setDocDriveLink;
window.setArticleRole = setArticleRole;
window.addProjectSection = addProjectSection;
window.removeProjectSection = removeProjectSection;
window.setSeccionTarget = setSeccionTarget;
window.toggleSeccionArticulo = toggleSeccionArticulo;
// Phase/checklist/wizard globals → projects-phases.js
// DR globals → projects-dr.js
// Report/CLO globals → projects-reports.js, projects-clo.js
// toggleProjFilter window global → projects-render.js
// exportClaims, exportClaimsFile window globals → projects-reports.js

// ============================================================
// Re-exports from projects-render.js (barrel pattern)
// ============================================================
export { renderProjectDash, renderPipeline, renderProjectsSummary, renderMiTesis, toggleProjFilter } from './projects-render.js';

// ============================================================
// Exports
// ============================================================
export {
  buildProjectSidebar,
  getProjectsForArticle,
  getProjectsForDoc,
  renderProjectBadges,
  getProjectClaims,
  calcDaysRemaining,
  calcDaysElapsed,
  calcProjectAlert,
  calcArticleProgress,
  calcArticleClaims,
  calcDocBlockStates,
  updateSidebarKPIs,
  goToProject,
  goPipeline,
  createProject,
  editProject,
  deleteProject,
  getActivePhase
};
