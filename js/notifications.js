// ============================================================
// CRISOL — notifications.js  (In-app notification system)
// ============================================================

import { state } from './state.js';
import { escH } from './utils.js';

let _notifications = [];
let _pollTimer = null;

// --- Load notifications from Supabase ---
export async function loadNotifications() {
  if (!state.sdb || !state.currentUser) return;
  try {
    const { data, error } = await state.sdb
      .from('notifications')
      .select('*')
      .eq('user_id', state.currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    _notifications = data || [];
    updateBadge();
  } catch (e) {
    console.error('loadNotifications error:', e);
  }
}

// --- Update badge count ---
function updateBadge() {
  const unread = _notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? '' : 'none';
  }
  // Also update button style
  const btn = document.getElementById('notif-btn');
  if (btn) btn.style.color = unread > 0 ? 'var(--gold)' : '';
}

// --- Toggle notification panel ---
function toggleNotifications() {
  let panel = document.getElementById('notif-panel');
  if (panel) { panel.remove(); return; }

  panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.style.cssText = 'position:fixed;bottom:60px;left:16px;width:320px;max-height:400px;overflow-y:auto;background:var(--bg2);border:1px solid rgba(220,215,205,0.12);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.4);z-index:1000;padding:12px;';

  let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  h += '<span style="font-size:14px;font-weight:600;color:#fff;">Notificaciones</span>';
  if (_notifications.some(n => !n.read)) {
    h += '<span onclick="markAllRead()" style="font-size:12px;color:var(--blue);cursor:pointer;">Marcar leídas</span>';
  }
  h += '</div>';

  if (_notifications.length === 0) {
    h += '<div style="padding:20px;text-align:center;color:var(--tx3);font-size:13px;">Sin notificaciones</div>';
  } else {
    _notifications.forEach(n => {
      const time = new Date(n.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' });
      const unreadDot = n.read ? '' : '<span style="width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0;"></span>';
      const safeId = (n.id||'').replace(/'/g,'');
      const safeRefType = (n.reference_type||'').replace(/'/g,'');
      const safeRefId = (n.reference_id||'').replace(/'/g,'');
      h += `<div onclick="handleNotifClick('${safeId}','${safeRefType}','${safeRefId}')" style="display:flex;gap:8px;align-items:flex-start;padding:8px;border-radius:6px;cursor:pointer;transition:background 0.1s;${n.read ? 'opacity:0.6;' : ''}" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">`;
      h += unreadDot;
      h += `<div style="flex:1;min-width:0;">`;
      h += `<div style="font-size:13px;color:var(--tx);font-weight:${n.read ? '400' : '600'};">${escH(n.title)}</div>`;
      if (n.body) h += `<div style="font-size:12px;color:var(--tx2);margin-top:2px;">${escH(n.body)}</div>`;
      h += `<div style="font-size:11px;color:var(--tx3);margin-top:3px;">${time}</div>`;
      h += `</div></div>`;
    });
  }

  panel.innerHTML = h;
  document.body.appendChild(panel);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function _close(e) {
      if (!panel.contains(e.target) && e.target.id !== 'notif-btn') {
        panel.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 100);
}

// --- Mark single notification as read ---
async function markAsRead(notifId) {
  const n = _notifications.find(x => x.id === notifId);
  if (n) n.read = true;
  updateBadge();
  if (state.sdb) {
    await state.sdb.from('notifications').update({ read: true }).eq('id', notifId);
  }
}

// --- Mark all as read ---
async function markAllRead() {
  _notifications.forEach(n => n.read = true);
  updateBadge();
  const panel = document.getElementById('notif-panel');
  if (panel) panel.remove();
  if (state.sdb && state.currentUser) {
    await state.sdb.from('notifications').update({ read: true }).eq('user_id', state.currentUser.id).eq('read', false);
  }
}

// --- Handle notification click ---
function handleNotifClick(notifId, refType, refId) {
  markAsRead(notifId);
  const panel = document.getElementById('notif-panel');
  if (panel) panel.remove();
  if (refType === 'project' && refId && window.goToProject) {
    window.goToProject(refId);
  }
}

// --- Start polling (every 60s) ---
export function startNotificationPolling() {
  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(loadNotifications, 60000);
}

export function stopNotificationPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

// --- Cleanup on logout ---
export function cleanup() {
  stopNotificationPolling();
  _notifications = [];
  updateBadge();
}

// --- Window globals ---
window.toggleNotifications = toggleNotifications;
window.markAllRead = markAllRead;
window.handleNotifClick = handleNotifClick;
