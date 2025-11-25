# Génération des icônes PWA

## Méthode 1 : Script Node.js (Recommandé)

1. Installez `sharp` :
```bash
npm install --save-dev sharp
```

2. Exécutez le script :
```bash
node scripts/generate-icons.js
```

Le script générera automatiquement :
- `/public/icon-192.png` (192x192)
- `/public/icon-512.png` (512x512)
- `/public/apple-touch-icon.png` (180x180)
- `/public/favicon.png` (32x32 - renommez en .ico si nécessaire)

## Méthode 2 : Générateur en ligne

1. Allez sur https://realfavicongenerator.net/
2. Créez une image source 512x512px avec :
   - Fond : Dégradé indigo (#6366F1) vers rose (#EC4899)
   - Symbole : Drapeau rouge emoji (🚩) au centre
3. Téléchargez et placez les fichiers dans `/public/` :
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
   - `favicon.ico`

## Design des icônes

- **Fond** : Dégradé linéaire de indigo (#6366F1) à rose (#EC4899)
- **Symbole** : Drapeau rouge emoji (🚩) centré
- **Style** : Moderne, minimaliste, reconnaissable même en petite taille
- **Format** : PNG avec coins arrondis (20% du rayon)

## Vérification

Après génération, vérifiez que les fichiers suivants existent :
- ✅ `/public/icon-192.png`
- ✅ `/public/icon-512.png`
- ✅ `/public/apple-touch-icon.png`
- ✅ `/public/favicon.ico` (ou `.png`)



