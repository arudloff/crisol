// ============================================================
// CRISOL — auth.js  (Authentication + Registration + Profile)
// ============================================================

import { state } from './state.js';
import './db.js'; // side-effect: initializes state.sdb
import { setSyncStatus } from './utils.js';

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
// Invitation codes — add codes here to allow new registrations
const VALID_INVITE_CODES = ['CRISOL-2026', 'TALCA-MGT', 'DR-RESEARCH'];

async function signUp(email, pw) {
  // Validate invitation code
  const inviteCode = (document.getElementById('invite-code')?.value || '').trim().toUpperCase();
  if (!VALID_INVITE_CODES.includes(inviteCode)) {
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
