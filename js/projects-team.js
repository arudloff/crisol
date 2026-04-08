// ============================================================
// CRISOL — projects-team.js
// Team members, invitations, and collaboration features
// Extracted from projects.js for maintainability
// ============================================================

import { state } from './state.js';
import { showToast, escH } from './utils.js';
import { getProjects, loadProjects } from './projects-core.js';

// ============================================================
// TEAM DASHBOARD — shows all members with their phase progress
// ============================================================

export async function loadTeamDashboard(projectId) {
  const area = document.getElementById('proj-team-dashboard');
  if (!area || !state.sdb || !state.currentUser) return;

  const members = await loadProjectMembers(projectId);
  if (members.length <= 1) return;

  let phaseData = [];
  try {
    const { data } = await state.sdb
      .from('user_project_phase')
      .select('user_id, current_phase, phases, gate_records')
      .eq('project_id', projectId);
    phaseData = data || [];
  } catch (e) { console.error('Load phase data error:', e); }

  const PHASE_IDS = ['ideacion', 'fundamentacion', 'diseno', 'escritura', 'revision', 'submission', 'peer_review', 'respuesta', 'publicacion'];
  const PHASE_SHORT = ['Idea', 'Fund.', 'Diseño', 'Escrit.', 'Rev.', 'Sub.', 'Review', 'Resp.', 'Pub.'];
  const ROLE_COLORS = { owner: 'var(--gold)', coauthor: 'var(--blue)', reviewer: 'var(--green)', reader: 'var(--tx3)' };

  let h = '<div style="margin:16px 0 8px;">';
  h += '<div style="font-size:15px;font-weight:700;color:var(--tx);margin-bottom:8px;">👥 Equipo</div>';
  h += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';

  h += '<tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid var(--bg3);color:var(--tx2);min-width:140px;">Miembro</th>';
  PHASE_SHORT.forEach(p => {
    h += `<th style="padding:6px 3px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;font-size:10px;min-width:40px;">${p}</th>`;
  });
  h += '<th style="padding:6px;border-bottom:2px solid var(--bg3);color:var(--tx3);text-align:center;">Gates</th></tr>';

  members.forEach(m => {
    const name = m.profiles?.display_name || 'Sin nombre';
    const isMe = m.user_id === state.currentUser.id;
    const color = ROLE_COLORS[m.role] || 'var(--tx3)';
    const pd = phaseData.find(p => p.user_id === m.user_id);
    const phases = pd?.phases || [];
    const gateCount = (pd?.gate_records || []).filter(g => !g.skipped).length;

    h += `<tr style="border-bottom:1px solid var(--bg3);">`;
    h += `<td style="padding:6px 10px;"><span style="color:${isMe ? '#fff' : 'var(--tx)'};">${name}${isMe ? ' (tú)' : ''}</span> <span style="font-size:10px;color:${color};">${m.role}</span></td>`;

    PHASE_IDS.forEach(pid => {
      const fase = phases.find(f => f.id === pid);
      const estado = fase ? fase.estado : 'pendiente';
      const icon = estado === 'completado' ? '✅' : estado === 'en_progreso' ? '🔵' : estado === 'no_aplica' ? '⚪' : '○';
      h += `<td style="text-align:center;padding:6px 3px;font-size:11px;">${icon}</td>`;
    });

    h += `<td style="text-align:center;padding:6px;font-size:12px;color:var(--green);">${gateCount > 0 ? gateCount + ' ✓' : '—'}</td>`;
    h += '</tr>';
  });

  h += '</table></div></div>';
  area.innerHTML = h;
}

// ============================================================
// TEAM MEMBERS
// ============================================================

export async function loadProjectMembers(projectId) {
  if (!state.sdb || !state.currentUser) return [];
  try {
    const { data, error } = await state.sdb
      .from('project_members')
      .select('role, user_id, joined_at, profiles(display_name, institution)')
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadProjectMembers error:', e);
    return [];
  }
}

