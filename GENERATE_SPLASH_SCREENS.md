# 🚀 Guide de génération des Splash Screens iOS pour FlagCheck

## ✅ Configuration actuelle

Les meta tags `apple-touch-startup-image` sont déjà configurés dans `app/layout.tsx` pour les tailles suivantes :

### Meta tags configurés :

1. **iPhone 14 / 15 / 13 / 12** (1170x2532px)
   - Portrait : `/splash/iphone-14-portrait.png`
   - Landscape : `/splash/iphone-14-landscape.png`

2. **iPhone 13 mini / 12 mini / 11 Pro / XS / X** (1125x2436px)
   - Portrait : `/splash/iphone-13-mini-portrait.png`
   - Landscape : `/splash/iphone-13-mini-landscape.png`

3. **iPhone 14 Pro / 15 Pro** (1179x2556px)
   - Portrait : `/splash/iphone-14-pro-portrait.png`
   - Landscape : `/splash/iphone-14-pro-landscape.png`

4. **iPhone 14 Pro Max / 15 Pro Max** (1290x2796px)
   - Portrait : `/splash/iphone-14-pro-max-portrait.png`
   - Landscape : `/splash/iphone-14-pro-max-landscape.png`

5. **iPhone 8 / 7 / 6s / 6** (750x1334px)
   - Portrait : `/splash/iphone-8-portrait.png`
   - Landscape : `/splash/iphone-8-landscape.png`

6. **Fallback** (1170x2532px)
   - `/splash/default.png`

## 📝 Spécifications de design

Chaque image doit avoir :

- **Fond** : Noir pur (#000000)
- **Logo** : "FlagCheck" centré verticalement et horizontalement
  - Police : Inter (ou similaire)
  - Poids : 900 (Black)
  - Couleur : Blanc (#FFFFFF)
  - Effet : Drop shadow avec glow rose/violet
  - Taille relative : Environ 15-20% de la hauteur de l'écran
- **Pas de loader** : Les splash screens iOS sont statiques (pas d'animation)

## 🎨 Options pour créer les images

### Option 1 : Outil en ligne (Recommandé)

Utilisez un générateur PWA comme :
- **PWA Asset Generator** : https://progressier.com/pwa-asset-generator
- **RealFaviconGenerator** : https://realfavicongenerator.net/
- **App Icon Generator** : https://www.appicon.co/

### Option 2 : Figma/Sketch/Photoshop

1. Créez un canvas aux dimensions exactes
2. Ajoutez un rectangle noir (#000000) en arrière-plan
3. Ajoutez le texte "FlagCheck" au centre :
   - Font: Inter Black (900)
   - Size: ~120-180px selon la taille de l'écran
   - Color: #FFFFFF
   - Text shadow: 0 0 40px rgba(99, 102, 241, 0.8)
4. Exportez en PNG pour chaque taille

### Option 3 : Script Node.js avec Sharp

1. Installez sharp : `npm install sharp --save-dev`
2. Utilisez le template HTML dans `scripts/create-splash-template.html`
3. Créez un script qui génère les images (voir exemple ci-dessous)

### Option 4 : Template SVG

Le fichier `public/splash/logo-template.svg` peut être utilisé comme base.

## 📁 Structure finale

Après génération, votre dossier `public/splash/` doit contenir :

```
public/
  splash/
    ├── iphone-14-portrait.png (1170x2532)
    ├── iphone-14-landscape.png (2532x1170)
    ├── iphone-13-mini-portrait.png (1125x2436)
    ├── iphone-13-mini-landscape.png (2436x1125)
    ├── iphone-14-pro-portrait.png (1179x2556)
    ├── iphone-14-pro-landscape.png (2556x1179)
    ├── iphone-14-pro-max-portrait.png (1290x2796)
    ├── iphone-14-pro-max-landscape.png (2796x1290)
    ├── iphone-8-portrait.png (750x1334)
    ├── iphone-8-landscape.png (1334x750)
    └── default.png (1170x2532)
```

## 🧪 Tester les splash screens

1. Ajoutez votre PWA à l'écran d'accueil iOS
2. Fermez complètement l'application (swipe up)
3. Rouvrez l'application depuis l'icône
4. La splash screen doit s'afficher immédiatement

## ⚠️ Notes importantes

- Les images doivent être en PNG
- Les dimensions doivent être exactes (pas de redimensionnement automatique)
- Le fond doit être noir (#000000) pour correspondre au thème de l'app
- Testez sur de vrais appareils iOS pour vérifier l'affichage correct


