// ============================================================
// CRISOL — articles.js  (article loading, rendering & interaction)
// Extracted from SILA v4 monolith · largest module
// ============================================================

import { state } from './state.js';
import { ld, sv, gD, aD, gP, sP, gT, sT, gC, sC, svF, gF, calcProgress } from './storage.js';
import { escH, linkify, showToast } from './utils.js';

// ============================================================
// LAZY LOAD — load article .js on demand
// ============================================================
export function loadArticle(key) {
  return new Promise((resolve, reject) => {
    if (!key) { reject(new Error('No article key')); return; }
    window.SILA_ARTICLES = window.SILA_ARTICLES || {};
    if (window.SILA_ARTICLES[key]) { resolve(); return; }
    // Check if this is a Supabase-imported article (already injected by loadImportedArticles)
    // If not found, try loading from static data/ files
    const s = document.createElement('script');
    s.src = 'data/' + key + '.js';
    s.onload = () => {
      if (window.SILA_ARTICLES[key]) resolve();
      else reject(new Error('Script cargó pero artículo no definido: ' + key));
    };
    s.onerror = () => reject(new Error('No se encontró data/' + key + '.js'));
    document.head.appendChild(s);
  });
}

// ============================================================
// HIGHLIGHT ENGINE
// ============================================================
export function hl(t) {
  if (!state.DATA || !state.DATA.meta || !state.DATA.meta.highlights) return t;
  const H = state.DATA.meta.highlights;
  let r = t;
  if (H.key) H.key.sort((a, b) => b.length - a.length).forEach(k => { r = r.split(k).join('<span class="hl-key">' + k + '</span>'); });
  if (H.examples) H.examples.sort((a, b) => b.length - a.length).forEach(e => { r = r.split(e).join('<span class="hl-example">' + e + '</span>'); });
  if (H.authors) H.authors.sort((a, b) => b.length - a.length).forEach(a => { if (!r.includes('>' + a + '<')) r = r.split(a).join('<span class="hl-author">' + a + '</span>'); });
  if (H.terms) H.terms.sort((a, b) => b.length - a.length).forEach(m => { if (!r.includes('>' + m + '<')) { const rx = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); r = r.replace(rx, x => '<span class="hl-term">' + x + '</span>'); } });
  return r;
}

// ============================================================
// INIT ARTICLE DATA
// ============================================================
export function initArticleData() {
  state.DATA = window.SILA_ARTICLES[state.currentArticleKey];
  if (!state.DATA) return;
  state.WORD_COUNTS = []; state.TOTAL_WORDS = 0;
  state.DATA.sections.forEach(sec => {
    const arr = [];
    sec.paragraphs.forEach(par => {
      const mt = par.translation || par.text;
      const wc = mt.split(/\s+/).length;
      arr.push(wc);
      state.TOTAL_WORDS += wc;
    });
    state.WORD_COUNTS.push(arr);
  });
  state.currentSubSec = 0;
  state.searchQuery = '';
}

// ============================================================
// NAVIGATION STATE MEMORY
// ============================================================
const navMemory = (function () { try { return JSON.parse(localStorage.getItem('sila_navMemory')) || {}; } catch (e) { return {}; } })();
let lastOpenPar = null;

function persistNavMemory() { try { localStorage.setItem('sila_navMemory', JSON.stringify(navMemory)); } catch (e) { } }

export function saveNavState() {
  const ct = state.ct;
  if (state.currentDocId) {
    navMemory['doc_' + state.currentDocId] = { scrollTop: ct.scrollTop };
    persistNavMemory();
  } else if (state.currentArticleKey && state.DATA && state.currentPanel !== 'dashboard') {
    navMemory['art_' + state.currentArticleKey] = {
      panel: state.currentPanel,
      subSec: state.currentSubSec,
      scrollTop: ct.scrollTop,
      openPar: lastOpenPar
    };
    persistNavMemory();
  }
}

