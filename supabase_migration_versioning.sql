-- ============================================================
-- CRISOL — Schema versioning
-- Sprint 11: Track which migrations have been applied
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS schema_versions (
  id serial PRIMARY KEY,
  version text NOT NULL UNIQUE,
  description text,
  applied_at timestamptz DEFAULT now()
);

-- No RLS needed — only accessible via SQL Editor or service_role

-- Register all migrations applied so far
INSERT INTO schema_versions (version, description) VALUES
  ('1.0', 'Initial schema: projects, profiles, members, docs, kanban, prisma, settings')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.1', 'DR tables: socratic_log, alerts, wizard_context, invite_requests')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.2', 'Backups: dr_backups table')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.3', 'Invite code column on invite_requests')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.4', 'Email notifications: pg_net triggers for Resend')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.5', 'RLS hardening: replace USING(true) with auth.uid()')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.6', 'RLS for sila_* tables + notifications + profiles')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.7', 'Observability: error_log + audit_log tables')
  ON CONFLICT (version) DO NOTHING;
INSERT INTO schema_versions (version, description) VALUES
  ('1.8', 'Schema versioning table')
  ON CONFLICT (version) DO NOTHING;
