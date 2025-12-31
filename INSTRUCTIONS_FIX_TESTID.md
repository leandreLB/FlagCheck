# Instructions pour ajouter la colonne testid

## Le problème

La table `self_tests` existe déjà mais elle n'a pas la colonne `testid`. Il faut l'ajouter.

## Solution

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur **Supabase Dashboard** → votre projet
2. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le script de correction

1. Cliquez sur **New query**
2. Copiez-collez le contenu du fichier **`fix_add_testid_column.sql`**
3. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier

Le script va :
- ✅ Créer la table si elle n'existe pas
- ✅ Ajouter la colonne `testid` si elle n'existe pas
- ✅ Générer des UUID pour les enregistrements existants (si vous en avez)
- ✅ Créer les index nécessaires
- ✅ Afficher la structure finale de la table

Vous devriez voir un tableau avec toutes les colonnes, y compris `testid`.

## C'est tout !

Une fois le script exécuté, la colonne `testid` sera présente et le quiz devrait fonctionner correctement.


