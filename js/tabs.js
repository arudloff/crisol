// ============================================================
// CRISOL — tabs.js  (Workspace tabs — multi-tab navigation)
// Extracted from SILA v4 monolith · tabs module
// ============================================================

import { state } from './state.js';
import {
  updateTopbar, buildSidebar, buildDocSidebar, buildProjectSidebar,
  loadArticle, initArticleData, showToast, getProjects,
  renderProjectDash, renderMiTesis
} from './utils.js';
import { getDocs, renderDocEditor } from './editor.js';
import { renderGlobalDash } from './dashboard.js';
import { getKanban, saveKanban } from './kanban.js';

// ============================================================
// CONSTANTS
// ============================================================
const MAX_TABS = 4;

// ============================================================
// TAB STATE CRUD
// ============================================================
export function getWsTabs() {
  try { const raw = localStorage.getItem('sila_tabs'); if (raw) return JSON.parse(raw); } catch (e) { /* storage error */ }
  return { tabs: [{ id: 't_' + Date.now(), label: 'Vista general', type: 'home' }], activeIdx: 0 };
}

export function saveWsTabs(wsState) {
  localStorage.setItem('sila_tabs', JSON.stringify(wsState));
}

// ============================================================
// CAPTURE / RESTORE TAB STATE
// ============================================================
export function captureTabState() {
  const ct = document.getElementById('ct');
  const tabState = { scrollTop: ct.scrollTop };
  if (state.isHome) { tabState.type = 'home'; tabState.label = 'Vista general'; }
  else if (state.isMiTesis) { tabState.type = 'mitesis'; tabState.label = 'Mi tesis'; }
  else if (state.currentDocId) {
    tabState.type = 'doc'; tabState.docId = state.currentDocId;
    const docs = getDocs(); const doc = docs.find(d => d.id === state.currentDocId);
    tabState.label = doc ? doc.title : 'Documento';
  }
  else if (state.currentProjectId) {
    tabState.type = 'project'; tabState.projectId = state.currentProjectId;
    const projs = getProjects(); const p = projs.find(p => p.id === state.currentProjectId);
    tabState.label = p ? p.nombre : 'Proyecto';
  }
  else if (state.DATA) {
    tabState.type = 'article'; tabState.articleKey = state.currentArticleKey;
    tabState.panel = state.currentPanel; tabState.subSec = state.currentSubSec;
    tabState.openPar = state.lastOpenPar;
    tabState.label = state.DATA.meta.authors + ' (' + state.DATA.meta.year + ')';
  }
  else { tabState.type = 'home'; tabState.label = 'Vista general'; }
  return tabState;
}

export function restoreTabState(tab) {
  const ct = document.getElementById('ct');
  if (tab.type === 'home') {
    state.isHome = true; state.isMiTesis = false; state.currentDocId = null; state._isPrisma = false; state.currentProjectId = null;
    updateTopbar(); renderGlobalDash();
  } else if (tab.type === 'mitesis') {
    state.isHome = false; state.isMiTesis = true; state.currentDocId = null; state.currentProjectId = null;
    updateTopbar(); renderMiTesis();
  } else if (tab.type === 'doc') {
    state.isHome = false; state.isMiTesis = false; state.currentProjectId = null;
    state.currentDocId = tab.docId;
    updateTopbar(); renderDocEditor();
  } else if (tab.type === 'project') {
    state.isHome = false; state.isMiTesis = false; state.currentDocId = null;
    state.currentProjectId = tab.projectId;
    updateTopbar(); renderProjectDash(tab.projectId);
  } else if (tab.type === 'article') {
    state.isHome = false; state.isMiTesis = false; state.currentDocId = null; state.currentProjectId = null;
    state.currentArticleKey = tab.articleKey;
    loadArticle(tab.articleKey).then(() => {
      initArticleData();
      state.currentPanel = tab.panel || 'dashboard';
      state.currentSubSec = tab.subSec || 0;
      updateTopbar();
      const artBar = document.getElementById('topbar-article');
      if (artBar) {
        const panelNames = ['dashboard', 'prelectura', 'puente', 'texto', 'glosario', 'reflexiones', 'mapa', 'flashcards', 'ayuda'];
        artBar.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', panelNames[i] === state.currentPanel));
      }
      state.render();
      setTimeout(() => {
        ct.scrollTop = tab.scrollTop || 0;
        if (tab.openPar && tab.panel === 'texto') {
          const acc = document.getElementById('acc-' + tab.openPar);
          if (acc) { window.togglePar(tab.openPar); acc.scrollIntoView({ behavior: 'auto', block: 'center' }); }
        }
      }, 150);
    });
    return;
  }
  setTimeout(() => { ct.scrollTop = tab.scrollTop || 0; }, 50);
}

