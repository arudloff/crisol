// ============================================================
// CRISOL — projects-core.js
// CRUD operations + persistence for projects (Supabase-backed)
// Extracted from projects.js for maintainability
// ============================================================

import { state } from './state.js';
import { showToast } from './utils.js';

// --- Synchronous getter (returns cache) ---
export function getProjects() {
  return state.projects || [];
}

// --- Save a single project to Supabase ---
export async function saveOneProject(proj) {
  if (!state.sdb || !state.currentUser) return;
  const { id, created, updated, _db_owner_id, _myRole, _isShared, ...metadata } = proj;
  const newTimestamp = new Date().toISOString();
  try {
    // Check for conflicts: did someone else update since we last loaded?
    if (updated && proj._isShared) {
      const { data: current } = await state.sdb.from('projects')
        .select('updated_at').eq('id', id).single();
      if (current && current.updated_at !== updated) {
        showToast('Otro usuario modifico este proyecto. Recargando...', 'error', 4000);
        setTimeout(() => location.reload(), 2000);
        return;
      }
    }

    await state.sdb.from('projects').update({
      title: proj.nombre || '',
      description: proj.descripcion || '',
      metadata: metadata,
      updated_at: newTimestamp
    }).eq('id', id);

    proj.updated = newTimestamp;
  } catch (e) { console.error('Project save error:', e); }
}

// --- Save all projects (backward compat — calls saveOne for each) ---
let _saveInProgress = false;
export async function saveProjects(projects) {
  state.projects = projects;
  try { localStorage.setItem('sila_projects_cache', JSON.stringify(projects)); } catch (e) {}
  if (_saveInProgress) return; // prevent concurrent batch saves
  _saveInProgress = true;
  try {
    for (const p of projects) await saveOneProject(p);
  } finally {
    _saveInProgress = false;
  }
}

// --- Load all projects from Supabase into cache (own + shared) ---
export async function loadProjects() {
  if (!state.sdb || !state.currentUser) {
    try { state.projects = JSON.parse(localStorage.getItem('sila_projects_cache')) || []; } catch (e) { state.projects = []; }
    return;
  }
  try {
    const { data, error } = await state.sdb
      .from('projects')
      .select('*, project_members(role, user_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    state.projects = (data || []).map(row => {
      const myMembership = (row.project_members || []).find(m => m.user_id === state.currentUser.id);
      return {
        id: row.id,
        nombre: row.title,
        descripcion: row.description,
        ...(row.metadata || {}),
        _db_owner_id: row.owner_id,
        _myRole: myMembership?.role || 'reader',
        _isShared: row.owner_id !== state.currentUser.id,
        created: row.created_at,
        updated: row.updated_at
      };
    });

    try { localStorage.setItem('sila_projects_cache', JSON.stringify(state.projects)); } catch (e) {}
  } catch (e) {
    console.error('loadProjects error:', e);
    try { state.projects = JSON.parse(localStorage.getItem('sila_projects_cache')) || []; } catch (e2) { state.projects = []; }
  }
}

// --- Create project in Supabase ---
export async function createProjectInDb(projectData) {
  if (!state.sdb || !state.currentUser) return null;
  const { nombre, descripcion, ...metadata } = projectData;
  const newId = (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
  try {
    const { error } = await state.sdb
      .from('projects')
      .insert({
        id: newId,
        title: nombre || '',
        description: descripcion || '',
        owner_id: state.currentUser.id,
        metadata: metadata
      });

    if (error) throw error;

    const { error: memError } = await state.sdb.from('project_members').insert({
      project_id: newId,
      user_id: state.currentUser.id,
      role: 'owner'
    });
    if (memError) console.warn('Member insert warning:', memError);

    return newId;
  } catch (e) {
    console.error('Create project error:', e);
    showToast('Error al crear proyecto', 'error');
    return null;
  }
}

// --- Delete project from Supabase ---
export async function deleteProjectFromDb(projId) {
  if (!state.sdb) return;
  try {
    await state.sdb.from('projects').delete().eq('id', projId);
  } catch (e) { console.error('Delete project error:', e); }
}

// --- Permission helper ---
export function canEditProject(proj) {
  return proj._myRole === 'owner';
}