// ============================================================
// INVITATIONS
// ============================================================

async function createInvitation(projectId, role) {
  if (!state.sdb || !state.currentUser) return null;
  try {
    const { data, error } = await state.sdb
      .from('project_invitations')
      .insert({ project_id: projectId, invited_by: state.currentUser.id, role: role })
      .select('token')
      .single();
    if (error) throw error;
    return window.location.origin + window.location.pathname + '?invite=' + data.token;
  } catch (e) {
    console.error('Create invitation error:', e);
    showToast('Error al crear invitación', 'error');
    return null;
  }
}

export function showInviteModal(projId) {
  const proj = getProjects().find(p => p.id === projId);
  if (!proj) return;

  const overlay = document.createElement('div');
  overlay.className = 'proj-modal-overlay';
  overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };

  let html = `<div class="proj-modal" style="max-width:480px;">`;
  html += `<h3>Invitar a "${escH(proj.nombre)}"</h3>`;

  html += `<div style="margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:8px;">`;
  html += `<div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:8px;">Agregar por email</div>`;
  html += `<div style="display:flex;gap:6px;">`;
  html += `<input id="invite-email" type="email" placeholder="email@ejemplo.com" style="flex:1;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:14px;">`;
  html += `<select id="invite-email-role" style="padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;">`;
  html += `<option value="reviewer">Reviewer (ve y comenta)</option><option value="reader">Lector (ve y puede clonar)</option>`;
  html += `</select>`;
  html += `</div>`;
  html += `<button onclick="addMemberByEmail('${projId}')" id="invite-email-btn" class="btn bg" style="width:100%;margin-top:8px;">Agregar</button>`;
  html += `<p id="invite-email-msg" style="font-size:12px;margin-top:6px;display:none;"></p>`;
  html += `</div>`;

  html += `<div style="padding:14px;background:var(--bg3);border-radius:8px;">`;
  html += `<div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:8px;">Generar link de invitación</div>`;
  html += `<div style="display:flex;gap:6px;align-items:center;">`;
  html += `<select id="invite-role" style="flex:1;padding:8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--tx);font-family:'Inter',sans-serif;font-size:13px;">`;
  html += `<option value="reviewer">Reviewer (ve y comenta)</option><option value="reader">Lector (ve y puede clonar)</option>`;
  html += `</select>`;
  html += `<button id="invite-gen-btn" onclick="generateInviteLink('${projId}')" class="btn bo" style="white-space:nowrap;">Generar link</button>`;
  html += `</div>`;
  html += `<div id="invite-link-area" style="margin-top:10px;display:none;">`;
  html += `<div style="padding:12px;background:rgba(93,187,138,0.06);border:1px solid rgba(93,187,138,0.2);border-radius:8px;">`;
  html += `<div style="font-size:13px;font-weight:600;color:var(--green);margin-bottom:10px;">✅ Link generado — completa estos pasos:</div>`;
  html += `<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:6px;">`;
  html += `<input type="checkbox" id="invite-check-drive" style="margin-top:3px;accent-color:var(--green);">`;
  html += `<div style="flex:1;">`;
  html += `<div style="font-size:13px;color:var(--tx);font-weight:600;">Compartir carpeta de fuentes en Google Drive</div>`;
  html += `<div style="font-size:12px;color:var(--tx3);margin-top:2px;">Comparte la carpeta de PDFs y documentos del proyecto con el invitado en modo <b>lector</b>.</div>`;
  html += `<a href="https://drive.google.com" target="_blank" style="font-size:12px;color:var(--blue);text-decoration:underline;margin-top:4px;display:inline-block;">Abrir Google Drive →</a>`;
  html += `</div></div>`;
  html += `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px;background:var(--bg2);border-radius:6px;">`;
  html += `<input type="checkbox" id="invite-check-link" style="margin-top:3px;accent-color:var(--green);">`;
  html += `<div style="flex:1;">`;
  html += `<div style="font-size:13px;color:var(--tx);font-weight:600;">Copiar y enviar el link de invitación</div>`;
  html += `<div style="display:flex;gap:6px;margin-top:6px;">`;
  html += `<input id="invite-link" readonly style="flex:1;padding:6px 8px;background:var(--bg);border:1px solid rgba(220,215,205,0.1);border-radius:6px;color:var(--green);font-family:monospace;font-size:11px;">`;
  html += `<button onclick="navigator.clipboard.writeText(document.getElementById('invite-link').value);this.textContent='✓ Copiado';document.getElementById('invite-check-link').checked=true;setTimeout(()=>this.textContent='Copiar',2000)" class="btn bg" style="white-space:nowrap;font-size:12px;">Copiar</button>`;
  html += `</div>`;
  html += `<div style="font-size:11px;color:var(--tx3);margin-top:4px;">Expira en 7 días. Funciona para usuarios nuevos y existentes.</div>`;
  html += `</div></div>`;
  html += `</div>`;
  html += `</div></div>`;

  html += `<div class="proj-modal-actions" style="margin-top:14px;">`;
  html += `<button class="proj-btn-cancel" onclick="this.closest('.proj-modal-overlay').remove()">Cerrar</button>`;
  html += `</div></div>`;

  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('invite-email')?.focus();
}

