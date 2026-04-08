// ============================================================
// CRISOL — projects.js
// All project-related functionality extracted from YUNQUE v9.1
// ============================================================

import { state, DEFAULT_FASES, PHASE_GATES, PROJ_ESTADOS, PROJ_ROLE_LABELS, PROJ_ROLES, LOGBOOK_TYPES } from './state.js';
import { showToast, closeSidebarMobile, escH, linkify } from './utils.js';
import { getDocs, saveDocs, countDocWords, openDoc } from './editor.js';
import { getKanban, renderKanbanForProject } from './kanban.js';
import { saveNavState } from './articles.js';
import { openInTab, getWsTabs, saveWsTabs, renderWsTabs } from './tabs.js';
import { renderGlobalDash } from './dashboard.js';
import { loadDrAlerts, loadSocraticLog, writeSocraticEntry, syncWizardContext, resolveDrAlert } from './sync.js';

// CRUD imported from projects-core.js, team from projects-team.js
import { getProjects, saveOneProject, saveProjects, loadProjects, createProjectInDb, deleteProjectFromDb, canEditProject } from './projects-core.js';
import { notifyTeam, loadActivityFeed } from './projects-team.js';

// ============================================================
// Wizard config fallbacks (loaded from data/wizard_config.js as globals)
// ============================================================
function _getDefaultChecklist() {
  return (typeof DEFAULT_CHECKLIST !== 'undefined') ? DEFAULT_CHECKLIST : [];
}
function _getDefaultWizardTasks() {
  return (typeof DEFAULT_WIZARD_TASKS !== 'undefined') ? DEFAULT_WIZARD_TASKS : {};
}
function _getDrWizardTasks() {
  return (typeof DR_WIZARD_TASKS !== 'undefined') ? DR_WIZARD_TASKS : {};
}
function _getDrFases() {
  return (typeof DR_FASES !== 'undefined') ? DR_FASES : [];
}
function _getDrPhaseGates() {
  return (typeof DR_PHASE_GATES !== 'undefined') ? DR_PHASE_GATES : {};
}
function _getDrSkillFiles() {
  return (typeof DR_SKILL_FILES !== 'undefined') ? DR_SKILL_FILES : {};
}
function _getCloFases() {
  return (typeof CLO_FASES !== 'undefined') ? CLO_FASES : [];
}
function _getCloWizardTasks() {
  return (typeof CLO_WIZARD_TASKS !== 'undefined') ? CLO_WIZARD_TASKS : {};
}
function _getCloPhaseGates() {
  return (typeof CLO_PHASE_GATES !== 'undefined') ? CLO_PHASE_GATES : {};
}

// ============================================================
// PROJECTS — CRUD imported from projects-core.js
// Team features imported from projects-team.js
// ============================================================

// --- Migrate localStorage projects to Supabase (one-time) ---
async function migrateLocalProjects() {
  if (!state.sdb || !state.currentUser) return;
  if (localStorage.getItem('crisol_projects_migrated')) return;

  const raw = localStorage.getItem('sila_projects');
  if (!raw) { localStorage.setItem('crisol_projects_migrated', 'done'); return; }

  let oldProjects;
  try { oldProjects = JSON.parse(raw); } catch (e) { return; }
  if (!oldProjects || !oldProjects.length) { localStorage.setItem('crisol_projects_migrated', 'done'); return; }

  console.log('Migrating ' + oldProjects.length + ' projects to Supabase...');
  const idMap = {}; // old_id → new_uuid
  let allOk = true;

  for (const proj of oldProjects) {
    const oldId = proj.id;
    const { id, created, updated, ...rest } = proj;
    const newId = await createProjectInDb(rest);
    if (newId) {
      idMap[oldId] = newId;
      // Update metadata with full project data + original timestamps
      await state.sdb.from('projects').update({
        metadata: rest,
        created_at: created || new Date().toISOString()
      }).eq('id', newId);
    } else {
      allOk = false;
    }
  }

  if (!allOk) {
    console.warn('Some projects failed to migrate. Will retry next time.');
    return; // Don't mark as done — retry on next boot
  }

  // Update kanban task references with new UUIDs
  try {
    const kanban = JSON.parse(localStorage.getItem('sila_kanban') || '[]');
    let kanbanChanged = false;
    kanban.forEach(task => {
      if (task.project && idMap[task.project]) {
        task.project = idMap[task.project];
        kanbanChanged = true;
      }
    });
    if (kanbanChanged) localStorage.setItem('sila_kanban', JSON.stringify(kanban));
  } catch (e) { console.error('Kanban migration error:', e); }

  localStorage.setItem('crisol_projects_migrated', 'done');
  console.log('Migration complete. ID mapping:', idMap);
  showToast('Proyectos migrados a la nube', 'success', 3000);
}

// Re-export CRUD from projects-core.js (consumed by app.js, dashboard.js, etc.)
export { getProjects, saveProjects, loadProjects, canEditProject } from './projects-core.js';
export { migrateLocalProjects };

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

function renderPipeline() {
  const ct = document.getElementById('ct');
  const projects = getProjects();
  const PHASE_IDS = ['ideacion','fundamentacion','diseno','escritura','revision','submission','peer_review','respuesta','publicacion'];
  const PHASE_SHORT = ['Idea','Fund.','Diseño','Escrit.','Rev.','Sub.','Review','Resp.','Pub.'];

  let h = state._getBreadcrumb() + `<h2 style="font-size:clamp(17px,2.5vw,22px);font-weight:800;color:#fff;margin-bottom:6px;">Pipeline de proyectos</h2>`;
  h += `<p style="font-size:14px;color:var(--tx2);margin-bottom:14px;">${projects.length} proyecto${projects.length !== 1 ? 's' : ''} en tu portfolio</p>`;

  if (projects.length === 0) {
    h += `<div style="padding:20px;text-align:center;color:var(--tx3);">Sin proyectos. Crea uno desde el sidebar.</div>`;
    ct.innerHTML = h; return;
  }

  // Pipeline table
  h += `<div style="overflow-x:auto;">`;
  h += `<table style="width:100%;border-collapse:collapse;font-size:13px;">`;
  // Header
  h += `<tr><th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--bg3);color:var(--tx2);min-width:150px;">Proyecto</th>`;
  PHASE_SHORT.forEach(p => {
    h += `<th style="padding:8px 4px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;font-size:11px;min-width:50px;">${p}</th>`;
  });
  h += `<th style="padding:8px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;min-width:70px;">Deadline</th></tr>`;

  // Rows
  projects.forEach(proj => {
    const fases = proj.fases || [];
    const days = calcDaysRemaining(proj.fechaLimite);
    const daysLabel = days === Infinity ? '—' : days + 'd';
    const daysColor = days < 7 && days !== Infinity ? 'var(--red)' : days < 14 && days !== Infinity ? 'var(--gold)' : 'var(--tx3)';

    h += `<tr style="cursor:pointer;border-bottom:1px solid var(--bg3);" onclick="goToProject('${proj.id}')" onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''">`;
    h += `<td style="padding:8px 12px;font-weight:500;color:var(--tx);">${proj.nombre}${proj.eje ? '<div style=\"font-size:11px;color:var(--purple);font-weight:400;\">' + proj.eje + '</div>' : ''}</td>`;

    PHASE_IDS.forEach(phaseId => {
      const fase = fases.find(f => f.id === phaseId);
      const estado = fase ? fase.estado : 'pendiente';
      const icon = estado === 'completado' ? '✅' : estado === 'en_progreso' ? '🔵' : estado === 'no_aplica' ? '⚪' : '○';
      h += `<td style="text-align:center;padding:8px 4px;">${icon}</td>`;
    });

    h += `<td style="text-align:center;padding:8px;color:${daysColor};font-weight:600;">${daysLabel}</td>`;
    h += `</tr>`;
  });
  h += `</table></div>`;

  // Legend
  h += `<div style="display:flex;gap:14px;margin-top:12px;font-size:12px;color:var(--tx3);">`;
  h += `<span>○ Pendiente</span><span>🔵 En progreso</span><span>✅ Completado</span><span>⚪ No aplica</span>`;
  h += `</div>`;

  ct.innerHTML = h;
}

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

// ============================================================
// Phase system
// ============================================================

function cyclePhaseStatus(projId, fi) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.fases) proj.fases = JSON.parse(JSON.stringify(DEFAULT_FASES));
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.fases[fi].estado);
  proj.fases[fi].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// Get active phase name for a project
function getActivePhase(proj) {
  if (!proj.fases) return null;
  return proj.fases.find(f => f.estado === 'en_progreso') || null;
}

// Determine which gate applies for current phase transition
function getGateForPhase(phaseId) {
  for (const [gateKey, gate] of Object.entries(PHASE_GATES)) {
    if (gate.trigger.includes(phaseId)) return { key: gateKey, ...gate };
  }
  return null;
}

// Advance to next phase (with gate check)
function advancePhase(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.fases) return;
  const currentIdx = proj.fases.findIndex(f => f.estado === 'en_progreso');
  if (currentIdx === -1) {
    // No active phase, activate first pending
    const firstPending = proj.fases.findIndex(f => f.estado === 'pendiente');
    if (firstPending !== -1) { proj.fases[firstPending].estado = 'en_progreso'; }
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
    return;
  }

  // Check if a gate applies
  const currentPhase = proj.fases[currentIdx];
  const gate = getGateForPhase(currentPhase.id);
  if (gate) {
    showGateModal(projId, currentIdx, gate);
  } else {
    doAdvancePhase(projId, currentIdx);
  }
}

function doAdvancePhase(projId, currentIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.fases) return;
  const completedPhase = proj.fases[currentIdx].nombre || proj.fases[currentIdx].id;
  proj.fases[currentIdx].estado = 'completado';
  const nextIdx = proj.fases.findIndex((f, i) => i > currentIdx && f.estado === 'pendiente');
  if (nextIdx !== -1) { proj.fases[nextIdx].estado = 'en_progreso'; }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  // Notify team if shared project
  if (proj._isShared) {
    notifyTeam(projId, 'Fase completada', 'completo "' + completedPhase + '"');
  }
}

// Show gate modal
function showGateModal(projId, currentIdx, gate) {
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="logbook-modal" style="max-width:540px;">`;
  html += `<h3 style="font-size:17px;">🚧 ${gate.title}</h3>`;
  html += `<div style="font-size:14px;color:var(--tx2);line-height:1.6;margin-bottom:14px;">${gate.description}</div>`;

  gate.questions.forEach((q, qi) => {
    html += `<label>${q.label}</label>`;
    if (q.type === 'select') {
      html += `<select id="gate-q-${qi}" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
      q.options.forEach((opt, oi) => {
        html += `<option value="${oi}">${opt}</option>`;
      });
      html += `</select>`;
    } else if (q.type === 'textarea') {
      html += `<textarea id="gate-q-${qi}" placeholder="${q.placeholder || ''}" style="min-height:60px;"></textarea>`;
    }
  });

  html += `<div class="lb-actions" style="margin-top:16px;">`;
  html += `<button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="skipGate('${projId}',${currentIdx},'${gate.key}');this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx3);font-size:13px;">Saltar gate</button>`;
  html += `<button onclick="completeGate('${projId}',${currentIdx},'${gate.key}',${gate.questions.length})" style="background:var(--green);color:#000;font-weight:600;">Completar y avanzar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

// Complete gate and advance
function completeGate(projId, currentIdx, gateKey, numQ) {
  const responses = {};
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const gate = PHASE_GATES[gateKey];
  if (!gate || !gate.questions) { doAdvancePhase(projId, currentIdx); return; }

  for (let i = 0; i < numQ; i++) {
    const el = document.getElementById('gate-q-' + i);
    if (!el) continue;
    const q = gate.questions[i];
    if (q.type === 'textarea') {
      responses[q.id] = el.value.trim();
    } else {
      responses[q.id] = { index: parseInt(el.value), label: q.options[parseInt(el.value)] };
    }
  }

  // Save gate record
  if (!proj.gateRecords) proj.gateRecords = [];
  proj.gateRecords.push({
    gate: gateKey,
    fecha: new Date().toISOString().split('T')[0],
    responses: responses,
    skipped: false
  });

  // Also add to bitacora
  if (!proj.bitacora) proj.bitacora = [];
  let resumen = 'Gate "' + gate.title.split(':')[0] + '" completado.';
  proj.bitacora.unshift({
    id: 'log_' + Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    tipo: 'otro',
    nota: '🚧 ' + resumen,
    fase: proj.fases[currentIdx] ? proj.fases[currentIdx].id : null
  });

  proj.updated = new Date().toISOString();
  saveProjects(projects);

  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  doAdvancePhase(projId, currentIdx);
  showToast('Gate completado — fase avanzada', 'success', 3000);
  // Notify team
  if (proj._isShared) {
    notifyTeam(projId, 'Gate completado', 'completo gate "' + (gate.title?.split(':')[0] || gateKey) + '"');
  }
}

// Skip gate
function skipGate(projId, currentIdx, gateKey) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.gateRecords) proj.gateRecords = [];
  proj.gateRecords.push({
    gate: gateKey,
    fecha: new Date().toISOString().split('T')[0],
    skipped: true
  });

  if (!proj.bitacora) proj.bitacora = [];
  proj.bitacora.unshift({
    id: 'log_' + Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    tipo: 'otro',
    nota: '⚠ Gate saltado (sin completar verificación anti-deuda)',
    fase: proj.fases[currentIdx] ? proj.fases[currentIdx].id : null
  });

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  doAdvancePhase(projId, currentIdx);
  showToast('Gate saltado — fase avanzada', 'warning', 3000);
}

// Go back to previous phase
function revertPhase(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.fases) return;
  const currentIdx = proj.fases.findIndex(f => f.estado === 'en_progreso');
  if (currentIdx > 0) {
    proj.fases[currentIdx].estado = 'pendiente';
    proj.fases[currentIdx - 1].estado = 'en_progreso';
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
  }
}

// Edit phase field
function editPhaseField(projId, phaseId, field, label) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.fases) return;
  const phase = proj.fases.find(f => f.id === phaseId); if (!phase) return;
  const val = prompt(label, phase[field] || '');
  if (val === null) return;
  phase[field] = val.trim();
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// Project links
// ============================================================

function addProjectLink(projId) {
  const nombre = prompt('Nombre del link (ej: Carpeta Drive, Colección Zotero):');
  if (!nombre || !nombre.trim()) return;
  const url = prompt('URL:');
  if (!url || !url.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.links) proj.links = [];
  proj.links.push({ nombre: nombre.trim(), url: url.trim() });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeProjectLink(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.links) return;
  proj.links.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// LOGBOOK (Bitacora)
// ============================================================

function showLogbookModal(projId) {
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  // Get project docs for prompt linking
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  const docs = getDocs();
  const projDocs = (proj && proj.documentos || []).map(d => { const doc = docs.find(dd => dd.id === d.id); return doc ? doc : null; }).filter(Boolean);

  let html = `<div class="logbook-modal" style="max-width:520px;">`;
  html += `<h3>📝 Registro de sesión</h3>`;
  html += `<div style="font-size:13px;color:var(--tx3);margin:-8px 0 12px;">Captura la foto completa de tu sesión de trabajo</div>`;

  // Tipo de actividad
  html += `<label>¿Qué hiciste?</label>`;
  html += `<div class="lb-types">`;
  LOGBOOK_TYPES.forEach((t, i) => {
    html += `<button class="lb-type-btn${i === 0 ? ' selected' : ''}" data-type="${t.id}" onclick="document.querySelectorAll('.lb-type-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');">${t.icon} ${t.label}</button>`;
  });
  html += `</div>`;

  // Versión
  html += `<label>Versión actual (opcional)</label>`;
  html += `<input id="lb-version" placeholder="Ej: v3, borrador 2, abstract v1...">`;

  // Nota principal
  html += `<label>Nota: ¿qué avanzaste, qué descubriste?</label>`;
  html += `<textarea id="lb-note" placeholder="Describe brevemente lo que hiciste en esta sesión..."></textarea>`;

  // === LINKS (documentos, carpetas, sitios) ===
  html += `<label>📎 Enlaces relacionados <span style="font-weight:400;color:var(--tx3);">(opcional)</span></label>`;
  html += `<div id="lb-links-list" style="margin-bottom:4px;"></div>`;
  html += `<div style="display:flex;gap:6px;">`;
  html += `<button type="button" onclick="addLbLink()" style="background:var(--bg3);border:1px solid rgba(220,215,205,0.1);color:var(--tx2);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;">+ Agregar enlace</button>`;
  html += `</div>`;

  // === PROMPT LOG (inline) ===
  html += `<label>🤖 ¿Usaste IA en esta sesión? <span style="font-weight:400;color:var(--tx3);">(opcional)</span></label>`;
  html += `<textarea id="lb-prompt" placeholder="Pega el prompt que usaste o describe la interacción..." style="min-height:50px;"></textarea>`;
  html += `<input id="lb-prompt-result" placeholder="Resultado: ¿qué fue útil de lo que generó la IA?">`;
  if (projDocs.length > 0) {
    html += `<select id="lb-prompt-doc" style="width:100%;padding:6px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;margin-top:4px;">`;
    html += `<option value="">Vincular a documento (opcional)</option>`;
    projDocs.forEach(d => { html += `<option value="${d.id}">${d.title}</option>`; });
    html += `</select>`;
  }

  // === INSIGHT ===
  html += `<label>💡 Insight o decisión clave <span style="font-weight:400;color:var(--tx3);">(opcional)</span></label>`;
  html += `<input id="lb-insight" placeholder="Ej: El concepto de deuda intelectual es el eje central...">`;

  // Acciones
  html += `<div class="lb-actions">`;
  html += `<button onclick="window._lbLinks=[];this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="saveLogbookEntry('${projId}')" style="background:var(--gold);color:#000;font-weight:600;">Guardar sesión</button>`;
  html += `</div></div>`;

  window._lbLinks = []; // reset links for new entry
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('lb-note').focus();
}

// Helper: add link row inside logbook modal
window._lbLinks = [];
function addLbLink() {
  const nombre = prompt('Etiqueta (ej: Borrador v3, Carpeta Drive, Nota Obsidian):');
  if (!nombre || !nombre.trim()) return;
  const url = prompt('URL o ruta:');
  if (!url || !url.trim()) return;
  window._lbLinks.push({ nombre: nombre.trim(), url: url.trim() });
  const list = document.getElementById('lb-links-list');
  if (list) {
    let h = '';
    window._lbLinks.forEach((lnk, i) => {
      h += `<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin:2px 4px 2px 0;background:var(--bg3);border-radius:6px;font-size:12px;">`;
      h += `<span style="color:var(--blue);">📎 ${lnk.nombre}</span>`;
      h += `<span onclick="window._lbLinks.splice(${i},1);addLbLink.__refresh()" style="cursor:pointer;color:var(--tx3);font-size:10px;">✕</span>`;
      h += `</div>`;
    });
    list.innerHTML = h;
  }
}
addLbLink.__refresh = function () {
  const list = document.getElementById('lb-links-list');
  if (!list) return;
  let h = '';
  window._lbLinks.forEach((lnk, i) => {
    h += `<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin:2px 4px 2px 0;background:var(--bg3);border-radius:6px;font-size:12px;">`;
    h += `<span style="color:var(--blue);">📎 ${lnk.nombre}</span>`;
    h += `<span onclick="window._lbLinks.splice(${i},1);addLbLink.__refresh()" style="cursor:pointer;color:var(--tx3);font-size:10px;">✕</span>`;
    h += `</div>`;
  });
  list.innerHTML = h;
};

function saveLogbookEntry(projId) {
  const selectedType = document.querySelector('.lb-type-btn.selected');
  const tipo = selectedType ? selectedType.dataset.type : 'otro';
  const version = document.getElementById('lb-version').value.trim();
  const nota = document.getElementById('lb-note').value.trim();
  const insight = document.getElementById('lb-insight').value.trim();
  const promptText = (document.getElementById('lb-prompt') || {}).value?.trim() || '';
  const promptResult = (document.getElementById('lb-prompt-result') || {}).value?.trim() || '';
  const promptDoc = (document.getElementById('lb-prompt-doc') || {}).value || '';

  if (!nota) { alert('Escribe una nota sobre lo que hiciste.'); return; }

  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.bitacora) proj.bitacora = [];

  const activePhaseObj = getActivePhase(proj);
  const entry = {
    id: 'log_' + Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    tipo: tipo,
    version: version || null,
    nota: nota,
    insight: insight || null,
    fase: activePhaseObj ? activePhaseObj.id : null,
    links: window._lbLinks && window._lbLinks.length > 0 ? [...window._lbLinks] : null,
    prompt: promptText || null,
    promptResult: promptResult || null,
    promptDoc: promptDoc || null
  };

  proj.bitacora.unshift(entry);

  // Also add to prompt log if prompt was provided
  if (promptText) {
    if (!proj.promptLog) proj.promptLog = [];
    proj.promptLog.unshift({
      id: 'pl_' + Date.now(),
      fecha: entry.fecha,
      prompt: promptText,
      resultado: promptResult || null,
      docId: promptDoc || null
    });
  }

  proj.updated = new Date().toISOString();
  saveProjects(projects);

  window._lbLinks = []; // reset
  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  renderProjectDash(projId);
  showToast('Sesión registrada', 'success', 2000);
}

function removeLogbookEntry(projId, entryId) {
  if (!confirm('¿Eliminar esta entrada de la bitácora?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  proj.bitacora = proj.bitacora.filter(e => e.id !== entryId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function editLogbookEntry(projId, entryId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry) return;

  const projDocs = (proj.documentos || []).map(d => { const doc = getDocs().find(dd => dd.id === d.id); return doc ? doc : null; }).filter(Boolean);

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="logbook-modal" style="max-width:520px;">`;
  html += `<h3>✎ Editar entrada</h3>`;

  html += `<label>¿Qué hiciste?</label>`;
  html += `<div class="lb-types">`;
  LOGBOOK_TYPES.forEach(t => {
    html += `<button class="lb-type-btn${t.id === (entry.tipo || 'otro') ? ' selected' : ''}" data-type="${t.id}" onclick="document.querySelectorAll('.lb-type-btn').forEach(b=>b.classList.remove('selected'));this.classList.add('selected');">${t.icon} ${t.label}</button>`;
  });
  html += `</div>`;

  html += `<label>Versión actual</label>`;
  html += `<input id="lb-version" value="${entry.version || ''}">`;

  html += `<label>Nota</label>`;
  html += `<textarea id="lb-note">${entry.nota || ''}</textarea>`;

  html += `<label>📎 Enlaces</label>`;
  // Show existing links for reference
  window._lbLinks = entry.links ? [...entry.links] : [];
  html += `<div id="lb-links-list">`;
  if (window._lbLinks.length > 0) {
    window._lbLinks.forEach((lnk, i) => {
      html += `<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;margin:2px 4px 2px 0;background:var(--bg3);border-radius:6px;font-size:12px;"><span style="color:var(--blue);">📎 ${lnk.nombre}</span><span onclick="window._lbLinks.splice(${i},1);addLbLink.__refresh()" style="cursor:pointer;color:var(--tx3);font-size:10px;">✕</span></div>`;
    });
  }
  html += `</div>`;
  html += `<button type="button" onclick="addLbLink()" style="background:var(--bg3);border:1px solid rgba(220,215,205,0.1);color:var(--tx2);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;">+ Agregar enlace</button>`;

  html += `<label>🤖 Prompt usado</label>`;
  html += `<textarea id="lb-prompt" style="min-height:50px;">${entry.prompt || ''}</textarea>`;
  html += `<input id="lb-prompt-result" value="${entry.promptResult || ''}" placeholder="Resultado">`;
  if (projDocs.length > 0) {
    html += `<select id="lb-prompt-doc" style="width:100%;padding:6px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;margin-top:4px;">`;
    html += `<option value="">Vincular a documento</option>`;
    projDocs.forEach(d => { html += `<option value="${d.id}"${d.id === entry.promptDoc ? ' selected' : ''}>${d.title}</option>`; });
    html += `</select>`;
  }

  html += `<label>💡 Insight</label>`;
  html += `<input id="lb-insight" value="${entry.insight || ''}">`;

  html += `<div class="lb-actions">`;
  html += `<button onclick="window._lbLinks=[];this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="saveEditLogbookEntry('${projId}','${entryId}')" style="background:var(--gold);color:#000;font-weight:600;">Guardar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function saveEditLogbookEntry(projId, entryId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry) return;

  const selectedType = document.querySelector('.lb-type-btn.selected');
  entry.tipo = selectedType ? selectedType.dataset.type : 'otro';
  entry.version = document.getElementById('lb-version').value.trim() || null;
  entry.nota = document.getElementById('lb-note').value.trim();
  entry.insight = document.getElementById('lb-insight').value.trim() || null;
  entry.prompt = (document.getElementById('lb-prompt') || {}).value?.trim() || null;
  entry.promptResult = (document.getElementById('lb-prompt-result') || {}).value?.trim() || null;
  entry.promptDoc = (document.getElementById('lb-prompt-doc') || {}).value || null;
  entry.links = window._lbLinks && window._lbLinks.length > 0 ? [...window._lbLinks] : entry.links;

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  window._lbLinks = [];
  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  renderProjectDash(projId);
  showToast('Entrada actualizada', 'success', 2000);
}

// === LOGBOOK ENTRY LINKS ===
function addLogbookLink(projId, entryId) {
  const nombre = prompt('Etiqueta del enlace (ej: Borrador v3, Carpeta, Nota Obsidian):');
  if (!nombre || !nombre.trim()) return;
  const url = prompt('URL o ruta:');
  if (!url || !url.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry) return;
  if (!entry.links) entry.links = [];
  entry.links.push({ nombre: nombre.trim(), url: url.trim() });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeLogbookLink(projId, entryId, linkIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry || !entry.links) return;
  entry.links.splice(linkIdx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// PROMPT LOG
// ============================================================

function showPromptLogModal(projId) {
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="logbook-modal">`;
  html += `<h3>🤖 Registrar prompt</h3>`;
  html += `<label>Prompt que usaste</label>`;
  html += `<textarea id="pl-prompt" placeholder="Pega aquí el prompt que le diste a la IA..." style="min-height:90px;"></textarea>`;
  html += `<label>Resultado (¿qué fue útil?)</label>`;
  html += `<textarea id="pl-result" placeholder="Ej: Usé 60% en sección 2, el contraste Senge-Snowden quedó bien..."></textarea>`;
  html += `<label>Vincular a documento (opcional)</label>`;

  // List project docs
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  const docs = getDocs();
  const projDocs = (proj && proj.documentos || []).map(d => { const doc = docs.find(dd => dd.id === d.id); return doc ? doc : null; }).filter(Boolean);
  html += `<select id="pl-doc" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;
  html += `<option value="">— Ninguno —</option>`;
  projDocs.forEach(d => {
    html += `<option value="${d.id}">${d.title}</option>`;
  });
  html += `</select>`;

  html += `<div class="lb-actions">`;
  html += `<button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="savePromptLog('${projId}')" style="background:var(--purple);color:#fff;">Guardar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('pl-prompt').focus();
}

