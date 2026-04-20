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
  // Wait for Cytoscape (loaded by atlas-graph.js)
  let attempts = 0;
  while (!window.cytoscape && attempts < 20) {
    await new Promise(r => setTimeout(r, 200));
    attempts++;
  }
  if (!window.cytoscape) {
    console.error('Atlas genealogy: Cytoscape not available');
    return;
  }

  const container = document.getElementById('atlas-genealogy-cy');
  if (!container) return;

  // Build tradition nodes (groups)
  const tradNodes = traditions.map(t => ({
    data: {
      id: 'trad-' + t.id,
      label: t.name,
      type: 'tradition',
    },
  }));

  // Build author nodes
  const authorNodes = authors.map(a => ({
    data: {
      id: a.id,
      label: a.name,
      dates: a.dates || '',
      role: a.role,
      type: 'author',
      tradition: a.tradition_id ? 'trad-' + a.tradition_id : null,
      keyIdeas: a.key_ideas || [],
      mentionedIn: a.mentioned_in || [],
    },
  }));

  // Build influence edges
  const edges = [];
  authors.forEach(a => {
    if (Array.isArray(a.influenced_by)) {
      a.influenced_by.forEach(targetId => {
        // Only add edge if target exists in our author set
        if (authors.some(x => x.id === targetId)) {
          edges.push({
            data: {
              id: 'inf-' + targetId + '-' + a.id,
              source: targetId,
              target: a.id,
              label: 'influye',
            },
          });
        }
      });
    }
  });

  // Build tradition tension edges
  traditions.forEach(t => {
    if (Array.isArray(t.opposing_traditions)) {
      t.opposing_traditions.forEach(oppId => {
        if (traditions.some(x => x.id === oppId)) {
          edges.push({
            data: {
              id: 'tension-' + t.id + '-' + oppId,
              source: 'trad-' + t.id,
              target: 'trad-' + oppId,
              label: 'en tension',
              isTension: true,
            },
          });
        }
      });
    }
  });

  // Role colors
  const roleColors = {
    foundational: '#E74C3C',
    contemporary: '#3498DB',
    opposing: '#E67E22',
    cited_only: '#95A5A6',
  };

  gCy = window.cytoscape({
    container,
    elements: [...tradNodes, ...authorNodes, ...edges],
    style: [
      {
        selector: 'node[type="tradition"]',
        style: {
          'label': 'data(label)',
          'shape': 'round-rectangle',
          'background-color': '#2C3E50',
          'color': '#fff',
          'font-size': 13,
          'font-weight': 'bold',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': 'label',
          'height': 35,
          'padding': '12px',
        },
      },
      {
        selector: 'node[type="author"]',
        style: {
          'label': function(ele) {
            const dates = ele.data('dates');
            return dates ? ele.data('label') + '\n' + dates : ele.data('label');
          },
          'background-color': function(ele) { return roleColors[ele.data('role')] || '#95A5A6'; },
          'width': function(ele) {
            return ele.data('role') === 'foundational' ? 40 : ele.data('role') === 'cited_only' ? 22 : 30;
          },
          'height': function(ele) {
            return ele.data('role') === 'foundational' ? 40 : ele.data('role') === 'cited_only' ? 22 : 30;
          },
          'font-size': 10,
          'color': '#333',
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'text-wrap': 'wrap',
          'text-max-width': '90px',
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-color': function(ele) { return ele.data('isTension') ? '#E74C3C' : '#BDC3C7'; },
          'target-arrow-color': function(ele) { return ele.data('isTension') ? '#E74C3C' : '#BDC3C7'; },
          'line-style': function(ele) { return ele.data('isTension') ? 'dashed' : 'solid'; },
          'width': 1.5,
          'label': function(ele) { return ele.data('isTension') ? 'tension' : ''; },
          'font-size': 8,
          'text-rotation': 'autorotate',
          'color': '#E74C3C',
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#FFD700',
        },
      },
    ],
    layout: {
      name: 'dagre',
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 80,
      animate: true,
      animationDuration: 500,
    },
    wheelSensitivity: 0.3,
  });

  // Click on author
  gCy.on('tap', 'node[type="author"]', function(evt) {
    const d = evt.target.data();
    showAuthorDetail(d, authors);
  });

  // Click on tradition
  gCy.on('tap', 'node[type="tradition"]', function(evt) {
    const d = evt.target.data();
    showTraditionDetail(d, traditions, authors);
  });

  // Click background
  gCy.on('tap', function(evt) {
    if (evt.target === gCy) {
      const detail = document.getElementById('atlas-author-detail');
      if (detail) detail.style.display = 'none';
    }
  });
}

// ============================================================
// DETAIL PANELS
// ============================================================

function showAuthorDetail(data, allAuthors) {
  const detail = document.getElementById('atlas-author-detail');
  if (!detail) return;

  const author = allAuthors.find(a => a.id === data.id);
  if (!author) return;

  const ideas = (author.key_ideas || []).map(i => `<li>${escH(i)}</li>`).join('');
  const papers = (author.mentioned_in || []).length;

  const influencedByNames = (author.influenced_by || [])
    .map(id => allAuthors.find(a => a.id === id)?.name)
    .filter(Boolean)
    .map(n => escH(n))
    .join(', ');

  const influencesNames = (author.influences || [])
    .map(id => allAuthors.find(a => a.id === id)?.name)
    .filter(Boolean)
    .map(n => escH(n))
    .join(', ');

  detail.innerHTML = `
    <div class="atlas-detail-header">
      <strong>${escH(author.name)}</strong> ${author.dates ? `(${escH(author.dates)})` : ''}
      <button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
    </div>
    <div class="atlas-detail-body">
      <div><strong>Rol:</strong> ${author.role}</div>
      <div><strong>Mencionado en:</strong> ${papers} paper${papers !== 1 ? 's' : ''}</div>
      ${influencedByNames ? `<div><strong>Influido por:</strong> ${influencedByNames}</div>` : ''}
      ${influencesNames ? `<div><strong>Influye a:</strong> ${influencesNames}</div>` : ''}
      ${ideas ? `<div><strong>Ideas clave:</strong><ul>${ideas}</ul></div>` : ''}
    </div>`;
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
    .map(id => allTraditions.find(t => t.id === id)?.name)
    .filter(Boolean)
    .map(n => escH(n))
    .join(', ');

  detail.innerHTML = `
    <div class="atlas-detail-header">
      <strong>${escH(trad.name)}</strong>
      <button class="atlas-detail-close" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
    </div>
    <div class="atlas-detail-body">
      ${trad.description ? `<p>${escH(trad.description)}</p>` : ''}
      <div><strong>Autores:</strong> ${memberList || 'Ninguno mapeado'}</div>
      ${opposing ? `<div><strong>En tension con:</strong> ${opposing}</div>` : ''}
      <div><strong>Papers:</strong> ${(trad.papers_in_tradition || []).length}</div>
    </div>`;
  detail.style.display = 'block';
}

// ============================================================
// CLEANUP
// ============================================================

export function destroyGenealogy() {
  if (gCy) { gCy.destroy(); gCy = null; }
}
