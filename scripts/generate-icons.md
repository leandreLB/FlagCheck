# Instructions pour générer les icônes PWA

## Option 1 : Utiliser un générateur en ligne (Recommandé)

1. Allez sur https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Uploadez une image source (512x512px minimum, format PNG ou SVG)
3. Configurez les options :
   - Android Chrome: Toutes les tailles
   - iOS: 152x152 et 192x192
   - Favicon: 32x32 et 16x16
4. Téléchargez le package et extrayez les fichiers dans `public/icons/`

## Option 2 : Créer manuellement avec ImageMagick

Si vous avez ImageMagick installé :

```bash
# Créer un SVG de base (ou utiliser votre logo existant)
# Puis convertir en toutes les tailles nécessaires

convert logo.svg -resize 512x512 public/icons/icon-512x512.png
convert logo.svg -resize 384x384 public/icons/icon-384x384.png
convert logo.svg -resize 192x192 public/icons/icon-192x192.png
convert logo.svg -resize 152x152 public/icons/icon-152x152.png
convert logo.svg -resize 144x144 public/icons/icon-144x144.png
convert logo.svg -resize 128x128 public/icons/icon-128x128.png
convert logo.svg -resize 96x96 public/icons/icon-96x96.png
convert logo.svg -resize 72x72 public/icons/icon-72x72.png
```

## Option 3 : Utiliser un outil Node.js

Installez `sharp` et utilisez ce script :

```bash
npm install --save-dev sharp
```

Puis créez un script `scripts/generate-icons.js` (voir exemple ci-dessous)

## Design recommandé pour l'icône

- Fond : Gradient indigo (#6366F1) vers pink (#EC4899)
- Symbole : Drapeau rouge (🚩) ou étoile
- Style : Moderne, minimaliste, reconnaissable même en petite taille
- Format : PNG avec transparence
- Taille source : 512x512px minimum




