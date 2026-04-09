// ============================================================
// CRISOL — dashboard.js  (Global dashboard, sources, bias, quiz, study, report, compare)
// Extracted from SILA v4 monolith · dashboard module
// ============================================================

import { state } from './state.js';
import { ld, sv, gC, gD, gF, svF, calcProgress } from './storage.js';
import {
  showToast, getBreadcrumb, loadArticle, ensureToolsOpen,
  updateTopbar, getProjects, getKanban, saveKanban,
  renderKanbanInline, renderProjectsSummary, buildDocSidebar,
  buildProjectSidebar, getArticleTags, goHome,
  getProjectClaims, calcDaysRemaining, calcProjectAlert, escH
} from './utils.js';
import { getDocs, countDocWords, renderDocEditor } from './editor.js';
import { syncSettingsToCloud } from './sync.js';

// ============================================================
// GLOBAL DASHBOARD — cross-article overview
// ============================================================
export function renderGlobalDash() {
  const ct = document.getElementById('ct');
  const manifest = window.SILA_MANIFEST || [];
  let h = getBreadcrumb() + `<h2 style="font-size:clamp(17px,2.5vw,24px);font-weight:800;color:#fff;margin-bottom:6px;">Vista general</h2>`;
  h += `<p style="font-size:15px;color:var(--tx2);margin-bottom:10px;">${manifest.length} artículo${manifest.length !== 1 ? 's' : ''} en tu biblioteca</p>`;

  // 1. Projects summary
  h += `<h3 style="font-size:14px;color:var(--tx2);margin:14px 0 8px;">Mis proyectos</h3>`;
  h += renderProjectsSummary();

  // Pipeline compact
  const allProjects = getProjects();
  if (allProjects.length > 0) {
    h += `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Pipeline</h3>`;
    const PHASE_SHORT = ['Idea', 'Fund.', 'Diseño', 'Escrit.', 'Rev.', 'Sub.', 'Review', 'Resp.', 'Pub.'];
    const PHASE_IDS = ['ideacion', 'fundamentacion', 'diseno', 'escritura', 'revision', 'submission', 'peer_review', 'respuesta', 'publicacion'];
    allProjects.forEach(proj => {
      const fases = proj.fases || [];
      const days = calcDaysRemaining(proj.fechaLimite);
      const daysColor = days < 7 && days !== Infinity ? 'var(--red)' : days < 14 && days !== Infinity ? 'var(--gold)' : 'var(--green)';
      h += `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:7px;margin:4px 0;cursor:pointer;font-size:12px;" onclick="goToProject('${proj.id}')">`;
      h += `<span style="font-weight:600;color:var(--tx);min-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${proj.nombre}</span>`;
      PHASE_IDS.forEach(pid => {
        const fase = fases.find(f => f.id === pid);
        const estado = fase ? fase.estado : 'pendiente';
        const icon = estado === 'completado' ? '✅' : estado === 'en_progreso' ? '🔵' : estado === 'no_aplica' ? '·' : '○';
        h += `<span style="font-size:10px;" title="${pid}">${icon}</span>`;
      });
      if (days !== Infinity) h += `<span style="font-size:11px;color:${daysColor};font-weight:600;margin-left:auto;">${days}d</span>`;
      h += `</div>`;
    });
  }

  // 2. Kanban board (full, inline)
  h += `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Tablero de tareas</h3>`;
  h += renderKanbanInline();

  // 3. Global KPIs
  let totalSupport = 0, totalContrast = 0, totalNeutral = 0, totalNotes = 0;
  manifest.forEach(art => {
    try {
      const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.claims) Object.values(d.claims).forEach(c => { if (c === 'support') totalSupport++; else if (c === 'contrast') totalContrast++; else if (c === 'neutral') totalNeutral++; });
      if (d.d) Object.values(d.d).forEach(a => totalNotes += a.length);
    } catch (e) { /* storage error */ }
  });

  // Onboarding (first-time user)
  const hasAnyProgress = totalSupport + totalContrast + totalNeutral + totalNotes > 0;
  const projects = getProjects();
  if (!hasAnyProgress && manifest.length === 0 && projects.length === 0) {
    // Brand new user — no articles, no projects
    h += `<div style="background:rgba(232,168,56,0.06);border:1px solid rgba(232,168,56,0.2);border-radius:10px;padding:24px;margin-bottom:18px;">`;
    h += `<h3 style="font-size:18px;color:var(--gold);margin-bottom:10px;">Bienvenido a CRISOL</h3>`;
    h += `<p style="font-size:14px;color:var(--tx);line-height:1.7;margin-bottom:14px;">CRISOL es tu plataforma de investigación. Aquí procesas artículos, escribes tu tesis, y colaboras con otros investigadores.</p>`;
    h += `<div style="display:flex;flex-direction:column;gap:10px;">`;
    h += `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg3);border-radius:8px;cursor:pointer;" onclick="createProject()"><span style="font-size:20px;">📁</span><div><div style="font-size:14px;color:#fff;font-weight:600;">Crear un proyecto</div><div style="font-size:12px;color:var(--tx3);">Organiza tus fuentes y escritos por tema</div></div></div>`;
    h += `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg3);border-radius:8px;cursor:pointer;" onclick="showImportModal()"><span style="font-size:20px;">📄</span><div><div style="font-size:14px;color:#fff;font-weight:600;">Importar un artículo (.json)</div><div style="font-size:12px;color:var(--tx3);">Sube un artículo procesado con /sila</div></div></div>`;
    h += `<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg3);border-radius:8px;cursor:pointer;" onclick="goPrisma()"><span style="font-size:20px;">🔬</span><div><div style="font-size:14px;color:#fff;font-weight:600;">Abrir PRISMA</div><div style="font-size:12px;color:var(--tx3);">Tu observatorio de investigación</div></div></div>`;
    h += `</div></div>`;
  } else if (!hasAnyProgress && manifest.length > 0) {
    // Has articles but no progress
    h += `<div style="background:rgba(232,168,56,0.06);border:1px solid rgba(232,168,56,0.2);border-radius:10px;padding:20px 24px;margin-bottom:18px;">`;
    h += `<h3 style="font-size:16px;color:var(--gold);margin-bottom:8px;">Bienvenido a CRISOL</h3>`;
    h += `<p style="font-size:14px;color:var(--tx);line-height:1.7;margin-bottom:12px;">Tu biblioteca tiene ${manifest.length} artículo${manifest.length !== 1 ? 's' : ''} listo${manifest.length !== 1 ? 's' : ''} para procesar. El flujo recomendado:</p>`;
    h += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">`;
    ['1. Pre-lectura (7 min)', '2. Puente (12 min)', '3. Texto anotado (45 min)', '4. Glosario (10 min)', '5. Reflexiones'].forEach(s => {
      h += `<span style="padding:5px 12px;border-radius:14px;font-size:13px;background:var(--bg3);color:var(--tx2);">${s}</span>`;
    });
    h += `</div><p style="font-size:13px;color:var(--tx3);">Haz click en un artículo del sidebar para comenzar.</p>`;
    h += `</div>`;
  }

  h += `<div class="kr">
    <div class="ki kg"><div class="n">${manifest.length}</div><div class="l">Artículos</div></div>
    <div class="ki kgr"><div class="n">${totalSupport}</div><div class="l">Apoyan tesis</div></div>
    <div class="ki kb"><div class="n">${totalContrast}</div><div class="l">Contrastan</div></div>
    <div class="ki"><div class="n">${totalNotes}</div><div class="l">Mis notas</div></div>
  </div>`;

  // 4. Overdue revision alerts
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let overdueHtml = '', upcomingHtml = '';
  manifest.forEach(art => {
    try {
      if (!window.SILA_ARTICLES || !window.SILA_ARTICLES[art.key]) return;
      const flujo = window.SILA_ARTICLES[art.key].flujo;
      if (!flujo || !flujo.revision) return;
      let artData = {};
      try { const raw = localStorage.getItem('sila4_' + art.key); if (raw) artData = JSON.parse(raw); } catch (e) { /* storage error */ }
      const revState = artData.revState || {};
      const customDates = artData.revDates;
      flujo.revision.forEach((r, ri) => {
        const rawState = revState['rev' + ri] || 'pending';
        const isDone = rawState === 'done' || (/^\d{4}-/.test(rawState));
        const isDiscarded = rawState === 'discarded';
        const isSuspended = rawState === 'suspended';
        if (isDone || isDiscarded || isSuspended) return;
        if (customDates && customDates[ri]) r.fecha = customDates[ri];
        const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        const diff = Math.round((new Date(r.fecha + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
          overdueHtml += `<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(224,112,80,0.06);border:1px solid rgba(224,112,80,0.15);border-left:3px solid var(--red);border-radius:0 7px 7px 0;margin:4px 0;cursor:pointer;" onclick="goToArticle('${art.key}')"><span style="font-size:14px;color:var(--red);font-weight:600;">Vencida ${Math.abs(diff)}d</span><span style="font-size:14px;color:var(--tx);">${art.authors} (${art.year}) — ${r.sesion}</span></div>`;
        } else if (diff <= 7) {
          upcomingHtml += `<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.12);border-left:3px solid var(--gold);border-radius:0 7px 7px 0;margin:4px 0;cursor:pointer;" onclick="goToArticle('${art.key}')"><span style="font-size:14px;color:var(--gold);font-weight:600;">${diff === 0 ? 'Hoy' : 'En ' + diff + 'd'}</span><span style="font-size:14px;color:var(--tx);">${art.authors} (${art.year}) — ${r.sesion}</span></div>`;
        }
      });
    } catch (e) { /* storage error */ }
  });
  if (overdueHtml || upcomingHtml) {
    h += `<h3 style="font-size:14px;color:var(--tx2);margin:18px 0 8px;">Revisiones pendientes</h3>`;
    h += overdueHtml + upcomingHtml;
  }

  // 5. Global search bar (cross-article)
  h += `<div class="search-bar" style="margin-bottom:14px;"><input type="text" id="global-search" placeholder="Buscar en todos los artículos..." oninput="onGlobalSearch(this.value)"><span class="s-count" id="global-search-count"></span></div>`;
  h += `<div id="global-search-results" style="display:none;"></div>`;

  // Last local sync alert
  h += `<div id="sync-alert-area"></div>`;
  if (state.sdb && state.currentUser) {
    state.sdb.from('sila_settings').select('data').eq('user_id', state.currentUser.id).single().then(({ data }) => {
      const el = document.getElementById('sync-alert-area'); if (!el) return;
      const lastSync = data && data.data && data.data.last_local_sync;
      if (lastSync) {
        const daysSince = Math.round((Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24));
        const syncColor = daysSince > 7 ? 'var(--red)' : daysSince > 3 ? 'var(--gold)' : 'var(--green)';
        const syncIcon = daysSince > 7 ? '⚠' : daysSince > 3 ? '📅' : '✓';
        el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-left:3px solid ${syncColor};border-radius:0 7px 7px 0;margin:14px 0;"><span style="font-size:13px;color:${syncColor};">${syncIcon} Última sincronización local: ${new Date(lastSync).toLocaleDateString()} (hace ${daysSince} día${daysSince !== 1 ? 's' : ''})</span><span style="font-size:12px;color:var(--tx3);">Ejecuta /sync en Claude Code</span></div>`;
      } else {
        el.innerHTML = `<div style="padding:8px 14px;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.12);border-left:3px solid var(--gold);border-radius:0 7px 7px 0;margin:14px 0;"><span style="font-size:13px;color:var(--gold);">📡 Sin sincronización local registrada. Ejecuta /sync en Claude Code para sincronizar Obsidian + Anki.</span></div>`;
      }
    }).catch(() => {});
  }

  // Academic sources directory
  h += renderSourcesDirectory();

  ct.innerHTML = h;
}

// ============================================================
// ACADEMIC SOURCES DIRECTORY
// ============================================================
const DEFAULT_SOURCES = [
  { name: 'Google Scholar', url: 'https://scholar.google.com/', desc: 'El buscador más amplio de literatura académica. Gratis, indexa casi todo.' },
  { name: 'Scopus', url: 'https://www.scopus.com/', desc: 'Base de Elsevier. Métricas de impacto, h-index. Requiere acceso institucional.' },
  { name: 'Web of Science', url: 'https://www.webofscience.com/', desc: 'Base de Clarivate. JCR impact factors. El estándar para ranking de journals.' },
  { name: 'JSTOR', url: 'https://www.jstor.org/', desc: 'Archivo digital de journals, libros y fuentes primarias. Fuerte en ciencias sociales.' },
  { name: 'SciELO', url: 'https://scielo.org/', desc: 'Scientific Electronic Library Online. Acceso abierto, fuerte en Latinoamérica.' },
  { name: 'ResearchGate', url: 'https://www.researchgate.net/', desc: 'Red social académica. Pide papers directamente a los autores. Preprints.' },
  { name: 'arXiv', url: 'https://arxiv.org/', desc: 'Preprints de acceso abierto. Fuerte en IA, computación, física, matemáticas.' },
  { name: 'SSRN', url: 'https://ssrn.com/', desc: 'Social Science Research Network. Working papers en management y economía.' },
  { name: 'Semantic Scholar', url: 'https://www.semanticscholar.org/', desc: 'Buscador con IA de Allen Institute. Resúmenes automáticos, grafos de citas.' },
  { name: 'Connected Papers', url: 'https://connectedpapers.com/', desc: 'Visualiza grafos de papers relacionados. Ideal para descubrir literatura desde un paper semilla.' },
  { name: 'The Lens', url: 'https://www.lens.org/', desc: 'Buscador abierto con datos de citas y patentes. Alternativa gratuita a Scopus.' },
  { name: 'DOAJ', url: 'https://doaj.org/', desc: 'Directory of Open Access Journals. Todo acceso abierto y peer-reviewed.' }
];

export function getSources() {
  try { return JSON.parse(localStorage.getItem('sila_sources')) || DEFAULT_SOURCES; }
  catch (e) { return DEFAULT_SOURCES; }
}

export function saveSources(s) {
  localStorage.setItem('sila_sources', JSON.stringify(s));
  try {
    const meta = JSON.parse(localStorage.getItem('sila_sources_meta') || '{}');
    meta.sources = s;
    meta.ts = Date.now();
    localStorage.setItem('sila_sources_meta', JSON.stringify(meta));
  } catch (e) { /* storage error */ }
  syncSettingsToCloud();
}

// NOTE: syncSettingsToCloud now imported from sync.js (single source of truth)

export async function loadSettingsFromCloud() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_settings').select('data').eq('user_id', state.currentUser.id).single();
    if (error || !data || !data.data) {
      console.log('No cloud settings found, pushing local');
      syncSettingsToCloud();
      return;
    }
    const s = data.data;
    if (s.sources && Array.isArray(s.sources) && s.sources.length > 0) {
      localStorage.setItem('sila_sources', JSON.stringify(s.sources));
      console.log('Sources loaded from cloud:', s.sources.length);
    }
    if (s.fontSize) { localStorage.setItem('sila_fs', s.fontSize); state.fontSize = s.fontSize; document.documentElement.style.setProperty('--fs', s.fontSize + 'px'); }
    if (s.colCount) { localStorage.setItem('sila_cols', s.colCount); }
  } catch (e) { console.error('Settings load error:', e); }
}

