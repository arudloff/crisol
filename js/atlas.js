// ============================================================
// CRISOL — atlas.js  (SILA Atlas coordinator)
// Cartografia intelectual pre-lectura
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';
import {
  renderCorpusList, renderCorpusDetail, renderPaperDetail,
  renderVerificationReport
} from './atlas-panels.js';
import { renderConceptMap, destroyConceptMap } from './atlas-graph.js';
import { renderGenealogy, destroyGenealogy } from './atlas-genealogy.js';

// ============================================================
// DATA ACCESS — Supabase
// ============================================================

async function loadCorpora() {
  if (!state.sdb || !state.currentUser) {
    console.warn('Atlas: loadCorpora aborted — sdb:', !!state.sdb, 'user:', !!state.currentUser);
    return [];
  }
  console.log('Atlas: loadCorpora for user:', state.currentUser.id);
  const { data, error } = await state.sdb
    .from('atlas_corpus')
    .select('*, atlas_papers(id, title, authors, year, status, mode, relevance_score)')
    .eq('user_id', state.currentUser.id)
    .order('updated_at', { ascending: false });
  console.log('Atlas loadCorpora result:', data?.map(c => ({ name: c.name, papers: c.atlas_papers?.length })), error?.message);
  if (error) { console.error('Atlas: load corpora error:', error); return []; }
  return data || [];
}

async function loadCorpusData(corpusId) {
  if (!state.sdb || !state.currentUser) {
    console.warn('Atlas: loadCorpusData aborted — sdb:', !!state.sdb, 'user:', !!state.currentUser);
    return null;
  }
  console.log('Atlas: loadCorpusData for', corpusId, 'user:', state.currentUser.id);
  const [corpusRes, papersRes, conceptsRes, relationsRes, authorsRes, traditionsRes] = await Promise.all([
    state.sdb.from('atlas_corpus').select('*').eq('id', corpusId).single(),
    state.sdb.from('atlas_papers').select('*').eq('corpus_id', corpusId).order('created_at', { ascending: true }),
    state.sdb.from('atlas_concepts').select('*').eq('corpus_id', corpusId).order('centrality_score', { ascending: false }),
    state.sdb.from('atlas_concept_relations').select('*').eq('corpus_id', corpusId),
    state.sdb.from('atlas_authors').select('*').eq('corpus_id', corpusId).order('role'),
    state.sdb.from('atlas_traditions').select('*').eq('corpus_id', corpusId),
  ]);
  // Log all results for debugging
  console.log('Atlas loadCorpusData results:', {
    corpus: corpusRes.data?.name, corpusErr: corpusRes.error?.message,
    papers: papersRes.data?.length, papersErr: papersRes.error?.message,
    concepts: conceptsRes.data?.length, conceptsErr: conceptsRes.error?.message,
    relations: relationsRes.data?.length, relationsErr: relationsRes.error?.message,
    authors: authorsRes.data?.length, authorsErr: authorsRes.error?.message,
    traditions: traditionsRes.data?.length, traditionsErr: traditionsRes.error?.message,
  });
  if (corpusRes.error) { console.error('Atlas: load corpus error:', corpusRes.error); return null; }
  return {
    corpus: corpusRes.data,
    papers: papersRes.data || [],
    concepts: conceptsRes.data || [],
    relations: relationsRes.data || [],
    authors: authorsRes.data || [],
    traditions: traditionsRes.data || [],
  };
}

async function createCorpus(name, description, projectId) {
  if (!state.sdb || !state.currentUser) return null;
  const { data, error } = await state.sdb
    .from('atlas_corpus')
    .insert({
      user_id: state.currentUser.id,
      name: name.trim(),
      description: description?.trim() || null,
      project_id: projectId || null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') { // unique violation
      if (window.showToast) window.showToast('Ya tienes un corpus con ese nombre', 'warn');
      return null;
    }
    console.error('Atlas: create corpus error:', error);
    return null;
  }
  if (window.showToast) window.showToast('Corpus creado: ' + escH(name));
  return data;
}

async function deleteCorpus(corpusId) {
  if (!state.sdb) return;
  const { error } = await state.sdb.from('atlas_corpus').delete().eq('id', corpusId);
  if (error) console.error('Atlas: delete corpus error:', error);
}

// Expose data loaders for sub-modules
state._atlasLoadCorpora = loadCorpora;
state._atlasLoadCorpusData = loadCorpusData;
state._atlasCreateCorpus = createCorpus;
state._atlasDeleteCorpus = deleteCorpus;

// ============================================================
// NAVIGATION — goAtlas
// ============================================================

window.goAtlas = function() {
  if (state._saveNavState) state._saveNavState();
  state.isHome = false; state.isMiTesis = false;
  state.currentProjectId = null; state.currentDocId = null;
  state._isPrisma = false; state._isAtlas = true;
  document.querySelectorAll('.s-it,.s-home,.s-proj').forEach(i => i.classList.remove('active'));
  if (state._ensureToolsOpen) state._ensureToolsOpen();
  const el = document.getElementById('s-atlas'); if (el) el.classList.add('active');
  if (state._updateTopbar) state._updateTopbar();
  renderAtlas();
  if (state._closeSidebarMobile) state._closeSidebarMobile();
};

// ============================================================
// RENDER — Main Atlas view
// ============================================================

