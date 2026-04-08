// ============================================================
// CRISOL — projects-migration.js
// One-time migration of localStorage projects to Supabase
// ============================================================

import { state } from './state.js';
import { showToast } from './utils.js';
import { createProjectInDb } from './projects-core.js';

export async function migrateLocalProjects() {
  if (!state.sdb || !state.currentUser) return;
  if (localStorage.getItem('crisol_projects_migrated')) return;

  const raw = localStorage.getItem('sila_projects');
  if (!raw) { localStorage.setItem('crisol_projects_migrated', 'done'); return; }

  let oldProjects;
  try { oldProjects = JSON.parse(raw); } catch (e) { return; }
  if (!oldProjects || !oldProjects.length) { localStorage.setItem('crisol_projects_migrated', 'done'); return; }

  console.log('Migrating ' + oldProjects.length + ' projects to Supabase...');
  const idMap = {}; // old_id → new_uuid
  let allOk = true;

  // Check existing projects to avoid duplicates on retry
  const { data: existing } = await state.sdb.from('projects').select('title').eq('owner_id', state.currentUser.id);
  const existingTitles = new Set((existing || []).map(p => p.title));

  for (const proj of oldProjects) {
    const oldId = proj.id;
    const { id, created, updated, ...rest } = proj;
    if (existingTitles.has(rest.nombre)) { console.log('Skip duplicate:', rest.nombre); continue; }
    const newId = await createProjectInDb(rest);
    if (newId) {
      idMap[oldId] = newId;
      // Update metadata with full project data + original timestamps
      await state.sdb.from('projects').update({
        metadata: rest,
        created_at: created || new Date().toISOString()
      }).eq('id', newId);
    } else {
      allOk = false;
    }
  }

  if (!allOk) {
    console.warn('Some projects failed to migrate. Will retry next time.');
    return; // Don't mark as done — retry on next boot
  }

  // Update kanban task references with new UUIDs
  try {
    const kanban = JSON.parse(localStorage.getItem('sila_kanban') || '[]');
    let kanbanChanged = false;
    kanban.forEach(task => {
      if (task.project && idMap[task.project]) {
        task.project = idMap[task.project];
        kanbanChanged = true;
      }
    });
    if (kanbanChanged) localStorage.setItem('sila_kanban', JSON.stringify(kanban));
  } catch (e) { console.error('Kanban migration error:', e); }

  localStorage.setItem('crisol_projects_migrated', 'done');
  console.log('Migration complete. ID mapping:', idMap);
  showToast('Proyectos migrados a la nube', 'success', 3000);
}
