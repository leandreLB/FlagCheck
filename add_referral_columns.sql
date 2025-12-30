-- Script pour ajouter les colonnes de parrainage à la table users
-- À exécuter dans Supabase SQL Editor

-- Ajouter la colonne referral_code si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'referral_code'
  ) THEN
    -- Ajouter la colonne
    ALTER TABLE users ADD COLUMN referral_code TEXT;
    RAISE NOTICE 'Colonne referral_code ajoutée';
  ELSE
    RAISE NOTICE 'La colonne referral_code existe déjà';
  END IF;
END $$;

-- Créer un index unique partiel (permet plusieurs NULL mais garantit l'unicité des valeurs non-NULL)
-- Cela permet aux utilisateurs sans code d'avoir NULL, mais chaque code doit être unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_unique 
ON users(referral_code) 
WHERE referral_code IS NOT NULL;

-- Créer aussi un index normal pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_referral_code 
ON users(referral_code);

-- Ajouter la colonne referred_by si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE users ADD COLUMN referred_by TEXT;
    CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
    RAISE NOTICE 'Colonne referred_by ajoutée';
  ELSE
    RAISE NOTICE 'La colonne referred_by existe déjà';
  END IF;
END $$;

-- Vérifier la structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
AND column_name IN ('referral_code', 'referred_by')
ORDER BY column_name;

