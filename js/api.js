// ============================================================
// CRISOL — api.js (Centralized Supabase API layer)
// All database operations go through this module.
// Sprint 12: Single point of contact with Supabase
// ============================================================

import { state } from './state.js';

// --- Helpers ---
function sdb() { return state.sdb; }
function uid() { return state.currentUser?.id; }
function ready() { return !!(sdb() && uid()); }

// Wrap a Supabase call with timing
async function timed(label, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = (performance.now() - start).toFixed(0);
    if (ms > 2000) console.warn(`Slow query: ${label} (${ms}ms)`);
    return result;
  } catch (e) {
    console.error(`API ${label} error:`, e);
    throw e;
  }
}

// ============================================================
// PROJECTS
// ============================================================

export const projects = {
  async getAll() {
    if (!ready()) return [];
    return timed('projects.getAll', async () => {
      const { data, error } = await sdb().from('projects')
        .select('*, project_members(role, user_id)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    });
  },

  async save(id, title, description, metadata) {
    if (!ready()) return;
    return timed('projects.save', () =>
      sdb().from('projects').update({ title, description, metadata, updated_at: new Date().toISOString() }).eq('id', id)
    );
  },

  async create(title, description, metadata) {
    if (!ready()) return null;
    return timed('projects.create', async () => {
      const newId = crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
      const { error } = await sdb().from('projects').insert({ id: newId, title, description, owner_id: uid(), metadata });
      if (error) throw error;
      await sdb().from('project_members').insert({ project_id: newId, user_id: uid(), role: 'owner' });
      return newId;
    });
  },

  async remove(id) {
    if (!ready()) return;
    return timed('projects.remove', () => sdb().from('projects').delete().eq('id', id));
  },

  async getUpdatedAt(id) {
    if (!ready()) return null;
    const { data } = await sdb().from('projects').select('updated_at').eq('id', id).single();
    return data?.updated_at;
  }
};

// ============================================================
// MEMBERS
// ============================================================

export const members = {
  async getForProject(projectId) {
    if (!ready()) return [];
    return timed('members.getForProject', async () => {
      const { data, error } = await sdb().from('project_members')
        .select('role, user_id, joined_at, profiles(display_name, institution)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    });
  },

  async add(projectId, userId, role) {
    if (!ready()) return;
    return timed('members.add', () =>
      sdb().from('project_members').insert({ project_id: projectId, user_id: userId, role })
    );
  },

  async remove(projectId, userId) {
    if (!ready()) return;
    return timed('members.remove', () =>
      sdb().from('project_members').delete().eq('project_id', projectId).eq('user_id', userId)
    );
  }
};

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = {
  async getForUser(limit = 20) {
    if (!ready()) return [];
    return timed('notifications.getForUser', async () => {
      const { data, error } = await sdb().from('notifications')
        .select('*').eq('user_id', uid())
        .order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    });
  },

  async markRead(notifId) {
    if (!ready()) return;
    return sdb().from('notifications').update({ read: true }).eq('id', notifId);
  },

  async markAllRead() {
    if (!ready()) return;
    return sdb().from('notifications').update({ read: true }).eq('user_id', uid()).eq('read', false);
  },

  async send(userId, type, title, body, refId, refType) {
    if (!sdb()) return;
    return sdb().from('notifications').insert({
      user_id: userId, type, title, body,
      reference_id: refId, reference_type: refType
    });
  }
};

// ============================================================
// PROFILES
// ============================================================

export const profiles = {
  async get(userId) {
    if (!sdb()) return null;
    const { data } = await sdb().from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  async getAll() {
    if (!sdb()) return [];
    const { data } = await sdb().from('profiles').select('id, display_name, institution, research_area, created_at');
    return data || [];
  },

  async update(userId, fields) {
    if (!sdb()) return;
    return sdb().from('profiles').upsert({ id: userId, ...fields }, { onConflict: 'id' });
  }
};

// ============================================================
// INVITE REQUESTS
// ============================================================

export const inviteRequests = {
  async getPending() {
    if (!sdb()) return [];
    const { data } = await sdb().from('invite_requests')
      .select('*').eq('status', 'pending').order('created_at', { ascending: false });
    return data || [];
  },

  async getAll() {
    if (!sdb()) return [];
    const { data } = await sdb().from('invite_requests')
      .select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async approve(id, inviteCode) {
    return sdb().from('invite_requests').update({ status: 'approved', invite_code: inviteCode }).eq('id', id).select();
  },

  async reject(id) {
    return sdb().from('invite_requests').update({ status: 'rejected' }).eq('id', id);
  },

  async submit(record) {
    return sdb().from('invite_requests').insert({ ...record, status: 'pending', created_at: new Date().toISOString() });
  },

  async validateCode(code) {
    const { data } = await sdb().from('invite_requests')
      .select('id').eq('invite_code', code).eq('status', 'approved').limit(1);
    return data && data.length > 0;
  }
};

// ============================================================
// ADMINS
// ============================================================

export const admins = {
  async isAdmin(email) {
    if (!sdb()) return false;
    const { data } = await sdb().from('admins').select('email').eq('email', email).maybeSingle();
    return !!data;
  }
};

// ============================================================
// LOGGING
// ============================================================

export const logging = {
  async error(message, stack, url) {
    if (!sdb()) return;
    sdb().from('error_log').insert({
      user_id: uid(),
      message: (message || '').substring(0, 500),
      stack: (stack || '').substring(0, 2000),
      url: (url || '').substring(0, 200)
    }).then(() => {}).catch(() => {});
  },

  async audit(action, targetType, targetId, detail) {
    if (!sdb()) return;
    sdb().from('audit_log').insert({
      user_id: uid(), action,
      target_type: targetType,
      target_id: targetId,
      detail: (detail || '').substring(0, 500)
    }).then(() => {}).catch(() => {});
  }
};
