// ============================================================
// CRISOL — auth.js  (Authentication + Registration + Profile)
// ============================================================

import { state } from './state.js';
import { showToast, setSyncStatus, escH } from './utils.js';
window.showToast = showToast; // expose for inline onclick in invite modals
import './db.js'; // side-effect: initializes state.sdb

// ============================================================
// LOGIN
// ============================================================
export async function checkLogin() {
  if (!state.sdb) {
    showAuthError('Error: Supabase no disponible');
    return;
  }
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-pw').value;
  if (!email || !pw) { showAuthError('Ingresa email y contraseña'); return; }

  // Check if we're in register mode
  if (state.authMode === 'register') {
    await signUp(email, pw);
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Ingresando...'; btn.disabled = true;
  try {
    const { data, error } = await state.sdb.auth.signInWithPassword({ email, password: pw });
    if (error) {
      showAuthError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
      btn.textContent = 'Entrar'; btn.disabled = false;
      return;
    }
    state.currentUser = data.user;
    await enterApp();
  } catch (e) {
    showAuthError('Error de conexión. Verifica tu internet.');
    btn.textContent = 'Entrar'; btn.disabled = false;
  }
}

// ============================================================
// REGISTER
// ============================================================
// Invitation codes — generated dynamically on approval + stored in Supabase
// Legacy static codes still accepted for backward compat
const LEGACY_INVITE_CODES = ['CRISOL-2026', 'TALCA-MGT', 'DR-RESEARCH'];

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CR-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Admin email(s) — these users see the invite requests panel
const ADMIN_EMAILS = ['alejandro@chenriquez.cl'];

function isAdmin() {
  return state.currentUser && ADMIN_EMAILS.includes(state.currentUser.email);
}

// Load and show pending invite requests (admin only)
async function checkInviteRequests() {
  if (!isAdmin() || !state.sdb) return;
  try {
    const { data, error } = await state.sdb.from('invite_requests')
      .select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return;
    // Show badge on notification bell
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = data.length;
      badge.style.display = data.length > 0 ? 'block' : 'none';
    }
    // Store for rendering
    state._pendingInvites = data;
  } catch (e) { console.error('Invite check error:', e); }
}

