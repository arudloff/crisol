// ============================================================
// CRISOL — app.js  (Entry point, router, sidebar, boot)
// Imports all modules, defines navigation, registers globals, boots app
// ============================================================

import { state, DEFAULT_FASES, PROJ_ESTADOS, PROJ_ROLE_LABELS } from './state.js';
import { ld, sv, getSK, migrateLegacy, calcProgress } from './storage.js';
import {
  initSync, syncSettingsToCloud, loadSettingsFromCloud,
  initKanbanSync, initPrismaSync, initDocsSync, syncDocsToCloud
} from './sync.js';
import './db.js'; // side-effect: initializes state.sdb
import { checkLogin, logout } from './auth.js';
import {
  showToast, setSyncStatus, closeSidebarMobile, escH, initConnectionMonitor, logError, logAudit, initAccessibility
} from './utils.js';
import {
  loadArticle, initArticleData, render, upd, saveNavState, restoreNavState,
  getArticleTags
} from './articles.js';
import {
  getDocs, renderDocEditor, countDocWords, saveDocs, openDoc
} from './editor.js';
import { renderGlobalDash, getSources } from './dashboard.js';
import { getPrisma, renderPrisma, loadPrismaFromSupabase } from './prisma.js';
import { getKanban, renderKanban } from './kanban.js';
import { renderWsTabs, getWsTabs, saveWsTabs, openInTab } from './tabs.js';
import {
  getProjects, saveProjects, buildProjectSidebar, renderProjectDash,
  renderMiTesis, updateSidebarKPIs, getProjectsForArticle, getProjectsForDoc,
  renderProjectBadges, loadProjects, migrateLocalProjects,
  renderProjectsSummary, getProjectClaims, calcDaysRemaining, calcProjectAlert,
  goPipeline, renderPipeline, calcArticleProgress, calcArticleClaims,
  calcDocBlockStates, calcDaysElapsed, goToProject, toggleProjFilter, getActivePhase
} from './projects.js';

import { loadNotifications, startNotificationPolling, cleanup as cleanupNotifications } from './notifications.js';

// Side-effect imports: these modules register their own window globals
import './tts.js';
import './dictation.js';
import './search.js';
import './flashcards.js';

// ============================================================
// Register late-bound references on state for cross-module access
// ============================================================
state.ct = document.getElementById('ct');
state._ld = ld;
state._loadArticle = loadArticle;
state._initArticleData = initArticleData;
state._renderDocEditor = renderDocEditor;
state._syncDocsToCloud = syncDocsToCloud;
state.getDocs = getDocs;
state.getSources = getSources;
state._saveNavState = saveNavState;
state._closeSidebarMobile = closeSidebarMobile;
state._cleanupNotifications = cleanupNotifications;
window.logAudit = logAudit;
state.getKanban = getKanban;
state.getPrisma = getPrisma;

// Project-related state._ registrations (moved from projects.js, Paso 9)
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
state._getActivePhase = getActivePhase;

// ============================================================
// Global error handlers (FF-U4.3)
// ============================================================
window.onerror = function(msg, url, line, col, error) {
  console.error('Global error:', { msg, url, line, col }, error);
  if (window.logAudit) window.logAudit('js_error', 'global', '', msg);
};
window.onunhandledrejection = function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.logAudit) window.logAudit('unhandled_rejection', 'global', '', String(event.reason));
};

// ============================================================
// SIDEBAR TOGGLE (mobile)
// ============================================================
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('sb-open');
  document.getElementById('sb-overlay')?.classList.toggle('sb-open');
}
window.toggleSidebar = toggleSidebar;

// ============================================================
// SIDEBAR CATEGORY TOGGLE
// ============================================================
function toggleCat(el) {
  el.classList.toggle('open');
  el.nextElementSibling?.classList.toggle('open');
}
window.toggleCat = toggleCat;

// ============================================================
// SIDEBAR TOOLS TOGGLE
// ============================================================
function toggleSidebarTools() {
  const body = document.getElementById('sidebar-tools');
  const chv = document.getElementById('tools-chv');
  if (!body) return;
  body.classList.toggle('open');
  if (chv) chv.classList.toggle('open');
}
window.toggleSidebarTools = toggleSidebarTools;