export function restoreNavState(key) {
  const s = navMemory[key];
  if (!s) return false;
  if (key.startsWith('art_')) {
    state.currentPanel = s.panel || 'dashboard';
    state.currentSubSec = s.subSec || 0;
    render();
    // Activate correct topbar tab
    const panelNames = ['dashboard', 'prelectura', 'puente', 'texto', 'glosario', 'reflexiones', 'mapa', 'flashcards', 'ayuda'];
    const artBar = document.getElementById('topbar-article');
    if (artBar) { artBar.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', panelNames[i] === state.currentPanel)); }
    // If we were on texto tab, need to wait for sub-section to render, then open paragraph
    if (s.panel === 'texto' && s.openPar) {
      setTimeout(() => {
        if (typeof switchSub === 'function') switchSub(s.subSec || 0);
        setTimeout(() => {
          const acc = document.getElementById('acc-' + s.openPar);
          if (acc) { togglePar(s.openPar); acc.scrollIntoView({ behavior: 'auto', block: 'center' }); }
        }, 200);
      }, 200);
    } else if (s.scrollTop) {
      setTimeout(() => { state.ct.scrollTop = s.scrollTop; }, 100);
    }
  } else if (key.startsWith('doc_')) {
    if (state.renderDocEditor) state.renderDocEditor();
    if (s.scrollTop) setTimeout(() => { state.ct.scrollTop = s.scrollTop; }, 50);
  }
  return true;
}
window.restoreNavState = restoreNavState;

// ============================================================
// COLUMN COUNT
// ============================================================
let colCount = parseInt(localStorage.getItem('sila_cols')) || 2;

export function setCol(n, el) {
  colCount = n;
  localStorage.setItem('sila_cols', n);
  document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const w = document.getElementById('cols-wrap');
  if (w) w.style.columnCount = n;
  if (state.syncSettingsToCloud) state.syncSettingsToCloud();
}
window.setCol = setCol;

// ============================================================
// BREADCRUMB
// ============================================================
function getBreadcrumb() {
  let parts = ['<span style="cursor:pointer;color:var(--gold);" onclick="goHome()">YUNQUE</span>'];
  if (window._isPrisma) { parts.push('PRISMA'); return '<div style="font-size:11px;color:var(--tx3);margin-bottom:8px;">' + parts.join(' <span style="opacity:0.5;">›</span> ') + '</div>'; }
  if (state.isHome) parts.push('Vista general');
  else if (state.isMiTesis) parts.push('Mi tesis');
  else if (state.currentDocId) {
    const docs = state.getDocs ? state.getDocs() : [];
    const doc = docs.find(d => d.id === state.currentDocId);
    parts.push('Escritos');
    if (doc) parts.push(doc.title);
  } else if (state.DATA && state.DATA.meta) {
    parts.push(state.DATA.meta.authors + ' (' + state.DATA.meta.year + ')');
    const names = { dashboard: 'Dashboard', prelectura: 'Pre-lectura', puente: 'Puente', texto: 'Texto anotado', glosario: 'Glosario', reflexiones: 'Reflexiones', mapa: 'Mapa', flashcards: 'Flashcards', ayuda: 'Ayuda' };
    if (names[state.currentPanel]) parts.push(names[state.currentPanel]);
  }
  return '<div style="font-size:11px;color:var(--tx3);margin-bottom:8px;">' + parts.join(' <span style="opacity:0.5;">›</span> ') + '</div>';
}
export { getBreadcrumb };

// ============================================================
// APPLY CUSTOM REVISION DATES
// ============================================================
function applyCustomRevDates() {
  if (!state.DATA || !state.DATA.flujo || !state.DATA.flujo.revision) return;
  const ud = ld();
  if (ud.revDates && ud.revDates.length === state.DATA.flujo.revision.length) {
    ud.revDates.forEach((d, i) => { state.DATA.flujo.revision[i].fecha = d; });
  }
}

// ============================================================
// CHECK BIAS
// ============================================================
function checkBias() {
  const d = ld(); const claims = d.claims || {};
  let s = 0, c = 0; Object.values(claims).forEach(v => { if (v === 'support') s++; if (v === 'contrast') c++; });
  const total = s + c; if (total < 5) return '';
  const ratio = s / total;
  if (ratio > 0.85) return `<div style="background:rgba(232,168,56,0.06);border:1px solid rgba(232,168,56,0.2);border-radius:8px;padding:12px 16px;margin:10px 0;"><span style="font-size:14px;color:var(--gold);">⚠ Sesgo potencial: ${Math.round(ratio * 100)}% de tus claims apoyan tu tesis (${s}/${total}). ¿Estás buscando activamente argumentos que desafíen tu posición?</span></div>`;
  if (ratio < 0.15) return `<div style="background:rgba(224,112,80,0.06);border:1px solid rgba(224,112,80,0.2);border-radius:8px;padding:12px 16px;margin:10px 0;"><span style="font-size:14px;color:var(--red);">⚠ Solo ${Math.round(ratio * 100)}% de claims apoyan tu tesis. ¿El artículo realmente contrasta tanto, o necesitas repensar cómo se conecta con tu argumento?</span></div>`;
  return '';
}

// ============================================================
// DICTATION WRAPPER (imported from dictation module at runtime)
// Falls back to raw textarea if dictation module not loaded
// ============================================================
function dictWrap(textareaHtml, id) {
  // If dictation module provides it, use that; otherwise fallback
  if (window._dictWrap) return window._dictWrap(textareaHtml, id);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return textareaHtml;
  return `<div class="dict-wrap">${textareaHtml}<button class="dict-btn" onclick="toggleDictation(this,'${id}')" title="Dictar por voz">🎤</button></div>`;
}

// ============================================================
// RENDER (main dispatcher)
// ============================================================
export function render() {
  // Don't render article if user is on home, project, doc, or PRISMA
  if (state.isHome || state.currentProjectId || state.currentDocId || window._isPrisma) return;
  if (!state.DATA) { state.ct.innerHTML = getBreadcrumb() + '<div style="text-align:center;padding:40px;color:var(--tx3);">Selecciona un artículo del sidebar para comenzar.</div>'; return; }
  if (state.currentPanel === 'dashboard') { renderDash(); return; }
  if (state.currentPanel === 'texto') { renderTexto(); return; }
  if (state.currentPanel === 'prelectura') { renderPreLectura(); return; }
  if (state.currentPanel === 'puente') { renderPuente(); return; }
  if (state.currentPanel === 'reflexiones') { renderReflexiones(); return; }
  if (state.currentPanel === 'mapa') { renderMapa(); return; }
  if (state.currentPanel === 'glosario') { renderGlosario(); return; }
  if (state.currentPanel === 'flashcards') { if (state.renderFlashcards) state.renderFlashcards(); return; }
}

// ============================================================
// RENDER DASH (article dashboard)
// ============================================================
export function renderDash() {
  const ct = state.ct;
  const DATA = state.DATA;
  applyCustomRevDates();
  const m = DATA.meta;
  const nSec = DATA.sections.length;
  const wt = m.weight === 'critico' ? '◆◆◆ Crítico' : m.weight === 'importante' ? '◆◆ Importante' : '◆ Complementario';
  const renderProjectBadges = state.renderProjectBadges || (() => '');
  const getProjectsForArticle = state.getProjectsForArticle || (() => []);

  ct.innerHTML = getBreadcrumb() + `<h2 style="font-size:clamp(17px,2.5vw,24px);font-weight:800;color:#fff;margin-bottom:6px;">${m.authors} (${m.year})</h2>
  <p style="font-size:15px;color:var(--tx2);line-height:1.5;">${m.title}<br><span style="color:var(--blue);">${m.journal} · ${m.institution}</span></p>
  <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">
    <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(93,187,138,0.08);border:1px solid rgba(93,187,138,0.18);border-radius:6px;padding:5px 14px;font-size:14px;color:var(--green);font-weight:600;">● Fidelidad ${m.fidelity}% — ${state.TOTAL_WORDS} palabras</span>
    <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(232,168,56,0.08);border:1px solid rgba(232,168,56,0.18);border-radius:6px;padding:5px 14px;font-size:14px;color:var(--gold);font-weight:600;">${wt}</span>
    <div class="lg"><span><div class="lc" style="background:var(--hla)"></div>Autores</span><span><div class="lc" style="background:var(--hlt)"></div>Términos</span><span><div class="lc" style="background:var(--hlk)"></div>Clave</span><span><div class="lc" style="background:var(--hle)"></div>Ejemplos</span></div>
  </div>
  ${renderProjectBadges(getProjectsForArticle(state.currentArticleKey))}
  ${renderArticleTagsHtml(state.currentArticleKey)}
  <div style="margin:8px 0;"><button class="btn bo" onclick="showShareArticleModal('${state.currentArticleKey}')" style="font-size:12px;color:var(--purple);border-color:var(--purple);">📤 Compartir artículo</button></div>
  <div class="kr">
    <div class="ki kg"><div class="n">${nSec}</div><div class="l">Secciones</div></div>
    <div class="ki kgr"><div class="n">${m.concepts || 0}</div><div class="l">Conceptos</div></div>
    <div class="ki kb"><div class="n">${m.cards || 0}</div><div class="l">Flashcards</div></div>
    <div class="ki"><div class="n" id="da">0</div><div class="l">Mis notas</div></div>
  </div>
  <div id="claims-summary"></div>`;

  // Continue reading button
  const ud = ld();
  const totalPars = DATA.sections.reduce((a, s) => a + s.paragraphs.length, 0);
  const readPars = Object.keys(ud.chk || {}).filter(k => ud.chk[k]).length;
  const pct = totalPars ? Math.round(readPars / totalPars * 100) : 0;
  const navState2 = navMemory['art_' + state.currentArticleKey];
  const panelLabels = { dashboard: 'Dashboard', prelectura: 'Pre-lectura', puente: 'Puente', texto: 'Texto anotado', glosario: 'Glosario', reflexiones: 'Reflexiones', mapa: 'Mapa', flashcards: 'Flashcards' };

  // Priority 1: navMemory (where user actually was)
  if (navState2 && navState2.panel && navState2.panel !== 'dashboard') {
    const label = panelLabels[navState2.panel] || navState2.panel;
    let detail = label;
    if (navState2.panel === 'texto' && navState2.openPar) {
      const parts = navState2.openPar.replace('p', '').split('-');
      const si = parseInt(parts[0]), pi = parseInt(parts[1]);
      if (DATA.sections[si]) {
        const parTitle = DATA.sections[si].paragraphs[pi]?.title || ('Párrafo ' + (pi + 1));
        detail = DATA.sections[si].title + ' · ' + parTitle;
      }
    }
    ct.innerHTML += `<div style="background:rgba(93,155,213,0.06);border:1px solid rgba(93,155,213,0.18);border-radius:10px;padding:16px 20px;margin:14px 0;cursor:pointer;transition:all 0.12s;" onclick="restoreNavState('art_${state.currentArticleKey}');updateTopbar();" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='rgba(93,155,213,0.18)'">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-size:14px;color:var(--blue);font-weight:600;margin-bottom:4px;">▶ Retomar donde quedaste</div>
      <div style="font-size:14px;color:var(--tx);">${detail}</div>
      <div style="font-size:13px;color:var(--tx3);margin-top:2px;">${readPars}/${totalPars} párrafos leídos</div></div>
      <div style="font-size:28px;font-weight:800;color:var(--blue);">${pct}%</div>
    </div></div>`;
  } else {
    // Priority 2: first unread paragraph
    let resumeSi = -1, resumePi = -1;
    for (let si = 0; si < DATA.sections.length && resumeSi < 0; si++) {
      for (let pi = 0; pi < DATA.sections[si].paragraphs.length; pi++) {
        if (!(ud.chk || {})[`c${si}-${pi}`]) { resumeSi = si; resumePi = pi; break; }
      }
    }
    if (resumeSi >= 0) {
      const sec = DATA.sections[resumeSi]; const parTitle = sec.paragraphs[resumePi].title || ('Párrafo ' + (resumePi + 1));
      ct.innerHTML += `<div style="background:rgba(93,155,213,0.06);border:1px solid rgba(93,155,213,0.18);border-radius:10px;padding:16px 20px;margin:14px 0;cursor:pointer;transition:all 0.12s;" onclick="sp('texto',document.querySelectorAll('.tab')[3]);setTimeout(()=>{switchSub(${resumeSi});setTimeout(()=>togglePar('p${resumeSi}-${resumePi}'),200);},100);" onmouseover="this.style.borderColor='var(--blue)'" onmouseout="this.style.borderColor='rgba(93,155,213,0.18)'">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:14px;color:var(--blue);font-weight:600;margin-bottom:4px;">▶ Continuar lectura</div>
        <div style="font-size:14px;color:var(--tx);">${sec.title} · ${parTitle}</div>
        <div style="font-size:13px;color:var(--tx3);margin-top:2px;">${readPars}/${totalPars} párrafos leídos</div></div>
        <div style="font-size:28px;font-weight:800;color:var(--blue);">${pct}%</div>
      </div></div>`;
    } else if (DATA.sections.length > 0) {
      ct.innerHTML += `<div style="background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.18);border-radius:10px;padding:14px 20px;margin:14px 0;text-align:center;"><span style="font-size:14px;color:var(--green);font-weight:600;">✓ Lectura completa — todos los párrafos leídos</span></div>`;
    }
  }

  // Quick actions
  ct.innerHTML += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;">
    <button class="btn bo" onclick="goAllNotes()" style="font-size:13px;">📋 Todas mis notas</button>
    <button class="btn bo" onclick="goStudyMode()" style="font-size:13px;">🧠 Modo estudio flashcards</button>
  </div>`;

  // Downloads
  if (m.downloads) {
    ct.innerHTML += `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Documentos para imprimir</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a href="${m.downloads.docx}" download style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(93,155,213,0.1);border:1px solid rgba(93,155,213,0.25);border-radius:7px;color:var(--blue);font-size:14px;font-weight:600;text-decoration:none;transition:all 0.12s;">📄 Documento YUNQUE (.docx)</a>
      <a href="${m.downloads.fuente}" download style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(232,168,56,0.1);border:1px solid rgba(232,168,56,0.25);border-radius:7px;color:var(--gold);font-size:14px;font-weight:600;text-decoration:none;transition:all 0.12s;">📝 Texto fuente (.txt)</a>
    </div>`;
  }

  // Revision dates
  if (DATA.flujo && DATA.flujo.revision) {
    const revState = (ud.revState || {});
    ct.innerHTML += `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Revisión espaciada <span onclick="setRevisionBaseDate()" style="font-size:12px;color:var(--tx3);cursor:pointer;margin-left:8px;" title="Recalcular fechas desde una fecha base">📅 Ajustar fechas</span></h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${DATA.flujo.revision.map((r, ri) => {
      const s2 = revState['rev' + ri] || 'pending';
      const isDone = s2 === 'done' || (!['pending', 'suspended', 'discarded'].includes(s2) && s2);
      const doneDate = isDone && s2 !== 'done' ? s2 : null;
      const isSuspended = s2 === 'suspended';
      const isDiscarded = s2 === 'discarded';
      const _n = new Date(); const todayStr = _n.getFullYear() + '-' + String(_n.getMonth() + 1).padStart(2, '0') + '-' + String(_n.getDate()).padStart(2, '0');
      const past = r.fecha < todayStr;
      let borderColor, statusText, statusColor;
      if (isDone) { borderColor = 'var(--green)'; statusText = '✓ Completada' + (doneDate ? ' ' + new Date(doneDate).toLocaleDateString() : ''); statusColor = 'var(--green)'; }
      else if (isSuspended) { borderColor = 'var(--amber)'; statusText = '⏸ Suspendida'; statusColor = 'var(--amber)'; }
      else if (isDiscarded) { borderColor = 'var(--tx3)'; statusText = '✗ Descartada'; statusColor = 'var(--tx3)'; }
      else if (past) { borderColor = 'var(--red)'; statusText = '⚠ Vencida'; statusColor = 'var(--red)'; }
      else { borderColor = 'var(--blue)'; statusText = '📅 ' + r.fecha; statusColor = 'var(--gold)'; }
      const mkBtn = (st, icon, label2, color, active) => '<button class="btn ' + (active ? 'bg' : 'bo') + '" onclick="setRevState(' + ri + ',\'' + st + '\')" style="font-size:11px;padding:3px 0;flex:1;' + (active ? 'background:' + color + ';color:#000;border-color:' + color : 'color:' + color) + ';" title="' + label2 + '">' + icon + '</button>';
      let btns = '<div style="display:flex;gap:3px;margin-top:6px;">';
      btns += mkBtn('pending', '▶', 'Pendiente', 'var(--blue)', !isDone && !isSuspended && !isDiscarded);
      btns += mkBtn('done', '✓', 'Completada', 'var(--green)', isDone);
      btns += mkBtn('suspended', '⏸', 'Suspendida', 'var(--amber)', isSuspended);
      btns += mkBtn('discarded', '✗', 'Descartada', 'var(--tx3)', isDiscarded);
      btns += '</div>';
      return '<div style="flex:1;min-width:180px;padding:10px 14px;background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:7px;border-left:3px solid ' + borderColor + ';">'
        + '<div style="font-size:14px;font-weight:600;color:#fff;">' + r.sesion + '</div>'
        + '<div style="font-size:13px;color:var(--tx2);margin-top:4px;">' + r.tiempo + ' · ' + r.tareas + '</div>'
        + '<div style="font-size:13px;color:' + statusColor + ';margin-top:4px;">' + statusText + '</div>'
        + btns + '</div>';
    }).join('')}</div>`;
  }

  // Reset study panel (collapsible)
  ct.innerHTML += `<div style="margin-top:24px;border-top:1px solid rgba(220,215,205,0.06);padding-top:14px;">
  <div class="subsec-head" onclick="togSub(this)" style="font-size:13px;color:var(--tx3);padding:6px 12px;"><span class="schv">▸</span> Reset de estudio</div>
  <div class="subsec-body" style="padding:12px 16px;background:var(--bg2);border-radius:0 0 8px 8px;">
    <p style="font-size:13px;color:var(--tx3);margin-bottom:10px;">Selecciona qué resetear para re-estudiar el artículo. Los claims y sus notas se conservan siempre.</p>
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:var(--tx2);cursor:pointer;">
      <input type="checkbox" id="reset-progress" style="margin-top:3px;"> <span><b>Progreso de lectura</b> — desmarca todos los párrafos y secciones como no leídos</span></label>
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:var(--tx2);cursor:pointer;">
      <input type="checkbox" id="reset-elaborative" style="margin-top:3px;"> <span><b>Respuestas elaborativas</b> (¿Por qué?) — borra tus respuestas para rehacerlas</span></label>
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:var(--tx2);cursor:pointer;">
      <input type="checkbox" id="reset-selfexp" style="margin-top:3px;"> <span><b>Auto-explicaciones</b> (Explicar) — borra para rehacer como retrieval practice</span></label>
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:var(--tx2);cursor:pointer;">
      <input type="checkbox" id="reset-dialogs" style="margin-top:3px;"> <span><b>Reflexiones por párrafo</b> — borra las notas libres de cada párrafo</span></label>
    <label style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:14px;color:var(--tx2);cursor:pointer;">
      <input type="checkbox" id="reset-thermo" style="margin-top:3px;"> <span><b>Termómetros de confianza</b> — resetea la autoevaluación por sección</span></label>
    <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
      <input type="text" id="reset-confirm" placeholder="Escribe RESET para confirmar" style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid rgba(220,215,205,0.1);background:var(--bg);color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">
      <button class="btn bo" onclick="executeReset()" style="border-color:var(--red);color:var(--red);white-space:nowrap;">Ejecutar reset</button>
    </div>
  </div></div>`;
  upd();
}

// ============================================================
// PRE-LECTURA
// ============================================================
let currentPlSub = 0;

export function renderPreLectura() {
  const ct = state.ct;
  const DATA = state.DATA;
  const P = DATA.prelectura;
  if (!P) { ct.innerHTML = '<div class="sb"><h3>Sección A — Pre-lectura</h3></div><p style="color:var(--tx3);padding:20px;">Datos de pre-lectura no disponibles para este artículo.</p>'; return; }
  let h = '<div class="sb"><h3>Sección A — Pre-lectura (~7 min)</h3></div>';
  h += '<p style="font-size:14px;color:var(--tx2);margin-bottom:6px;">Lee antes de abrir el artículo. Reduce significativamente el tiempo de procesamiento.</p>';
  const tabs = ['Posicionamiento', 'Esqueleto', 'Resumen', 'Alertas', 'Citables'];
  h += '<div class="sec-tabs-wrap" style="display:flex;gap:0;overflow-x:auto;border-bottom:1px solid rgba(220,215,205,0.06);margin-bottom:12px;">';
  tabs.forEach((t, i) => { h += `<div class="tab ${i === currentPlSub ? 'active' : ''}" onclick="switchPlSub(${i})" style="font-size:14px;padding:7px 14px;">${t}</div>`; });
  h += '</div><div id="pl-ct"></div>';
  ct.innerHTML = h;
  renderPlSub(currentPlSub);
}

function switchPlSub(i) {
  currentPlSub = i;
  state.ct.querySelectorAll('.tab').forEach((t, j) => t.classList.toggle('active', j === i));
  renderPlSub(i);
  document.querySelector('.content').scrollTop = 0;
}
window.switchPlSub = switchPlSub;

export function renderPlSub(i) {
  const P = state.DATA.prelectura; const target = document.getElementById('pl-ct'); if (!target) return;
  let h = '';
  if (i === 0) {
    h += '<table class="it">';
    P.posicionamiento.forEach(r => { h += `<tr><td>${r.q}</td><td>${r.a}</td></tr>`; });
    h += '</table>';
  } else if (i === 1) {
    if (P.esqueleto.tesis) h += `<p style="font-size:14px;color:var(--tx);line-height:1.6;margin-bottom:10px;padding:10px 14px;background:var(--bg2);border-left:3px solid var(--blue);border-radius:0 6px 6px 0;"><b>¿Qué intenta demostrar?</b> ${P.esqueleto.tesis}</p>`;
    h += '<table class="it">';
    P.esqueleto.pasos.forEach(p => { h += `<tr><td>${p.paso}</td><td>${p.desc} → ${p.ref}</td></tr>`; });
    h += '</table>';
  } else if (i === 2) {
    if (P.resumen && P.resumen.length) {
      h += '<table class="it">';
      P.resumen.forEach(r => { h += `<tr><td>${r.sec}</td><td>${r.desc}</td><td style="white-space:nowrap;color:var(--tx3);font-size:13px;">${r.ref}</td></tr>`; });
      h += '</table>';
    } else h = '<p style="color:var(--tx3);">No disponible.</p>';
  } else if (i === 3) {
    h += '<table class="it">';
    P.alertas.forEach(a => { h += `<tr><td>⚠️ ${a.n}</td><td>${a.texto}</td></tr>`; });
    h += '</table>';
  } else if (i === 4) {
    h += '<table class="ct"><thead><tr><th>Uso</th><th>Cita</th><th>Ref.</th></tr></thead><tbody>';
    P.citables.forEach(c => { h += `<tr><td>${c.uso}</td><td>"${c.cita}"</td><td style="font-size:13px;white-space:nowrap;">${c.ref}</td></tr>`; });
    h += '</tbody></table>';
  }
  target.innerHTML = h;
}

// ============================================================
// PUENTE
// ============================================================
export function renderPuente() {
  const ct = state.ct;
  const DATA = state.DATA;
  const F = DATA.puente || [{ emoji: '🎯', q: '¿Qué argumento de MI tesis respalda este texto?', hint: '' }, { emoji: '⚡', q: '¿Con qué posición quiero debatir?', hint: '' }, { emoji: '🔍', q: '¿Qué gap me revela?', hint: '' }, { emoji: '✍️', q: '¿Cómo lo citaría?', hint: '' }, { emoji: '❓', q: '¿Qué sigo sin entender?', hint: '' }];
  let h = '<div class="sb"><h3>Sección A.2 — Puente a tu tesis (~12 min)</h3></div>';
  h += '<p style="font-size:14px;color:var(--tx2);margin-bottom:12px;">La investigación doctoral no consiste en leer para comprender un texto: consiste en leer para posicionar tu investigación dentro de la conversación académica.</p>';
  h += F.map((f, i) => `<div class="pc"><h4>${f.emoji} ${i + 1}. ${f.q}</h4>${dictWrap('<textarea id="ta-pu' + i + '" onchange="svF(\'pu' + i + '\',this.value)" placeholder="' + f.hint + '">' + gF('pu' + i) + '</textarea>', 'ta-pu' + i)}</div>`).join('');
  // Flujo de trabajo
  if (DATA.flujo) {
    h += '<h4 style="font-size:15px;color:var(--gold);margin:18px 0 8px;">Flujo de trabajo recomendado</h4>';
    h += '<table class="it">';
    DATA.flujo.sesiones.forEach(s => { h += `<tr><td>${s.nombre}</td><td>${s.tiempo}</td></tr>`; });
    h += '</table>';
    if (DATA.flujo.revision) {
      h += '<h4 style="font-size:15px;color:var(--gold);margin:14px 0 8px;">Revisión espaciada</h4>';
      h += '<table class="it">';
      DATA.flujo.revision.forEach(r => { h += `<tr><td>${r.sesion}</td><td>${r.tiempo}</td><td>${r.tareas}</td><td style="color:var(--tx3);font-size:13px;">${r.fecha}</td></tr>`; });
      h += '</table>';
    }
  }
  ct.innerHTML = h;
}

// ============================================================
// GLOSARIO
// ============================================================
let currentGlSub = 0;

export function renderGlosario() {
  const ct = state.ct;
  const DATA = state.DATA;
  const G = DATA.glosario;
  if (!G || !G.length) { ct.innerHTML = '<div class="sb"><h3>Sección C — Glosario</h3></div><p style="font-size:15px;color:var(--tx2);">Glosario no disponible. Consulta el .docx.</p>'; return; }
  let h = '<div class="sb"><h3>Sección C — Glosario de ideas fuerza</h3></div>';
  h += '<p style="font-size:14px;color:var(--tx2);margin-bottom:6px;">Click en un concepto para ver su definición. Intenta recordar antes de abrir.</p>';
  const tabs = ['Conceptos (' + G.length + ')', 'Mapa jerárquico', 'Tensiones'];
  h += '<div class="sec-tabs-wrap" style="display:flex;gap:0;overflow-x:auto;border-bottom:1px solid rgba(220,215,205,0.06);margin-bottom:12px;">';
  tabs.forEach((t, i) => { h += `<div class="tab ${i === currentGlSub ? 'active' : ''}" onclick="switchGlSub(${i})" style="font-size:14px;padding:7px 14px;">${t}</div>`; });
  h += '</div><div id="gl-ct"></div>';
  ct.innerHTML = h;
  renderGlSub(currentGlSub);
}

function switchGlSub(i) {
  currentGlSub = i;
  state.ct.querySelectorAll('.tab').forEach((t, j) => t.classList.toggle('active', j === i));
  renderGlSub(i);
  document.querySelector('.content').scrollTop = 0;
}
window.switchGlSub = switchGlSub;

function togGlCard(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.gl-card-head.open').forEach(h => { h.classList.remove('open'); h.nextElementSibling.classList.remove('open'); });
  if (!wasOpen) { el.classList.add('open'); el.nextElementSibling.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
window.togGlCard = togGlCard;

export function renderGlSub(i) {
  const DATA = state.DATA;
  const G = DATA.glosario; const M = DATA.glosario_mapa;
  const target = document.getElementById('gl-ct'); if (!target) return;
  let h = '';
  if (i === 0) {
    G.forEach((c, j) => {
      const pesoColor = c.peso === 'critico' ? 'var(--gold)' : c.peso === 'importante' ? 'var(--blue)' : 'var(--tx3)';
      const pesoLabel = c.peso === 'critico' ? '◆◆◆' : c.peso === 'importante' ? '◆◆' : '◆';
      h += `<div style="margin:4px 0;border:1px solid rgba(220,215,205,0.05);border-radius:8px;overflow:hidden;">`;
      h += `<div class="gl-card-head" onclick="togGlCard(this)" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg3);cursor:pointer;border-left:3px solid ${pesoColor};transition:all 0.12s;">`;
      h += `<span style="font-size:10px;color:var(--tx3);transition:transform 0.2s;" class="schv">▸</span>`;
      h += `<span style="flex:1;font-size:15px;font-weight:600;color:#fff;">${c.concepto}</span>`;
      h += `<span style="font-size:13px;color:${pesoColor};font-weight:600;">${pesoLabel}</span>`;
      h += `</div>`;
      h += `<div style="display:none;padding:14px 18px;background:var(--bg2);">`;
      h += `<p style="font-size:var(--fs);line-height:1.7;color:var(--tx);margin-bottom:10px;">${c.definicion}</p>`;
      h += `<table class="it" style="margin:0;"><tr><td style="width:120px;">Anidamiento</td><td>${c.anidamiento}</td></tr>`;
      h += `<tr><td>Tensión</td><td style="color:var(--red);">${c.tension}</td></tr>`;
      h += `<tr><td>Origen</td><td style="color:var(--tx3);">${c.origen}</td></tr></table>`;
      h += `</div></div>`;
    });
  } else if (i === 1 && M && M.anidamiento) {
    h += '<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:8px;padding:18px 20px;font-family:monospace;font-size:14px;line-height:2.2;color:var(--tx);">';
    M.anidamiento.forEach(n => {
      const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(n.nivel);
      const prefix = n.nivel > 0 ? '├── ' : '';
      const gc = G.find(g => g.concepto === n.concepto);
      const color = gc ? (gc.peso === 'critico' ? 'var(--gold)' : gc.peso === 'importante' ? 'var(--blue)' : 'var(--tx2)') : 'var(--tx2)';
      h += `<div>${indent}${prefix}<span style="color:${color};font-weight:600;">${n.concepto}</span></div>`;
    });
    h += '</div>';
  } else if (i === 2 && M && M.tensiones) {
    M.tensiones.forEach(t => {
      h += `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-left:3px solid var(--red);border-radius:0 8px 8px 0;padding:12px 16px;margin:8px 0;">`;
      h += `<div style="font-size:15px;font-weight:600;color:var(--red);margin-bottom:4px;">${t.par}</div>`;
      h += `<div style="font-size:14px;color:var(--tx2);line-height:1.6;">${t.desc}</div></div>`;
    });
  }
  target.innerHTML = h;
}

