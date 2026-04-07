// ============================================================
// CRISOL — utils.js  (Utilities + barrel re-exports)
// Own utility functions + late-bound wrappers + re-exports
// ============================================================

import { state } from './state.js';

// ============================================================
// OWN UTILITIES
// ============================================================

export function escH(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Input validation ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(str) { return EMAIL_RE.test(str); }
export function sanitizeText(str, maxLen = 500) {
  if (!str) return '';
  return String(str).trim().substring(0, maxLen);
}

export function linkify(str) {
  if (!str) return '';
  return escH(str).replace(
    /(https?:\/\/[^\s&]+)/g,
    '<a href="$1" target="_blank" onclick="event.stopPropagation()" style="color:var(--blue);">$1</a>'
  );
}

export function hl(t) {
  if (!state.DATA || !state.DATA.meta || !state.DATA.meta.highlights) return t;
  const H = state.DATA.meta.highlights;
  let r = t;
  if (H.key) H.key.sort((a, b) => b.length - a.length).forEach(k => {
    r = r.split(k).join('<span class="hl-key">' + k + '</span>');
  });
  if (H.examples) H.examples.sort((a, b) => b.length - a.length).forEach(e => {
    r = r.split(e).join('<span class="hl-example">' + e + '</span>');
  });
  if (H.authors) H.authors.sort((a, b) => b.length - a.length).forEach(a => {
    if (!r.includes('>' + a + '<')) r = r.split(a).join('<span class="hl-author">' + a + '</span>');
  });
  if (H.terms) H.terms.sort((a, b) => b.length - a.length).forEach(m => {
    if (!r.includes('>' + m + '<')) {
      const rx = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      r = r.replace(rx, x => '<span class="hl-term">' + x + '</span>');
    }
  });
  return r;
}

export function showToast(msg, type = 'info', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, duration);
}

export function setSyncStatus(msg, color) {
  const el = document.getElementById('sync-status');
  if (el) { el.textContent = msg; el.style.color = color || 'var(--tx3)'; }
}

export function closeSidebarMobile() {
  if (window.innerWidth <= 768) {
    document.querySelector('.sidebar')?.classList.remove('sb-open');
    document.getElementById('sb-overlay')?.classList.remove('sb-open');
  }
}

export function calcProgress() {
  const d = state._ld ? state._ld() : {};
  let readWords = 0;
  if (!state.DATA) return;
  state.DATA.sections.forEach((sec, si) => {
    sec.paragraphs.forEach((par, pi) => {
      if ((d.chk || {})[`c${si}-${pi}`]) readWords += state.WORD_COUNTS[si][pi];
    });
  });
  const pct = state.TOTAL_WORDS > 0 ? Math.round(readWords / state.TOTAL_WORDS * 100) : 0;
  const el = document.getElementById('reading-pct');
  if (el) el.textContent = pct + '%';
  const bar = document.getElementById('reading-fill');
  if (bar) bar.style.width = pct + '%';
  const sp = document.getElementById('side-pct-' + state.currentArticleKey);
  if (sp) sp.textContent = pct + '%';
  const sf = document.getElementById('side-fill-' + state.currentArticleKey);
  if (sf) sf.style.width = pct + '%';
}

// ============================================================
// LATE-BOUND WRAPPERS (registered by app.js / projects.js on state)
// These break circular dependencies: modules import from utils.js,
// app.js/projects.js register the real implementations on state.
// ============================================================

export function goHome() { if (state._goHome) state._goHome(); }
export function updateTopbar() { if (state._updateTopbar) state._updateTopbar(); }
export function buildSidebar() { if (state._buildSidebar) state._buildSidebar(); }
export function buildDocSidebar() { if (state._buildDocSidebar) state._buildDocSidebar(); }
export function buildProjectSidebar() { if (state._buildProjectSidebar) state._buildProjectSidebar(); }
export function updateSidebarKPIs() { if (state._updateSidebarKPIs) state._updateSidebarKPIs(); }
export function ensureToolsOpen() { if (state._ensureToolsOpen) state._ensureToolsOpen(); }
export function getBreadcrumb() { return state._getBreadcrumb ? state._getBreadcrumb() : ''; }

// Project helpers (late-bound, registered by projects.js)
export function getProjects() { return state._getProjects ? state._getProjects() : []; }
export function saveProjects(p) { if (state._saveProjects) state._saveProjects(p); }
export function getProjectsForDoc(id) { return state._getProjectsForDoc ? state._getProjectsForDoc(id) : []; }
export function getProjectsForArticle(key) { return state._getProjectsForArticle ? state._getProjectsForArticle(key) : []; }
export function renderProjectBadges(p) { return state._renderProjectBadges ? state._renderProjectBadges(p) : ''; }
export function renderProjectsSummary() { return state._renderProjectsSummary ? state._renderProjectsSummary() : ''; }
export function getProjectClaims(proj) { return state._getProjectClaims ? state._getProjectClaims(proj) : {support:[],contrast:[],neutral:[]}; }
export function calcDaysRemaining(d) { return state._calcDaysRemaining ? state._calcDaysRemaining(d) : Infinity; }
export function calcProjectAlert(p, d) { return state._calcProjectAlert ? state._calcProjectAlert(p, d) : ''; }
export function renderProjectDash(id) { if (state._renderProjectDash) state._renderProjectDash(id); }
export function renderMiTesis() { if (state._renderMiTesis) state._renderMiTesis(); }

// ============================================================
// RE-EXPORTS from other modules (no circular dep issues)
// ============================================================

export {
  loadArticle, initArticleData, saveNavState, restoreNavState,
  getArticleTags, togglePar, renderSub, getClaim, getClaimNote
} from './articles.js';

export { getKanban, saveKanban, renderKanbanInline } from './kanban.js';

export { dictWrap } from './dictation.js';
