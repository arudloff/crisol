// ============================================================
// CRISOL — kanban.js  (Kanban board module)
// Extracted from SILA v4 monolith · task management
// ============================================================

import { state } from './state.js';
import { syncKanbanToCloud } from './sync.js';
import { showToast, getProjects, updateTopbar, closeSidebarMobile, ensureToolsOpen, escH, linkify } from './utils.js';
import { userKey } from './storage.js';

// --------------- data accessors ---------------
export function getKanban() {
  try { return JSON.parse(localStorage.getItem(userKey('sila_kanban'))) || []; }
  catch (e) { return []; }
}

export function saveKanban(items) {
  try {
    localStorage.setItem(userKey('sila_kanban'), JSON.stringify(items));
    localStorage.setItem(userKey('sila_kanban_ts'), String(Date.now()));
  } catch (e) {
    console.error('Kanban save error:', e);
    showToast('Error al guardar tareas', 'error');
  }
  syncKanbanToCloud(items);
}

// --------------- helpers ---------------
export function kanbanDeadlineInfo(deadline) {
  if (!deadline) return { label: 'Sin fecha', cls: 'ok' };
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + 'T12:00:00');
  const diff = Math.round((dl - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Vencida ' + Math.abs(diff) + 'd', cls: 'overdue' };
  if (diff === 0) return { label: 'Hoy', cls: 'overdue' };
  if (diff < 3) return { label: 'En ' + diff + 'd', cls: 'overdue' };
  if (diff < 7) return { label: 'En ' + diff + 'd', cls: 'soon' };
  return { label: 'En ' + diff + 'd', cls: 'ok' };
}

// --------------- rendering ---------------
export function renderKanbanCard(item) {
  const dl = kanbanDeadlineInfo(item.deadline);
  const projects = getProjects();
  const proj = item.projectId ? projects.find(p => p.id === item.projectId) : null;
  let h = `<div class="kb-card${item.priority ? ' priority' : ''}" draggable="true" data-kb-id="${item.id}" ondragstart="kbDragStart(event)" ondragend="kbDragEnd(event)">`;
  h += `<div class="kb-title">${escH(item.title)}</div>`;
  if (item.nota) {
    const notaHtml = linkify(item.nota);
    h += `<div style="font-size:12px;color:var(--tx3);line-height:1.5;margin:3px 0;word-break:break-word;">${notaHtml}</div>`;
  }
  h += `<div class="kb-meta"><span class="kb-deadline ${dl.cls}">${dl.label}</span></div>`;
  if (proj) h += `<div class="kb-proj">${escH(proj.nombre)}</div>`;
  h += `<div class="kb-actions">`;
  h += `<button onclick="editKanbanTask('${item.id}')">✎</button>`;
  h += `<button onclick="deleteKanbanTask('${item.id}')">✕</button>`;
  h += `</div></div>`;
  return h;
}

export function renderKanban() {
  const items = getKanban();
  const cols = { todo: [], doing: [], done: [] };
  items.forEach(it => { if (cols[it.column]) cols[it.column].push(it); });
  // Sort by deadline
  Object.values(cols).forEach(arr => arr.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0; if (!a.deadline) return 1; if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  }));
  const colMeta = [
    { key: 'todo', label: 'Por hacer', items: cols.todo },
    { key: 'doing', label: 'En progreso', items: cols.doing },
    { key: 'done', label: 'Hecho', items: cols.done }
  ];
  let h = getBreadcrumb() + `<h2 style="font-size:clamp(17px,2.5vw,24px);font-weight:800;color:#fff;margin-bottom:6px;">Tablero Kanban</h2>`;
  h += `<p style="font-size:15px;color:var(--tx2);margin-bottom:10px;">${items.length} tarea${items.length !== 1 ? 's' : ''}</p>`;
  h += `<div class="kb-board">`;
  colMeta.forEach(col => {
    h += `<div class="kb-col" data-kb-col="${col.key}" ondragover="kbDragOver(event)" ondrop="kbDrop(event)">`;
    h += `<div class="kb-col-head">${col.label} <span class="bdg">${col.items.length}</span></div>`;
    col.items.forEach(it => { h += renderKanbanCard(it); });
    if (col.key === 'todo') h += `<button style="width:100%;padding:8px;border:1px dashed rgba(220,215,205,0.12);border-radius:7px;background:transparent;color:var(--tx3);cursor:pointer;font-size:13px;margin-top:6px;" onclick="addKanbanTask()">+ Nueva tarea</button>`;
    h += `</div>`;
  });
  h += `</div>`;
  ct.innerHTML = h;
}

