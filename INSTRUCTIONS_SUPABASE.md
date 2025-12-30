# Instructions pour créer la table dans Supabase

## Étape 1 : Ouvrir SQL Editor

1. Allez sur **Supabase Dashboard** (https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **SQL Editor**

## Étape 2 : Exécuter le script

1. Cliquez sur **New query** (nouvelle requête)
2. Copiez-collez le contenu du fichier **`create_self_tests_simple.sql`**
3. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

## Étape 3 : Vérifier que ça a fonctionné

Après avoir exécuté le script, vous devriez voir :
- Un message de confirmation (pas d'erreur)
- Un tableau avec les colonnes de la table : `id`, `user_id`, `testid`, `date`, `scores`, `answers`, `completed`, `created_at`

## Si la table existe déjà

Si vous avez déjà créé la table précédemment (même avec une structure différente), le script utilisera `CREATE TABLE IF NOT EXISTS` donc :
- ✅ Si la table n'existe pas → elle sera créée
- ✅ Si la table existe déjà → rien ne sera modifié (pas d'erreur)

Dans ce cas, vous pouvez vérifier la structure avec :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'self_tests';
```

Si la colonne s'appelle `testid` (minuscules), c'est parfait ! Le code devrait fonctionner.

## C'est tout !

Une fois la table créée, le quiz "Am I a red flag?" devrait fonctionner correctement dans l'application.