async function addMemberByEmail(projId) {
  const email = document.getElementById('invite-email')?.value.trim();
  const role = document.getElementById('invite-email-role')?.value || 'coauthor';
  const btn = document.getElementById('invite-email-btn');
  if (!email) { showInviteMsg('Ingresa un email', 'var(--red)'); return; }
  if (!state.sdb || !state.currentUser) return;

  btn.textContent = 'Buscando...'; btn.disabled = true;

  try {
    const { data: profile, error } = await state.sdb
      .from('profiles')
      .select('id, display_name')
      .eq('id', (await findUserByEmail(email)))
      .single();

    if (error || !profile) {
      showInviteMsg('Usuario no encontrado. Usa el link de invitación.', 'var(--gold)');
      btn.textContent = 'Agregar'; btn.disabled = false;
      return;
    }

    const { data: existing } = await state.sdb
      .from('project_members')
      .select('id')
      .eq('project_id', projId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existing) {
      showInviteMsg('Este usuario ya es miembro del proyecto.', 'var(--gold)');
      btn.textContent = 'Agregar'; btn.disabled = false;
      return;
    }

    const { error: insertErr } = await state.sdb.from('project_members').insert({
      project_id: projId,
      user_id: profile.id,
      role: role
    });

    if (insertErr) throw insertErr;

    showInviteMsg(`✅ ${profile.display_name || email} agregado como ${role}. Recuerda compartir la carpeta de Google Drive con ${email} en modo lector.`, 'var(--green)');
    btn.textContent = 'Agregar'; btn.disabled = false;
    document.getElementById('invite-email').value = '';

    await state.sdb.from('notifications').insert({
      user_id: profile.id,
      type: 'added_to_project',
      title: 'Te agregaron a un proyecto',
      body: (state.profile?.display_name || 'Alguien') + ' te agregó a "' + (getProjects().find(p => p.id === projId)?.nombre || 'proyecto') + '" como ' + role,
      reference_id: projId,
      reference_type: 'project'
    });

  } catch (e) {
    showInviteMsg('Error: ' + e.message, 'var(--red)');
    btn.textContent = 'Agregar'; btn.disabled = false;
  }
}

async function findUserByEmail(email) {
  if (!state.sdb) return null;
  try {
    const { data, error } = await state.sdb.rpc('find_user_by_email', { user_email: email });
    return data || null;
  } catch (e) { return null; }
}

function showInviteMsg(msg, color) {
  const el = document.getElementById('invite-email-msg');
  if (el) { el.textContent = msg; el.style.color = color; el.style.display = 'block'; }
}