// ============================================================
// REVISION
// ============================================================
export function renderRevision() {
  const ct = state.ct;
  const DATA = state.DATA;
  let h = '<div class="sb"><h3>Sección C.2 — Protocolo de revisión espaciada</h3></div>';
  h += '<p style="font-size:14px;color:var(--tx2);margin-bottom:14px;">Sin revisión activa, se pierde ~70% del contenido en una semana (Ebbinghaus, 1885). Con este protocolo, la retención a 30 días sube a ~80%.</p>';
  if (DATA.flujo && DATA.flujo.revision) {
    h += '<table class="it"><thead><tr><th>Sesión</th><th>Tiempo</th><th>Tareas</th><th>Fecha</th></tr></thead>';
    DATA.flujo.revision.forEach(r => { h += `<tr><td style="font-weight:600;">${r.sesion}</td><td>${r.tiempo}</td><td>${r.tareas}</td><td style="color:var(--tx3);">${r.fecha}</td></tr>`; });
    h += '</table>';
  } else {
    h += '<table class="it"><tr><td>Sesión 1 (hoy)</td><td>15-20 min · Retrieval completo + glosario + Puente</td></tr><tr><td>Sesión 2 (7 días)</td><td>10-12 min · Retrieval fallado + tensiones + uso en tesis</td></tr><tr><td>Sesión 3 (30 días)</td><td>8-10 min · Glosario + retrieval difícil + 2 conexiones</td></tr></table>';
  }
  h += '<h4 style="font-size:15px;color:var(--gold);margin:18px 0 8px;">5 Reglas de oro</h4>';
  h += '<div class="help-item"><p>1. <b>RETRIEVAL ANTES DE RELECTURA</b> — Intenta recordar antes de volver a mirar<br>2. <b>ESPACIADO > MASIVO</b> — 3 sesiones cortas superan a 1 maratón<br>3. <b>FOCALIZA EN FALLOS</b> — Dedica más tiempo a lo que no pudiste recordar<br>4. <b>CONECTA, NO REPITAS</b> — Busca relaciones con otros textos, no repetición mecánica<br>5. <b>ESCRIBE A MANO</b> — La escritura manual mejora la codificación en memoria</p></div>';
  ct.innerHTML = h;
}

// ============================================================
// REFLEXIONES
// ============================================================
export function renderReflexiones() {
  const ct = state.ct;
  const DATA = state.DATA;
  const R = DATA.reflexiones || [{ emoji: '📖', titulo: 'Primera impresión', hint: '¿Qué fue lo más sorprendente?' }, { emoji: '🔗', titulo: 'Conexiones con mi investigación', hint: '¿Qué encaja con mi marco teórico?' }, { emoji: '❓', titulo: 'Preguntas que me genera', hint: 'Dudas teóricas...' }, { emoji: '✅', titulo: 'Acciones concretas', hint: 'Pasos específicos...' }];
  const colors = ['var(--blue)', 'var(--green)', 'var(--gold)', 'var(--red)', 'var(--purple)', 'var(--amber)', 'var(--blue)', 'var(--tx2)'];
  let h = '<div class="sb"><h3>Sección D — Reflexiones y apuntes personales</h3></div>';
  h += R.map((f, i) => `<div class="pc" style="border-left-color:${colors[i % colors.length]};"><h4>${f.emoji} ${f.titulo}</h4>${dictWrap('<textarea id="ta-rf' + i + '" onchange="svF(\'rf' + i + '\',this.value)" placeholder="' + f.hint.replace(/"/g, '&quot;') + '">' + gF('rf' + i) + '</textarea>', 'ta-rf' + i)}</div>`).join('');
  ct.innerHTML = h;
}

// ============================================================
// MAPA
// ============================================================
export function renderMapa() {
  const ct = state.ct;
  const DATA = state.DATA;
  const M = DATA.mapa || { converge: { titulo: '↔ Converge con', hint: '' }, tension: { titulo: '⇄ Entra en tensión con', hint: '' }, preguntas: { titulo: '→ Abre preguntas hacia', hint: '' }, preguntas_iniciales: [] };
  let h = '<div class="sb"><h3>Sección E — Mapa de diálogos inter-textuales</h3></div>';
  if (M.instruccion) h += `<p style="font-size:14px;color:var(--tx2);margin-bottom:14px;">${M.instruccion}</p>`;
  h += `<div class="pc" style="border-left-color:var(--green);"><h4>${M.converge.titulo}</h4><p style="font-size:13px;color:var(--tx3);margin-bottom:6px;">${M.converge.hint}</p>${dictWrap('<textarea id="ta-mp0" onchange="svF(\'mp0\',this.value)" placeholder="Texto/Autor | Punto de convergencia">' + gF('mp0') + '</textarea>', 'ta-mp0')}</div>`;
  h += `<div class="pc" style="border-left-color:var(--red);"><h4>${M.tension.titulo}</h4><p style="font-size:13px;color:var(--tx3);margin-bottom:6px;">${M.tension.hint}</p>${dictWrap('<textarea id="ta-mp1" onchange="svF(\'mp1\',this.value)" placeholder="Texto/Autor | Punto de tensión">' + gF('mp1') + '</textarea>', 'ta-mp1')}</div>`;
  h += `<div class="pc" style="border-left-color:var(--blue);"><h4>${M.preguntas.titulo}</h4><p style="font-size:13px;color:var(--tx3);margin-bottom:6px;">${M.preguntas.hint}</p>${dictWrap('<textarea id="ta-mp2" onchange="svF(\'mp2\',this.value)" placeholder="Dirección/Pregunta | Textos candidatos">' + gF('mp2') + '</textarea>', 'ta-mp2')}</div>`;
  if (M.preguntas_iniciales && M.preguntas_iniciales.length) {
    h += '<h4 style="font-size:14px;color:var(--gold);margin:14px 0 8px;">Preguntas abiertas sugeridas</h4>';
    M.preguntas_iniciales.forEach((p, i) => { h += `<div style="padding:10px 14px;background:var(--bg2);border-radius:7px;margin:6px 0;font-size:14px;color:var(--tx2);line-height:1.6;">${i + 1}. ${p}</div>`; });
  }
  ct.innerHTML = h;
}

// ============================================================
// TEXTO ANOTADO
// ============================================================
export function renderTexto() {
  const ct = state.ct;
  const DATA = state.DATA;
  let h = getBreadcrumb() + '<div class="search-bar"><input type="text" id="search-input" placeholder="Buscar en el texto... (Ctrl+F)" value="' + (state.searchQuery || '').replace(/"/g, '&quot;') + '" oninput="onSearch(this.value)"><span class="s-count" id="search-count"></span><button class="s-clear" onclick="clearSearch()">Limpiar</button></div>';
  h += '<div class="reading-progress"><span class="label">Progreso de lectura</span><div class="bar"><div class="fill" id="reading-fill" style="width:0%"></div></div><span class="pct" id="reading-pct">0%</span></div>';
  h += '<div class="lg" style="margin-bottom:6px;"><span><div class="lc" style="background:var(--hla)"></div>Autores</span><span><div class="lc" style="background:var(--hlt)"></div>Términos</span><span><div class="lc" style="background:var(--hlk)"></div>Clave</span><span><div class="lc" style="background:var(--hle)"></div>Ejemplos</span></div>';
  // Sub-tabs
  h += '<div class="sec-tabs-wrap" style="display:flex;gap:0;overflow-x:auto;border-bottom:1px solid rgba(220,215,205,0.06);margin-bottom:12px;">';
  DATA.sections.forEach((sec, si) => {
    const short = sec.title.length > 20 ? '§' + (si + 1) + ' ' + sec.title.substring(0, 18) + '…' : sec.title;
    const done = gP('s' + si);
    h += `<div class="tab ${si === state.currentSubSec ? 'active' : ''}" onclick="switchSub(${si})" style="font-size:14px;padding:7px 11px;">${short}${done ? ' <span style="color:var(--green);">✓</span>' : ''}</div>`;
  });
  h += '</div><div id="subsec-ct"></div>';
  ct.innerHTML = h;
  if (state.searchQuery) { renderSearchResults(); } else { renderSub(state.currentSubSec); }
  calcProgress();
}

// ============================================================
// RENDER SUB-SECTION
// ============================================================
function switchSub(si) {
  state.currentSubSec = si;
  lastOpenPar = null;
  state.ct.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === si));
  renderSub(si);
  document.querySelector('.content').scrollTop = 0;
}
window.switchSub = switchSub;

