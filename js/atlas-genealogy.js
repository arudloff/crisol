// ============================================================
// CRISOL — atlas-genealogy.js  (Intellectual genealogy view)
// Uses Cytoscape.js with dagre layout for hierarchical display
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';

let gCy = null;

// ============================================================
// RENDER GENEALOGY
// ============================================================

export async function renderGenealogy(authors, traditions) {
  // Wait for Cytoscape (loaded by atlas-graph.js ensureCytoscape)
  let attempts = 0;
  while (!window.cytoscape && attempts < 30) {
    await new Promise(r => setTimeout(r, 300));
    attempts++;
  }
  if (!window.cytoscape) {
    console.error('Atlas genealogy: Cytoscape not available');
    const ct = document.getElementById('atlas-genealogy-cy');
    if (ct) ct.innerHTML = '<div style="padding:40px;text-align:center;color:var(--tx3);">Error cargando Cytoscape.</div>';
    return;
  }

  const container = document.getElementById('atlas-genealogy-cy');
  if (!container) { console.error('Atlas genealogy: container not found'); return; }

  if (container.offsetHeight < 10) {
    container.style.height = '500px';
  }

  // Role colors
  const roleColors = {
    foundational: '#E74C3C',
    contemporary: '#3498DB',
    opposing: '#E67E22',
    cited_only: '#95A5A6',
  };

  // Build tradition nodes
  const tradNodes = traditions.map(t => ({
    data: {
      id: 'trad-' + t.id,
      label: t.name,
      nodeType: 'tradition',
    },
  }));

  // Build author nodes
  const authorNodes = authors.map(a => ({
    data: {
      id: a.id,
      label: a.name + (a.dates ? '\n(' + a.dates + ')' : ''),
      role: a.role || 'cited_only',
      nodeType: 'author',
      traditionId: a.tradition_id ? 'trad-' + a.tradition_id : null,
    },
  }));

  // Build edges: author → tradition
  const tradEdges = authors
    .filter(a => a.tradition_id)
    .map(a => ({
      data: {
        id: 'mem-' + a.id,
        source: a.id,
        target: 'trad-' + a.tradition_id,
        edgeType: 'member',
      },
    }));

  // Build influence edges
  const authorIdSet = new Set(authors.map(a => a.id));
  const influenceEdges = [];
  authors.forEach(a => {
    if (Array.isArray(a.influenced_by)) {
      a.influenced_by.forEach(srcId => {
        if (authorIdSet.has(srcId)) {
          influenceEdges.push({
            data: {
              id: 'inf-' + srcId + '-' + a.id,
              source: srcId,
              target: a.id,
              edgeType: 'influence',
            },
          });
        }
      });
    }
  });

  // Build tradition tension edges
  const tradIdSet = new Set(traditions.map(t => t.id));
  const tensionEdges = [];
  traditions.forEach(t => {
    if (Array.isArray(t.opposing_traditions)) {
      t.opposing_traditions.forEach(oppId => {
        if (tradIdSet.has(oppId)) {
          tensionEdges.push({
            data: {
              id: 'ten-' + t.id + '-' + oppId,
              source: 'trad-' + t.id,
              target: 'trad-' + oppId,
              edgeType: 'tension',
            },
          });
        }
      });
    }
  });

  const allElements = [...tradNodes, ...authorNodes, ...tradEdges, ...influenceEdges, ...tensionEdges];
  console.log('Atlas genealogy: rendering', authorNodes.length, 'authors,', tradNodes.length, 'traditions,', (tradEdges.length + influenceEdges.length + tensionEdges.length), 'edges');

  if (gCy) { gCy.destroy(); gCy = null; }

  try {
    gCy = window.cytoscape({
      container: container,
      elements: allElements,
      style: [
        {
          selector: 'node[nodeType="tradition"]',
          style: {
            'label': 'data(label)',
            'shape': 'round-rectangle',
            'background-color': '#2C3E50',
            'color': '#fff',
            'font-size': 16,
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 'label',
            'height': 40,
            'padding': '16px',
          },
        },
        {
          selector: 'node[nodeType="author"]',
          style: {
            'label': 'data(label)',
            'background-color': '#95A5A6',
            'width': 35,
            'height': 35,
            'font-size': 13,
            'color': '#fff',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'node[role="foundational"]',
          style: { 'background-color': '#E74C3C', 'width': 45, 'height': 45, 'font-size': 15, 'font-weight': 'bold' },
        },
        {
          selector: 'node[role="contemporary"]',
          style: { 'background-color': '#3498DB' },
        },
        {
          selector: 'node[role="opposing"]',
          style: { 'background-color': '#E67E22' },
        },
        {
          selector: 'edge[edgeType="member"]',
          style: {
            'line-color': '#555',
            'target-arrow-shape': 'none',
            'line-style': 'dotted',
            'width': 1,
          },
        },
        {
          selector: 'edge[edgeType="influence"]',
          style: {
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'line-color': '#BDC3C7',
            'target-arrow-color': '#BDC3C7',
            'width': 1.5,
          },
        },
        {
          selector: 'edge[edgeType="tension"]',
          style: {
            'curve-style': 'bezier',
            'line-color': '#E74C3C',
            'target-arrow-shape': 'diamond',
            'target-arrow-color': '#E74C3C',
            'line-style': 'dashed',
            'width': 2,
            'label': 'tension',
            'font-size': 8,
            'color': '#E74C3C',
            'text-rotation': 'autorotate',
          },
        },
        {
          selector: 'node:selected',
          style: { 'border-width': 3, 'border-color': '#FFD700' },
        },
      ],
      layout: {
        name: window._dagreRegistered ? 'dagre' : 'cose',
        rankDir: 'TB',
        nodeSep: 60,
        rankSep: 80,
        animate: false,
        padding: 30,
      },
      wheelSensitivity: 0.3,
    });

    // Click on author
    gCy.on('tap', 'node[nodeType="author"]', function(evt) {
      showAuthorDetail(evt.target.data(), authors);
    });

    // Click on tradition
    gCy.on('tap', 'node[nodeType="tradition"]', function(evt) {
      showTraditionDetail(evt.target.data(), traditions, authors);
    });

    // Click background
    gCy.on('tap', function(evt) {
      if (evt.target === gCy) {
        const detail = document.getElementById('atlas-author-detail');
        if (detail) detail.style.display = 'none';
      }
    });

    console.log('Atlas genealogy: rendered successfully');

  } catch (e) {
    console.error('Atlas genealogy: render error:', e);
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);">Error: ' + escH(e.message) + '</div>';
  }
}

