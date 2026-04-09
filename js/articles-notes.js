// ============================================================
// CRISOL — articles-notes.js
// All notes view, export for AI, delete dialog, keyboard shortcuts
// Extracted from articles.js (Sprint S4)
// ============================================================

import { state } from './state.js';
import { ld, sv, gD } from './storage.js';
import { escH, showToast } from './utils.js';
import { advancePar, upd } from './articles.js';

// ============================================================
// DELETE DIALOG ENTRY
// ============================================================
window.deleteDlg = function(pid, idx) {
  if (!confirm('¿Borrar esta reflexión?')) return;
  const d = ld(); if (d.d && d.d[pid]) { d.d[pid].splice(idx, 1); if (d.d[pid].length === 0) delete d.d[pid]; sv(d); }
  const container = document.getElementById('e' + pid);
  if (container) {
    const entries = gD(pid);
    container.innerHTML = entries.map((e, i) => '<div class="de" style="position:relative;"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + escH(e.t) + '<span onclick="deleteDlg(\'' + pid + '\',' + i + ')" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--tx3);font-size:12px;opacity:0.4;transition:opacity 0.1s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4" title="Borrar">✕</span></div>').join('');
  }
  upd();
};

// ============================================================
// ALL NOTES VIEW + EXPORT FOR AI
// ============================================================
window.goAllNotes = function() {
  if (!state.DATA) return;
  const ct = state.ct; if (!ct) return;
  const d = ld();
  let h = `<div class="sb"><h3>Todas mis notas — ${state.DATA.meta.authors} (${state.DATA.meta.year})</h3></div>`;
  let count = 0;
  const claims = d.claims || {}; const notes = d.claimNotes || {};
  const claimItems = [];
  Object.entries(claims).forEach(([pid, type]) => {
    const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
    const si = parseInt(m[1]), pi = parseInt(m[2]);
    const sec = state.DATA.sections[si]; if (!sec) return;
    const par = sec.paragraphs[pi]; if (!par) return;
    claimItems.push({ type, sec: sec.title, title: par.title || ('§' + (si + 1) + ' p' + (pi + 1)), note: notes[pid] || '' });
  });
  if (claimItems.length) {
    h += `<h4 style="font-size:14px;color:var(--gold);margin:14px 0 6px;">Claims (${claimItems.length})</h4>`;
    claimItems.forEach(c => {
      const color = c.type === 'support' ? 'var(--green)' : c.type === 'contrast' ? 'var(--red)' : 'var(--tx3)';
      const icon = c.type === 'support' ? '✓' : c.type === 'contrast' ? '✗' : '―';
      h += `<div style="padding:6px 12px;margin:3px 0;border-left:2px solid ${color};font-size:14px;color:var(--tx2);">${icon} ${escH(c.sec)} · ${escH(c.title)}${c.note ? ' — ' + escH(c.note) : ''}</div>`;
      count++;
    });
  }
  const f = d.f || {};
  const eqs = [], ses = [], refs = [];
  Object.entries(f).forEach(([k, v]) => {
    if (!v) return;
    if (k.startsWith('eq-')) eqs.push({ k, v });
    else if (k.startsWith('se-')) ses.push({ k, v });
    else if (k.startsWith('rf')) refs.push({ k, v });
    else if (k.startsWith('pu')) refs.push({ k: k.replace('pu', 'Puente '), v });
    else if (k.startsWith('mp')) refs.push({ k: k.replace('mp', 'Mapa '), v });
  });
  if (eqs.length) { h += `<h4 style="font-size:14px;color:var(--amber);margin:14px 0 6px;">Interrogación elaborativa (${eqs.length})</h4>`; eqs.forEach(e => { h += `<div style="padding:6px 12px;margin:3px 0;border-left:2px solid var(--amber);font-size:14px;color:var(--tx2);">${escH(e.v)}</div>`; count++; }); }
  if (ses.length) { h += `<h4 style="font-size:14px;color:var(--purple);margin:14px 0 6px;">Auto-explicaciones (${ses.length})</h4>`; ses.forEach(e => { h += `<div style="padding:6px 12px;margin:3px 0;border-left:2px solid var(--purple);font-size:14px;color:var(--tx2);">${escH(e.v)}</div>`; count++; }); }
  if (refs.length) { h += `<h4 style="font-size:14px;color:var(--blue);margin:14px 0 6px;">Reflexiones y puente (${refs.length})</h4>`; refs.forEach(e => { h += `<div style="padding:6px 12px;margin:3px 0;border-left:2px solid var(--blue);font-size:14px;color:var(--tx2);">${escH(e.v)}</div>`; count++; }); }
  const dialogs = d.d || {};
  let dCount = 0;
  Object.entries(dialogs).forEach(([pid, arr]) => { arr.forEach(() => { dCount++; }); });
  if (dCount) {
    h += `<h4 style="font-size:14px;color:var(--green);margin:14px 0 6px;">Reflexiones por párrafo (${dCount})</h4>`;
    Object.entries(dialogs).forEach(([pid, arr]) => { arr.forEach(e => { h += `<div style="padding:6px 12px;margin:3px 0;border-left:2px solid var(--green);font-size:14px;color:var(--tx2);"><span style="color:var(--tx3);font-size:12px;">${new Date(e.d).toLocaleDateString()}</span> ${escH(e.t)}</div>`; count++; }); });
  }
  if (count === 0) { h += `<p style="color:var(--tx3);padding:20px;text-align:center;">Aún no has escrito notas para este artículo.</p>`; ct.innerHTML = h; return; }
  h = h.replace('</h3></div>', `</h3></div><p style="font-size:14px;color:var(--tx2);margin-bottom:10px;">${count} notas en total</p>`);
  h += `<div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(220,215,205,0.06);">`;
  h += `<h4 style="font-size:14px;color:var(--gold);margin-bottom:8px;">Exportar para IA</h4>`;
  h += `<p style="font-size:13px;color:var(--tx3);margin-bottom:8px;">Genera un bloque de texto con cada párrafo anotado + tus reflexiones, listo para pegar en una IA.</p>`;
  h += `<div style="display:flex;gap:8px;"><button class="btn bg" onclick="exportNotesForAI()">📋 Copiar al portapapeles</button><button class="btn bo" onclick="exportNotesForAIFile()">💾 Descargar .txt</button></div>`;
  h += `</div>`;
  ct.innerHTML = h;
};

