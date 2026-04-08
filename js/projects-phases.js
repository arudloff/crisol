// ============================================================
// CRISOL — projects-phases.js
// Phase system, gates, checklist, wizard tasks
// Extracted from projects.js (Sprint 7c, Paso 6)
// ============================================================

import { state, DEFAULT_FASES, PHASE_GATES } from './state.js';
import { showToast } from './utils.js';
import { getProjects, saveProjects } from './projects-core.js';
import { notifyTeam } from './projects-team.js';

// Config fallback
function _getDefaultChecklist() {
  return (typeof DEFAULT_CHECKLIST !== 'undefined') ? DEFAULT_CHECKLIST : [];
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
    if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
    if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeProjectLink(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.links) return;
  proj.links.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeChecklistItem(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.checklist) return;
  proj.checklist.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function toggleCustomWizardTask(projId, phaseId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (!proj.wizardCustomTasks?.[phaseId]?.[idx]) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.wizardCustomTasks[phaseId][idx].estado || 'pendiente');
  proj.wizardCustomTasks[phaseId][idx].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeCustomWizardTask(projId, phaseId, idx) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.wizardCustomTasks[phaseId].splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

// Window globals for inline onclick
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
window.toggleChecklistItem = toggleChecklistItem;
window.addChecklistItem = addChecklistItem;
window.removeChecklistItem = removeChecklistItem;
window.toggleWizardStep = toggleWizardStep;
window.addWizardTask = addWizardTask;
window.toggleCustomWizardTask = toggleCustomWizardTask;
window.removeCustomWizardTask = removeCustomWizardTask;

export {
  cyclePhaseStatus,
  getActivePhase,
  getGateForPhase,
  advancePhase,
  doAdvancePhase,
  showGateModal,
  completeGate,
  skipGate,
  revertPhase,
  editPhaseField,
  addProjectLink,
  removeProjectLink,
  toggleChecklistItem,
  addChecklistItem,
  removeChecklistItem,
  toggleWizardStep,
  renderWizardTask,
  addWizardTask,
  toggleCustomWizardTask,
  removeCustomWizardTask
};
