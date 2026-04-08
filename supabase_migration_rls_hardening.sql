-- ============================================================
-- CRISOL — RLS Hardening for multi-user
-- Sprint 2: Reemplazar políticas USING(true) por auth.uid()
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-07
-- ============================================================

-- ===================== dr_socratic_log =====================
-- Eliminar políticas anon permisivas
DROP POLICY IF EXISTS "Anon can insert socratic log" ON dr_socratic_log;
DROP POLICY IF EXISTS "Anon can read socratic log" ON dr_socratic_log;

-- Las políticas "Users can read/insert/update own" con auth.uid() = user_id ya existen

-- ===================== dr_alerts =====================
DROP POLICY IF EXISTS "Anon can insert alerts" ON dr_alerts;
DROP POLICY IF EXISTS "Anon can read alerts" ON dr_alerts;
DROP POLICY IF EXISTS "Anon can update alerts" ON dr_alerts;

-- Las políticas "Users can read/manage own" con auth.uid() = user_id ya existen

-- ===================== dr_wizard_context =====================
DROP POLICY IF EXISTS "Anon can read wizard context" ON dr_wizard_context;
DROP POLICY IF EXISTS "Anon can upsert wizard context" ON dr_wizard_context;
DROP POLICY IF EXISTS "Anon can update wizard context" ON dr_wizard_context;

-- Agregar INSERT para authenticated (faltaba)
CREATE POLICY "Users can insert own wizard context"
  ON dr_wizard_context FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===================== dr_backups =====================
-- Reemplazar políticas anon por authenticated
DROP POLICY IF EXISTS "Anon can upsert backups" ON dr_backups;
DROP POLICY IF EXISTS "Anon can update backups" ON dr_backups;
DROP POLICY IF EXISTS "Anon can read backups" ON dr_backups;
DROP POLICY IF EXISTS "Anon can delete old backups" ON dr_backups;

-- Crear políticas por usuario
CREATE POLICY "Users can insert own backups"
  ON dr_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own backups"
  ON dr_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own backups"
  ON dr_backups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON dr_backups FOR DELETE
  USING (auth.uid() = user_id);

-- ===================== invite_requests =====================
-- INSERT: cualquiera puede solicitar (correcto, mantener)
-- SELECT: solo admin debería ver todas
-- UPDATE: solo admin puede aprobar/rechazar
DROP POLICY IF EXISTS "Anon can read invite requests" ON invite_requests;
DROP POLICY IF EXISTS "Admin can update invite requests" ON invite_requests;

-- Admin = usuario cuyo email está en tabla admins
CREATE POLICY "Admin can read all invite requests"
  ON invite_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin can update invite requests"
  ON invite_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email')
  );

-- ===================== projects =====================
-- Los proyectos tienen owner_id. Solo el owner y miembros deberían ver/editar.
-- Verificar estructura actual:
DO $$
BEGIN
  -- Solo ejecutar si no existe ya la política
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own projects' AND tablename = 'projects') THEN
    EXECUTE 'CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (auth.uid() = owner_id OR auth.uid() IN (SELECT user_id FROM project_members WHERE project_id = id))';
  END IF;
END $$;

-- ===================== Resumen =====================
-- Políticas eliminadas: 11 (todas las USING(true) para anon)
-- Políticas creadas: 7 (filtradas por auth.uid())
-- Tablas afectadas: dr_socratic_log, dr_alerts, dr_wizard_context, dr_backups, invite_requests
-- La tabla admins mantiene SELECT público (necesario para el check de admin)
