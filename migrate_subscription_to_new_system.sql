-- Script de migration pour le nouveau système de pricing
-- À exécuter dans Supabase SQL Editor

-- Étape 1: Ajouter les nouveaux champs si ils n'existent pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS free_scans_remaining INTEGER DEFAULT 3;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS free_pro_until TIMESTAMPTZ;

-- Étape 2: Migrer les données depuis subscription_status vers subscription_plan
-- (Uniquement si subscription_status existe et contient des données)
DO $$
BEGIN
  -- Vérifier si la colonne subscription_status existe
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'subscription_status'
  ) THEN
    -- Migrer les anciens statuts vers les nouveaux plans
    UPDATE users 
    SET subscription_plan = CASE 
      WHEN subscription_status = 'pro' THEN 'pro_monthly'
      WHEN subscription_status = 'lifetime' THEN 'pro_monthly'  -- ou 'pro_annual' selon votre choix
      WHEN subscription_status = 'free' THEN 'free'
      ELSE 'free'
    END
    WHERE subscription_plan IS NULL 
       OR subscription_plan = 'free'
       OR subscription_plan = '';
       
    RAISE NOTICE 'Migration depuis subscription_status terminée';
  ELSE
    RAISE NOTICE 'La colonne subscription_status n''existe pas, migration ignorée';
  END IF;
END $$;

-- Étape 3: Initialiser free_scans_remaining pour tous les utilisateurs
UPDATE users 
SET free_scans_remaining = 3
WHERE free_scans_remaining IS NULL;

-- Étape 4: Vérifier les résultats
SELECT 
  subscription_plan,
  COUNT(*) as count
FROM users
GROUP BY subscription_plan;

-- Pour mettre manuellement un utilisateur en Pro (remplacer les valeurs):
-- UPDATE users 
-- SET 
--   subscription_plan = 'pro_monthly',  -- ou 'pro_annual'
--   subscription_id = 'sub_xxxxx',  -- ID depuis Stripe
--   subscription_start_date = NOW(),
--   next_billing_date = NOW() + INTERVAL '1 month',  -- ou '1 year' pour annual
--   free_scans_remaining = 3
-- WHERE user_id = 'user_clerk_id_ici';

