// ============================================================
// CRISOL — prisma-tabs.js
// PRISMA tab renderers: jardin, matriz, argumento, vacios, preguntas, evolucion
// Extracted from prisma.js (Sprint S4)
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';
import { getPrisma, savePrisma } from './prisma.js';

// === JARDIN DE DOCUMENTOS ===
if (!window._jardinTagFilter) window._jardinTagFilter = null;

export function renderPrismaJardin(prisma) {
  const allDocs = prisma.documents || [];
  if (allDocs.length === 0) {
    return `<div style="text-align:center;padding:40px 20px;color:var(--tx3);"><p style="font-size:15px;margin-bottom:12px;">Tu jardín doctoral está vacío.</p><p style="font-size:13px;">Agrega tus ensayos, artículos y documentos para que PRISMA construya sentido a partir de ellos.</p><button class="btn bo" onclick="addPrismaDocument()" style="margin-top:12px;">+ Agregar primer documento</button></div>`;
  }

  // Collect all tags
  const allTags = new Set();
  allDocs.forEach(d => (d.tags || []).forEach(t => allTags.add(t)));
  const tagList = [...allTags].sort();

  // Filter
  const docs = window._jardinTagFilter ? allDocs.filter(d => (d.tags || []).includes(window._jardinTagFilter)) : allDocs;

  const maturityLabels = { seed: '🌱 Semilla', sprout: '🌿 Brote', tree: '🌳 Árbol' };
  let h = '';

  // Tag filter bar
  if (tagList.length > 0) {
    h += `<div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">`;
    h += `<span style="font-size:12px;color:var(--tx3);margin-right:4px;">Filtrar:</span>`;
    const activeTag = window._jardinTagFilter;
    h += `<button onclick="window._jardinTagFilter=null;renderPrisma();" style="padding:3px 10px;border-radius:12px;border:1px solid ${!activeTag ? 'var(--purple)' : 'rgba(220,215,205,0.1)'};background:${!activeTag ? 'rgba(155,125,207,0.12)' : 'var(--bg3)'};color:${!activeTag ? 'var(--purple)' : 'var(--tx3)'};cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;font-weight:${!activeTag ? '600' : '400'};">Todos (${allDocs.length})</button>`;
    tagList.forEach(tag => {
      const count = allDocs.filter(d => (d.tags || []).includes(tag)).length;
      const isActive = activeTag === tag;
      h += `<button onclick="window._jardinTagFilter='${tag.replace(/'/g, "\\'")}';renderPrisma();" style="padding:3px 10px;border-radius:12px;border:1px solid ${isActive ? 'var(--purple)' : 'rgba(220,215,205,0.1)'};background:${isActive ? 'rgba(155,125,207,0.12)' : 'var(--bg3)'};color:${isActive ? 'var(--purple)' : 'var(--tx3)'};cursor:pointer;font-size:12px;font-family:'Inter',sans-serif;font-weight:${isActive ? '600' : '400'};">${escH(tag)} (${count})</button>`;
    });
    h += `</div>`;
  }

  h += `<div style="display:flex;gap:8px;margin-bottom:12px;font-size:13px;color:var(--tx3);">`;
  h += `<span>🌱 Semilla: idea/borrador</span><span>🌿 Brote: en desarrollo</span><span>🌳 Árbol: publicado/definitivo</span>`;
  h += `</div>`;

  docs.forEach((doc, di) => {
    h += `<div class="prisma-card">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div class="prisma-card-title">${escH(doc.title)}</div>`;
    h += `<div style="display:flex;gap:6px;align-items:center;">`;
    h += `<span class="prisma-maturity ${doc.maturity || 'seed'}">${maturityLabels[doc.maturity || 'seed']}</span>`;
    h += `<button onclick="event.stopPropagation();editPrismaDocument(${di})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:13px;">✎</button>`;
    h += `<button onclick="event.stopPropagation();removePrismaDocument(${di})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✕</button>`;
    h += `</div></div>`;
    h += `<div class="prisma-card-meta">`;
    h += `<span>${doc.date || ''}</span>`;
    if (doc.type) h += `<span>${escH(doc.type)}</span>`;
    if (doc.wordCount) h += `<span>${doc.wordCount} palabras</span>`;
    h += `</div>`;
    if (doc.summary) h += `<div class="prisma-card-summary">${escH(doc.summary)}</div>`;
    if (doc.tags && doc.tags.length > 0) {
      h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">`;
      doc.tags.forEach(t => { h += `<span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(232,168,56,0.1);color:var(--gold);cursor:pointer;" onclick="event.stopPropagation();window._jardinTagFilter='${t.replace(/'/g, "\\'")}';renderPrisma();">#${escH(t)}</span>`; });
      h += `</div>`;
    }
    if (doc.concepts && doc.concepts.length > 0) {
      h += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">`;
      doc.concepts.forEach(c => { h += `<span style="padding:2px 8px;border-radius:10px;font-size:11px;background:rgba(155,125,207,0.1);color:var(--purple);">${escH(c)}</span>`; });
      h += `</div>`;
    }
    h += `<div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap;">`;
    // Snapshot
    if (doc.downloadUrl) {
      h += `<a href="${doc.downloadUrl}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(144,200,240,0.08);border:1px solid rgba(144,200,240,0.15);border-radius:6px;font-size:12px;color:var(--blue);text-decoration:none;font-weight:500;transition:all 0.12s;" onmouseover="this.style.background='rgba(144,200,240,0.15)'" onmouseout="this.style.background='rgba(144,200,240,0.08)'">📥 Snapshot${doc.snapshotDate ? ' (' + doc.snapshotDate + ')' : ''}</a>`;
    } else {
      h += `<a href="#" onclick="event.preventDefault();event.stopPropagation();setPrismaDocUrl(${di})" style="font-size:12px;color:var(--tx3);text-decoration:none;">+ Snapshot (versión congelada)</a>`;
    }
    // Live document
    if (doc.liveUrl) {
      h += `<a href="${doc.liveUrl}" target="_blank" onclick="event.stopPropagation()" style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;background:rgba(93,187,138,0.08);border:1px solid rgba(93,187,138,0.15);border-radius:6px;font-size:12px;color:var(--green);text-decoration:none;font-weight:500;transition:all 0.12s;" onmouseover="this.style.background='rgba(93,187,138,0.15)'" onmouseout="this.style.background='rgba(93,187,138,0.08)'">📄 Doc. vivo</a>`;
    } else {
      h += `<a href="#" onclick="event.preventDefault();event.stopPropagation();setPrismaLiveUrl(${di})" style="font-size:12px;color:var(--tx3);text-decoration:none;">+ Doc. vivo (Google Drive)</a>`;
    }
    h += `</div>`;
    h += `</div>`;
  });
  return h;
}