// ============================================================
// DETAIL PANELS
// ============================================================

function showAuthorDetail(data, allAuthors) {
  const detail = document.getElementById('atlas-author-detail');
  if (!detail) return;

  const author = allAuthors.find(a => a.id === data.id);
  if (!author) return;

  const ideas = (author.key_ideas || []).map(i => '<li>' + escH(i) + '</li>').join('');
  const papers = (author.mentioned_in || []).length;

  const influencedByNames = (author.influenced_by || [])
    .map(id => allAuthors.find(a => a.id === id)?.name).filter(Boolean).map(n => escH(n)).join(', ');
  const influencesNames = (author.influences || [])
    .map(id => allAuthors.find(a => a.id === id)?.name).filter(Boolean).map(n => escH(n)).join(', ');

  detail.innerHTML = '<div class="atlas-detail-header"><strong>' + escH(author.name) + '</strong> ' +
    (author.dates ? '(' + escH(author.dates) + ')' : '') +
    '<button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display=\'none\'">&times;</button></div>' +
    '<div class="atlas-detail-body">' +
    '<div><strong>Rol:</strong> ' + (author.role || 'cited_only') + '</div>' +
    '<div><strong>Papers:</strong> ' + papers + '</div>' +
    (influencedByNames ? '<div><strong>Influido por:</strong> ' + influencedByNames + '</div>' : '') +
    (influencesNames ? '<div><strong>Influye a:</strong> ' + influencesNames + '</div>' : '') +
    (ideas ? '<div><strong>Ideas clave:</strong><ul>' + ideas + '</ul></div>' : '') +
    '</div>';
  detail.style.display = 'block';
}

function showTraditionDetail(data, allTraditions, allAuthors) {
  const detail = document.getElementById('atlas-author-detail');
  if (!detail) return;

  const tradId = data.id.replace('trad-', '');
  const trad = allTraditions.find(t => t.id === tradId);
  if (!trad) return;

  const members = allAuthors.filter(a => a.tradition_id === tradId);
  const memberList = members.map(m => escH(m.name)).join(', ');
  const opposing = (trad.opposing_traditions || [])
    .map(id => allTraditions.find(t => t.id === id)?.name).filter(Boolean).map(n => escH(n)).join(', ');

  detail.innerHTML = '<div class="atlas-detail-header"><strong>' + escH(trad.name) + '</strong>' +
    '<button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display=\'none\'">&times;</button></div>' +
    '<div class="atlas-detail-body">' +
    (trad.description ? '<p>' + escH(trad.description) + '</p>' : '') +
    '<div><strong>Autores:</strong> ' + (memberList || 'Ninguno mapeado') + '</div>' +
    (opposing ? '<div><strong>En tension con:</strong> ' + opposing + '</div>' : '') +
    '</div>';
  detail.style.display = 'block';
}

// ============================================================
// CLEANUP
// ============================================================

export function destroyGenealogy() {
  if (gCy) { gCy.destroy(); gCy = null; }
}