const srcColors = ['var(--blue)', 'var(--gold)', 'var(--green)', 'var(--purple)', 'var(--red)', 'var(--amber)'];

let sourcesEditMode = false;

export function toggleSourcesEdit() { sourcesEditMode = !sourcesEditMode; renderGlobalDash(); }
window.toggleSourcesEdit = toggleSourcesEdit;

export function removeSource(i) {
  if (!confirm('¿Quitar "' + getSources()[i].name + '"?')) return;
  const s = getSources(); s.splice(i, 1); saveSources(s); renderGlobalDash();
}
window.removeSource = removeSource;

export function addSource() {
  const name = document.getElementById('src-name').value.trim();
  const url = document.getElementById('src-url').value.trim();
  const desc = document.getElementById('src-desc').value.trim();
  if (!name || !url) return;
  const s = getSources(); s.push({ name, url: url.startsWith('http') ? url : 'https://' + url, desc });
  saveSources(s); renderGlobalDash();
}
window.addSource = addSource;

export function resetSources() { localStorage.removeItem('sila_sources'); renderGlobalDash(); }
window.resetSources = resetSources;

export function renderSourcesDirectory() {
  const sources = getSources();
  const ed = sourcesEditMode;
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin:22px 0 10px;">`;
  h += `<h3 style="font-size:14px;color:var(--tx2);">Fuentes para buscar literatura (${sources.length})</h3>`;
  h += `<button class="btn ${ed ? 'bg' : 'bo'}" onclick="toggleSourcesEdit()" style="font-size:12px;padding:4px 12px;">${ed ? '✓ Listo' : '✏ Editar'}</button>`;
  h += `</div>`;
  h += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;">`;
  sources.forEach((s, i) => {
    const color = srcColors[i % srcColors.length];
    const editStyle = ed ? 'border-color:rgba(224,112,80,0.2);animation:editPulse 1.5s ease-in-out infinite;' : '';
    h += `<div class="gd-card" style="position:relative;transition:all 0.2s;${editStyle}">`;
    h += `<a href="${ed ? 'javascript:void(0)' : s.url}" ${ed ? '' : 'target="_blank"'} style="text-decoration:none;display:block;"><h4 style="color:${color};">${s.name}</h4><div class="gd-meta">${s.desc || ''}</div></a>`;
    if (ed) h += `<span onclick="event.stopPropagation();removeSource(${i})" style="position:absolute;top:8px;right:10px;cursor:pointer;width:22px;height:22px;border-radius:50%;background:rgba(224,112,80,0.15);color:var(--red);font-size:13px;display:flex;align-items:center;justify-content:center;transition:all 0.12s;" onmouseover="this.style.background='var(--red)';this.style.color='#fff'" onmouseout="this.style.background='rgba(224,112,80,0.15)';this.style.color='var(--red)'" title="Quitar">✕</span>`;
    h += `</div>`;
  });
  if (ed) {
    h += `<div class="gd-card" style="border-style:dashed;border-color:rgba(93,187,138,0.3);background:rgba(93,187,138,0.03);">`;
    h += `<h4 style="color:var(--green);font-size:14px;margin-bottom:8px;">+ Nueva fuente</h4>`;
    h += `<input id="src-name" placeholder="Nombre" style="width:100%;padding:5px 8px;margin-bottom:4px;border-radius:5px;border:1px solid rgba(220,215,205,0.1);background:var(--bg);color:var(--tx);font-size:13px;font-family:'Inter',sans-serif;">`;
    h += `<input id="src-url" placeholder="URL (ej: scholar.google.com)" style="width:100%;padding:5px 8px;margin-bottom:4px;border-radius:5px;border:1px solid rgba(220,215,205,0.1);background:var(--bg);color:var(--tx);font-size:13px;font-family:'Inter',sans-serif;">`;
    h += `<input id="src-desc" placeholder="Descripción breve (opcional)" style="width:100%;padding:5px 8px;margin-bottom:8px;border-radius:5px;border:1px solid rgba(220,215,205,0.1);background:var(--bg);color:var(--tx);font-size:13px;font-family:'Inter',sans-serif;">`;
    h += `<button class="btn bg" onclick="addSource()" style="width:100%;padding:6px;font-size:13px;">Agregar</button>`;
    h += `</div>`;
  }
  h += `</div>`;
  if (ed) {
    h += `<div style="text-align:right;margin-top:8px;"><button class="btn bo" onclick="resetSources()" style="font-size:12px;padding:3px 10px;">Restaurar originales</button></div>`;
  } else {
    h += `<p style="font-size:13px;color:var(--tx3);margin-top:8px;">Tip: Empieza en Google Scholar. Usa Connected Papers para expandir. Verifica calidad en Scopus/WoS.</p>`;
  }
  return h;
}

