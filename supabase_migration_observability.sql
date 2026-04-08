-- ============================================================
-- CRISOL — Observability tables
-- Sprint 9: error_log + audit_log
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Error log (client-side errors sent to server)
CREATE TABLE IF NOT EXISTS error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text,
  stack text,
  url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert errors" ON error_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read errors" ON error_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email'));

-- Auto-cleanup: keep only last 30 days
CREATE INDEX IF NOT EXISTS idx_error_log_created ON error_log(created_at);

-- Audit log (sensitive operations)
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert audit entries" ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can read audit log" ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email'));

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