export function renderKanbanInline() {
  const items = getKanban();
  const cols = { todo: [], doing: [], done: [] };
  items.forEach(it => cols[it.column || 'todo'].push(it));
  const projects = getProjects();
  let h = '<div class="kb-board">';
  [{ key: 'todo', label: 'Por hacer', color: 'var(--tx2)' }, { key: 'doing', label: 'En progreso', color: 'var(--gold)' }, { key: 'done', label: 'Hecho', color: 'var(--green)' }].forEach(c => {
    h += `<div class="kb-col" ondragover="event.preventDefault()" ondrop="kbDrop(event,'${c.key}')">`;
    h += `<div class="kb-col-head"><span style="color:${c.color};">${c.label}</span><span class="bdg">${cols[c.key].length}</span></div>`;
    cols[c.key].forEach(it => {
      const dl = kanbanDeadlineInfo(it.deadline);
      const proj = it.projectId ? projects.find(p => p.id === it.projectId) : null;
      h += `<div class="kb-card${it.priority ? ' priority' : ''}" draggable="true" data-kb-id="${it.id}" ondragstart="kbDragStart(event)" ondragend="kbDragEnd(event)">`;
      h += `<div class="kb-title">${escH(it.title)}</div>`;
      h += `<div class="kb-meta">`;
      if (it.deadline) h += `<span class="kb-deadline ${dl.cls}">${dl.label}</span>`;
      h += `</div>`;
      if (proj) h += `<span class="kb-proj">${proj.nombre}</span>`;
      h += `<div class="kb-actions"><button onclick="editKanbanTask('${it.id}')">✏</button><button onclick="deleteKanbanTask('${it.id}')">✕</button></div>`;
      h += `</div>`;
    });
    if (c.key === 'todo') h += `<div style="text-align:center;padding:8px;"><button class="btn bo" onclick="addKanbanTask()" style="font-size:12px;width:100%;">+ Nueva tarea</button></div>`;
    h += `</div>`;
  });
  h += '</div>';
  return h;
}

export function renderKanbanForProject(projId) {
  const items = getKanban().filter(it => it.projectId === projId);
  if (items.length === 0) {
    return `<div style="padding:12px 16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Sin tareas asignadas a este proyecto. <a href="#" onclick="event.preventDefault();addKanbanTaskForProject('${projId}')" style="color:var(--gold);">Crear tarea</a></div>`;
  }
  const cols = { todo: [], doing: [], done: [] };
  items.forEach(it => cols[it.column || 'todo'].push(it));
  Object.values(cols).forEach(arr => arr.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0; if (!a.deadline) return 1; if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  }));
  let h = '<div class="kb-board" style="grid-template-columns:1fr 1fr 1fr;gap:8px;">';
  [{ key: 'todo', label: 'Por hacer', color: 'var(--tx2)' }, { key: 'doing', label: 'En progreso', color: 'var(--gold)' }, { key: 'done', label: 'Hecho', color: 'var(--green)' }].forEach(c => {
    h += `<div class="kb-col" data-kb-col="${c.key}" ondragover="kbDragOver(event)" ondrop="kbDrop(event)">`;
    h += `<div class="kb-col-head" style="font-size:12px;padding:6px 8px;"><span style="color:${c.color};">${c.label}</span><span class="bdg">${cols[c.key].length}</span></div>`;
    cols[c.key].forEach(it => {
      const dl = kanbanDeadlineInfo(it.deadline);
      h += `<div class="kb-card${it.priority ? ' priority' : ''}" draggable="true" data-kb-id="${it.id}" ondragstart="kbDragStart(event)" ondragend="kbDragEnd(event)" style="padding:8px 10px;">`;
      h += `<div class="kb-title" style="font-size:13px;">${it.title}</div>`;
      if (it.nota) {
        const notaH = linkify(it.nota);
        h += `<div style="font-size:11px;color:var(--tx3);line-height:1.4;margin:2px 0;word-break:break-word;">${notaH}</div>`;
      }
      if (it.deadline) h += `<div class="kb-meta"><span class="kb-deadline ${dl.cls}" style="font-size:11px;">${dl.label}</span></div>`;
      h += `<div class="kb-actions"><button onclick="editKanbanTask('${it.id}')" style="font-size:11px;">✎</button><button onclick="deleteKanbanTask('${it.id}')" style="font-size:11px;">✕</button></div>`;
      h += `</div>`;
    });
    if (c.key === 'todo') h += `<button style="width:100%;padding:6px;border:1px dashed rgba(220,215,205,0.1);border-radius:6px;background:transparent;color:var(--tx3);cursor:pointer;font-size:12px;margin-top:4px;" onclick="addKanbanTaskForProject('${projId}')">+ Tarea</button>`;
    h += `</div>`;
  });
  h += '</div>';
  return h;
}