export function renderSub(si) {
  const DATA = state.DATA;
  const sec = DATA.sections[si]; const target = document.getElementById('subsec-ct');
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><div class="sb" style="flex:1;margin:0;"><h3>${sec.title}</h3></div><div class="col-sel"><span>Col:</span><div class="col-btn ${colCount === 1 ? 'active' : ''}" onclick="setCol(1,this)">1</div><div class="col-btn ${colCount === 2 ? 'active' : ''}" onclick="setCol(2,this)">2</div><div class="col-btn ${colCount === 3 ? 'active' : ''}" onclick="setCol(3,this)">3</div></div></div>`;
  h += `<div class="cols-wrap" id="cols-wrap" style="column-count:${colCount};">`;
  sec.paragraphs.forEach((par, pi) => {
    const pid = `p${si}-${pi}`; const cid = `c${si}-${pi}`; const ex = gD(pid); const checked = gC(cid);
    const title = par.title || ('Párrafo ' + (pi + 1));
    const claim = getClaim(pid);
    const claimDot = claim ? `<div class="claim-dot dot-${claim}"></div>` : '';
    h += `<div class="pb">`;
    h += `<div class="pb-acc" id="acc-${pid}" onclick="togglePar('${pid}')"><div class="pcheck ${checked ? 'done' : ''}" onclick="event.stopPropagation();toggleCheck('${cid}',this)">${checked ? '✓' : ''}</div><span class="pnum">${pi + 1}</span>${claimDot}<span class="chv">▸</span><span class="ptitle">${title}</span>`;
    if (ex.length) h += `<span class="bdg">${ex.length}</span>`;
    h += `</div>`;
    const eq = par.eq || '';
    h += `<div class="pb-inner" id="body-${pid}">`;
    // Main text (bilingual: show translation if available, original below)
    const mainText = par.translation || par.text;
    h += `<div class="pb-t"><button class="tts-btn" id="tts-${pid}" onclick="event.stopPropagation();toggleTTS('${pid}')" title="Escuchar">🔊</button>${hl(mainText)}</div>`;
    if (par.translation) { h += `<div class="pb-secondary" id="en-${pid}"><span class="lang-tag">EN</span>${hl(par.text)}</div>`; }
    // Claims tracker
    h += `<div class="claims-bar"><div class="claim-btn support ${claim === 'support' ? 'active' : ''}" onclick="setClaim('${pid}','support',this)">✓ Apoya mi tesis</div><div class="claim-btn contrast ${claim === 'contrast' ? 'active' : ''}" onclick="setClaim('${pid}','contrast',this)">✗ Contrasta</div><div class="claim-btn neutral ${claim === 'neutral' ? 'active' : ''}" onclick="setClaim('${pid}','neutral',this)">― Neutro</div></div>`;
    // Claim note
    const cnote = getClaimNote(pid);
    h += `<div class="claim-note ${claim ? 'show' : ''}" id="cn-${pid}">${dictWrap('<textarea id="ta-cn-' + pid + '" placeholder="¿Cómo apoya o contrasta tu argumento?" onchange="saveClaimNote(\'' + pid + '\',this.value)">' + cnote + '</textarea>', 'ta-cn-' + pid)}<div class="db" style="justify-content:space-between;"><button class="btn bg" onclick="saveClaimNote('${pid}',document.getElementById('ta-cn-${pid}').value)" style="font-size:12px;">Guardar nota</button><button class="btn bo" onclick="clearClaimNote('${pid}','ta-cn-${pid}')" style="font-size:12px;color:var(--tx3);">Borrar</button></div></div>`;
    // Toolbar — exclusive toggle (one panel at a time)
    const hasSE = gF('se-' + pid) ? 'has' : '';
    const panels = ['a' + pid, 'eq' + pid, 'se' + pid, 'd' + pid];
    const pGroup = panels.map(p => "'" + p + "'").join(',');
    const enBtn = par.translation ? `<div class="pb-b" onclick="document.getElementById('en-${pid}').classList.toggle('show');this.classList.toggle('has')">🇬🇧 Original</div>` : '';
    h += `<div class="pb-br">${enBtn}<div class="pb-b" onclick="togPanel('a${pid}',[${pGroup}])">Anotaciones <span class="bdg">${par.anns.length}</span></div><div class="pb-b" onclick="togPanel('eq${pid}',[${pGroup}])">¿Por qué?</div><div class="pb-b ${hasSE}" onclick="togPanel('se${pid}',[${pGroup}])">💡 Explicar</div><div class="pb-b ${ex.length ? 'has' : ''}" onclick="togPanel('d${pid}',[${pGroup}])">✍️ Reflexión${ex.length ? ' <span class=bdg>' + ex.length + '</span>' : ''}</div></div>`;
    // Annotation panel
    h += `<div class="pp ap" id="a${pid}">${par.anns.map(a => '<div class="an an-' + a.c + '">' + (a.b ? '<strong>' + a.t + '</strong>' : a.t) + '</div>').join('')}</div>`;
    // Elaborative question panel
    const eqVal = gF('eq-' + pid);
    h += `<div class="eq-panel" id="eq${pid}"><div class="eq-label">Interrogación elaborativa</div><div class="eq-q">${eq}</div>${dictWrap('<textarea class="di" id="ta-eq-' + pid + '" placeholder="Tu respuesta a esta pregunta..." onchange="svF(\'eq-' + pid + '\',this.value)">' + eqVal + '</textarea>', 'ta-eq-' + pid)}<div class="db" style="justify-content:space-between;"><button class="btn bg" onclick="svF('eq-${pid}',document.getElementById('ta-eq-${pid}').value)">Guardar</button><button class="btn bo" onclick="clearField('eq-${pid}','ta-eq-${pid}')" style="font-size:12px;color:var(--tx3);">Borrar</button></div></div>`;
    // Self-explanation panel
    const seVal = gF('se-' + pid);
    h += `<div class="se-panel" id="se${pid}"><div class="se-label">Auto-explicación</div><div class="se-prompt">Explica este párrafo en tus propias palabras, en 2-3 oraciones.</div><div class="se-hint">Tip: Si no puedes explicarlo sin mirar el texto, necesitas releerlo.</div>${dictWrap('<textarea class="di" id="ta-se-' + pid + '" placeholder="En mis palabras, este párrafo dice que..." onchange="svF(\'se-' + pid + '\',this.value)">' + seVal + '</textarea>', 'ta-se-' + pid)}<div class="db" style="justify-content:space-between;"><button class="btn bg" onclick="svF('se-${pid}',document.getElementById('ta-se-${pid}').value)">Guardar</button><button class="btn bo" onclick="clearField('se-${pid}','ta-se-${pid}')" style="font-size:12px;color:var(--tx3);">Borrar</button></div></div>`;
    // Dialog panel
    h += `<div class="pp dp" id="d${pid}">${dictWrap('<textarea class="di" id="i' + pid + '" placeholder="Tu reflexión..."></textarea>', 'i' + pid)}<div class="db"><button class="btn bg" onclick="svDlg('${pid}')">Guardar</button></div><div id="e${pid}">${ex.map((e, ei) => '<div class="de" style="position:relative;"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + e.t + '<span onclick="deleteDlg(\'' + pid + '\',' + ei + ')" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--tx3);font-size:12px;opacity:0.4;transition:opacity 0.1s;" onmouseover="this.style.opacity=1;this.style.color=\'var(--red)\'" onmouseout="this.style.opacity=0.4;this.style.color=\'var(--tx3)\'" title="Borrar">✕</span></div>').join('')}</div></div>`;
    // Next paragraph button
    const isLast = pi === sec.paragraphs.length - 1;
    const nextLabel = isLast ? 'Completar sección ✓' : 'Siguiente párrafo →';
    h += `<div class="next-par" onclick="advancePar(${si},${pi})">${nextLabel} <span class="kbd">Enter</span></div>`;
    h += `</div>`; // close pb-inner
    h += `</div>`;
  });
  h += `</div>`; // cols-wrap
  // Progress + Retrieval + Thermo
  const dn = gP('s' + si);
  h += `<div class="pm"><span class="pl">✓ ${sec.title}</span><div class="pkc ${dn ? 'done' : ''}" onclick="tgP('s${si}',this)">${dn ? '✓' : ''}</div></div>`;
  h += `<div class="rt"><div class="rt-h" onclick="this.nextElementSibling.classList.toggle('show')">✏ Retrieval — ${sec.retrieval.q.length} preguntas (escribe antes de ver)</div><div class="rt-b">${sec.retrieval.q.map((q, i) => '<div class="rq">' + (i + 1) + '. ' + q + '</div><textarea class="di" style="min-height:36px;margin:4px 0 6px;font-size:14px;" placeholder="Tu respuesta..."></textarea><div class="ra">' + sec.retrieval.a[i] + '</div><span class="rv" onclick="this.previousElementSibling.classList.toggle(\'show\');this.textContent=this.textContent===\'[ver respuesta]\'?\'[ocultar]\':\'[ver respuesta]\'">[ver respuesta]</span>').join('')}</div></div>`;
  const sv_t = gT('s' + si); const lb = ['No entendí', 'Con apoyo', 'Solo', 'Explicar', 'Debatir'];
  h += `<div class="tm"><h4>🌡 Confianza</h4><div class="tm-os">${[1, 2, 3, 4, 5].map(n => '<div class="tm-o ' + (sv_t === n ? 'sel' : '') + '" onclick="slT(\'s' + si + '\',' + n + ',this)">' + n + ' ' + lb[n - 1] + '</div>').join('')}</div></div>`;
  // Nav
  h += `<div style="display:flex;justify-content:space-between;margin-top:14px;">`;
  if (si > 0) h += `<button class="btn bo" onclick="switchSub(${si - 1})">← Anterior</button>`; else h += `<span></span>`;
  if (si < DATA.sections.length - 1) h += `<button class="btn bg" onclick="switchSub(${si + 1})">Siguiente →</button>`; else h += `<span></span>`;
  h += `</div>`;
  target.innerHTML = h;
  calcProgress();
}

// ============================================================
// SEARCH
// ============================================================
let searchDebounce = null;

function onSearch(q) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.searchQuery = q.trim().toLowerCase();
    if (state.currentPanel !== 'texto') return;
    const target = document.getElementById('subsec-ct');
    if (!target) return;
    if (!state.searchQuery) { renderSub(state.currentSubSec); document.getElementById('search-count').textContent = ''; return; }
    renderSearchResults();
  }, 200);
}
window.onSearch = onSearch;

function clearSearch() {
  state.searchQuery = '';
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const target = document.getElementById('subsec-ct');
  if (target) renderSub(state.currentSubSec);
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = '';
}
window.clearSearch = clearSearch;

function renderSearchResults() {
  const DATA = state.DATA;
  const target = document.getElementById('subsec-ct');
  if (!target) return;
  const q = state.searchQuery;
  let h = ''; let found = 0;
  DATA.sections.forEach((sec, si) => {
    let secHits = [];
    sec.paragraphs.forEach((par, pi) => {
      const title = par.title || ('Párrafo ' + (pi + 1));
      const haystack = (title + ' ' + (par.translation || '') + ' ' + par.text).toLowerCase();
      if (haystack.includes(q)) { secHits.push({ par, pi, title }); }
    });
    if (secHits.length === 0) return;
    h += `<div class="sb" style="margin-top:${found ? '18px' : '0'};"><h3>${sec.title} <span style="font-size:13px;color:var(--tx3);font-weight:400;">(${secHits.length} resultado${secHits.length !== 1 ? 's' : ''})</span></h3></div>`;
    secHits.forEach(hit => {
      const pid = `p${si}-${hit.pi}`; const cid = `c${si}-${hit.pi}`;
      const checked = gC(cid); const ex = gD(pid); const claim = getClaim(pid);
      const claimDot = claim ? `<div class="claim-dot dot-${claim}"></div>` : '';
      found++;
      h += `<div class="pb">`;
      h += `<div class="pb-acc" id="acc-${pid}" onclick="togglePar('${pid}')"><div class="pcheck ${checked ? 'done' : ''}" onclick="event.stopPropagation();toggleCheck('${cid}',this)">${checked ? '✓' : ''}</div><span class="pnum">${hit.pi + 1}</span>${claimDot}<span class="chv">▸</span><span class="ptitle">${hit.title}</span>`;
      if (ex.length) h += `<span class="bdg">${ex.length}</span>`;
      h += `</div>`;
      const eq2 = hit.par.eq || ''; const cnote = getClaimNote(pid); const hasSE = gF('se-' + pid) ? 'has' : '';
      const sMainText = hit.par.translation || hit.par.text;
      h += `<div class="pb-inner" id="body-${pid}">`;
      h += `<div class="pb-t"><button class="tts-btn" id="tts-${pid}" onclick="event.stopPropagation();toggleTTS('${pid}')" title="Escuchar">🔊</button>${hl(sMainText)}</div>`;
      if (hit.par.translation) { h += `<div class="pb-secondary"><span class="lang-tag">EN</span>${hl(hit.par.text)}</div>`; }
      h += `<div class="claims-bar"><div class="claim-btn support ${claim === 'support' ? 'active' : ''}" onclick="setClaim('${pid}','support',this)">✓ Apoya mi tesis</div><div class="claim-btn contrast ${claim === 'contrast' ? 'active' : ''}" onclick="setClaim('${pid}','contrast',this)">✗ Contrasta</div><div class="claim-btn neutral ${claim === 'neutral' ? 'active' : ''}" onclick="setClaim('${pid}','neutral',this)">― Neutro</div></div>`;
      h += `<div class="claim-note ${claim ? 'show' : ''}" id="cn-${pid}"><textarea placeholder="¿Cómo apoya o contrasta tu argumento?" onchange="saveClaimNote('${pid}',this.value)">${cnote}</textarea></div>`;
      h += `<div class="pb-br"><div class="pb-b" onclick="tog('a${pid}')">Anotaciones <span class="bdg">${hit.par.anns.length}</span></div><div class="pb-b" onclick="tog('eq${pid}')">¿Por qué?</div><div class="pb-b ${hasSE}" onclick="tog('se${pid}')">💡 Explicar</div><div class="pb-b ${ex.length ? 'has' : ''}" onclick="tog('d${pid}')">✍️ Reflexión${ex.length ? ' <span class=bdg>' + ex.length + '</span>' : ''}</div></div>`;
      h += `<div class="pp ap" id="a${pid}">${hit.par.anns.map(a => '<div class="an an-' + a.c + '">' + (a.b ? '<strong>' + a.t + '</strong>' : a.t) + '</div>').join('')}</div>`;
      h += `<div class="eq-panel" id="eq${pid}"><div class="eq-label">Interrogación elaborativa</div><div class="eq-q">${eq2}</div><textarea class="di" placeholder="Tu respuesta a esta pregunta..." onchange="svF('eq-${pid}',this.value)">${gF('eq-' + pid)}</textarea></div>`;
      h += `<div class="se-panel" id="se${pid}"><div class="se-label">Auto-explicación</div><div class="se-prompt">Explica este párrafo en tus propias palabras, en 2-3 oraciones.</div><div class="se-hint">Tip: Si no puedes explicarlo sin mirar el texto, necesitas releerlo.</div><textarea class="di" placeholder="En mis palabras, este párrafo dice que..." onchange="svF('se-${pid}',this.value)">${gF('se-' + pid)}</textarea></div>`;
      h += `<div class="pp dp" id="d${pid}"><textarea class="di" id="i${pid}" placeholder="Tu reflexión..."></textarea><div class="db"><button class="btn bg" onclick="svDlg('${pid}')">Guardar</button></div><div id="e${pid}">${ex.map(e => '<div class="de"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + e.t + '</div>').join('')}</div></div>`;
      h += `</div></div>`;
    });
  });
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = found + ' resultado' + (found !== 1 ? 's' : '') + ' en todas las secciones';
  target.innerHTML = h;
}

