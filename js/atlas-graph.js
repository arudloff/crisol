// ============================================================
// CRISOL — atlas-graph.js  (Cytoscape.js concept map)
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';

let cy = null;

// ============================================================
// LOAD CYTOSCAPE (lazy, from CDN)
// ============================================================

let cytoscapeLoaded = false;
let cytoscapeLoading = false;
const loadQueue = [];

async function ensureCytoscape() {
  if (cytoscapeLoaded && window.cytoscape) return;
  if (cytoscapeLoading) {
    return new Promise(resolve => loadQueue.push(resolve));
  }
  cytoscapeLoading = true;

  const scripts = [
    'https://unpkg.com/cytoscape@3.30.4/dist/cytoscape.min.js',
    'https://unpkg.com/dagre@0.8.5/dist/dagre.min.js',
    'https://unpkg.com/cytoscape-dagre@2.5.0/cytoscape-dagre.js',
  ];

  for (const src of scripts) {
    await new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Register dagre extension
  if (window.cytoscape && window.cytoscapeDagre) {
    window.cytoscape.use(window.cytoscapeDagre);
  }

  cytoscapeLoaded = true;
  cytoscapeLoading = false;
  loadQueue.forEach(fn => fn());
  loadQueue.length = 0;
}

// ============================================================
// RENDER CONCEPT MAP
// ============================================================

export async function renderConceptMap(concepts, relations) {
  await ensureCytoscape();
  if (!window.cytoscape) {
    console.error('Atlas: Cytoscape not available');
    return;
  }

  const container = document.getElementById('atlas-cy');
  if (!container) return;

  // Build elements
  const nodes = concepts.map(c => ({
    data: {
      id: c.id,
      label: c.name,
      weight: c.weight,
      isThreshold: c.is_threshold,
      category: c.category || '',
      centrality: c.centrality_score || 0,
    },
  }));

  const edges = relations.map(r => ({
    data: {
      id: r.id,
      source: r.source_id,
      target: r.target_id,
      label: r.relation_type || r.label || '',
      relType: r.relation_type || '',
      isGap: !r.relation_type && !r.user_completed,
    },
  }));

  // Color by category
  const categories = [...new Set(concepts.map(c => c.category || ''))];
  const catColors = {};
  const palette = ['#4A90D9', '#D94A6B', '#49B882', '#D9A54A', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C'];
  categories.forEach((cat, i) => { catColors[cat] = palette[i % palette.length]; });

  // Size by weight
  const weightSizes = { foundational: 45, important: 32, peripheral: 22 };

  cy = window.cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': function(ele) { return catColors[ele.data('category')] || '#4A90D9'; },
          'width': function(ele) { return weightSizes[ele.data('weight')] || 32; },
          'height': function(ele) { return weightSizes[ele.data('weight')] || 32; },
          'font-size': 11,
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-wrap': 'wrap',
          'text-max-width': '80px',
          'border-width': function(ele) { return ele.data('isThreshold') ? 3 : 0; },
          'border-color': '#FFD700',
          'border-style': 'solid',
        },
      },
      {
        selector: 'edge',
        style: {
          'label': 'data(label)',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#999',
          'line-color': function(ele) {
            if (ele.data('relType') === 'tensions_with') return '#E74C3C';
            if (ele.data('isGap')) return '#DDD';
            return '#999';
          },
          'line-style': function(ele) { return ele.data('isGap') ? 'dashed' : 'solid'; },
          'font-size': 9,
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'color': '#666',
          'width': 1.5,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': 'var(--blue)',
        },
      },
    ],
    layout: { name: 'cose', animate: true, animationDuration: 500 },
    wheelSensitivity: 0.3,
  });

  // Click handlers
  cy.on('tap', 'node', function(evt) {
    const node = evt.target;
    showNodeDetail(node.data(), concepts);
  });

  cy.on('tap', 'edge', function(evt) {
    const edge = evt.target;
    showEdgeDetail(edge.data());
  });

  cy.on('tap', function(evt) {
    if (evt.target === cy) {
      const detail = document.getElementById('atlas-node-detail');
      if (detail) detail.style.display = 'none';
    }
  });
}

// ============================================================
// NODE / EDGE DETAIL PANELS
// ============================================================

function showNodeDetail(data, concepts) {
  const detail = document.getElementById('atlas-node-detail');
  if (!detail) return;

  const concept = concepts.find(c => c.id === data.id);
  if (!concept) return;

  const defs = Array.isArray(concept.definitions) ? concept.definitions : [];
  let defsHtml = defs.map(d => `<div class="atlas-detail-def">${escH(d.definition || '')}<br><small>${escH(d.page_ref ? 'p.' + d.page_ref : '')}</small></div>`).join('');

  detail.innerHTML = `
    <div class="atlas-detail-header">
      <strong>${escH(concept.name)}</strong>
      ${concept.is_threshold ? '<span class="atlas-badge atlas-badge-threshold">Umbral</span>' : ''}
      <button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
    </div>
    <div class="atlas-detail-body">
      <div><strong>Peso:</strong> ${concept.weight}</div>
      <div><strong>Categoria:</strong> ${concept.category || 'Sin categoria'}</div>
      <div><strong>Centralidad:</strong> ${(concept.centrality_score || 0).toFixed(2)}</div>
      ${defsHtml ? `<div><strong>Definiciones:</strong>${defsHtml}</div>` : ''}
    </div>`;
  detail.style.display = 'block';
}

function showEdgeDetail(data) {
  const detail = document.getElementById('atlas-node-detail');
  if (!detail) return;

  detail.innerHTML = `
    <div class="atlas-detail-header">
      <strong>Relacion</strong>
      <button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
    </div>
    <div class="atlas-detail-body">
      <div><strong>Tipo:</strong> ${escH(data.relType || data.label || 'Sin tipo')}</div>
      ${data.isGap ? '<div style="color:var(--gold);">Esta relacion es un gap — completala en Modo Activo</div>' : ''}
    </div>`;
  detail.style.display = 'block';
}

// ============================================================
// LAYOUT SWITCHING
// ============================================================

window.atlasLayoutForce = function() {
  if (!cy) return;
  cy.layout({ name: 'cose', animate: true, animationDuration: 400 }).run();
  document.getElementById('atlas-layout-force')?.classList.add('active');
  document.getElementById('atlas-layout-hierarchy')?.classList.remove('active');
};

window.atlasLayoutHierarchy = function() {
  if (!cy) return;
  cy.layout({ name: 'dagre', rankDir: 'TB', animate: true, animationDuration: 400 }).run();
  document.getElementById('atlas-layout-hierarchy')?.classList.add('active');
  document.getElementById('atlas-layout-force')?.classList.remove('active');
};

// ============================================================
// CLEANUP
// ============================================================

export function destroyConceptMap() {
  if (cy) { cy.destroy(); cy = null; }
}
