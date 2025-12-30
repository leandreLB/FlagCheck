-- Script SIMPLE pour créer la table self_tests
-- Utilise testid (minuscules) pour correspondre au code
-- À exécuter dans Supabase SQL Editor

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS self_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  testid TEXT NOT NULL UNIQUE,
  date TIMESTAMPTZ NOT NULL,
  scores JSONB NOT NULL,
  answers INTEGER[] NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer les index (ignorer les erreurs si ils existent déjà)
CREATE INDEX IF NOT EXISTS idx_self_tests_user_id ON self_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_self_tests_date ON self_tests(date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_user_date ON self_tests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_testid ON self_tests(testid);

-- Vérifier que la table est bien créée
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;

