-- Script COMPLET pour s'assurer que toutes les colonnes nécessaires existent
-- À exécuter dans Supabase SQL Editor

-- Étape 1 : Créer la table de base si elle n'existe pas (sans testid et completed pour l'instant)
CREATE TABLE IF NOT EXISTS self_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  scores JSONB NOT NULL,
  answers INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 2 : Ajouter testid si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'self_tests' 
    AND column_name = 'testid'
  ) THEN
    ALTER TABLE self_tests ADD COLUMN testid TEXT;
    UPDATE self_tests SET testid = gen_random_uuid()::text WHERE testid IS NULL;
    ALTER TABLE self_tests ALTER COLUMN testid SET NOT NULL;
    ALTER TABLE self_tests ADD CONSTRAINT self_tests_testid_unique UNIQUE (testid);
    RAISE NOTICE 'Colonne testid ajoutée';
  END IF;
END $$;

-- Étape 3 : Ajouter completed si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'self_tests' 
    AND column_name = 'completed'
  ) THEN
    ALTER TABLE self_tests ADD COLUMN completed BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Colonne completed ajoutée';
  END IF;
END $$;

-- Étape 4 : Créer les index
CREATE INDEX IF NOT EXISTS idx_self_tests_user_id ON self_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_self_tests_date ON self_tests(date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_user_date ON self_tests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_testid ON self_tests(testid);

-- Étape 5 : Vérifier la structure finale
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;

