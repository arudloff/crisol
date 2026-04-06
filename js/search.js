// ============================================================
// CRISOL — search.js  (Search — in-article, cross-article, article/doc search modals)
// Extracted from SILA v4 monolith · search module
// ============================================================

import { state } from './state.js';
import { ld, gC, gD, gF, svF } from './storage.js';
import {
  showToast, loadArticle, getArticleTags, hl,
  togglePar, renderSub, getClaim, getClaimNote
} from './utils.js';
import { getDocs, countDocWords } from './editor.js';

// ============================================================
// IN-ARTICLE SEARCH (texto anotado panel)
// ============================================================
let searchQuery = '';
let searchDebounce = null;

export { searchQuery };

export function onSearch(q) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = q.trim().toLowerCase();
    if (state.currentPanel !== 'texto') return;
    const target = document.getElementById('subsec-ct');
    if (!target) return;
    if (!searchQuery) { renderSub(state.currentSubSec); document.getElementById('search-count').textContent = ''; return; }
    renderSearchResults();
  }, 200);
}
window.onSearch = onSearch;

export function clearSearch() {
  searchQuery = '';
  const inp = document.getElementById('search-input');
  if (inp) inp.value = '';
  const target = document.getElementById('subsec-ct');
  if (target) renderSub(state.currentSubSec);
  const countEl = document.getElementById('search-count');
  if (countEl) countEl.textContent = '';
}
window.clearSearch = clearSearch;

