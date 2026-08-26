-- =============================================================================
-- Sphera V2 — Script de migration manuelle (Supabase SQL Editor)
-- À exécuter dans : https://supabase.com → SQL Editor
-- =============================================================================

-- Étape 1 : Renommer la table study_tools → sphera
ALTER TABLE IF EXISTS study_tools_studysession
  RENAME TO sphera_studysession;

-- Étape 2 : Ajouter les nouveaux champs V2 sur StudySession (si pas déjà présents)
ALTER TABLE sphera_studysession
  ADD COLUMN IF NOT EXISTS extracted_text TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS qa_history JSONB NOT NULL DEFAULT '[]';

-- Étape 3 : Créer la table AnnaleSession (si pas déjà présente)
CREATE TABLE IF NOT EXISTS sphera_annalesession (
  id             BIGSERIAL PRIMARY KEY,
  mode           VARCHAR(20) NOT NULL DEFAULT 'complete',
  source_filename VARCHAR(255) NOT NULL DEFAULT '',
  content        JSONB NOT NULL DEFAULT '{}',
  is_shared      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  owner_id       BIGINT NOT NULL REFERENCES users_user(id) ON DELETE CASCADE,
  resource_id    BIGINT REFERENCES resources_resource(id) ON DELETE SET NULL,
  cours_resource_id BIGINT REFERENCES resources_resource(id) ON DELETE SET NULL,
  shared_in_sphere_id BIGINT REFERENCES spheres_sphere(id) ON DELETE SET NULL
);

-- Index sur les clés étrangères les plus utilisées
CREATE INDEX IF NOT EXISTS idx_sphera_annalesession_owner
  ON sphera_annalesession(owner_id);
CREATE INDEX IF NOT EXISTS idx_sphera_annalesession_sphere
  ON sphera_annalesession(shared_in_sphere_id)
  WHERE is_shared = TRUE;

-- Vérification finale
SELECT 'sphera_studysession exists' AS check
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sphera_studysession');

SELECT 'sphera_annalesession exists' AS check
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sphera_annalesession');
