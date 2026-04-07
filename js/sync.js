// ============================================================
// CRISOL — sync.js  (Supabase cloud sync layer)
// Extracted from SILA v4 monolith · all sync + realtime logic
// ============================================================

import { state } from './state.js';
import { ld, sv, getSK, calcProgress, userKey } from './storage.js';

// --------------- helpers ---------------
function setSyncStatus(msg, color) {
  const el = document.getElementById('sync-status');
  if (el) { el.textContent = msg; el.style.color = color || 'var(--tx3)'; }
}

// --------------- userdata sync (article study data) ---------------
let syncTimer = null;

export function syncToCloud(d) {
  if (!state.syncEnabled || !state.sdb || !state.currentUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      setSyncStatus('☁ Sincronizando...', 'var(--gold)');
      const { error } = await state.sdb.from('sila_userdata').upsert({
        user_id: state.currentUser.id,
        article_key: state.currentArticleKey,
        data: d
      }, { onConflict: 'user_id,article_key' });
      if (error) throw error;
      setSyncStatus('☁ Sincronizado', 'var(--green)');
    } catch (e) {
      console.error('Sync error:', e);
      setSyncStatus('☁ Error sync', 'var(--red)');
    }
  }, 2000);
}

export async function loadFromCloud() {
  if (!state.syncEnabled || !state.sdb || !state.currentUser) return null;
  try {
    setSyncStatus('☁ Cargando...', 'var(--gold)');
    const { data, error } = await state.sdb.from('sila_userdata')
      .select('data,updated_at')
      .eq('user_id', state.currentUser.id)
      .eq('article_key', state.currentArticleKey)
      .single();
    if (error) {
      if (error.code === 'PGRST116') { setSyncStatus('☁ Nuevo artículo', 'var(--tx3)'); return null; }
      throw error;
    }
    setSyncStatus('☁ Sincronizado', 'var(--green)');
    return data;
  } catch (e) {
    console.error('Cloud load error:', e);
    setSyncStatus('☁ Offline', 'var(--tx3)');
    return null;
  }
}

// Merge: cloud wins if newer, local wins if cloud unavailable
export async function initSync() {
  const cloudResult = await loadFromCloud();
  if (!cloudResult || !cloudResult.data) return; // no cloud data, keep local

  const local = ld();
  const cloudData = cloudResult.data;

  // If local is empty, use cloud
  const localHasData = local.d || local.claims || local.p || local.f;
  if (!localHasData) {
    localStorage.setItem(getSK(), JSON.stringify(cloudData));
    console.log('Loaded from cloud (local was empty)');
    return;
  }

  // If both have data, cloud timestamp wins (last-write-wins)
  const cloudTime = new Date(cloudResult.updated_at).getTime();
  const localTime = new Date(local._lastSync || 0).getTime();
  if (cloudTime > localTime) {
    localStorage.setItem(getSK(), JSON.stringify(cloudData));
    console.log('Cloud data is newer, using cloud');
  } else {
    console.log('Local data is newer, keeping local');
    syncToCloud(local); // push local to cloud
  }
}

// --------------- settings sync ---------------
let settingsSyncTimer = null;

export function syncSettingsToCloud() {
  if (!state.sdb || !state.currentUser) return;
  clearTimeout(settingsSyncTimer);
  settingsSyncTimer = setTimeout(async () => {
    try {
      const payload = {
        sources: state.getSources ? state.getSources() : [],
        fontSize: parseInt(localStorage.getItem('sila_fs')) || 15,
        colCount: parseInt(localStorage.getItem('sila_cols')) || 2
      };
      const { error } = await state.sdb.from('sila_settings').upsert(
        { user_id: state.currentUser.id, data: payload },
        { onConflict: 'user_id' }
      );
      if (error) { console.error('Settings sync error:', error); }
      else { console.log('Settings synced to cloud'); }
    } catch (e) { console.error('Settings sync exception:', e); }
  }, 2000);
}