export function renderKanbanCompact() {
  const items = getKanban().filter(it => it.column !== 'done');
  // Sort by deadline urgency
  items.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0; if (!a.deadline) return 1; if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
  const urgent = items.slice(0, 5);
  if (urgent.length === 0) return `<p style="font-size:13px;color:var(--tx3);padding:4px 0;">No hay tareas pendientes. <a href="#" onclick="goKanban();return false;" style="color:var(--gold);">Crear una</a></p>`;
  let h = '';
  urgent.forEach(it => {
    const dl = kanbanDeadlineInfo(it.deadline);
    const colLabel = it.column === 'doing' ? '▶ ' : '';
    h += `<div style="display:flex;align-items:center;gap:10px;padding:6px 12px;background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:7px;margin:4px 0;cursor:pointer;" onclick="goKanban()">`;
    h += `<span class="kb-deadline ${dl.cls}" style="font-size:12px;font-weight:600;min-width:60px;">${dl.label}</span>`;
    h += `<span style="font-size:14px;color:var(--tx);">${colLabel}${it.title}</span>`;
    h += `</div>`;
  });
  if (items.length > 5) h += `<div style="font-size:13px;color:var(--tx3);padding:4px 8px;">... y ${items.length - 5} m&aacute;s</div>`;
  h += `<a href="#" onclick="goKanban();return false;" style="font-size:13px;color:var(--gold);display:inline-block;margin-top:6px;">Ver tablero completo →</a>`;
  return h;
}

// --------------- drag & drop ---------------
let kbDragId = null;

window.kbDragStart = function(e) {
  kbDragId = e.target.closest('.kb-card').dataset.kbId;
  e.target.closest('.kb-card').classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
};
window.kbDragEnd = function(e) {
  e.target.closest('.kb-card')?.classList.remove('dragging');
  kbDragId = null;
};
window.kbDragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
window.kbDrop = function(e, colArg) {
  e.preventDefault();
  if (!kbDragId) return;
  const col = colArg || e.target.closest('.kb-col')?.dataset?.kbCol;
  if (!col) return;
  const items = getKanban();
  const item = items.find(i => i.id === kbDragId);
  if (item) {
    item.column = col;
    item.updated = new Date().toISOString();
    saveKanban(items);
    if (state.currentProjectId) {
      if (state._renderProjectDash) state._renderProjectDash(state.currentProjectId);
    } else if (state.isHome) {
      if (window.renderGlobalDash) window.renderGlobalDash();
    } else {
      renderKanban();
    }
  }
  kbDragId = null;
};