export function renderSearchResults() {
  const target = document.getElementById('subsec-ct');
  if (!target) return;
  const q = searchQuery;
  const DATA = state.DATA;
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
      const eq = hit.par.eq || ''; const cnote = getClaimNote(pid); const hasSE = gF('se-' + pid) ? 'has' : '';
      const sMainText = hit.par.translation || hit.par.text;
      h += `<div class="pb-inner" id="body-${pid}">`;
      h += `<div class="pb-t"><button class="tts-btn" id="tts-${pid}" onclick="event.stopPropagation();toggleTTS('${pid}')" title="Escuchar">🔊</button>${hl(sMainText)}</div>`;
      if (hit.par.translation) { h += `<div class="pb-secondary"><span class="lang-tag">EN</span>${hl(hit.par.text)}</div>`; }
      h += `<div class="claims-bar"><div class="claim-btn support ${claim === 'support' ? 'active' : ''}" onclick="setClaim('${pid}','support',this)">✓ Apoya mi tesis</div><div class="claim-btn contrast ${claim === 'contrast' ? 'active' : ''}" onclick="setClaim('${pid}','contrast',this)">✗ Contrasta</div><div class="claim-btn neutral ${claim === 'neutral' ? 'active' : ''}" onclick="setClaim('${pid}','neutral',this)">― Neutro</div></div>`;
      h += `<div class="claim-note ${claim ? 'show' : ''}" id="cn-${pid}"><textarea placeholder="¿Cómo apoya o contrasta tu argumento?" onchange="saveClaimNote('${pid}',this.value)">${cnote}</textarea></div>`;
      h += `<div class="pb-br"><div class="pb-b" onclick="tog('a${pid}')">Anotaciones <span class="bdg">${hit.par.anns.length}</span></div><div class="pb-b" onclick="tog('eq${pid}')">¿Por qué?</div><div class="pb-b ${hasSE}" onclick="tog('se${pid}')">💡 Explicar</div><div class="pb-b ${ex.length ? 'has' : ''}" onclick="tog('d${pid}')">✍️ Reflexión${ex.length ? ' <span class=bdg>' + ex.length + '</span>' : ''}</div></div>`;
      h += `<div class="pp ap" id="a${pid}">${hit.par.anns.map(a => '<div class="an an-' + a.c + '">' + (a.b ? '<strong>' + a.t + '</strong>' : a.t) + '</div>').join('')}</div>`;
      h += `<div class="eq-panel" id="eq${pid}"><div class="eq-label">Interrogación elaborativa</div><div class="eq-q">${eq}</div><textarea class="di" placeholder="Tu respuesta a esta pregunta..." onchange="svF('eq-${pid}',this.value)">${gF('eq-' + pid)}</textarea></div>`;
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
// GLOBAL SEARCH — cross-article
// ============================================================
let globalSearchTimer = null;

export async function onGlobalSearch(q) {
  clearTimeout(globalSearchTimer);
  globalSearchTimer = setTimeout(async () => {
    q = q.trim().toLowerCase();
    const resultsEl = document.getElementById('global-search-results');
    const countEl = document.getElementById('global-search-count');
    if (!q || q.length < 3) { if (resultsEl) resultsEl.style.display = 'none'; if (countEl) countEl.textContent = ''; return; }
    const manifest = window.SILA_MANIFEST || [];
    for (const art of manifest) { await loadArticle(art.key); }
    let h = '', totalFound = 0;
    manifest.forEach(art => {
      const data = window.SILA_ARTICLES[art.key]; if (!data) return;
      let hits = [];
      data.sections.forEach((sec, si) => {
        sec.paragraphs.forEach((par, pi) => {
          const haystack = (par.title + ' ' + (par.translation || '') + ' ' + par.text + ' ' + (par.anns || []).map(a => a.t).join(' ')).toLowerCase();
          if (haystack.includes(q)) hits.push({ si, pi, title: par.title || ('Párrafo ' + (pi + 1)), text: par.text.substring(0, 150) + '...', sec: sec.title });
        });
      });
      // Search glossary too
      if (data.glosario) data.glosario.forEach((c, i) => {
        if ((c.concepto + ' ' + c.definicion + ' ' + c.tension).toLowerCase().includes(q))
          hits.push({ si: -1, pi: i, title: c.concepto, text: c.definicion.substring(0, 150) + '...', sec: 'Glosario' });
      });
      // Search tags
      const artTags = getArticleTags(art.key);
      if (artTags.some(t => t.toLowerCase().includes(q)))
        hits.push({ si: -1, pi: 0, title: 'Tags: ' + artTags.join(', '), text: 'Artículo etiquetado con: ' + artTags.join(', '), sec: 'Tags' });
      if (hits.length === 0) return;
      totalFound += hits.length;
      h += `<div style="margin:12px 0;"><h4 style="font-size:14px;color:var(--blue);margin-bottom:6px;">${art.authors} (${art.year}) — ${hits.length} resultado${hits.length !== 1 ? 's' : ''}</h4>`;
      hits.slice(0, 5).forEach(hit => {
        const clickAction = hit.si >= 0 ? `goToArticlePar('${art.key}',${hit.si},${hit.pi})` : `goToArticle('${art.key}')`;
        h += `<div class="gd-card" style="padding:10px 14px;margin:4px 0;" onclick="${clickAction}">`;
        h += `<div style="font-size:13px;color:var(--tx3);">${hit.sec}</div>`;
        h += `<div style="font-size:14px;color:#fff;font-weight:500;">${hit.title}</div>`;
        const hlText = hit.text.replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<span style="background:rgba(232,168,56,0.4);border-radius:2px;padding:0 2px;">$1</span>');
        h += `<div style="font-size:13px;color:var(--tx2);line-height:1.5;margin-top:4px;">${hlText}</div>`;
        h += `</div>`;
      });
      if (hits.length > 5) h += `<div style="font-size:13px;color:var(--tx3);padding:4px 14px;">... y ${hits.length - 5} más</div>`;
      h += `</div>`;
    });
    if (countEl) countEl.textContent = totalFound + ' resultado' + (totalFound !== 1 ? 's' : '') + ' en ' + manifest.length + ' artículo' + (manifest.length !== 1 ? 's' : '');
    if (resultsEl) { resultsEl.innerHTML = totalFound ? h : '<p style="padding:14px;color:var(--tx3);">Sin resultados</p>'; resultsEl.style.display = 'block'; }
  }, 300);
}
window.onGlobalSearch = onGlobalSearch;

// ============================================================
// ARTICLE SEARCH MODAL
// ============================================================
export function openArticleSearch() {
  document.getElementById('article-search-modal').classList.add('show');
  document.getElementById('article-search-q').value = ''; filterArticles();
  setTimeout(() => document.getElementById('article-search-q').focus(), 100);
}
window.openArticleSearch = openArticleSearch;

export function filterArticles() {
  const q = (document.getElementById('article-search-q').value || '').toLowerCase();
  const manifest = window.SILA_MANIFEST || [];
  const results = manifest.filter(a => !q || (a.authors + ' ' + a.year + ' ' + (a.category || '')).toLowerCase().includes(q));
  const el = document.getElementById('article-search-results');
  if (!results.length) { el.innerHTML = '<p style="color:var(--tx3);padding:20px;text-align:center;">Sin resultados</p>'; return; }
  el.innerHTML = results.map(a => {
    const w = a.weight === 'critico' ? '◆◆◆' : a.weight === 'importante' ? '◆◆' : '◆';
    return `<div class="cite-result" onclick="document.getElementById('article-search-modal').classList.remove('show');goToArticle('${a.key}')"><div class="cr-ref">${a.authors} (${a.year}) ${w}</div><div class="cr-text">${a.category || ''}</div></div>`;
  }).join('');
}
window.filterArticles = filterArticles;

// ============================================================
// DOCUMENT SEARCH MODAL
// ============================================================
export function openDocSearch() {
  document.getElementById('doc-search-modal').classList.add('show');
  document.getElementById('doc-search-q').value = ''; filterDocs();
  setTimeout(() => document.getElementById('doc-search-q').focus(), 100);
}
window.openDocSearch = openDocSearch;

export function filterDocs() {
  const q = (document.getElementById('doc-search-q').value || '').toLowerCase();
  const docs = getDocs();
  const results = docs.filter(d => !q || d.title.toLowerCase().includes(q) || d.blocks.some(b => (b.content || b.fragment || '').toLowerCase().includes(q)));
  const el = document.getElementById('doc-search-results');
  if (!results.length) { el.innerHTML = '<p style="color:var(--tx3);padding:20px;text-align:center;">Sin resultados</p>'; return; }
  el.innerHTML = results.map(d => {
    const st = d.status || 'borrador'; const stIcon = st === 'finalizado' ? '✓' : st === 'revision' ? '⏳' : '✍';
    return `<div class="cite-result" onclick="document.getElementById('doc-search-modal').classList.remove('show');openDoc('${d.id}')"><div class="cr-ref">${stIcon} ${d.title}</div><div class="cr-text">${(d.tags || []).join(', ')} · ${countDocWords(d)} pal</div></div>`;
  }).join('');
}
window.filterDocs = filterDocs;