// ============================================================
// UPD — update note count in dashboard
// ============================================================
export function upd() {
  const d = ld(); let n = 0;
  if (d.d) Object.values(d.d).forEach(a => n += a.length);
  const da = document.getElementById('da'); if (da) da.textContent = n;
}

// ============================================================
// CLAIMS FUNCTIONS
// ============================================================
export function getClaim(pid) { return (ld().claims || {})[pid] || ''; }

export function setClaim(pid, type, el) {
  const d = ld(); if (!d.claims) d.claims = {};
  const wasActive = d.claims[pid] === type;
  if (wasActive) { delete d.claims[pid]; }
  else { d.claims[pid] = type; }
  sv(d);
  const bar = el.parentElement;
  bar.querySelectorAll('.claim-btn').forEach(b => b.classList.remove('active'));
  if (!wasActive) el.classList.add('active');
  const noteEl = document.getElementById('cn-' + pid);
  if (noteEl) { noteEl.classList.toggle('show', !wasActive); }
}
window.setClaim = setClaim;

export function getClaimNote(pid) { return (ld().claimNotes || {})[pid] || ''; }

export function saveClaimNote(pid, val) {
  const d = ld(); if (!d.claimNotes) d.claimNotes = {};
  d.claimNotes[pid] = val; sv(d);
}
window.saveClaimNote = saveClaimNote;

export function clearClaimNote(pid, taId) {
  if (!confirm('¿Borrar esta nota de claim?')) return;
  const d = ld(); if (d.claimNotes && d.claimNotes[pid]) { delete d.claimNotes[pid]; sv(d); }
  const ta = document.getElementById(taId); if (ta) ta.value = '';
}
window.clearClaimNote = clearClaimNote;

// ============================================================
// CLAIMS SUMMARY
// ============================================================
export function renderClaimsSummary() {
  const el = document.getElementById('claims-summary');
  if (!el) return;
  const d = ld();
  const claims = d.claims || {};
  const notes = d.claimNotes || {};
  let support = 0, contrast = 0, neutral = 0;
  Object.values(claims).forEach(c => {
    if (c === 'support') support++;
    else if (c === 'contrast') contrast++;
    else if (c === 'neutral') neutral++;
  });
  const total = support + contrast + neutral;
  if (total === 0) { el.innerHTML = ''; return; }
  let h = `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Tracker de claims (${total} párrafos evaluados)</h3>`;
  h += `<div style="display:flex;gap:10px;margin-bottom:12px;">`;
  h += `<div style="flex:1;padding:10px 14px;background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.15);border-radius:7px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--green);">${support}</div><div style="font-size:13px;color:var(--tx2);">Apoyan</div></div>`;
  h += `<div style="flex:1;padding:10px 14px;background:rgba(224,112,80,0.06);border:1px solid rgba(224,112,80,0.15);border-radius:7px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--red);">${contrast}</div><div style="font-size:13px;color:var(--tx2);">Contrastan</div></div>`;
  h += `<div style="flex:1;padding:10px 14px;background:rgba(225,220,210,0.04);border:1px solid rgba(225,220,210,0.08);border-radius:7px;text-align:center;"><div style="font-size:22px;font-weight:800;color:var(--tx3);">${neutral}</div><div style="font-size:13px;color:var(--tx2);">Neutros</div></div>`;
  h += `</div>`;
  h += checkBias();
  h += `<div style="display:flex;gap:8px;margin-top:8px;"><button class="btn bo" onclick="goAllNotes()" style="font-size:13px;">📋 Ver todas mis notas</button><button class="btn bo" onclick="goStudyMode()" style="font-size:13px;">🧠 Modo estudio flashcards</button></div>`;
  el.innerHTML = h;
}

