-- CRISOL — Tabla de backups automáticos
-- Ejecutar en Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS dr_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_type text DEFAULT 'auto' CHECK (backup_type IN ('auto', 'manual', 'sync')),
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, backup_type)
);

ALTER TABLE dr_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own backups"
  ON dr_backups FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can upsert backups"
  ON dr_backups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon can update backups"
  ON dr_backups FOR UPDATE
  USING (true);

CREATE POLICY "Anon can read backups"
  ON dr_backups FOR SELECT
  USING (true);
