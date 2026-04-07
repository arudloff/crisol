import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = "re_5iTFHUfv_BwHqNAuJcAfSokghwMqxDQLR";
const ADMIN_EMAIL = "alejandro@colegiocamilohenriquez.cl";
const FROM_EMAIL = "CRISOL <onboarding@resend.dev>";

serve(async (req) => {
  try {
    const { type, record } = await req.json();

    // INSERT = new request → notify admin
    if (type === "INSERT" && record.status === "pending") {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ADMIN_EMAIL,
          subject: `🔔 CRISOL: Nueva solicitud de invitación de ${record.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;">
              <h2 style="color:#E8A838;">Nueva solicitud de invitación</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px;color:#888;">Nombre</td><td style="padding:8px;font-weight:bold;">${record.name}</td></tr>
                <tr><td style="padding:8px;color:#888;">Email</td><td style="padding:8px;">${record.email}</td></tr>
                <tr><td style="padding:8px;color:#888;">Institución</td><td style="padding:8px;">${record.institution}</td></tr>
                <tr><td style="padding:8px;color:#888;">Rol</td><td style="padding:8px;">${record.role}</td></tr>
                ${record.reason ? `<tr><td style="padding:8px;color:#888;">Motivo</td><td style="padding:8px;font-style:italic;">"${record.reason}"</td></tr>` : ''}
              </table>
              <p style="margin-top:20px;">
                <a href="https://crisol-psi.vercel.app" style="background:#E8A838;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Revisar en CRISOL</a>
              </p>
              <p style="color:#888;font-size:12px;margin-top:20px;">⚙ → 📨 Solicitudes de invitación</p>
            </div>
          `,
        }),
      });
    }

    // UPDATE with status=approved → send code to applicant
    if (type === "UPDATE" && record.status === "approved" && record.invite_code) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: record.email,
          subject: "✅ Tu acceso a CRISOL fue aprobado",
          html: `
            <div style="font-family:sans-serif;max-width:500px;">
              <h2 style="color:#5DBB8A;">Bienvenido/a a CRISOL</h2>
              <p>Hola ${record.name},</p>
              <p>Tu solicitud de acceso fue aprobada.</p>
              <div style="background:#1a1b21;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">
                <div style="color:#888;font-size:12px;margin-bottom:8px;">Tu código de invitación</div>
                <div style="font-family:monospace;font-size:28px;color:#9B7DCF;letter-spacing:4px;font-weight:bold;">${record.invite_code}</div>
              </div>
              <p><b>Para ingresar:</b></p>
              <ol>
                <li>Ve a <a href="https://crisol-psi.vercel.app" style="color:#90C8F0;">crisol-psi.vercel.app</a></li>
                <li>Click en "Crear cuenta"</li>
                <li>Ingresa tu email y contraseña</li>
                <li>Ingresa el código de invitación</li>
              </ol>
              <p style="color:#888;font-size:12px;margin-top:30px;">CRISOL — Donde la asistencia de IA se convierte en autoría demostrable</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
