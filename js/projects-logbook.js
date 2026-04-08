// ============================================================
// CRISOL — projects-logbook.js
// Bitácora, prompt log, recursos fijos y decisiones
// Extracted from projects.js (Sprint 7c, Paso 5)
// ============================================================

import { state, LOGBOOK_TYPES } from './state.js';
import { showToast } from './utils.js';
import { getDocs } from './editor.js';
import { getProjects, saveProjects } from './projects-core.js';

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

  const activePhaseObj = state._getActivePhase ? state._getActivePhase(proj) : null;
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('Sesión registrada', 'success', 2000);
}

function removeLogbookEntry(projId, entryId) {
  if (!confirm('¿Eliminar esta entrada de la bitácora?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  proj.bitacora = proj.bitacora.filter(e => e.id !== entryId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeLogbookLink(projId, entryId, linkIdx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.bitacora) return;
  const entry = proj.bitacora.find(e => e.id === entryId); if (!entry || !entry.links) return;
  entry.links.splice(linkIdx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('Prompt registrado', 'success', 2000);
}

function removePromptLog(projId, plId) {
  if (!confirm('¿Eliminar este registro de prompt?')) return;
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.promptLog) return;
  proj.promptLog = proj.promptLog.filter(p => p.id !== plId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeProjectResource(projId, idx) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.recursos) return;
  proj.recursos.splice(idx, 1);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
}

function removeDecision(projId, decId) {
  const projects = getProjects(); const proj = projects.find(p => p.id === projId); if (!proj || !proj.decisiones) return;
  proj.decisiones = proj.decisiones.filter(d => d.id !== decId);
  proj.updated = new Date().toISOString();
  saveProjects(projects);
  if (state._renderProjectDash) state._renderProjectDash(projId);
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
  if (state._renderProjectDash) state._renderProjectDash(projId);
  showToast('Insight promovido a decisión', 'success', 2000);
}

// Window globals for inline onclick
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

export {
  showLogbookModal,
  addLbLink,
  saveLogbookEntry,
  removeLogbookEntry,
  editLogbookEntry,
  saveEditLogbookEntry,
  addLogbookLink,
  removeLogbookLink,
  showPromptLogModal,
  savePromptLog,
  removePromptLog,
  addProjectResource,
  removeProjectResource,
  addDecision,
  removeDecision,
  promoteInsightToDecision
};