export async function loadSettingsFromCloud() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_settings')
      .select('data').eq('user_id', state.currentUser.id).single();
    if (error || !data || !data.data) {
      // No cloud settings yet — push local settings to cloud
      console.log('No cloud settings found, pushing local');
      syncSettingsToCloud();
      return;
    }
    const s = data.data;
    if (s.sources && Array.isArray(s.sources) && s.sources.length > 0) {
      localStorage.setItem('sila_sources', JSON.stringify(s.sources));
      console.log('Sources loaded from cloud:', s.sources.length);
    }
    if (s.fontSize) {
      localStorage.setItem('sila_fs', s.fontSize);
      state.fontSize = s.fontSize;
      document.documentElement.style.setProperty('--fs', s.fontSize + 'px');
    }
    if (s.colCount) { localStorage.setItem('sila_cols', s.colCount); }
  } catch (e) { console.error('Settings load error:', e); }
}

// --------------- projects sync ---------------
let projSyncTimer = null;
let projSyncPaused = false;

export function syncProjectsToCloud(projects) {
  if (!state.sdb || !state.currentUser || projSyncPaused) return;
  clearTimeout(projSyncTimer);
  projSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('sila_projects').upsert(
        { user_id: state.currentUser.id, data: projects },
        { onConflict: 'user_id' }
      );
      console.log('Projects synced to cloud');
    } catch (e) { console.error('Project sync error:', e); }
  }, 2000);
}

export async function initProjectsSync() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_projects')
      .select('data,updated_at').eq('user_id', state.currentUser.id).single();
    if (!error && data && data.data) {
      const local = state.getProjects ? state.getProjects() : [];
      const cloud = data.data;
      const localTime = localStorage.getItem('sila_projects_ts') || '0';
      const cloudTime = new Date(data.updated_at).getTime();
      if (cloud.length > 0 && (local.length === 0 || cloudTime > parseInt(localTime))) {
        localStorage.setItem('sila_projects', JSON.stringify(cloud));
        localStorage.setItem('sila_projects_ts', String(cloudTime));
        if (state.buildProjectSidebar) state.buildProjectSidebar();
        console.log('Projects loaded from cloud (' + cloud.length + ')');
      } else if (local.length > 0) {
        syncProjectsToCloud(local);
      }
    }
    // Realtime listener — only apply if cloud is actually newer than local
    state.sdb.channel('projects-sync')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sila_projects',
        filter: 'user_id=eq.' + state.currentUser.id
      }, payload => {
        const localTs = parseInt(localStorage.getItem('sila_projects_ts') || '0');
        const cloudTs = new Date(payload.new.updated_at || 0).getTime();
        // Ignore if local data is newer (this update came from our own sync)
        if (localTs >= cloudTs - 2000) { console.log('Projects realtime: ignoring own echo'); return; }
        console.log('Projects updated from another device');
        projSyncPaused = true;
        const cloud = payload.new.data;
        if (cloud && Array.isArray(cloud)) {
          localStorage.setItem('sila_projects', JSON.stringify(cloud));
          localStorage.setItem('sila_projects_ts', String(cloudTs));
          if (state.buildProjectSidebar) state.buildProjectSidebar();
          if (state.currentProjectId && state.renderProjectDash) {
            state.renderProjectDash(state.currentProjectId);
          }
        }
        setTimeout(() => { projSyncPaused = false; }, 3000);
      })
      .subscribe();
    console.log('Projects realtime listener active');
  } catch (e) { console.error('Project sync init error:', e); }
}

// --------------- kanban sync ---------------
let kanbanSyncTimer = null;

export function syncKanbanToCloud(items) {
  if (!state.sdb || !state.currentUser) return;
  clearTimeout(kanbanSyncTimer);
  kanbanSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('sila_kanban').upsert(
        { user_id: state.currentUser.id, data: items, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      console.log('Kanban synced to cloud');
    } catch (e) { console.error('Kanban sync error:', e); }
  }, 2000);
}