// ============================================================
// CONFIRMATION BIAS DETECTOR
// ============================================================
export function checkBias() {
  const d = ld(); const claims = d.claims || {};
  let s = 0, c = 0; Object.values(claims).forEach(v => { if (v === 'support') s++; if (v === 'contrast') c++; });
  const total = s + c; if (total < 5) return '';
  const ratio = s / total;
  if (ratio > 0.85) return `<div style="background:rgba(232,168,56,0.06);border:1px solid rgba(232,168,56,0.2);border-radius:8px;padding:12px 16px;margin:10px 0;"><span style="font-size:14px;color:var(--gold);">⚠ Sesgo potencial: ${Math.round(ratio * 100)}% de tus claims apoyan tu tesis (${s}/${total}). ¿Estás buscando activamente argumentos que desafíen tu posición?</span></div>`;
  if (ratio < 0.15) return `<div style="background:rgba(224,112,80,0.06);border:1px solid rgba(224,112,80,0.2);border-radius:8px;padding:12px 16px;margin:10px 0;"><span style="font-size:14px;color:var(--red);">⚠ Solo ${Math.round(ratio * 100)}% de claims apoyan tu tesis. ¿El artículo realmente contrasta tanto, o necesitas repensar cómo se conecta con tu argumento?</span></div>`;
  return '';
}