// ============================================================
// TAB OPERATIONS
// ============================================================
export function openInTab(type, key, label) {
  const wsState = getWsTabs();
  const existingIdx = wsState.tabs.findIndex(t => {
    if (type === 'article') return t.type === 'article' && t.articleKey === key;
    if (type === 'doc') return t.type === 'doc' && t.docId === key;
    if (type === 'project') return t.type === 'project' && t.projectId === key;
    return false;
  });
  if (existingIdx >= 0 && existingIdx !== wsState.activeIdx) {
    const captured = captureTabState();
    Object.assign(wsState.tabs[wsState.activeIdx], captured);
    wsState.activeIdx = existingIdx;
    saveWsTabs(wsState);
    renderWsTabs();
    restoreTabState(wsState.tabs[existingIdx]);
    buildSidebar(); buildDocSidebar(); buildProjectSidebar();
    return;
  }
  const tab = wsState.tabs[wsState.activeIdx];
  tab.type = type;
  tab.label = label;
  tab.scrollTop = 0;
  if (type === 'article') { tab.articleKey = key; delete tab.docId; delete tab.projectId; tab.panel = 'dashboard'; tab.subSec = 0; }
  if (type === 'doc') { tab.docId = key; delete tab.articleKey; delete tab.projectId; }
  if (type === 'project') { tab.projectId = key; delete tab.articleKey; delete tab.docId; }
  saveWsTabs(wsState);
  renderWsTabs();
}
// Expose on window so editor.js and other modules can call it via late-binding
window.openInTab = openInTab;

export function switchWsTab(idx) {
  const wsState = getWsTabs();
  if (idx === wsState.activeIdx) return;
  const captured = captureTabState();
  Object.assign(wsState.tabs[wsState.activeIdx], captured);
  wsState.activeIdx = idx;
  saveWsTabs(wsState);
  renderWsTabs();
  restoreTabState(wsState.tabs[idx]);
  buildSidebar(); buildDocSidebar(); buildProjectSidebar();
}
window.switchWsTab = switchWsTab;

export function closeWsTab(idx, e) {
  if (e) e.stopPropagation();
  const wsState = getWsTabs();
  if (wsState.tabs.length <= 1) return;
  wsState.tabs.splice(idx, 1);
  if (wsState.activeIdx >= wsState.tabs.length) wsState.activeIdx = wsState.tabs.length - 1;
  else if (idx < wsState.activeIdx) wsState.activeIdx--;
  else if (idx === wsState.activeIdx) wsState.activeIdx = Math.min(idx, wsState.tabs.length - 1);
  saveWsTabs(wsState);
  renderWsTabs();
  restoreTabState(wsState.tabs[wsState.activeIdx]);
  buildSidebar(); buildDocSidebar(); buildProjectSidebar();
}
window.closeWsTab = closeWsTab;

export function addWsTab() {
  const wsState = getWsTabs();
  if (wsState.tabs.length >= MAX_TABS) { showToast('Máximo ' + MAX_TABS + ' pestañas', 'warn'); return; }
  const captured = captureTabState();
  Object.assign(wsState.tabs[wsState.activeIdx], captured);
  wsState.tabs.push({ id: 't_' + Date.now(), label: 'Vista general', type: 'home' });
  wsState.activeIdx = wsState.tabs.length - 1;
  saveWsTabs(wsState);
  renderWsTabs();
  restoreTabState(wsState.tabs[wsState.activeIdx]);
}
window.addWsTab = addWsTab;

