// ============================================================
// CRISOL — atlas-panels.js  (Panel renderers for Atlas)
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';

// ============================================================
// CORPUS LIST — main Atlas landing
// ============================================================

export function renderCorpusList(corpora) {
  if (!corpora || corpora.length === 0) {
    return `
      <div class="atlas-container">
        <div class="atlas-header">
          <h2>SILA Atlas</h2>
          <p class="atlas-subtitle">Cartografia intelectual pre-lectura</p>
        </div>
        <div class="atlas-empty-state">
          <div class="atlas-empty-icon">🗺</div>
          <h3>Comienza mapeando un campo</h3>
          <p>Crea un corpus tematico y alimentalo con papers. El Atlas construira
             incrementalmente un mapa de conceptos, genealogia intelectual y red de argumentos.</p>
          <button class="atlas-btn atlas-btn-primary" onclick="atlasShowCreateCorpus()">
            + Nuevo corpus
          </button>
        </div>
      </div>`;
  }

  let cards = '';
  corpora.forEach(c => {
    const paperCount = c.atlas_papers?.length || 0;
    const integrated = c.atlas_papers?.filter(p => ['integrated', 'deep_read', 'verified'].includes(p.status)).length || 0;
    const deepRead = c.atlas_papers?.filter(p => p.status === 'deep_read').length || 0;

    cards += `
      <div class="atlas-card" onclick="atlasOpenCorpus('${c.id}')">
        <div class="atlas-card-header">
          <h3>${escH(c.name)}</h3>
          ${c.project_id ? '<span class="atlas-badge atlas-badge-project">Vinculado</span>' : ''}
        </div>
        ${c.description ? `<p class="atlas-card-desc">${escH(c.description)}</p>` : ''}
        <div class="atlas-card-stats">
          <span>${paperCount} paper${paperCount !== 1 ? 's' : ''}</span>
          <span>${integrated} integrado${integrated !== 1 ? 's' : ''}</span>
          ${deepRead > 0 ? `<span class="atlas-stat-deep">${deepRead} lectura profunda</span>` : ''}
        </div>
        <div class="atlas-card-date">
          Actualizado: ${new Date(c.updated_at).toLocaleDateString()}
        </div>
      </div>`;
  });

  return `
    <div class="atlas-container">
      <div class="atlas-header">
        <h2>SILA Atlas</h2>
        <button class="atlas-btn atlas-btn-primary" onclick="atlasShowCreateCorpus()">+ Nuevo corpus</button>
      </div>
      <div class="atlas-grid">${cards}</div>
    </div>`;
}

// ============================================================
// CORPUS DETAIL — tabs + content
// ============================================================

export function renderCorpusDetail(data) {
  const { corpus, papers, concepts, relations, authors, traditions } = data;
  const tab = state.currentAtlasTab || 'corpus';

  const tabs = [
    { id: 'corpus', label: 'Papers', icon: '📄', count: papers.length },
    { id: 'glossary', label: 'Glosario', icon: '📖', count: concepts.length },
    { id: 'map', label: 'Mapa', icon: '🗺', count: concepts.length },
    { id: 'genealogy', label: 'Genealogia', icon: '🌳', count: authors.length },
  ];

  const tabsHtml = tabs.map(t => `
    <div class="atlas-tab ${tab === t.id ? 'active' : ''}" onclick="atlasTab('${t.id}')">
      ${t.icon} ${t.label} <span class="atlas-tab-count">${t.count}</span>
    </div>
  `).join('');

  let content = '';
  if (tab === 'corpus') content = renderPaperList(papers, corpus);
  else if (tab === 'glossary') content = renderGlossary(concepts, papers);
  else if (tab === 'map') content = renderMapContainer(concepts, relations);
  else if (tab === 'genealogy') content = renderGenealogyContainer(authors, traditions);

  return `
    <div class="atlas-container">
      <div class="atlas-corpus-header">
        <button class="atlas-btn atlas-btn-back" onclick="atlasBack()">&larr; Atlas</button>
        <div>
          <h2>${escH(corpus.name)}</h2>
          ${corpus.description ? `<p class="atlas-subtitle">${escH(corpus.description)}</p>` : ''}
        </div>
        <button class="atlas-btn atlas-btn-danger" onclick="atlasConfirmDelete('${corpus.id}','${escH(corpus.name)}')" title="Eliminar corpus">🗑</button>
      </div>
      <div class="atlas-tabs">${tabsHtml}</div>
      <div class="atlas-content">${content}</div>
    </div>`;
}

