# Fix : Le test "Am I a red flag?" ne se crée pas

## Problème identifié

Le test ne peut pas être sauvegardé dans la base de données car la table `self_tests` n'existe probablement pas dans Supabase.

## Solution

### Étape 1 : Créer la table dans Supabase

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu du fichier **`create_self_tests_table_safe.sql`** (version sûre sans opérations destructives)
3. Cliquez sur **Run** pour exécuter le script

**Note :** Si vous préférez la version complète avec désactivation RLS, utilisez `create_self_tests_table.sql` mais vous devrez confirmer l'avertissement.

Le script va :
- Créer la table `self_tests` avec la structure correcte
- Créer les index nécessaires
- Désactiver RLS (car vous utilisez Clerk, pas Supabase Auth)

### Étape 2 : Vérifier que la table est créée

Exécutez cette requête pour vérifier :

```sql
SELECT * FROM self_tests LIMIT 1;
```

Si vous voyez une table vide, c'est normal ! Cela confirme que la table existe.

### Étape 3 : Tester à nouveau

1. Allez dans l'application → onglet **"Me"**
2. Cliquez sur **"Take the test"**
3. Répondez aux 12 questions
4. Vérifiez que les résultats s'affichent

## Structure de la table

La table `self_tests` contient :
- `id` : UUID (clé primaire)
- `user_id` : TEXT (ID Clerk de l'utilisateur)
- `testId` : TEXT (UUID unique pour chaque test)
- `date` : TIMESTAMPTZ (date du test)
- `scores` : JSONB (scores par catégorie + total)
- `answers` : INTEGER[] (tableau de 12 réponses 1-5)
- `completed` : BOOLEAN (toujours true)
- `created_at` : TIMESTAMPTZ (date de création)

## Erreurs possibles

### Erreur : "Database table not found"
→ La table n'existe pas. Exécutez le script `create_self_tests_table.sql`

### Erreur : "permission denied"
→ Vérifiez que `SUPABASE_SERVICE_KEY` est bien configuré dans `.env.local`

### Erreur : "column does not exist"
→ La structure de la table est incorrecte. Supprimez la table et recréez-la avec le script

## Vérification du service key

Assurez-vous que dans votre `.env.local`, vous avez :

```env
SUPABASE_SERVICE_KEY=votre_service_key_ici
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
```

**Important** : Utilisez le **Service Key** (service_role), pas l'anon key. Le service key contourne RLS et permet à l'API d'insérer des données.

