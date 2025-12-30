# Instructions pour restaurer le commit dsfbdb

Le commit que vous voulez restaurer est : `988734494c81f6c8d4cd6b89285c93862f261ba4`

## Méthode rapide via Cursor (Palette de commandes)

1. Appuyez sur `Ctrl+Shift+P` pour ouvrir la palette de commandes
2. Tapez : `Git: Checkout to...`
3. Entrez : `9887344` (les 7 premiers caractères suffisent)
4. Appuyez sur Entrée

Cursor va automatiquement restaurer tous les fichiers à cette version !

## Alternative : Modifier HEAD manuellement

Si la méthode ci-dessus ne fonctionne pas, vous pouvez aussi :

1. Ouvrez le fichier `.git/HEAD` dans Cursor
2. Remplacez le contenu par : `988734494c81f6c8d4cd6b89285c93862f261ba4`
3. Puis dans la palette de commandes (`Ctrl+Shift+P`), exécutez : `Git: Checkout`

Mais la première méthode (Git: Checkout to...) est la plus simple !



