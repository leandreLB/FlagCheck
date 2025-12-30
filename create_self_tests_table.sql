-- Script pour créer la table self_tests dans Supabase
-- À exécuter dans Supabase SQL Editor

-- Vérifier si la table existe déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'self_tests'
  ) THEN
    -- Créer la table
    -- Utiliser des guillemets doubles pour préserver la casse camelCase pour testId
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

    -- Index pour améliorer les performances
    CREATE INDEX idx_self_tests_user_id ON self_tests(user_id);
    CREATE INDEX idx_self_tests_date ON self_tests(date DESC);
    CREATE INDEX idx_self_tests_user_date ON self_tests(user_id, date DESC);
    CREATE INDEX idx_self_tests_testId ON self_tests("testId");

    RAISE NOTICE 'Table self_tests créée avec succès';
  ELSE
    RAISE NOTICE 'La table self_tests existe déjà';
  END IF;
END $$;

-- Désactiver RLS (Row Level Security) car l'app utilise Clerk, pas Supabase Auth
-- Si vous préférez garder RLS activé, vous devrez utiliser le service key Supabase qui contourne RLS
ALTER TABLE self_tests DISABLE ROW LEVEL SECURITY;

-- Si RLS était activé, supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own self tests" ON self_tests;
DROP POLICY IF EXISTS "Users can insert their own self tests" ON self_tests;
DROP POLICY IF EXISTS "Users can update their own self tests" ON self_tests;

-- Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;