// ============================================================
// SIDEBAR SETTINGS MENU TOGGLE
// ============================================================
function toggleSidebarMenu() {
  const menu = document.getElementById('sidebar-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
window.toggleSidebarMenu = toggleSidebarMenu;

// ============================================================
// ENSURE TOOLS PANEL IS OPEN
// ============================================================
function ensureToolsOpen() {
  const body = document.getElementById('sidebar-tools');
  const chv = document.getElementById('tools-chv');
  if (body && !body.classList.contains('open')) {
    body.classList.add('open');
    if (chv) chv.classList.add('open');
  }
}
state._ensureToolsOpen = ensureToolsOpen;
window.ensureToolsOpen = ensureToolsOpen;

// ============================================================
// UPDATE TOPBAR — show/hide article vs doc topbar
// ============================================================
function updateTopbar() {
  const artBar = document.getElementById('topbar-article');
  const docBar = document.getElementById('topbar-doc');
  const content = document.getElementById('ct');
  if (!artBar || !docBar) return;
  if (state.currentDocId) {
    artBar.style.display = 'none'; docBar.style.display = '';
    if (content) content.style.gridRow = '';
  } else if (state.isHome || state.isMiTesis || state.currentProjectId || state._isPrisma) {
    artBar.style.display = 'none'; docBar.style.display = 'none';
    if (content) content.style.gridRow = '1/3';
  } else {
    artBar.style.display = ''; docBar.style.display = 'none';
    if (content) content.style.gridRow = '';
  }
}
state._updateTopbar = updateTopbar;
window.updateTopbar = updateTopbar;

// ============================================================
// BREADCRUMB
// ============================================================
function getBreadcrumb() {
  let parts = ['<span style="cursor:pointer;color:var(--gold);" onclick="goHome()">CRISOL</span>'];
  if (state._isPrisma) {
    parts.push('PRISMA');
    return '<div style="font-size:11px;color:var(--tx3);margin-bottom:8px;">' + parts.join(' <span style="opacity:0.5;">›</span> ') + '</div>';
  }
  if (state.isHome) parts.push('Vista general');
  else if (state.isMiTesis) parts.push('Mi tesis');
  else if (state.currentDocId) {
    const docs = getDocs();
    const doc = docs.find(d => d.id === state.currentDocId);
    parts.push('Escritos');
    if (doc) parts.push(doc.title);
  } else if (state.DATA && state.DATA.meta) {
    parts.push(state.DATA.meta.authors + ' (' + state.DATA.meta.year + ')');
    const names = {dashboard:'Dashboard',prelectura:'Pre-lectura',puente:'Puente',texto:'Texto anotado',glosario:'Glosario',reflexiones:'Reflexiones',mapa:'Mapa',flashcards:'Flashcards',ayuda:'Ayuda'};
    if (names[state.currentPanel]) parts.push(names[state.currentPanel]);
  }
  return '<div style="font-size:11px;color:var(--tx3);margin-bottom:8px;">' + parts.join(' <span style="opacity:0.5;">›</span> ') + '</div>';
}
state._getBreadcrumb = getBreadcrumb;
window.getBreadcrumb = getBreadcrumb;

// ============================================================
// BUILD ARTICLE SIDEBAR
// ============================================================
function buildSidebar() {
  const container = document.getElementById('sidebar-articles');
  if (!container) return;
  const articles = window.SILA_MANIFEST || [];
  const cats = {};
  articles.forEach(meta => {
    const cat = meta.category || 'Sin categoría';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push({ key: meta.key, meta });
  });
  let h = '';
  const catKeys = Object.keys(cats).sort();
  catKeys.forEach((cat, ci) => {
    const hasActive = cats[cat].some(a => a.key === state.currentArticleKey);
    const isOpen = hasActive;
    h += '<div class="s-cat">';
    h += `<div class="s-cat-head ${isOpen ? 'open' : ''}" onclick="toggleCat(this)"><span class="chv">▸</span> ${cat}</div>`;
    h += `<div class="s-cat-body ${isOpen ? 'open' : ''}">`;
    const MAX_VISIBLE = 7;
    const items = cats[cat];
    const activeIdx = items.findIndex(a => a.key === state.currentArticleKey);
    const hasMore = items.length > MAX_VISIBLE;
    const catId = 'artcat-' + ci;
    items.forEach((art, ai) => {
      const isActive = art.key === state.currentArticleKey;
      const hidden = hasMore && ai >= MAX_VISIBLE && activeIdx !== ai;
      const w = art.meta.weight === 'critico' ? '◆◆◆' : art.meta.weight === 'importante' ? '◆◆' : '◆';
      h += `<div class="s-it ${isActive ? 'active' : ''}" ${hidden ? 'style="display:none;" data-overflow="' + catId + '"' : ''} onclick="selArt('${art.key}',this)">`;
      h += `<div class="sw">${w}</div>`;
      h += `<div class="st">${art.meta.authors} (${art.meta.year})</div>`;
      h += `<div class="s-pct" id="side-pct-${art.key}">0%</div>`;
      h += '</div>';
      h += `<div class="s-prog" ${hidden ? 'style="display:none;" data-overflow="' + catId + '"' : ''} id="side-fill-wrap-${art.key}"><div class="fill" id="side-fill-${art.key}" style="width:0%"></div></div>`;
    });
    if (hasMore) h += `<div class="s-more" onclick="showAllCatItems('${catId}',this)" style="font-size:12px;color:var(--blue);padding:4px 16px;cursor:pointer;">ver ${items.length - MAX_VISIBLE} más...</div>`;
    h += '</div></div>';
  });
  if (articles.length > 5) h += `<div class="s-home" onclick="openArticleSearch()" style="font-size:13px;color:var(--blue);">🔍 Buscar artículo (${articles.length})</div>`;
  container.innerHTML = h;
  // Auto-open parent section wrapper if an article is active
  if (state.currentArticleKey && !state.isHome && !state.isMiTesis && !state.currentDocId && !state.currentProjectId) {
    const wrap = document.getElementById('sidebar-articles-wrap');
    const head = wrap?.previousElementSibling;
    if (wrap && !wrap.classList.contains('open')) { wrap.classList.add('open'); if (head) head.classList.add('open'); }
  }
  updateSidebarKPIs();
}
state._buildSidebar = buildSidebar;
window.buildSidebar = buildSidebar;

// ============================================================
// BUILD DOCUMENT SIDEBAR
// ============================================================
function buildDocSidebar() {
  const el = document.getElementById('sidebar-docs');
  if (!el) return;
  const docs = getDocs().sort((a, b) => new Date(b.updated) - new Date(a.updated));
  if (docs.length === 0) { el.innerHTML = ''; updateSidebarKPIs(); return; }
  const groups = {};
  docs.forEach(d => {
    const tags = (d.tags && d.tags.length) ? d.tags : ['sin etiqueta'];
    tags.forEach(tag => {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(d);
    });
  });
  let h = '';
  Object.keys(groups).sort().forEach(tag => {
    const hasActive = groups[tag].some(d => d.id === state.currentDocId);
    h += `<div class="s-cat"><div class="s-cat-head ${hasActive ? 'open' : ''}" onclick="toggleCat(this)"><span class="chv">▸</span> ${tag} (${groups[tag].length})</div>`;
    h += `<div class="s-cat-body ${hasActive ? 'open' : ''}">`;
    const MAX_VIS = 7;
    const docItems = groups[tag];
    const catDocId = 'doccat-' + tag.replace(/\s/g, '_');
    docItems.forEach((d, di) => {
      const words = countDocWords(d);
      const st = d.status || 'borrador';
      const stIcon = st === 'finalizado' ? '✓' : st === 'revision' ? '⏳' : '✍';
      const stColor = st === 'finalizado' ? 'var(--green)' : st === 'revision' ? 'var(--gold)' : 'var(--tx2)';
      const isAct = state.currentDocId === d.id;
      const hidden = docItems.length > MAX_VIS && di >= MAX_VIS && !isAct;
      h += `<div class="s-it ${isAct ? 'active' : ''}" ${hidden ? 'style="display:none;" data-overflow="' + catDocId + '"' : ''} onclick="openDoc('${d.id}')" style="font-size:13px;padding:4px 16px;">`;
      h += `<div class="st" style="color:${stColor};">${stIcon} ${d.title}</div>`;
      h += `<div style="font-size:11px;color:var(--tx3);padding-left:22px;">${words} pal</div>`;
      h += '</div>';
    });
    if (docItems.length > MAX_VIS) h += `<div class="s-more" onclick="showAllCatItems('${catDocId}',this)" style="font-size:12px;color:var(--blue);padding:4px 16px;cursor:pointer;">ver ${docItems.length - MAX_VIS} más...</div>`;
    h += '</div></div>';
  });
  if (docs.length > 5) h += `<div class="s-home" onclick="openDocSearch()" style="font-size:13px;color:var(--blue);">🔍 Buscar documento (${docs.length})</div>`;
  el.innerHTML = h;
  // Auto-open parent section wrapper if a doc is active
  if (state.currentDocId && !state.isHome && !state.isMiTesis) {
    const wrap = document.getElementById('sidebar-docs-wrap');
    const head = wrap?.previousElementSibling;
    if (wrap && !wrap.classList.contains('open')) { wrap.classList.add('open'); if (head) head.classList.add('open'); }
  }
  updateSidebarKPIs();
}
state._buildDocSidebar = buildDocSidebar;
window.buildDocSidebar = buildDocSidebar;

// ============================================================
// NAVIGATION — goHome
// ============================================================
function goHome() {
  saveNavState();
  state.isHome = true; state.isMiTesis = false; state.currentDocId = null;
  state._isPrisma = false; state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  document.getElementById('s-home')?.classList.add('active');
  updateTopbar();
  renderGlobalDash();
  buildProjectSidebar();
  // Update tab
  const ws = getWsTabs();
  ws.tabs[ws.activeIdx] = { id: ws.tabs[ws.activeIdx].id, label: 'Vista general', type: 'home', scrollTop: 0 };
  saveWsTabs(ws); renderWsTabs();
}
state._goHome = goHome;
window.goHome = goHome;

// ============================================================
// NAVIGATION — goMiTesis
// ============================================================
function goMiTesis() {
  state.isHome = false; state.isMiTesis = true; state.currentDocId = null; state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  ensureToolsOpen();
  document.getElementById('s-mitesis')?.classList.add('active');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  renderMiTesis();
  const ws = getWsTabs();
  ws.tabs[ws.activeIdx] = { id: ws.tabs[ws.activeIdx].id, label: 'Mi tesis', type: 'mitesis', scrollTop: 0 };
  saveWsTabs(ws); renderWsTabs();
}
window.goMiTesis = goMiTesis;

// ============================================================
// NAVIGATION — goToArticle
// ============================================================
window.goToArticle = async function(key) {
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null;
  state.currentDocId = null; state._isPrisma = false;
  document.querySelectorAll('.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  const items = document.querySelectorAll('.s-it');
  items.forEach(i => {
    if (i.getAttribute('onclick') && i.getAttribute('onclick').includes(key)) i.classList.add('active');
    else i.classList.remove('active');
  });
  state.currentArticleKey = key;
  try {
    await loadArticle(key);
    initArticleData();
    state.currentPanel = 'dashboard';
    updateTopbar();
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    render(); upd(); calcProgress();
    if (state.syncEnabled) initSync();
  } catch (e) {
    const ct = document.getElementById('ct');
    if (ct) ct.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);">Error: ' + escH(e.message) + '</div>';
  }
};

// ============================================================
// NAVIGATION — goToArticlePar
// ============================================================
window.goToArticlePar = async function(key, si, pi) {
  state.currentDocId = null;
  await window.goToArticle(key);
  state.currentPanel = 'texto';
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 3));
  render();
  setTimeout(() => {
    if (typeof window.switchSub === 'function') window.switchSub(si);
    setTimeout(() => {
      if (typeof window.togglePar === 'function') window.togglePar('p' + si + '-' + pi);
      const el = document.getElementById('acc-p' + si + '-' + pi);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, 100);
};

// ============================================================
// NAVIGATION — selArt override (clear isHome + update tab)
// ============================================================
const _origSelArt = window.selArt;
if (_origSelArt) {
  window.selArt = async function(key, el) {
    state.isHome = false; state.isMiTesis = false; state.currentDocId = null;
    document.querySelectorAll('.s-home').forEach(i => i.classList.remove('active'));
    await _origSelArt(key, el);
    if (state.DATA && state.DATA.meta) openInTab('article', key, state.DATA.meta.authors + ' (' + state.DATA.meta.year + ')');
  };
}

// ============================================================
// EXPORT / IMPORT USER DATA (backup)
// ============================================================
window.exportUserData = function() {
  const manifest = window.SILA_MANIFEST || [];
  const allArticleData = {};
  manifest.forEach(m => {
    const raw = localStorage.getItem('sila4_' + m.key);
    if (raw) { try { allArticleData[m.key] = JSON.parse(raw); } catch (e) { /* storage error */ } }
  });
  const backup = {
    _meta: { exported: new Date().toISOString(), version: 'crisol_v1', type: 'full_backup' },
    articles: allArticleData,
    projects: getProjects(),
    docs: getDocs(),
    kanban: getKanban(),
    prisma: getPrisma(),
    settings: {
      fs: localStorage.getItem('sila_fs'),
      navMemory: localStorage.getItem('sila_navMemory'),
      tabs: localStorage.getItem('sila_tabs'),
      projFilters: localStorage.getItem('sila_projFilters')
    }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'CRISOL_backup_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  showToast('Backup completo descargado', 'success', 3000);
};

window.fullBackupDownload = async function() {
  try {
    const { downloadBackup } = await import('./sync.js');
    if (downloadBackup) await downloadBackup();
  } catch (e) {
    showToast('Error al crear backup: ' + e.message, 'error');
  }
};

window.importUserData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const d = JSON.parse(e.target.result);
      if (d._meta && d._meta.type === 'full_backup') {
        if (!confirm('Esto reemplazará TODOS tus datos locales. ¿Continuar?')) return;
        if (d.articles) Object.entries(d.articles).forEach(([key, val]) => { try { localStorage.setItem('sila4_' + key, JSON.stringify(val)); } catch (e) { /* storage error */ } });
        if (d.projects) try { localStorage.setItem('sila_projects', JSON.stringify(d.projects)); } catch (e) { /* storage error */ }
        if (d.docs) try { localStorage.setItem('sila_docs', JSON.stringify(d.docs)); } catch (e) { /* storage error */ }
        if (d.kanban) try { localStorage.setItem('sila_kanban', JSON.stringify(d.kanban)); } catch (e) { /* storage error */ }
        if (d.prisma) try { localStorage.setItem('sila_prisma', JSON.stringify(d.prisma)); } catch (e) { /* storage error */ }
        if (d.settings) Object.entries(d.settings).forEach(([k, v]) => { if (v) try { localStorage.setItem('sila_' + k, v); } catch (e) { /* storage error */ } });
        showToast('Backup restaurado', 'success', 3000);
        location.reload();
        return;
      }
      // Legacy single-article format
      if (!d._meta) { if (!confirm('Este archivo no parece ser un backup CRISOL. ¿Importar de todos modos?')) return; }
      delete d._meta;
      localStorage.setItem(getSK(), JSON.stringify(d));
      state.hasUnsavedChanges = false;
      render(); upd(); calcProgress();
      alert('Progreso restaurado correctamente.');
    } catch (err) { alert('Error al leer archivo: ' + err.message); }
  };
  reader.readAsText(file);
};

// ============================================================
// FONT SIZE
// ============================================================
document.documentElement.style.setProperty('--fs', state.fontSize + 'px');

// ============================================================
// BEFOREUNLOAD — save nav state
// ============================================================
window.addEventListener('beforeunload', function(e) {
  saveNavState();
  if (state.hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = 'Tienes cambios sin guardar. ¿Cerrar de todos modos?';
  }
});

// ============================================================
// LOCALSTORAGE NAMESPACING MIGRATION
// Copies old un-namespaced keys to user-scoped keys
// ============================================================
function migrateLocalStorageNamespace() {
  if (!state.currentUser) return;
  const uid = state.currentUser.id;
  if (localStorage.getItem('crisol_ns_migrated_' + uid)) return;

  console.log('Migrating localStorage keys to user namespace...');
  const keysToMigrate = ['sila_docs', 'sila_docs_ts', 'sila_kanban', 'sila_kanban_ts',
    'sila_prisma', 'sila_prisma_ts', 'sila_settings', 'sila_navMemory',
    'sila_tabs', 'sila_sources', 'sila_fs', 'sila_cols', 'sila_projFilters'];

  keysToMigrate.forEach(key => {
    const val = localStorage.getItem(key);
    if (val && !localStorage.getItem(key + '_' + uid)) {
      localStorage.setItem(key + '_' + uid, val);
    }
  });

  // Migrate article data keys (sila4_*)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sila4_') && !key.includes(uid)) {
      const val = localStorage.getItem(key);
      const newKey = key + '_' + uid;
      if (val && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, val);
      }
    }
  }

  localStorage.setItem('crisol_ns_migrated_' + uid, 'done');
  console.log('Namespace migration complete for user ' + uid);
}