// --------------- task modal ---------------
window.showKanbanTaskModal = function(editId, presetProjectId) {
  const items = getKanban();
  const existing = editId ? items.find(i => i.id === editId) : null;
  if (editId && !existing) { showToast('Tarea no encontrada', 'error', 2000); return; }
  const projects = getProjects();

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="logbook-modal" style="max-width:440px;">`;
  html += `<h3>${existing ? '✎ Editar tarea' : '+ Nueva tarea'}</h3>`;

  html += `<label>Título *</label>`;
  html += `<div style="display:flex;gap:6px;align-items:center;">`;
  html += `<input id="kb-title" value="${existing ? escH(existing.title) : ''}" placeholder="¿Qué necesitas hacer?" style="flex:1;">`;
  html += `<button onclick="toggleDictation(this,'kb-title')" title="Dictar" style="background:var(--bg3);border:1px solid rgba(220,215,205,0.15);border-radius:6px;cursor:pointer;font-size:14px;padding:6px 8px;flex-shrink:0;">🎤</button>`;
  html += `</div>`;

  html += `<label>Nota <span style="font-weight:400;color:var(--tx3);">(opcional — comentario, link, detalle)</span></label>`;
  html += `<div style="display:flex;gap:6px;align-items:flex-start;">`;
  html += `<textarea id="kb-nota" placeholder="Ej: Revisar sección 3, ver https://..." style="min-height:50px;flex:1;">${existing && existing.nota ? escH(existing.nota) : ''}</textarea>`;
  html += `<button onclick="toggleDictation(this,'kb-nota')" title="Dictar" style="background:var(--bg3);border:1px solid rgba(220,215,205,0.15);border-radius:6px;cursor:pointer;font-size:14px;padding:6px 8px;flex-shrink:0;margin-top:2px;">🎤</button>`;
  html += `</div>`;

  const isPriority = existing ? !!existing.priority : false;
  html += `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:8px 0;">`;
  html += `<input type="checkbox" id="kb-priority" ${isPriority ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--red);cursor:pointer;">`;
  html += `<span style="color:${isPriority ? 'var(--red)' : 'var(--tx2)'};font-weight:${isPriority ? '600' : '400'};">🔴 Prioritario</span></label>`;

  html += `<label>Deadline <span style="font-weight:400;color:var(--tx3);">(opcional)</span></label>`;
  html += `<input type="date" id="kb-deadline" value="${existing && existing.deadline ? existing.deadline : ''}" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;">`;

  html += `<label>Proyecto <span style="font-weight:400;color:var(--tx3);">(opcional)</span></label>`;
  const selProjId = existing ? existing.projectId : presetProjectId || '';
  html += `<select id="kb-project" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
  html += `<option value="">— Sin proyecto —</option>`;
  projects.forEach(p => {
    html += `<option value="${p.id}"${p.id === selProjId ? ' selected' : ''}>${p.nombre}</option>`;
  });
  html += `</select>`;

  if (existing) {
    html += `<label>Estado</label>`;
    html += `<select id="kb-column" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
    ['todo', 'doing', 'done'].forEach(c => {
      const labels = { todo: 'Por hacer', doing: 'En progreso', done: 'Hecho' };
      html += `<option value="${c}"${existing.column === c ? ' selected' : ''}>${labels[c]}</option>`;
    });
    html += `</select>`;
  }

  html += `<div class="lb-actions">`;
  html += `<button onclick="this.closest('.proj-modal-overlay').remove()" style="background:var(--bg3);color:var(--tx2);">Cancelar</button>`;
  html += `<button onclick="saveKanbanTaskModal('${editId || ''}')" style="background:var(--gold);color:#000;font-weight:600;">${existing ? 'Guardar' : 'Crear'}</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('kb-title').focus();
};

window.saveKanbanTaskModal = function(editId) {
  const title = document.getElementById('kb-title').value.trim();
  if (!title) { alert('El título es obligatorio.'); return; }
  const nota = document.getElementById('kb-nota').value.trim() || null;
  const deadline = document.getElementById('kb-deadline').value || null;
  const projectId = document.getElementById('kb-project').value || null;
  const priority = document.getElementById('kb-priority')?.checked || false;
  const columnEl = document.getElementById('kb-column');
  const column = columnEl ? columnEl.value : 'todo';

  const items = getKanban();
  if (editId) {
    const item = items.find(i => i.id === editId);
    if (item) {
      item.title = title;
      item.nota = nota;
      item.deadline = deadline;
      item.projectId = projectId;
      item.priority = priority;
      item.column = column;
      item.updated = new Date().toISOString();
    }
  } else {
    items.push({ id: 'kb_' + Date.now(), title: title, nota: nota, column: 'todo', deadline: deadline, projectId: projectId, priority: priority, created: new Date().toISOString(), updated: new Date().toISOString() });
  }
  saveKanban(items);
  const _ov = document.querySelector('.proj-modal-overlay'); if (_ov) _ov.remove();
  if (state.currentProjectId) { if (state._renderProjectDash) state._renderProjectDash(state.currentProjectId); }
  else if (state.isHome) { if (window.renderGlobalDash) window.renderGlobalDash(); }
  else { renderKanban(); }
};

// Legacy wrappers
window.addKanbanTask = function() { showKanbanTaskModal(null, null); };
window.editKanbanTask = function(id) { showKanbanTaskModal(id, null); };
window.addKanbanTaskForProject = function(projId) { showKanbanTaskModal(null, projId); };

window.deleteKanbanTask = function(id) {
  if (!confirm('¿Eliminar esta tarea?')) return;
  const items = getKanban().filter(i => i.id !== id);
  saveKanban(items);
  if (state.currentProjectId) { if (state._renderProjectDash) state._renderProjectDash(state.currentProjectId); }
  else if (state.isHome) { if (window.renderGlobalDash) window.renderGlobalDash(); }
  else { renderKanban(); }
};

window.goKanban = function() {
  if (state._saveNavState) state._saveNavState();
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; state._isPrisma = false; state._isAtlas = false;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  const kbEl = document.getElementById('s-kanban'); if (kbEl) kbEl.classList.add('active');
  updateTopbar();
  renderKanban();
  closeSidebarMobile();
};
