# Système de Parrainage - Configuration

## ✅ Ce qui a été implémenté

### 1. APIs créées

- **`/api/referral/my-code`** (GET) : Récupère ou génère le code de parrainage de l'utilisateur
- **`/api/referral/use-code`** (POST) : Permet d'utiliser un code de parrainage
- **`/api/referral/stats`** (GET) : Récupère les statistiques de parrainage (nombre de parrainés, etc.)

### 2. Section dans le profil

Une nouvelle section "Referral Program" a été ajoutée dans la page profil avec :
- Affichage du code de parrainage unique (6 caractères)
- Bouton pour copier le code
- Compteur de parrainés avec barre de progression
- Indication du nombre de parrainés restants pour obtenir 1 semaine de Pro gratuit
- Bouton pour entrer un code de parrainage (modale)

### 3. Fonctionnalités

- **Génération automatique** : Chaque utilisateur reçoit automatiquement un code unique de 6 caractères alphanumériques
- **Parrainage** : Quand quelqu'un utilise votre code, ça compte comme 1 parrainé
- **Récompense** : Tous les 3 parrainés, le parrain reçoit 1 semaine de Pro gratuit
- **Accumulation** : Si vous avez déjà du Pro gratuit, la nouvelle semaine s'ajoute

## 📋 Action requise : Ajouter les colonnes dans Supabase

### Étape 1 : Exécuter le script SQL

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Copiez-collez le contenu du fichier **`add_referral_columns.sql`**
3. Cliquez sur **Run**

Le script va :
- Ajouter la colonne `referral_code` (TEXT UNIQUE) si elle n'existe pas
- Ajouter la colonne `referred_by` (TEXT) si elle n'existe pas
- Créer les index nécessaires pour les performances

## 🎯 Fonctionnement

### Pour partager votre code

1. Allez dans **Profile**
2. Dans la section "Referral Program", vous verrez votre code (ex: `K7B2M9`)
3. Cliquez sur le bouton de copie pour copier le code
4. Partagez ce code avec vos amis

### Pour utiliser un code de parrainage

1. Allez dans **Profile**
2. Cliquez sur "Enter a referral code"
3. Entrez le code de 6 caractères
4. Cliquez sur "Apply Code"

### Récompenses

- Quand quelqu'un utilise votre code → +1 parrainé
- À chaque 3 parrainés → Vous recevez 1 semaine de Pro gratuit
- Si vous avez déjà du Pro gratuit, la nouvelle semaine s'ajoute à la fin

## 📝 Notes techniques

- Les codes sont générés automatiquement au premier appel de `/api/referral/my-code`
- Les codes sont uniques et en majuscules (6 caractères alphanumériques)
- Un utilisateur ne peut utiliser qu'un seul code de parrainage
- Un utilisateur ne peut pas utiliser son propre code
- Le système vérifie automatiquement tous les 3 parrainés et accorde 1 semaine de Pro gratuit

## 🚀 Prochaines étapes (optionnel)

Si vous voulez proposer la saisie d'un code lors de la création de compte, vous pouvez :
1. Créer une page `/welcome` qui s'affiche après l'inscription
2. Ou ajouter une modale après la première connexion qui propose d'entrer un code

Pour l'instant, les utilisateurs peuvent entrer leur code directement depuis le profil.


