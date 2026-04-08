-- ============================================================
-- CRISOL — Full Schema (todas las tablas)
-- Generado: 2026-04-07
-- Uso: Recrear la BD desde cero si es necesario
-- NOTA: Ejecutar EN ORDEN. Algunas tablas tienen FK a otras.
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  institution text,
  research_area text,
  orcid text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Admins
CREATE TABLE IF NOT EXISTS admins (
  email text PRIMARY KEY
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT '',
  description text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Project members
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'reader' CHECK (role IN ('owner', 'coauthor', 'reviewer', 'reader')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 5. Project invitations
CREATE TABLE IF NOT EXISTS project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES auth.users(id),
  role text DEFAULT 'reader',
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  accepted boolean DEFAULT false,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- 6. User project phase (per-user phase tracking)
CREATE TABLE IF NOT EXISTS user_project_phase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  current_phase text,
  phases jsonb DEFAULT '[]',
  gate_records jsonb DEFAULT '[]',
  UNIQUE(project_id, user_id)
);
ALTER TABLE user_project_phase ENABLE ROW LEVEL SECURITY;

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  reference_id uuid,
  reference_type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. Invite requests (public registration)
CREATE TABLE IF NOT EXISTS invite_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  institution text NOT NULL,
  role text NOT NULL,
  reason text,
  invite_code text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE invite_requests ENABLE ROW LEVEL SECURITY;

-- 9. SILA data tables (user content)
CREATE TABLE IF NOT EXISTS sila_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text DEFAULT '',
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sila_docs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sila_kanban (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE sila_kanban ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sila_prisma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE sila_prisma ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sila_userdata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  article_key text,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, article_key)
);
ALTER TABLE sila_userdata ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sila_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE sila_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS sila_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE sila_projects ENABLE ROW LEVEL SECURITY;

-- 10. PRISMA data (per-user, per-project)
CREATE TABLE IF NOT EXISTS prisma_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id text,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE prisma_data ENABLE ROW LEVEL SECURITY;

-- 11. Articles and annotations
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS shared_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_key text,
  shared_by uuid REFERENCES auth.users(id),
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shared_articles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS article_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  article_key text,
  data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE article_annotations ENABLE ROW LEVEL SECURITY;

-- 12. DR tables (Claude integration)
CREATE TABLE IF NOT EXISTS dr_socratic_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL,
  phase text NOT NULL,
  source text NOT NULL CHECK (source IN ('claude', 'crisol')),
  skill text,
  questions jsonb DEFAULT '[]',
  key_question text,
  researcher_answer text,
  insight text,
  context_for_next text,
  iteration integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dr_socratic_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS dr_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phase text NOT NULL,
  type text NOT NULL CHECK (type IN ('block', 'warning', 'info')),
  source_skill text NOT NULL,
  code text,
  message text NOT NULL,
  detail text,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE dr_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS dr_wizard_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  active_phase text,
  active_phase_name text,
  workflow_mode text DEFAULT 'dr',
  gate_responses jsonb DEFAULT '{}',
  socratic_responses jsonb DEFAULT '{}',
  last_scores jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE dr_wizard_context ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS dr_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type text DEFAULT 'auto' CHECK (backup_type IN ('auto', 'manual', 'sync')),
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dr_backups ENABLE ROW LEVEL SECURITY;

-- 13. Indexes
CREATE INDEX IF NOT EXISTS idx_socratic_project ON dr_socratic_log(project_id, phase);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON dr_alerts(project_id, resolved);
CREATE INDEX IF NOT EXISTS idx_wizard_context_project ON dr_wizard_context(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_sila_userdata_user ON sila_userdata(user_id);
CREATE INDEX IF NOT EXISTS idx_sila_docs_user ON sila_docs(user_id);

-- ============================================================
-- NOTA: Este archivo NO incluye políticas RLS.
-- Ver supabase_migration_rls_hardening.sql para las políticas.
-- ============================================================