// === MATRIZ DE SINTESIS ===
export function renderPrismaMatriz(prisma) {
  const docs = prisma.documents || [];
  const themes = prisma.matrix?.themes || [];
  if (docs.length === 0 || themes.length === 0) {
    let h = `<div style="padding:20px;color:var(--tx3);text-align:center;">`;
    if (docs.length === 0) h += `<p>Agrega documentos al jardín primero.</p>`;
    else h += `<p>Define los temas/conceptos de tu tesis para construir la matriz.</p>`;
    h += `<button class="btn bo" onclick="addPrismaTheme()" style="margin-top:8px;">+ Agregar tema</button></div>`;
    return h;
  }
  const cells = prisma.matrix?.cells || {};
  let h = `<div style="margin-bottom:8px;"><button class="btn bo" onclick="addPrismaTheme()" style="font-size:12px;">+ Tema</button></div>`;
  h += `<div style="overflow-x:auto;"><table class="prisma-matrix">`;
  // Header
  h += `<tr><th style="min-width:150px;">Documento</th>`;
  themes.forEach((t, ti) => {
    h += `<th style="min-width:120px;">${escH(t)} <span onclick="removePrismaTheme(${ti})" style="cursor:pointer;font-size:10px;color:var(--tx3);opacity:0.5;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">✕</span></th>`;
  });
  h += `</tr>`;
  // Rows
  docs.forEach((doc, di) => {
    h += `<tr><td style="font-weight:600;color:var(--tx);">${escH(doc.title.length > 30 ? doc.title.substring(0, 30) + '...' : doc.title)}</td>`;
    themes.forEach((t, ti) => {
      const key = di + '-' + ti;
      const val = cells[key] || '';
      const cls = val ? 'filled' : 'gap';
      h += `<td class="${cls}" onclick="editPrismaCell(${di},${ti})" style="cursor:pointer;" title="Click para editar">${val ? escH(val.length > 60 ? val.substring(0, 60) + '...' : val) : '<span style=color:var(--tx3);font-size:11px;>click para llenar</span>'}</td>`;
    });
    h += `</tr>`;
  });
  // Gap detection row
  h += `<tr style="border-top:2px solid var(--bg4);"><td style="font-weight:600;color:var(--tx3);">Cobertura</td>`;
  themes.forEach((t, ti) => {
    const filled = docs.filter((d, di) => cells[di + '-' + ti]).length;
    const pct = docs.length > 0 ? Math.round(filled / docs.length * 100) : 0;
    const color = pct === 0 ? 'var(--red)' : pct < 50 ? 'var(--gold)' : 'var(--green)';
    h += `<td style="font-weight:600;color:${color};">${filled}/${docs.length} (${pct}%)</td>`;
  });
  h += `</tr>`;
  h += `</table></div>`;
  return h;
}