// ============================================================
// INTERLEAVED QUIZ
// ============================================================
export async function goQuiz() {
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  ensureToolsOpen();
  const ct = document.getElementById('ct');
  const manifest = window.SILA_MANIFEST || [];
  let allQ = [];
  for (const art of manifest) {
    await loadArticle(art.key);
    const data = window.SILA_ARTICLES[art.key]; if (!data) continue;
    data.sections.forEach(sec => {
      if (!sec.retrieval) return;
      sec.retrieval.q.forEach((q, i) => {
        allQ.push({ q, a: sec.retrieval.a[i], authors: art.authors, year: art.year, sec: sec.title });
      });
    });
  }
  // Shuffle
  for (let i = allQ.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [allQ[i], allQ[j]] = [allQ[j], allQ[i]]; }
  if (allQ.length === 0) { ct.innerHTML = '<div class="sb"><h3>Quiz</h3></div><p style="color:var(--tx3);padding:20px;text-align:center;">No hay preguntas de retrieval disponibles. Procesa más artículos con /sila.</p>'; return; }
  window._quizData = { questions: allQ, current: 0, score: 0 };
  renderQuizQuestion();
}
window.goQuiz = goQuiz;

export function renderQuizQuestion() {
  const ct = document.getElementById('ct');
  const qd = window._quizData; if (!qd) return;
  const total = qd.questions.length;
  if (qd.current >= total) {
    ct.innerHTML = `<div class="sb"><h3>Quiz completado</h3></div>
    <div style="text-align:center;padding:40px;">
      <div style="font-size:48px;font-weight:900;color:var(--gold);">${qd.score}/${total}</div>
      <p style="font-size:15px;color:var(--tx2);margin-top:10px;">${total ? Math.round(qd.score / total * 100) : 0}% de aciertos</p>
      <button class="btn bg" style="margin-top:16px;" onclick="goQuiz()">Repetir quiz</button>
      <button class="btn bo" style="margin-top:16px;margin-left:8px;" onclick="goHome()">Volver</button>
    </div>`; return;
  }
  const item = qd.questions[qd.current];
  ct.innerHTML = `<div class="sb"><h3>Quiz interleaved — Pregunta ${qd.current + 1}/${total}</h3></div>
  <div style="font-size:13px;color:var(--tx3);margin-bottom:14px;">${item.authors} (${item.year}) · ${item.sec}</div>
  <div style="font-size:var(--fs);line-height:1.7;color:var(--tx);padding:18px;background:var(--bg2);border-radius:8px;margin-bottom:14px;">${item.q}</div>
  <textarea id="quiz-answer" class="di" placeholder="Escribe tu respuesta antes de ver la correcta..." style="margin-bottom:10px;"></textarea>
  <div id="quiz-reveal" style="display:none;">
    <div style="padding:14px;background:rgba(93,187,138,0.06);border-left:3px solid var(--green);border-radius:0 8px 8px 0;margin:10px 0;">
      <div style="font-size:13px;color:var(--green);font-weight:600;margin-bottom:4px;">Respuesta correcta:</div>
      <div style="font-size:var(--fs);line-height:1.7;color:var(--tx);">${item.a}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button class="btn bg" onclick="quizGrade(true)" style="flex:1;">✓ Acerté</button>
      <button class="btn bo" onclick="quizGrade(false)" style="flex:1;">✗ Fallé</button>
    </div>
  </div>
  <button class="btn bg" id="quiz-show-btn" onclick="document.getElementById('quiz-reveal').style.display='block';this.style.display='none';">Ver respuesta</button>
  <div style="margin-top:14px;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;"><div style="height:100%;background:var(--gold);width:${Math.round(qd.current / total * 100)}%;border-radius:2px;"></div></div>`;
}

