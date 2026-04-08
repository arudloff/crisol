// ============================================================
// CRISOL — projects-clo.js
// CLO-Author workflow functions
// ============================================================

import { state } from './state.js';
import { showToast } from './utils.js';
import { getProjects, saveProjects } from './projects-core.js';

// Config fallbacks (loaded from data/wizard_config.js as globals)
function _getCloFases() {
  return (typeof CLO_FASES !== 'undefined') ? CLO_FASES : [];
}
function _getCloWizardTasks() {
  return (typeof CLO_WIZARD_TASKS !== 'undefined') ? CLO_WIZARD_TASKS : {};
}
function _getCloPhaseGates() {
  return (typeof CLO_PHASE_GATES !== 'undefined') ? CLO_PHASE_GATES : {};
}

function saveCloPath(projId) {
  const input = document.getElementById('clo-path-input');
  if (!input || !input.value.trim()) { showToast('Ingresa una ruta', 'error'); return; }
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.cloProjectPath = input.value.trim().replace(/\\/g, '/');
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function cycleCloPhaseStatus(projId, fi) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.cloFases) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.cloFases[fi].estado);
  proj.cloFases[fi].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
    if (state._renderProjectDash) state._renderProjectDash(projId);
    setTimeout(() => { const el = document.getElementById('clo-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
    return;
  }
  proj.cloFases[currentIdx].estado = 'completado';
  const nextIdx = proj.cloFases.findIndex((f, i) => i > currentIdx && f.estado === 'pendiente');
  if (nextIdx !== -1) { proj.cloFases[nextIdx].estado = 'en_progreso'; }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) setTimeout(() => state._renderProjectDash(projId), 150);
}

// Window globals for inline onclick
window.saveCloPath = saveCloPath;
window.toggleCloWizardStep = toggleCloWizardStep;
window.cycleCloPhaseStatus = cycleCloPhaseStatus;
window.advanceCloPhase = advanceCloPhase;
window.saveCloOutput = saveCloOutput;

// Exports for use by render module
export { _getCloFases, _getCloWizardTasks, _getCloPhaseGates, saveCloPath, toggleCloWizardStep, cycleCloPhaseStatus, advanceCloPhase, saveCloOutput };