// ============================================================
// PAPER LIST — within a corpus
// ============================================================

function renderPaperList(papers, corpus) {
  const statusLabels = {
    uploaded: '⏳ Subido',
    processing: '⚙ Procesando...',
    extracted: '📦 Extraido',
    verifying: '🔍 Verificando...',
    verified: '✓ Verificado',
    revision_required: '⚠ Requiere revision',
    integrated: '✓ Integrado',
    deep_read: '📖 Lectura profunda',
    failed: '✗ Error',
  };

  const statusColors = {
    uploaded: 'var(--tx3)', processing: 'var(--blue)', extracted: 'var(--gold)',
    verifying: 'var(--blue)', verified: 'var(--green)', revision_required: 'var(--red)',
    integrated: 'var(--green)', deep_read: 'var(--purple)', failed: 'var(--red)',
  };

  if (papers.length === 0) {
    return `
      <div class="atlas-empty-state atlas-empty-small">
        <p>Este corpus no tiene papers aun.</p>
        <p style="color:var(--tx3);font-size:13px;">
          Usa el skill <code>/sila-atlas</code> en Claude Code para procesar un paper
          y agregarlo a este corpus.
        </p>
      </div>`;
  }

  let rows = '';
  papers.forEach(p => {
    const authStr = Array.isArray(p.authors) ? p.authors.join(', ') : (p.authors || '');
    const fidelity = p.verification?.summary?.overall_fidelity;
    const fidelityBadge = fidelity != null
      ? `<span class="atlas-badge ${fidelity >= 90 ? 'atlas-badge-pass' : 'atlas-badge-warn'}">${fidelity.toFixed(1)}%</span>`
      : '';
    const relevance = p.relevance_score;
    const stars = relevance != null
      ? (relevance >= 0.7 ? '⭐⭐⭐' : relevance >= 0.4 ? '⭐⭐' : '⭐')
      : '';

    rows += `
      <div class="atlas-paper-row" onclick="atlasOpenPaper('${p.id}')">
        <div class="atlas-paper-info">
          <div class="atlas-paper-title">${escH(authStr)} (${p.year || '?'})</div>
          <div class="atlas-paper-subtitle">${escH(p.title)}</div>
        </div>
        <div class="atlas-paper-meta">
          ${stars}
          ${fidelityBadge}
          <span class="atlas-paper-status" style="color:${statusColors[p.status] || 'var(--tx3)'}">
            ${statusLabels[p.status] || p.status}
          </span>
          <span class="atlas-badge atlas-badge-mode">${p.mode === 'active' ? 'Activo' : 'Completo'}</span>
        </div>
      </div>`;
  });

  return `<div class="atlas-paper-list">${rows}</div>`;
}

// ============================================================
// GLOSSARY — unified concept list
// ============================================================