// ============================================================
// RENDER TABS BAR
// ============================================================
export function renderWsTabs() {
  const el = document.getElementById('ws-tabs'); if (!el) return;
  const wsState = getWsTabs();
  const colorMap = { home: 'var(--green)', article: 'var(--blue)', doc: 'var(--gold)', project: 'var(--purple)', mitesis: 'var(--red)' };
  let h = '';
  wsState.tabs.forEach((tab, i) => {
    const icon = tab.type === 'home' ? '🏠' : tab.type === 'article' ? '📄' : tab.type === 'doc' ? '✍' : tab.type === 'project' ? '📁' : tab.type === 'mitesis' ? '🎯' : '📋';
    const color = colorMap[tab.type] || 'var(--tx3)';
    const closeBtn = wsState.tabs.length > 1 ? `<span class="ws-close" onclick="closeWsTab(${i},event)">✕</span>` : '';
    let meta = '';
    if (tab.type === 'article' && tab.panel) meta = `<span class="ws-meta">${tab.panel === 'texto' ? '§' + (tab.subSec + 1) : '●'}</span>`;
    if (tab.type === 'doc') meta = `<span class="ws-meta">✍</span>`;
    h += `<div class="ws-tab ${i === wsState.activeIdx ? 'active' : ''}" style="border-left:3px solid ${color};" onclick="switchWsTab(${i})" title="${tab.label}">${icon} ${tab.label}${meta}${closeBtn}</div>`;
  });
  if (wsState.tabs.length < MAX_TABS) h += `<div class="ws-tab-add" onclick="addWsTab()" title="Nueva pestaña">+</div>`;
  el.innerHTML = h;
}

// ============================================================
// QUICK CAPTURE
// ============================================================
export function toggleQuickCapture() {
  const panel = document.getElementById('qc-panel');
  const btn = document.getElementById('qc-btn');
  if (panel.classList.contains('show')) {
    panel.classList.remove('show'); btn.style.display = '';
  } else {
    panel.classList.add('show'); btn.style.display = 'none';
    const ta = document.getElementById('qc-text'); ta.value = ''; ta.focus();
    // Reset priority toggle
    const pCb = document.getElementById('qc-priority'); if (pCb) pCb.checked = false;
    const pLbl = document.getElementById('qc-priority-label');
    if (pLbl) { pLbl.style.background = 'var(--bg2)'; pLbl.style.borderColor = 'rgba(220,215,205,0.12)'; pLbl.style.color = 'var(--tx3)'; }
    // Populate project selector
    const sel = document.getElementById('qc-project');
    if (sel) {
      const projects = state._getProjects ? state._getProjects() : [];
      sel.innerHTML = '<option value="">Sin proyecto</option>';
      projects.forEach(p => {
        const selected = state.currentProjectId === p.id ? ' selected' : '';
        sel.innerHTML += `<option value="${p.id}"${selected}>${p.nombre}</option>`;
      });
    }
  }
}
window.toggleQuickCapture = toggleQuickCapture;

export function saveQuickCapture() {
  const ta = document.getElementById('qc-text');
  const text = ta.value.trim(); if (!text) return;
  const projectId = document.getElementById('qc-project')?.value || null;
  const priority = document.getElementById('qc-priority')?.checked || false;
  const items = getKanban();
  items.push({ id: 'kb_' + Date.now(), title: text, column: 'todo', deadline: null, projectId: projectId, priority: priority, nota: null, created: new Date().toISOString(), updated: new Date().toISOString() });
  saveKanban(items);
  ta.value = '';
  toggleQuickCapture();
  // Refresh view
  if (state.isHome && window.renderGlobalDash) window.renderGlobalDash();
  showToast('💡 Idea capturada en el tablero', 'success');
}
window.saveQuickCapture = saveQuickCapture;

// Keyboard shortcuts for quick capture
document.addEventListener('keydown', function (e) {
  const panel = document.getElementById('qc-panel');
  if (panel && panel.classList.contains('show')) {
    if (e.key === 'Escape') { toggleQuickCapture(); e.preventDefault(); }
    if (e.key === 'Enter' && !e.shiftKey && document.activeElement.id === 'qc-text') { saveQuickCapture(); e.preventDefault(); }
  }
});