export async function initKanbanSync() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_kanban')
      .select('data,updated_at').eq('user_id', state.currentUser.id).single();
    if (!error && data && data.data) {
      const local = state.getKanban ? state.getKanban() : [];
      const localTs = parseInt(localStorage.getItem(userKey('sila_kanban_ts')) || '0');
      const cloudTs = new Date(data.updated_at).getTime();
      if (cloudTs > localTs && data.data.length > 0) {
        localStorage.setItem(userKey('sila_kanban'), JSON.stringify(data.data));
        localStorage.setItem(userKey('sila_kanban_ts'), String(cloudTs));
        console.log('Kanban loaded from cloud');
      } else if (local.length > 0) {
        syncKanbanToCloud(local);
      }
    } else if (state.getKanban && state.getKanban().length > 0) {
      syncKanbanToCloud(state.getKanban());
    }
  } catch (e) { console.error('Kanban init sync error:', e); }
}

// --------------- PRISMA sync ---------------
let prismaSyncTimer = null;

export function syncPrismaToCloud(data) {
  if (!state.sdb || !state.currentUser) return;
  clearTimeout(prismaSyncTimer);
  prismaSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('sila_prisma').upsert(
        { user_id: state.currentUser.id, data: data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      console.log('PRISMA synced');
    } catch (e) { console.error('PRISMA sync error:', e); }
  }, 2000);
}

export async function initPrismaSync() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_prisma')
      .select('data,updated_at').eq('user_id', state.currentUser.id).single();
    if (!error && data && data.data) {
      const localTs = parseInt(localStorage.getItem(userKey('sila_prisma_ts')) || '0');
      const cloudTs = new Date(data.updated_at).getTime();
      if (cloudTs > localTs) {
        localStorage.setItem(userKey('sila_prisma'), JSON.stringify(data.data));
        localStorage.setItem(userKey('sila_prisma_ts'), String(cloudTs));
        console.log('PRISMA loaded from cloud');
      } else if (state.getPrisma) {
        syncPrismaToCloud(state.getPrisma());
      }
    }
  } catch (e) { console.error('PRISMA init sync error:', e); }
}

// --------------- docs sync ---------------
let docSyncTimer = null;
let docSyncPaused = false; // pause during incoming sync to avoid loop

export function syncDocsToCloud(docs) {
  if (!state.sdb || !state.currentUser || docSyncPaused) return;
  clearTimeout(docSyncTimer);
  docSyncTimer = setTimeout(async () => {
    try {
      await state.sdb.from('sila_docs').upsert({
        user_id: state.currentUser.id,
        data: docs
      }, { onConflict: 'user_id' });
      console.log('Docs synced to cloud');
    } catch (e) { console.error('Doc sync error:', e); }
  }, 2000);
}

export async function initDocsSync() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb.from('sila_docs')
      .select('data,updated_at')
      .eq('user_id', state.currentUser.id)
      .single();
    if (!error && data && data.data) {
      const local = state.getDocs ? state.getDocs() : [];
      const cloud = data.data;
      const localTime = localStorage.getItem(userKey('sila_docs_ts')) || '0';
      const cloudTime = new Date(data.updated_at).getTime();
      if (cloud.length > 0 && (local.length === 0 || cloudTime > parseInt(localTime))) {
        localStorage.setItem(userKey('sila_docs'), JSON.stringify(cloud));
        localStorage.setItem(userKey('sila_docs_ts'), String(cloudTime));
        if (state.buildDocSidebar) state.buildDocSidebar();
        console.log('Docs loaded from cloud (' + cloud.length + ' docs)');
      } else if (local.length > 0) {
        syncDocsToCloud(local);
      }
    }
    // Subscribe to realtime changes (Level 2) — ignore own echoes
    state.sdb.channel('docs-sync')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'sila_docs',
        filter: 'user_id=eq.' + state.currentUser.id
      }, payload => {
        const localTs = parseInt(localStorage.getItem(userKey('sila_docs_ts')) || '0');
        const cloudTs = new Date(payload.new.updated_at || 0).getTime();
        if (localTs >= cloudTs - 2000) { console.log('Docs realtime: ignoring own echo'); return; }
        console.log('Docs updated from another device');
        docSyncPaused = true; // prevent echo
        const cloud = payload.new.data;
        if (cloud && Array.isArray(cloud)) {
          localStorage.setItem(userKey('sila_docs'), JSON.stringify(cloud));
          localStorage.setItem(userKey('sila_docs_ts'), String(cloudTs));
          if (state.buildDocSidebar) state.buildDocSidebar();
          // If viewing a doc, refresh it
          if (state.currentDocId) {
            const doc = cloud.find(d => d.id === state.currentDocId);
            if (doc && state.renderDocEditor) state.renderDocEditor();
          }
        }
        setTimeout(() => { docSyncPaused = false; }, 3000); // resume sync after 3s
      })
      .subscribe();
    console.log('Docs realtime listener active');
  } catch (e) { console.error('Doc sync init error:', e); }
}