async function generateInviteLink(projId) {
  const role = document.getElementById('invite-role')?.value || 'coauthor';
  const btn = document.getElementById('invite-gen-btn');
  if (btn) { btn.textContent = 'Generando...'; btn.disabled = true; }

  const link = await createInvitation(projId, role);
  if (link) {
    document.getElementById('invite-link').value = link;
    document.getElementById('invite-link-area').style.display = '';
    if (btn) { btn.textContent = 'Generar link'; btn.disabled = false; }
    showToast('Link generado', 'success', 2000);
  } else {
    if (btn) { btn.textContent = 'Generar link'; btn.disabled = false; }
  }
}

export async function checkPendingInvitation() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('invite');
  if (!token || !state.sdb || !state.currentUser) return;

  window.history.replaceState({}, '', window.location.pathname);
  showToast('Procesando invitación...', 'info', 2000);

  try {
    const { data, error } = await state.sdb.rpc('accept_invitation', { invite_token: token });
    if (error) throw error;

    if (data?.success) {
      showToast(`Te uniste a "${data.project_title}" como ${data.role}`, 'success', 4000);
      await loadProjects();
      if (state._buildProjectSidebar) state._buildProjectSidebar();
      if (state._goToProject) state._goToProject(data.project_id);
    } else {
      showToast(data?.error || 'Invitación no válida', 'error', 4000);
    }
  } catch (e) {
    console.error('Accept invitation error:', e);
    showToast('Error al aceptar invitación', 'error');
  }
}

// ============================================================
// ACTIVITY FEED — recent activity in shared project
// ============================================================

export async function loadActivityFeed(projectId) {
  const area = document.getElementById('proj-activity-feed');
  if (!area || !state.sdb || !state.currentUser) return;

  try {
    const { data } = await state.sdb
      .from('notifications')
      .select('title, body, created_at')
      .eq('reference_id', projectId)
      .eq('reference_type', 'project')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) return;

    let h = '<div style="margin:12px 0;">';
    h += '<details><summary style="font-size:13px;font-weight:600;color:var(--tx3);cursor:pointer;">Actividad reciente (' + data.length + ')</summary>';
    h += '<div style="margin-top:6px;">';

    data.forEach(n => {
      const time = new Date(n.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      h += '<div style="padding:6px 10px;margin:3px 0;font-size:12px;color:var(--tx2);border-left:2px solid var(--bg3);display:flex;justify-content:space-between;">';
      h += '<span>' + escH(n.body || n.title) + '</span>';
      h += '<span style="color:var(--tx3);font-size:11px;white-space:nowrap;margin-left:8px;">' + time + '</span>';
      h += '</div>';
    });

    h += '</div></details></div>';
    area.innerHTML = h;
  } catch (e) {
    // Non-critical
    console.error('loadActivityFeed error:', e);
  }
}

// ============================================================
// TEAM NOTIFICATIONS — notify other members of project activity
// ============================================================

export async function notifyTeam(projectId, action, detail) {
  if (!state.sdb || !state.currentUser) return;
  try {
    const members = await loadProjectMembers(projectId);
    const otherMembers = members.filter(m => m.user_id !== state.currentUser.id);
    if (otherMembers.length === 0) return;

    const proj = getProjects().find(p => p.id === projectId);
    const projName = proj?.nombre || 'proyecto';
    const userName = state.profile?.display_name || state.currentUser.email?.split('@')[0] || 'Alguien';

    const notifications = otherMembers.map(m => ({
      user_id: m.user_id,
      type: 'project_activity',
      title: action,
      body: userName + ' en "' + projName + '": ' + detail,
      reference_id: projectId,
      reference_type: 'project'
    }));

    await state.sdb.from('notifications').insert(notifications);
  } catch (e) {
    // Non-critical — don't block the main action
    console.error('notifyTeam error:', e);
  }
}

// Window globals for inline onclick
window.addMemberByEmail = addMemberByEmail;
window.showInviteModal = showInviteModal;
window.generateInviteLink = generateInviteLink;
