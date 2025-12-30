# Migration Supabase - Nouveau système de pricing

## Problème identifié

Si vos utilisateurs existants ont été mis à Pro manuellement dans Stripe mais ne sont pas en Pro dans l'application, c'est probablement parce que :

1. La table `users` utilise encore l'ancien champ `subscription_status` au lieu du nouveau `subscription_plan`
2. Le webhook n'a peut-être pas été déclenché pour mettre à jour la base de données

## Solution : Migration de la base de données

### Étape 1 : Vérifier la structure de la table

Exécutez cette requête dans Supabase SQL Editor pour voir la structure actuelle :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Étape 2 : Ajouter le nouveau champ (si nécessaire)

Si `subscription_plan` n'existe pas, créez-le :

```sql
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
```

### Étape 3 : Migrer les données existantes

Si vous avez des utilisateurs avec `subscription_status = 'pro'` ou `'lifetime'`, migrez-les :

```sql
-- Migrer subscription_status vers subscription_plan
UPDATE users 
SET subscription_plan = CASE 
  WHEN subscription_status = 'pro' THEN 'pro_monthly'
  WHEN subscription_status = 'lifetime' THEN 'pro_monthly'  -- ou 'pro_annual' selon votre choix
  ELSE 'free'
END
WHERE subscription_plan IS NULL OR subscription_plan = 'free';

-- Initialiser free_scans_remaining pour tous les utilisateurs
UPDATE users 
SET free_scans_remaining = 3
WHERE free_scans_remaining IS NULL;
```

### Étape 4 : Vérifier vos utilisateurs Pro dans Stripe

Pour chaque utilisateur qui devrait être Pro :

1. Allez dans Stripe Dashboard → Customers
2. Trouvez le customer avec l'email de l'utilisateur
3. Vérifiez qu'il a une subscription active
4. Notez le `subscription_id` (commence par `sub_`)

### Étape 5 : Mettre à jour manuellement dans Supabase (si nécessaire)

Pour chaque utilisateur Pro dans Stripe qui n'est pas Pro dans l'app :

```sql
-- Remplacer 'user_clerk_id' par l'ID Clerk de l'utilisateur
-- Remplacer 'subscription_id_from_stripe' par le subscription ID de Stripe
UPDATE users 
SET 
  subscription_plan = 'pro_monthly',  -- ou 'pro_annual' selon le plan
  subscription_id = 'subscription_id_from_stripe',
  subscription_start_date = NOW(),
  next_billing_date = NOW() + INTERVAL '1 month',  -- ou '1 year' pour annual
  free_scans_remaining = 3
WHERE user_id = 'user_clerk_id';
```

### Étape 6 : Vérifier que ça fonctionne

Testez dans l'app que l'utilisateur voit bien son statut Pro.

## Pourquoi le webhook n'a pas fonctionné ?

Plusieurs raisons possibles :

1. **Webhook non configuré dans Stripe** : Vérifiez que vous avez bien configuré l'endpoint webhook dans Stripe Dashboard
2. **URL du webhook incorrecte** : L'URL doit pointer vers `https://votre-domaine.com/api/stripe/webhook`
3. **Signature non vérifiée** : Assurez-vous que `STRIPE_WEBHOOK_SECRET` est bien configuré dans `.env.local`
4. **Événements non sélectionnés** : Dans Stripe Dashboard → Webhooks → votre endpoint, assurez-vous que ces événements sont activés :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## Solution rapide : Mettre à jour manuellement

Si vous voulez juste mettre vos comptes en Pro rapidement sans attendre le webhook :

```sql
-- Pour tous les utilisateurs qui devraient être Pro (à adapter selon vos besoins)
UPDATE users 
SET 
  subscription_plan = 'pro_monthly',
  subscription_start_date = NOW(),
  next_billing_date = NOW() + INTERVAL '1 month',
  free_scans_remaining = 3
WHERE user_id IN (
  -- Liste des user_id Clerk qui doivent être Pro
  'user_xxx',
  'user_yyy'
);
```

