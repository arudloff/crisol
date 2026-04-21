// ============================================================
// CRISOL — atlas-graph.js  (Cytoscape.js concept map)
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';

let cy = null;

// ============================================================
// LOAD CYTOSCAPE (lazy, from CDN)
// ============================================================

// Cytoscape is loaded via <script> tags in index.html (more reliable than dynamic loading)
function isCytoscapeReady() {
  return !!window.cytoscape;
}

// ============================================================
// RENDER CONCEPT MAP
// ============================================================

export async function renderConceptMap(concepts, relations) {
  if (!isCytoscapeReady()) {
    const ct = document.getElementById('atlas-cy');
    if (ct) ct.innerHTML = '<div style="padding:40px;text-align:center;color:var(--tx3);">Error cargando Cytoscape. Revisa la consola.</div>';
    return;
  }

  const container = document.getElementById('atlas-cy');
  if (!container) { console.error('Atlas: #atlas-cy container not found'); return; }

  // Ensure container has dimensions
  if (container.offsetHeight < 10) {
    container.style.height = '500px';
  }

  // Build node set for edge validation
  const nodeIds = new Set(concepts.map(c => c.id));

  // Build elements
  const nodes = concepts.map(c => ({
    data: {
      id: c.id,
      label: c.name,
      weight: c.weight || 'important',
      isThreshold: c.is_threshold ? 'yes' : 'no',
      category: c.category || 'general',
      centrality: c.centrality_score || 0,
    },
  }));

  // Only include edges where both source and target exist
  const edges = relations
    .filter(r => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
    .map(r => ({
      data: {
        id: r.id,
        source: r.source_id,
        target: r.target_id,
        label: r.relation_type || '',
        relType: r.relation_type || '',
      },
    }));

  console.log('Atlas graph: rendering', nodes.length, 'nodes,', edges.length, 'edges');

  // Color palette by category
  const categories = [...new Set(concepts.map(c => c.category || 'general'))];
  const palette = ['#4A90D9', '#D94A6B', '#49B882', '#D9A54A', '#9B59B6', '#E67E22', '#1ABC9C', '#E74C3C'];
  const catColorMap = {};
  categories.forEach((cat, i) => { catColorMap[cat] = palette[i % palette.length]; });

  // Destroy previous instance
  if (cy) { cy.destroy(); cy = null; }

  try {
    cy = window.cytoscape({
      container: container,
      elements: { nodes: nodes, edges: edges },
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'background-color': '#4A90D9',
            'width': 40,
            'height': 40,
            'font-size': 14,
            'color': '#ffffff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'node[weight="foundational"]',
          style: { 'width': 55, 'height': 55, 'font-size': 16, 'font-weight': 'bold' },
        },
        {
          selector: 'node[weight="peripheral"]',
          style: { 'width': 28, 'height': 28, 'font-size': 12 },
        },
        {
          selector: 'node[isThreshold="yes"]',
          style: { 'border-width': 3, 'border-color': '#FFD700' },
        },
        {
          selector: 'edge',
          style: {
            'label': 'data(label)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#888',
            'line-color': '#888',
            'font-size': 11,
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'color': '#ccc',
            'width': 1.5,
          },
        },
        {
          selector: 'edge[relType="tensions_with"]',
          style: { 'line-color': '#E74C3C', 'target-arrow-color': '#E74C3C', 'line-style': 'dashed' },
        },
        {
          selector: 'node:selected',
          style: { 'border-width': 3, 'border-color': '#3498DB' },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: function() { return 8000; },
        idealEdgeLength: function() { return 120; },
        gravity: 0.3,
        numIter: 500,
        padding: 30,
      },
      wheelSensitivity: 0.3,
    });

    // Apply colors by category after init (workaround for data-driven colors)
    cy.nodes().forEach(n => {
      const cat = n.data('category');
      n.style('background-color', catColorMap[cat] || '#4A90D9');
    });

    // Click handlers
    cy.on('tap', 'node', function(evt) {
      showNodeDetail(evt.target.data(), concepts);
    });

    cy.on('tap', 'edge', function(evt) {
      showEdgeDetail(evt.target.data());
    });

    cy.on('tap', function(evt) {
      if (evt.target === cy) {
        const detail = document.getElementById('atlas-node-detail');
        if (detail) detail.style.display = 'none';
      }
    });

    console.log('Atlas graph: rendered successfully');

  } catch (e) {
    console.error('Atlas graph: render error:', e);
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);">Error renderizando el mapa: ' + escH(e.message) + '</div>';
  }
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
  let defsHtml = defs.map(d => '<div class="atlas-detail-def">' + escH(d.definition || '') + '<br><small>' + escH(d.page_ref ? 'p.' + d.page_ref : '') + '</small></div>').join('');

  detail.innerHTML = '<div class="atlas-detail-header"><strong>' + escH(concept.name) + '</strong>' +
    (concept.is_threshold ? ' <span class="atlas-badge atlas-badge-threshold">Umbral</span>' : '') +
    '<button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display=\'none\'">&times;</button></div>' +
    '<div class="atlas-detail-body">' +
    '<div><strong>Peso:</strong> ' + concept.weight + '</div>' +
    '<div><strong>Categoria:</strong> ' + (concept.category || 'Sin categoria') + '</div>' +
    '<div><strong>Centralidad:</strong> ' + (concept.centrality_score || 0).toFixed(2) + '</div>' +
    (defsHtml ? '<div><strong>Definiciones:</strong>' + defsHtml + '</div>' : '') +
    '</div>';
  detail.style.display = 'block';
}

function showEdgeDetail(data) {
  const detail = document.getElementById('atlas-node-detail');
  if (!detail) return;

  detail.innerHTML = '<div class="atlas-detail-header"><strong>Relacion</strong>' +
    '<button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display=\'none\'">&times;</button></div>' +
    '<div class="atlas-detail-body">' +
    '<div><strong>Tipo:</strong> ' + escH(data.relType || data.label || 'Sin tipo') + '</div>' +
    '</div>';
  detail.style.display = 'block';
}

// ============================================================
// LAYOUT SWITCHING
// ============================================================

window.atlasLayoutForce = function() {
  if (!cy) return;
  cy.layout({ name: 'cose', animate: true, animationDuration: 400, nodeRepulsion: function() { return 8000; } }).run();
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
