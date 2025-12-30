-- Script SÉCURISÉ pour créer la table self_tests dans Supabase
-- Ce script ne fait QUE créer la table, sans supprimer quoi que ce soit
-- À exécuter dans Supabase SQL Editor

-- Créer la table si elle n'existe pas
-- Utiliser des guillemets doubles pour préserver la casse camelCase pour testId
CREATE TABLE IF NOT EXISTS self_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  "testId" TEXT NOT NULL UNIQUE,
  date TIMESTAMPTZ NOT NULL,
  scores JSONB NOT NULL,
  answers INTEGER[] NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer les index si ils n'existent pas (pas de IF NOT EXISTS pour les index, donc on utilise CREATE INDEX CONCURRENTLY ou on ignore les erreurs)
DO $$
BEGIN
  -- Créer les index uniquement s'ils n'existent pas déjà
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'self_tests' AND indexname = 'idx_self_tests_user_id') THEN
    CREATE INDEX idx_self_tests_user_id ON self_tests(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'self_tests' AND indexname = 'idx_self_tests_date') THEN
    CREATE INDEX idx_self_tests_date ON self_tests(date DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'self_tests' AND indexname = 'idx_self_tests_user_date') THEN
    CREATE INDEX idx_self_tests_user_date ON self_tests(user_id, date DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'self_tests' AND indexname = 'idx_self_tests_testId') THEN
    CREATE INDEX idx_self_tests_testId ON self_tests("testId");
  END IF;
END $$;

-- Vérifier la structure de la table créée
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;

-- Note : Si vous utilisez Clerk (et non Supabase Auth), vous devez désactiver RLS manuellement
-- ou utiliser le service key qui contourne RLS automatiquement.
-- Pour désactiver RLS manuellement, exécutez séparément :
-- ALTER TABLE self_tests DISABLE ROW LEVEL SECURITY;