window.showInviteRequests = async function() {
  // Load all requests (pending + history)
  let allRequests = [];
  if (state.sdb) {
    try {
      const { data } = await state.sdb.from('invite_requests')
        .select('*').order('created_at', { ascending: false });
      if (data) allRequests = data;
    } catch (e) {}
  }

  const pending = allRequests.filter(r => r.status === 'pending');
  const approved = allRequests.filter(r => r.status === 'approved');
  const rejected = allRequests.filter(r => r.status === 'rejected');
  state._pendingInvites = pending;

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  let html = '<div class="logbook-modal" style="max-width:600px;max-height:80vh;overflow-y:auto;">';
  html += '<h3 style="font-size:17px;">📨 Solicitudes de invitación</h3>';

  // Pending section
  if (pending.length > 0) {
    html += '<div style="font-size:13px;font-weight:600;color:var(--gold);margin:12px 0 6px;">Pendientes (' + pending.length + ')</div>';
    pending.forEach((req, i) => {
      const date = new Date(req.created_at).toLocaleDateString();
      html += '<div style="padding:12px;margin:6px 0;background:var(--bg2);border:1px solid rgba(232,168,56,0.2);border-radius:8px;">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div style="font-size:14px;font-weight:600;color:var(--tx);">' + escH(req.name || 'Sin nombre') + '</div>';
      html += '<span style="font-size:11px;color:var(--tx3);">' + date + '</span>';
      html += '</div>';
      html += '<div style="font-size:13px;color:var(--tx2);margin:4px 0;">' + escH(req.email || '') + '</div>';
      html += '<div style="font-size:12px;color:var(--tx3);">' + escH(req.institution || '') + ' · ' + escH(req.role || '') + '</div>';
      if (req.reason) html += '<div style="font-size:12px;color:var(--tx3);margin-top:4px;font-style:italic;">"' + escH(req.reason) + '"</div>';
      html += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;">';
      html += '<button onclick="approveInvite(\'' + req.id + '\',' + i + ')" style="padding:6px 16px;background:var(--green);color:#000;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">✅ Aprobar y generar código</button>';
      html += '<button onclick="rejectInvite(\'' + req.id + '\',' + i + ')" style="padding:6px 12px;background:var(--bg3);color:var(--tx3);border:none;border-radius:6px;font-size:12px;cursor:pointer;">Rechazar</button>';
      html += '</div>';
      html += '</div>';
    });
  } else {
    html += '<div style="font-size:13px;color:var(--tx3);padding:12px 0;">Sin solicitudes pendientes</div>';
  }

  // History section (approved + rejected)
  if (approved.length > 0 || rejected.length > 0) {
    html += '<details style="margin-top:16px;"><summary style="font-size:13px;font-weight:600;color:var(--tx3);cursor:pointer;">Historial (' + (approved.length + rejected.length) + ')</summary>';

    if (approved.length > 0) {
      html += '<div style="font-size:12px;font-weight:600;color:var(--green);margin:10px 0 4px;">✅ Aprobadas (' + approved.length + ')</div>';
      approved.forEach(req => {
        const date = new Date(req.created_at).toLocaleDateString();
        html += '<div style="padding:8px 12px;margin:3px 0;background:var(--bg2);border-radius:6px;border-left:3px solid var(--green);display:flex;justify-content:space-between;align-items:center;">';
        html += '<div><span style="font-size:13px;color:var(--tx);">' + escH(req.name || '') + '</span> <span style="font-size:12px;color:var(--tx3);">' + escH(req.email || '') + '</span></div>';
        html += '<span style="font-size:11px;color:var(--tx3);">' + date + '</span>';
        html += '</div>';
      });
    }

    if (rejected.length > 0) {
      html += '<div style="font-size:12px;font-weight:600;color:var(--red);margin:10px 0 4px;">✗ Rechazadas (' + rejected.length + ')</div>';
      rejected.forEach(req => {
        const date = new Date(req.created_at).toLocaleDateString();
        html += '<div style="padding:8px 12px;margin:3px 0;background:var(--bg2);border-radius:6px;border-left:3px solid var(--red);opacity:0.6;display:flex;justify-content:space-between;align-items:center;">';
        html += '<div><span style="font-size:13px;color:var(--tx);">' + escH(req.name || '') + '</span> <span style="font-size:12px;color:var(--tx3);">' + escH(req.email || '') + '</span></div>';
        html += '<span style="font-size:11px;color:var(--tx3);">' + date + '</span>';
        html += '</div>';
      });
    }

    html += '</details>';
  }

  html += '<div style="margin-top:12px;text-align:right;"><button onclick="this.closest(\'.proj-modal-overlay\').remove()" style="background:var(--bg3);color:var(--tx2);border:none;border-radius:6px;padding:8px 16px;cursor:pointer;">Cerrar</button></div>';
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
};

