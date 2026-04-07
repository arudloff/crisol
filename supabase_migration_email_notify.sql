-- ============================================================
-- CRISOL — Email notifications via pg_net + Resend
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pg_net extension (for HTTP requests from PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function: notify admin on new invite request
CREATE OR REPLACE FUNCTION notify_admin_new_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer re_5iTFHUfv_BwHqNAuJcAfSokghwMqxDQLR',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'CRISOL <onboarding@resend.dev>',
        'to', 'alejandro@colegiocamilohenriquez.cl',
        'subject', '🔔 CRISOL: Nueva solicitud de ' || NEW.name,
        'html', '<div style="font-family:sans-serif;max-width:500px;">'
          || '<h2 style="color:#E8A838;">Nueva solicitud de invitación</h2>'
          || '<p><b>' || NEW.name || '</b> (' || NEW.email || ')</p>'
          || '<p>' || COALESCE(NEW.institution, '') || ' · ' || COALESCE(NEW.role, '') || '</p>'
          || CASE WHEN NEW.reason IS NOT NULL THEN '<p style="font-style:italic;">"' || NEW.reason || '"</p>' ELSE '' END
          || '<p style="margin-top:20px;"><a href="https://crisol-psi.vercel.app" style="background:#E8A838;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold;">Revisar en CRISOL</a></p>'
          || '<p style="color:#888;font-size:12px;">⚙ → 📨 Solicitudes de invitación</p>'
          || '</div>'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: send invite code on approval
CREATE OR REPLACE FUNCTION notify_approved_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.invite_code IS NOT NULL AND OLD.status = 'pending' THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer re_5iTFHUfv_BwHqNAuJcAfSokghwMqxDQLR',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'CRISOL <onboarding@resend.dev>',
        'to', NEW.email,
        'subject', '✅ Tu acceso a CRISOL fue aprobado',
        'html', '<div style="font-family:sans-serif;max-width:500px;">'
          || '<h2 style="color:#5DBB8A;">Bienvenido/a a CRISOL</h2>'
          || '<p>Hola ' || NEW.name || ',</p>'
          || '<p>Tu solicitud de acceso fue aprobada.</p>'
          || '<div style="background:#1a1b21;padding:20px;border-radius:10px;text-align:center;margin:20px 0;">'
          || '<div style="color:#888;font-size:12px;margin-bottom:8px;">Tu código de invitación</div>'
          || '<div style="font-family:monospace;font-size:28px;color:#9B7DCF;letter-spacing:4px;font-weight:bold;">' || NEW.invite_code || '</div>'
          || '</div>'
          || '<p><b>Para ingresar:</b></p>'
          || '<ol>'
          || '<li>Ve a <a href="https://crisol-psi.vercel.app" style="color:#90C8F0;">crisol-psi.vercel.app</a></li>'
          || '<li>Click en "Crear cuenta"</li>'
          || '<li>Ingresa tu email y contraseña</li>'
          || '<li>Ingresa el código de invitación</li>'
          || '</ol>'
          || '<p style="color:#888;font-size:12px;margin-top:30px;">CRISOL — Donde la asistencia de IA se convierte en autoría demostrable</p>'
          || '</div>'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: on INSERT (new request → notify admin)
DROP TRIGGER IF EXISTS trg_invite_request_new ON invite_requests;
CREATE TRIGGER trg_invite_request_new
  AFTER INSERT ON invite_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_new_request();

-- Trigger: on UPDATE (approved → send code to applicant)
DROP TRIGGER IF EXISTS trg_invite_request_approved ON invite_requests;
CREATE TRIGGER trg_invite_request_approved
  AFTER UPDATE ON invite_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_approved_request();