// === MAPA ARGUMENTAL ===
export function renderPrismaArgumento(prisma) {
  const arg = prisma.argument || {};
  let h = '';
  // Research question
  h += `<div style="background:var(--bg2);border:2px solid var(--purple);border-radius:10px;padding:16px 20px;margin-bottom:12px;text-align:center;">`;
  h += `<div style="font-size:11px;color:var(--purple);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Pregunta doctoral</div>`;
  h += `<div style="font-size:16px;color:var(--tx);font-weight:600;cursor:pointer;" onclick="editArgField('question')">${arg.question ? escH(arg.question) : '<span style=color:var(--tx3);font-style:italic;>Click para definir tu pregunta de investigación</span>'}</div>`;
  h += `</div>`;

  // Central argument
  h += `<div style="background:var(--bg2);border:1px solid rgba(155,125,207,0.2);border-radius:10px;padding:14px 18px;margin-bottom:16px;text-align:center;">`;
  h += `<div style="font-size:11px;color:var(--purple);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Argumento central</div>`;
  h += `<div style="font-size:14px;color:var(--tx);cursor:pointer;" onclick="editArgField('central')">${arg.central ? escH(arg.central) : '<span style=color:var(--tx3);font-style:italic;>Click para definir tu argumento central</span>'}</div>`;
  h += `</div>`;

  // Premises
  h += `<div style="font-size:13px;font-weight:600;color:var(--tx2);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;"><span>Premisas / Pilares del argumento</span><button class="btn bo" onclick="addArgPremise()" style="font-size:12px;">+ Premisa</button></div>`;
  const premises = arg.premises || [];
  if (premises.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Agrega las premisas que sostienen tu argumento central.</div>`;
  }
  premises.forEach((p, pi) => {
    const supportLevel = p.support || 'gap';
    h += `<div class="prisma-arg ${supportLevel}">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div style="font-size:14px;font-weight:600;color:var(--tx);flex:1;">${escH(p.text)}</div>`;
    h += `<div style="display:flex;gap:4px;flex-shrink:0;">`;
    h += `<select onchange="updatePremiseSupport(${pi},this.value)" style="background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:4px;color:var(--tx);font-size:11px;padding:2px 4px;">`;
    [{ v: 'supported', l: '✅ Soportada' }, { v: 'partial', l: '⚠ Parcial' }, { v: 'gap', l: '❌ Sin soporte' }].forEach(o => {
      h += `<option value="${o.v}"${supportLevel === o.v ? ' selected' : ''}>${o.l}</option>`;
    });
    h += `</select>`;
    h += `<button onclick="editArgPremise(${pi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✎</button>`;
    h += `<button onclick="removeArgPremise(${pi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11px;">✕</button>`;
    h += `</div></div>`;
    if (p.evidence) h += `<div style="font-size:12px;color:var(--tx3);margin-top:4px;">Evidencia: ${escH(p.evidence)}</div>`;
    if (p.sources) h += `<div style="font-size:12px;color:var(--purple);margin-top:2px;">Fuentes: ${escH(p.sources)}</div>`;
    h += `</div>`;
  });

  // Summary
  const supported = premises.filter(p => p.support === 'supported').length;
  const partial = premises.filter(p => p.support === 'partial').length;
  const gaps = premises.filter(p => p.support === 'gap' || !p.support).length;
  if (premises.length > 0) {
    h += `<div style="display:flex;gap:12px;margin-top:12px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:13px;">`;
    h += `<span style="color:var(--green);">✅ ${supported} soportadas</span>`;
    h += `<span style="color:var(--gold);">⚠ ${partial} parciales</span>`;
    h += `<span style="color:var(--red);">❌ ${gaps} sin soporte</span>`;
    h += `</div>`;
  }
  return h;
}