window.approveInvite = async function(id, idx) {
  if (!state.sdb) return;
  const req = state._pendingInvites ? state._pendingInvites[idx] : null;
  const code = generateInviteCode();
  const { data: upData, error } = await state.sdb.from('invite_requests').update({ status: 'approved', invite_code: code }).eq('id', id).select();
  console.log('approveInvite result:', { id, code, upData, error });
  if (error) { showToast('Error al aprobar: ' + error.message, 'error'); return; }
  if (!upData || upData.length === 0) { showToast('No se pudo actualizar — revisa permisos RLS en Supabase', 'error'); return; }
  // Remove from local pending list and update badge
  if (state._pendingInvites) state._pendingInvites.splice(idx, 1);
  const badge = document.getElementById('notif-badge');
  if (badge) {
    const remaining = (state._pendingInvites ? state._pendingInvites.length : 0);
    badge.textContent = remaining;
    badge.style.display = remaining > 0 ? 'block' : 'none';
  }
  document.querySelector('.proj-modal-overlay')?.remove();

  // Show approved details for copying
  if (req) {
    const msg = 'Para: ' + req.email + '\n\nHola ' + req.name + ',\n\nTu solicitud de acceso a CRISOL fue aprobada.\n\nTu código de invitación es: ' + code + '\n\nIngresa a https://crisol-psi.vercel.app, haz click en "Crear cuenta", e ingresa el código.\n\nBienvenido/a.\nAlejandro Rudloff';
    const overlay2 = document.createElement('div');
    overlay2.className = 'proj-modal-overlay';
    overlay2.onclick = function(e) { if (e.target === overlay2) overlay2.remove(); };
    let h2 = '<div class="logbook-modal" style="max-width:500px;">';
    h2 += '<h3 style="font-size:17px;color:var(--green);">✅ Solicitud aprobada</h3>';
    h2 += '<div style="font-size:13px;color:var(--tx2);margin-bottom:8px;"><strong>' + req.name + '</strong> · ' + req.email + '</div>';
    h2 += '<div style="font-size:12px;color:var(--tx3);margin-bottom:12px;">' + req.institution + ' · ' + req.role + '</div>';
    h2 += '<label style="font-size:12px;color:var(--gold);">Mensaje para enviar (click para copiar):</label>';
    h2 += '<div onclick="navigator.clipboard.writeText(this.dataset.msg);this.style.borderColor=\'var(--green)\';if(window.showToast)window.showToast(\'Mensaje copiado\',\'success\')" data-msg="' + msg.replace(/"/g, '&quot;') + '" style="padding:12px;background:var(--bg);border:2px solid rgba(155,125,207,0.3);border-radius:8px;font-size:13px;color:var(--tx);white-space:pre-wrap;cursor:pointer;line-height:1.6;margin-bottom:12px;">' + msg.replace(/\n/g, '<br>') + '</div>';
    h2 += '<div style="text-align:right;"><button onclick="this.closest(\'.proj-modal-overlay\').remove()" style="background:var(--green);color:#000;border:none;border-radius:6px;padding:8px 20px;font-weight:600;cursor:pointer;">Listo</button></div>';
    h2 += '</div>';
    overlay2.innerHTML = h2;
    document.body.appendChild(overlay2);
  } else {
    showToast('✅ Solicitud aprobada', 'success');
  }
};

window.rejectInvite = async function(id, idx) {
  if (!state.sdb) return;
  const { error } = await state.sdb.from('invite_requests').update({ status: 'rejected' }).eq('id', id);
  if (error) { showToast('Error al rechazar: ' + error.message, 'error'); return; }
  if (state._pendingInvites) state._pendingInvites.splice(idx, 1);
  const badge = document.getElementById('notif-badge');
  if (badge) {
    const remaining = (state._pendingInvites ? state._pendingInvites.length : 0);
    badge.textContent = remaining;
    badge.style.display = remaining > 0 ? 'block' : 'none';
  }
  document.querySelector('.proj-modal-overlay')?.remove();
  showToast('Solicitud rechazada', 'info');
  if (state._pendingInvites && state._pendingInvites.length > 0) showInviteRequests();
};

// Submit invitation request to Supabase
window.submitInviteRequest = async function() {
  const name = document.getElementById('req-name')?.value?.trim();
  const email = document.getElementById('req-email')?.value?.trim();
  const institution = document.getElementById('req-institution')?.value?.trim();
  const role = document.getElementById('req-role')?.value;
  const reason = document.getElementById('req-reason')?.value?.trim();
  const statusEl = document.getElementById('req-status');

  if (!name || !email || !institution || !role) {
    if (statusEl) { statusEl.textContent = 'Completa todos los campos obligatorios'; statusEl.style.color = 'var(--red)'; statusEl.style.display = 'block'; }
    return;
  }

  if (statusEl) { statusEl.textContent = 'Enviando solicitud...'; statusEl.style.color = 'var(--tx3)'; statusEl.style.display = 'block'; }

  try {
    if (state.sdb) {
      await state.sdb.from('invite_requests').insert({
        name, email, institution, role, reason,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
    if (statusEl) {
      statusEl.innerHTML = '&#10003; Solicitud enviada. Recibir&aacute;s tu c&oacute;digo por email cuando sea aprobada.';
      statusEl.style.color = 'var(--green)';
    }
    // Disable form
    document.querySelectorAll('#invite-request-form input, #invite-request-form select, #invite-request-form textarea, #invite-request-form button').forEach(el => el.disabled = true);
  } catch (e) {
    if (statusEl) { statusEl.textContent = 'Error al enviar. Intenta de nuevo.'; statusEl.style.color = 'var(--red)'; }
  }
};

async function signUp(email, pw) {
  // Validate invitation code (legacy static OR dynamic from Supabase)
  const inviteCode = (document.getElementById('invite-code')?.value || '').trim().toUpperCase();
  let codeValid = LEGACY_INVITE_CODES.includes(inviteCode);
  if (!codeValid && state.sdb) {
    try {
      const { data } = await state.sdb.from('invite_requests')
        .select('id').eq('invite_code', inviteCode).eq('status', 'approved').limit(1);
      if (data && data.length > 0) codeValid = true;
    } catch (e) {}
  }
  if (!codeValid) {
    showAuthError('Código de invitación inválido. Solicita uno a un investigador activo.');
    const codeInput = document.getElementById('invite-code');
    if (codeInput) { codeInput.style.borderColor = 'var(--red)'; codeInput.focus(); }
    return;
  }
  if (pw.length < 6) { showAuthError('La contraseña debe tener al menos 6 caracteres'); return; }

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Creando cuenta...'; btn.disabled = true;
  let data, error;
  try {
    ({ data, error } = await state.sdb.auth.signUp({ email, password: pw }));
  } catch (e) {
    showAuthError('Error de conexión. Verifica tu internet.');
    btn.textContent = 'Crear cuenta'; btn.disabled = false;
    return;
  }
  if (error) {
    showAuthError(error.message);
    btn.textContent = 'Crear cuenta'; btn.disabled = false;
    return;
  }

  // Some Supabase configs require email confirmation
  if (data.user && !data.session) {
    showAuthError('Revisa tu email para confirmar la cuenta.');
    btn.textContent = 'Crear cuenta'; btn.disabled = false;
    return;
  }

  state.currentUser = data.user;
  await enterApp();
}

// ============================================================
// TOGGLE LOGIN / REGISTER MODE
// ============================================================
export function toggleAuthMode() {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  const btn = document.getElementById('login-btn');
  const toggle = document.getElementById('auth-toggle');
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.style.display = 'none';

  const inviteRow = document.getElementById('invite-code-row');
  if (state.authMode === 'register') {
    btn.textContent = 'Crear cuenta';
    if (toggle) toggle.textContent = 'Ya tengo cuenta';
    if (inviteRow) inviteRow.style.display = 'block';
  } else {
    btn.textContent = 'Entrar';
    if (toggle) toggle.textContent = 'Crear cuenta';
    if (inviteRow) inviteRow.style.display = 'none';
  }
}
window.toggleAuthMode = toggleAuthMode;

// ============================================================
// ENTER APP — check profile, then show main or profile screen
// ============================================================
async function enterApp() {
  document.getElementById('login-screen').style.display = 'none';

  // Load profile from Supabase
  const profileComplete = await checkProfileComplete();

  // Hide landing page if still visible
  const landingEl = document.getElementById('landing-page');
  if (landingEl) landingEl.style.display = 'none';

  if (profileComplete) {
    document.getElementById('profile-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'grid';
    // Show quick capture button after login
    const qcBtn = document.getElementById('qc-btn');
    if (qcBtn) qcBtn.style.display = 'flex';

    // Check for pending invitation in URL (?invite=TOKEN)
    try {
      const { checkPendingInvitation } = await import('./projects.js');
      if (checkPendingInvitation) await checkPendingInvitation();
    } catch (e) { console.error('Invitation check error:', e); }

    // Check for pending invite requests (admin only)
    checkInviteRequests();
    // Start auto-backup (every 30 min if changes)
    try {
      const { startAutoBackup } = await import('./sync.js');
      if (startAutoBackup) startAutoBackup();
    } catch (e) {}
    // Show admin button if admin
    const adminBtn = document.getElementById('admin-invites-btn');
    if (adminBtn && isAdmin()) adminBtn.style.display = 'block';
  } else {
    // Show profile completion screen
    document.getElementById('profile-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('profile-name').focus();
  }
}

// ============================================================
// CHECK PROFILE COMPLETE
// ============================================================
async function checkProfileComplete() {
  if (!state.sdb || !state.currentUser) return false;
  try {
    const { data, error } = await state.sdb
      .from('profiles')
      .select('*')
      .eq('id', state.currentUser.id)
      .single();

    if (error || !data) return false;

    state.profile = data;
    return data.display_name && data.display_name.trim().length > 0;
  } catch (e) {
    console.error('Profile check error:', e);
    return false;
  }
}

// ============================================================
// SAVE PROFILE
// ============================================================
export async function saveProfile() {
  const name = document.getElementById('profile-name').value.trim();
  if (!name) {
    const errEl = document.getElementById('profile-error');
    if (errEl) { errEl.textContent = 'El nombre es obligatorio'; errEl.style.display = 'block'; }
    return;
  }

  const institution = document.getElementById('profile-institution').value.trim();
  const area = document.getElementById('profile-area').value.trim();

  const btn = document.getElementById('profile-btn');
  btn.textContent = 'Guardando...'; btn.disabled = true;

  const { error } = await state.sdb
    .from('profiles')
    .upsert({
      id: state.currentUser.id,
      display_name: name,
      institution: institution || null,
      research_area: area || null
    });

  if (error) {
    const errEl = document.getElementById('profile-error');
    if (errEl) { errEl.textContent = 'Error: ' + error.message; errEl.style.display = 'block'; }
    btn.textContent = 'Comenzar'; btn.disabled = false;
    return;
  }

  state.profile = { id: state.currentUser.id, display_name: name, institution, research_area: area };

  // Hide profile screen, show main app
  document.getElementById('profile-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'grid';
  // Show quick capture button
  const qcBtn = document.getElementById('qc-btn');
  if (qcBtn) qcBtn.style.display = 'flex';
}
window.saveProfile = saveProfile;

// ============================================================
// LOGOUT
// ============================================================
export async function logout() {
  if (state._cleanupNotifications) state._cleanupNotifications();
  if (state.sdb) await state.sdb.auth.signOut();
  state.currentUser = null;
  state.profile = null;
  state.authMode = 'login';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('profile-screen').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  // Hide quick capture and show landing on logout
  const qcBtn = document.getElementById('qc-btn');
  if (qcBtn) qcBtn.style.display = 'none';
  const landingEl = document.getElementById('landing-page');
  if (landingEl) landingEl.style.display = '';
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pw').value = '';
  document.getElementById('login-error').style.display = 'none';
  const btn = document.getElementById('login-btn');
  if (btn) { btn.textContent = 'Entrar'; btn.disabled = false; }
}

// ============================================================
// AUTO-LOGIN
// ============================================================
(async function autoLogin() {
  if (!state.sdb) return;
  try {
    const { data } = await state.sdb.auth.getSession();
    if (data.session) {
      state.currentUser = data.session.user;
      await enterApp();
    }
  } catch (e) { console.error('Auto-login error:', e); }
})();

// ============================================================
// AUTH STATE CHANGE LISTENER
// ============================================================
if (state.sdb) {
  state.sdb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      state.currentUser = null;
      state.profile = null;
      document.getElementById('main-app').style.display = 'none';
      document.getElementById('profile-screen').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      setSyncStatus('Sesion expirada', 'var(--red)');
    } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
      state.currentUser = session.user;
      console.log('Auth: ' + event);
    }
  });
}

// ============================================================
// HELPERS
// ============================================================
function showAuthError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// --- Expose to HTML onclick handlers ---
window.checkLogin = checkLogin;
window.logout = logout;