// ============================================================
// BUILD CLAIMS TEXT (for export)
// ============================================================
export function buildClaimsText() {
  const manifest = window.SILA_MANIFEST || [];
  let lines = ['YUNQUE — Claims para marco teórico', 'Generado: ' + new Date().toLocaleDateString(), '', ''];
  ['support', 'contrast', 'neutral'].forEach(type => {
    const label = type === 'support' ? 'APOYAN MI TESIS' : type === 'contrast' ? 'CONTRASTAN MI TESIS' : 'NEUTROS';
    let items = [];
    manifest.forEach(art => {
      const artData = window.SILA_ARTICLES[art.key]; if (!artData) return;
      let d = {}; try { const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4'); if (raw) d = JSON.parse(raw); } catch (e) { }
      const claims = d.claims || {}; const notes = d.claimNotes || {};
      Object.entries(claims).forEach(([pid, t]) => {
        if (t !== type) return;
        const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
        const si = parseInt(m[1]), pi = parseInt(m[2]);
        const sec = artData.sections[si]; if (!sec) return;
        const par = sec.paragraphs[pi]; if (!par) return;
        items.push({ authors: art.authors, year: art.year, sec: sec.title, text: par.text.substring(0, 300), note: notes[pid] || '' });
      });
    });
    if (items.length === 0) return;
    lines.push('═══ ' + label + ' (' + items.length + ') ═══', '');
    items.forEach((it, i) => {
      lines.push((i + 1) + '. Según ' + it.authors + ' (' + it.year + '), ' + it.sec + ':');
      lines.push('   "' + it.text + '"');
      if (it.note) lines.push('   → Nota: ' + it.note);
      lines.push('');
    });
  });
  return lines.join('\n');
}

export function exportClaims() {
  let text = buildClaimsText();
  navigator.clipboard.writeText(text).then(() => alert('Claims copiados al portapapeles (' + text.split('\n').length + ' líneas)'));
}
window.exportClaims = exportClaims;

export function exportClaimsFile() {
  let text = buildClaimsText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'YUNQUE_claims_tesis.txt'; a.click();
}
window.exportClaimsFile = exportClaimsFile;

// ============================================================
// PARAGRAPH NAVIGATION
// ============================================================
export function togglePar(pid) {
  const acc = document.getElementById('acc-' + pid);
  const body = document.getElementById('body-' + pid);
  const isOpen = acc.classList.contains('open');
  document.querySelectorAll('.pb-acc.open').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.pb-inner.open').forEach(b => b.classList.remove('open'));
  if (!isOpen) { acc.classList.add('open'); body.classList.add('open'); lastOpenPar = pid; } else { lastOpenPar = null; }
}
window.togglePar = togglePar;

export function toggleCheck(cid, el) {
  const v = !gC(cid); sC(cid, v);
  el.classList.toggle('done', v); el.textContent = v ? '✓' : '';
}
window.toggleCheck = toggleCheck;

export function advancePar(si, pi) {
  const DATA = state.DATA;
  const cid = `c${si}-${pi}`;
  if (!gC(cid)) {
    sC(cid, true);
    const chk = document.querySelector('#acc-p' + si + '-' + pi + ' .pcheck');
    if (chk) { chk.classList.add('done'); chk.textContent = '✓'; }
  }
  const sec = DATA.sections[si];
  if (pi < sec.paragraphs.length - 1) {
    togglePar('p' + si + '-' + (pi + 1));
    const nextAcc = document.getElementById('acc-p' + si + '-' + (pi + 1));
    if (nextAcc) nextAcc.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    const pkc = document.querySelector('.pkc');
    if (pkc && !pkc.classList.contains('done')) tgP('s' + si, pkc);
    if (si < DATA.sections.length - 1) {
      switchSub(si + 1);
      setTimeout(() => { togglePar('p' + (si + 1) + '-0'); const acc = document.getElementById('acc-p' + (si + 1) + '-0'); if (acc) acc.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
    }
  }
  calcProgress();
}
window.advancePar = advancePar;

// ============================================================
// ARTICLE TAGS
// ============================================================
export function getArticleTags(key) {
  try { const raw = localStorage.getItem('sila4_' + key); if (!raw) return []; const d = JSON.parse(raw); return d.tags || []; } catch (e) { return []; }
}

export function saveArticleTags(key, tags) {
  try {
    const raw = localStorage.getItem('sila4_' + key);
    const d = raw ? JSON.parse(raw) : {};
    d.tags = tags;
    localStorage.setItem('sila4_' + key, JSON.stringify(d));
  } catch (e) { }
}

export function renderArticleTagsHtml(key) {
  const tags = getArticleTags(key);
  let h = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">';
  tags.forEach((t, i) => {
    h += `<span class="art-tag">${t} <span class="tag-x" onclick="event.stopPropagation();removeArticleTag(${i})">✕</span></span>`;
  });
  h += `<span class="art-tag-add" onclick="addArticleTag()">+ tag</span>`;
  h += `</div>`;
  return h;
}

export function addArticleTag() {
  if (!state.currentArticleKey) return;
  const tag = prompt('Nuevo tag:');
  if (!tag || !tag.trim()) return;
  const tags = getArticleTags(state.currentArticleKey);
  const clean = tag.trim().toLowerCase();
  if (!tags.includes(clean)) tags.push(clean);
  saveArticleTags(state.currentArticleKey, tags);
  renderDash();
}
window.addArticleTag = addArticleTag;

export function removeArticleTag(idx) {
  if (!state.currentArticleKey) return;
  const tags = getArticleTags(state.currentArticleKey);
  tags.splice(idx, 1);
  saveArticleTags(state.currentArticleKey, tags);
  renderDash();
}
window.removeArticleTag = removeArticleTag;

// ============================================================
// MISC WINDOW FUNCTIONS (used from onclick handlers)
// ============================================================

window.sp = function (id, el) {
  if (state.isHome && !state.DATA) { return; }
  saveNavState();
  state.isHome = false; state.isMiTesis = false; state.currentDocId = null;
  document.querySelectorAll('.s-home').forEach(i => i.classList.remove('active'));
  state.currentPanel = id;
  if (state._updateTopbar) state._updateTopbar();
  const bar = document.getElementById('topbar-article');
  if (bar) { bar.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); if (el) el.classList.add('active'); }
  render(); state.ct.scrollTop = 0;
  if (state.closeSidebarMobile) state.closeSidebarMobile();
};

window.tog = function (id) { document.getElementById(id).classList.toggle('show'); };

window.togPanel = function (id, group) {
  const target = document.getElementById(id); if (!target) return;
  const wasOpen = target.classList.contains('show');
  group.forEach(gid => { const el = document.getElementById(gid); if (el) el.classList.remove('show'); });
  if (!wasOpen) target.classList.add('show');
};

window.svDlg = function (pid) {
  const inp = document.getElementById('i' + pid); const t = inp.value.trim(); if (!t) return;
  // Stop any active dictation first
  if (window._activeRecognition) { window._activeRecognition.stop(); window._activeRecognition = null; window._activeRecBtn = null; }
  aD(pid, t);
  const container = document.getElementById('e' + pid);
  const entries = gD(pid);
  container.innerHTML = entries.map((e, i) => '<div class="de" style="position:relative;"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + e.t + '<span onclick="deleteDlg(\'' + pid + '\',' + i + ')" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--tx3);font-size:12px;opacity:0.4;transition:opacity 0.1s;" onmouseover="this.style.opacity=1;this.style.color=\'var(--red)\'" onmouseout="this.style.opacity=0.4;this.style.color=\'var(--tx3)\'" title="Borrar">✕</span></div>').join('');
  inp.value = ''; inp.style.height = 'auto';
  upd();
};

window.tgP = function (id, el) { const v = !gP(id); sP(id, v); el.className = 'pkc ' + (v ? 'done' : ''); el.textContent = v ? '✓' : ''; };
window.slT = function (id, v, el) { sT(id, v); el.parentElement.querySelectorAll('.tm-o').forEach(o => o.classList.remove('sel')); el.classList.add('sel'); };

window.togHelp = function (el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.help-head.open').forEach(h => { h.classList.remove('open'); h.nextElementSibling.classList.remove('open'); });
  if (!wasOpen) { el.classList.add('open'); el.nextElementSibling.classList.add('open'); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
};

window.togSub = function (el) {
  const wasOpen = el.classList.contains('open');
  el.classList.toggle('open'); el.nextElementSibling.classList.toggle('open');
  if (!wasOpen) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.jumpSub = function (id) {
  const el = document.getElementById(id); if (!el) return;
  const head = el.querySelector('.subsec-head');
  if (head && !head.classList.contains('open')) { head.classList.add('open'); head.nextElementSibling.classList.add('open'); }
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.goHelp = function () {
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; window._isPrisma = false;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  if (state._updateTopbar) state._updateTopbar();
  renderAyuda();
  if (state.closeSidebarMobile) state.closeSidebarMobile();
};

window.goCompare = async function () {
  // Delegate to state if implemented elsewhere
  if (state.goCompare) return state.goCompare();
};

window.goReport = function () {
  if (state.goReport) return state.goReport();
};

window.showAllCatItems = function (catId, btn) {
  document.querySelectorAll('[data-overflow="' + catId + '"]').forEach(el => el.style.display = '');
  if (btn) btn.remove();
};

window.changeFontSize = function (delta) {
  state.fontSize = Math.max(12, Math.min(22, (state.fontSize || 15) + delta));
  localStorage.setItem('sila_fs', state.fontSize);
  document.documentElement.style.setProperty('--fs', state.fontSize + 'px');
  document.querySelectorAll('.fs-label').forEach(el => el.textContent = state.fontSize + 'px');
  if (state.syncSettingsToCloud) state.syncSettingsToCloud();
};

window.goToArticle = async function (key) {
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; window._isPrisma = false;
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
    if (state._updateTopbar) state._updateTopbar();
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    render(); upd(); calcProgress();
    if (state.syncEnabled && state.initSync) state.initSync();
  } catch (e) {
    state.ct.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);">Error: ' + escH(e.message) + '</div>';
  }
};

window.goToArticlePar = async function (key, si, pi) {
  state.currentDocId = null;
  await window.goToArticle(key);
  state.currentPanel = 'texto';
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === 3));
  render();
  setTimeout(() => { switchSub(si); setTimeout(() => { togglePar('p' + si + '-' + pi); const el = document.getElementById('acc-p' + si + '-' + pi); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); }, 100);
};

window.selArt = async function (key, el) {
  saveNavState();
  document.querySelectorAll('.s-it').forEach(i => i.classList.remove('active'));
  if (el && el.classList) el.classList.add('active');
  state.isHome = false; state.isMiTesis = false; state.currentDocId = null;
  state.currentProjectId = null; state._isPrisma = false;
  state.currentArticleKey = key;
  try {
    await loadArticle(key);
    initArticleData();
    if (state._buildSidebar) state._buildSidebar();
    state.currentPanel = 'dashboard'; render();
    if (state._updateTopbar) state._updateTopbar();
    const artBar = document.getElementById('topbar-article');
    if (artBar) { const panelNames = ['dashboard', 'prelectura', 'puente', 'texto', 'glosario', 'reflexiones', 'mapa', 'flashcards', 'ayuda']; artBar.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', panelNames[i] === state.currentPanel)); }
    upd(); calcProgress();
    if (state.syncEnabled && state.initSync) state.initSync();
  } catch (e) {
    const ct = document.getElementById('ct');
    if (ct) ct.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);">Error cargando artículo: ' + escH(e.message) + '</div>';
  }
};

window.setRevState = function (ri, revState) {
  const d = ld();
  if (!d.revState) d.revState = {};
  d.revState['rev' + ri] = revState === 'done' ? new Date().toISOString() : revState;
  if (!d.revDone) d.revDone = {};
  if (revState === 'done') d.revDone['rev' + ri] = new Date().toISOString();
  else if (revState === 'discarded') d.revDone['rev' + ri] = 'discarded';
  else delete d.revDone['rev' + ri];
  sv(d); render();
};

window.setRevisionBaseDate = function () {
  const DATA = state.DATA;
  if (!DATA || !DATA.flujo || !DATA.flujo.revision) return;
  const now = new Date(); const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const base = prompt('Fecha base (día que leíste el artículo, formato YYYY-MM-DD):', localDate);
  if (!base || !/^\d{4}-\d{2}-\d{2}$/.test(base)) return;
  const d0 = new Date(base);
  const intervals = [0, 7, 30];
  const newDates = [];
  DATA.flujo.revision.forEach((r, i) => {
    const nd = new Date(d0); nd.setDate(nd.getDate() + intervals[i]);
    r.fecha = nd.toISOString().split('T')[0];
    newDates.push(r.fecha);
  });
  const ud = ld();
  ud.revDates = newDates;
  delete ud.revState; delete ud.revDone;
  sv(ud); render();
  alert('Fechas recalculadas:\n' + DATA.flujo.revision.map(r => r.sesion + ': ' + r.fecha).join('\n'));
};

// ============================================================
// RENDER AYUDA (help panel) — large static HTML
// ============================================================
export function renderAyuda() {
  // Delegate to state if a full implementation exists there (help content is very long)
  if (state.renderAyudaFull) { state.renderAyudaFull(); return; }

  const ct = state.ct;
  ct.innerHTML = getBreadcrumb() + `
  <div class="sb"><h3>Ayuda — CRISOL v1</h3></div>
  <p style="font-size:15px;color:var(--tx2);margin-bottom:18px;">Plataforma colaborativa de producción intelectual donde el investigador transforma fuentes complejas en publicaciones terminadas. CRISOL funciona como: <b>(1)</b> Llamado a la acción — proyectos, kanban, sidebar; <b>(2)</b> Espacio de trabajo multitask — pestañas, editor-taller; <b>(3)</b> Control de riesgos — gates anti-deuda intelectual entre fases; <b>(4)</b> Trazabilidad reflexiva — bitácora con enlaces, prompts, decisiones; <b>(5)</b> Dominio del conocimiento — procesar tus propios textos con /sila; <b>(6)</b> Colaboración — invitaciones, roles, proyectos compartidos.</p>

  <div class="help-section"><div class="help-head open" onclick="togHelp(this)"><span class="hchv">▸</span> Los tres niveles de la mente investigadora</div><div class="help-body open">
    <div class="help-item"><h4>Micro · Meso · Macro</h4><p>La mente del investigador opera en tres niveles <b>simultáneamente</b>, no secuencialmente. CRISOL replica esta simultaneidad:</p></div>
    <div class="help-item"><h4>Nivel 1 — Micro: El párrafo</h4><p><i>"¿Qué dice esta oración? ¿Apoya o contradice mi argumento?"</i><br><br>Decodificación + evaluación a nivel de párrafo. CRISOL lo cubre con <b>texto anotado, claims S/C/N, interrogación elaborativa, auto-explicación, TTS</b>. Este nivel produce la materia prima del conocimiento.</p></div>
    <div class="help-item"><h4>Nivel 2 — Meso: Las conexiones</h4><p><i>"¿Qué le diría Argyris a Nonaka? ¿Puedo articular una oración que conecte estos 3 autores?"</i><br><br>El investigador está <b>entre artículos</b> — busca tensiones, convergencias, gaps. Cuando escribe, no documenta lo que leyó: <b>descubre lo que piensa</b>. CRISOL lo cubre con <b>Mi tesis, Quiz interleaved, Comparar conceptos, Editor con citas vinculadas</b>.</p></div>
    <div class="help-item"><h4>Nivel 3 — Macro: La perspectiva</h4><p><i>"¿Mi marco teórico tiene sustento? ¿Qué sección está débil? ¿Para qué estoy leyendo este artículo?"</i><br><br>Sin perspectiva macro, el investigador lee sin saber para qué, escribe sin saber cómo encaja, y pierde motivación porque no ve progreso. <b>Los proyectos son el marco que da sentido a la lectura y la escritura.</b> Sin proyecto, leer es acumular. Con proyecto, leer es construir. CRISOL lo cubre con <b>Proyectos: dashboard, mapa fuentes→secciones, detección de gaps, KPIs, deadline</b>.</p></div>
    <div class="help-item"><h4>La espiral con eje</h4><p>La espiral hermenéutica ahora tiene un <b>eje central</b>: el proyecto. Cada vuelta tiene dirección — estás leyendo para tu paper, escribiendo tu marco teórico, descubriendo gaps en tu metodología. La navegación bidireccional (badges violeta, clicks entre niveles) convierte tres herramientas separadas en <b>tres vistas del mismo proceso cognitivo</b>.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> La espiral hermenéutica: cómo piensa un investigador</div><div class="help-body">
    <div class="help-item"><h4>El ciclo de vida del conocimiento</h4><p>La investigación no es lineal. No es "primero leo, después escribo." Es una <b>espiral</b> donde cada vuelta reconfigura las anteriores:<br><br>
    <b>PREGUNTAS</b> → Empieza con una incomodidad intelectual: algo que no calza, un fenómeno sin explicación satisfactoria.<br>
    <b>BUSCAR</b> → La pregunta te lleva a buscar interlocutores: quién apoya tu intuición, quién la contradice, quién la matiza.<br>
    <b>LEER</b> → No es lectura lineal. Es interrogación del texto: ¿qué dice? ¿desde qué tradición? ¿qué asume sin decirlo?<br>
    <b>EVALUAR</b> → El novato dice "interesante." El experto dice "esto apoya mi argumento en X pero contradice mi posición en Y."<br>
    <b>CONECTAR</b> → Un artículo solo no dice nada. El conocimiento emerge de las conexiones entre autores, tensiones entre teorías, gaps que tu investigación puede llenar.<br>
    <b>ESCRIBIR</b> → No documenta el pensamiento: lo produce. Al articular una oración que conecta 3 autores con tu hipótesis, descubres en tiempo real si tu argumento funciona.<br>
    <b>DESCUBRIR</b> → Al escribir descubres lo que no sabías que no sabías. Nuevas preguntas, nuevos gaps. El ciclo recomienza.</p></div>
    <div class="help-item"><h4>Lo que hace diferente al experto</h4><p>El novato recorre el ciclo <b>una vez</b>: lee todo, después escribe todo. El experto lo recorre <b>continuamente en espiral</b>: lee 3 artículos, escribe un párrafo, descubre un gap, busca 2 más, refina el párrafo. Y hay algo más profundo: <b>el conocimiento no se acumula, se reconfigura</b>. Cuando lees a Luhmann, entiendes la complejidad de una forma. Cuando después lees a Habermas criticándolo, lo que creías saber sobre Luhmann cambia de significado.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> CRISOL como exoesqueleto cognitivo</div><div class="help-body">
    <div class="help-item"><h4>El problema que resuelve</h4><p>La memoria de trabajo humana maneja ~4 items simultáneamente (Cowan, 2001). Leer un paper demanda: decodificar vocabulario (1 slot), mantener el hilo argumentativo (1 slot), recordar el contexto (1 slot), evaluar críticamente (1 slot). No queda espacio para lo más importante: <b>pensar qué significa esto para TU investigación</b>.<br><br>
    CRISOL es un exoesqueleto que <b>descarga las capas inferiores</b> para que tu mente se dedique a lo que ninguna máquina puede hacer: posicionar, juzgar, conectar, crear.</p></div>
    <div class="help-item"><h4>Las 4 capas cognitivas de la lectura</h4><p>
    <b>Capa 1 — Proposicional:</b> ¿Qué dice esta oración? CRISOL descarga esto con anotaciones pre-generadas.<br><br>
    <b>Capa 2 — Situacional:</b> ¿Qué fenómeno describe? CRISOL lo sostiene con highlights, ejemplos y estructura de acordeones.<br><br>
    <b>Capa 3 — Intertextual:</b> ¿Quién más dice esto? CRISOL lo externaliza con glosario cross-article, tensiones, búsqueda global.<br><br>
    <b>Capa 4 — Posicional:</b> ¿Qué significa para MI argumento? CRISOL protege esta capa con el claims tracker — fuerza la evaluación párrafo por párrafo.</p></div>
    <div class="help-item"><h4>Cómo CRISOL implementa cada fase del ciclo</h4><p>
    <b>PREGUNTAS</b> → Puente a tu tesis, Preguntas del Mapa inter-textual<br>
    <b>BUSCAR</b> → Directorio de fuentes académicas, búsqueda global cross-article<br>
    <b>LEER</b> → Texto anotado con TTS + word tracking, avance con Enter, auto-explicación<br>
    <b>EVALUAR</b> → Claims tracker (apoya/contrasta/neutro) + detector de sesgo de confirmación<br>
    <b>CONECTAR</b> → Comparar conceptos, quiz interleaved, Mi tesis cross-article<br>
    <b>ESCRIBIR</b> → Editor de documentos con citas vinculadas, plantillas académicas, exportar APA<br>
    <b>DESCUBRIR</b> → Artículos no citados, gaps detectados, revisión espaciada</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Base científica del aprendizaje</div><div class="help-body">
    <div class="help-item"><h4>El problema</h4><p>Lees un paper de 20 páginas. Te toma 4-6 horas. Una semana después recuerdas el 20%. Cuando escribes tu marco teórico, vuelves a leer todo desde cero. Multiplica eso por 40-80 artículos.</p></div>
    <div class="help-item"><h4>7 técnicas con evidencia sólida</h4><p>
    <b>1. Pre-lectura estructurada</b> (advance organizers, Ausubel 1960) — Leer posicionamiento y esqueleto ANTES del texto.<br><br>
    <b>2. Anotación elaborativa</b> (Pressley et al. 1987) — "¿Por qué?" fuerza conexiones causales.<br><br>
    <b>3. Auto-explicación</b> (Chi et al. 1989) — Explicar en tus palabras = mejor predictor de comprensión profunda.<br><br>
    <b>4. Evaluación posicional</b> — Claims apoya/contrasta/neutro operacionalizan la lectura crítica doctoral.<br><br>
    <b>5. Retrieval practice</b> (Roediger &amp; Karpicke 2006) — Responder de memoria consolida 3x más que releer.<br><br>
    <b>6. Interleaving</b> (Bjork) — Quiz mezcla preguntas de todos los artículos.<br><br>
    <b>7. Revisión espaciada</b> (Ebbinghaus 1885; Cepeda 2006) — 3 sesiones: hoy, 7 días, 30 días.</p></div>
    <div class="help-item"><h4>Antes vs después</h4><p>
    <b>Sin CRISOL:</b> 5-6h/artículo · 20% retención a 30 días · releer todo al escribir · notas dispersas<br>
    <b>Con CRISOL:</b> 2-3h en 3 sesiones · 80% retención · evaluación posicional lista · todo conectado</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Flujo de trabajo recomendado</div><div class="help-body">
    <div class="help-item"><h4>Día 0 — Procesamiento + Pre-lectura + Puente (25 min)</h4><p>
    Pega el texto del artículo en Claude Code + <span class="key">/sila</span>. Mientras se procesa, prepara café.<br>
    Abre Pre-lectura: posicionamiento, esqueleto, alertas, citables (7 min).<br>
    Completa el Puente: 5 preguntas que conectan con tu tesis (12 min).</p></div>
    <div class="help-item"><h4>Día 0 — Lectura anotada + Consolidación (50-70 min)</h4><p>
    Texto anotado párrafo por párrafo (Enter o TTS para avanzar).<br>
    Por cada párrafo: lee → evalúa claim (S/C/N) → responde ¿por qué? → auto-explicación si es difícil.<br>
    Al final de cada sección: retrieval + termómetro de confianza.</p></div>
    <div class="help-item"><h4>Día 7 — Sesión 2 (15 min)</h4><p>Quiz interleaved con artículos anteriores. Revisar claims.</p></div>
    <div class="help-item"><h4>Día 30 — Sesión 3 (10 min)</h4><p>Glosario como auto-examen. Retrieval difícil. 2 conexiones con otros artículos en el Mapa.</p></div>
    <div class="help-item"><h4>Al escribir tu investigación</h4><p>
    1. <b>Mi tesis</b> → claims cross-article listos para usar<br>
    2. <b>Mis escritos</b> → editor con citas vinculadas + plantillas académicas<br>
    3. No vuelves a releer. Todo está evaluado y conectado.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Navegación general</div><div class="help-body">
    <div class="help-item"><h4>📑 Pestañas por artículo (8)</h4><p>
    <b>Dashboard</b> — KPIs, revisión espaciada, continuar lectura, claims<br>
    <b>Pre-lectura</b> — 5 sub-tabs: posicionamiento, esqueleto, resumen, alertas, citables<br>
    <b>Puente</b> — 5 preguntas que conectan el texto con tu tesis<br>
    <b>Texto anotado</b> — Lectura principal con herramientas interactivas<br>
    <b>Glosario</b> — 3 sub-tabs: conceptos, mapa jerárquico, tensiones<br>
    <b>Reflexiones</b> — 8 bloques: impresión, conexiones, preguntas, textos, acciones, dudas, agenda, notas<br>
    <b>Mapa</b> — Diálogos inter-textuales: converge, tensiona, abre preguntas<br>
    <b>Flashcards</b> — Cards de estudio + modo estudio</p></div>
    <div class="help-item"><h4>📌 Sidebar jerárquico</h4><p>
    <b>📊 Vista general</b> — Home: proyectos, pipeline, Kanban, KPIs, búsqueda global<br>
    <b>▸ Proyectos</b> — Agrupados por eje, propios + compartidos<br>
    <b>▸ Mis escritos</b> — Agrupados por tags<br>
    <b>▸ Artículos</b> — Agrupados por categoría + importar .json<br>
    <b>▸ Herramientas</b> — PRISMA, Kanban, Pipeline, Mi tesis, Quiz, Comparar, Reporte</p></div>
    <div class="help-item"><h4>🔨 Workspace tabs</h4><p>Barra inferior con hasta 4 pestañas abiertas. 💡 Botón de captura rápida: anota ideas → Kanban.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Herramientas por párrafo</div><div class="help-body">
    <div class="help-item"><h4>📖 Párrafos (acordeones)</h4><p>Click para abrir. Solo uno abierto a la vez. Highlights de colores: <span style="background:var(--hla);padding:2px 5px;border-radius:3px;">Autores</span> <span style="background:var(--hlt);padding:2px 5px;border-radius:3px;">Términos</span> <span style="background:var(--hlk);padding:2px 5px;border-radius:3px;">Clave</span> <span style="background:var(--hle);padding:2px 5px;border-radius:3px;">Ejemplos</span></p></div>
    <div class="help-item"><h4>→ Avanzar</h4><p><b>"Siguiente párrafo →"</b> o <span class="key">Enter</span>. Marca como leído y abre el siguiente.</p></div>
    <div class="help-item"><h4>🔊 TTS con word tracking</h4><p>Cada palabra se ilumina mientras se pronuncia. Avanza automáticamente entre párrafos y secciones.</p></div>
    <div class="help-item"><h4>🎤 Dictado por voz</h4><p>Botón 🎤 al lado de cada textarea. Funciona en español.</p></div>
    <div class="help-item"><h4>✓/✗/― Claims</h4><p>Evalúa: <span style="color:var(--green);">apoya</span> / <span style="color:var(--red);">contrasta</span> / <span style="color:var(--tx3);">neutro</span>. Atajos: <span class="key">S</span> <span class="key">C</span> <span class="key">N</span>. Nota explicativa. Detector de sesgo si >85% apoyan.</p></div>
    <div class="help-item"><h4>📝❓💡✍</h4><p><b>Anotaciones</b> (pre-generadas) · <b>¿Por qué?</b> (elaborativa) · <b>Explicar</b> (auto-explicación) · <b>Reflexión</b> (notas libres)</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Proyectos y colaboración</div><div class="help-body">
    <div class="help-item"><h4>📁 Crear proyecto</h4><p>Sidebar → <b>"+ Nuevo proyecto"</b> → nombre, descripción, deadline, carpeta Drive. Agregar artículos y documentos desde el dashboard del proyecto.</p></div>
    <div class="help-item"><h4>🔄 Workflow</h4><p>Selecciona un modo de producción (🧬 /dr, 🔬 clo-author, o 🔗 Mixto) desde los botones en la cabecera del workflow. El modo activo reemplaza las fases estándar con un wizard especializado. Si no seleccionas ningún modo, se muestran las 9 fases genéricas (Ideación → Publicación).</p></div>
    <div class="help-item"><h4>🧬🔬🔗 Tres modos de producción doctoral</h4><p>En la barra de workflow, tres botones activan modos especializados:<br><br>
    <b>🧬 /dr</b> — Tesis y ensayos teóricos en español. 10 fases: 🔭 Exploración → 📖 Lectura → ✍ Escritura → 🔍 Crítica → 🧬 Humanización → 📎 Verificación → 🧠 Profundización → 💎 Impacto → ⚖ Benchmarking → 🚀 Entrega. Incluye 4 agentes en review, 30 principios de escritura, mentor socrático, abogado del diablo, evaluación de impacto con 4 agentes antagónicos, y benchmarking contra publicaciones ancla.<br><br>
    <b>🔬 clo-author</b> — Papers empíricos con R, LaTeX, inglés. 7 fases: Descubrimiento → Estrategia → Análisis → Escritura → Peer Review simulado → R&R → Submission. Basado en clo-author v3.1.1 (16 agentes, worker-critic pairs).<br><br>
    <b>🔗 Mixto</b> — Ambos simultáneamente. Marco teórico con /dr + validación empírica con clo-author. Los outputs de un sistema alimentan los prompts del otro automáticamente.<br><br>
    Cada proyecto elige su modo independientemente. Puedes tener un proyecto teórico en 🧬 /dr y otro empírico en 🔬 clo-author al mismo tiempo.</p></div>
    <div class="help-item"><h4>🚧 Gates socráticos obligatorios</h4><p>Al avanzar de fase, CRISOL muestra un gate con dos secciones:<br><br>
    <b>📋 Verificación:</b> Preguntas de check rápido (dropdowns).<br>
    <b>🧠 Reflexión socrática:</b> Preguntas abiertas que el investigador DEBE responder por escrito (mínimo 20 caracteres). Sin respuesta, no se pasa el gate. 19 preguntas socráticas distribuidas en 9 gates.<br><br>
    Las respuestas socráticas se guardan en Supabase para que Claude las lea y personalice las siguientes interacciones.<br><br>
    <b>🧬 /dr (9 gates):</b><br>
    Exploración (¿pregunta precisa? + reflexión sobre gap) · Lectura (¿conexiones reales? + reflexión sobre cambios) · Escritura (¿autoría verificable? + reflexión sobre contribución y decisiones) · Crítica (¿score ≥80? + reflexión sobre debilidades) · Humanización (¿anti-IA ≥85? + reflexión sobre voz) · Verificación (ZERO TOLERANCIA: gate NO se puede saltar + reflexión sobre citación) · Profundización (¿respondiste mentor y diablo? + respuestas escritas) · Impacto (¿contribución nombrable?) · Benchmarking (¿posición relativa conocida?)<br><br>
    <b>🔬 clo-author (5 gates con scores de critics)</b><br><br>
    Los gates son personales — cada investigador los pasa independientemente.</p></div>
    <div class="help-item"><h4>🌿 Ramas argumentativas</h4><p>Cuando emerge un replanteamiento, en vez de reabrir una fase (destruye trazabilidad), puedes <b>bifurcar el proyecto</b>:<br><br>
    Click <b>🌿 Bifurcar</b> en el wizard → nombra la rama → se crea una copia desde la fase actual.<br><br>
    La rama hereda todo el trabajo previo pero permite explorar un argumento alternativo sin afectar la línea principal.<br><br>
    <b>4 estados:</b> 🔵 En curso · ⏸ En espera · ✗ Descartada · ✅ Completada<br>
    <b>📌 Notas:</b> Agrega observaciones a cada rama — documenta por qué bifurcaste, qué descubriste, por qué descartaste.<br>
    <b>🧊 Congelar:</b> Crea un snapshot inmutable antes de presentar al comité. La rama sigue editable, el snapshot queda como registro permanente.<br>
    <b>Eliminar:</b> Solo ramas sin sub-ramas. Main nunca se elimina.<br><br>
    El portafolio incluye TODAS las ramas (activas, descartadas, completadas) como evidencia de exploración intelectual genuina.</p></div>
    <div class="help-item"><h4>📎 Artefactos del proceso</h4><p>Cada fase produce artefactos (borradores, scores, fichas, decisiones). La sección <b>"📎 Artefactos"</b> los registra con:<br><br>
    <b>11 tags transversales</b> en 3 categorías:<br>
    Sustancia: 📜 Argumento · 🔗 Síntesis · 📊 Evidencia · 🧭 Diseño<br>
    Proceso: 💭 Reflexión · ⚡ Decisión · 🔍 Crítica<br>
    Integridad: ✅ Verificación · 👣 Trazabilidad · 🎚 Calibración · 📌 Otro<br><br>
    Cada artefacto tiene: nombre, tag, score (opcional), delta vs iteración anterior, estado (borrador/revisado/final), enlaces Google Drive, y notas de reflexión.<br><br>
    La <b>trayectoria de scores</b> muestra visualmente la evolución: [72] → [78 +6] → [85 +7].<br>
    El botón <b>📊 Descargar portafolio</b> genera un .md completo para el comité.</p></div>
    <div class="help-item"><h4>🔄 Conexión Claude ↔ CRISOL</h4><p>Claude Code y CRISOL se comunican directamente vía Supabase:<br><br>
    <b>Claude → CRISOL:</b> Cuando /dr verify detecta una cita fabricada, escribe una alerta que CRISOL muestra como bloqueo rojo. Cuando /dr mentor dialoga, guarda las preguntas y respuestas para personalizar gates futuros.<br><br>
    <b>CRISOL → Claude:</b> Cuando completas un gate socrático, las respuestas se guardan para que Claude las lea y ajuste su evaluación. Cuando avanzas de fase, Claude sabe en qué fase estás y aplica severidad proporcional (×0.5 en exploración, ×1.25 en entrega).<br><br>
    Todo funciona automáticamente. Si no hay conexión, las skills funcionan igual — solo pierden el contexto personalizado.</p></div>
    <div class="help-item"><h4>👥 Colaboración</h4><p>
    <b>Invitar:</b> Dashboard del proyecto → <b>"Invitar"</b> → genera link con token (7 días)<br>
    <b>Roles:</b> Coautor (ve todo, gates propios) · Reviewer (lectura + comentarios) · Lector (solo docs publicados)<br>
    <b>Principio:</b> "Lo que produces es compartido, lo que piensas es personal"<br>
    <b>PRISMA:</b> Toggle "Mi vista / Vista de [coautor]" para ver el observatorio de otro miembro</p></div>
    <div class="help-item"><h4>📝 Bitácora</h4><p>Registra cada sesión de trabajo en 30 segundos: tipo, nota, enlaces, prompt usado, insight. Los insights se promueven a Decisiones clave.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> PRISMA — Observatorio de Investigación</div><div class="help-body">
    <div class="help-item"><h4>🔬 ¿Qué es PRISMA?</h4><p><b>Perspectiva de la Investigación: Síntesis, Mapa y Análisis</b> — un observatorio que construye sentido a partir de tus escritos. Opera a nivel de tu investigación completa.</p></div>
    <div class="help-item"><h4>Las 6 pestañas</h4><p>
    <b>🌱 Jardín</b> — Documentos como organismos: Semilla → Brote → Árbol<br>
    <b>📊 Matriz</b> — Documentos × temas con detección de gaps<br>
    <b>🎯 Argumento</b> — Pregunta → argumento central → premisas con nivel de soporte<br>
    <b>❓ Preguntas</b> — Preguntas emergentes con estado y tipo<br>
    <b>🕳 Vacíos</b> — Gaps y fortalezas de tu investigación<br>
    <b>📈 Evolución</b> — Timeline de tu pensamiento</p></div>
    <div class="help-item"><h4>💾 Export / 📂 Import</h4><p>PRISMA se regenera completo cada vez que /sila procesa tu corpus. Usa 💾 para exportar como JSON y 📂 para importar.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Datos, respaldo y seguridad</div><div class="help-body">
    <div class="help-item"><h4>☁ Auto-guardado</h4><p>Cada cambio se guarda en Supabase en tiempo real (2s debounce). Tus datos están en la nube, accesibles desde cualquier dispositivo.</p></div>
    <div class="help-item"><h4>💾 Sistema de respaldo (3 niveles)</h4><p>
    <b>Automático:</b> Cada 30 minutos, si hubo cambios, CRISOL guarda un backup completo en Supabase. No necesitas hacer nada — es silencioso.<br><br>
    <b>Manual:</b> Sidebar → ⚙ → <b>"💾 Backup completo"</b> descarga un JSON con TODOS tus datos de Supabase (proyectos, documentos, diálogo socrático, alertas, artefactos, todo). Úsalo para tener una copia física en tu máquina.<br><br>
    <b>Vía /sync:</b> Al ejecutar <span class="key">/sync</span> en Claude Code, además de sincronizar con Obsidian, se guarda un backup en <code>G:\Mi unidad\RESPALDOS\CRISOL\</code> con retención inteligente: último + 12 semanales + todos los mensuales (~100 MB/año).</p></div>
    <div class="help-item"><h4>📂 Restaurar</h4><p>Si pierdes datos, sube el JSON de backup con <b>"📂 Restaurar"</b> en ⚙. CRISOL reconstruye todo: proyectos, documentos, gates, ramas, artefactos.</p></div>
    <div class="help-item"><h4>🔐 Acceso por invitación</h4><p>CRISOL requiere código de invitación para registrarse. Los nuevos usuarios solicitan acceso con un formulario. Los administradores aprueban/rechazan desde ⚙ → 📨 Solicitudes de invitación.</p></div>
    <div class="help-item"><h4>📄 Importar artículo</h4><p>Sidebar → Artículos → <b>"+ Importar artículo (.json)"</b>. Sube un artículo procesado con /sila.</p></div>
    <div class="help-item"><h4>🔔 Notificaciones</h4><p>Badge en el sidebar. Se activan para invitaciones aceptadas y solicitudes de acceso pendientes (admin).</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Skills para Claude Code (descargables)</div><div class="help-body">
    <div class="help-item"><h4>¿Qué son las skills?</h4><p>Las skills son instrucciones que Claude Code ejecuta automáticamente. Se organizan en 3 categorías: procesamiento de artículos (/sila), producción doctoral (/dr), y paper empírico (clo-author). Descarga los archivos y colócalos en la carpeta de skills de tu Claude Code.</p></div>

    <div class="help-item"><h4 style="color:var(--gold);">— Procesamiento de artículos —</h4></div>

    <div class="help-item"><h4>📄 /sila — Procesar artículos académicos</h4><p>Transforma cualquier artículo académico en un documento Word (.docx) + datos JSON importables a CRISOL + notas Obsidian + flashcards Anki.<br><br>
    <b>Uso:</b> Pega el texto de un artículo en Claude Code y escribe <span class="key">/sila</span><br>
    <b>Resultado:</b> .docx + .json (importar en CRISOL → Artículos → Importar)<br><br>
    <a href="downloads/skills/SKILL_sila.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_sila.md</a><br>
    <a href="downloads/skills/sila_metodologia.md" download style="color:var(--blue);text-decoration:underline;">⬇ Referencia: metodologia.md</a><br>
    <a href="downloads/skills/sila_obsidian_schema.md" download style="color:var(--blue);text-decoration:underline;">⬇ Referencia: obsidian_schema.md</a></p></div>
    <div class="help-item"><h4>🔬 /prisma — Descubrir tu metarrelato investigativo</h4><p>Lee tus propios escritos (PDFs, borradores, ensayos) y descubre el argumento central emergente, los vacíos, las preguntas implícitas, y la evolución de tu pensamiento.<br><br>
    <b>Uso:</b> Adjunta tus PDFs en Claude Code y escribe <span class="key">/prisma</span><br>
    <b>Resultado:</b> PRISMA.json importable con merge inteligente<br><br>
    <a href="downloads/skills/SKILL_prisma.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_prisma.md</a></p></div>
    <div class="help-item"><h4>🔄 /sync — Sincronizar con Obsidian + Anki</h4><p>Descarga tus anotaciones desde Supabase y las escribe como notas en tu bóveda Obsidian local.<br><br>
    <b>Uso:</b> <span class="key">/sync</span> al volver a tu PC<br><br>
    <a href="downloads/skills/SKILL_sync.md" download style="color:var(--green);text-decoration:underline;">⬇ Descargar SKILL_sync.md</a></p></div>

    <div class="help-item"><h4 style="color:var(--purple);">— 🧬 /dr — Producción doctoral (9 skills) —</h4></div>

    <div class="help-item"><h4>¿Qué es /dr?</h4><p>Sistema integral para producción de textos doctorales con IA. 9 comandos que cubren el ciclo completo: lectura → escritura → revisión → humanización → verificación → profundización → entrega. Incluye score compuesto de 6 componentes, quality gates numéricos, y reporte de trazabilidad. Calibrado al estilo del investigador.<br><br>
    <b>Activar:</b> En cualquier proyecto → botón 🧬 /dr en la barra de workflow<br>
    <b>El wizard guía paso a paso</b> con prompts copiables y campos para pegar outputs.</p></div>
    <div class="help-item"><h4>📖 /dr read — Lector profundo</h4><p>Lee con lente de tesis propia. Produce ficha de explotación: clasificación A/B/C/D, conexiones, citas textuales, tensiones, mapa de uso.<br>
    <b>Modos:</b> <span class="key">/dr read</span> · <span class="key">--gap</span> · <span class="key">--compare</span> · <span class="key">--scan</span></p></div>
    <div class="help-item"><h4>✍ /dr write — Escritor doctoral</h4><p>Genera borradores con esqueleto aprobado y estilo calibrado. Worker-critic con autoevaluación.<br>
    <b>Modos:</b> <span class="key">section</span> · <span class="key">draft</span> · <span class="key">extend</span> · <span class="key">rewrite</span></p></div>
    <div class="help-item"><h4>🔍 /dr review — Crítico adversarial (4 agentes)</h4><p>4 agentes independientes en paralelo: (1) Crítico de contenido (CT+PL+RM+IA), (2) Humanizer (15 patrones anti-IA), (3) Verificador de citas (F1-F5), (4) Evaluador de 30 principios de escritura. Phase-sensitive severity (×0.5 en exploración a ×1.25 en entrega). Cross-round learning (errores recurrentes ×1.5). Escribe alertas a CRISOL vía Supabase.</p></div>
    <div class="help-item"><h4>🧬 /dr humanize — Detector anti-IA</h4><p>15 patrones de escritura IA en 3 niveles: CRÍTICO (listitis, coletillas, hedging), ALTO (paralelismo, vocabulario hiperpulido), MEDIO (oraciones uniformes, verbos débiles). Score 0-100, objetivo ≥85.</p></div>
    <div class="help-item"><h4>📎 /dr verify — Verificador de citas</h4><p>Verifica TODAS las citas contra PDFs originales. 5 tipos de error: F1 Fabricada (-20, bloquea entrega), F2 Distorsionada (-10), F3 Descontextualizada (-6), F4 Inexacta (-3), F5 Inverificable (-5).</p></div>
    <div class="help-item"><h4>🧠 /dr mentor — Mentor socrático</h4><p>Preguntas que obligan a pensar más profundo. Anti-sycophancy: nunca halaga sin sustancia.<br>
    <b>Modos:</b> <span class="key">--defend</span> · <span class="key">--clarify</span> · <span class="key">--connect</span></p></div>
    <div class="help-item"><h4>😈 /dr devil — Abogado del diablo</h4><p>Ataques sistemáticos para fortalecer el argumento. Steelman antes de destruir. 4 niveles: amigable, reviewer, hostil, existencial.<br>
    <b>Modos:</b> <span class="key">--reviewer CMR</span> · <span class="key">--defense</span> · <span class="key">--steelman</span></p></div>
    <div class="help-item"><h4>💎 /dr impact — Evaluación de impacto</h4><p>4 agentes antagónicos evalúan la contribución del artículo en 6 dimensiones: Originalidad (Corley & Gioia), Novedad (Davis), Utilidad, Claridad (Suddaby), Generalidad (Whetten), Rigor causal. Identifica vacíos en la literatura, rankea aportes, detecta tensiones entre dimensiones, sugiere párrafos de posicionamiento explícito. Score max 24 por vacío.</p></div>
    <div class="help-item"><h4>📊 /dr report — Reporte de trazabilidad</h4><p>6 secciones: ficha técnica, genealogía del argumento, trayectoria de calidad, integridad de fuentes, decisiones del investigador, declaración metodológica. Documenta TODO el proceso para el comité.</p></div>
    <div class="help-item"><h4>📓 /dr journal — Diario de investigación</h4><p>Registro automático de cada acción /dr con timestamp, comando, documento, resultado, score.</p></div>
    <div class="help-item"><p><b>Descarga todas las skills /dr desde el wizard:</b> cada tarea con botón 📥 Skill descarga la guía correspondiente. O descarga el paquete completo:<br><br>
    <button class="btn bo" onclick="downloadDrSkill('dr_read')" style="font-size:12px;margin:2px;">📥 /dr read</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_write')" style="font-size:12px;margin:2px;">📥 /dr write</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_review')" style="font-size:12px;margin:2px;">📥 /dr review</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_humanize')" style="font-size:12px;margin:2px;">📥 /dr humanize</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_verify')" style="font-size:12px;margin:2px;">📥 /dr verify</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_mentor')" style="font-size:12px;margin:2px;">📥 /dr mentor</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_devil')" style="font-size:12px;margin:2px;">📥 /dr devil</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_report')" style="font-size:12px;margin:2px;">📥 /dr report</button>
    <button class="btn bo" onclick="downloadDrSkill('dr_impact')" style="font-size:12px;margin:2px;">📥 /dr impact</button></p></div>

    <div class="help-item"><h4 style="color:#2dd4bf;">— 🔬 clo-author — Paper empírico (10 comandos) —</h4></div>

    <div class="help-item"><h4>¿Qué es clo-author?</h4><p>Sistema para producción de papers empíricos cuantitativos. Basado en <a href="https://github.com/hugosantanna/clo-author" target="_blank" style="color:#2dd4bf;">clo-author v3.1.1</a> (Hugo Sant'Anna, Emory). 16 agentes organizados en 7 worker-critic pairs con separación estricta. Phase-sensitive severity. ~40 journal profiles.<br><br>
    <b>Activar:</b> En cualquier proyecto → botón 🔬 clo-author → configurar directorio del proyecto<br>
    <b>Requiere:</b> Claude Code + directorio local con estructura de proyecto</p></div>
    <div class="help-item"><h4>10 comandos clo-author</h4><p>
    <span class="key">/new-project</span> — Inicializar proyecto (estructura de carpetas, journal, agentes)<br>
    <span class="key">/discover</span> — Revisión de literatura (librarian) + evaluación de datos (explorer)<br>
    <span class="key">/strategize</span> — Estrategia de identificación causal (strategist)<br>
    <span class="key">/analyze</span> — Pipeline de datos + estimación en R/Stata (coder)<br>
    <span class="key">/write</span> — Manuscrito LaTeX + humanizer pass de 24 categorías (writer)<br>
    <span class="key">/review</span> — Peer review simulado: editor + 2 referees ciegos<br>
    <span class="key">/revise</span> — R&R: clasificación en 5 categorías + response letter<br>
    <span class="key">/talk</span> — Presentación académica (Beamer/RevealJS)<br>
    <span class="key">/submit</span> — Verificación final + replication package<br>
    <span class="key">/tools</span> — Utilidades: verify, domain-profile, etc.</p></div>
    <div class="help-item"><h4>Instalación clo-author</h4><p>
    1. En Claude Code, clona el repositorio: <span class="key">git clone https://github.com/hugosantanna/clo-author</span><br>
    2. Copia la carpeta <span class="key">.claude/</span> al directorio de tu proyecto<br>
    3. En CRISOL, activa 🔬 clo-author y configura la ruta al directorio<br>
    4. El wizard te guía paso a paso con prompts que incluyen <span class="key">cd [directorio]</span> automáticamente</p></div>

    <div class="help-item"><h4 style="color:var(--gold);">— Instalación general —</h4></div>

    <div class="help-item"><h4>Estructura de archivos</h4><p>
    <span class="key">~/.claude/skills/sila/SKILL.md</span> + references/<br>
    <span class="key">~/.claude/skills/prisma/SKILL.md</span><br>
    <span class="key">~/.claude/skills/sync/SKILL.md</span><br>
    <span class="key">~/.claude/skills/dr/SKILL.md</span> + references/ (8 archivos)<br>
    <span class="key">[proyecto]/.claude/</span> (clo-author, por proyecto)<br><br>
    Reinicia Claude Code después de instalar. Las skills aparecen como comandos con /.</p></div>
  </div></div>

  <div class="help-section"><div class="help-head" onclick="togHelp(this)"><span class="hchv">▸</span> Atajos de teclado</div><div class="help-body">
    <div class="help-item"><p>
    <span class="key">Enter</span> — Siguiente párrafo (marca como leído)<br>
    <span class="key">S</span> / <span class="key">C</span> / <span class="key">N</span> — Claim: apoya / contrasta / neutro<br>
    <span class="key">Ctrl+F</span> — Buscar en el texto<br>
    <span class="key">Ctrl+Z</span> — Deshacer en editor<br>
    <span class="key">Ctrl+S</span> — Guardar documento<br>
    <span class="key">Escape</span> — Cerrar modales</p></div>
  </div></div>`;
}

// ============================================================
// ============================================================
// DELETE DIALOG ENTRY
// ============================================================
window.deleteDlg = function(pid, idx) {
  if (!confirm('¿Borrar esta reflexión?')) return;
  const d = ld(); if (d.d && d.d[pid]) { d.d[pid].splice(idx, 1); if (d.d[pid].length === 0) delete d.d[pid]; sv(d); }
  const container = document.getElementById('e' + pid);
  if (container) {
    const entries = gD(pid);
    container.innerHTML = entries.map((e, i) => '<div class="de" style="position:relative;"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + e.t + '<span onclick="deleteDlg(\'' + pid + '\',' + i + ')" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--tx3);font-size:12px;opacity:0.4;transition:opacity 0.1s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4" title="Borrar">✕</span></div>').join('');
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