// ============================================================
// ARTICLE IMPORT — JSON import from /sila skill
// ============================================================
let _pendingImportData = null;

function showImportModal() {
  const modal = document.getElementById('import-modal');
  if (!modal) return;
  // Reset state
  _pendingImportData = null;
  document.getElementById('import-preview').style.display = 'none';
  document.getElementById('import-error').style.display = 'none';
  document.getElementById('import-drop').style.display = '';
  // Populate project dropdown
  const sel = document.getElementById('import-project');
  if (sel) {
    sel.innerHTML = '<option value="">Sin proyecto</option>';
    getProjects().forEach(p => {
      sel.innerHTML += `<option value="${escH(p.id)}">${escH(p.nombre)}</option>`;
    });
  }
  modal.classList.add('show');
}
window.showImportModal = showImportModal;

function closeImportModal() {
  document.getElementById('import-modal')?.classList.remove('show');
  _pendingImportData = null;
}
window.closeImportModal = closeImportModal;

function handleImportDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  if (file) processImportFile(file);
}
window.handleImportDrop = handleImportDrop;

function handleImportFile(e) {
  const file = e.target?.files?.[0];
  if (file) processImportFile(file);
}
window.handleImportFile = handleImportFile;

function processImportFile(file) {
  if (!file.name.endsWith('.json')) {
    showImportError('Solo se aceptan archivos .json');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      // Validate: must have meta.key + meta.title + sections
      if (data.meta && data.meta.key && data.meta.title && data.sections) {
        // Standard SILA article format (same as data/*.js files)
        _pendingImportData = data;
        showImportPreview(data);
      } else if (data.sila_version && data.article && data.sections) {
        // New SILA JSON format (from architecture spec)
        // Convert to internal format
        _pendingImportData = convertSilaJson(data);
        showImportPreview(_pendingImportData);
      } else {
        showImportError('Formato no reconocido. El archivo debe ser un artículo procesado por /sila.');
      }
    } catch (err) {
      showImportError('Error al leer JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function convertSilaJson(data) {
  // Convert new format → internal format
  const a = data.article || {};
  return {
    meta: {
      key: (a.authors || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + (a.year || '0000'),
      title: a.title || '',
      authors: a.authors || '',
      year: a.year || 0,
      journal: a.journal || '',
      institution: a.institution || '',
      doi: a.doi || '',
      category: a.category || 'Importado',
      weight: a.weight || 'complementario',
      fidelity: a.fidelity || 0,
      cards: 0,
      concepts: (data.key_concepts || []).length,
      highlights: a.highlights || {}
    },
    sections: data.sections || [],
    flujo: data.flujo || {}
  };
}

function showImportPreview(data) {
  const m = data.meta;
  const nSec = (data.sections || []).length;
  const nPar = (data.sections || []).reduce((a, s) => a + (s.paragraphs || []).length, 0);
  document.getElementById('import-drop').style.display = 'none';
  document.getElementById('import-preview').style.display = '';
  document.getElementById('import-preview-text').innerHTML =
    `<div style="font-weight:600;color:#fff;">${escH(m.authors)} (${m.year})</div>` +
    `<div style="font-size:13px;color:var(--tx2);margin-top:2px;">${escH(m.title)}</div>` +
    `<div style="font-size:12px;color:var(--tx3);margin-top:6px;">${nSec} secciones · ${nPar} párrafos · ${m.category || ''}</div>`;
  document.getElementById('import-error').style.display = 'none';
}

function showImportError(msg) {
  const el = document.getElementById('import-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function confirmImport() {
  if (!_pendingImportData || !state.sdb || !state.currentUser) return;

  const data = _pendingImportData;
  const m = data.meta;
  const projectId = document.getElementById('import-project')?.value || null;

  // Check for duplicates
  const existing = (window.SILA_MANIFEST || []).find(a => a.key === m.key);
  if (existing || (window.SILA_ARTICLES && window.SILA_ARTICLES[m.key])) {
    if (!confirm(`El artículo "${m.authors} (${m.year})" ya existe. ¿Reemplazar?`)) return;
  }

  // INSERT into Supabase articles table
  try {
    const { error } = await state.sdb.from('articles').insert({
      project_id: projectId || null,
      uploaded_by: state.currentUser.id,
      title: m.title,
      authors: m.authors,
      year: m.year,
      journal: m.journal || null,
      doi: m.doi || null,
      abstract: m.abstract || null,
      sila_data: data
    });
    if (error) throw error;
  } catch (e) {
    showImportError('Error al guardar: ' + e.message);
    return;
  }

  // Inject into in-memory structures
  window.SILA_ARTICLES = window.SILA_ARTICLES || {};
  window.SILA_ARTICLES[m.key] = data;

  // Add to manifest if not already there
  const manifest = window.SILA_MANIFEST || [];
  const idx = manifest.findIndex(a => a.key === m.key);
  if (idx >= 0) {
    manifest[idx] = { key: m.key, authors: m.authors, year: m.year, category: m.category, weight: m.weight };
  } else {
    manifest.push({ key: m.key, authors: m.authors, year: m.year, category: m.category, weight: m.weight });
  }

  // Rebuild sidebar
  buildSidebar();
  updateSidebarKPIs();
  closeImportModal();
  showToast(`Artículo importado: ${m.authors} (${m.year})`, 'success', 3000);
}
window.confirmImport = confirmImport;

// --- Load imported articles from Supabase on boot ---
async function loadImportedArticles() {
  if (!state.sdb || !state.currentUser) return;
  try {
    // RLS returns own articles + articles from shared projects
    const { data, error } = await state.sdb
      .from('articles')
      .select('*, profiles!uploaded_by(display_name)');
    if (error || !data) return;

    window.SILA_ARTICLES = window.SILA_ARTICLES || {};
    const manifest = window.SILA_MANIFEST || [];

    data.forEach(row => {
      const sila = row.sila_data;
      if (!sila || !sila.meta) return;
      const key = sila.meta.key;

      // Inject article data
      window.SILA_ARTICLES[key] = sila;

      // Add to manifest if not already there
      if (!manifest.find(m => m.key === key)) {
        const uploaderName = row.profiles?.display_name;
        const isOther = row.uploaded_by !== state.currentUser.id;
        manifest.push({
          key: key,
          authors: sila.meta.authors,
          year: sila.meta.year,
          category: sila.meta.category || (isOther ? 'Compartido' : 'Importado'),
          weight: sila.meta.weight || 'complementario',
          _uploadedBy: uploaderName || null,
          _isShared: isOther
        });
      }
    });
  } catch (e) {
    console.error('loadImportedArticles error:', e);
  }
}

// ============================================================
// SHARE ARTICLE — direct user-to-user sharing
// ============================================================
function showShareArticleModal(articleKey) {
  if (!state.sdb || !state.currentUser) { showToast('Inicia sesión para compartir', 'error'); return; }

  // Find article info
  const manifest = window.SILA_MANIFEST || [];
  const artMeta = manifest.find(m => m.key === articleKey);
  const artTitle = artMeta ? `${artMeta.authors} (${artMeta.year})` : articleKey;

  // Find article ID in Supabase (if imported)
  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal" style="max-width:420px;">`;
  html += `<h3>Compartir artículo</h3>`;
  html += `<p style="font-size:14px;color:var(--tx2);margin-bottom:12px;">${escH(artTitle)}</p>`;
  html += `<label>Email del destinatario</label>`;
  html += `<input id="share-art-email" type="email" placeholder="email@ejemplo.com" style="width:100%;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
  html += `<label style="margin-top:8px;">Mensaje (opcional)</label>`;
  html += `<textarea id="share-art-msg" placeholder="Te comparto este artículo porque..." style="width:100%;padding:8px;min-height:50px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;resize:vertical;"></textarea>`;
  html += `<p id="share-art-status" style="font-size:12px;margin-top:6px;display:none;"></p>`;
  html += `<div class="proj-modal-actions" style="margin-top:14px;">`;
  html += `<button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cancelar</button>`;
  html += `<button class="proj-btn-primary" id="share-art-btn" onclick="confirmShareArticle('${articleKey}')">Compartir</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('share-art-email')?.focus();
}
window.showShareArticleModal = showShareArticleModal;

async function confirmShareArticle(articleKey) {
  const email = document.getElementById('share-art-email')?.value.trim();
  const message = document.getElementById('share-art-msg')?.value.trim();
  const statusEl = document.getElementById('share-art-status');
  const btn = document.getElementById('share-art-btn');
  if (!email) { showShareStatus('Ingresa un email', 'var(--red)'); return; }

  btn.textContent = 'Compartiendo...'; btn.disabled = true;

  try {
    // Find recipient by email
    const { data: recipientId } = await state.sdb.rpc('find_user_by_email', { user_email: email });
    if (!recipientId) {
      showShareStatus('Usuario no encontrado. Solo se puede compartir con usuarios registrados en CRISOL.', 'var(--gold)');
      btn.textContent = 'Compartir'; btn.disabled = false;
      return;
    }

    if (recipientId === state.currentUser.id) {
      showShareStatus('No puedes compartir contigo mismo.', 'var(--gold)');
      btn.textContent = 'Compartir'; btn.disabled = false;
      return;
    }

    // Find or create article in Supabase
    let articleId = null;
    const { data: existingArt } = await state.sdb
      .from('articles')
      .select('id')
      .eq('uploaded_by', state.currentUser.id)
      .filter('sila_data->meta->>key', 'eq', articleKey)
      .maybeSingle();

    if (existingArt) {
      articleId = existingArt.id;
    } else {
      // Upload article to Supabase first
      const artData = window.SILA_ARTICLES?.[articleKey];
      if (!artData) {
        showShareStatus('Carga el artículo primero (click en él en el sidebar).', 'var(--gold)');
        btn.textContent = 'Compartir'; btn.disabled = false;
        return;
      }
      const m = artData.meta || {};
      const { data: newArt, error: insertErr } = await state.sdb.from('articles').insert({
        uploaded_by: state.currentUser.id,
        title: m.title || articleKey,
        authors: m.authors || '',
        year: m.year || null,
        journal: m.journal || null,
        sila_data: artData
      }).select('id').single();
      if (insertErr) throw insertErr;
      articleId = newArt.id;
    }

    // Insert shared_articles record
    const { error: shareErr } = await state.sdb.from('shared_articles').insert({
      article_id: articleId,
      shared_by: state.currentUser.id,
      shared_with: recipientId,
      message: message || null
    });

    if (shareErr) {
      if (shareErr.code === '23505') {
        showShareStatus('Ya compartiste este artículo con este usuario.', 'var(--gold)');
      } else throw shareErr;
      btn.textContent = 'Compartir'; btn.disabled = false;
      return;
    }

    // Notify recipient
    const manifest = window.SILA_MANIFEST || [];
    const artMeta = manifest.find(m => m.key === articleKey);
    const artTitle = artMeta ? `${artMeta.authors} (${artMeta.year})` : articleKey;

    await state.sdb.from('notifications').insert({
      user_id: recipientId,
      type: 'article_shared',
      title: 'Artículo compartido contigo',
      body: (state.profile?.display_name || 'Alguien') + ' te compartió "' + artTitle + '"' + (message ? ': ' + message : ''),
      reference_id: articleId,
      reference_type: 'article'
    });

    showShareStatus('Artículo compartido exitosamente', 'var(--green)');
    btn.textContent = 'Compartir'; btn.disabled = false;
    showToast('Artículo compartido con ' + email, 'success', 3000);
    setTimeout(() => { document.querySelector('.proj-modal-overlay')?.remove(); }, 1500);

  } catch (e) {
    showShareStatus('Error: ' + e.message, 'var(--red)');
    btn.textContent = 'Compartir'; btn.disabled = false;
  }
}
window.confirmShareArticle = confirmShareArticle;

function showShareStatus(msg, color) {
  const el = document.getElementById('share-art-status');
  if (el) { el.textContent = msg; el.style.color = color; el.style.display = 'block'; }
}

// ============================================================
// OFFLINE DETECTION
// ============================================================
window.addEventListener('online', () => {
  setSyncStatus('Reconectado', 'var(--green)');
  showToast('Conexión restaurada', 'success', 2000);
});
window.addEventListener('offline', () => {
  setSyncStatus('Sin conexión', 'var(--red)');
  showToast('Sin conexión — cambios guardados localmente', 'warning', 4000);
});

// ============================================================
// BOOT SEQUENCE
// ============================================================
(async function boot() {
  // Monitor connection status
  initConnectionMonitor();
  initAccessibility();

  // Global error handler — log unhandled errors to Supabase
  window.addEventListener('error', e => {
    logError(e.message, e.error?.stack, e.filename + ':' + e.lineno);
  });
  window.addEventListener('unhandledrejection', e => {
    logError('Unhandled promise: ' + (e.reason?.message || e.reason), e.reason?.stack);
  });

  // Flush pending saves on tab close
  window.addEventListener('beforeunload', () => {
    if (state.projects?.length > 0) {
      try { localStorage.setItem('sila_projects_cache', JSON.stringify(state.projects)); } catch (e) { /* storage error */ }
    }
  });

  // Build sidebars (projects will be empty until loaded from Supabase)
  buildSidebar();
  buildDocSidebar();
  updateTopbar();
  renderWsTabs();

  // Load first article in background
  try {
    if (state.currentArticleKey) {
      await loadArticle(state.currentArticleKey);
      initArticleData();
    } else {
      const manifest = window.SILA_MANIFEST || [];
      if (manifest.length > 0) {
        state.currentArticleKey = manifest[0].key;
        await loadArticle(state.currentArticleKey);
        initArticleData();
      }
    }
  } catch (e) {
    console.error('Boot load error:', e);
  }

  // Sync after a short delay to let auto-login complete
  setTimeout(async () => {
    if (state.sdb && state.currentUser) {
      setSyncStatus('Sincronizando...', 'var(--gold)');
      try {
        // Namespace localStorage keys per user (one-time)
        migrateLocalStorageNamespace();
        // Migrate localStorage projects → Supabase (one-time)
        await migrateLocalProjects();
        // Load projects from Supabase
        await loadProjects();
        buildProjectSidebar();

        // Load imported articles from Supabase
        await loadImportedArticles();
        buildSidebar();

        // Sync other data (still localStorage-based)
        await initSync();
        await initDocsSync();
        await initKanbanSync();
        await initPrismaSync();
        await loadSettingsFromCloud();

        // Re-render dashboard with projects loaded
        renderGlobalDash();

        // Load PRISMA from Supabase
        await loadPrismaFromSupabase();

        // Load notifications + start polling
        await loadNotifications();
        startNotificationPolling();

        setSyncStatus('Sincronizado', 'var(--green)');

        // Show user name in sidebar
        const userEl = document.getElementById('sidebar-user');
        if (userEl && state.profile) {
          userEl.textContent = '👤 ' + (state.profile.display_name || state.currentUser.email);
        }
      } catch (e) {
        setSyncStatus('Error', 'var(--red)');
        showToast('Error de sincronización', 'error', 4000);
        console.error('Sync error:', e);
      }
    } else {
      // Offline: load from cache, render
      await loadProjects();
      buildProjectSidebar();
      renderGlobalDash();
      setSyncStatus('Offline', 'var(--tx3)');
    }
  }, 1500);
})();
