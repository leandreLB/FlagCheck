# Comment récupérer une version antérieure du code

## Méthode 1 : Utiliser l'interface Git de Cursor/VS Code (RECOMMANDÉE)

1. **Ouvrir l'historique Git dans Cursor :**
   - Cliquez sur l'icône Source Control (Ctrl+Shift+G)
   - Cliquez sur l'icône "..." en haut à droite du panneau Source Control
   - Sélectionnez "View History" ou "Show Git Graph"

2. **Ou utilisez la palette de commandes :**
   - Appuyez sur `Ctrl+Shift+P` (ou `Cmd+Shift+P` sur Mac)
   - Tapez "Git: View History"
   - Sélectionnez un commit antérieur
   - Clic droit → "Checkout Commit" pour revenir à cette version

## Méthode 2 : Utiliser GitHub directement

1. **Aller sur GitHub :**
   - Ouvrez https://github.com/leandreLB/FlagCheck
   - Cliquez sur "Commits" ou sur l'icône de l'horloge à côté du bouton "Code"

2. **Trouver le bon commit :**
   - Parcourez l'historique des commits
   - Trouvez le commit correspondant à la version qui fonctionne sur Vercel
   - Notez le hash du commit (les 7 premiers caractères suffisent)

3. **Télécharger le code de ce commit :**
   - Cliquez sur le commit
   - Cliquez sur "Browse files" en haut à droite
   - Cliquez sur le bouton vert "Code" → "Download ZIP"
   - Décompressez dans un nouveau dossier et ouvrez-le dans Cursor

## Méthode 3 : Utiliser Git en ligne de commande

Si vous avez Git installé (Git Bash, ou dans le terminal) :

```bash
# 1. Voir l'historique des commits
git log --oneline -20

# 2. Revenir à un commit spécifique (remplacez COMMIT_HASH par le hash du commit)
git checkout COMMIT_HASH

# 3. Pour créer une nouvelle branche à partir de ce commit (recommandé)
git checkout -b ancienne-version COMMIT_HASH

# 4. Si vous voulez récupérer depuis GitHub
git fetch origin
git checkout origin/main  # ou le nom de votre branche
```

## Méthode 4 : Utiliser Vercel pour voir les déploiements

1. **Aller sur Vercel :**
   - Connectez-vous sur https://vercel.com
   - Ouvrez votre projet FlagCheck
   - Allez dans l'onglet "Deployments"

2. **Trouver le déploiement qui fonctionne :**
   - Parcourez l'historique des déploiements
   - Cliquez sur un déploiement qui fonctionnait bien
   - Cliquez sur "Source" ou "Git Commit" pour voir le commit associé

3. **Récupérer le code :**
   - Notez le hash du commit
   - Utilisez la Méthode 2 ou 3 pour récupérer ce commit

## Méthode 5 : Utiliser l'extension GitLens (si installée)

1. Ouvrez le panneau Source Control
2. Dans GitLens, vous pouvez voir l'historique complet
3. Clic droit sur un commit → "Checkout Commit..."

## ⚠️ IMPORTANT : Sauvegarder vos modifications actuelles

Avant de revenir à une version antérieure, sauvegardez votre travail actuel :

1. **Créer une branche de sauvegarde :**
   ```bash
   git checkout -b sauvegarde-modifications-actuelles
   git add .
   git commit -m "Sauvegarde avant retour en arrière"
   ```

2. **Ou simplement noter quels fichiers vous avez modifiés manuellement**

## Recommandation

Je recommande la **Méthode 2 (GitHub)** car elle est la plus simple et ne nécessite pas de connaître Git en détail. Vous pouvez télécharger le code de n'importe quel commit directement depuis GitHub.



