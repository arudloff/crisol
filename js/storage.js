// ============================================================
// CRISOL — storage.js  (localStorage abstraction layer)
// Extracted from SILA v4 monolith · data layer module
// ============================================================

import { state } from './state.js';

// --------------- save hook (for external observers) ---------------
let _saveHook = null;
export function setSaveHook(fn) { _saveHook = fn; }

// --------------- user-namespaced key helper ---------------
// All localStorage keys get user ID prefix for multi-user safety
export function userKey(base) {
  const uid = state.currentUser?.id;
  return uid ? base + '_' + uid : base;
}

// --------------- storage key (article-specific) ---------------
export function getSK() {
  return userKey('sila4_' + state.currentArticleKey);
}

// --------------- one-time legacy migration ---------------
export function migrateLegacy() {
  const old = localStorage.getItem('sila4');
  if (!old) return;
  try {
    // Only migrate to the FIRST article (bustamante) since that's where data was created
    if (!localStorage.getItem('sila4_bustamante_2004')) {
      localStorage.setItem('sila4_bustamante_2004', old);
    }
    localStorage.removeItem('sila4'); // remove shared key to prevent future contamination
    console.log('Migrated sila4 → sila4_bustamante_2004');
  } catch (e) { console.error('Migration error:', e); }
}

// --------------- load / save ---------------
export function ld() {
  try {
    return JSON.parse(localStorage.getItem(getSK())) || {};
  } catch (e) { return {}; }
}

export function sv(d) {
  d._lastSync = new Date().toISOString();

  // Notify external hook before persisting (e.g. sync layer)
  if (_saveHook) _saveHook(d);

  try {
    localStorage.setItem(getSK(), JSON.stringify(d));
  } catch (e) {
    console.error('Save error:', e);
    if (typeof showToast === 'function') {
      showToast('Error al guardar — almacenamiento lleno', 'error', 5000);
    }
  }
}

// --------------- data accessors ---------------
// Dialogs
export function gD(id) { return (ld().d || {})[id] || []; }
export function aD(id, t) {
  const d = ld();
  if (!d.d) d.d = {};
  if (!d.d[id]) d.d[id] = [];
  d.d[id].push({ t, d: new Date().toISOString() });
  sv(d);
}

// Paragraph states
export function gP(id) { return (ld().p || {})[id] || false; }
export function sP(id, v) {
  const d = ld();
  if (!d.p) d.p = {};
  d.p[id] = v;
  sv(d);
}

// Thermometer values
export function gT(id) { return (ld().t || {})[id] || null; }
export function sT(id, v) {
  const d = ld();
  if (!d.t) d.t = {};
  d.t[id] = v;
  sv(d);
}

// Checkboxes (backwards compat: true or ISO timestamp)
export function gC(id) {
  const v = (ld().chk || {})[id];
  return v === true || typeof v === 'string';
}
export function sC(id, v) {
  const d = ld();
  if (!d.chk) d.chk = {};
  d.chk[id] = v ? new Date().toISOString() : false;
  sv(d);
  calcProgress();
}

// Free-form fields
export function svF(k, v) {
  const d = ld();
  if (!d.f) d.f = {};
  d.f[k] = v;
  sv(d);
}
export function gF(k) { return (ld().f || {})[k] || ''; }

// --------------- progress calculation ---------------
export function calcProgress() {
  const d = ld();
  let readWords = 0;
  const DATA = state.DATA;
  const WORD_COUNTS = state.WORD_COUNTS;
  const TOTAL_WORDS = state.TOTAL_WORDS;

  if (DATA && DATA.sections) {
    DATA.sections.forEach((sec, si) => {
      sec.paragraphs.forEach((par, pi) => {
        if ((d.chk || {})[`c${si}-${pi}`]) readWords += WORD_COUNTS[si][pi];
      });
    });
  }

  const pct = TOTAL_WORDS > 0 ? Math.round(readWords / TOTAL_WORDS * 100) : 0;
  const el = document.getElementById('reading-pct');
  if (el) el.textContent = pct + '%';
  const bar = document.getElementById('reading-fill');
  if (bar) bar.style.width = pct + '%';
  const sp = document.getElementById('side-pct-' + state.currentArticleKey);
  if (sp) sp.textContent = pct + '%';
  const sf = document.getElementById('side-fill-' + state.currentArticleKey);
  if (sf) sf.style.width = pct + '%';
}

// --------------- clear / reset (exposed on window) ---------------
export function clearField(k, taId) {
  if (!confirm('¿Borrar este contenido guardado?')) return;
  const d = ld();
  if (d.f && d.f[k]) { delete d.f[k]; sv(d); }
  const ta = document.getElementById(taId);
  if (ta) ta.value = '';
}

export function executeReset() {
  const confirmEl = document.getElementById('reset-confirm');
  if (!confirmEl || confirmEl.value.trim().toUpperCase() !== 'RESET') {
    alert('Escribe RESET en mayúsculas para confirmar.'); return;
  }
  const d = ld();
  let changes = [];
  if (document.getElementById('reset-progress') && document.getElementById('reset-progress').checked) {
    delete d.chk; delete d.p; changes.push('progreso');
  }
  if (document.getElementById('reset-elaborative') && document.getElementById('reset-elaborative').checked) {
    if (d.f) { Object.keys(d.f).forEach(k => { if (k.startsWith('eq-')) delete d.f[k]; }); changes.push('elaborativas'); }
  }
  if (document.getElementById('reset-selfexp') && document.getElementById('reset-selfexp').checked) {
    if (d.f) { Object.keys(d.f).forEach(k => { if (k.startsWith('se-')) delete d.f[k]; }); changes.push('auto-explicaciones'); }
  }
  if (document.getElementById('reset-dialogs') && document.getElementById('reset-dialogs').checked) {
    delete d.d; changes.push('reflexiones');
  }
  if (document.getElementById('reset-thermo') && document.getElementById('reset-thermo').checked) {
    delete d.t; changes.push('termómetros');
  }
  if (changes.length === 0) { alert('Selecciona al menos una opción.'); return; }
  sv(d);
  alert('Reset completado: ' + changes.join(', ') + '.\nLos claims y sus notas se conservaron.');
}

// --------------- global bindings ---------------
window.executeReset = executeReset;
window.clearField = clearField;
