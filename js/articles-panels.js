// ============================================================
// articles-panels.js
// Panel renderers extracted from articles.js:
// prelectura, puente, glosario, reflexiones, mapa, revision
// ============================================================

import { state } from './state.js';
import { ld, gF, svF } from './storage.js';

let currentPlSub = 0;
let currentGlSub = 0;

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
// PRE-LECTURA
// ============================================================

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
