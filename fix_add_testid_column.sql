-- Script pour ajouter la colonne testid si elle n'existe pas
-- À exécuter dans Supabase SQL Editor

-- Étape 1 : Vérifier si la table existe, sinon la créer
CREATE TABLE IF NOT EXISTS self_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  scores JSONB NOT NULL,
  answers INTEGER[] NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Étape 2 : Ajouter la colonne testid si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne testid existe (en minuscules)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'self_tests' 
    AND column_name = 'testid'
  ) THEN
    -- Ajouter la colonne testid
    ALTER TABLE self_tests ADD COLUMN testid TEXT;
    
    -- Remplir les valeurs existantes avec des UUID aléatoires si nécessaire
    UPDATE self_tests 
    SET testid = gen_random_uuid()::text 
    WHERE testid IS NULL;
    
    -- Ajouter la contrainte UNIQUE et NOT NULL
    ALTER TABLE self_tests 
    ALTER COLUMN testid SET NOT NULL;
    
    -- Ajouter la contrainte UNIQUE
    ALTER TABLE self_tests 
    ADD CONSTRAINT self_tests_testid_unique UNIQUE (testid);
    
    RAISE NOTICE 'Colonne testid ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne testid existe déjà';
  END IF;
END $$;

-- Étape 3 : Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_self_tests_user_id ON self_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_self_tests_date ON self_tests(date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_user_date ON self_tests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_self_tests_testid ON self_tests(testid);

-- Étape 4 : Vérifier la structure finale
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;

