# IMPORTANT : Configuration des icônes

Les icônes doivent être copiées dans le dossier `public/icons/` avec les noms suivants :
- icon-192.png (192x192 pixels)
- icon-512.png (512x512 pixels)  
- icon-180.png (180x180 pixels)

Ces icônes doivent avoir un fond OPAQUE de couleur #0F0F0F (pas de transparence).

## Action requise

Copiez manuellement les fichiers depuis `public/icon192.png` et `public/icon512.png` vers `public/icons/` avec les nouveaux noms.

Ou utilisez cette commande dans PowerShell (depuis la racine du projet) :

```powershell
New-Item -ItemType Directory -Force -Path "public\icons"
Copy-Item "public\icon192.png" "public\icons\icon-192.png"
Copy-Item "public\icon512.png" "public\icons\icon-512.png"
Copy-Item "public\icon512.png" "public\icons\icon-180.png"
```

Ensuite, vérifiez que les fichiers sont accessibles :
- http://localhost:3000/icons/icon-192.png
- http://localhost:3000/icons/icon-512.png
- http://localhost:3000/icons/icon-180.png


