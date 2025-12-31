# Restaurer le code ICI (dans le dossier actuel)

## Méthode la plus simple : Terminal intégré de Cursor

1. **Dans Cursor, ouvrez le terminal intégré :**
   - Appuyez sur `` Ctrl+` `` (Ctrl + backtick, la touche au-dessus de Tab)
   - Ou menu : `Terminal` → `New Terminal`

2. **Dans le terminal, tapez cette commande :**
   ```bash
   git checkout 9887344
   ```

3. **Appuyez sur Entrée**

4. **C'est tout !** Les fichiers dans Cursor seront automatiquement mis à jour

---

## Si Git dit "vous avez des modifications non commitées" :

Tapez d'abord :
```bash
git stash
```

Puis :
```bash
git checkout 9887344
```

Pour récupérer vos modifications plus tard :
```bash
git stash pop
```

---

## Pour créer une sauvegarde avant (RECOMMANDÉ) :

Avant de faire le checkout, tapez :
```bash
git branch sauvegarde-actuelle
```

Comme ça, vous pourrez revenir à votre version actuelle avec :
```bash
git checkout sauvegarde-actuelle
```

---

## Si ça ne fonctionne toujours pas :

Dites-moi l'erreur exacte que vous voyez et je trouverai une solution !