function renderGlossary(concepts, papers) {
  if (concepts.length === 0) {
    return '<div class="atlas-empty-state atlas-empty-small"><p>No hay conceptos extraidos aun. Procesa papers para construir el glosario.</p></div>';
  }

  const weightIcons = { foundational: '◆◆◆', important: '◆◆', peripheral: '◆' };
  const weightColors = { foundational: 'var(--red)', important: 'var(--gold)', peripheral: 'var(--tx3)' };

  // Group by category
  const byCategory = {};
  concepts.forEach(c => {
    const cat = c.category || 'Sin categoria';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  });

  let html = '<div class="atlas-glossary">';

  // Search
  html += '<input type="text" class="atlas-search" placeholder="Buscar concepto..." oninput="atlasFilterGlossary(this.value)">';

  Object.keys(byCategory).sort().forEach(cat => {
    html += `<div class="atlas-glossary-cat"><h4>${escH(cat)}</h4>`;
    byCategory[cat].forEach(c => {
      const defs = Array.isArray(c.definitions) ? c.definitions : [];
      const hasTension = defs.length > 1;
      const thresholdBadge = c.is_threshold ? '<span class="atlas-badge atlas-badge-threshold">Concepto umbral</span>' : '';

      let defsHtml = '';
      defs.forEach(d => {
        const paper = papers?.find(p => p.id === d.paper_id);
        const paperRef = paper ? `${Array.isArray(paper.authors) ? paper.authors[0] : paper.authors} (${paper.year})` : 'Fuente desconocida';
        defsHtml += `<div class="atlas-def">
          <span class="atlas-def-ref">${escH(paperRef)}:</span>
          <span class="atlas-def-text">${escH(d.definition || '')}</span>
          ${d.page_ref ? `<span class="atlas-def-page">p.${escH(d.page_ref)}</span>` : ''}
        </div>`;
      });

      const userNotes = c.user_notes
        ? `<div class="atlas-user-note"><strong>Tu nota:</strong> ${escH(c.user_notes)}</div>`
        : '';

      html += `
        <div class="atlas-concept" data-name="${escH(c.name.toLowerCase())}">
          <div class="atlas-concept-header" onclick="this.parentElement.classList.toggle('open')">
            <span class="atlas-concept-weight" style="color:${weightColors[c.weight]}">${weightIcons[c.weight] || '◆'}</span>
            <span class="atlas-concept-name">${escH(c.name)}</span>
            ${thresholdBadge}
            ${hasTension ? '<span class="atlas-badge atlas-badge-tension">Definiciones en tension</span>' : ''}
            <span class="atlas-concept-count">${defs.length} def${defs.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="atlas-concept-body">
            ${defsHtml}
            ${userNotes}
          </div>
        </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

window.atlasFilterGlossary = function(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.atlas-concept').forEach(el => {
    const name = el.getAttribute('data-name') || '';
    el.style.display = name.includes(q) ? '' : 'none';
  });
};

// ============================================================
// MAP CONTAINER — placeholder for Cytoscape
// ============================================================

function renderMapContainer(concepts, relations) {
  if (concepts.length === 0) {
    return '<div class="atlas-empty-state atlas-empty-small"><p>No hay conceptos para visualizar. Procesa al menos un paper.</p></div>';
  }

  return `
    <div class="atlas-map-toolbar">
      <button class="atlas-btn atlas-btn-small active" id="atlas-layout-force" onclick="atlasLayoutForce()">Force</button>
      <button class="atlas-btn atlas-btn-small" id="atlas-layout-hierarchy" onclick="atlasLayoutHierarchy()">Jerarquico</button>
      <span class="atlas-map-info">${concepts.length} conceptos, ${relations.length} relaciones</span>
    </div>
    <div id="atlas-cy" class="atlas-cy-container"></div>
    <div id="atlas-node-detail" class="atlas-node-detail" style="display:none;"></div>`;
}

// ============================================================
// GENEALOGY CONTAINER — placeholder for Cytoscape dagre
// ============================================================

function renderGenealogyContainer(authors, traditions) {
  if (authors.length === 0) {
    return '<div class="atlas-empty-state atlas-empty-small"><p>No hay autores mapeados aun. Procesa papers para construir la genealogia.</p></div>';
  }

  const tradList = traditions.map(t => `
    <div class="atlas-tradition-chip" onclick="atlasFilterTradition('${t.id}')">${escH(t.name)} (${t.key_authors?.length || 0})</div>
  `).join('');

  return `
    <div class="atlas-genealogy-toolbar">
      <div class="atlas-tradition-chips">${tradList}
        <div class="atlas-tradition-chip atlas-tradition-all" onclick="atlasFilterTradition(null)">Todas</div>
      </div>
      <span class="atlas-map-info">${authors.length} autores, ${traditions.length} tradiciones</span>
    </div>
    <div id="atlas-genealogy-cy" class="atlas-cy-container"></div>
    <div id="atlas-author-detail" class="atlas-node-detail" style="display:none;"></div>`;
}

window.atlasFilterTradition = function(traditionId) {
  // Will be implemented with Cytoscape filtering
  console.log('Filter tradition:', traditionId);
};

// ============================================================
// PAPER DETAIL — individual paper view
// ============================================================

export function renderPaperDetail(paper, corpusData) {
  const authStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : (paper.authors || '');
  const ext = paper.extraction_data || {};
  const ver = paper.verification || {};
  const concepts = ext.concepts || [];
  const arguments_ = ext.arguments || [];
  const authorsMentioned = ext.authors_mentioned || [];

  const statusLabels = {
    uploaded: '⏳ Subido', processing: '⚙ Procesando...', extracted: '📦 Extraido',
    verifying: '🔍 Verificando...', verified: '✓ Verificado',
    revision_required: '⚠ Requiere revision', integrated: '✓ Integrado',
    deep_read: '📖 Lectura profunda', failed: '✗ Error',
  };

  // Verification summary
  let verHtml = '';
  if (ver.summary) {
    const s = ver.summary;
    const verdictClass = s.verdict === 'PASS' ? 'atlas-badge-pass'
      : s.verdict === 'REVISION_REQUIRED' ? 'atlas-badge-warn' : 'atlas-badge-fail';
    verHtml = `
      <div class="atlas-verification-summary">
        <h4>Verificacion de fidelidad</h4>
        <span class="atlas-badge ${verdictClass}">${s.verdict} — ${(s.overall_fidelity || 0).toFixed(1)}%</span>
        <div class="atlas-ver-stats">
          <span>Conceptos: ${s.concepts_pass || 0} PASS / ${s.concepts_fail || 0} FAIL</span>
          <span>Alucinaciones: ${s.hallucinations || 0}</span>
          <span>Omisiones: ${s.omissions || 0}</span>
        </div>
        ${s.critical_issues?.length ? `<div class="atlas-ver-issues">
          ${s.critical_issues.map(i => `<div class="atlas-ver-issue">🔴 ${escH(i)}</div>`).join('')}
        </div>` : ''}
        <button class="atlas-btn atlas-btn-small" onclick="atlasShowFullVerification('${paper.id}')">Ver reporte completo</button>
      </div>`;
  }

  // Concepts extracted
  let conceptsHtml = '';
  if (concepts.length > 0) {
    conceptsHtml = '<h4>Conceptos extraidos (' + concepts.length + ')</h4><div class="atlas-extracted-list">';
    concepts.forEach(c => {
      conceptsHtml += `<div class="atlas-extracted-item">
        <strong>${escH(c.name)}</strong>
        <span class="atlas-badge atlas-badge-weight">${c.weight || 'important'}</span>
        <p>${escH(c.definition || '')}</p>
      </div>`;
    });
    conceptsHtml += '</div>';
  }

  // Authors mentioned
  let authorsHtml = '';
  if (authorsMentioned.length > 0) {
    authorsHtml = '<h4>Autores mencionados (' + authorsMentioned.length + ')</h4><div class="atlas-extracted-list">';
    authorsMentioned.forEach(a => {
      authorsHtml += `<div class="atlas-extracted-item">
        <strong>${escH(a.name)}</strong> ${a.dates ? `(${escH(a.dates)})` : ''}
        <span class="atlas-badge">${escH(a.tradition || '')}</span>
        <span style="color:var(--tx3);font-size:12px;">${escH(a.role_in_paper || '')}</span>
      </div>`;
    });
    authorsHtml += '</div>';
  }

  // Arguments
  let argsHtml = '';
  if (arguments_.length > 0) {
    argsHtml = '<h4>Argumentos principales (' + arguments_.length + ')</h4>';
    arguments_.forEach(a => {
      argsHtml += `<div class="atlas-argument">
        <div class="atlas-arg-claim"><strong>Claim:</strong> ${escH(a.claim || '')}</div>
        ${a.grounds ? `<div class="atlas-arg-detail"><strong>Evidence:</strong> ${escH(a.grounds)}</div>` : ''}
        ${a.warrant ? `<div class="atlas-arg-detail"><strong>Warrant:</strong> ${escH(a.warrant)}</div>` : ''}
        ${a.qualifier ? `<div class="atlas-arg-detail" style="color:var(--gold);"><strong>Qualifier:</strong> ${escH(a.qualifier)}</div>` : ''}
        ${a.rebuttal ? `<div class="atlas-arg-detail" style="color:var(--red);"><strong>Rebuttal:</strong> ${escH(a.rebuttal)}</div>` : ''}
      </div>`;
    });
  }

  return `
    <div class="atlas-container">
      <div class="atlas-corpus-header">
        <button class="atlas-btn atlas-btn-back" onclick="atlasBack()">&larr; Corpus</button>
        <div>
          <h2>${escH(authStr)} (${paper.year || '?'})</h2>
          <p class="atlas-subtitle">${escH(paper.title)}</p>
        </div>
      </div>
      <div class="atlas-paper-meta-bar">
        <span>${statusLabels[paper.status] || paper.status}</span>
        <span class="atlas-badge atlas-badge-mode">${paper.mode === 'active' ? 'Modo Activo' : 'Modo Completo'}</span>
        ${paper.journal ? `<span>${escH(paper.journal)}</span>` : ''}
      </div>
      ${verHtml}
      ${conceptsHtml}
      ${authorsHtml}
      ${argsHtml}
      ${paper.status === 'integrated' || paper.status === 'verified' ? `
        <div class="atlas-action-bar">
          <button class="atlas-btn atlas-btn-primary" onclick="atlasLaunchDeepRead('${paper.id}')">📖 Leer profundo con SILA</button>
        </div>` : ''}
    </div>`;
}

window.atlasShowFullVerification = function(paperId) {
  // Navigate to full verification report
  const data = state._atlasCorpusCache;
  if (!data) return;
  const paper = data.papers.find(p => p.id === paperId);
  if (!paper || !paper.verification) return;
  const ct = document.getElementById('ct');
  if (!ct) return;
  const bc = state._getBreadcrumb ? state._getBreadcrumb() : '';
  ct.innerHTML = bc + renderVerificationReport(paper);
};

window.atlasLaunchDeepRead = function(paperId) {
  if (window.showToast) window.showToast('Lectura profunda: usa /sila-atlas deep-read en Claude Code', 'info');
};

// ============================================================
// VERIFICATION REPORT — full detail view
// ============================================================

export function renderVerificationReport(paper) {
  const ver = paper.verification || {};
  const concepts = ver.concepts?.verified || [];
  const hallucinations = ver.concepts?.hallucinations || [];
  const omissions = ver.concepts?.omissions || [];
  const authorsVer = ver.authors?.verified || [];
  const relationsVer = ver.relations?.verified || [];

  let html = `
    <div class="atlas-container">
      <button class="atlas-btn atlas-btn-back" onclick="atlasOpenPaper('${paper.id}')">&larr; Paper</button>
      <h2>Reporte de verificacion</h2>
      <p class="atlas-subtitle">${escH(paper.title)}</p>`;

  // Summary bar
  if (ver.summary) {
    const s = ver.summary;
    html += `<div class="atlas-ver-summary-bar">
      <span>Fidelidad: <strong>${(s.overall_fidelity || 0).toFixed(1)}%</strong></span>
      <span>Conceptos PASS: ${s.concepts_pass || 0}</span>
      <span>Conceptos FAIL: ${s.concepts_fail || 0}</span>
      <span>Alucinaciones: ${s.hallucinations || 0}</span>
      <span>Omisiones: ${s.omissions || 0}</span>
    </div>`;
  }

  // Hallucinations (if any)
  if (hallucinations.length > 0) {
    html += '<h3 style="color:var(--red);">Alucinaciones detectadas</h3>';
    hallucinations.forEach(h => {
      html += `<div class="atlas-ver-item atlas-ver-fail">
        <strong>${escH(h.concept)}</strong>
        <p>${escH(h.note || '')}</p>
      </div>`;
    });
  }

  // Omissions
  if (omissions.length > 0) {
    html += '<h3 style="color:var(--gold);">Omisiones</h3>';
    omissions.forEach(o => {
      html += `<div class="atlas-ver-item atlas-ver-warn">
        <strong>${escH(o.concept)}</strong> — mencionado ${o.times_mentioned || '?'} veces
        <p>${escH(o.note || '')}</p>
      </div>`;
    });
  }

  // Verified concepts
  if (concepts.length > 0) {
    html += '<h3>Conceptos verificados</h3>';
    concepts.forEach(c => {
      const icon = c.fidelity === 'PASS' ? '✓' : '✗';
      const cls = c.fidelity === 'PASS' ? 'atlas-ver-pass' : 'atlas-ver-fail';
      html += `<div class="atlas-ver-item ${cls}">
        <span>${icon}</span>
        <strong>${escH(c.concept)}</strong>
        ${c.source_quote ? `<blockquote>${escH(c.source_quote)}</blockquote>` : ''}
        ${c.extracted_definition ? `<p><em>Extraido:</em> ${escH(c.extracted_definition)}</p>` : ''}
        ${c.issue ? `<p class="atlas-ver-issue-text">${escH(c.issue)}</p>` : ''}
      </div>`;
    });
  }

  html += '</div>';
  return html;
}
