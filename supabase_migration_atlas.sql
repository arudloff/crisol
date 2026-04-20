-- ============================================================
-- CRISOL Schema Migration v1.9 — SILA Atlas tables
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Fecha: 2026-04-17
-- Descripcion: Capa 1 (Territorio) — glosario unificado,
--   mapa de conceptos, genealogia intelectual
-- ============================================================

-- ============================================================
-- 1. atlas_corpus — corpus tematico
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_corpus (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  project_id  text,  -- logical reference to project (stored as JSON in sila_projects.data)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE atlas_corpus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own corpus" ON atlas_corpus FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. atlas_papers — paper procesado dentro de un corpus
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_papers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id       uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  authors         text[] NOT NULL DEFAULT '{}',
  year            int,
  journal         text,
  status          text NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','processing','extracted','verifying',
                                      'verified','revision_required','integrated',
                                      'deep_read','failed')),
  mode            text NOT NULL DEFAULT 'complete'
                    CHECK (mode IN ('complete','active')),
  pdf_path        text,
  extraction_data jsonb DEFAULT '{}'::jsonb,
  verification    jsonb DEFAULT '{}'::jsonb,
  relevance_score float,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own papers" ON atlas_papers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_papers_corpus ON atlas_papers(corpus_id);
CREATE INDEX idx_atlas_papers_status ON atlas_papers(status);

-- ============================================================
-- 3. atlas_concepts — glosario unificado del corpus
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_concepts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id        uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  definitions      jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight           text NOT NULL DEFAULT 'important'
                     CHECK (weight IN ('foundational','important','peripheral')),
  centrality_score float NOT NULL DEFAULT 0,
  is_threshold     boolean NOT NULL DEFAULT false,
  category         text,
  user_notes       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(corpus_id, name)
);

ALTER TABLE atlas_concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own concepts" ON atlas_concepts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_concepts_corpus ON atlas_concepts(corpus_id);
CREATE INDEX idx_atlas_concepts_weight ON atlas_concepts(weight);

-- ============================================================
-- 4. atlas_concept_relations — aristas del mapa de conceptos
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_concept_relations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id       uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id       uuid NOT NULL REFERENCES atlas_concepts(id) ON DELETE CASCADE,
  target_id       uuid NOT NULL REFERENCES atlas_concepts(id) ON DELETE CASCADE,
  relation_type   text CHECK (relation_type IN ('causes','part_of','evolves_from',
                                                 'tensions_with','exemplifies','requires')),
  label           text,
  source_papers   uuid[] DEFAULT '{}',
  user_completed  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_concept_relations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own relations" ON atlas_concept_relations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_relations_corpus ON atlas_concept_relations(corpus_id);
CREATE INDEX idx_atlas_relations_source ON atlas_concept_relations(source_id);
CREATE INDEX idx_atlas_relations_target ON atlas_concept_relations(target_id);

-- ============================================================
-- 5. atlas_traditions — corrientes intelectuales
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_traditions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id             uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  description           text,
  key_authors           uuid[] DEFAULT '{}',
  opposing_traditions   uuid[] DEFAULT '{}',
  papers_in_tradition   uuid[] DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE(corpus_id, name)
);

ALTER TABLE atlas_traditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own traditions" ON atlas_traditions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_traditions_corpus ON atlas_traditions(corpus_id);

-- ============================================================
-- 6. atlas_authors — genealogia intelectual
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_authors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id     uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  dates         text,
  tradition_id  uuid REFERENCES atlas_traditions(id) ON DELETE SET NULL,
  role          text NOT NULL DEFAULT 'cited_only'
                  CHECK (role IN ('foundational','contemporary','opposing','cited_only')),
  influenced_by uuid[] DEFAULT '{}',
  influences    uuid[] DEFAULT '{}',
  mentioned_in  uuid[] DEFAULT '{}',
  key_ideas     text[] DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(corpus_id, name)
);

ALTER TABLE atlas_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own authors" ON atlas_authors FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_atlas_authors_corpus ON atlas_authors(corpus_id);
CREATE INDEX idx_atlas_authors_tradition ON atlas_authors(tradition_id);

-- ============================================================
-- 7. atlas_calibration — respuestas de checkpoints
-- ============================================================
CREATE TABLE IF NOT EXISTS atlas_calibration (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id   uuid NOT NULL REFERENCES atlas_corpus(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question    text NOT NULL,
  answer      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_calibration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own calibration" ON atlas_calibration FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. Updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION atlas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atlas_corpus_updated
  BEFORE UPDATE ON atlas_corpus
  FOR EACH ROW EXECUTE FUNCTION atlas_updated_at();

CREATE TRIGGER trg_atlas_papers_updated
  BEFORE UPDATE ON atlas_papers
  FOR EACH ROW EXECUTE FUNCTION atlas_updated_at();

CREATE TRIGGER trg_atlas_concepts_updated
  BEFORE UPDATE ON atlas_concepts
  FOR EACH ROW EXECUTE FUNCTION atlas_updated_at();

CREATE TRIGGER trg_atlas_traditions_updated
  BEFORE UPDATE ON atlas_traditions
  FOR EACH ROW EXECUTE FUNCTION atlas_updated_at();

CREATE TRIGGER trg_atlas_authors_updated
  BEFORE UPDATE ON atlas_authors
  FOR EACH ROW EXECUTE FUNCTION atlas_updated_at();

-- ============================================================
-- 9. Register schema version
-- ============================================================
INSERT INTO schema_versions (version, description, applied_at)
VALUES ('1.9', 'SILA Atlas — Capa 1: corpus, papers, concepts, relations, traditions, authors, calibration', now())
ON CONFLICT DO NOTHING;
