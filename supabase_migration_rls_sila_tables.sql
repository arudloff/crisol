-- ============================================================
-- CRISOL — RLS Policies for sila_* tables
-- Sprint 7: Integridad de datos multi-usuario
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- sila_docs
DROP POLICY IF EXISTS "Users own docs" ON sila_docs;
CREATE POLICY "Users own docs" ON sila_docs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sila_kanban
DROP POLICY IF EXISTS "Users own kanban" ON sila_kanban;
CREATE POLICY "Users own kanban" ON sila_kanban FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sila_prisma
DROP POLICY IF EXISTS "Users own prisma" ON sila_prisma;
CREATE POLICY "Users own prisma" ON sila_prisma FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sila_userdata
DROP POLICY IF EXISTS "Users own userdata" ON sila_userdata;
CREATE POLICY "Users own userdata" ON sila_userdata FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sila_settings
DROP POLICY IF EXISTS "Users own settings" ON sila_settings;
CREATE POLICY "Users own settings" ON sila_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sila_projects
DROP POLICY IF EXISTS "Users own sila_projects" ON sila_projects;
CREATE POLICY "Users own sila_projects" ON sila_projects FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notifications (user can read own + insert for others via notifyTeam)
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;
CREATE POLICY "Authenticated can insert notifications" ON notifications FOR INSERT
  WITH CHECK (true);

-- profiles (users see all profiles for team display, edit own)
DROP POLICY IF EXISTS "Users read all profiles" ON profiles;
CREATE POLICY "Users read all profiles" ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
