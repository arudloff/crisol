-- ============================================================
-- CRISOL — Tablas para conexión Claude ↔ CRISOL vía Supabase
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-07
-- ============================================================

-- 1. Tabla de diálogo socrático
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

-- RLS: solo el owner puede leer/escribir sus propios registros
ALTER TABLE dr_socratic_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own socratic log"
  ON dr_socratic_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own socratic log"
  ON dr_socratic_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own socratic log"
  ON dr_socratic_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Anon key access (para que Claude Code pueda escribir con el JWT del usuario)
CREATE POLICY "Anon can insert socratic log"
  ON dr_socratic_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can read socratic log"
  ON dr_socratic_log FOR SELECT
  USING (true);

-- 2. Tabla de alertas y bloqueos
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

-- RLS
ALTER TABLE dr_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own alerts"
  ON dr_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts"
  ON dr_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Anon access for Claude Code
CREATE POLICY "Anon can insert alerts"
  ON dr_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can read alerts"
  ON dr_alerts FOR SELECT
  USING (true);

CREATE POLICY "Anon can update alerts"
  ON dr_alerts FOR UPDATE
  USING (true);

-- 3. Tabla de contexto de wizard (fase activa, para que Claude sepa)
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

-- RLS
ALTER TABLE dr_wizard_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wizard context"
  ON dr_wizard_context FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can read wizard context"
  ON dr_wizard_context FOR SELECT
  USING (true);

CREATE POLICY "Anon can upsert wizard context"
  ON dr_wizard_context FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can update wizard context"
  ON dr_wizard_context FOR UPDATE
  USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_socratic_project ON dr_socratic_log(project_id, phase);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON dr_alerts(project_id, resolved);
CREATE INDEX IF NOT EXISTS idx_wizard_context_project ON dr_wizard_context(project_id);