export function quizGrade(correct) {
  if (correct) window._quizData.score++;
  window._quizData.current++;
  renderQuizQuestion();
  document.querySelector('.content').scrollTop = 0;
}
window.quizGrade = quizGrade;

// ============================================================
// FLASHCARD STUDY MODE
// ============================================================
export function goStudyMode() {
  const cards = state.getCards();
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  window._studyData = { cards: shuffled, current: 0, again: 0, good: 0 };
  renderStudyCard();
}
window.goStudyMode = goStudyMode;

export function renderStudyCard() {
  const ct = document.getElementById('ct');
  const sd = window._studyData; if (!sd) return;
  const total = sd.cards.length;
  if (sd.current >= total) {
    ct.innerHTML = `<div class="sb"><h3>Sesión de estudio completada</h3></div>
    <div style="text-align:center;padding:40px;">
      <div style="font-size:48px;font-weight:900;color:var(--green);">${sd.good}/${total}</div>
      <p style="font-size:15px;color:var(--tx2);margin-top:10px;">${sd.again} para repasar</p>
      <button class="btn bg" style="margin-top:16px;" onclick="goStudyMode()">Repetir</button>
      <button class="btn bo" style="margin-top:16px;margin-left:8px;" onclick="sp('flashcards',document.querySelectorAll('.tab')[7])">Ver todas</button>
    </div>`; return;
  }
  const card = sd.cards[sd.current];
  const front = card.front.replace(/\{\{c\d+::/g, '[').replace(/\}\}/g, ']');
  ct.innerHTML = `<div class="sb"><h3>Estudio — Card ${sd.current + 1}/${total}</h3></div>
  <div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:10px;padding:24px;margin:14px 0;min-height:120px;">
    <div style="font-size:var(--fs);line-height:1.7;color:var(--tx);">${front}</div>
  </div>
  <div id="study-answer" style="display:none;">
    <div style="background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.15);border-radius:10px;padding:20px;margin:10px 0;">
      <div style="font-size:var(--fs);line-height:1.7;color:var(--green);">${card.back}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn bo" onclick="studyGrade('again')" style="flex:1;border-color:var(--red);color:var(--red);">✗ Repetir</button>
      <button class="btn bg" onclick="studyGrade('good')" style="flex:1;">✓ Bien</button>
    </div>
  </div>
  <button class="btn bg" id="study-show" onclick="document.getElementById('study-answer').style.display='block';this.style.display='none';" style="width:100%;padding:12px;">Mostrar respuesta</button>
  <div style="margin-top:14px;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;"><div style="height:100%;background:var(--gold);width:${Math.round(sd.current / total * 100)}%;border-radius:2px;"></div></div>`;
}