// ============================================================
// DR SYNC — Claude ↔ CRISOL via Supabase
// Socratic log, alerts, wizard context
// ============================================================

// --- Load socratic log for a project ---
export async function loadSocraticLog(projectId) {
  if (!state.sdb || !state.currentUser) return [];
  try {
    const { data, error } = await state.sdb
      .from('dr_socratic_log')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Socratic log load error:', error); return []; }
    return data || [];
  } catch (e) { console.error('Socratic log error:', e); return []; }
}

// --- Write socratic entry (from CRISOL gate responses) ---
export async function writeSocraticEntry(projectId, entry) {
  if (!state.sdb || !state.currentUser) return;
  try {
    await state.sdb.from('dr_socratic_log').insert({
      project_id: projectId,
      user_id: state.currentUser.id,
      date: new Date().toISOString().split('T')[0],
      phase: entry.phase || '',
      source: 'crisol',
      skill: entry.skill || 'gate',
      questions: entry.questions || [],
      key_question: entry.key_question || '',
      researcher_answer: entry.researcher_answer || '',
      insight: entry.insight || '',
      context_for_next: entry.context_for_next || '',
      iteration: entry.iteration || 1
    });
  } catch (e) { console.error('Socratic write error:', e); }
}

// --- Load alerts for a project ---
export async function loadDrAlerts(projectId) {
  if (!state.sdb || !state.currentUser) return [];
  try {
    const { data, error } = await state.sdb
      .from('dr_alerts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) { console.error('DR alerts load error:', error); return []; }
    return data || [];
  } catch (e) { console.error('DR alerts error:', e); return []; }
}

// --- Update wizard context (phase, scores, etc.) ---
export async function syncWizardContext(projectId, context) {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data: existing } = await state.sdb
      .from('dr_wizard_context')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', state.currentUser.id)
      .single();

    const payload = {
      project_id: projectId,
      user_id: state.currentUser.id,
      active_phase: context.active_phase || '',
      active_phase_name: context.active_phase_name || '',
      workflow_mode: context.workflow_mode || 'dr',
      gate_responses: context.gate_responses || {},
      socratic_responses: context.socratic_responses || {},
      last_scores: context.last_scores || {},
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await state.sdb.from('dr_wizard_context')
        .update(payload)
        .eq('id', existing.id);
    } else {
      await state.sdb.from('dr_wizard_context').insert(payload);
    }
  } catch (e) { console.error('Wizard context sync error:', e); }
}