// === ANALISIS DE VACIOS + FORTALEZAS ===
export function renderPrismaVacios(prisma) {
  let h = '';
  // Gaps
  h += `<div style="font-size:15px;font-weight:700;color:var(--gold);margin-bottom:8px;">⚠ Vacíos identificados</div>`;
  const gaps = prisma.gaps || [];
  if (gaps.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Ejecuta /prisma con Claude para analizar tus documentos e identificar vacíos automáticamente, o agrégalos manualmente.</div>`;
  }
  gaps.forEach((g, gi) => {
    h += `<div style="padding:10px 14px;margin:4px 0;background:rgba(232,168,56,0.04);border:1px solid rgba(232,168,56,0.1);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;"><span style="font-size:14px;color:var(--tx);">${escH(g.text)}</span>`;
    h += `<span onclick="removePrismaGap(${gi})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span></div>`;
    if (g.priority) h += `<div style="font-size:12px;color:var(--gold);margin-top:2px;">Prioridad: ${escH(g.priority)}</div>`;
    h += `</div>`;
  });
  h += `<button class="btn bo" onclick="addPrismaGap()" style="font-size:12px;margin-top:6px;">+ Agregar vacío</button>`;

  // Strengths
  h += `<div style="font-size:15px;font-weight:700;color:var(--green);margin:20px 0 8px;">💪 Fortalezas</div>`;
  const strengths = prisma.strengths || [];
  if (strengths.length === 0) {
    h += `<div style="padding:16px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Ejecuta /prisma para identificar fortalezas, o agrégalas manualmente.</div>`;
  }
  strengths.forEach((s, si) => {
    h += `<div style="padding:10px 14px;margin:4px 0;background:rgba(93,187,138,0.04);border:1px solid rgba(93,187,138,0.1);border-left:3px solid var(--green);border-radius:0 8px 8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;"><span style="font-size:14px;color:var(--tx);">${escH(s.text)}</span>`;
    h += `<span onclick="removePrismaStrength(${si})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.4;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.4">✕</span></div>`;
    h += `</div>`;
  });
  h += `<button class="btn bo" onclick="addPrismaStrength()" style="font-size:12px;margin-top:6px;">+ Agregar fortaleza</button>`;

  // Last analysis
  if (prisma.lastAnalysis) {
    h += `<div style="margin-top:20px;padding:12px 16px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--tx3);">Último análisis: ${prisma.lastAnalysis}</div>`;
  }
  return h;
}

