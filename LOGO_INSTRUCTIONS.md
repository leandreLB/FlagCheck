# Instructions pour ajouter les logos dans la splash screen

## Étape 1 : Sauvegarder les logos

1. Téléchargez/sauvegardez les deux images de logo que vous avez
2. Placez-les dans le dossier `public/` avec les noms :
   - `logo_192.png` (pour le logo 192x192)
   - `logo_512.png` (pour le logo 512x512)

## Étape 2 : Copier dans le dossier icons

Une fois les fichiers dans `public/`, exécutez ces commandes PowerShell (depuis la racine du projet) :

```powershell
# Copier les logos dans le dossier icons avec les bons noms
Copy-Item "public\logo_192.png" "public\icons\icon-192.png" -Force
Copy-Item "public\logo_512.png" "public\icons\icon-512.png" -Force
Copy-Item "public\logo_512.png" "public\icons\icon-180.png" -Force
```

## Étape 3 : Vérification

Vérifiez que ces fichiers existent :
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-180.png`

Le code est déjà configuré pour utiliser `/icons/icon-192.png` dans la splash screen !