export function studyGrade(grade) {
  if (grade === 'good') window._studyData.good++; else window._studyData.again++;
  window._studyData.current++;
  renderStudyCard();
  document.querySelector('.content').scrollTop = 0;
}
window.studyGrade = studyGrade;

// ============================================================
// BUILD NOTES FOR AI
// ============================================================
export function buildNotesForAI() {
  if (!state.DATA) return '';
  const d = ld();
  const claims = d.claims || {}; const claimNotes = d.claimNotes || {};
  const f = d.f || {}; const dialogs = d.d || {};
  let lines = [
    '════════════════════════════════════════════════════',
    'YUNQUE — Notas y reflexiones para procesamiento con IA',
    'Artículo: ' + state.DATA.meta.authors + ' (' + state.DATA.meta.year + ') — ' + state.DATA.meta.title,
    'Fecha: ' + new Date().toLocaleDateString(),
    '════════════════════════════════════════════════════', '',
    'INSTRUCCIÓN: A continuación encontrarás párrafos del artículo con mis notas personales (claims, preguntas elaborativas, auto-explicaciones y reflexiones). Por favor responde a mis preguntas, valida mis explicaciones, y profundiza donde lo solicito.', ''
  ];
  state.DATA.sections.forEach((sec, si) => {
    let secHasNotes = false;
    let secLines = [];
    secLines.push('', '───── ' + sec.title + ' ─────', '');
    sec.paragraphs.forEach((par, pi) => {
      const pid = 'p' + si + '-' + pi;
      const claim = claims[pid];
      const cnote = claimNotes[pid];
      const eq = f['eq-' + pid];
      const se = f['se-' + pid];
      const dlg = dialogs[pid];
      if (!claim && !cnote && !eq && !se && !dlg) return;
      secHasNotes = true;
      const title = par.title || ('Párrafo ' + (pi + 1));
      secLines.push('▸ ' + title);
      secLines.push('TEXTO: "' + par.text.substring(0, 500) + (par.text.length > 500 ? '..."' : '"'));
      if (claim) {
        const label = claim === 'support' ? 'APOYA MI TESIS' : claim === 'contrast' ? 'CONTRASTA MI TESIS' : 'NEUTRO';
        secLines.push('EVALUACIÓN: ' + label);
      }
      if (cnote) secLines.push('MI NOTA: ' + cnote);
      if (eq) {
        secLines.push('PREGUNTA ELABORATIVA: ' + (par.eq || ''));
        secLines.push('MI RESPUESTA: ' + eq);
      }
      if (se) secLines.push('MI AUTO-EXPLICACIÓN: ' + se);
      if (dlg && dlg.length) dlg.forEach(e => secLines.push('MI REFLEXIÓN (' + new Date(e.d).toLocaleDateString() + '): ' + e.t));
      secLines.push('');
    });
    if (secHasNotes) lines.push(...secLines);
  });
  const puenteKeys = ['pu0', 'pu1', 'pu2', 'pu3', 'pu4'];
  const puenteLabels = ['Argumento de mi tesis', 'Posición a debatir', 'Gap que revela', 'Cómo citaría', 'Lo que no entiendo'];
  let hasPuente = false;
  puenteKeys.forEach((k, i) => { if (f[k]) { if (!hasPuente) { lines.push('', '───── PUENTE A MI TESIS ─────', ''); hasPuente = true; } lines.push(puenteLabels[i] + ': ' + f[k]); } });
  const refKeys = ['rf0', 'rf1', 'rf2', 'rf3', 'rf4', 'rf5', 'rf6', 'rf7'];
  const refLabels = ['Primera impresión', 'Conexiones con mi investigación', 'Preguntas que genera', 'Textos a explorar', 'Acciones concretas', 'Dudas activas', 'Agenda para discusión', 'Notas libres'];
  let hasRef = false;
  refKeys.forEach((k, i) => { if (f[k]) { if (!hasRef) { lines.push('', '───── MIS REFLEXIONES ─────', ''); hasRef = true; } lines.push(refLabels[i] + ': ' + f[k]); } });
  return lines.join('\n');
}