// === PREGUNTAS DE INVESTIGACION EMERGENTES ===
export function renderPrismaPreguntas(prisma) {
  const preguntas = prisma.researchQuestions || [];
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">`;
  h += `<div style="font-size:15px;font-weight:700;color:var(--tx);">❓ Preguntas de investigación emergentes</div>`;
  h += `<button class="btn bo" onclick="addPrismaQuestion()" style="font-size:12px;">+ Pregunta</button>`;
  h += `</div>`;
  h += `<p style="font-size:13px;color:var(--tx3);margin-bottom:14px;">Preguntas que emergen del análisis conjunto de tus escritos. Cada una podría convertirse en un capítulo, un artículo o una línea de investigación.</p>`;

  if (preguntas.length === 0) {
    return h + `<div style="padding:20px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Aún no hay preguntas registradas. Agrega las preguntas de investigación que emergen de tus escritos, o ejecuta /prisma para que Claude las genere automáticamente.</div>`;
  }

  const statusLabels = { open: '🔓 Abierta', partial: '🔶 Parcialmente abordada', addressed: '✅ Abordada', future: '🔮 Futura' };
  const statusColors = { open: 'var(--blue)', partial: 'var(--gold)', addressed: 'var(--green)', future: 'var(--purple)' };
  const priorityLabels = { alta: '🔴', media: '🟡', baja: '🟢' };

  preguntas.forEach((q, qi) => {
    const status = q.status || 'open';
    const priority = q.priority || 'media';
    h += `<div style="background:var(--bg2);border:1px solid rgba(220,215,205,0.06);border-left:3px solid ${statusColors[status]};border-radius:0 10px 10px 0;padding:14px 18px;margin:8px 0;">`;
    h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
    h += `<div style="flex:1;">`;
    h += `<div style="font-size:15px;font-weight:600;color:var(--tx);line-height:1.5;">${escH(q.text)}</div>`;
    h += `<div style="display:flex;gap:10px;margin-top:6px;font-size:12px;">`;
    h += `<span style="color:${statusColors[status]};">${statusLabels[status]}</span>`;
    h += `<span>${priorityLabels[priority]} ${escH(priority)}</span>`;
    if (q.type) h += `<span style="color:var(--tx3);">Tipo: ${escH(q.type)}</span>`;
    h += `</div>`;
    if (q.context) h += `<div style="font-size:13px;color:var(--tx2);margin-top:6px;line-height:1.6;">${escH(q.context)}</div>`;
    if (q.sources) h += `<div style="font-size:12px;color:var(--purple);margin-top:4px;">Emerge de: ${escH(q.sources)}</div>`;
    if (q.methodology) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Metodología sugerida: ${escH(q.methodology)}</div>`;
    h += `</div>`;
    h += `<div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px;">`;
    h += `<select onchange="updateQuestionStatus(${qi},this.value)" style="background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:4px;color:var(--tx);font-size:11px;padding:2px;">`;
    ['open', 'partial', 'addressed', 'future'].forEach(s => { h += `<option value="${s}"${status === s ? ' selected' : ''}>${statusLabels[s]}</option>`; });
    h += `</select>`;
    h += `<button onclick="editPrismaQuestion(${qi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:12px;">✎</button>`;
    h += `<button onclick="removePrismaQuestion(${qi})" style="background:none;border:none;color:var(--tx3);cursor:pointer;font-size:11px;">✕</button>`;
    h += `</div></div></div>`;
  });

  // Summary
  const open = preguntas.filter(q => (q.status || 'open') === 'open').length;
  const partial = preguntas.filter(q => q.status === 'partial').length;
  const addressed = preguntas.filter(q => q.status === 'addressed').length;
  const future = preguntas.filter(q => q.status === 'future').length;
  h += `<div style="display:flex;gap:12px;margin-top:14px;padding:10px 14px;background:var(--bg2);border-radius:8px;font-size:13px;">`;
  h += `<span style="color:var(--blue);">🔓 ${open} abiertas</span>`;
  h += `<span style="color:var(--gold);">🔶 ${partial} parciales</span>`;
  h += `<span style="color:var(--green);">✅ ${addressed} abordadas</span>`;
  h += `<span style="color:var(--purple);">🔮 ${future} futuras</span>`;
  h += `</div>`;

  return h;
}

// === EVOLUCION ===
export function renderPrismaEvolucion(prisma) {
  const evo = prisma.evolution || [];
  let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">`;
  h += `<div style="font-size:15px;font-weight:700;color:var(--tx);">📈 Evolución del pensamiento</div>`;
  h += `<button class="btn bo" onclick="addPrismaEvolution()" style="font-size:12px;">+ Registrar hito</button>`;
  h += `</div>`;
  if (evo.length === 0) {
    return h + `<div style="padding:20px;color:var(--tx3);font-size:13px;text-align:center;font-style:italic;">Registra cómo evoluciona tu pensamiento doctoral. Cada hito marca un cambio, descubrimiento o decisión.</div>`;
  }
  evo.forEach((e, ei) => {
    h += `<div class="prisma-timeline-item">`;
    h += `<div class="prisma-timeline-dot"></div>`;
    h += `<div style="flex:1;">`;
    h += `<div style="font-size:12px;color:var(--purple);font-weight:600;">${e.date || ''}</div>`;
    h += `<div style="font-size:14px;color:var(--tx);margin-top:2px;">${escH(e.text)}</div>`;
    if (e.impact) h += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Impacto: ${escH(e.impact)}</div>`;
    h += `</div>`;
    h += `<span onclick="removePrismaEvolution(${ei})" style="font-size:10px;color:var(--tx3);cursor:pointer;opacity:0.3;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.3">✕</span>`;
    h += `</div>`;
  });
  return h;
}