export async function renderAtlas() {
  const ct = document.getElementById('ct');
  if (!ct) return;

  const bc = state._getBreadcrumb ? state._getBreadcrumb() : '';

  // If viewing a specific paper
  if (state.currentAtlasPaper) {
    const corpusData = state._atlasCorpusCache;
    if (corpusData) {
      const paper = corpusData.papers.find(p => p.id === state.currentAtlasPaper);
      if (paper) { ct.innerHTML = bc + renderPaperDetail(paper, corpusData); return; }
    }
  }

  // If viewing a corpus
  if (state.currentAtlasCorpus) {
    ct.innerHTML = bc + '<div class="atlas-loading">Cargando corpus...</div>';
    const data = await loadCorpusData(state.currentAtlasCorpus);
    if (!data) { ct.innerHTML = bc + '<div class="atlas-empty">No se pudo cargar el corpus.<br><small>sdb: ' + !!state.sdb + ' | user: ' + !!state.currentUser + '</small></div>'; return; }
    state._atlasCorpusCache = data;
    ct.innerHTML = bc + renderCorpusDetail(data);

    // Initialize graph/genealogy after DOM is ready
    requestAnimationFrame(() => {
      if (state.currentAtlasTab === 'map' && data.concepts.length > 0) {
        renderConceptMap(data.concepts, data.relations);
      } else if (state.currentAtlasTab === 'genealogy' && data.authors.length > 0) {
        renderGenealogy(data.authors, data.traditions);
      }
    });
    return;
  }

  // Default: corpus list
  ct.innerHTML = bc + '<div class="atlas-loading">Cargando Atlas...</div>';
  const corpora = await loadCorpora();
  ct.innerHTML = bc + renderCorpusList(corpora);
}
window.renderAtlas = renderAtlas;

// ============================================================
// TAB NAVIGATION within a corpus
// ============================================================

window.atlasTab = function(tab) {
  destroyConceptMap();
  destroyGenealogy();
  state.currentAtlasTab = tab;
  renderAtlas();
};

window.atlasOpenCorpus = function(corpusId) {
  state.currentAtlasCorpus = corpusId;
  state.currentAtlasPaper = null;
  state.currentAtlasTab = 'corpus';
  renderAtlas();
};

window.atlasBack = function() {
  destroyConceptMap();
  destroyGenealogy();
  if (state.currentAtlasPaper) {
    state.currentAtlasPaper = null;
    renderAtlas();
  } else {
    state.currentAtlasCorpus = null;
    state._atlasCorpusCache = null;
    renderAtlas();
  }
};

window.atlasOpenPaper = function(paperId) {
  state.currentAtlasPaper = paperId;
  renderAtlas();
};

// ============================================================
// CREATE CORPUS — modal
// ============================================================

window.atlasShowCreateCorpus = function() {
  const projects = state._getProjects ? state._getProjects() : [];
  const projOpts = projects.map(p =>
    `<option value="${p.id}">${escH(p.name)}</option>`
  ).join('');

  const modal = document.createElement('div');
  modal.className = 'atlas-modal-overlay';
  modal.id = 'atlas-create-modal';
  modal.innerHTML = `
    <div class="atlas-modal">
      <h3>Nuevo corpus tematico</h3>
      <label>Nombre <span style="color:var(--red);">*</span></label>
      <input type="text" id="atlas-corpus-name" placeholder="Ej: Reflexividad docente" maxlength="120" autofocus>
      <label>Descripcion</label>
      <textarea id="atlas-corpus-desc" rows="3" placeholder="Que tema abarca este corpus (opcional)"></textarea>
      <label>Vincular a proyecto</label>
      <select id="atlas-corpus-project">
        <option value="">Sin vincular</option>
        ${projOpts}
      </select>
      <div class="atlas-modal-actions">
        <button class="atlas-btn atlas-btn-secondary" onclick="document.getElementById('atlas-create-modal').remove()">Cancelar</button>
        <button class="atlas-btn atlas-btn-primary" onclick="atlasDoCreateCorpus()">Crear corpus</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('atlas-corpus-name').focus();
};

window.atlasDoCreateCorpus = async function() {
  const name = document.getElementById('atlas-corpus-name')?.value?.trim();
  if (!name) { if (window.showToast) window.showToast('El nombre es requerido', 'warn'); return; }
  const desc = document.getElementById('atlas-corpus-desc')?.value?.trim();
  const projId = document.getElementById('atlas-corpus-project')?.value || null;

  const corpus = await createCorpus(name, desc, projId);
  if (corpus) {
    document.getElementById('atlas-create-modal')?.remove();
    state.currentAtlasCorpus = corpus.id;
    state.currentAtlasTab = 'corpus';
    renderAtlas();
  }
};

// ============================================================
// DELETE CORPUS — confirm
// ============================================================

window.atlasConfirmDelete = function(corpusId, corpusName) {
  if (!confirm('Eliminar corpus "' + corpusName + '" y todos sus papers/artefactos? Esta accion no se puede deshacer.')) return;
  deleteCorpus(corpusId).then(() => {
    state.currentAtlasCorpus = null;
    state._atlasCorpusCache = null;
    if (window.showToast) window.showToast('Corpus eliminado');
    renderAtlas();
  });
};