// ============================================================
// COMPARE — cross-article concept comparison
// ============================================================
export async function goCompare() {
  state.isMiTesis = false; state.isHome = false; state.currentProjectId = null;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  ensureToolsOpen();
  const ct = document.getElementById('ct');
  const manifest = window.SILA_MANIFEST || [];
  for (const art of manifest) await loadArticle(art.key);
  let h = `<div class="sb"><h3>Comparación de conceptos cross-article</h3></div>`;
  if (manifest.length < 2) {
    h += `<p style="color:var(--tx3);padding:20px;">Necesitas al menos 2 artículos para comparar conceptos.</p>`;
    ct.innerHTML = h; return;
  }
  const allConcepts = {};
  manifest.forEach(art => {
    const data = window.SILA_ARTICLES[art.key]; if (!data || !data.glosario) return;
    data.glosario.forEach(c => {
      const name = c.concepto.toLowerCase().replace(/\s*\/\s*/g, '/').trim();
      if (!allConcepts[name]) allConcepts[name] = { name: c.concepto, articles: [] };
      allConcepts[name].articles.push({ key: art.key, authors: art.authors, year: art.year, ...c });
    });
  });
  const shared = Object.values(allConcepts).filter(c => c.articles.length > 1);
  if (shared.length > 0) {
    h += `<h4 style="font-size:15px;color:var(--green);margin:14px 0 8px;">Conceptos compartidos (${shared.length})</h4>`;
    shared.forEach(c => {
      h += `<div style="background:var(--bg2);border:1px solid rgba(93,187,138,0.15);border-radius:8px;padding:16px;margin:8px 0;">`;
      h += `<h4 style="font-size:16px;color:#fff;margin-bottom:10px;">${c.name} <span style="font-size:13px;color:var(--green);">(${c.articles.length} artículos)</span></h4>`;
      h += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;">`;
      c.articles.forEach(a => {
        h += `<div style="padding:10px 14px;background:var(--bg3);border-radius:6px;border-left:3px solid var(--blue);">`;
        h += `<div style="font-size:13px;color:var(--blue);font-weight:600;margin-bottom:6px;">${a.authors} (${a.year})</div>`;
        h += `<div style="font-size:14px;color:var(--tx);line-height:1.6;margin-bottom:6px;">${a.definicion}</div>`;
        h += `<div style="font-size:13px;color:var(--red);">${a.tension}</div>`;
        h += `</div>`;
      });
      h += `</div></div>`;
    });
  }
  h += `<h4 style="font-size:15px;color:var(--gold);margin:18px 0 8px;">Todos los conceptos por artículo</h4>`;
  h += `<div style="overflow-x:auto;"><table class="it"><thead><tr><th>Concepto</th>`;
  manifest.forEach(art => { if (window.SILA_ARTICLES[art.key] && window.SILA_ARTICLES[art.key].glosario) h += `<th style="white-space:nowrap;">${art.authors} (${art.year})</th>`; });
  h += `</tr></thead><tbody>`;
  const allNames = [...new Set(Object.values(allConcepts).map(c => c.name))];
  allNames.forEach(name => {
    const key = name.toLowerCase().replace(/\s*\/\s*/g, '/').trim();
    h += `<tr><td>${name}</td>`;
    manifest.forEach(art => {
      if (!window.SILA_ARTICLES[art.key] || !window.SILA_ARTICLES[art.key].glosario) return;
      const found = allConcepts[key] && allConcepts[key].articles.find(a => a.key === art.key);
      h += `<td style="text-align:center;">${found ? '<span style="color:var(--green);font-size:16px;">●</span>' : '<span style="color:var(--tx3);">—</span>'}</td>`;
    });
    h += `</tr>`;
  });
  h += `</tbody></table></div>`;
  ct.innerHTML = h;
}
window.goCompare = goCompare;

