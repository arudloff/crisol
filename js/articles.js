// ============================================================
// CRISOL — articles.js  (article loading, rendering & interaction)
// Extracted from SILA v4 monolith · largest module
// ============================================================

import { state } from './state.js';
import { ld, sv, gD, aD, gP, sP, gT, sT, gC, sC, svF, gF, calcProgress } from './storage.js';
import { escH, linkify, showToast, hl } from './utils.js';
// Extracted modules (Sprint S4)
import { renderPreLectura, renderPuente, renderGlosario, renderReflexiones, renderMapa, renderRevision, renderPlSub, renderGlSub } from './articles-panels.js';
import { renderAyuda } from './articles-help.js';
import './articles-notes.js'; // side-effect: registers window handlers + keyboard listener

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

function persistNavMemory() { try { localStorage.setItem('sila_navMemory', JSON.stringify(navMemory)); } catch (e) { /* storage error */ } }

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
    if (state._renderDocEditor) state._renderDocEditor();
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
  const renderProjectBadges = state._renderProjectBadges || (() => '');
  const getProjectsForArticle = state._getProjectsForArticle || (() => []);

  ct.innerHTML = getBreadcrumb() + `<h2 style="font-size:clamp(17px,2.5vw,24px);font-weight:800;color:#fff;margin-bottom:6px;">${escH(m.authors)} (${escH(m.year)})</h2>
  <p style="font-size:15px;color:var(--tx2);line-height:1.5;">${escH(m.title)}<br><span style="color:var(--blue);">${escH(m.journal)} · ${escH(m.institution)}</span></p>
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
      <div style="font-size:14px;color:var(--tx);">${escH(detail)}</div>
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
        <div style="font-size:14px;color:var(--tx);">${escH(sec.title)} · ${escH(parTitle)}</div>
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


// Panels (prelectura, puente, glosario, reflexiones, mapa, revision) → articles-panels.js

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

// Claims functions (buildClaimsText, exportClaims, exportClaimsFile) → canonical source: projects-reports.js

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
  } catch (e) { /* storage error */ }
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
  container.innerHTML = entries.map((e, i) => '<div class="de" style="position:relative;"><div class="dd">' + new Date(e.d).toLocaleDateString() + '</div>' + escH(e.t) + '<span onclick="deleteDlg(\'' + pid + '\',' + i + ')" style="position:absolute;top:6px;right:8px;cursor:pointer;color:var(--tx3);font-size:12px;opacity:0.4;transition:opacity 0.1s;" onmouseover="this.style.opacity=1;this.style.color=\'var(--red)\'" onmouseout="this.style.opacity=0.4;this.style.color=\'var(--tx3)\'" title="Borrar">✕</span></div>').join('');
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