// --- Resolve an alert ---
export async function resolveDrAlert(alertId) {
  if (!state.sdb) return;
  try {
    await state.sdb.from('dr_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);
  } catch (e) { console.error('Alert resolve error:', e); }
}

// ============================================================
// AUTO-BACKUP — Every 30 min if changes detected
// ============================================================

let backupTimer = null;
let lastBackupHash = '';

function computeHash(obj) {
  return JSON.stringify(obj).length.toString(); // Simple length-based change detection
}

export async function createFullBackup() {
  if (!state.sdb || !state.currentUser) return null;
  try {
    // Collect ALL data from Supabase
    const [projects, docs, socratic, alerts, context, userdata] = await Promise.all([
      state.sdb.from('projects').select('*').then(r => r.data || []),
      state.sdb.from('sila_docs').select('*').then(r => r.data || []),
      state.sdb.from('dr_socratic_log').select('*').then(r => r.data || []),
      state.sdb.from('dr_alerts').select('*').then(r => r.data || []),
      state.sdb.from('dr_wizard_context').select('*').then(r => r.data || []),
      state.sdb.from('sila_userdata').select('*').then(r => r.data || [])
    ]);

    const backup = {
      version: '3.2',
      created: new Date().toISOString(),
      user: state.currentUser.email,
      data: { projects, documents: docs, dr_socratic_log: socratic, dr_alerts: alerts, dr_wizard_context: context, sila_userdata: userdata }
    };

    return backup;
  } catch (e) {
    console.error('Backup creation error:', e);
    return null;
  }
}

export async function downloadBackup() {
  const backup = await createFullBackup();
  if (!backup) { if (window.showToast) showToast('Error al crear backup', 'error'); return; }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  a.download = 'CRISOL_backup_' + date + '.json';
  a.click();
  if (window.showToast) showToast('💾 Backup completo descargado (' + (blob.size / 1024).toFixed(0) + ' KB)', 'success');
}

async function autoBackupCheck() {
  if (!state.sdb || !state.currentUser) return;

  try {
    // Quick hash of projects to detect changes
    const { data } = await state.sdb.from('projects').select('updated_at').order('updated_at', { ascending: false }).limit(1);
    const currentHash = data && data[0] ? data[0].updated_at : '';

    if (currentHash === lastBackupHash) return; // No changes

    // Create backup
    const backup = await createFullBackup();
    if (!backup) return;

    // Save to Supabase dr_backups table (accumulate, don't overwrite)
    await state.sdb.from('dr_backups').insert({
      user_id: state.currentUser.id,
      backup_type: 'auto',
      data: backup,
      created_at: new Date().toISOString()
    });

    // Retention: delete backups older than 7 days
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await state.sdb.from('dr_backups')
      .delete()
      .eq('user_id', state.currentUser.id)
      .eq('backup_type', 'auto')
      .lt('created_at', cutoff);

    lastBackupHash = currentHash;
    console.log('Auto-backup saved (' + new Date().toLocaleTimeString() + ')');
  } catch (e) {
    // Silently fail — backup is not critical path
    console.error('Auto-backup error:', e);
  }
}

export function startAutoBackup() {
  if (backupTimer) clearInterval(backupTimer);
  // Run every 30 minutes
  backupTimer = setInterval(autoBackupCheck, 30 * 60 * 1000);
  // Also run once after 1 minute (first backup after login)
  setTimeout(autoBackupCheck, 60 * 1000);
  console.log('Auto-backup enabled (every 30 min)');
}

export function stopAutoBackup() {
  if (backupTimer) { clearInterval(backupTimer); backupTimer = null; }
}

// Full restore from backup JSON
export async function restoreFromBackup(backupJson) {
  if (!state.sdb || !state.currentUser) return false;
  try {
    const backup = typeof backupJson === 'string' ? JSON.parse(backupJson) : backupJson;
    if (!backup.data) { showToast('Archivo de backup inválido', 'error'); return false; }

    const d = backup.data;

    // Restore projects
    if (d.projects && d.projects.length > 0) {
      for (const p of d.projects) {
        await state.sdb.from('projects').upsert(p, { onConflict: 'id' });
      }
    }
    // Restore documents
    if (d.documents && d.documents.length > 0) {
      for (const doc of d.documents) {
        await state.sdb.from('sila_docs').upsert(doc, { onConflict: 'id' });
      }
    }
    // Restore socratic log
    if (d.dr_socratic_log && d.dr_socratic_log.length > 0) {
      for (const entry of d.dr_socratic_log) {
        await state.sdb.from('dr_socratic_log').upsert(entry, { onConflict: 'id' });
      }
    }

    showToast('✅ Backup restaurado exitosamente', 'success');
    return true;
  } catch (e) {
    console.error('Restore error:', e);
    showToast('Error al restaurar: ' + e.message, 'error');
    return false;
  }
}