// ============================================================
// TUTORING SESSION REPORT
// ============================================================
export function goReport() {
  state.isHome = false; state.isMiTesis = false; state.currentProjectId = null; state.currentDocId = null; state._isPrisma = false;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  ensureToolsOpen();
  updateTopbar();
  const ct = document.getElementById('ct');
  const manifest = window.SILA_MANIFEST || [];
  let lines = ['══════════════════════════════════════', 'YUNQUE — Reporte para sesión de tutoría', 'Fecha: ' + new Date().toLocaleDateString(), '══════════════════════════════════════', ''];
  let h = `<div class="sb"><h3>Reporte para tutoría</h3></div>`;
  h += `<p style="font-size:14px;color:var(--tx2);margin-bottom:14px;">Resumen consolidado de tu trabajo reciente para llevar a tutoría.</p>`;
  h += `<div style="display:flex;gap:8px;margin-bottom:14px;"><button class="btn bg" onclick="copyReport()">📋 Copiar al portapapeles</button></div>`;

  // Project summaries
  const projects = getProjects();
  if (projects.length > 0) {
    h += `<h3 style="font-size:15px;color:var(--tx2);margin:14px 0 10px;">Proyectos de escritura</h3>`;
    lines.push('─── PROYECTOS DE ESCRITURA ───', '');
    const allDocs = getDocs();
    projects.forEach(p => {
      const days = calcDaysRemaining(p.fechaLimite);
      const nArts = (p.articulos || []).length;
      const projDocs = (p.documentos || []).map(d => allDocs.find(dd => dd.id === d.id)).filter(Boolean);
      const totalWords = projDocs.reduce((sum, d) => sum + countDocWords(d), 0);
      const projClaims = getProjectClaims(p);
      const totalProjClaims = projClaims.support.length + projClaims.contrast.length + projClaims.neutral.length;
      const secciones = p.secciones || [];
      const alert = calcProjectAlert(p, projDocs);

      lines.push('► ' + p.nombre + (days !== Infinity ? ' (' + days + ' días)' : ''));
      lines.push('  ' + nArts + ' artículos · ' + projDocs.length + ' documentos · ' + totalWords + ' palabras');
      if (totalProjClaims > 0) lines.push('  Claims: ' + projClaims.support.length + ' apoyan, ' + projClaims.contrast.length + ' contrastan, ' + projClaims.neutral.length + ' neutral');
      const gapSections = secciones.filter(s => (s.articulosFuente || []).length < 2);
      if (gapSections.length > 0) lines.push('  ⚠ Gaps: ' + gapSections.map(s => s.nombre + ' (' + ((s.articulosFuente || []).length) + ' fuentes)').join(', '));
      lines.push('  Estado: ' + alert, '');

      h += `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:8px;padding:16px;margin:8px 0;cursor:pointer;" onclick="goToProject('${p.id}')">`;
      h += `<h4 style="font-size:15px;color:#fff;margin-bottom:6px;">${p.nombre}`;
      if (days !== Infinity) h += ` <span style="font-size:13px;color:${days < 7 ? 'var(--red)' : days < 14 ? 'var(--gold)' : 'var(--tx3)'};">(${days} días)</span>`;
      h += `</h4>`;
      h += `<div style="font-size:14px;color:var(--tx2);margin-bottom:4px;">${nArts} artículos · ${projDocs.length} docs · ${totalWords.toLocaleString()} palabras</div>`;
      if (totalProjClaims > 0) {
        h += `<div style="font-size:13px;margin-bottom:4px;"><span style="color:var(--green);">${projClaims.support.length} apoyan</span> · <span style="color:var(--red);">${projClaims.contrast.length} contrastan</span> · <span style="color:var(--purple);">${projClaims.neutral.length} neutral</span></div>`;
      }
      if (gapSections.length > 0) {
        h += `<div style="font-size:13px;color:var(--gold);margin-bottom:4px;">⚠ Gaps: ${gapSections.map(s => s.nombre).join(', ')}</div>`;
      }
      h += `<div style="font-size:13px;color:var(--tx3);">${alert}</div>`;
      h += `</div>`;
    });
    lines.push('');
  }

  // Per-article details
  h += `<h3 style="font-size:15px;color:var(--tx2);margin:18px 0 10px;">Detalle por artículo</h3>`;
  let totalClaims = 0, bodyHtml = '';
  manifest.forEach(art => {
    const artData = window.SILA_ARTICLES[art.key]; if (!artData) return;
    let d = {}; try { const raw = localStorage.getItem('sila4_' + art.key) || localStorage.getItem('sila4'); if (raw) d = JSON.parse(raw); } catch (e) { /* storage error */ }
    const claims = d.claims || {}; const notes = d.claimNotes || {};
    const reflexiones = d.f || {};
    let support = 0, contrast = 0;
    Object.values(claims).forEach(c => { if (c === 'support') support++; if (c === 'contrast') contrast++; });
    if (support + contrast === 0 && !reflexiones.rf0) return;
    totalClaims += support + contrast;
    lines.push('─── ' + art.authors + ' (' + art.year + ') ───');
    bodyHtml += `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-radius:8px;padding:16px;margin:10px 0;">`;
    bodyHtml += `<h4 style="font-size:15px;color:#fff;margin-bottom:8px;">${art.authors} (${art.year})</h4>`;
    if (support + contrast > 0) {
      bodyHtml += `<div style="font-size:14px;color:var(--tx2);margin-bottom:6px;"><span style="color:var(--green);">${support} apoyan</span> · <span style="color:var(--red);">${contrast} contrastan</span></div>`;
      lines.push('Claims: ' + support + ' apoyan, ' + contrast + ' contrastan');
    }
    Object.entries(claims).forEach(([pid, type]) => {
      if (type === 'neutral' || !notes[pid]) return;
      const m = pid.match(/^p(\d+)-(\d+)$/); if (!m) return;
      const si = parseInt(m[1]), pi = parseInt(m[2]);
      const sec = artData.sections[si]; if (!sec) return;
      const par = sec.paragraphs[pi]; if (!par) return;
      const icon = type === 'support' ? '✓' : '✗';
      bodyHtml += `<div style="padding:6px 12px;margin:4px 0;font-size:13px;border-left:2px solid ${type === 'support' ? 'var(--green)' : 'var(--red)'};color:var(--tx2);">${icon} ${par.title || '§' + (si + 1)}: ${notes[pid]}</div>`;
      lines.push('  ' + icon + ' ' + (par.title || '§' + (si + 1)) + ': ' + notes[pid]);
    });
    if (reflexiones.rf2) {
      bodyHtml += `<div style="padding:6px 12px;margin:4px 0;font-size:13px;border-left:2px solid var(--gold);color:var(--tx2);">❓ ${reflexiones.rf2.substring(0, 200)}</div>`;
      lines.push('  ❓ Preguntas: ' + reflexiones.rf2.substring(0, 200));
    }
    bodyHtml += `</div>`;
    lines.push('');
  });
  if (totalClaims === 0) {
    bodyHtml = `<div style="text-align:center;padding:40px;color:var(--tx3);">Sin actividad registrada. Evalúa párrafos en "Texto anotado" para generar el reporte.</div>`;
  }
  h += bodyHtml;
  window._reportText = lines.join('\n');
  ct.innerHTML = h;
}
window.goReport = goReport;

export function copyReport() {
  if (window._reportText) navigator.clipboard.writeText(window._reportText).then(() => alert('Reporte copiado al portapapeles'));
}
window.copyReport = copyReport;
window.buildNotesForAI = buildNotesForAI;
window.renderGlobalDash = renderGlobalDash;
