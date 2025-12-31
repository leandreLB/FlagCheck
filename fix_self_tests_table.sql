-- Script pour corriger la table self_tests si elle existe déjà avec la mauvaise structure
-- Ce script supprime et recrée la table (ATTENTION : supprime toutes les données existantes)

-- Étape 1 : Sauvegarder les données existantes (optionnel, décommentez si vous avez des données importantes)
-- CREATE TABLE self_tests_backup AS SELECT * FROM self_tests;

-- Étape 2 : Supprimer les index existants
DROP INDEX IF EXISTS idx_self_tests_user_id;
DROP INDEX IF EXISTS idx_self_tests_date;
DROP INDEX IF EXISTS idx_self_tests_user_date;
DROP INDEX IF EXISTS idx_self_tests_testId;

-- Étape 3 : Supprimer la table
DROP TABLE IF EXISTS self_tests;

-- Étape 4 : Recréer la table avec la bonne structure (testId avec guillemets)
CREATE TABLE self_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  "testId" TEXT NOT NULL UNIQUE,
  date TIMESTAMPTZ NOT NULL,
  scores JSONB NOT NULL,
  answers INTEGER[] NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 5 : Recréer les index
CREATE INDEX idx_self_tests_user_id ON self_tests(user_id);
CREATE INDEX idx_self_tests_date ON self_tests(date DESC);
CREATE INDEX idx_self_tests_user_date ON self_tests(user_id, date DESC);
CREATE INDEX idx_self_tests_testId ON self_tests("testId");

-- Étape 6 : Vérifier la structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;