window.exportNotesForAI = function() {
  const text = buildNotesForAI();
  navigator.clipboard.writeText(text).then(() => showToast('Copiado al portapapeles (' + text.split('\n').length + ' líneas)', 'success', 3000));
};

window.exportNotesForAIFile = function() {
  const text = buildNotesForAI();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'CRISOL_notas_' + state.currentArticleKey + '_para_IA.txt'; a.click();
};

// KEYBOARD SHORTCUTS (registered once)
// ============================================================
document.addEventListener('keydown', function (e) {
  // Ctrl+F shortcut for article search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && state.currentPanel === 'texto') {
    e.preventDefault();
    const inp = document.getElementById('search-input');
    if (inp) inp.focus();
  }
  if (e.target.matches('textarea,input')) return;
  if (state.currentPanel !== 'texto') return;
  const openAcc = document.querySelector('.pb-acc.open');
  if (!openAcc) return;
  const pid = openAcc.id.replace('acc-', '');
  if (e.key === 'Enter') {
    const m = pid.match(/^p(\d+)-(\d+)$/);
    if (m) advancePar(parseInt(m[1]), parseInt(m[2]));
  }
  if (e.key === 's' || e.key === 'S') { const btn = document.querySelector('#body-' + pid + ' .claim-btn.support'); if (btn) btn.click(); }
  if (e.key === 'c' || e.key === 'C') { const btn = document.querySelector('#body-' + pid + ' .claim-btn.contrast'); if (btn) btn.click(); }
  if (e.key === 'n' || e.key === 'N') { const btn = document.querySelector('#body-' + pid + ' .claim-btn.neutral'); if (btn) btn.click(); }
});
