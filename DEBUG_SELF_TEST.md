# Debug : Erreur "Failed to create self test"

## Prochaines étapes pour diagnostiquer

Après avoir amélioré le code, voici ce qu'il faut faire :

### 1. Réessayer le test

Répondez aux questions du quiz à nouveau et regardez :
- La console du navigateur (F12 → Console) pour voir les détails de l'erreur
- Le terminal serveur (où `npm run dev` tourne) pour voir les logs serveur

### 2. Vérifier les logs

Les logs serveur devraient maintenant afficher :
- Les données envoyées à Supabase
- Le code d'erreur PostgreSQL
- Les détails de l'erreur
- Le hint (si disponible)

### 3. Erreurs possibles

Les erreurs les plus probables :

#### A. Problème de format de date
Si vous voyez une erreur liée à `date` :
- Le champ `date` attend un `TIMESTAMPTZ`
- Le code envoie une string ISO (ex: "2024-01-01T12:00:00.000Z")
- Supabase devrait normalement le convertir automatiquement

#### B. Problème de type pour answers
Si vous voyez une erreur liée à `answers` :
- Le champ `answers` attend un `INTEGER[]` (tableau d'entiers)
- Le code envoie un tableau JavaScript
- Vérifiez que les valeurs sont bien des nombres, pas des strings

#### C. Problème de contrainte UNIQUE sur testid
Si vous voyez "duplicate key value violates unique constraint" :
- La colonne `testid` a une contrainte UNIQUE
- Cela ne devrait pas arriver car on génère un UUID unique à chaque fois

#### D. Problème de RLS (Row Level Security)
Si vous voyez une erreur de permission :
- Vérifiez que `SUPABASE_SERVICE_KEY` est bien configuré dans `.env.local`
- Le service key contourne RLS, donc ça ne devrait pas être un problème

### 4. Vérifier la structure de la table

Exécutez cette requête dans Supabase SQL Editor pour vérifier la structure :

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'self_tests'
ORDER BY ordinal_position;
```

Vous devriez voir :
- `id` (uuid)
- `user_id` (text)
- `testid` (text)
- `date` (timestamp with time zone)
- `scores` (jsonb)
- `answers` (ARRAY)
- `completed` (boolean)
- `created_at` (timestamp with time zone)

### 5. Test manuel d'insertion

Pour tester si l'insertion fonctionne, essayez cette requête dans Supabase SQL Editor :

```sql
INSERT INTO self_tests (
  user_id,
  testid,
  date,
  scores,
  answers,
  completed
) VALUES (
  'test_user_id',
  gen_random_uuid()::text,
  NOW(),
  '{"communication": 2.5, "boundaries": 3.0, "attachment": 2.0, "honesty": 1.5, "toxic": 4.0, "total": 2.6}'::jsonb,
  ARRAY[1, 2, 3, 2, 1, 3, 4, 2, 1, 3, 2, 1],
  true
);
```

Si ça fonctionne, le problème vient peut-être du format des données envoyées depuis le code.