function savePromptLog(projId) {
  const promptText = document.getElementById('pl-prompt').value.trim();
  const result = document.getElementById('pl-result').value.trim();
  const docId = document.getElementById('pl-doc').value;

  if (!promptText) { alert('Pega el prompt que usaste.'); return; }

  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.promptLog) proj.promptLog = [];

  proj.promptLog.unshift({
    id: 'pl_' + Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    prompt: promptText,
    resultado: result || null,
    docId: docId || null
  });

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  renderProjectDash(projId);
  showToast('Prompt registrado', 'success', 2000);
}

function removePromptLog(projId, plId) {
  if (!confirm('¿Eliminar este registro de prompt?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.promptLog) return;
  proj.promptLog = proj.promptLog.filter(p => p.id !== plId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// PROJECT RESOURCES (Recursos fijos)
// ============================================================

function addProjectResource(projId) {
  const nombre = prompt('Nombre del recurso (ej: Normas revista, Template APA, Colección Zotero):');
  if (!nombre || !nombre.trim()) return;
  const url = prompt('URL:');
  if (!url || !url.trim()) return;
  const tipo = prompt('Tipo: carpeta / documento / web / nota (default: web):') || 'web';
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.recursos) proj.recursos = [];
  proj.recursos.push({ nombre: nombre.trim(), url: url.trim(), tipo: tipo.trim().toLowerCase() });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeProjectResource(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.recursos) return;
  proj.recursos.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// DECISIONS (Decisiones clave)
// ============================================================

function addDecision(projId) {
  const texto = prompt('Decisión o definición clave del proyecto:');
  if (!texto || !texto.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.decisiones) proj.decisiones = [];
  proj.decisiones.push({
    id: 'dec_' + Date.now(),
    fecha: new Date().toISOString().split('T')[0],
    texto: texto.trim()
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeDecision(projId, decId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.decisiones) return;
  proj.decisiones = proj.decisiones.filter(d => d.id !== decId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function promoteInsightToDecision(projId, entryId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry || !entry.insight) return;
  if (!proj.decisiones) proj.decisiones = [];
  proj.decisiones.push({
    id: 'dec_' + Date.now(),
    fecha: entry.fecha,
    texto: entry.insight,
    fromBitacora: true
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('Insight promovido a decisión', 'success', 2000);
}

// ============================================================
// Checklist
// ============================================================

function toggleChecklistItem(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.checklist) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const item = proj.checklist[idx];
  // Migrate from old boolean format
  if (typeof item.done === 'boolean') { item.estado = item.done ? 'completado' : 'pendiente'; delete item.done; }
  const cur = states.indexOf(item.estado || 'pendiente');
  item.estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function addChecklistItem(projId) {
  const texto = prompt('Nuevo item del checklist:');
  if (!texto || !texto.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const DEFAULT_CHECKLIST = _getDefaultChecklist();
  if (!proj.checklist || proj.checklist.length === 0) proj.checklist = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST));
  proj.checklist.push({ texto: texto.trim(), done: false });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeChecklistItem(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.checklist) return;
  proj.checklist.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// Wizard tasks
// ============================================================

function toggleWizardStep(projId, phaseId, stepIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.wizardProgress) proj.wizardProgress = {};
  if (!proj.wizardProgress[phaseId]) proj.wizardProgress[phaseId] = [];
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.wizardProgress[phaseId][stepIdx] || 'pendiente');
  proj.wizardProgress[phaseId][stepIdx] = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function renderWizardTask(projId, phaseId, stepIdx, task, autoCheck, liveData) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  const wp = proj?.wizardProgress?.[phaseId]?.[stepIdx];
  const estado = wp || (autoCheck ? 'completado' : 'pendiente');
  const icons = { pendiente: '☐', en_progreso: '🔵', completado: '☑', no_aplica: '⚪' };
  const colors = { pendiente: 'var(--tx)', en_progreso: 'var(--blue)', completado: 'var(--green)', no_aplica: 'var(--tx3)' };
  const textDeco = estado === 'completado' ? 'text-decoration:line-through;opacity:0.7;' : estado === 'no_aplica' ? 'text-decoration:line-through;opacity:0.4;' : '';
  const detailId = 'wz-' + phaseId + '-' + stepIdx;

  let h = `<div style="border:1px solid rgba(220,215,205,0.06);border-radius:8px;margin:4px 0;background:var(--bg2);overflow:hidden;">`;
  // Task header row
  h += `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;">`;
  h += `<span style="font-size:22px;flex-shrink:0;cursor:pointer;color:${colors[estado]};" onclick="event.stopPropagation();toggleWizardStep('${projId}','${phaseId}',${stepIdx})">${icons[estado]}</span>`;
  h += `<span style="flex:1;font-size:14px;color:${colors[estado]};${textDeco}" onclick="document.getElementById('${detailId}').classList.toggle('show')">${task.texto}</span>`;
  if (liveData) h += `<span style="font-size:13px;color:var(--tx3);">${liveData}</span>`;
  h += `<span style="font-size:12px;color:var(--tx3);cursor:pointer;padding:4px;" onclick="document.getElementById('${detailId}').classList.toggle('show')" title="Ver detalle">▸</span>`;
  h += `</div>`;
  // Expandable detail
  h += `<div id="${detailId}" class="wz-detail">`;
  if (task.detalle) h += `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:8px;">${task.detalle}</div>`;
  if (task.herramientas) h += `<div style="font-size:13px;color:var(--tx3);margin-bottom:6px;">🔧 ${task.herramientas}</div>`;
  if (task.prompts && task.prompts.length > 0) {
    h += `<div style="font-size:12px;font-weight:600;color:var(--gold);margin:6px 0 4px;">🤖 Prompts (click para copiar):</div>`;
    task.prompts.forEach(p => {
      const safeP = p.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      h += `<div style="font-size:13px;color:var(--tx2);padding:6px 10px;margin:3px 0;background:var(--bg3);border-radius:6px;cursor:pointer;border:1px solid transparent;transition:border-color 0.15s;" onclick="navigator.clipboard.writeText(this.dataset.prompt);this.style.borderColor='var(--green)';setTimeout(()=>this.style.borderColor='transparent',1500);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${safeP}" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='transparent'">📋 ${p.length > 120 ? p.substring(0, 120) + '...' : p}</div>`;
    });
  }
  h += `</div>`;
  h += `</div>`;
  return h;
}

function addWizardTask(projId, phaseId) {
  const texto = prompt('Nueva tarea para esta fase:');
  if (!texto || !texto.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.wizardCustomTasks) proj.wizardCustomTasks = {};
  if (!proj.wizardCustomTasks[phaseId]) proj.wizardCustomTasks[phaseId] = [];
  proj.wizardCustomTasks[phaseId].push({ texto: texto.trim(), estado: 'pendiente', detalle: '', herramientas: '', prompts: [] });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function toggleCustomWizardTask(projId, phaseId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.wizardCustomTasks?.[phaseId]?.[idx]) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.wizardCustomTasks[phaseId][idx].estado || 'pendiente');
  proj.wizardCustomTasks[phaseId][idx].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeCustomWizardTask(projId, phaseId, idx) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.wizardCustomTasks[phaseId].splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

// ============================================================
// Generate project structure
// ============================================================

function generateProjectStructure(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const name = (proj.eje ? proj.eje + ' - ' : '') + proj.nombre;
  const safeName = name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').replace(/\s+/g, '_');
  let content = `# Estructura de carpetas: ${name}\n`;
  content += `# Generado por YUNQUE el ${new Date().toLocaleDateString()}\n\n`;
  content += `# Instrucciones:\n`;
  content += `# 1. Crea una carpeta en Google Drive llamada "${name}"\n`;
  content += `# 2. Dentro, crea las subcarpetas listadas abajo\n`;
  content += `# 3. Pega el link de la carpeta en YUNQUE → Links del proyecto\n\n`;
  content += `${safeName}/\n`;
  content += `├── 01_Literatura/\n`;
  content += `│   ├── PDFs/                    ← Papers descargados de Elicit/Scholar\n`;
  content += `│   ├── YUNQUE_procesados/        ← Documentos .docx generados por /sila\n`;
  content += `│   └── Protocolo_busqueda.docx   ← String de búsqueda + criterios PRISMA\n`;
  content += `├── 02_Datos/\n`;
  content += `│   ├── Instrumentos/             ← Guiones de entrevista, encuestas\n`;
  content += `│   ├── Raw/                      ← Datos brutos (transcripciones, CSV)\n`;
  content += `│   └── Procesados/               ← Datos limpios, codificados\n`;
  content += `├── 03_Manuscrito/\n`;
  content += `│   ├── ${safeName}_v1.docx       ← Versión de trabajo\n`;
  content += `│   ├── Cover_letter.docx\n`;
  content += `│   └── Response_reviewers.docx\n`;
  content += `├── 04_Submission/\n`;
  content += `│   ├── Ronda_1/                  ← Versión enviada + reviews recibidos\n`;
  content += `│   ├── Ronda_2/                  ← Revisión + response letter\n`;
  content += `│   └── Submission_log.md         ← Registro: journal, fecha, decisión\n`;
  content += `└── README.md                     ← Este archivo\n\n`;
  content += `# Metadatos del proyecto\n`;
  content += `Nombre: ${proj.nombre}\n`;
  if (proj.eje) content += `Eje: ${proj.eje}\n`;
  if (proj.descripcion) content += `Descripción: ${proj.descripcion}\n`;
  if (proj.fechaLimite) content += `Deadline: ${proj.fechaLimite}\n`;
  content += `Artículos vinculados: ${(proj.articulos || []).length}\n`;
  content += `Documentos vinculados: ${(proj.documentos || []).length}\n`;
  if (proj.preguntaLog && proj.preguntaLog.length > 0) {
    content += `\n# Pregunta de investigación actual\n`;
    content += proj.preguntaLog[proj.preguntaLog.length - 1].texto + '\n';
  }
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = safeName + '_estructura.md'; a.click();
  showToast('📁 Estructura descargada', 'success');
}

// ============================================================
// DR Wizard — Toggle mode and skill downloads
// ============================================================

function generateDrReport(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado', 'error'); return; }

  const drFases = proj.drFases || [];
  const drOutputs = proj.drOutputs || {};
  const gateRecords = proj.drGateRecords || [];
  const completedCount = drFases.filter(f => f.estado === 'completado').length;
  const today = new Date().toISOString().split('T')[0];

  // Helper: get output for a phase/task, or placeholder
  function out(phase, task, fallback) {
    return drOutputs[phase]?.[task] || fallback || '(no registrado)';
  }

  // Helper: summarize gate
  function gateSum(gateKey) {
    const rec = gateRecords.find(g => g.gate === gateKey);
    if (!rec) return '(no completado)';
    if (rec.skipped) return '⚠ SALTADO — ' + rec.fecha;
    const answers = Object.entries(rec.responses || {}).map(([k, v]) => {
      return '  - ' + k + ': ' + (v.label || v || '—');
    }).join('\n');
    return '✅ ' + rec.fecha + '\n' + answers;
  }

  let r = '';
  r += '# Reporte de Trazabilidad\n\n';
  r += '## 1. Ficha técnica\n\n';
  r += '| Campo | Valor |\n|-------|-------|\n';
  r += '| **Documento** | ' + (proj.nombre || '(sin título)') + ' |\n';
  r += '| **Investigador** | ' + (proj._investigador || 'Alejandro Rudloff') + ' |\n';
  r += '| **Fecha de generación** | ' + today + ' |\n';
  const wfModeReport = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  const modeLabels = { dr: '🧬 /dr', clo: '🔬 clo-author', mixed: '🔗 Mixto', default: 'Estándar' };
  r += '| **Modo** | ' + (modeLabels[wfModeReport] || 'Estándar') + ' |\n';
  r += '| **Fases /dr completadas** | ' + completedCount + ' de ' + drFases.length + ' |\n';
  const cloCompletedCount = (proj.cloFases || []).filter(f => f.estado === 'completado').length;
  if (proj.cloFases && proj.cloFases.length > 0) {
    r += '| **Fases clo-author completadas** | ' + cloCompletedCount + ' de ' + proj.cloFases.length + ' |\n';
  }
  r += '| **Fases activas** | ' + drFases.filter(f => f.estado === 'en_progreso').map(f => f.nombre).join(', ') + (proj.cloFases ? ' · ' + proj.cloFases.filter(f => f.estado === 'en_progreso').map(f => f.nombre).join(', ') : '') + ' |\n';
  r += '\n---\n\n';

  // Section 2: Genealogy
  r += '## 2. Genealogía del argumento\n\n';
  r += '### Pregunta inicial\n' + out('dr_exploracion', 0, '(no registrada en CRISOL)') + '\n\n';
  r += '### Gap identificado\n' + out('dr_exploracion', 1, '(no registrado)') + '\n\n';
  r += '### Estrategia de búsqueda\n' + out('dr_exploracion', 2, '(no registrada)') + '\n\n';
  r += '### Fuentes seleccionadas\n' + out('dr_exploracion', 3, '(no registradas)') + '\n\n';
  r += '### Posición tentativa\n' + out('dr_exploracion', 4, '(no registrada)') + '\n\n';

  // Reading outputs
  const readOutputs = drOutputs['dr_lectura'] || {};
  const readEntries = Object.values(readOutputs).filter(v => v);
  if (readEntries.length > 0) {
    r += '### Fichas de explotación (' + readEntries.length + ')\n';
    readEntries.forEach((entry, i) => {
      const preview = entry.length > 200 ? entry.substring(0, 200) + '...' : entry;
      r += '\n**Ficha ' + (i + 1) + ':**\n' + preview + '\n';
    });
    r += '\n';
  }

  // Mentor & Devil
  r += '### Profundización: Mentor socrático\n' + out('dr_depth', 0, '(no ejecutado)') + '\n\n';
  r += '### Respuesta a la pregunta clave del mentor\n' + out('dr_depth', 1, '(no registrada)') + '\n\n';
  r += '### Profundización: Abogado del diablo\n' + out('dr_depth', 2, '(no ejecutado)') + '\n\n';
  r += '### Respuesta al ataque más peligroso\n' + out('dr_depth', 3, '(no registrada)') + '\n\n';
  r += '---\n\n';

  // Section 3: Quality trajectory
  r += '## 3. Trayectoria de calidad\n\n';
  const reviewOutputs = [drOutputs['dr_critica']?.[0], drOutputs['dr_critica']?.[3], drOutputs['dr_entrega']?.[1]].filter(v => v);
  if (reviewOutputs.length > 0) {
    r += '### Scores por ronda de revisión\n\n';
    reviewOutputs.forEach((rev, i) => {
      r += '**Ronda ' + (i + 1) + ':**\n' + (rev.length > 500 ? rev.substring(0, 500) + '...' : rev) + '\n\n';
    });
  } else {
    r += '(No hay scores de /dr review registrados en CRISOL)\n\n';
  }

  r += '### Humanización\n' + out('dr_humanize', 0, '(no ejecutado)') + '\n\n';
  r += '---\n\n';

  // Section 4: Source integrity
  r += '## 4. Integridad de fuentes\n\n';
  r += out('dr_verify', 0, '(No hay verificación de citas registrada)') + '\n\n';
  r += '---\n\n';

  // Section 4b: clo-author data (if available)
  const cloOutputs = proj.cloOutputs || {};
  const cloGateRecords = proj.cloGateRecords || [];
  const cloFases = proj.cloFases || [];
  const hasCloData = Object.keys(cloOutputs).length > 0 || cloGateRecords.length > 0;

  if (hasCloData) {
    r += '## 4b. Análisis empírico (clo-author)\n\n';

    function cloOut(phase, task, fallback) {
      return cloOutputs[phase]?.[task] || fallback || '(no registrado)';
    }

    r += '### Descubrimiento\n' + cloOut('clo_discover', 1, '(no ejecutado)') + '\n\n';
    r += '### Estrategia de identificación\n' + cloOut('clo_strategize', 0, '(no ejecutada)') + '\n\n';
    r += '### Análisis/Código\n' + cloOut('clo_analyze', 0, '(no ejecutado)') + '\n\n';
    r += '### Escritura LaTeX\n' + cloOut('clo_write', 0, '(no ejecutada)') + '\n\n';

    const cloReviewOut = cloOutputs['clo_review'] || {};
    const reviewEntries = Object.values(cloReviewOut).filter(v => v);
    if (reviewEntries.length > 0) {
      r += '### Peer review simulado\n';
      reviewEntries.forEach((entry, i) => {
        const preview = entry.length > 500 ? entry.substring(0, 500) + '...' : entry;
        r += '\n**Report ' + (i + 1) + ':**\n' + preview + '\n';
      });
      r += '\n';
    }

    r += '### R&R\n' + cloOut('clo_revise', 0, '(no ejecutado)') + '\n\n';
    r += '---\n\n';
  }

  // Section 5: Investigator decisions (both systems)
  r += '## 5. Decisiones del investigador\n\n';

  // DR gates
  r += '### Gates /dr\n\n';
  const gateNames = {
    dr_gate_exploracion: 'Exploración', dr_gate_lectura: 'Lectura',
    dr_gate_escritura: 'Escritura', dr_gate_critica: 'Revisión crítica',
    dr_gate_humanize: 'Humanización', dr_gate_verify: 'Verificación',
    dr_gate_depth: 'Profundización'
  };
  if (gateRecords.length > 0) {
    gateRecords.forEach(rec => {
      r += '**' + (gateNames[rec.gate] || rec.gate) + '** — ' + gateSum(rec.gate) + '\n\n';
    });
  } else {
    r += '(No hay gates /dr registrados)\n\n';
  }

  // CLO gates
  if (cloGateRecords.length > 0) {
    r += '### Gates clo-author\n\n';
    const cloGateNames = {
      clo_gate_discover: 'Descubrimiento', clo_gate_strategize: 'Estrategia',
      clo_gate_analyze: 'Análisis', clo_gate_write: 'Escritura',
      clo_gate_review: 'Peer Review'
    };
    cloGateRecords.forEach(rec => {
      const name = cloGateNames[rec.gate] || rec.gate;
      if (rec.skipped) { r += '**' + name + '** — ⚠ SALTADO — ' + rec.fecha + '\n\n'; }
      else {
        const answers = Object.entries(rec.responses || {}).map(([k, v]) => '  - ' + k + ': ' + (v.label || v || '—')).join('\n');
        r += '**' + name + '** — ✅ ' + rec.fecha + '\n' + answers + '\n\n';
      }
    });
  }

  r += '---\n\n';

  // Section 6: Methodological declaration
  const wfMode = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  const modeLabel = { dr: '/dr (Doctoral Research)', clo: 'clo-author (empirical paper)', mixed: '/dr + clo-author (hybrid)' };
  r += '## 6. Declaración metodológica\n\n';
  r += 'Este texto fue producido siguiendo el protocolo ' + (modeLabel[wfMode] || '/dr') + '\n';
  r += 'del sistema CRISOL.\n\n';

  if (wfMode === 'dr' || wfMode === 'mixed') {
    r += '### Rol de la IA — /dr (producción doctoral)\n';
    r += '- Lectura: extracción de conexiones y citas (verificadas por el investigador)\n';
    r += '- Escritura: borrador a partir de esqueleto aprobado (voz calibrada al investigador)\n';
    r += '- Revisión: evaluación en 6 componentes (interpretada y priorizada por el investigador)\n';
    r += '- Humanización: detección de patrones IA (correcciones aplicadas selectivamente)\n';
    r += '- Verificación: contraste de citas contra PDFs (errores corregidos por el investigador)\n';
    r += '- Profundización: preguntas socráticas y ataques adversariales (respondidos por el investigador)\n\n';
  }
  if (wfMode === 'clo' || wfMode === 'mixed') {
    r += '### Rol de la IA — clo-author (análisis empírico)\n';
    r += '- Descubrimiento: revisión de literatura y evaluación de datos (librarian + explorer)\n';
    r += '- Estrategia: diseño de identificación causal (strategist, validado por strategist-critic)\n';
    r += '- Análisis: pipeline de datos y estimación (coder, verificado por coder-critic)\n';
    r += '- Escritura: manuscrito LaTeX (writer, humanizado y evaluado por writer-critic)\n';
    r += '- Peer review: simulación con editor + 2 referees ciegos (domain + methods)\n';
    r += '- R&R: clasificación de comentarios y routing a agentes especializados\n\n';
  }
  r += '### Rol del investigador\n';
  r += '- Formulación de pregunta y posición inicial\n';
  r += '- Aprobación de esqueletos argumentales y estrategias de identificación\n';
  r += '- Decisiones en cada quality gate\n';
  r += '- Verificación de autoría intelectual\n';
  r += '- Respuesta a cuestionamientos del mentor socrático\n';
  r += '- Reconstrucción después de ataques del abogado del diablo\n';
  r += '- Corrección manual de citas, datos, y código\n';
  r += '- Decisiones sobre items DISAGREE en R&R (nunca delegadas a IA)\n\n';
  r += '---\n\n';
  r += '*Generado por CRISOL · ' + today + '*\n';

  // Download
  const blob = new Blob([r], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const safeName = (proj.nombre || 'proyecto').replace(/[^a-zA-Z0-9áéíóúñ _-]/g, '').replace(/\s+/g, '_');
  a.download = 'Reporte_Trazabilidad_' + safeName + '_' + today + '.md';
  a.click();
  showToast('📊 Reporte de trazabilidad generado', 'success');
}

// === CLO-AUTHOR FUNCTIONS ===

function saveCloPath(projId) {
  const input = document.getElementById('clo-path-input');
  if (!input || !input.value.trim()) { showToast('Ingresa una ruta', 'error'); return; }
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.cloProjectPath = input.value.trim().replace(/\\/g, '/');
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('📁 Ruta guardada: ' + proj.cloProjectPath, 'success');
}

function toggleCloWizardStep(projId, phaseId, stepIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.cloWizardProgress) proj.cloWizardProgress = {};
  if (!proj.cloWizardProgress[phaseId]) proj.cloWizardProgress[phaseId] = [];
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.cloWizardProgress[phaseId][stepIdx] || 'pendiente');
  proj.cloWizardProgress[phaseId][stepIdx] = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function cycleCloPhaseStatus(projId, fi) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.cloFases) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.cloFases[fi].estado);
  proj.cloFases[fi].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function advanceCloPhase(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado', 'error'); return; }
  if (!proj.cloFases || proj.cloFases.length === 0) {
    proj.cloFases = JSON.parse(JSON.stringify(_getCloFases()));
    if (proj.cloFases.length === 0) { showToast('Error: CLO_FASES no disponible', 'error'); return; }
  }
  const currentIdx = proj.cloFases.findIndex(f => f.estado === 'en_progreso');
  if (currentIdx === -1) {
    const firstPending = proj.cloFases.findIndex(f => f.estado === 'pendiente');
    if (firstPending !== -1) {
      proj.cloFases[firstPending].estado = 'en_progreso';
      showToast('🔬 Fase iniciada: ' + proj.cloFases[firstPending].nombre, 'success');
    }
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
    setTimeout(() => { const el = document.getElementById('clo-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
    return;
  }
  // Advance: complete current, activate next
  proj.cloFases[currentIdx].estado = 'completado';
  const nextIdx = proj.cloFases.findIndex((f, i) => i > currentIdx && f.estado === 'pendiente');
  if (nextIdx !== -1) { proj.cloFases[nextIdx].estado = 'en_progreso'; }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  setTimeout(() => { const el = document.getElementById('clo-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
}

function saveCloOutput(projId, phaseId, stepIdx, value) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.cloOutputs) proj.cloOutputs = {};
  if (!proj.cloOutputs[phaseId]) proj.cloOutputs[phaseId] = {};
  const trimmed = value.trim();
  const prev = proj.cloOutputs[phaseId][stepIdx] || '';
  if (trimmed === prev) return;
  if (trimmed) { proj.cloOutputs[phaseId][stepIdx] = trimmed; }
  else { delete proj.cloOutputs[phaseId][stepIdx]; }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  showToast('📤 Resultado guardado', 'success');
  setTimeout(() => renderProjectDash(projId), 150);
}

// ============================================================
// ARTIFACTS — Registry with transversal tags
// ============================================================

function _getArtifactTags() {
  return (typeof ARTIFACT_TAGS !== 'undefined') ? ARTIFACT_TAGS : [];
}

function addArtifact(projId, data) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.drArtifacts) proj.drArtifacts = [];
  // Auto-calculate iteration
  const iteration = proj.drArtifacts.filter(a => a.phase === data.phase && a.tag === data.tag).length + 1;
  // Auto-calculate delta
  const prev = proj.drArtifacts.filter(a => a.phase === data.phase && a.tag === data.tag && a.score != null)
    .sort((a, b) => b.iteration - a.iteration)[0];
  const delta = (data.score != null && prev) ? data.score - prev.score : null;

  proj.drArtifacts.push({
    id: Date.now().toString(36),
    name: data.name || '',
    phase: data.phase || '',
    tag: data.tag || 'otro',
    customTag: data.customTag || '',
    date: new Date().toISOString().split('T')[0],
    iteration,
    score: data.score != null ? Number(data.score) : null,
    delta,
    status: data.status || 'draft',
    links: data.links || [],
    notes: data.notes || '',
    auto: data.auto || false
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  showToast('📎 Artefacto registrado: ' + (data.name || data.tag), 'success');
  renderProjectDash(projId);
}

function removeArtifact(projId, artifactId) {
  if (!confirm('¿Eliminar este artefacto?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.drArtifacts = (proj.drArtifacts || []).filter(a => a.id !== artifactId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function updateArtifactNotes(projId, artifactId, notes) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const art = (proj.drArtifacts || []).find(a => a.id === artifactId);
  if (!art) return;
  art.notes = notes.trim();
  proj.updated = new Date().toISOString();
  saveProjects(projects);
}

function addArtifactLink(projId, artifactId) {
  const url = prompt('URL (Google Drive, etc.):');
  if (!url || !url.trim()) return;
  const desc = prompt('Descripción breve:') || '';
  const tag = prompt('Tag del enlace (borrador/score/fuentes/otro):') || 'otro';
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const art = (proj.drArtifacts || []).find(a => a.id === artifactId);
  if (!art) return;
  if (!art.links) art.links = [];
  art.links.push({ url: url.trim(), desc: desc.trim(), tag: tag.trim() });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('📁 Enlace agregado', 'success');
}

function showArtifactModal(projId, phase) {
  const tags = _getArtifactTags();
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="logbook-modal" style="max-width:480px;">`;
  html += `<h3 style="font-size:17px;">📎 Registrar artefacto</h3>`;
  html += `<label>Nombre</label>`;
  html += `<input id="art-name" type="text" placeholder="Ej: Score R2 - tabla de componentes" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;

  html += `<label>Tag</label>`;
  html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">`;
  tags.forEach(t => {
    html += `<button onclick="document.getElementById('art-tag').value='${t.id}';this.parentNode.querySelectorAll('button').forEach(b=>b.style.borderColor='rgba(220,215,205,0.1)');this.style.borderColor='${t.color}'" style="font-size:12px;padding:3px 8px;background:var(--bg2);border:2px solid rgba(220,215,205,0.1);border-radius:6px;color:${t.color};cursor:pointer;">${t.icon} ${t.label}</button>`;
  });
  html += `</div>`;
  html += `<input id="art-tag" type="hidden" value="otro">`;
  html += `<input id="art-custom-tag" type="text" placeholder="Si elegiste Otro, escribe el tag" style="width:100%;padding:6px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-size:13px;margin-bottom:8px;">`;

  html += `<label>Score (opcional)</label>`;
  html += `<input id="art-score" type="number" placeholder="Ej: 82" style="width:100px;padding:6px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-size:13px;">`;

  html += `<label>Estado</label>`;
  html += `<select id="art-status" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-size:14px;">`;
  html += `<option value="draft">Borrador</option><option value="reviewed">Revisado</option><option value="final">Final</option>`;
  html += `</select>`;

  html += `<label>Notas / Reflexión (opcional)</label>`;
  html += `<textarea id="art-notes" placeholder="¿Por qué es relevante este artefacto?" style="min-height:50px;"></textarea>`;

  html += `<div class="lb-actions" style="margin-top:12px;">`;
  html += `<button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="submitArtifact('${projId}','${phase}')" style="background:var(--green);color:#000;font-weight:600;">Registrar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function submitArtifact(projId, phase) {
  const name = document.getElementById('art-name')?.value?.trim();
  const tag = document.getElementById('art-tag')?.value || 'otro';
  const customTag = document.getElementById('art-custom-tag')?.value?.trim() || '';
  const scoreVal = document.getElementById('art-score')?.value;
  const status = document.getElementById('art-status')?.value || 'draft';
  const notes = document.getElementById('art-notes')?.value?.trim() || '';

  if (!name) { showToast('Escribe un nombre para el artefacto', 'error'); return; }

  addArtifact(projId, {
    name, phase, tag, customTag,
    score: scoreVal ? Number(scoreVal) : null,
    status, notes
  });
  document.querySelector('.proj-modal-overlay')?.remove();
}

// ============================================================
// BRANCHES — Project branching for argumentative exploration
// ============================================================

// ============================================================
// MIGRATION — Ensure projects have latest phase structure
// ============================================================

function migrateDrFases(proj) {
  if (!proj.drFases || proj.drFases.length === 0) return false;

  const currentFases = _getDrFases();
  if (currentFases.length === 0) return false;

  const existingIds = proj.drFases.map(f => f.id);
  const currentIds = currentFases.map(f => f.id);
  let changed = false;

  // Add missing phases in correct position
  currentIds.forEach((id, idx) => {
    if (!existingIds.includes(id)) {
      const newFase = JSON.parse(JSON.stringify(currentFases[idx]));
      newFase.estado = 'pendiente';
      // Insert at correct position
      proj.drFases.splice(idx, 0, newFase);
      changed = true;
    }
  });

  // Also migrate branch data if branches exist
  if (proj.drBranchData && changed) {
    Object.keys(proj.drBranchData).forEach(branchId => {
      const bd = proj.drBranchData[branchId];
      if (bd.drFases) {
        const bIds = bd.drFases.map(f => f.id);
        currentIds.forEach((id, idx) => {
          if (!bIds.includes(id)) {
            const newFase = JSON.parse(JSON.stringify(currentFases[idx]));
            newFase.estado = 'pendiente';
            bd.drFases.splice(idx, 0, newFase);
          }
        });
      }
    });
  }

  if (changed) {
    console.log('Migrated drFases: added ' + (proj.drFases.length - existingIds.length) + ' new phases');
  }
  return changed;
}

function initBranches(proj) {
  if (!proj.drBranches) {
    proj.drBranches = [{
      id: 'main',
      name: 'Línea principal',
      forkedFrom: null,
      forkedAtPhase: null,
      forkedDate: null,
      status: 'active' // active | paused | archived
    }];
    proj.drActiveBranch = 'main';
  }
}

function forkBranch(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  initBranches(proj);

  const currentBranch = proj.drActiveBranch || 'main';
  const activePhase = (proj.drFases || []).find(f => f.estado === 'en_progreso');
  if (!activePhase) { showToast('Activa una fase antes de bifurcar', 'error'); return; }

  const name = prompt('Nombre de la nueva rama (ej: "enfoque Williamson", "sin March"):');
  if (!name || !name.trim()) return;

  const branchId = 'branch-' + Date.now().toString(36);

  // Save current state to current branch before forking
  if (!proj.drBranchData) proj.drBranchData = {};
  proj.drBranchData[currentBranch] = {
    drFases: JSON.parse(JSON.stringify(proj.drFases)),
    drOutputs: JSON.parse(JSON.stringify(proj.drOutputs || {})),
    drGateRecords: JSON.parse(JSON.stringify(proj.drGateRecords || [])),
    drWizardProgress: JSON.parse(JSON.stringify(proj.drWizardProgress || {})),
    drArtifacts: JSON.parse(JSON.stringify(proj.drArtifacts || []))
  };

  // Create new branch
  proj.drBranches.push({
    id: branchId,
    name: name.trim(),
    forkedFrom: currentBranch,
    forkedAtPhase: activePhase.id,
    forkedDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  // Copy current data to new branch, reset phases from fork point forward
  const forkIdx = proj.drFases.findIndex(f => f.id === activePhase.id);
  const newFases = JSON.parse(JSON.stringify(proj.drFases));
  // Phases before fork: keep as inherited (completado)
  // Phases from fork: reset to pendiente, fork phase to en_progreso
  newFases.forEach((f, i) => {
    if (i > forkIdx) f.estado = 'pendiente';
    else if (i === forkIdx) f.estado = 'en_progreso';
    // Before fork: keep estado as is
  });

  // Copy outputs only up to fork point
  const newOutputs = {};
  const phaseIds = proj.drFases.map(f => f.id);
  Object.entries(proj.drOutputs || {}).forEach(([phase, tasks]) => {
    const phaseIdx = phaseIds.indexOf(phase);
    if (phaseIdx < forkIdx) newOutputs[phase] = JSON.parse(JSON.stringify(tasks));
  });

  // Copy gate records only up to fork point
  const forkPhaseIds = phaseIds.slice(0, forkIdx);
  const newGates = (proj.drGateRecords || []).filter(g => {
    const gPhase = g.gate.replace('dr_gate_', 'dr_');
    return forkPhaseIds.some(p => gPhase.includes(p.replace('dr_', '')));
  });

  proj.drBranchData[branchId] = {
    drFases: newFases,
    drOutputs: newOutputs,
    drGateRecords: JSON.parse(JSON.stringify(newGates)),
    drWizardProgress: {},
    drArtifacts: []
  };

  // Switch to new branch
  proj.drActiveBranch = branchId;
  proj.drFases = newFases;
  proj.drOutputs = newOutputs;
  proj.drGateRecords = JSON.parse(JSON.stringify(newGates));
  proj.drWizardProgress = {};

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('🌿 Rama creada: ' + name.trim() + ' (bifurcó en ' + activePhase.nombre + ')', 'success');
}

function switchBranch(projId, branchId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  initBranches(proj);
  if (!proj.drBranchData) proj.drBranchData = {};

  // Save current branch state
  const currentBranch = proj.drActiveBranch || 'main';
  proj.drBranchData[currentBranch] = {
    drFases: JSON.parse(JSON.stringify(proj.drFases || [])),
    drOutputs: JSON.parse(JSON.stringify(proj.drOutputs || {})),
    drGateRecords: JSON.parse(JSON.stringify(proj.drGateRecords || [])),
    drWizardProgress: JSON.parse(JSON.stringify(proj.drWizardProgress || {})),
    drArtifacts: JSON.parse(JSON.stringify(proj.drArtifacts || []))
  };

  // Load target branch state
  const targetData = proj.drBranchData[branchId];
  if (targetData) {
    proj.drFases = JSON.parse(JSON.stringify(targetData.drFases));
    proj.drOutputs = JSON.parse(JSON.stringify(targetData.drOutputs));
    proj.drGateRecords = JSON.parse(JSON.stringify(targetData.drGateRecords));
    proj.drWizardProgress = JSON.parse(JSON.stringify(targetData.drWizardProgress));
    proj.drArtifacts = JSON.parse(JSON.stringify(targetData.drArtifacts || []));
  }

  proj.drActiveBranch = branchId;
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);

  const branch = proj.drBranches.find(b => b.id === branchId);
  showToast('🌿 Rama activa: ' + (branch?.name || branchId), 'success');

  // Sync branch change to Supabase for Claude
  const activePhase = (proj.drFases || []).find(f => f.estado === 'en_progreso');
  if (activePhase) {
    syncWizardContext(projId, {
      active_phase: activePhase.id,
      active_phase_name: activePhase.nombre,
      workflow_mode: proj.workflowMode || 'dr',
      active_branch: branchId,
      active_branch_name: branch?.name || branchId
    });
  }
}

function setBranchStatus(projId, branchId, newStatus) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const branch = (proj.drBranches || []).find(b => b.id === branchId);
  if (!branch) return;

  const currentStatus = branch.status || 'active';

  // Validate transitions (includes legacy 'archived' state)
  const allowed = {
    'active':    ['paused', 'discarded', 'completed'],
    'paused':    ['active', 'discarded'],
    'discarded': ['paused'],
    'completed': ['active'],
    'archived':  ['active', 'paused']
  };
  if (allowed[currentStatus] && !allowed[currentStatus].includes(newStatus)) {
    showToast('No se puede pasar de ' + currentStatus + ' a ' + newStatus, 'error');
    return;
  }

  // Main can't be discarded
  if (branchId === 'main' && newStatus === 'discarded') {
    showToast('La rama principal no se puede descartar', 'error');
    return;
  }

  branch.status = newStatus;

  // Add automatic note on status change
  if (!branch.notes) branch.notes = [];
  const statusLabels = { active: 'En curso', paused: 'En espera', discarded: 'Descartada', completed: 'Completada' };
  branch.notes.push({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    text: '→ Estado cambió a: ' + (statusLabels[newStatus] || newStatus)
  });

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('🌿 Rama ' + (statusLabels[newStatus] || newStatus) + ': ' + branch.name, 'success');
}

function addBranchNote(projId, branchId) {
  const note = prompt('Nota / observación para esta rama:');
  if (!note || !note.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const branch = (proj.drBranches || []).find(b => b.id === branchId);
  if (!branch) return;
  if (!branch.notes) branch.notes = [];
  branch.notes.push({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    text: note.trim()
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('📌 Nota agregada a rama', 'success');
}

function freezeBranch(projId, branchId) {
  const label = prompt('Etiqueta de congelamiento (ej: "Presentación comité marzo", "Avance tutor"):');
  if (!label || !label.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const branch = (proj.drBranches || []).find(b => b.id === branchId);
  if (!branch) return;
  if (!branch.frozen) branch.frozen = [];
  // Save current state as frozen snapshot
  const branchData = (proj.drActiveBranch === branchId)
    ? { drFases: proj.drFases, drOutputs: proj.drOutputs, drGateRecords: proj.drGateRecords, drArtifacts: proj.drArtifacts }
    : proj.drBranchData?.[branchId];
  branch.frozen.push({
    label: label.trim(),
    date: new Date().toISOString().split('T')[0],
    snapshot: JSON.parse(JSON.stringify(branchData || {}))
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('🧊 Rama congelada: ' + label.trim() + ' (el trabajo puede continuar)', 'success');
}

function deleteBranch(projId, branchId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (branchId === 'main') { showToast('No se puede eliminar la rama principal', 'error'); return; }
  // Check for sub-branches
  const hasChildren = (proj.drBranches || []).some(b => b.forkedFrom === branchId);
  if (hasChildren) { showToast('Esta rama tiene sub-ramas. Solo se puede archivar, no eliminar.', 'error'); return; }
  if (!confirm('¿Eliminar rama "' + ((proj.drBranches || []).find(b => b.id === branchId)?.name || branchId) + '"? Esta acción no se puede deshacer.')) return;
  // If active branch, switch to main first
  if (proj.drActiveBranch === branchId) {
    const mainData = proj.drBranchData?.['main'];
    if (mainData) {
      proj.drFases = JSON.parse(JSON.stringify(mainData.drFases));
      proj.drOutputs = JSON.parse(JSON.stringify(mainData.drOutputs));
      proj.drGateRecords = JSON.parse(JSON.stringify(mainData.drGateRecords));
      proj.drWizardProgress = JSON.parse(JSON.stringify(mainData.drWizardProgress));
      proj.drArtifacts = JSON.parse(JSON.stringify(mainData.drArtifacts || []));
    }
    proj.drActiveBranch = 'main';
  }
  // Remove branch and its data
  proj.drBranches = (proj.drBranches || []).filter(b => b.id !== branchId);
  if (proj.drBranchData) delete proj.drBranchData[branchId];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  showToast('🗑 Rama eliminada', 'success');
}

// ============================================================
// MEMBER MANAGEMENT — Remove members
// ============================================================

async function removeMember(projId, userId) {
  if (!confirm('¿Revocar acceso de este miembro al proyecto?')) return;
  if (!state.sdb) return;
  try {
    await state.sdb.from('project_members').delete()
      .eq('project_id', projId).eq('user_id', userId);
    showToast('Acceso revocado', 'success');
    renderProjectDash(projId);
  } catch (e) {
    showToast('Error al revocar: ' + e.message, 'error');
  }
}

// ============================================================
// CLONE PROJECT — Create independent copy
// ============================================================

async function cloneProject(projId) {
  const projects = getProjects();
  const source = projects.find(p => p.id === projId);
  if (!source) { showToast('Proyecto no encontrado', 'error'); return; }

  const newName = prompt('Nombre para tu copia del proyecto:', source.nombre + ' (mi versión)');
  if (!newName || !newName.trim()) return;

  if (!state.sdb || !state.currentUser) { showToast('Necesitas estar logueado', 'error'); return; }

  try {
    // Create new project in Supabase
    const metadata = JSON.parse(JSON.stringify(source));
    // Clean up: remove id, owner-specific data
    delete metadata.id;
    delete metadata.created;
    delete metadata.updated;
    delete metadata._db_owner_id;
    metadata.nombre = newName.trim();
    metadata.descripcion = (source.descripcion || '') + '\n\n[Clonado de: ' + source.nombre + ']';
    metadata.clonedFrom = { projectId: projId, projectName: source.nombre, date: new Date().toISOString().split('T')[0] };
    // Reset progress: keep structure but reset wizard progress
    if (metadata.drWizardProgress) metadata.drWizardProgress = {};
    if (metadata.drGateRecords) metadata.drGateRecords = [];
    if (metadata.drArtifacts) metadata.drArtifacts = [];
    if (metadata.drOutputs) metadata.drOutputs = {};
    // Reset branches to just main
    metadata.drBranches = [{ id: 'main', name: 'Línea principal', forkedFrom: null, forkedAtPhase: null, forkedDate: null, status: 'active' }];
    metadata.drActiveBranch = 'main';
    metadata.drBranchData = {};
    // Reset phases to pendiente
    if (metadata.drFases) {
      metadata.drFases.forEach(f => { f.estado = 'pendiente'; });
    }

    const { data, error } = await state.sdb.from('projects').insert({
      title: newName.trim(),
      description: metadata.descripcion,
      owner_id: state.currentUser.id,
      metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single();

    if (error) { showToast('Error al clonar: ' + error.message, 'error'); return; }

    // Reload projects
    const { loadProjects } = await import('./sync.js').catch(() => ({}));
    if (loadProjects) await loadProjects();
    else { state.projects.push({ id: data.id, ...metadata }); }

    showToast('🧬 Proyecto clonado: ' + newName.trim(), 'success');
    renderProjectDash(data.id);
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

function generatePortfolio(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado', 'error'); return; }
  const artifacts = proj.drArtifacts || [];
  const tags = _getArtifactTags();
  const today = new Date().toISOString().split('T')[0];

  let r = '# Portafolio de Artefactos del Proceso\n';
  r += '## ' + (proj.nombre || 'Proyecto') + '\n';
  r += '### Generado: ' + today + '\n\n---\n\n';

  // Score trajectory
  const scored = artifacts.filter(a => a.score != null).sort((a, b) => a.date.localeCompare(b.date));
  if (scored.length > 0) {
    r += '## Trayectoria de scores\n\n';
    r += '| Fase | Tag | Iter | Fecha | Score | Delta | Estado |\n';
    r += '|------|-----|------|-------|-------|-------|--------|\n';
    scored.forEach(a => {
      const tagObj = tags.find(t => t.id === a.tag);
      r += `| ${a.phase} | ${tagObj ? tagObj.icon + ' ' + tagObj.label : a.tag} | R${a.iteration} | ${a.date} | ${a.score} | ${a.delta != null ? (a.delta >= 0 ? '+' : '') + a.delta : '—'} | ${a.status} |\n`;
    });
    r += '\n';
  }

  // By phase
  r += '## Artefactos por fase\n\n';
  const phases = {};
  artifacts.forEach(a => {
    if (!phases[a.phase]) phases[a.phase] = [];
    phases[a.phase].push(a);
  });
  Object.entries(phases).forEach(([phase, arts]) => {
    r += `### ${phase} (${arts.length})\n`;
    arts.forEach(a => {
      const tagObj = tags.find(t => t.id === a.tag);
      r += `- **${tagObj ? tagObj.icon : '📌'} ${a.name}** — ${a.date} — ${a.status}`;
      if (a.score != null) r += ` — Score: ${a.score}`;
      if (a.delta != null) r += ` (${a.delta >= 0 ? '+' : ''}${a.delta})`;
      r += '\n';
      if (a.links && a.links.length > 0) {
        a.links.forEach(l => { r += `  - [${l.desc || 'Enlace'}](${l.url})\n`; });
      }
      if (a.notes) r += `  > ${a.notes}\n`;
    });
    r += '\n';
  });

  // Reflections
  const withNotes = artifacts.filter(a => a.notes);
  if (withNotes.length > 0) {
    r += '## Reflexiones del investigador\n\n';
    withNotes.forEach(a => {
      r += `**${a.date} — ${a.name}:** ${a.notes}\n\n`;
    });
  }

  // Branches section
  const branches = proj.drBranches || [];
  if (branches.length > 1) {
    r += '## Ramas exploradas\n\n';
    branches.forEach(b => {
      const statusLabels = { active: 'activa', paused: 'pausada', archived: 'archivada' };
      r += `### ${b.name} (${statusLabels[b.status] || b.status})\n`;
      if (b.forkedFrom) {
        const parent = branches.find(p => p.id === b.forkedFrom);
        r += `Bifurcó de ${parent?.name || b.forkedFrom} en fase ${b.forkedAtPhase} · ${b.forkedDate}\n`;
      }
      r += '\n';
    });
  }

  r += '---\n*Generado por CRISOL · ' + today + '*\n';

  const blob = new Blob([r], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const safeName = (proj.nombre || 'proyecto').replace(/[^a-zA-Z0-9áéíóúñ _-]/g, '').replace(/\s+/g, '_');
  a.download = 'Portafolio_' + safeName + '_' + today + '.md';
  a.click();
  showToast('📊 Portafolio generado', 'success');
}

// --- Load and render DR alerts from Supabase ---
async function loadAndRenderDrAlerts(projId) {
  const container = document.getElementById('dr-alerts-container');
  if (!container) return;
  const alerts = await loadDrAlerts(projId);
  const unresolved = alerts.filter(a => !a.resolved);
  if (unresolved.length === 0) { container.innerHTML = ''; return; }

  let h = '';
  unresolved.forEach(a => {
    const colors = { block: 'var(--red)', warning: 'var(--gold)', info: 'var(--blue)' };
    const icons = { block: '🔴', warning: '🟡', info: '🟢' };
    const bgColors = { block: 'rgba(224,112,80,0.08)', warning: 'rgba(232,168,56,0.08)', info: 'rgba(144,200,240,0.08)' };
    h += `<div style="background:${bgColors[a.type]};border:1px solid ${colors[a.type]};border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">`;
    h += `<span style="font-size:18px;">${icons[a.type]}</span>`;
    h += `<div style="flex:1;">`;
    h += `<div style="font-size:13px;font-weight:600;color:${colors[a.type]};">${a.type === 'block' ? 'BLOQUEADO' : a.type === 'warning' ? 'ALERTA' : 'INFO'} — ${a.code || ''}</div>`;
    h += `<div style="font-size:13px;color:var(--tx2);">${a.message}</div>`;
    if (a.detail) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">${a.detail}</div>`;
    h += `</div>`;
    h += `<span style="font-size:11px;color:var(--tx3);cursor:pointer;" onclick="resolveDrAlertUI('${a.id}','${projId}')" title="Marcar como resuelto">✓ resolver</span>`;
    h += `</div>`;
  });
  container.innerHTML = h;
}

async function resolveDrAlertUI(alertId, projId) {
  await resolveDrAlert(alertId);
  showToast('Alerta resuelta', 'success');
  loadAndRenderDrAlerts(projId);
}

function saveDrOutput(projId, phaseId, stepIdx, value) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.drOutputs) proj.drOutputs = {};
  if (!proj.drOutputs[phaseId]) proj.drOutputs[phaseId] = {};
  const trimmed = value.trim();
  const prev = proj.drOutputs[phaseId][stepIdx] || '';
  if (trimmed === prev) return; // No change, skip save and re-render
  if (trimmed) {
    proj.drOutputs[phaseId][stepIdx] = trimmed;
  } else {
    delete proj.drOutputs[phaseId][stepIdx];
  }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  showToast('📤 Resultado guardado', 'success');
  // Delay re-render slightly so blur completes
  setTimeout(() => renderProjectDash(projId), 150);
}

function toggleDrWizardStep(projId, phaseId, stepIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.drWizardProgress) proj.drWizardProgress = {};
  if (!proj.drWizardProgress[phaseId]) proj.drWizardProgress[phaseId] = [];
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.drWizardProgress[phaseId][stepIdx] || 'pendiente');
  proj.drWizardProgress[phaseId][stepIdx] = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function setWorkflowMode(projId, mode) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  // Toggle off if clicking the same mode
  if (proj.workflowMode === mode) { proj.workflowMode = 'default'; proj.drMode = false; }
  else { proj.workflowMode = mode; proj.drMode = (mode === 'dr' || mode === 'mixed'); }

  // Initialize DR fases if needed
  if ((mode === 'dr' || mode === 'mixed') && (!proj.drFases || proj.drFases.length === 0)) {
    proj.drFases = JSON.parse(JSON.stringify(_getDrFases()));
  }
  // Initialize CLO fases if needed
  if ((mode === 'clo' || mode === 'mixed') && (!proj.cloFases || proj.cloFases.length === 0)) {
    proj.cloFases = JSON.parse(JSON.stringify(_getCloFases()));
  }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  const labels = { dr: '🧬 Modo /dr activado', clo: '🔬 Modo clo-author activado', mixed: '🔗 Modo mixto activado', default: 'Workflow estándar' };
  showToast(labels[proj.workflowMode] || labels.default, 'success');
}

// Backward compat
function toggleDrMode(projId) { setWorkflowMode(projId, 'dr'); }

function cycleDrPhaseStatus(projId, fi) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.drFases) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.drFases[fi].estado);
  proj.drFases[fi].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function advanceDrPhase(projId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId);
  if (!proj) { showToast('Proyecto no encontrado','error'); return; }
  if (!proj.drFases || proj.drFases.length === 0) {
    proj.drFases = JSON.parse(JSON.stringify(_getDrFases()));
    if (proj.drFases.length === 0) { showToast('Error: DR_FASES no disponible','error'); return; }
  }
  const currentIdx = proj.drFases.findIndex(f => f.estado === 'en_progreso');
  if (currentIdx === -1) {
    const firstPending = proj.drFases.findIndex(f => f.estado === 'pendiente');
    if (firstPending !== -1) {
      proj.drFases[firstPending].estado = 'en_progreso';
      showToast('🧬 Fase iniciada: ' + proj.drFases[firstPending].nombre, 'success');
      // Sync wizard context to Supabase for Claude
      syncWizardContext(projId, {
        active_phase: proj.drFases[firstPending].id,
        active_phase_name: proj.drFases[firstPending].nombre,
        workflow_mode: proj.workflowMode || 'dr',
        active_branch: proj.drActiveBranch || 'main',
        active_branch_name: (proj.drBranches || []).find(b => b.id === (proj.drActiveBranch || 'main'))?.name || 'main'
      });
    }
    proj.updated = new Date().toISOString();
    saveProjects(projects);
    renderProjectDash(projId);
    setTimeout(() => { const el = document.getElementById('dr-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
    return;
  }
  // Check DR gate
  const currentPhase = proj.drFases[currentIdx];
  const drGates = _getDrPhaseGates();
  let gate = null;
  for (const [gateKey, g] of Object.entries(drGates)) {
    if (g.trigger.includes(currentPhase.id)) { gate = { key: gateKey, ...g }; break; }
  }
  if (gate) {
    showDrGateModal(projId, currentIdx, gate);
  } else {
    doAdvanceDrPhase(projId, currentIdx);
  }
}

function doAdvanceDrPhase(projId, currentIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.drFases) return;
  proj.drFases[currentIdx].estado = 'completado';
  const nextIdx = proj.drFases.findIndex((f, i) => i > currentIdx && f.estado === 'pendiente');
  if (nextIdx !== -1) {
    proj.drFases[nextIdx].estado = 'en_progreso';
    // Sync wizard context to Supabase for Claude
    syncWizardContext(projId, {
      active_phase: proj.drFases[nextIdx].id,
      active_phase_name: proj.drFases[nextIdx].nombre,
      workflow_mode: proj.workflowMode || 'dr',
      active_branch: proj.drActiveBranch || 'main',
      active_branch_name: (proj.drBranches || []).find(b => b.id === (proj.drActiveBranch || 'main'))?.name || 'main',
      gate_responses: (proj.drGateRecords || []).reduce((acc, g) => { acc[g.gate] = g.responses; return acc; }, {}),
      socratic_responses: (proj.drGateRecords || []).reduce((acc, g) => { if (g.socratic) acc[g.gate] = g.socratic; return acc; }, {})
    });
  }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
  setTimeout(() => { const el = document.getElementById('dr-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

function showDrGateModal(projId, currentIdx, gate) {
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  const hasSocratic = gate.socratic && gate.socratic.length > 0;
  const totalQ = gate.questions.length;
  const totalS = hasSocratic ? gate.socratic.length : 0;

  let html = `<div class="logbook-modal" style="max-width:620px;max-height:85vh;overflow-y:auto;">`;
  html += `<h3 style="font-size:17px;">🚧 ${gate.title}</h3>`;
  html += `<div style="font-size:14px;color:var(--tx2);line-height:1.6;margin-bottom:14px;">${gate.description}</div>`;

  // Verification questions (dropdown)
  html += `<div style="font-size:13px;font-weight:600;color:var(--gold);margin:12px 0 6px;">📋 Verificación</div>`;
  gate.questions.forEach((q, qi) => {
    html += `<label style="font-size:13px;">${q.label}</label>`;
    if (q.type === 'select') {
      html += `<select id="dr-gate-q-${qi}" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;margin-bottom:8px;">`;
      q.options.forEach((opt, oi) => { html += `<option value="${oi}">${opt}</option>`; });
      html += `</select>`;
    } else if (q.type === 'textarea') {
      html += `<textarea id="dr-gate-q-${qi}" placeholder="${q.placeholder || ''}" style="min-height:60px;margin-bottom:8px;"></textarea>`;
    }
  });

  // Socratic questions (mandatory textarea)
  if (hasSocratic) {
    html += `<div style="border-top:1px solid rgba(155,125,207,0.2);margin:16px 0 8px;padding-top:12px;">`;
    html += `<div style="font-size:13px;font-weight:600;color:var(--purple);margin-bottom:6px;">🧠 Reflexión socrática (obligatoria)</div>`;
    html += `<div style="font-size:12px;color:var(--tx3);margin-bottom:10px;">No puedes avanzar sin responder estas preguntas por escrito. Tu reflexión se guarda como parte del proceso y alimenta la trazabilidad.</div>`;
    gate.socratic.forEach((s, si) => {
      html += `<label style="font-size:13px;color:var(--purple);">${s.label}</label>`;
      html += `<textarea id="dr-gate-s-${si}" placeholder="${s.placeholder || ''}" style="min-height:80px;margin-bottom:10px;border-color:rgba(155,125,207,0.2);"></textarea>`;
    });
    html += `</div>`;
  }

  html += `<div class="lb-actions" style="margin-top:16px;">`;
  html += `<button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  // Block skip on verification gate
  const isVerifyGate = gate.key === 'dr_gate_verify';
  if (!isVerifyGate) {
    html += `<button onclick="skipDrGate('${projId}',${currentIdx},'${gate.key}');this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx3);font-size:13px;">Saltar gate ⚠</button>`;
  }
  html += `<button onclick="completeDrGate('${projId}',${currentIdx},'${gate.key}',${totalQ},${totalS})" style="background:var(--green);color:#000;font-weight:600;">Completar y avanzar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
}

function completeDrGate(projId, currentIdx, gateKey, numQ, numS) {
  const responses = {};
  const socraticResponses = {};
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const drGates = _getDrPhaseGates();
  const gate = drGates[gateKey];
  if (!gate || !gate.questions) { doAdvanceDrPhase(projId, currentIdx); return; }

  // Collect verification responses
  for (let i = 0; i < numQ; i++) {
    const el = document.getElementById('dr-gate-q-' + i);
    if (!el) continue;
    const q = gate.questions[i];
    if (q.type === 'textarea') {
      responses[q.id] = el.value.trim();
    } else {
      responses[q.id] = { index: parseInt(el.value), label: q.options[parseInt(el.value)] };
    }
  }

  // Collect and VALIDATE socratic responses
  if (gate.socratic && gate.socratic.length > 0) {
    for (let i = 0; i < numS; i++) {
      const el = document.getElementById('dr-gate-s-' + i);
      if (!el) continue;
      const s = gate.socratic[i];
      const val = el.value.trim();
      if (s.required && val.length < 20) {
        el.style.borderColor = 'var(--red)';
        showToast('Responde la reflexión socrática (mínimo 20 caracteres): ' + s.label.substring(0, 50) + '...', 'error');
        el.focus();
        return; // BLOCK — do not advance
      }
      socraticResponses[s.id] = val;
    }
  }

  if (!proj.drGateRecords) proj.drGateRecords = [];
  proj.drGateRecords.push({
    gate: gateKey,
    fecha: new Date().toISOString().split('T')[0],
    responses,
    socratic: socraticResponses,
    skipped: false
  });
  proj.updated = new Date().toISOString();
  saveProjects(projects);

  // Write socratic responses to Supabase for Claude to read
  if (Object.keys(socraticResponses).length > 0) {
    const drGates = _getDrPhaseGates();
    const gatePhase = drGates[gateKey]?.trigger?.[0] || gateKey;
    writeSocraticEntry(projId, {
      phase: gatePhase,
      skill: 'gate_' + gateKey,
      questions: (drGates[gateKey]?.socratic || []).map(s => ({ q: s.label, type: 'gate' })),
      researcher_answer: Object.values(socraticResponses).join('\n---\n'),
      context_for_next: Object.entries(socraticResponses).map(([k,v]) => k + ': ' + v).join(' | ')
    });
  }

  document.querySelector('.proj-modal-overlay')?.remove();
  showToast('🧠 Gate completado con reflexión socrática', 'success');
  doAdvanceDrPhase(projId, currentIdx);
}

function skipDrGate(projId, currentIdx, gateKey) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.drGateRecords) proj.drGateRecords = [];
  proj.drGateRecords.push({ gate: gateKey, fecha: new Date().toISOString().split('T')[0], responses: {}, skipped: true });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  doAdvanceDrPhase(projId, currentIdx);
}

function downloadDrSkill(skillId) {
  const skills = _getDrSkillFiles();
  const skill = skills[skillId];
  if (!skill) { showToast('Skill no encontrada', 'error'); return; }

  let content = `# ${skill.name}\n\n`;
  content += `${skill.description}\n\n`;
  content += `---\n\n`;
  content += `## Cómo instalar en Claude Code\n\n`;
  content += `1. Copia este archivo a: \`~/.claude/skills/dr/references/\`\n`;
  content += `2. O bien, en una conversación con Claude Code, di: \`/dr\` seguido del comando\n`;
  content += `3. Si Claude no reconoce /dr, pide: "instala la skill /dr desde el repositorio CRISOL"\n\n`;
  content += `## Uso rápido\n\n`;

  const prompts = {
    dr_read: '/dr read [archivo o texto pegado]\n/dr read --gap [texto] (buscar lo que tu tesis no cubre)\n/dr read --compare [texto_a] [texto_b]\n/dr read --scan [carpeta]',
    dr_write: '/dr write section "[título]" --from [notas|ficha|outline]\n/dr write draft "[artículo]" --outline\n/dr write extend "[texto]" [dirección]\n/dr write rewrite "[fragmento]" [instrucción]',
    dr_review: '/dr review [archivo o texto]',
    dr_humanize: '/dr humanize [archivo o texto]',
    dr_verify: '/dr verify [archivo o texto]',
    dr_mentor: '/dr mentor [texto o idea]\n/dr mentor --defend "[afirmación]"\n/dr mentor --clarify "[concepto]"\n/dr mentor --connect "[idea a]" "[idea b]"',
    dr_devil: '/dr devil [texto o argumento]\n/dr devil --reviewer "[texto]" [revista]\n/dr devil --defense "[texto]"\n/dr devil --steelman "[contraargumento]"'
  };
  content += '```\n' + (prompts[skillId] || '') + '\n```\n\n';
  content += `---\n\n`;
  content += `Generado por CRISOL · ${new Date().toLocaleDateString()}\n`;
  content += `Para la skill completa, instala /dr en Claude Code.\n`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = skill.filename; a.click();
  showToast('📥 ' + skill.name + ' descargada', 'success');
}

// ============================================================
// Research question log
// ============================================================

function addQuestionEntry(projId) {
  const texto = prompt('Pregunta de investigación actual:');
  if (!texto || !texto.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.preguntaLog) proj.preguntaLog = [];
  const today = new Date().toISOString().slice(0, 10);
  proj.preguntaLog.push({ fecha: today, texto: texto.trim() });
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

function removeQuestionEntry(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.preguntaLog) return;
  proj.preguntaLog.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  renderProjectDash(projId);
}

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

// ============================================================
// renderProjectDash — full project dashboard
// ============================================================

function renderProjectDash(projId) {
  const ct = document.getElementById('ct'); if (!ct) return;
  const projects = getProjects();
  const proj = projects.find(p => p.id === projId);
  if (!proj) { state._goHome(); return; }

  const manifest = window.SILA_MANIFEST || [];
  const docs = getDocs();

  // Resolve linked resources
  const projArts = (proj.articulos || []).map(a => {
    const meta = manifest.find(m => m.key === a.key);
    return meta ? { ...a, ...meta } : null;
  }).filter(Boolean);

  const projDocs = (proj.documentos || []).map(d => {
    const doc = docs.find(dd => dd.id === d.id);
    return doc ? { ...d, doc: doc } : null;
  }).filter(Boolean);

  const totalWords = projDocs.reduce((sum, d) => sum + countDocWords(d.doc), 0);
  const days = calcDaysRemaining(proj.fechaLimite);
  const daysClass = days < 7 && days !== Infinity ? 'urgent' : days < 14 && days !== Infinity ? 'warning' : '';

  const isOwner = canEditProject(proj);

  let h = `<div style="margin-bottom:8px;"><a href="#" onclick="goHome();return false;" style="color:var(--blue);font-size:13px;text-decoration:none;">← Vista general</a></div>`;

  // Header
  h += `<div class="proj-header">`;
  h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
  h += `<div class="proj-title">${proj.nombre}`;
  if (proj._isShared) h += ` <span style="font-size:13px;color:var(--purple);font-weight:400;">👥 ${PROJ_ROLE_LABELS[proj._myRole] || proj._myRole}</span>`;
  h += `</div>`;
  h += `<div style="display:flex;gap:6px;">`;
  if (isOwner) {
    h += `<button class="btn bo" onclick="showInviteModal('${proj.id}')" style="font-size:12px;padding:4px 12px;color:var(--purple);border-color:var(--purple);">👥 Invitar</button>`;
    h += `<button class="btn bo" onclick="editProject('${proj.id}')" style="font-size:12px;padding:4px 12px;">✏️ Editar</button>`;
  }
  if (!isOwner) {
    h += `<button class="btn bo" onclick="cloneProject('${proj.id}')" style="font-size:12px;padding:4px 12px;color:var(--green);border-color:var(--green);">🧬 Clonar proyecto</button>`;
  }
  h += `</div>`;
  h += `</div>`;
  if (proj.descripcion) h += `<div class="proj-desc">${proj.descripcion}</div>`;
  h += `<div class="proj-meta">`;
  if (proj.fechaLimite) {
    const dLabel = days === Infinity ? '' : '(' + days + ' día' + (days !== 1 ? 's' : '') + ')';
    h += `<span>📅 ${proj.fechaLimite} ${dLabel}</span>`;
  }
  if (proj.carpetaDrive) h += `<a href="${proj.carpetaDrive}" target="_blank" onclick="event.stopPropagation()">📁 Abrir carpeta en Drive</a>`;
  h += `</div>`;

  // Team members (async load, renders into placeholder)
  h += `<div id="proj-members-area"></div>`;
  loadProjectMembers(projId).then(members => {
    const area = document.getElementById('proj-members-area');
    if (!area || members.length <= 1) return; // Don't show if only owner
    const ROLE_COLORS = { owner: 'var(--gold)', reviewer: 'var(--green)', reader: 'var(--tx3)', coauthor: 'var(--blue)' };
    const ROLE_LABELS = { owner: 'Dueño', reviewer: 'Reviewer', reader: 'Lector', coauthor: 'Lector' };
    const isOwner = members.some(m => m.role === 'owner' && m.user_id === state.currentUser?.id);
    let mh = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0;align-items:center;">';
    mh += '<span style="font-size:12px;color:var(--tx3);">Equipo:</span>';
    members.forEach(m => {
      const name = m.profiles?.display_name || 'Sin nombre';
      const role = m.role === 'coauthor' ? 'reader' : m.role;
      const color = ROLE_COLORS[role] || 'var(--tx3)';
      const isMe = m.user_id === state.currentUser?.id;
      mh += `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:12px;background:${color}18;border:1px solid ${color}30;color:${color};">${name}${isMe ? ' (tú)' : ''} · ${ROLE_LABELS[role] || role}`;
      if (isOwner && !isMe && role !== 'owner') {
        mh += ` <span onclick="removeMember('${proj.id}','${m.user_id}')" style="cursor:pointer;opacity:0.5;margin-left:2px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5" title="Revocar acceso">✕</span>`;
      }
      mh += `</span>`;
    });
    mh += '</div>';
    area.innerHTML = mh;
  });

  // Phase indicator in header
  if (!proj.fases) { proj.fases = JSON.parse(JSON.stringify(DEFAULT_FASES)); saveProjects(projects); }
  const headerPhase = proj.fases.find(f => f.estado === 'en_progreso');
  if (headerPhase) {
    h += `<div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding:8px 14px;background:rgba(144,200,240,0.06);border:1px solid rgba(144,200,240,0.12);border-radius:8px;">`;
    h += `<span style="font-size:13px;color:var(--tx3);">Fase actual:</span>`;
    h += `<span style="font-size:14px;font-weight:600;color:var(--blue);">🔵 ${headerPhase.nombre}</span>`;
    h += `<div style="margin-left:auto;display:flex;gap:6px;">`;
    h += `<button onclick="revertPhase('${proj.id}')" style="background:none;border:1px solid rgba(220,215,205,0.1);color:var(--tx3);padding:3px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;" title="Retroceder fase">← Atrás</button>`;
    h += `<button onclick="advancePhase('${proj.id}')" style="background:rgba(93,187,138,0.15);border:1px solid rgba(93,187,138,0.25);color:var(--green);padding:3px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:'Inter',sans-serif;" title="Avanzar a siguiente fase">Avanzar →</button>`;
    h += `</div></div>`;
  } else {
    const hasAny = proj.fases.some(f => f.estado !== 'pendiente');
    if (!hasAny) {
      h += `<div style="margin-top:8px;"><button onclick="advancePhase('${proj.id}')" style="background:rgba(144,200,240,0.1);border:1px solid rgba(144,200,240,0.2);color:var(--blue);padding:6px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;">▶ Iniciar proyecto (activar primera fase)</button></div>`;
    }
  }
  h += `</div>`;

  // KPIs
  h += `<div class="proj-kpis">`;
  h += `<div class="proj-kpi"><div class="proj-kpi-num">${projArts.length}</div><div class="proj-kpi-label">artículos</div></div>`;
  h += `<div class="proj-kpi"><div class="proj-kpi-num">${projDocs.length}</div><div class="proj-kpi-label">escritos</div></div>`;
  h += `<div class="proj-kpi"><div class="proj-kpi-num">${totalWords.toLocaleString()}</div><div class="proj-kpi-label">palabras</div></div>`;
  if (days !== Infinity) h += `<div class="proj-kpi"><div class="proj-kpi-num ${daysClass}">${days}</div><div class="proj-kpi-label">días</div></div>`;
  h += `</div>`;

  // === KANBAN del proyecto ===
  const projKanbanItems = getKanban().filter(it => it.projectId === proj.id);
  const projKanbanPending = projKanbanItems.filter(it => it.column !== 'done').length;
  h += `<div style="margin:12px 0 8px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">`;
  h += `<span style="font-size:15px;font-weight:700;color:var(--tx);">📋 Tareas <span style="font-weight:400;color:var(--tx3);font-size:13px;">(${projKanbanPending} pendientes)</span></span>`;
  h += `<button onclick="addKanbanTaskForProject('${proj.id}')" style="background:var(--bg3);border:1px solid rgba(220,215,205,0.1);color:var(--tx2);padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;">+ Tarea</button>`;
  h += `</div>`;
  h += renderKanbanForProject(proj.id);
  h += `</div>`;

  // === LOGBOOK (Bitácora) ===
  const bitacora = proj.bitacora || [];
  const bitacoraCollapsed = bitacora.length > 3;
  // Bitácora header + prominent CTA
  h += `<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px;">`;
  h += `<span style="font-size:15px;font-weight:700;color:var(--tx);">📝 Bitácora <span style="font-weight:400;color:var(--tx3);font-size:13px;">(${bitacora.length} entradas)</span></span>`;
  if (isOwner) h += `<button onclick="showLogbookModal('${proj.id}')" style="background:rgba(232,168,56,0.12);border:1px solid rgba(232,168,56,0.25);color:var(--gold);padding:8px 18px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;transition:all 0.12s;" onmouseover="this.style.background='rgba(232,168,56,0.2)'" onmouseout="this.style.background='rgba(232,168,56,0.12)'">📝 Registrar sesión</button>`;
  h += `</div>`;

  // Helper to render a logbook entry
  function renderLogEntry(entry, projIdStr) {
    const typeLabels = { lectura: 'Lectura', escritura: 'Escritura', revision: 'Revisión', busqueda: 'Búsqueda', otro: 'Otro' };
    const typeIcons = { lectura: '📖', escritura: '✍', revision: '🔍', busqueda: '🔎', otro: '📌' };
    let e = `<div class="logbook-entry">`;
    e += `<span class="logbook-remove" onclick="event.stopPropagation();removeLogbookEntry('${projIdStr}','${entry.id}')">✕</span>`;
    e += `<span style="font-size:11px;color:var(--tx3);cursor:pointer;opacity:0.4;float:right;margin-right:8px;" onclick="event.stopPropagation();editLogbookEntry('${projIdStr}','${entry.id}')" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✎</span>`;
    e += `<span class="logbook-date">${entry.fecha}${entry.hora ? ' · ' + entry.hora : ''}</span>`;
    e += `<span class="logbook-type ${entry.tipo || 'otro'}">${typeIcons[entry.tipo] || '📌'} ${typeLabels[entry.tipo] || 'Otro'}</span>`;
    if (entry.version) e += `<span class="logbook-version">📄 ${entry.version}</span>`;
    if (entry.fase) e += `<span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:11px;background:rgba(144,200,240,0.08);color:var(--blue);margin-left:6px;">${entry.fase}</span>`;
    e += `<div class="logbook-note">${linkify(entry.nota)}</div>`;
    // Entry links
    if (entry.links && entry.links.length > 0) {
      e += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">`;
      const linkIcons = { carpeta: '📁', documento: '📄', web: '🔗', nota: '📓' };
      entry.links.forEach((lnk, li) => {
        const icon = linkIcons[lnk.tipo] || '📎';
        e += `<a href="${lnk.url}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;background:var(--bg3);border:1px solid rgba(220,215,205,0.06);border-radius:5px;color:var(--blue);font-size:12px;text-decoration:none;">${icon} ${lnk.nombre} <span onclick="event.preventDefault();event.stopPropagation();removeLogbookLink('${projIdStr}','${entry.id}',${li})" style="font-size:9px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span></a>`;
      });
      e += `</div>`;
    }
    // Prompt used in this session
    if (entry.prompt) {
      e += `<div style="margin-top:6px;padding:6px 10px;background:rgba(155,125,207,0.06);border:1px solid rgba(155,125,207,0.12);border-radius:6px;">`;
      e += `<div style="font-size:11px;color:var(--purple);font-weight:600;margin-bottom:3px;">🤖 Prompt usado</div>`;
      e += `<div style="font-size:12px;color:var(--tx2);cursor:pointer;line-height:1.5;" onclick="navigator.clipboard.writeText(this.dataset.prompt);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${(entry.prompt || '').replace(/"/g, '&quot;')}" title="Click para copiar">${entry.prompt.length > 150 ? entry.prompt.substring(0, 150) + '...' : entry.prompt}</div>`;
      if (entry.promptResult) e += `<div style="font-size:12px;color:var(--tx3);margin-top:3px;">→ ${entry.promptResult}</div>`;
      e += `</div>`;
    }
    // Insight
    if (entry.insight) {
      e += `<div style="display:flex;align-items:flex-start;gap:6px;margin-top:6px;padding:6px 10px;background:rgba(232,168,56,0.05);border:1px solid rgba(232,168,56,0.12);border-radius:6px;">`;
      e += `<span style="font-size:14px;">💡</span>`;
      e += `<span style="font-size:13px;color:var(--gold);flex:1;">${escH(entry.insight)}</span>`;
      e += `<a href="#" onclick="event.preventDefault();promoteInsightToDecision('${projIdStr}','${entry.id}')" style="font-size:11px;color:var(--tx3);text-decoration:none;white-space:nowrap;" title="Promover a decisión clave">→ ⚡</a>`;
      e += `</div>`;
    }
    e += `<div style="margin-top:4px;"><a href="#" onclick="event.preventDefault();addLogbookLink('${projIdStr}','${entry.id}')" style="font-size:11px;color:var(--tx3);text-decoration:none;">+ adjuntar enlace</a></div>`;
    e += `</div>`;
    return e;
  }

  if (bitacora.length === 0) {
    h += `<div class="logbook-empty">Sin registros aún. Al terminar tu sesión de trabajo, registra qué hiciste en 30 segundos.</div>`;
  } else {
    const showEntries = bitacoraCollapsed ? bitacora.slice(0, 3) : bitacora;
    showEntries.forEach(entry => { h += renderLogEntry(entry, proj.id); });

    if (bitacoraCollapsed) {
      h += `<div style="text-align:center;padding:8px;"><a href="#" onclick="event.preventDefault();document.getElementById('logbook-all-${proj.id}').style.display='block';this.parentElement.style.display='none';" style="color:var(--blue);font-size:13px;">Ver todas las entradas (${bitacora.length})</a></div>`;
      h += `<div id="logbook-all-${proj.id}" style="display:none;">`;
      bitacora.slice(3).forEach(entry => { h += renderLogEntry(entry, proj.id); });
      h += `</div>`;
    }
  }

  // === DECISIONS (Decisiones clave) ===
  const decisiones = proj.decisiones || [];
  h += `<div class="proj-section-title"><span>⚡ Decisiones clave (${decisiones.length})</span>${isOwner ? `<button onclick="addDecision('${proj.id}')">+ Decisión</button>` : ''}</div>`;
  if (decisiones.length > 0) {
    decisiones.forEach(dec => {
      h += `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 12px;margin:4px 0;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.1);border-left:3px solid var(--gold);border-radius:0 7px 7px 0;">`;
      h += `<span style="font-size:14px;flex-shrink:0;">⚡</span>`;
      h += `<div style="flex:1;"><div style="font-size:14px;color:var(--tx);line-height:1.5;">${escH(dec.texto)}</div>`;
      h += `<div style="font-size:11px;color:var(--tx3);margin-top:2px;">${dec.fecha}${dec.fromBitacora ? ' · desde bitácora' : ''}</div></div>`;
      h += `<span onclick="removeDecision('${proj.id}','${dec.id}')" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.3;flex-shrink:0;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3">✕</span>`;
      h += `</div>`;
    });
  }

  // === RESOURCES (Recursos del proyecto) ===
  const recursos = proj.recursos || [];
  h += `<div class="proj-section-title"><span>📚 Recursos del proyecto (${recursos.length})</span>${isOwner ? `<button onclick="addProjectResource('${proj.id}')">+ Recurso</button>` : ''}</div>`;
  if (recursos.length > 0) {
    const resIcons = { carpeta: '📁', documento: '📄', web: '🔗', nota: '📓' };
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
    recursos.forEach((r, ri) => {
      const icon = resIcons[r.tipo] || '📎';
      h += `<a href="${r.url}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:5px;padding:8px 14px;background:var(--bg2);border:1px solid rgba(220,215,205,0.08);border-radius:8px;color:var(--blue);font-size:13px;text-decoration:none;transition:all 0.12s;" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='rgba(220,215,205,0.08)'">${icon} ${r.nombre} <span onclick="event.preventDefault();event.stopPropagation();removeProjectResource('${proj.id}',${ri})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;margin-left:2px;" onmouseover="this.style.opacity=1;this.style.color='var(--red)'" onmouseout="this.style.opacity=0.4;this.style.color='var(--tx3)'">✕</span></a>`;
    });
    h += `</div>`;
  }

  // === PROMPT LOG ===
  const promptLog = proj.promptLog || [];
  h += `<div class="proj-section-title"><span>🤖 Prompt log (${promptLog.length})</span><button onclick="showPromptLogModal('${proj.id}')">+ Prompt</button></div>`;
  if (promptLog.length === 0) {
    h += `<div style="padding:12px 16px;color:var(--tx3);font-size:13px;font-style:italic;background:var(--bg2);border-radius:8px;border:1px dashed rgba(220,215,205,0.1);">Registra los prompts que usas con la IA para mantener trazabilidad de tu proceso.</div>`;
  } else {
    const plDocs = getDocs();
    const showPL = promptLog.length > 3 ? promptLog.slice(0, 3) : promptLog;
    showPL.forEach(pl => {
      const linkedDoc = pl.docId ? plDocs.find(d => d.id === pl.docId) : null;
      h += `<div style="background:var(--bg2);border:1px solid rgba(155,125,207,0.1);border-left:3px solid var(--purple);border-radius:0 8px 8px 0;padding:10px 14px;margin:6px 0;">`;
      h += `<span class="logbook-remove" onclick="event.stopPropagation();removePromptLog('${proj.id}','${pl.id}')">✕</span>`;
      h += `<span class="logbook-date">${pl.fecha}</span>`;
      if (linkedDoc) h += `<span style="font-size:12px;color:var(--purple);margin-left:8px;">📄 ${linkedDoc.title}</span>`;
      h += `<div style="font-size:13px;color:var(--tx2);line-height:1.6;margin-top:6px;padding:6px 10px;background:var(--bg3);border-radius:6px;cursor:pointer;border:1px solid transparent;" onclick="navigator.clipboard.writeText(this.dataset.prompt);this.style.borderColor='var(--green)';setTimeout(()=>this.style.borderColor='transparent',1500);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${pl.prompt.replace(/"/g, '&quot;')}" title="Click para copiar">📋 ${pl.prompt.length > 200 ? pl.prompt.substring(0, 200) + '...' : pl.prompt}</div>`;
      if (pl.resultado) h += `<div style="font-size:13px;color:var(--tx3);margin-top:4px;">→ ${pl.resultado}</div>`;
      h += `</div>`;
    });
    if (promptLog.length > 3) {
      h += `<div style="text-align:center;padding:8px;"><a href="#" onclick="event.preventDefault();document.getElementById('pl-all-${proj.id}').style.display='block';this.parentElement.style.display='none';" style="color:var(--purple);font-size:13px;">Ver todos los prompts (${promptLog.length})</a></div>`;
      h += `<div id="pl-all-${proj.id}" style="display:none;">`;
      promptLog.slice(3).forEach(pl => {
        const linkedDoc = pl.docId ? plDocs.find(d => d.id === pl.docId) : null;
        h += `<div style="background:var(--bg2);border:1px solid rgba(155,125,207,0.1);border-left:3px solid var(--purple);border-radius:0 8px 8px 0;padding:10px 14px;margin:6px 0;">`;
        h += `<span class="logbook-remove" onclick="event.stopPropagation();removePromptLog('${proj.id}','${pl.id}')">✕</span>`;
        h += `<span class="logbook-date">${pl.fecha}</span>`;
        if (linkedDoc) h += `<span style="font-size:12px;color:var(--purple);margin-left:8px;">📄 ${linkedDoc.title}</span>`;
        h += `<div style="font-size:13px;color:var(--tx2);line-height:1.6;margin-top:6px;padding:6px 10px;background:var(--bg3);border-radius:6px;cursor:pointer;" onclick="navigator.clipboard.writeText(this.dataset.prompt);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${pl.prompt.replace(/"/g, '&quot;')}" title="Click para copiar">📋 ${pl.prompt.length > 200 ? pl.prompt.substring(0, 200) + '...' : pl.prompt}</div>`;
        if (pl.resultado) h += `<div style="font-size:13px;color:var(--tx3);margin-top:4px;">→ ${pl.resultado}</div>`;
        h += `</div>`;
      });
      h += `</div>`;
    }
  }

  // === TIMELINE VISUAL ===
  if (bitacora.length > 0) {
    const faseNames = { ideacion: 'Ideación', fundamentacion: 'Fundamentación', diseno: 'Diseño', escritura: 'Escritura', revision: 'Revisión', submission: 'Submission', peer_review: 'Peer Review', respuesta: 'Respuesta', publicacion: 'Publicación' };
    // Group entries by phase
    const phaseGroups = {};
    bitacora.forEach(e => {
      const f = e.fase || 'sin_fase';
      if (!phaseGroups[f]) phaseGroups[f] = { entries: [], firstDate: e.fecha, lastDate: e.fecha };
      phaseGroups[f].entries.push(e);
      if (e.fecha < phaseGroups[f].firstDate) phaseGroups[f].firstDate = e.fecha;
      if (e.fecha > phaseGroups[f].lastDate) phaseGroups[f].lastDate = e.fecha;
    });

    h += `<div class="proj-section-title"><span>📊 Timeline</span></div>`;
    h += `<div style="display:flex;gap:4px;align-items:flex-end;margin-bottom:16px;overflow-x:auto;padding:8px 0;">`;

    const allFaseIds = (proj.fases || []).map(f => f.id);
    const orderedFases = allFaseIds.filter(id => phaseGroups[id]);
    if (phaseGroups['sin_fase']) orderedFases.unshift('sin_fase');

    orderedFases.forEach(fid => {
      const grp = phaseGroups[fid];
      const name = faseNames[fid] || 'Inicio';
      const n = grp.entries.length;
      const faseObj = (proj.fases || []).find(f => f.id === fid);
      const estado = faseObj ? faseObj.estado : 'pendiente';
      const bgColor = estado === 'completado' ? 'rgba(93,187,138,0.12)' : estado === 'en_progreso' ? 'rgba(144,200,240,0.12)' : 'rgba(220,215,205,0.06)';
      const borderColor = estado === 'completado' ? 'rgba(93,187,138,0.3)' : estado === 'en_progreso' ? 'rgba(144,200,240,0.3)' : 'rgba(220,215,205,0.1)';
      const textColor = estado === 'completado' ? 'var(--green)' : estado === 'en_progreso' ? 'var(--blue)' : 'var(--tx3)';
      const barH = Math.max(30, Math.min(80, n * 15));

      // Check gates
      const gateRecord = (proj.gateRecords || []).find(g => {
        const gDef = PHASE_GATES[g.gate];
        return gDef && gDef.trigger.includes(fid);
      });

      h += `<div style="display:flex;flex-direction:column;align-items:center;min-width:70px;flex:1;">`;
      // Bar
      h += `<div style="width:100%;height:${barH}px;background:${bgColor};border:1px solid ${borderColor};border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;">`;
      h += `<span style="font-size:13px;font-weight:600;color:${textColor};">${n}</span>`;
      h += `</div>`;
      // Label
      h += `<div style="width:100%;text-align:center;padding:4px 2px;background:var(--bg2);border:1px solid ${borderColor};border-top:none;border-radius:0 0 6px 6px;">`;
      h += `<div style="font-size:11px;font-weight:600;color:${textColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>`;
      h += `<div style="font-size:10px;color:var(--tx3);">${grp.firstDate.substring(5)}</div>`;
      if (gateRecord) {
        h += `<div style="font-size:10px;margin-top:2px;">${gateRecord.skipped ? '⚠' : '✅'}</div>`;
      }
      h += `</div>`;
      h += `</div>`;
    });
    h += `</div>`;
  }

  // === TEAM DASHBOARD (async, renders into placeholder) ===
  h += `<div id="proj-team-dashboard"></div>`;
  h += `<div id="proj-activity-feed"></div>`;
  loadTeamDashboard(projId);
  loadActivityFeed(projId);

  // === WORKFLOW: Mode selector + standard phases ===
  if (!proj.fases) { proj.fases = JSON.parse(JSON.stringify(DEFAULT_FASES)); saveProjects(projects); }
  const wfm = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  h += `<div style="margin:16px 0 8px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">`;
  h += `<div style="font-size:15px;font-weight:700;color:var(--tx);">🔄 Workflow del proyecto</div>`;
  h += `<div style="display:flex;gap:4px;">`;
  h += `<button class="btn bo" onclick="setWorkflowMode('${proj.id}','dr')" style="font-size:11px;padding:3px 8px;border-color:${wfm==='dr'?'var(--purple)':'rgba(155,125,207,0.3)'};color:${wfm==='dr'?'var(--purple)':'rgba(155,125,207,0.5)'};${wfm==='dr'?'background:rgba(155,125,207,0.08);':''}" title="Tesis, ensayos teóricos, español">🧬 /dr</button>`;
  h += `<button class="btn bo" onclick="setWorkflowMode('${proj.id}','clo')" style="font-size:11px;padding:3px 8px;border-color:${wfm==='clo'?'#2dd4bf':'rgba(45,212,191,0.3)'};color:${wfm==='clo'?'#2dd4bf':'rgba(45,212,191,0.5)'};${wfm==='clo'?'background:rgba(45,212,191,0.08);':''}" title="Paper empírico, R, LaTeX, inglés">🔬 clo-author</button>`;
  h += `<button class="btn bo" onclick="setWorkflowMode('${proj.id}','mixed')" style="font-size:11px;padding:3px 8px;border-color:${wfm==='mixed'?'var(--gold)':'rgba(232,168,56,0.3)'};color:${wfm==='mixed'?'var(--gold)':'rgba(232,168,56,0.5)'};${wfm==='mixed'?'background:rgba(232,168,56,0.08);':''}" title="Marco teórico + validación empírica">🔗 Mixto</button>`;
  h += `</div></div>`;

  // Standard phases — hidden when any specialized mode is active
  if (wfm === 'default') {
  h += `<div class="proj-phases">`;
  proj.fases.forEach((f, fi) => {
    const icon = f.estado === 'completado' ? '✅' : f.estado === 'en_progreso' ? '🔵' : f.estado === 'no_aplica' ? '⚪' : '○';
    const cls = 'proj-phase proj-phase-' + f.estado;
    h += `<div class="${cls}" onclick="cyclePhaseStatus('${proj.id}',${fi})" title="Click para cambiar estado">`;
    h += `<div class="proj-phase-icon">${icon}</div>`;
    h += `<div class="proj-phase-name">${f.nombre}</div>`;
    h += `</div>`;
    if (fi < proj.fases.length - 1) h += `<div class="proj-phase-arrow">→</div>`;
  });
  h += `</div>`;

  // Phase details (show for active phase)
  const activePhase = proj.fases.find(f => f.estado === 'en_progreso');
  if (activePhase) {
    h += `<div class="proj-phase-detail">`;
    if (activePhase.id === 'submission') {
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">Journal: <span style="color:var(--tx);">${activePhase.journal || '(sin definir)'}</span> <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','journal','Journal target:');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">Fecha envío: <span style="color:var(--tx);">${activePhase.fechaEnvio || '(pendiente)'}</span> <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','fechaEnvio','Fecha de envío (YYYY-MM-DD):');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
    }
    if (activePhase.id === 'peer_review') {
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">Decisión: <span style="color:var(--tx);">${activePhase.decision || '(esperando)'}</span> <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','decision','Decisión (accept/minor/major/reject):');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">Ronda: ${activePhase.ronda || 1} <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','ronda','Número de ronda:');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
    }
    if (activePhase.id === 'publicacion') {
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">DOI: <span style="color:var(--tx);">${activePhase.doi || '(pendiente)'}</span> <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','doi','DOI:');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
      h += `<div style="font-size:13px;color:var(--tx2);margin:4px 0;">Fecha: <span style="color:var(--tx);">${activePhase.fechaPublicacion || '(pendiente)'}</span> <a href="#" onclick="editPhaseField('${proj.id}','${activePhase.id}','fechaPublicacion','Fecha publicación (YYYY-MM-DD):');return false;" style="color:var(--blue);font-size:11px;">editar</a></div>`;
    }
    h += `</div>`;
  }

  // === WIZARD GUIDE — contextual per active phase (ALWAYS VISIBLE) ===
  if (activePhase) {
    const phaseId = activePhase.id;
    const DEFAULT_WIZARD_TASKS = _getDefaultWizardTasks();
    const defaultTasks = DEFAULT_WIZARD_TASKS[phaseId] || [];
    const customTasks = (proj.wizardCustomTasks && proj.wizardCustomTasks[phaseId]) || [];

    // Gather live data for the guide
    const artCount = projArts.length;
    const docsCount = projDocs.length;
    const totalClaimsCount = projArts.reduce((sum, a) => { const c = calcArticleClaims(a.key); return sum + c.support + c.contrast + c.neutral; }, 0);
    const avgProgress = artCount > 0 ? Math.round(projArts.reduce((sum, a) => sum + calcArticleProgress(a.key), 0) / artCount) : 0;
    const checkDoneCount = (proj.checklist || []).filter(c => c.estado === 'completado' || c.done === true).length;
    const checkTotalCount = (proj.checklist || []).length;
    const qLogCount = (proj.preguntaLog || []).length;

    // Phase objectives
    const objectives = {
      ideacion: 'Definir una pregunta de investigación clara y verificar que el gap existe.',
      fundamentacion: 'Construir tu marco teórico con evidencia posicional (claims S/C/N).',
      diseno: 'Definir metodología, instrumentos y plan de análisis.',
      escritura: 'Escribir el manuscrito sección por sección usando tus claims como materia prima.',
      revision: 'Pulir el manuscrito antes de enviarlo. Checklist + revisión externa.',
      submission: 'Seleccionar journal, preparar cover letter y enviar.',
      peer_review: 'Esperar decisión editorial. Registrar resultado cuando llegue.',
      respuesta: 'Responder a cada comentario de los reviewers punto por punto.',
      publicacion: 'Verificar proofs, registrar DOI y difundir tu trabajo.'
    };

    // Auto-check conditions per phase (using existing live data)
    const autoChecks = {
      ideacion: [qLogCount > 0, false, false, false, artCount > 0],
      fundamentacion: [false, false, false, artCount > 0, avgProgress > 50, docsCount > 0],
      diseno: [false, false, false, false, false],
      escritura: [docsCount > 0, false, false, false, false, false],
      revision: [false, false, false, false, checkDoneCount === checkTotalCount && checkTotalCount > 0],
      submission: [!!activePhase.journal, false, false, false, !!activePhase.fechaEnvio],
      peer_review: [false, !!activePhase.decision, false],
      respuesta: [false, false, false, false, false],
      publicacion: [false, !!activePhase.doi, false, false, false]
    };
    const autoLive = {
      ideacion: ['(' + qLogCount + ' registros)', '', '', '', '(' + artCount + ' vinculados)'],
      fundamentacion: ['', '', '', '(' + artCount + ' procesados)', '(' + avgProgress + '%, ' + totalClaimsCount + ' claims)', '(' + docsCount + ' docs, ' + totalWords.toLocaleString() + ' pal)'],
      escritura: ['(' + docsCount + ' docs)', '', '', '', '', ''],
      revision: ['', '', '', '', '(' + checkDoneCount + '/' + checkTotalCount + ')'],
      submission: [activePhase.journal ? '→ ' + activePhase.journal : '', '', '', '', activePhase.fechaEnvio || '']
    };

    h += `<div style="background:linear-gradient(135deg,rgba(232,168,56,0.04),rgba(93,155,213,0.04));border:1px solid rgba(232,168,56,0.15);border-radius:10px;padding:16px 20px;margin-bottom:14px;">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">`;
    h += `<div style="font-size:15px;font-weight:700;color:var(--gold);">📘 Guía: ${activePhase.nombre}</div>`;
    h += `<div style="display:flex;gap:8px;align-items:center;">`;
    h += `<button class="btn bo" onclick="addWizardTask('${proj.id}','${phaseId}')" style="font-size:12px;padding:3px 10px;">+ Tarea</button>`;
    h += `<span style="font-size:13px;color:var(--tx3);cursor:pointer;" onclick="this.closest('div[style*=linear-gradient]').style.display='none'">ocultar ✕</span>`;
    h += `</div></div>`;

    h += `<div style="font-size:14px;color:var(--tx2);margin-bottom:12px;">${objectives[phaseId] || ''}</div>`;

    // Default tasks
    const checks = autoChecks[phaseId] || [];
    const lives = autoLive[phaseId] || [];
    defaultTasks.forEach((task, ti) => {
      h += renderWizardTask(proj.id, phaseId, ti, task, checks[ti] || false, lives[ti] || '');
    });

    // Custom tasks
    customTasks.forEach((ct, ci) => {
      const icons = { pendiente: '☐', en_progreso: '🔵', completado: '☑', no_aplica: '⚪' };
      const colors = { pendiente: 'var(--tx)', en_progreso: 'var(--blue)', completado: 'var(--green)', no_aplica: 'var(--tx3)' };
      const est = ct.estado || 'pendiente';
      const textDeco = est === 'completado' ? 'text-decoration:line-through;opacity:0.7;' : est === 'no_aplica' ? 'text-decoration:line-through;opacity:0.4;' : '';
      h += `<div style="border:1px dashed rgba(232,168,56,0.2);border-radius:8px;margin:4px 0;background:var(--bg2);display:flex;align-items:center;gap:8px;padding:8px 12px;">`;
      h += `<span style="font-size:22px;flex-shrink:0;cursor:pointer;color:${colors[est]};" onclick="toggleCustomWizardTask('${proj.id}','${phaseId}',${ci})">${icons[est]}</span>`;
      h += `<span style="flex:1;font-size:14px;color:${colors[est]};${textDeco}">${ct.texto}</span>`;
      h += `<span style="font-size:11px;color:var(--tx3);cursor:pointer;opacity:0.4;" onclick="removeCustomWizardTask('${proj.id}','${phaseId}',${ci})" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span>`;
      h += `</div>`;
    });

    h += `</div>`;
  }
  } // end if (wfm === 'default') — standard workflow hidden when /dr, clo, or mixed active
  h += `</div>`; // close workflow section

  // === BRANCHES — Ramas argumentativas ===
  {
    const wfModeB = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
    if ((wfModeB === 'dr' || wfModeB === 'mixed') && proj.drBranches && proj.drBranches.length > 1) {
      const activeBranch = proj.drActiveBranch || 'main';
      h += `<details class="pd-section" open><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">🌿 Ramas del proyecto</span><span class="pd-count">${proj.drBranches.length}</span></div></summary><div class="pd-body">`;

      // Render branch tree
      const branches = proj.drBranches;
      const rootBranches = branches.filter(b => !b.forkedFrom);
      const childOf = (parentId) => branches.filter(b => b.forkedFrom === parentId);

      function renderBranchTree(branch, depth) {
        const isActive = branch.id === activeBranch;
        const indent = depth * 20;
        const statusColors = { active: 'var(--green)', paused: 'var(--gold)', discarded: 'var(--red)', completed: 'var(--blue)', archived: 'var(--tx3)' };
        const statusLabels = { active: 'en curso', paused: 'en espera', discarded: 'descartada', completed: 'completada', archived: 'archivada' };
        const statusIcons = { active: '🔵', paused: '⏸', discarded: '✗', completed: '✅', archived: '📦' };
        const branchData = proj.drBranchData?.[branch.id];
        const branchFases = branchData?.drFases || (isActive ? proj.drFases : []);
        const activePhase = branchFases.find(f => f.estado === 'en_progreso');
        const completedCount = branchFases.filter(f => f.estado === 'completado').length;

        let bh = '';
        bh += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin:2px 0;margin-left:${indent}px;background:${isActive ? 'rgba(93,187,138,0.06)' : 'var(--bg2)'};border:1px solid ${isActive ? 'var(--green)' : 'rgba(220,215,205,0.06)'};border-radius:6px;border-left:3px solid ${statusColors[branch.status] || 'var(--tx3)'};">`;
        bh += `<span style="font-size:14px;">${depth === 0 ? '●' : '├─●'}</span>`;
        bh += `<div style="flex:1;">`;
        bh += `<div style="font-size:13px;font-weight:${isActive ? '700' : '400'};color:${isActive ? 'var(--green)' : 'var(--tx)'};">${branch.name}</div>`;
        bh += `<div style="font-size:11px;color:var(--tx3);">`;
        if (branch.forkedFrom) {
          const parent = branches.find(b => b.id === branch.forkedFrom);
          bh += `Bifurcó de ${parent?.name || branch.forkedFrom} en ${branch.forkedAtPhase} · ${branch.forkedDate} · `;
        }
        bh += `${completedCount}/${branchFases.length} fases`;
        if (activePhase) bh += ` · Fase: ${activePhase.nombre}`;
        bh += `</div>`;
        bh += `</div>`;
        // Status badge
        bh += `<span style="font-size:10px;padding:2px 6px;background:rgba(220,215,205,0.06);border-radius:4px;color:${statusColors[branch.status] || 'var(--tx3)'};">${statusIcons[branch.status] || ''} ${statusLabels[branch.status] || branch.status}</span>`;

        // Actions — always available
        if (!isActive && branch.status !== 'discarded') {
          bh += `<button class="btn bo" onclick="switchBranch('${proj.id}','${branch.id}')" style="font-size:11px;padding:2px 8px;">Activar</button>`;
        }
        bh += `<span style="font-size:11px;color:var(--tx3);cursor:pointer;" onclick="addBranchNote('${proj.id}','${branch.id}')" title="Agregar nota">📌</span>`;
        if (branch.status !== 'discarded') {
          bh += `<span style="font-size:11px;color:var(--blue);cursor:pointer;" onclick="freezeBranch('${proj.id}','${branch.id}')" title="Congelar versión">🧊</span>`;
        }

        // Status transitions menu — always visible
        const st = branch.status || 'active';
        const hasChildBranches = branches.some(b => b.forkedFrom === branch.id);
        {
          bh += `<select onchange="if(this.value==='delete'){deleteBranch('${proj.id}','${branch.id}')}else if(this.value){setBranchStatus('${proj.id}','${branch.id}',this.value)};this.value=''" style="font-size:11px;padding:3px 6px;background:var(--bg);border:1px solid rgba(220,215,205,0.15);border-radius:4px;color:var(--tx2);cursor:pointer;">`;
          bh += `<option value="">Estado ▾</option>`;
          // Show allowed transitions
          if (st === 'active') {
            bh += `<option value="paused">⏸ En espera</option>`;
            if (branch.id !== 'main') bh += `<option value="discarded">✗ Descartar</option>`;
            bh += `<option value="completed">✅ Completar</option>`;
          } else if (st === 'paused') {
            bh += `<option value="active">🔵 Retomar</option>`;
            if (branch.id !== 'main') bh += `<option value="discarded">✗ Descartar</option>`;
          } else if (st === 'discarded') {
            bh += `<option value="paused">⏸ Reactivar</option>`;
          } else if (st === 'completed') {
            bh += `<option value="active">🔵 Reabrir</option>`;
          } else if (st === 'archived') {
            bh += `<option value="active">🔵 Reactivar</option>`;
            bh += `<option value="paused">⏸ En espera</option>`;
          }
          if (!hasChildBranches && branch.id !== 'main') bh += `<option value="delete">🗑 Eliminar</option>`;
          bh += `</select>`;
        }
        bh += `</div>`;

        // Frozen versions
        if (branch.frozen && branch.frozen.length > 0) {
          bh += `<div style="margin-left:${indent + 20}px;margin:2px 0 2px ${indent + 20}px;">`;
          branch.frozen.forEach(f => {
            bh += `<div style="font-size:11px;color:var(--blue);padding:1px 8px;">🧊 ${f.label} — ${f.date}</div>`;
          });
          bh += `</div>`;
        }

        // Notes
        if (branch.notes && branch.notes.length > 0) {
          bh += `<div style="margin-left:${indent + 20}px;margin:2px 0 4px ${indent + 20}px;">`;
          branch.notes.slice(-3).forEach(n => {
            bh += `<div style="font-size:11px;color:var(--tx3);padding:1px 8px;font-style:italic;">📌 ${n.date} — ${n.text.length > 80 ? n.text.substring(0, 80) + '...' : n.text}</div>`;
          });
          if (branch.notes.length > 3) {
            bh += `<div style="font-size:10px;color:var(--tx3);padding:1px 8px;">... y ${branch.notes.length - 3} notas más</div>`;
          }
          bh += `</div>`;
        }

        h += bh;

        // Render children
        childOf(branch.id).forEach(child => renderBranchTree(child, depth + 1));
      }

      rootBranches.forEach(b => renderBranchTree(b, 0));

      // Fork button
      h += `<div style="margin-top:8px;">`;
      h += `<button class="btn bo" onclick="forkBranch('${proj.id}')" style="font-size:12px;padding:3px 10px;border-color:var(--green);color:var(--green);">🌿 Nueva rama desde fase actual</button>`;
      h += `</div>`;

      h += `</div></details>`;
    }
  }

  // === DR WIZARD — Flujo guiado de producción doctoral con /dr skills ===
  {
    const wfMode = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
    const isDrMode = wfMode === 'dr' || wfMode === 'mixed';
    const isCloMode = wfMode === 'clo' || wfMode === 'mixed';

    if (isDrMode) {
      if (!proj.drFases) { proj.drFases = JSON.parse(JSON.stringify(_getDrFases())); saveProjects(projects); }
      // Migrate old projects (8 phases → 10 phases)
      if (migrateDrFases(proj)) { saveProjects(projects); }

      // DR Phase bar
      h += `<div style="margin:8px 0 12px;">`;
      h += `<div style="font-size:11px;color:var(--tx3);margin-bottom:6px;">Click en cada fase para cambiar estado · Botón "Siguiente" verifica el gate</div>`;
      h += `<div class="proj-phases" style="flex-wrap:wrap;">`;
      proj.drFases.forEach((f, fi) => {
        const stIcon = f.estado === 'completado' ? '✅' : f.estado === 'en_progreso' ? '🔵' : f.estado === 'no_aplica' ? '⚪' : (f.icon || '○');
        const cls = 'proj-phase proj-phase-' + f.estado;
        h += `<div class="${cls}" onclick="cycleDrPhaseStatus('${proj.id}',${fi})" title="${f.nombre}">`;
        h += `<div class="proj-phase-icon">${stIcon}</div>`;
        h += `<div class="proj-phase-name">${f.nombre}</div>`;
        h += `</div>`;
        if (fi < proj.drFases.length - 1) h += `<div class="proj-phase-arrow">→</div>`;
      });
      h += `</div>`;

      // Advance button + report button
      const drActive = proj.drFases.find(f => f.estado === 'en_progreso');
      const hasAnyOutput = Object.keys(proj.drOutputs || {}).length > 0;
      h += `<div style="margin:8px 0;display:flex;justify-content:space-between;align-items:center;">`;
      if (hasAnyOutput) {
        h += `<button class="btn bo" onclick="generateDrReport('${proj.id}')" style="font-size:12px;padding:4px 12px;border-color:var(--green);color:var(--green);">📊 Reporte de trazabilidad</button>`;
      } else {
        h += `<span></span>`;
      }
      if (drActive) h += `<button class="btn bo" onclick="forkBranch('${proj.id}')" style="font-size:12px;padding:4px 10px;border-color:var(--green);color:var(--green);">🌿 Bifurcar</button>`;
      h += `<button class="btn bg" onclick="advanceDrPhase('${proj.id}')" style="font-size:13px;padding:5px 16px;background:var(--purple);color:#fff;">${drActive ? '🚧 Completar fase y verificar gate' : '▶ Iniciar primera fase'}</button>`;
      h += `</div>`;
      h += `</div>`;

      // DR Wizard Guide — tasks for active DR phase
      if (drActive) {
        const drPhaseId = drActive.id;
        const drTasks = (_getDrWizardTasks())[drPhaseId] || [];
        const drCustom = (proj.drWizardCustomTasks && proj.drWizardCustomTasks[drPhaseId]) || [];

        const drObjectives = {
          dr_exploracion: 'Formular pregunta, verificar gap, definir estrategia de búsqueda, y posicionar tu argumento inicial.',
          dr_lectura: 'Leer con lente de tesis propia. Extraer conexiones, citas textuales, tensiones, y mapa de uso.',
          dr_escritura: 'Escribir con esqueleto aprobado, estilo calibrado, y autoevaluación. El humanizer es red de seguridad, no muleta.',
          dr_critica: 'Evaluar en 6 componentes con deducciones trazables. Score compuesto ≥80 para capítulo, ≥90 para entrega.',
          dr_humanize: 'Eliminar patrones de escritura IA. Score anti-IA ≥85 para entrega.',
          dr_verify: 'Verificar TODAS las citas contra PDFs originales. Zero fabricadas para entrega.',
          dr_depth: 'Profundizar con mentor socrático y stress-test con abogado del diablo.',
          dr_impact: 'Evaluar impacto: identificar vacíos en la literatura, puntuar contribución en 6 dimensiones (O, N, U, C, G, R), escribir posicionamiento explícito.',
          dr_benchmark: 'Comparar tu artículo contra 3-4 publicaciones ancla en 12 dimensiones. Identificar brechas cerrables vs no cerrables. Definir techo realista.',
          dr_entrega: 'Verificación final: score ≥90, ≥80 por componente, anti-IA ≥85, zero fabricadas.'
        };

        // Alerts placeholder — loaded async from Supabase
        h += `<div id="dr-alerts-container"></div>`;

        h += `<div id="dr-wizard-guide" style="background:linear-gradient(135deg,rgba(155,125,207,0.06),rgba(93,187,138,0.04));border:1px solid rgba(155,125,207,0.2);border-radius:10px;padding:16px 20px;margin-bottom:14px;">`;
        h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">`;
        h += `<div style="font-size:15px;font-weight:700;color:var(--purple);">🧬 /dr: ${drActive.nombre}</div>`;
        h += `<span style="font-size:13px;color:var(--tx3);cursor:pointer;" onclick="this.closest('div[style*=linear-gradient]').style.display='none'">ocultar ✕</span>`;
        h += `</div>`;
        h += `<div style="font-size:14px;color:var(--tx2);margin-bottom:12px;">${drObjectives[drPhaseId] || ''}</div>`;

        // Gather outputs from ALL completed phases for cross-phase chaining
        const allDrOutputs = proj.drOutputs || {};
        const completedPhaseOutputs = [];
        (proj.drFases || []).forEach(f => {
          if (f.estado === 'completado' && allDrOutputs[f.id]) {
            const phaseOuts = allDrOutputs[f.id];
            const entries = Object.values(phaseOuts).filter(v => v && v.length > 0);
            if (entries.length > 0) completedPhaseOutputs.push({ phase: f.nombre, outputs: entries });
          }
        });
        const crossPhaseContext = completedPhaseOutputs.map(p => '=== ' + p.phase + ' ===\n' + p.outputs.join('\n---\n')).join('\n\n');

        // Render DR tasks with output chaining
        const drOutputs = allDrOutputs[drPhaseId] || {};
        drTasks.forEach((task, ti) => {
          const wp = proj.drWizardProgress?.[drPhaseId]?.[ti];
          const estado = wp || 'pendiente';
          const icons = { pendiente: '☐', en_progreso: '🔵', completado: '☑', no_aplica: '⚪' };
          const colors = { pendiente: 'var(--tx)', en_progreso: 'var(--blue)', completado: 'var(--green)', no_aplica: 'var(--tx3)' };
          const textDeco = estado === 'completado' ? 'text-decoration:line-through;opacity:0.7;' : estado === 'no_aplica' ? 'text-decoration:line-through;opacity:0.4;' : '';
          const detailId = 'dr-wz-' + drPhaseId + '-' + ti;
          const savedOutput = drOutputs[ti] || '';
          const hasOutput = savedOutput.length > 0;

          // Gather previous outputs for prompt enrichment (same phase + completed phases)
          const prevOutputs = [];
          for (let pi = 0; pi < ti; pi++) {
            if (drOutputs[pi]) prevOutputs.push(drOutputs[pi]);
          }
          const withinPhaseContext = prevOutputs.length > 0 ? prevOutputs.join('\n---\n') : '';
          const prevContext = [crossPhaseContext, withinPhaseContext].filter(c => c.length > 0).join('\n\n');

          h += `<div style="border:1px solid rgba(155,125,207,${hasOutput ? '0.25' : '0.12'});border-radius:8px;margin:4px 0;background:var(--bg2);overflow:hidden;">`;
          // Header
          h += `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;">`;
          h += `<span style="font-size:22px;flex-shrink:0;cursor:pointer;color:${colors[estado]};" onclick="event.stopPropagation();toggleDrWizardStep('${proj.id}','${drPhaseId}',${ti})">${icons[estado]}</span>`;
          h += `<span style="flex:1;font-size:14px;color:${colors[estado]};${textDeco}" onclick="document.getElementById('${detailId}').classList.toggle('show')">${task.texto}</span>`;
          if (hasOutput) h += `<span style="font-size:11px;color:var(--green);padding:2px 6px;background:rgba(93,187,138,0.1);border-radius:4px;">📤 guardado</span>`;
          // Skill download button
          if (task.skill) {
            h += `<button class="btn bo" onclick="event.stopPropagation();downloadDrSkill('${task.skill}')" style="font-size:11px;padding:2px 8px;border-color:var(--purple);color:var(--purple);white-space:nowrap;" title="Descargar guía de esta skill">📥 Skill</button>`;
          }
          h += `<span style="font-size:12px;color:var(--tx3);cursor:pointer;padding:4px;" onclick="document.getElementById('${detailId}').classList.toggle('show')" title="Ver detalle">▸</span>`;
          h += `</div>`;
          // Detail
          h += `<div id="${detailId}" class="wz-detail">`;
          if (task.detalle) h += `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:8px;">${task.detalle}</div>`;
          if (task.herramientas) h += `<div style="font-size:13px;color:var(--tx3);margin-bottom:6px;">🔧 ${task.herramientas}</div>`;

          // Show what context is available
          const contextParts = [];
          if (completedPhaseOutputs.length > 0) contextParts.push(completedPhaseOutputs.length + ' fase' + (completedPhaseOutputs.length > 1 ? 's' : '') + ' anterior' + (completedPhaseOutputs.length > 1 ? 'es' : ''));
          if (prevOutputs.length > 0) contextParts.push(prevOutputs.length + ' tarea' + (prevOutputs.length > 1 ? 's' : '') + ' anterior' + (prevOutputs.length > 1 ? 'es' : ''));
          if (contextParts.length > 0) {
            h += `<div style="font-size:11px;color:var(--green);margin:6px 0 4px;">✓ Contexto de ${contextParts.join(' + ')} disponible — se incluirá en los prompts al copiar</div>`;
          }

          if (task.prompts && task.prompts.length > 0) {
            h += `<div style="font-size:12px;font-weight:600;color:var(--purple);margin:6px 0 4px;">🤖 Prompts (click para copiar${prevContext ? ' — incluye contexto anterior' : ''}):</div>`;
            task.prompts.forEach(p => {
              // Enrich prompt with previous context
              const enriched = prevContext ? p + '\n\n--- CONTEXTO DE PASOS ANTERIORES ---\n' + prevContext : p;
              const safeP = enriched.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
              const displayP = p.length > 120 ? p.substring(0, 120) + '...' : p;
              h += `<div style="font-size:13px;color:var(--tx2);padding:6px 10px;margin:3px 0;background:var(--bg3);border-radius:6px;cursor:pointer;border:1px solid transparent;transition:border-color 0.15s;" onclick="navigator.clipboard.writeText(this.dataset.prompt);this.style.borderColor='var(--green)';setTimeout(()=>this.style.borderColor='transparent',1500);window.showToast&&window.showToast('Prompt copiado'+(${prevOutputs.length}>0?' (con contexto)':''),'success')" data-prompt="${safeP}" onmouseover="this.style.borderColor='var(--purple)'" onmouseout="this.style.borderColor='transparent'">📋 ${displayP}</div>`;
            });
          }

          // Output field
          const outputId = 'dr-output-' + drPhaseId + '-' + ti;
          h += `<div style="margin-top:8px;border-top:1px solid rgba(155,125,207,0.1);padding-top:8px;">`;
          h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">`;
          h += `<span style="font-size:12px;font-weight:600;color:var(--purple);">📤 Resultado (pega aquí el output de Claude)</span>`;
          if (hasOutput) h += `<span style="font-size:11px;color:var(--tx3);cursor:pointer;" onclick="if(confirm('¿Borrar resultado?')){saveDrOutput('${proj.id}','${drPhaseId}',${ti},'')}">limpiar</span>`;
          h += `</div>`;
          h += `<textarea id="${outputId}" placeholder="Pega aquí el resultado de Claude Code. Es opcional — pero si lo pegas, el prompt de la siguiente tarea lo incluirá automáticamente." style="width:100%;min-height:${hasOutput ? '80' : '40'}px;max-height:200px;background:var(--bg);border:1px solid rgba(155,125,207,${hasOutput ? '0.3' : '0.1'});border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;padding:8px;resize:vertical;" onblur="saveDrOutput('${proj.id}','${drPhaseId}',${ti},this.value)">${savedOutput.replace(/</g,'&lt;')}</textarea>`;
          h += `</div>`;

          h += `</div></div>`;
        });

        h += `</div>`;
      }
    }

    // === CLO-AUTHOR WIZARD ===
    if (isCloMode) {
      if (!proj.cloFases || proj.cloFases.length === 0) { proj.cloFases = JSON.parse(JSON.stringify(_getCloFases())); saveProjects(projects); }

      // Setup check
      if (!proj.cloProjectPath) {
        h += `<div style="background:rgba(45,212,191,0.06);border:1px solid rgba(45,212,191,0.2);border-radius:10px;padding:16px 20px;margin-bottom:14px;">`;
        h += `<div style="font-size:15px;font-weight:700;color:#2dd4bf;margin-bottom:8px;">🔬 clo-author — Configuración inicial</div>`;
        h += `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:12px;">clo-author necesita un directorio de proyecto local. Define la ruta donde se creará la estructura de archivos (LaTeX, R, datos, quality reports).</div>`;
        h += `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">`;
        h += `<input id="clo-path-input" type="text" value="G:/Mi unidad/Doctorado MGT/SILA/projects/${(proj.nombre||'proyecto').replace(/[^a-zA-Z0-9áéíóúñ_-]/g,'_').toLowerCase()}/" style="flex:1;padding:8px;background:var(--bg);border:1px solid rgba(45,212,191,0.2);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;">`;
        h += `<button class="btn bg" onclick="saveCloPath('${proj.id}')" style="background:#2dd4bf;color:#000;font-weight:600;font-size:13px;padding:6px 14px;">Guardar</button>`;
        h += `</div>`;
        h += `<div style="font-size:12px;color:var(--tx3);">Después de guardar, copia el comando de setup y ejecútalo en Claude Code.</div>`;
        h += `</div>`;
      } else {
        // CLO Phase bar
        h += `<div style="margin:8px 0 12px;">`;
        h += `<div style="font-size:11px;color:var(--tx3);margin-bottom:6px;">clo-author · Directorio: <code style="font-size:11px;color:#2dd4bf;">${proj.cloProjectPath}</code></div>`;
        h += `<div class="proj-phases" style="flex-wrap:wrap;">`;
        proj.cloFases.forEach((f, fi) => {
          const stIcon = f.estado === 'completado' ? '✅' : f.estado === 'en_progreso' ? '🔵' : f.estado === 'no_aplica' ? '⚪' : (f.icon || '○');
          const cls = 'proj-phase proj-phase-' + f.estado;
          h += `<div class="${cls}" onclick="cycleCloPhaseStatus('${proj.id}',${fi})" title="${f.nombre}">`;
          h += `<div class="proj-phase-icon">${stIcon}</div>`;
          h += `<div class="proj-phase-name">${f.nombre}</div>`;
          h += `</div>`;
          if (fi < proj.cloFases.length - 1) h += `<div class="proj-phase-arrow">→</div>`;
        });
        h += `</div>`;

        // Advance button
        const cloActive = proj.cloFases.find(f => f.estado === 'en_progreso');
        const hasCloOutput = Object.keys(proj.cloOutputs || {}).length > 0;
        h += `<div style="margin:8px 0;display:flex;justify-content:space-between;align-items:center;">`;
        if (hasCloOutput) {
          h += `<button class="btn bo" onclick="generateDrReport('${proj.id}')" style="font-size:12px;padding:4px 12px;border-color:var(--green);color:var(--green);">📊 Reporte</button>`;
        } else { h += `<span></span>`; }
        h += `<button class="btn bg" onclick="advanceCloPhase('${proj.id}')" style="font-size:13px;padding:5px 16px;background:#2dd4bf;color:#000;">${cloActive ? '🚧 Completar fase' : '▶ Iniciar primera fase'}</button>`;
        h += `</div></div>`;

        // CLO Wizard Guide for active phase
        if (cloActive) {
          const cloPhaseId = cloActive.id;
          const cloTasks = (_getCloWizardTasks())[cloPhaseId] || [];
          const cloOutputs = (proj.cloOutputs || {})[cloPhaseId] || {};

          // Cross-system context (include DR outputs if mixed mode)
          const allDrOuts = proj.drOutputs || {};
          const drContext = isDrMode ? Object.entries(allDrOuts).map(([ph, tasks]) => {
            const entries = Object.values(tasks).filter(v => v && v.length > 0);
            return entries.length > 0 ? '=== /dr ' + ph + ' ===\n' + entries.join('\n---\n') : '';
          }).filter(s => s).join('\n\n') : '';

          const cloObjectives = {
            clo_discover: 'Revisar literatura, identificar gaps, evaluar datos disponibles. Parallel: librarian + explorer.',
            clo_strategize: 'Definir estrategia de identificación y plan de estimación. Strategist + strategist-critic.',
            clo_analyze: 'Implementar análisis en R/Stata, pipeline de datos, tablas y figuras. Coder + coder-critic.',
            clo_write: 'Escribir paper en LaTeX con secciones IMRaD. Writer + writer-critic + humanizer pass.',
            clo_review: 'Peer review simulado: editor desk review + 2 referees ciegos con disposiciones distintas.',
            clo_revise: 'Responder R&R: clasificar comentarios (NEW ANALYSIS/CLARIFICATION/REWRITE/DISAGREE/MINOR), routing a agentes.',
            clo_submit: 'Verificación final, replication package, submission a journal.'
          };

          h += `<div id="clo-wizard-guide" style="background:linear-gradient(135deg,rgba(45,212,191,0.06),rgba(93,187,138,0.04));border:1px solid rgba(45,212,191,0.2);border-radius:10px;padding:16px 20px;margin-bottom:14px;">`;
          h += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">`;
          h += `<div style="font-size:15px;font-weight:700;color:#2dd4bf;">🔬 clo-author: ${cloActive.nombre}</div>`;
          h += `<span style="font-size:13px;color:var(--tx3);cursor:pointer;" onclick="this.closest('div[style*=linear-gradient]').style.display='none'">ocultar ✕</span>`;
          h += `</div>`;
          h += `<div style="font-size:14px;color:var(--tx2);margin-bottom:12px;">${cloObjectives[cloPhaseId] || ''}</div>`;

          // Render CLO tasks (same pattern as DR)
          cloTasks.forEach((task, ti) => {
            const wp = proj.cloWizardProgress?.[cloPhaseId]?.[ti];
            const estado = wp || 'pendiente';
            const icons = { pendiente: '☐', en_progreso: '🔵', completado: '☑', no_aplica: '⚪' };
            const colors = { pendiente: 'var(--tx)', en_progreso: 'var(--blue)', completado: 'var(--green)', no_aplica: 'var(--tx3)' };
            const textDeco = estado === 'completado' ? 'text-decoration:line-through;opacity:0.7;' : estado === 'no_aplica' ? 'text-decoration:line-through;opacity:0.4;' : '';
            const detailId = 'clo-wz-' + cloPhaseId + '-' + ti;
            const savedOutput = cloOutputs[ti] || '';
            const hasOutput = savedOutput.length > 0;

            // Previous outputs (within phase + cross-system)
            const prevOuts = [];
            for (let pi = 0; pi < ti; pi++) { if (cloOutputs[pi]) prevOuts.push(cloOutputs[pi]); }
            const withinCtx = prevOuts.length > 0 ? prevOuts.join('\n---\n') : '';
            const prevContext = [drContext, withinCtx].filter(c => c.length > 0).join('\n\n');

            h += `<div style="border:1px solid rgba(45,212,191,${hasOutput ? '0.25' : '0.12'});border-radius:8px;margin:4px 0;background:var(--bg2);overflow:hidden;">`;
            h += `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;">`;
            h += `<span style="font-size:22px;flex-shrink:0;cursor:pointer;color:${colors[estado]};" onclick="event.stopPropagation();toggleCloWizardStep('${proj.id}','${cloPhaseId}',${ti})">${icons[estado]}</span>`;
            h += `<span style="flex:1;font-size:14px;color:${colors[estado]};${textDeco}" onclick="document.getElementById('${detailId}').classList.toggle('show')">${task.texto}</span>`;
            if (hasOutput) h += `<span style="font-size:11px;color:var(--green);padding:2px 6px;background:rgba(93,187,138,0.1);border-radius:4px;">📤 guardado</span>`;
            h += `<span style="font-size:12px;color:var(--tx3);cursor:pointer;padding:4px;" onclick="document.getElementById('${detailId}').classList.toggle('show')">▸</span>`;
            h += `</div>`;
            h += `<div id="${detailId}" class="wz-detail">`;
            if (task.detalle) h += `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:8px;">${task.detalle}</div>`;
            if (task.herramientas) h += `<div style="font-size:13px;color:var(--tx3);margin-bottom:6px;">🔧 ${task.herramientas}</div>`;
            // Context indicator
            const ctxParts = [];
            if (drContext) ctxParts.push('fases /dr');
            if (prevOuts.length > 0) ctxParts.push(prevOuts.length + ' tarea(s) anterior(es)');
            if (ctxParts.length > 0) h += `<div style="font-size:11px;color:var(--green);margin:6px 0 4px;">✓ Contexto de ${ctxParts.join(' + ')} disponible</div>`;

            if (task.prompts && task.prompts.length > 0) {
              const cdPrefix = proj.cloProjectPath ? 'cd "' + proj.cloProjectPath + '" && ' : '';
              h += `<div style="font-size:12px;font-weight:600;color:#2dd4bf;margin:6px 0 4px;">🤖 Prompts (click para copiar):</div>`;
              task.prompts.forEach(p => {
                const enriched = (task.needsCd ? cdPrefix : '') + p + (prevContext ? '\n\n--- CONTEXTO ---\n' + prevContext : '');
                const safeP = enriched.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const displayP = p.length > 120 ? p.substring(0, 120) + '...' : p;
                h += `<div style="font-size:13px;color:var(--tx2);padding:6px 10px;margin:3px 0;background:var(--bg3);border-radius:6px;cursor:pointer;border:1px solid transparent;transition:border-color 0.15s;" onclick="navigator.clipboard.writeText(this.dataset.prompt);this.style.borderColor='var(--green)';setTimeout(()=>this.style.borderColor='transparent',1500);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${safeP}" onmouseover="this.style.borderColor='#2dd4bf'" onmouseout="this.style.borderColor='transparent'">📋 ${displayP}</div>`;
              });
            }
            // Output field
            const outputId = 'clo-output-' + cloPhaseId + '-' + ti;
            h += `<div style="margin-top:8px;border-top:1px solid rgba(45,212,191,0.1);padding-top:8px;">`;
            h += `<span style="font-size:12px;font-weight:600;color:#2dd4bf;">📤 Resultado</span>`;
            h += `<textarea id="${outputId}" placeholder="Pega aquí el output de Claude Code (opcional)." style="width:100%;min-height:${hasOutput?'80':'40'}px;max-height:200px;background:var(--bg);border:1px solid rgba(45,212,191,${hasOutput?'0.3':'0.1'});border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;padding:8px;resize:vertical;margin-top:4px;" onblur="saveCloOutput('${proj.id}','${cloPhaseId}',${ti},this.value)">${savedOutput.replace(/</g,'&lt;')}</textarea>`;
            h += `</div>`;
            h += `</div></div>`;
          });

          h += `</div>`;
        }
      }
    }
  }

  // === ARTIFACTS REGISTRY ===
  {
    const artifacts = proj.drArtifacts || [];
    const wfMode = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
    if (wfMode === 'dr' || wfMode === 'mixed' || wfMode === 'clo') {
      const tags = _getArtifactTags();
      const hasScored = artifacts.filter(a => a.score != null).length >= 2;

      h += `<details class="pd-section"${artifacts.length > 0 ? ' open' : ''}>`;
      h += `<summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">📎 Artefactos del proceso</span><span class="pd-count">${artifacts.length}</span></div></summary>`;
      h += `<div class="pd-body">`;

      // Score trajectory (if 2+ scored artifacts)
      if (hasScored) {
        const scored = artifacts.filter(a => a.score != null).sort((a, b) => a.date.localeCompare(b.date));
        // Group by phase+tag
        const trajectories = {};
        scored.forEach(a => {
          const key = a.phase + '/' + a.tag;
          if (!trajectories[key]) trajectories[key] = [];
          trajectories[key].push(a);
        });
        h += `<div style="margin-bottom:12px;">`;
        h += `<div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:6px;">Trayectoria de scores</div>`;
        Object.entries(trajectories).forEach(([key, arts]) => {
          if (arts.length < 2) return;
          const label = key.split('/')[1];
          const tagObj = tags.find(t => t.id === label);
          h += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;font-size:12px;">`;
          h += `<span style="color:${tagObj?.color || 'var(--tx3)'};min-width:80px;">${tagObj?.icon || ''} ${tagObj?.label || label}:</span>`;
          arts.forEach((a, i) => {
            const deltaColor = a.delta > 0 ? 'var(--green)' : a.delta < 0 ? 'var(--red)' : 'var(--tx3)';
            h += `<span style="background:var(--bg2);padding:2px 6px;border-radius:4px;color:var(--tx);">${a.score}</span>`;
            if (a.delta != null) h += `<span style="font-size:11px;color:${deltaColor};">${a.delta >= 0 ? '+' : ''}${a.delta}</span>`;
            if (i < arts.length - 1) h += `<span style="color:var(--tx3);">→</span>`;
          });
          h += `</div>`;
        });
        h += `</div>`;
      }

      // Artifacts grouped by phase
      const byPhase = {};
      artifacts.forEach(a => {
        if (!byPhase[a.phase]) byPhase[a.phase] = [];
        byPhase[a.phase].push(a);
      });

      if (Object.keys(byPhase).length > 0) {
        Object.entries(byPhase).forEach(([phase, arts]) => {
          h += `<div style="margin-bottom:8px;">`;
          h += `<div style="font-size:12px;font-weight:600;color:var(--tx2);margin-bottom:4px;">${phase} (${arts.length})</div>`;
          arts.forEach(a => {
            const tagObj = tags.find(t => t.id === a.tag);
            const statusColors = { draft: 'var(--tx3)', reviewed: 'var(--blue)', final: 'var(--green)' };
            h += `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;margin:2px 0;background:var(--bg2);border-radius:6px;border-left:3px solid ${statusColors[a.status] || 'var(--tx3)'};">`;
            h += `<span style="font-size:14px;">${tagObj?.icon || '📌'}</span>`;
            h += `<span style="flex:1;font-size:13px;color:var(--tx);">${a.name}</span>`;
            if (a.score != null) {
              const deltaColor = a.delta > 0 ? 'var(--green)' : a.delta < 0 ? 'var(--red)' : 'var(--tx3)';
              h += `<span style="font-size:12px;color:var(--tx2);">${a.score}</span>`;
              if (a.delta != null) h += `<span style="font-size:11px;color:${deltaColor};">${a.delta >= 0 ? '+' : ''}${a.delta}</span>`;
            }
            h += `<span style="font-size:11px;color:var(--tx3);">${a.date}</span>`;
            // Links
            if (a.links && a.links.length > 0) {
              a.links.forEach(l => {
                h += `<a href="${l.url}" target="_blank" style="font-size:11px;color:var(--blue);text-decoration:none;" title="${l.desc || ''}">📁</a>`;
              });
            }
            h += `<span style="font-size:11px;color:var(--blue);cursor:pointer;" onclick="addArtifactLink('${proj.id}','${a.id}')" title="Agregar enlace">+📁</span>`;
            h += `<span style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onclick="removeArtifact('${proj.id}','${a.id}')" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4" title="Eliminar">✕</span>`;
            h += `</div>`;
            // Notes (if any)
            if (a.notes) {
              h += `<div style="font-size:11px;color:var(--tx3);padding:2px 8px 4px 25px;font-style:italic;">${a.notes}</div>`;
            }
          });
          h += `</div>`;
        });
      } else {
        h += `<div style="font-size:13px;color:var(--tx3);padding:8px 0;">Sin artefactos registrados. Los artefactos documentan tu proceso: borradores, scores, decisiones, reflexiones.</div>`;
      }

      // Action bar
      const activePhaseId = (proj.drFases || []).find(f => f.estado === 'en_progreso')?.id || '';
      h += `<div style="display:flex;gap:8px;margin-top:8px;">`;
      h += `<button class="btn bo" onclick="showArtifactModal('${proj.id}','${activePhaseId}')" style="font-size:12px;padding:3px 10px;">+ Artefacto</button>`;
      if (artifacts.length > 0) {
        h += `<button class="btn bo" onclick="generatePortfolio('${proj.id}')" style="font-size:12px;padding:3px 10px;border-color:var(--green);color:var(--green);">📊 Descargar portafolio</button>`;
      }
      h += `</div>`;

      h += `</div></details>`;
    }
  }

  // External links (collapsible)
  const links = proj.links || [];
  h += `<details class="pd-section"${links.length > 0 ? ' open' : ''}><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">Links del proyecto</span><span class="pd-count">${links.length}</span></div></summary><div class="pd-body">`;
  h += `<div style="margin-bottom:8px;"><button class="btn bo" style="font-size:12px;padding:3px 10px;" onclick="addProjectLink('${proj.id}')">+ Link</button></div>`;
  if (links.length > 0) {
    h += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">`;
    links.forEach((lnk, li) => {
      h += `<a href="${lnk.url}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:var(--bg2);border:1px solid rgba(220,215,205,0.08);border-radius:7px;color:var(--blue);font-size:13px;text-decoration:none;transition:all 0.1s;" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='rgba(220,215,205,0.08)'">${lnk.nombre} <span onclick="event.preventDefault();event.stopPropagation();removeProjectLink('${proj.id}',${li})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.5;" onmouseover="this.style.opacity=1;this.style.color='var(--red)'" onmouseout="this.style.opacity=0.5;this.style.color='var(--tx3)'">✕</span></a>`;
    });
    h += `</div>`;
  }

  // Folder structure generator
  h += `<div style="margin-bottom:12px;"><button class="btn bo" onclick="generateProjectStructure('${proj.id}')" style="font-size:13px;">📁 Descargar estructura de carpetas</button></div>`;
  h += `</div></details>`; // close Links section

  // Pre-submission checklist (collapsible)
  const DEFAULT_CHECKLIST = _getDefaultChecklist();
  if (!proj.checklist || proj.checklist.length === 0) { proj.checklist = JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)); saveProjects(projects); }
  const checkDone = proj.checklist.filter(c => c.estado === 'completado' || c.done === true).length;
  const checkNA = proj.checklist.filter(c => c.estado === 'no_aplica').length;
  const checkTotal = proj.checklist.length;
  const checkApplicable = checkTotal - checkNA;
  const checkPct = checkApplicable > 0 ? Math.round(checkDone / checkApplicable * 100) : 0;
  const isRevisionPhase = headerPhase && (headerPhase.id === 'revision' || headerPhase.id === 'submission');
  h += `<details class="pd-section"${isRevisionPhase ? ' open' : ''}><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">Checklist pre-submission</span><span class="pd-count">${checkDone}/${checkApplicable} (${checkPct}%)</span></div></summary><div class="pd-body">`;
  h += `<div style="margin-bottom:12px;">`;
  // Progress bar
  h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;"><div style="height:100%;background:${checkPct === 100 ? 'var(--green)' : 'var(--gold)'};width:${checkPct}%;border-radius:3px;transition:width 0.3s;"></div></div><span style="font-size:12px;color:${checkPct === 100 ? 'var(--green)' : 'var(--tx3)'};">${checkPct}%</span></div>`;
  h += `<div style="font-size:11px;color:var(--tx3);margin-bottom:6px;">☐ Pendiente → 🔵 En ejecución → ☑ Terminado → ⚪ No aplica (click para cambiar)</div>`;
  proj.checklist.forEach((item, ci) => {
    const estado = item.estado || (item.done ? 'completado' : 'pendiente');
    const icons = { pendiente: '☐', en_progreso: '🔵', completado: '☑', no_aplica: '⚪' };
    const colors = { pendiente: 'var(--tx2)', en_progreso: 'var(--blue)', completado: 'var(--green)', no_aplica: 'var(--tx3)' };
    const textStyle = estado === 'completado' ? 'text-decoration:line-through;opacity:0.7;' : estado === 'no_aplica' ? 'text-decoration:line-through;opacity:0.4;font-style:italic;' : '';
    const def = DEFAULT_CHECKLIST[ci] || {};
    const detalle = item.detalle || def.detalle || '';
    const herram = item.herramientas || def.herramientas || '';
    const prompts = item.prompts || def.prompts || [];
    const hasDetail = detalle || herram || prompts.length;
    const clDetailId = 'cl-detail-' + ci;
    h += `<div style="border:1px solid rgba(220,215,205,0.04);border-radius:8px;margin:3px 0;overflow:hidden;background:var(--bg2);">`;
    h += `<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;">`;
    h += `<span style="font-size:22px;flex-shrink:0;line-height:1;padding:2px;color:${colors[estado]};" onclick="event.stopPropagation();toggleChecklistItem('${proj.id}',${ci})">${icons[estado]}</span>`;
    h += `<span style="flex:1;font-size:14px;color:${colors[estado]};${textStyle}" onclick="if(document.getElementById('${clDetailId}'))document.getElementById('${clDetailId}').classList.toggle('show')">${item.texto}</span>`;
    if (hasDetail) h += `<span style="font-size:12px;color:var(--tx3);cursor:pointer;padding:4px;" onclick="document.getElementById('${clDetailId}').classList.toggle('show')">▸</span>`;
    h += `<span onclick="event.stopPropagation();removeChecklistItem('${proj.id}',${ci})" style="font-size:11px;color:var(--tx3);cursor:pointer;opacity:0.3;flex-shrink:0;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3">✕</span>`;
    h += `</div>`;
    if (hasDetail) {
      h += `<div id="${clDetailId}" class="wz-detail">`;
      if (detalle) h += `<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:6px;">${detalle}</div>`;
      if (herram) h += `<div style="font-size:13px;color:var(--tx3);margin-bottom:6px;">🔧 ${herram}</div>`;
      if (prompts.length > 0) {
        h += `<div style="font-size:13px;font-weight:600;color:var(--gold);margin:6px 0 4px;">🤖 Prompts (click para copiar):</div>`;
        prompts.forEach(p => {
          const safeP = p.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          h += `<div style="font-size:13px;color:var(--tx2);padding:6px 10px;margin:3px 0;background:var(--bg3);border-radius:6px;cursor:pointer;border:1px solid transparent;transition:border-color 0.15s;" onclick="navigator.clipboard.writeText(this.dataset.prompt);this.style.borderColor='var(--green)';setTimeout(()=>this.style.borderColor='transparent',1500);window.showToast&&window.showToast('Prompt copiado','success')" data-prompt="${safeP}" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='transparent'">📋 ${p.length > 120 ? p.substring(0, 120) + '...' : p}</div>`;
        });
      }
      h += `</div>`;
    }
    h += `</div>`;
  });
  h += `</div>`;

  h += `</div></details>`; // close Checklist

  // Research question evolution log (collapsible)
  const qLog = proj.preguntaLog || [];
  const isIdeacionPhase = headerPhase && (headerPhase.id === 'ideacion' || headerPhase.id === 'fundamentacion');
  h += `<details class="pd-section"${isIdeacionPhase || qLog.length > 0 ? ' open' : ''}><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">Evolución de la pregunta de investigación</span><span class="pd-count">${qLog.length}</span></div></summary><div class="pd-body">`;
  h += `<div style="margin-bottom:6px;"><button class="btn bo" style="font-size:12px;padding:3px 10px;" onclick="addQuestionEntry('${proj.id}')">+ Registrar</button></div>`;
  if (qLog.length === 0) {
    h += `<div style="padding:12px 16px;color:var(--tx3);font-size:13px;font-style:italic;">Sin registros aún. Documenta cómo evoluciona tu pregunta de investigación a medida que lees.</div>`;
  } else {
    qLog.forEach((entry, qi) => {
      const isLast = qi === qLog.length - 1;
      h += `<div style="display:flex;gap:10px;padding:8px 14px;${isLast ? 'background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.12);border-radius:7px;' : 'border-left:2px solid var(--bg3);margin-left:6px;'}margin-bottom:6px;">`;
      h += `<div style="font-size:12px;color:${isLast ? 'var(--gold)' : 'var(--tx3)'};min-width:80px;font-weight:${isLast ? '600' : '400'};">${entry.fecha}</div>`;
      h += `<div style="font-size:14px;color:${isLast ? 'var(--tx)' : 'var(--tx2)'};flex:1;${isLast ? 'font-weight:500;' : 'font-style:italic;text-decoration:line-through;opacity:0.7;'}">${entry.texto}</div>`;
      h += `<span onclick="removeQuestionEntry('${proj.id}',${qi})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span>`;
      h += `</div>`;
    });
  }

  h += `</div></details>`; // close Question log

  // Articles section with role selector
  h += `<div class="proj-section-title"><span>${proj._isShared ? 'Fuentes del proyecto' : 'Mis fuentes'} (${projArts.length})</span>${isOwner ? `<button onclick="addArticleToProject('${proj.id}')">+ Agregar</button>` : ''}</div>`;
  if (projArts.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;">Sin artículos vinculados. Agrega artículos de tu biblioteca.</div>`;
  }
  projArts.forEach(a => {
    const progress = calcArticleProgress(a.key);
    const claims = calcArticleClaims(a.key);
    const claimsText = [];
    if (claims.support) claimsText.push(claims.support + ' apoyan');
    if (claims.contrast) claimsText.push(claims.contrast + ' contrastan');
    if (claims.neutral) claimsText.push(claims.neutral + ' neutral');

    h += `<div class="proj-article" onclick="goToArticle('${a.key}')">`;
    h += `<div class="proj-art-header">`;
    h += `<span class="proj-art-name">${a.authors} (${a.year})</span>`;
    // Role selector
    h += `<select class="proj-role-select" onclick="event.stopPropagation()" onchange="setArticleRole('${proj.id}','${a.key}',this.value)">`;
    PROJ_ROLES.forEach(r => {
      h += `<option value="${r}" ${a.rol === r ? 'selected' : ''}>${PROJ_ROLE_LABELS[r]}</option>`;
    });
    h += `</select>`;
    h += `<button class="proj-art-remove" onclick="removeArticleFromProject(event,'${proj.id}','${a.key}')" title="Quitar del proyecto">✕</button>`;
    h += `</div>`;
    h += `<div class="proj-art-bar-bg"><div class="proj-art-bar" style="width:${progress}%"></div></div>`;
    h += `<div class="proj-art-claims">${progress}% leído${claimsText.length ? ' · ' + claimsText.join(' · ') : ''}</div>`;
    h += `</div>`;
  });

  // Documents section
  h += `<div class="proj-section-title"><span>${proj._isShared ? 'Escritos del proyecto' : 'Mis escritos'} (${projDocs.length})</span>${isOwner ? `<div style="display:flex;gap:6px;"><button onclick="createDocFromProject('${proj.id}')">+ Crear</button><button onclick="addDocToProject('${proj.id}')">+ Agregar</button></div>` : ''}</div>`;
  if (projDocs.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;">Sin documentos vinculados. Agrega documentos de "Mis escritos".</div>`;
  }
  projDocs.forEach(d => {
    const doc = d.doc;
    const st = doc.status || 'borrador';
    const stIcon = st === 'finalizado' ? '✓' : st === 'revision' ? '⏳' : '✍';
    const stColor = st === 'finalizado' ? 'var(--green)' : st === 'revision' ? 'var(--gold)' : 'var(--tx2)';
    const words = countDocWords(doc);
    const blocks = calcDocBlockStates(doc);
    const blocksText = [];
    if (blocks.idea) blocksText.push(blocks.idea + '💡');
    if (blocks.borrador) blocksText.push(blocks.borrador + '✏️');
    if (blocks.terminado) blocksText.push(blocks.terminado + '✅');
    if (blocks.desactualizado) blocksText.push(blocks.desactualizado + '⚠');

    h += `<div class="proj-doc" onclick="openDoc('${doc.id}')">`;
    h += `<div class="proj-doc-header">`;
    h += `<span class="proj-doc-status" style="color:${stColor}">${stIcon}</span>`;
    h += `<span class="proj-doc-name">${doc.title}</span>`;
    h += `<span class="proj-doc-words">${words} pal</span>`;
    h += `<button class="proj-doc-remove" onclick="removeDocFromProject(event,'${proj.id}','${doc.id}')" title="Quitar del proyecto">✕</button>`;
    h += `</div>`;
    if (blocksText.length) h += `<div class="proj-doc-blocks">${blocksText.join(' ')}</div>`;
    if (d.linkDrive) {
      h += `<div class="proj-doc-drive"><a href="${d.linkDrive}" target="_blank" onclick="event.stopPropagation()">📄 Abrir en Google Docs</a></div>`;
    } else {
      h += `<div class="proj-doc-drive"><a href="#" onclick="event.stopPropagation();event.preventDefault();setDocDriveLink('${proj.id}','${doc.id}')" style="color:var(--tx3);">+ Link Google Docs</a></div>`;
    }
    h += `</div>`;
  });

  // === PHASE 2: Source→Section Map with gap detection === (collapsible)
  const secciones = proj.secciones || [];
  const isEscrituraPhase = headerPhase && (headerPhase.id === 'escritura' || headerPhase.id === 'fundamentacion');
  h += `<details class="pd-section"${isEscrituraPhase && secciones.length > 0 ? ' open' : ''}><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">Mapa fuentes → secciones</span><span class="pd-count">${secciones.length}</span></div></summary><div class="pd-body">`;
  h += `<div style="margin-bottom:6px;"><button class="btn bo" style="font-size:12px;padding:3px 10px;" onclick="addProjectSection('${proj.id}')">+ Sección</button></div>`;

  if (secciones.length > 0 && projArts.length > 0) {
    h += `<div class="proj-matrix"><table>`;
    // Header row
    h += `<tr><th style="text-align:left;min-width:150px;">Artículo</th>`;
    secciones.forEach((sec, si) => {
      h += `<th style="min-width:100px;"><div>${sec.nombre}</div>`;
      if (sec.targetPalabras > 0) h += `<div style="font-size:10px;color:var(--tx3);font-weight:400;">${sec.targetPalabras} pal</div>`;
      h += `<div style="display:flex;gap:2px;margin-top:4px;justify-content:center;">`;
      h += `<button style="font-size:10px;background:none;border:none;color:var(--tx3);cursor:pointer;" onclick="setSeccionTarget('${proj.id}',${si})" title="Meta palabras">🎯</button>`;
      h += `<button style="font-size:10px;background:none;border:none;color:var(--tx3);cursor:pointer;" onclick="removeProjectSection('${proj.id}',${si})" title="Eliminar sección">✕</button>`;
      h += `</div></th>`;
    });
    h += `</tr>`;

    // Article rows
    projArts.forEach(a => {
      h += `<tr><td style="text-align:left;font-size:13px;">${a.authors} (${a.year})</td>`;
      secciones.forEach((sec, si) => {
        const isLinked = (sec.articulosFuente || []).includes(a.key);
        h += `<td class="proj-matrix-cell ${isLinked ? 'linked' : ''}" onclick="toggleSeccionArticulo('${proj.id}',${si},'${a.key}')" title="Click para ${isLinked ? 'quitar' : 'asignar'}">`;
        h += isLinked ? '●' : '';
        h += `</td>`;
      });
      h += `</tr>`;
    });

    // Footer row: counts + gap detection
    h += `<tr style="border-top:2px solid var(--bg4);"><td style="text-align:left;font-size:12px;color:var(--tx3);font-weight:600;">Fuentes</td>`;
    secciones.forEach((sec, si) => {
      const count = (sec.articulosFuente || []).length;
      const isGap = count < 2;
      h += `<td style="font-size:12px;font-weight:600;color:${isGap ? 'var(--gold)' : 'var(--tx3)'};">`;
      h += `${count} ${isGap ? '⚠' : ''}`;
      h += `</td>`;
    });
    h += `</tr>`;

    // Footer row 2: word progress per section
    h += `<tr><td style="text-align:left;font-size:12px;color:var(--tx3);">Progreso</td>`;
    secciones.forEach((sec, si) => {
      if (sec.targetPalabras > 0) {
        h += `<td style="font-size:11px;color:var(--tx3);">meta: ${sec.targetPalabras}</td>`;
      } else {
        h += `<td style="font-size:11px;color:var(--tx3);">—</td>`;
      }
    });
    h += `</tr>`;

    h += `</table></div>`;

    // Unassigned articles warning
    const assignedKeys = new Set();
    secciones.forEach(s => (s.articulosFuente || []).forEach(k => assignedKeys.add(k)));
    const unassigned = projArts.filter(a => !assignedKeys.has(a.key));
    if (unassigned.length > 0) {
      h += `<div style="padding:8px 14px;margin:8px 0;background:rgba(232,168,56,0.06);border:1px solid rgba(232,168,56,0.15);border-left:3px solid var(--gold);border-radius:0 7px 7px 0;font-size:13px;color:var(--gold);">`;
      h += `⚠ ${unassigned.length} artículo${unassigned.length !== 1 ? 's' : ''} sin asignar a ninguna sección: `;
      h += unassigned.map(a => a.authors + ' (' + a.year + ')').join(', ');
      h += `</div>`;
    }
  } else if (secciones.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;">Define las secciones de tu manuscrito para mapear qué fuentes alimentan cada parte.</div>`;
  } else {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;">Agrega artículos al proyecto para construir el mapa.</div>`;
  }

  h += `</div></details>`; // close Source map

  // === PHASE 2: Claims filtered by project === (collapsible)
  if (projArts.length > 0) {
    const projClaims = getProjectClaims(proj);
    const totalClaims = projClaims.support.length + projClaims.contrast.length + projClaims.neutral.length;
    h += `<details class="pd-section"${isEscrituraPhase && totalClaims > 0 ? ' open' : ''}><summary><div class="pd-header"><span class="pd-chevron">▶</span><span class="pd-title">Claims del proyecto</span><span class="pd-count">${totalClaims}</span></div></summary><div class="pd-body">`;

    if (totalClaims === 0) {
      h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;">Sin claims registrados. Evalúa párrafos (S/C/N) en los artículos del proyecto.</div>`;
    } else {
      // KPI mini
      h += `<div style="display:flex;gap:10px;margin-bottom:12px;">`;
      h += `<span style="padding:4px 12px;border-radius:12px;font-size:13px;background:rgba(93,187,138,0.1);color:var(--green);">${projClaims.support.length} apoyan</span>`;
      h += `<span style="padding:4px 12px;border-radius:12px;font-size:13px;background:rgba(224,112,80,0.1);color:var(--red);">${projClaims.contrast.length} contrastan</span>`;
      h += `<span style="padding:4px 12px;border-radius:12px;font-size:13px;background:rgba(155,125,207,0.1);color:var(--purple);">${projClaims.neutral.length} neutral</span>`;
      h += `</div>`;

      // Claims list grouped by type
      [['support', 'Apoyan la tesis', 'var(--green)'], ['contrast', 'Contrastan la tesis', 'var(--red)'], ['neutral', 'Neutral', 'var(--purple)']].forEach(([type, label, color]) => {
        if (projClaims[type].length === 0) return;
        h += `<div style="margin:12px 0 6px;font-size:13px;font-weight:600;color:${color};">${label} (${projClaims[type].length})</div>`;
        projClaims[type].forEach(c => {
          h += `<div class="proj-claim" onclick="goToArticlePar('${c.key}',${c.si},${c.pi})" style="padding:8px 12px;margin:4px 0;background:var(--bg2);border-left:3px solid ${color};border-radius:0 6px 6px 0;cursor:pointer;transition:background 0.1s;">`;
          h += `<div style="font-size:12px;color:var(--tx3);">${c.authors} (${c.year}) — ${c.sec}</div>`;
          if (c.text) h += `<div style="font-size:13px;color:var(--tx2);line-height:1.5;margin-top:2px;">"${c.text}"</div>`;
          h += `</div>`;
        });
      });
    }
    h += `</div></details>`; // close Claims
  }

  // Legend
  h += `<div style="display:flex;gap:14px;margin-top:12px;font-size:12px;color:var(--tx3);">`;
  h += `<span>▶ Secciones colapsadas: click para expandir</span>`;
  h += `</div>`;

  ct.innerHTML = h;

  // Load DR alerts from Supabase (async, renders into placeholder)
  const wfMode = proj.workflowMode || (proj.drMode ? 'dr' : 'default');
  if (wfMode === 'dr' || wfMode === 'mixed') {
    loadAndRenderDrAlerts(projId);
  }
}

// ============================================================
// Project filter state and toggleProjFilter
// ============================================================

if (!window._projFilters) {
  try { window._projFilters = JSON.parse(localStorage.getItem('sila_projFilters')) || ['en_ejecucion']; } catch (e) { window._projFilters = ['en_ejecucion']; }
  if (window._projFilters.length === 0) window._projFilters = ['en_ejecucion'];
}

function toggleProjFilter(estado) {
  const idx = window._projFilters.indexOf(estado);
  if (idx >= 0 && window._projFilters.length > 1) { window._projFilters.splice(idx, 1); }
  else if (idx < 0) { window._projFilters.push(estado); }
  // Don't allow empty — minimum 1 filter active
  try { localStorage.setItem('sila_projFilters', JSON.stringify(window._projFilters)); } catch (e) {}
  renderGlobalDash();
}

// ============================================================
// renderProjectsSummary — project cards for Vista General
// ============================================================

function renderProjectsSummary() {
  const allProjects = getProjects();
  if (allProjects.length === 0) {
    return `<div class="proj-empty-cta"><p>¿Escribiendo un paper? Crea un proyecto para organizar tus fuentes y escritos.</p><button class="proj-cta-btn" onclick="createProject()">+ Crear proyecto</button></div>`;
  }

  // Filter bar
  let h = '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
  PROJ_ESTADOS.forEach(e => {
    const count = allProjects.filter(p => (p.estado || 'en_ejecucion') === e.id).length;
    const active = window._projFilters.includes(e.id);
    h += `<button onclick="toggleProjFilter('${e.id}')" style="padding:5px 14px;border-radius:16px;border:1px solid ${active ? e.color : 'rgba(220,215,205,0.1)'};background:${active ? e.color + '18' : 'var(--bg3)'};color:${active ? e.color : 'var(--tx3)'};cursor:pointer;font-size:13px;font-family:'Inter',sans-serif;font-weight:${active ? '600' : '400'};transition:all 0.12s;">${e.icon} ${e.label} (${count})</button>`;
  });
  h += '</div>';

  // Filter projects
  const projects = allProjects.filter(p => window._projFilters.includes(p.estado || 'en_ejecucion'));
  if (projects.length === 0) {
    h += `<div style="padding:20px;text-align:center;color:var(--tx3);font-size:14px;">No hay proyectos con los filtros seleccionados.</div>`;
    return h;
  }

  h += '<div class="proj-summary-grid">';
  const docs = getDocs();
  projects.forEach(p => {
    const nArts = (p.articulos || []).length;
    const projDocs = (p.documentos || []).map(d => docs.find(dd => dd.id === d.id)).filter(Boolean);
    const nDocs = projDocs.length;
    const totalWords = projDocs.reduce((sum, d) => sum + countDocWords(d), 0);
    const days = calcDaysRemaining(p.fechaLimite);
    const elapsed = calcDaysElapsed(p.created, p.fechaLimite);
    const daysClass = days < 7 && days !== Infinity ? 'urgent' : days < 14 && days !== Infinity ? 'warning' : '';
    const alert = calcProjectAlert(p, projDocs);
    const daysLabel = days === Infinity ? 'Sin deadline' : days + ' día' + (days !== 1 ? 's' : '');

    h += `<div class="proj-summary-card${p.priority ? ' priority' : ''}" onclick="goToProject('${p.id}')">`;
    const pEstado = PROJ_ESTADOS.find(e => e.id === (p.estado || 'en_ejecucion')) || PROJ_ESTADOS[0];
    h += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
    h += `<div class="proj-summary-name">${p.nombre} →</div>`;
    h += `<span style="font-size:11px;color:${pEstado.color};">${pEstado.icon} ${pEstado.label}</span>`;
    h += `</div>`;
    if (p.eje) h += `<div style="font-size:12px;color:var(--purple);margin:-2px 0 4px;">${p.eje}</div>`;
    h += `<div class="proj-summary-stats">${nArts} artículos · ${nDocs} docs · ${totalWords.toLocaleString()} pal</div>`;
    if (days !== Infinity) {
      h += `<div class="proj-summary-bar-bg"><div class="proj-summary-bar ${daysClass}" style="width:${elapsed}%"></div></div>`;
      h += `<div class="proj-summary-days ${daysClass}">${daysLabel}</div>`;
    }
    h += `<div class="proj-summary-alert">${alert}</div>`;
    h += `</div>`;
  });
  h += '</div>';
  return h;
}

// ============================================================
// MI TESIS — cross-article claims grouped
// ============================================================

async function renderMiTesis() {
  const ct = document.getElementById('ct');
  const manifest = window.SILA_MANIFEST || [];
  const groups = { support: [], contrast: [], neutral: [] };

  // Iterate ALL articles
  for (const art of manifest) {
    await state._loadArticle(art.key);
    const artData = window.SILA_ARTICLES[art.key]; if (!artData) continue;
    // Get user data for this article (try per-article key first, then shared)
    let d = {};
    try { const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4'); if (raw) d = JSON.parse(raw); } catch (e) {}
    const claims = d.claims || {};
    const notes = d.claimNotes || {};
    Object.entries(claims).forEach(([pid, type]) => {
      if (!groups[type]) return;
      const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
      const si = parseInt(m[1]), pi = parseInt(m[2]);
      const sec = artData.sections[si]; if (!sec) return;
      const par = sec.paragraphs[pi]; if (!par) return;
      groups[type].push({
        articleKey: art.key, authors: art.authors, year: art.year,
        pid, si, pi, secTitle: sec.title,
        parTitle: par.title || ('Párrafo ' + (pi + 1)),
        text: par.text.substring(0, 200) + '...',
        note: notes[pid] || ''
      });
    });
  }

  let h = state._getBreadcrumb() + `<div class="sb"><h3>Mi tesis — Claims cross-article</h3></div>`;
  h += `<p style="font-size:14px;color:var(--tx2);margin-bottom:8px;">Todos los párrafos evaluados de todos tus artículos, agrupados por relación con tu argumento.</p>`;

  const total = groups.support.length + groups.contrast.length + groups.neutral.length;
  if (total === 0) {
    h += `<div style="text-align:center;padding:40px;color:var(--tx3);">Aún no has evaluado párrafos. Ve a "Texto anotado" de cualquier artículo y usa los botones Apoya/Contrasta/Neutro.</div>`;
    ct.innerHTML = h; return;
  }

  // Export button
  h += `<div style="display:flex;gap:8px;margin-bottom:14px;">`;
  h += `<button class="btn bg" onclick="exportClaims()">📋 Copiar claims para tesis</button>`;
  h += `<button class="btn bg" onclick="createDocFromClaims()" style="background:var(--blue);">✍ Crear documento desde claims</button>`;
  h += `<button class="btn bo" onclick="exportClaimsFile()">💾 Descargar como .txt</button>`;
  h += `</div>`;

  // KPI
  h += `<div style="display:flex;gap:10px;margin-bottom:14px;">`;
  h += `<div style="flex:1;padding:10px;background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.15);border-radius:7px;text-align:center;"><span style="font-size:20px;font-weight:800;color:var(--green);">${groups.support.length}</span><br><span style="font-size:12px;color:var(--tx2);">Apoyan</span></div>`;
  h += `<div style="flex:1;padding:10px;background:rgba(224,112,80,0.06);border:1px solid rgba(224,112,80,0.15);border-radius:7px;text-align:center;"><span style="font-size:20px;font-weight:800;color:var(--red);">${groups.contrast.length}</span><br><span style="font-size:12px;color:var(--tx2);">Contrastan</span></div>`;
  h += `<div style="flex:1;padding:10px;background:rgba(225,220,210,0.04);border:1px solid rgba(225,220,210,0.08);border-radius:7px;text-align:center;"><span style="font-size:20px;font-weight:800;color:var(--tx3);">${groups.neutral.length}</span><br><span style="font-size:12px;color:var(--tx2);">Neutros</span></div>`;
  h += `</div>`;

  [{ type: 'support', label: 'Apoyan mi tesis', icon: '✓' }, { type: 'contrast', label: 'Contrastan mi tesis', icon: '✗' }, { type: 'neutral', label: 'Neutros', icon: '―' }].forEach(g => {
    if (groups[g.type].length === 0) return;
    h += `<div class="thesis-group ${g.type}"><h3>${g.icon} ${g.label} (${groups[g.type].length})</h3>`;
    groups[g.type].forEach(item => {
      h += `<div class="thesis-card">`;
      h += `<div style="font-size:12px;color:var(--blue);font-weight:600;margin-bottom:4px;">${item.authors} (${item.year})</div>`;
      h += `<div class="thesis-sec">${item.secTitle} · ${item.parTitle}</div>`;
      h += `<div class="thesis-text">${item.text}</div>`;
      if (item.note) h += `<div class="thesis-note">${item.note}</div>`;
      h += `<div style="margin-top:8px;"><span style="font-size:13px;color:var(--blue);cursor:pointer;" onclick="goToArticle('${item.articleKey}')">→ Ir al artículo</span></div>`;
      h += `</div>`;
    });
    h += `</div>`;
  });
  ct.innerHTML = h;
}

// ============================================================
// Export claims (used from Mi Tesis view)
// ============================================================

function exportClaims() {
  let text = buildClaimsText();
  navigator.clipboard.writeText(text).then(() => alert('Claims copiados al portapapeles (' + text.split('\n').length + ' líneas)'));
}

function exportClaimsFile() {
  let text = buildClaimsText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'YUNQUE_claims_tesis.txt'; a.click();
}

function buildClaimsText() {
  const manifest = window.SILA_MANIFEST || [];
  let lines = ['YUNQUE — Claims para marco teórico', 'Generado: ' + new Date().toLocaleDateString(), '', ''];
  ['support', 'contrast', 'neutral'].forEach(type => {
    const label = type === 'support' ? 'APOYAN MI TESIS' : type === 'contrast' ? 'CONTRASTAN MI TESIS' : 'NEUTROS';
    let items = [];
    manifest.forEach(art => {
      const artData = window.SILA_ARTICLES[art.key]; if (!artData) return;
      let d = {}; try { const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4'); if (raw) d = JSON.parse(raw); } catch (e) {}
      const claims = d.claims || {}; const notes = d.claimNotes || {};
      Object.entries(claims).forEach(([pid, t]) => {
        if (t !== type) return;
        const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
        const si = parseInt(m[1]), pi = parseInt(m[2]);
        const sec = artData.sections[si]; if (!sec) return;
        const par = sec.paragraphs[pi]; if (!par) return;
        items.push({ authors: art.authors, year: art.year, sec: sec.title, text: par.text.substring(0, 300), note: notes[pid] || '' });
      });
    });
    if (items.length === 0) return;
    lines.push('═══ ' + label + ' (' + items.length + ') ═══', '');
    items.forEach((it, i) => {
      lines.push((i + 1) + '. Según ' + it.authors + ' (' + it.year + '), ' + it.sec + ':');
      lines.push('   "' + it.text + '"');
      if (it.note) lines.push('   → Nota: ' + it.note);
      lines.push('');
    });
  });
  return lines.join('\n');
}

// ============================================================
// Register on state for late-bound access by other modules
// ============================================================
state._getProjects = getProjects;
state._saveProjects = saveProjects;
state._buildProjectSidebar = buildProjectSidebar;
state._renderProjectDash = renderProjectDash;
state._renderMiTesis = renderMiTesis;
state._getProjectsForArticle = getProjectsForArticle;
state._getProjectsForDoc = getProjectsForDoc;
state._renderProjectBadges = renderProjectBadges;
state._renderProjectsSummary = renderProjectsSummary;
state._getProjectClaims = getProjectClaims;
state._calcDaysRemaining = calcDaysRemaining;
state._calcProjectAlert = calcProjectAlert;
state._updateSidebarKPIs = updateSidebarKPIs;
state._goPipeline = goPipeline;
state._renderPipeline = renderPipeline;
state._calcArticleProgress = calcArticleProgress;
state._calcArticleClaims = calcArticleClaims;
state._calcDocBlockStates = calcDocBlockStates;
state._calcDaysElapsed = calcDaysElapsed;
state._goToProject = goToProject;
state._toggleProjFilter = toggleProjFilter;

// ============================================================
// TEAM DASHBOARD — shows all members with their phase progress
// NOTE: Canonical implementation now in projects-team.js
// These functions remain here for backward compatibility
// ============================================================

async function loadTeamDashboard(projectId) {
  const area = document.getElementById('proj-team-dashboard');
  if (!area || !state.sdb || !state.currentUser) return;

  // Load members
  const members = await loadProjectMembers(projectId);
  if (members.length <= 1) return; // Don't show for solo projects

  // Load phase data for all members
  let phaseData = [];
  try {
    const { data } = await state.sdb
      .from('user_project_phase')
      .select('user_id, current_phase, phases, gate_records')
      .eq('project_id', projectId);
    phaseData = data || [];
  } catch (e) { console.error('Load phase data error:', e); }

  const PHASE_IDS = ['ideacion', 'fundamentacion', 'diseno', 'escritura', 'revision', 'submission', 'peer_review', 'respuesta', 'publicacion'];
  const PHASE_SHORT = ['Idea', 'Fund.', 'Diseño', 'Escrit.', 'Rev.', 'Sub.', 'Review', 'Resp.', 'Pub.'];
  const ROLE_COLORS = { owner: 'var(--gold)', coauthor: 'var(--blue)', reviewer: 'var(--green)', reader: 'var(--tx3)' };

  let h = '<div style="margin:16px 0 8px;">';
  h += '<div style="font-size:15px;font-weight:700;color:var(--tx);margin-bottom:8px;">👥 Equipo</div>';
  h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';

  // Header
  h += '<tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid var(--bg3);color:var(--tx2);min-width:140px;">Miembro</th>';
  PHASE_SHORT.forEach(p => {
    h += `<th style="padding:6px 3px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;font-size:10px;min-width:40px;">${p}</th>`;
  });
  h += '<th style="padding:6px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;">Gates</th></tr>';

  // Rows
  members.forEach(m => {
    const name = m.profiles?.display_name || 'Sin nombre';
    const isMe = m.user_id === state.currentUser.id;
    const color = ROLE_COLORS[m.role] || 'var(--tx3)';
    const pd = phaseData.find(p => p.user_id === m.user_id);
    const phases = pd?.phases || [];
    const gateCount = (pd?.gate_records || []).filter(g => !g.skipped).length;

    h += `<tr style="border-bottom:1px solid var(--bg3);">`;
    h += `<td style="padding:6px 10px;"><span style="color:${isMe ? '#fff' : 'var(--tx)'};">${name}${isMe ? ' (tú)' : ''}</span> <span style="font-size:10px;color:${color};">${m.role}</span></td>`;

    PHASE_IDS.forEach(pid => {
      const fase = phases.find(f => f.id === pid);
      const estado = fase ? fase.estado : 'pendiente';
      const icon = estado === 'completado' ? '✅' : estado === 'en_progreso' ? '🔵' : estado === 'no_aplica' ? '⚪' : '○';
      h += `<td style="text-align:center;padding:6px 3px;font-size:11px;">${icon}</td>`;
    });

    h += `<td style="text-align:center;padding:6px;font-size:12px;color:var(--green);">${gateCount > 0 ? gateCount + ' ✓' : '—'}</td>`;
    h += '</tr>';
  });

  h += '</table></div></div>';
  area.innerHTML = h;
}

// ============================================================
// TEAM MEMBERS
// ============================================================

async function loadProjectMembers(projectId) {
  if (!state.sdb || !state.currentUser) return [];
  try {
    const { data, error } = await state.sdb
      .from('project_members')
      .select('role, user_id, joined_at, profiles(display_name, institution)')
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadProjectMembers error:', e);
    return [];
  }
}

// ============================================================
// INVITATIONS
// ============================================================

async function createInvitation(projectId, role) {
  if (!state.sdb || !state.currentUser) return null;
  try {
    const { data, error } = await state.sdb
      .from('project_invitations')
      .insert({ project_id: projectId, invited_by: state.currentUser.id, role: role })
      .select('token')
      .single();
    if (error) throw error;
    return window.location.origin + window.location.pathname + '?invite=' + data.token;
  } catch (e) {
    console.error('Create invitation error:', e);
    showToast('Error al crear invitación', 'error');
    return null;
  }
}

function showInviteModal(projId) {
  const proj = getProjects().find(p => p.id === projId);
  if (!proj) return;

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal" style="max-width:480px;">`;
  html += `<h3>Invitar a "${escH(proj.nombre)}"</h3>`;

  // Option 1: Add by email (existing user)
  html += `<div style="margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:8px;">`;
  html += `<div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:8px;">Agregar por email</div>`;
  html += `<div style="display:flex;gap:6px;">`;
  html += `<input id="invite-email" type="email" placeholder="email@ejemplo.com" style="flex:1;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
  html += `<select id="invite-email-role" style="padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;">`;
  html += `<option value="reviewer">Reviewer (ve y comenta)</option><option value="reader">Lector (ve y puede clonar)</option>`;
  html += `</select>`;
  html += `</div>`;
  html += `<button onclick="addMemberByEmail('${projId}')" id="invite-email-btn" class="btn bg" style="width:100%;margin-top:8px;">Agregar</button>`;
  html += `<p id="invite-email-msg" style="font-size:12px;margin-top:6px;display:none;"></p>`;
  html += `</div>`;

  // Option 2: Generate link (new or existing user)
  html += `<div style="padding:14px;background:var(--bg3);border-radius:8px;">`;
  html += `<div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:8px;">Generar link de invitación</div>`;
  html += `<div style="display:flex;gap:6px;align-items:center;">`;
  html += `<select id="invite-role" style="flex:1;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;">`;
  html += `<option value="reviewer">Reviewer (ve y comenta)</option><option value="reader">Lector (ve y puede clonar)</option>`;
  html += `</select>`;
  html += `<button id="invite-gen-btn" onclick="generateInviteLink('${projId}')" class="btn bo" style="white-space:nowrap;">Generar link</button>`;
  html += `</div>`;
  html += `<div id="invite-link-area" style="margin-top:10px;display:none;">`;
  html += `<div style="padding:12px;background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.2);border-radius:8px;">`;
  html += `<div style="font-size:13px;font-weight:600;color:var(--green);margin-bottom:10px;">✅ Link generado — completa estos pasos:</div>`;
  // Step 1: Google Drive
  html += `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:6px;">`;
  html += `<input type="checkbox" id="invite-check-drive" style="margin-top:3px;accent-color:var(--green);">`;
  html += `<div style="flex:1;">`;
  html += `<div style="font-size:13px;color:var(--tx);font-weight:600;">Compartir carpeta de fuentes en Google Drive</div>`;
  html += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Comparte la carpeta de PDFs y documentos del proyecto con el invitado en modo <b>lector</b>.</div>`;
  html += `<a href="https://drive.google.com" target="_blank" style="font-size:12px;color:var(--blue);text-decoration:underline;margin-top:4px;display:inline-block;">Abrir Google Drive →</a>`;
  html += `</div></div>`;
  // Step 2: Copy link
  html += `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px;background:var(--bg2);border-radius:6px;">`;
  html += `<input type="checkbox" id="invite-check-link" style="margin-top:3px;accent-color:var(--green);">`;
  html += `<div style="flex:1;">`;
  html += `<div style="font-size:13px;color:var(--tx);font-weight:600;">Copiar y enviar el link de invitación</div>`;
  html += `<div style="display:flex;gap:6px;margin-top:6px;">`;
  html += `<input id="invite-link" readonly style="flex:1;padding:6px 8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--green);font-family:monospace;font-size:11px;">`;
  html += `<button onclick="navigator.clipboard.writeText(document.getElementById('invite-link').value);this.textContent='✓ Copiado';document.getElementById('invite-check-link').checked=true;setTimeout(()=>this.textContent='Copiar',2000)" class="btn bg" style="white-space:nowrap;font-size:12px;">Copiar</button>`;
  html += `</div>`;
  html += `<div style="font-size:11px;color:var(--tx3);margin-top:4px;">Expira en 7 días. Funciona para usuarios nuevos y existentes.</div>`;
  html += `</div></div>`;
  html += `</div>`;
  html += `</div></div>`;

  html += `<div class="proj-modal-actions" style="margin-top:14px;">`;
  html += `<button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cerrar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('invite-email')?.focus();
}

// --- Add member by email (existing user) ---
async function addMemberByEmail(projId) {
  const email = document.getElementById('invite-email')?.value.trim();
  const role = document.getElementById('invite-email-role')?.value || 'coauthor';
  const msgEl = document.getElementById('invite-email-msg');
  const btn = document.getElementById('invite-email-btn');
  if (!email) { showInviteMsg('Ingresa un email', 'var(--red)'); return; }
  if (!state.sdb || !state.currentUser) return;

  btn.textContent = 'Buscando...'; btn.disabled = true;

  try {
    // Find user by email in auth.users via profiles (we need an RPC for this)
    const { data: profile, error } = await state.sdb
      .from('profiles')
      .select('id, display_name')
      .eq('id', (await findUserByEmail(email)))
      .single();

    if (error || !profile) {
      showInviteMsg('Usuario no encontrado. Usa el link de invitación.', 'var(--gold)');
      btn.textContent = 'Agregar'; btn.disabled = false;
      return;
    }

    // Check if already a member
    const { data: existing } = await state.sdb
      .from('project_members')
      .select('id')
      .eq('project_id', projId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existing) {
      showInviteMsg('Este usuario ya es miembro del proyecto.', 'var(--gold)');
      btn.textContent = 'Agregar'; btn.disabled = false;
      return;
    }

    // Add as member
    const { error: insertErr } = await state.sdb.from('project_members').insert({
      project_id: projId,
      user_id: profile.id,
      role: role
    });

    if (insertErr) throw insertErr;

    showInviteMsg(`✅ ${profile.display_name || email} agregado como ${role}. Recuerda compartir la carpeta de Google Drive con ${email} en modo lector.`, 'var(--green)');
    btn.textContent = 'Agregar'; btn.disabled = false;
    document.getElementById('invite-email').value = '';

    // Notify the added user
    await state.sdb.from('notifications').insert({
      user_id: profile.id,
      type: 'added_to_project',
      title: 'Te agregaron a un proyecto',
      body: (state.profile?.display_name || 'Alguien') + ' te agregó a "' + (getProjects().find(p => p.id === projId)?.nombre || 'proyecto') + '" como ' + role,
      reference_id: projId,
      reference_type: 'project'
    });

  } catch (e) {
    showInviteMsg('Error: ' + e.message, 'var(--red)');
    btn.textContent = 'Agregar'; btn.disabled = false;
  }
}

async function findUserByEmail(email) {
  // We can't query auth.users directly from client. Use RPC.
  if (!state.sdb) return null;
  try {
    const { data, error } = await state.sdb.rpc('find_user_by_email', { user_email: email });
    return data || null;
  } catch (e) { return null; }
}

function showInviteMsg(msg, color) {
  const el = document.getElementById('invite-email-msg');
  if (el) { el.textContent = msg; el.style.color = color; el.style.display = 'block'; }
}

window.addMemberByEmail = addMemberByEmail;

async function generateInviteLink(projId) {
  const role = document.getElementById('invite-role')?.value || 'coauthor';
  const btn = document.getElementById('invite-gen-btn');
  if (btn) { btn.textContent = 'Generando...'; btn.disabled = true; }

  const link = await createInvitation(projId, role);
  if (link) {
    document.getElementById('invite-link').value = link;
    document.getElementById('invite-link-area').style.display = '';
    if (btn) { btn.textContent = 'Generar link'; btn.disabled = false; }
    showToast('Link generado', 'success', 2000);
  } else {
    if (btn) { btn.textContent = 'Generar link'; btn.disabled = false; }
  }
}

// Check URL for pending invitation (called from auth.js after login)
async function checkPendingInvitation() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('invite');
  if (!token || !state.sdb || !state.currentUser) return;

  // Clear URL param immediately
  window.history.replaceState({}, '', window.location.pathname);

  showToast('Procesando invitación...', 'info', 2000);

  try {
    const { data, error } = await state.sdb.rpc('accept_invitation', { invite_token: token });
    if (error) throw error;

    if (data?.success) {
      showToast(`Te uniste a "${data.project_title}" como ${data.role}`, 'success', 4000);
      await loadProjects();
      buildProjectSidebar();
      goToProject(data.project_id);
    } else {
      showToast(data?.error || 'Invitación no válida', 'error', 4000);
    }
  } catch (e) {
    console.error('Accept invitation error:', e);
    showToast('Error al aceptar invitación', 'error');
  }
}

window.showInviteModal = showInviteModal;
window.generateInviteLink = generateInviteLink;

// Export for auth.js
export { checkPendingInvitation };

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
window.cyclePhaseStatus = cyclePhaseStatus;
window.getActivePhase = getActivePhase;
window.advancePhase = advancePhase;
window.doAdvancePhase = doAdvancePhase;
window.showGateModal = showGateModal;
window.completeGate = completeGate;
window.skipGate = skipGate;
window.revertPhase = revertPhase;
window.editPhaseField = editPhaseField;
window.addProjectLink = addProjectLink;
window.removeProjectLink = removeProjectLink;
window.showLogbookModal = showLogbookModal;
window.addLbLink = addLbLink;
window.saveLogbookEntry = saveLogbookEntry;
window.removeLogbookEntry = removeLogbookEntry;
window.editLogbookEntry = editLogbookEntry;
window.saveEditLogbookEntry = saveEditLogbookEntry;
window.addLogbookLink = addLogbookLink;
window.removeLogbookLink = removeLogbookLink;
window.showPromptLogModal = showPromptLogModal;
window.savePromptLog = savePromptLog;
window.removePromptLog = removePromptLog;
window.addProjectResource = addProjectResource;
window.removeProjectResource = removeProjectResource;
window.addDecision = addDecision;
window.removeDecision = removeDecision;
window.promoteInsightToDecision = promoteInsightToDecision;
window.toggleChecklistItem = toggleChecklistItem;
window.addChecklistItem = addChecklistItem;
window.removeChecklistItem = removeChecklistItem;
window.toggleWizardStep = toggleWizardStep;
window.addWizardTask = addWizardTask;
window.toggleCustomWizardTask = toggleCustomWizardTask;
window.removeCustomWizardTask = removeCustomWizardTask;
window.generateProjectStructure = generateProjectStructure;
window.toggleDrMode = toggleDrMode;
window.setWorkflowMode = setWorkflowMode;
window.toggleDrWizardStep = toggleDrWizardStep;
window.cycleDrPhaseStatus = cycleDrPhaseStatus;
window.advanceDrPhase = advanceDrPhase;
window.completeDrGate = completeDrGate;
window.skipDrGate = skipDrGate;
window.downloadDrSkill = downloadDrSkill;
window.saveDrOutput = saveDrOutput;
window.resolveDrAlertUI = resolveDrAlertUI;
window.addArtifact = addArtifact;
window.removeArtifact = removeArtifact;
window.addArtifactLink = addArtifactLink;
window.showArtifactModal = showArtifactModal;
window.submitArtifact = submitArtifact;
window.generatePortfolio = generatePortfolio;
window.forkBranch = forkBranch;
window.switchBranch = switchBranch;
window.setBranchStatus = setBranchStatus;
window.deleteBranch = deleteBranch;
window.addBranchNote = addBranchNote;
window.freezeBranch = freezeBranch;
window.removeMember = removeMember;
window.cloneProject = cloneProject;
window.generateDrReport = generateDrReport;
window.saveCloPath = saveCloPath;
window.toggleCloWizardStep = toggleCloWizardStep;
window.cycleCloPhaseStatus = cycleCloPhaseStatus;
window.advanceCloPhase = advanceCloPhase;
window.saveCloOutput = saveCloOutput;
window.addQuestionEntry = addQuestionEntry;
window.removeQuestionEntry = removeQuestionEntry;
window.toggleProjFilter = toggleProjFilter;
window.exportClaims = exportClaims;
window.exportClaimsFile = exportClaimsFile;

// ============================================================
// Exports
// ============================================================
export {
  buildProjectSidebar,
  renderProjectDash,
  renderMiTesis,
  getProjectsForArticle,
  getProjectsForDoc,
  renderProjectBadges,
  renderProjectsSummary,
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
  renderPipeline,
  toggleProjFilter,
  createProject,
  editProject,
  deleteProject,
  exportClaims,
  exportClaimsFile,
  buildClaimsText,
  getActivePhase
};
