# Configuration Supabase pour Self Tests

## Table `self_tests`

Créez cette table dans votre base de données Supabase avec la structure suivante :

```sql
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

-- RLS (Row Level Security) - Autoriser la lecture et écriture pour l'utilisateur authentifié
ALTER TABLE self_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own self tests"
  ON self_tests FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own self tests"
  ON self_tests FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own self tests"
  ON self_tests FOR UPDATE
  USING (auth.uid()::text = user_id);
```

**Note:** Comme l'application utilise Clerk pour l'authentification et non l'auth Supabase, vous devrez peut-être désactiver RLS ou utiliser une approche différente selon votre configuration. Si vous utilisez le service key Supabase (comme dans `lib/supabase.ts`), RLS peut être désactivé car le service key contourne RLS.

## Structure du champ `scores` (JSONB)

```json
{
  "communication": 3.5,
  "boundaries": 2.0,
  "attachment": 4.5,
  "honesty": 3.0,
  "toxic": 5.0,
  "total": 3.6
}
```

## Structure du champ `answers` (INTEGER[])

Un tableau de 12 nombres entre 1 et 5, par exemple:
```
[1, 2, 3, 4, 2, 1, 3, 2, 4, 3, 2, 1]
```

