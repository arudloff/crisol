// ============================================================
// CRISOL — projects-dr.js
// DR mode: branches, artifacts, phases, gates, questions, skills
// Extracted from projects.js (Sprint 7c, Paso 7)
// ============================================================

import { state } from './state.js';
import { showToast, escH } from './utils.js';
import { getProjects, saveProjects } from './projects-core.js';
import { loadDrAlerts, writeSocraticEntry, syncWizardContext, resolveDrAlert } from './sync.js';
import { _getCloFases } from './projects-clo.js';

// Config fallbacks (read from window globals set by data/wizard_config.js)
function _getDrFases() {
  return (typeof DR_FASES !== 'undefined') ? DR_FASES : [];
}
function _getDrPhaseGates() {
  return (typeof DR_PHASE_GATES !== 'undefined') ? DR_PHASE_GATES : {};
}
function _getDrSkillFiles() {
  return (typeof DR_SKILL_FILES !== 'undefined') ? DR_SKILL_FILES : {};
}
function _getDrWizardTasks() {
  return (typeof DR_WIZARD_TASKS !== 'undefined') ? DR_WIZARD_TASKS : {};
}
function _getArtifactTags() {
  return (typeof ARTIFACT_TAGS !== 'undefined') ? ARTIFACT_TAGS : [];
}

// ============================================================
// ARTIFACTS — Registry with transversal tags
// ============================================================

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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeArtifact(projId, artifactId) {
  if (!confirm('¿Eliminar este artefacto?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  proj.drArtifacts = (proj.drArtifacts || []).filter(a => a.id !== artifactId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  newFases.forEach((f, i) => {
    if (i > forkIdx) f.estado = 'pendiente';
    else if (i === forkIdx) f.estado = 'en_progreso';
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);

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

  if (branchId === 'main' && newStatus === 'discarded') {
    showToast('La rama principal no se puede descartar', 'error');
    return;
  }

  branch.status = newStatus;

  if (!branch.notes) branch.notes = [];
  const statusLabels = { active: 'En curso', paused: 'En espera', discarded: 'Descartada', completed: 'Completada' };
  branch.notes.push({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    text: '→ Estado cambió a: ' + (statusLabels[newStatus] || newStatus)
  });

  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('📌 Nota agregada a rama', 'success');
}

function freezeBranch(projId, branchId) {
  const label = prompt('Etiqueta de congelamiento (ej: "Presentación comité marzo", "Avance tutor"):');
  if (!label || !label.trim()) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  const branch = (proj.drBranches || []).find(b => b.id === branchId);
  if (!branch) return;
  if (!branch.frozen) branch.frozen = [];
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('🧊 Rama congelada: ' + label.trim() + ' (el trabajo puede continuar)', 'success');
}

function deleteBranch(projId, branchId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (branchId === 'main') { showToast('No se puede eliminar la rama principal', 'error'); return; }
  const hasChildren = (proj.drBranches || []).some(b => b.forkedFrom === branchId);
  if (hasChildren) { showToast('Esta rama tiene sub-ramas. Solo se puede archivar, no eliminar.', 'error'); return; }
  if (!confirm('¿Eliminar rama "' + ((proj.drBranches || []).find(b => b.id === branchId)?.name || branchId) + '"? Esta acción no se puede deshacer.')) return;
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
  proj.drBranches = (proj.drBranches || []).filter(b => b.id !== branchId);
  if (proj.drBranchData) delete proj.drBranchData[branchId];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('🗑 Rama eliminada', 'success');
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
    h += `<div style="font-size:13px;font-weight:600;color:${colors[a.type]};">${a.type === 'block' ? 'BLOQUEADO' : a.type === 'warning' ? 'ALERTA' : 'INFO'} — ${escH(a.code || '')}</div>`;
    h += `<div style="font-size:13px;color:var(--tx2);">${escH(a.message)}</div>`;
    if (a.detail) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">${escH(a.detail)}</div>`;
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
  if (trimmed === prev) return;
  if (trimmed) {
    proj.drOutputs[phaseId][stepIdx] = trimmed;
  } else {
    delete proj.drOutputs[phaseId][stepIdx];
  }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  showToast('📤 Resultado guardado', 'success');
  setTimeout(() => { if (state._renderProjectDash) state._renderProjectDash(projId); }, 150);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function setWorkflowMode(projId, mode) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj) return;
  if (proj.workflowMode === mode) { proj.workflowMode = 'default'; proj.drMode = false; }
  else { proj.workflowMode = mode; proj.drMode = (mode === 'dr' || mode === 'mixed'); }

  if ((mode === 'dr' || mode === 'mixed') && (!proj.drFases || proj.drFases.length === 0)) {
    proj.drFases = JSON.parse(JSON.stringify(_getDrFases()));
  }
  if ((mode === 'clo' || mode === 'mixed') && (!proj.cloFases || proj.cloFases.length === 0)) {
    proj.cloFases = JSON.parse(JSON.stringify(_getCloFases()));
  }
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
  const labels = { dr: '🧬 Modo /dr activado', clo: '🔬 Modo clo-author activado', mixed: '🔗 Modo mixto activado', default: 'Workflow estándar' };
  showToast(labels[proj.workflowMode] || labels.default, 'success');
}

function toggleDrMode(projId) { setWorkflowMode(projId, 'dr'); }

function cycleDrPhaseStatus(projId, fi) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.drFases) return;
  const states = ['pendiente', 'en_progreso', 'completado', 'no_aplica'];
  const cur = states.indexOf(proj.drFases[fi].estado);
  proj.drFases[fi].estado = states[(cur + 1) % states.length];
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
    if (state._renderProjectDash) state._renderProjectDash(projId);
    setTimeout(() => { const el = document.getElementById('dr-wizard-guide'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
    return;
  }
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
        return;
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

  if (Object.keys(socraticResponses).length > 0) {
    const drGates2 = _getDrPhaseGates();
    const gatePhase = drGates2[gateKey]?.trigger?.[0] || gateKey;
    writeSocraticEntry(projId, {
      phase: gatePhase,
      skill: 'gate_' + gateKey,
      questions: (drGates2[gateKey]?.socratic || []).map(s => ({ q: s.label, type: 'gate' })),
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeQuestionEntry(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.preguntaLog) return;
  proj.preguntaLog.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

// Window globals for inline onclick
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
window.forkBranch = forkBranch;
window.switchBranch = switchBranch;
window.setBranchStatus = setBranchStatus;
window.deleteBranch = deleteBranch;
window.addBranchNote = addBranchNote;
window.freezeBranch = freezeBranch;
window.addQuestionEntry = addQuestionEntry;
window.removeQuestionEntry = removeQuestionEntry;

export {
  _getDrFases,
  _getDrWizardTasks,
  _getDrPhaseGates,
  _getDrSkillFiles,
  _getArtifactTags,
  migrateDrFases,
  initBranches,
  loadAndRenderDrAlerts,
  toggleDrMode,
  setWorkflowMode,
  toggleDrWizardStep,
  cycleDrPhaseStatus,
  advanceDrPhase,
  saveDrOutput,
  downloadDrSkill,
  addQuestionEntry,
  removeQuestionEntry,
  addArtifact,
  forkBranch,
  switchBranch
};
