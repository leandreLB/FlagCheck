-- Script pour ajouter la colonne completed si elle n'existe pas
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne completed si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne completed existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'self_tests' 
    AND column_name = 'completed'
  ) THEN
    -- Ajouter la colonne completed avec une valeur par défaut
    ALTER TABLE self_tests ADD COLUMN completed BOOLEAN NOT NULL DEFAULT true;
    
    RAISE NOTICE 'Colonne completed ajoutée avec succès';
  ELSE
    RAISE NOTICE 'La colonne completed existe déjà';
  END IF;
END $$;

-- Vérifier la structure de la table
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;


