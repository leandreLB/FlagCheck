# Guide de création des Splash Screens iOS pour FlagCheck

## 📱 Dimensions des images nécessaires

Vous devez créer des images PNG avec le logo FlagCheck centré sur fond noir (#000000) pour chaque taille ci-dessous :

### iPhone 14 Pro Max / 15 Pro Max
- **Portrait** : 1290 x 2796 px → `/public/splash/iphone-14-pro-max-portrait.png`
- **Landscape** : 2796 x 1290 px → `/public/splash/iphone-14-pro-max-landscape.png`

### iPhone 14 Pro / 15 Pro
- **Portrait** : 1179 x 2556 px → `/public/splash/iphone-14-pro-portrait.png`
- **Landscape** : 2556 x 1179 px → `/public/splash/iphone-14-pro-landscape.png`

### iPhone 14 Plus / 15 Plus
- **Portrait** : 1284 x 2778 px → `/public/splash/iphone-14-plus-portrait.png`
- **Landscape** : 2778 x 1284 px → `/public/splash/iphone-14-plus-landscape.png`

### iPhone 14 / 15
- **Portrait** : 1170 x 2532 px → `/public/splash/iphone-14-portrait.png`
- **Landscape** : 2532 x 1170 px → `/public/splash/iphone-14-landscape.png`

### iPhone 13 Pro Max / 12 Pro Max
- **Portrait** : 1284 x 2778 px → `/public/splash/iphone-13-pro-max-portrait.png`
- **Landscape** : 2778 x 1284 px → `/public/splash/iphone-13-pro-max-landscape.png`

### iPhone 13 Pro / 12 Pro
- **Portrait** : 1170 x 2532 px → `/public/splash/iphone-13-pro-portrait.png`
- **Landscape** : 2532 x 1170 px → `/public/splash/iphone-13-pro-landscape.png`

### iPhone 13 / 12
- **Portrait** : 1170 x 2532 px → `/public/splash/iphone-13-portrait.png`
- **Landscape** : 2532 x 1170 px → `/public/splash/iphone-13-landscape.png`

### iPhone 13 mini / 12 mini
- **Portrait** : 1125 x 2436 px → `/public/splash/iphone-13-mini-portrait.png`
- **Landscape** : 2436 x 1125 px → `/public/splash/iphone-13-mini-landscape.png`

### iPhone 11 Pro Max / XS Max
- **Portrait** : 1242 x 2688 px → `/public/splash/iphone-11-pro-max-portrait.png`
- **Landscape** : 2688 x 1242 px → `/public/splash/iphone-11-pro-max-landscape.png`

### iPhone 11 Pro / XS / X
- **Portrait** : 1125 x 2436 px → `/public/splash/iphone-11-pro-portrait.png`
- **Landscape** : 2436 x 1125 px → `/public/splash/iphone-11-pro-landscape.png`

### iPhone 11 / XR
- **Portrait** : 828 x 1792 px → `/public/splash/iphone-11-portrait.png`
- **Landscape** : 1792 x 828 px → `/public/splash/iphone-11-landscape.png`

### iPhone SE (3rd gen) / 8 Plus
- **Portrait** : 1242 x 2208 px → `/public/splash/iphone-8-plus-portrait.png`
- **Landscape** : 2208 x 1242 px → `/public/splash/iphone-8-plus-landscape.png`

### iPhone SE (2nd/3rd gen) / 8 / 7 / 6s / 6
- **Portrait** : 750 x 1334 px → `/public/splash/iphone-8-portrait.png`
- **Landscape** : 1334 x 750 px → `/public/splash/iphone-8-landscape.png`

### Fallback (par défaut)
- **Taille recommandée** : 1284 x 2778 px → `/public/splash/default.png`

## 🎨 Style à appliquer

1. **Fond** : Noir pur (#000000)
2. **Logo FlagCheck** : 
   - Centré verticalement et horizontalement
   - Texte blanc avec le même style que dans l'app
   - Même police et même taille relative
   - Éventuellement un effet de glow rose/violet autour du logo
3. **Pas de loader** : Les splash screens iOS ne doivent contenir que le logo (pas de loader animé)

## 📁 Structure des dossiers

Créez le dossier suivant dans votre projet :
```
public/
  splash/
    ├── iphone-14-pro-max-portrait.png
    ├── iphone-14-pro-max-landscape.png
    ├── iphone-14-pro-portrait.png
    ├── iphone-14-pro-landscape.png
    ├── iphone-14-plus-portrait.png
    ├── iphone-14-plus-landscape.png
    ├── iphone-14-portrait.png
    ├── iphone-14-landscape.png
    ├── iphone-13-pro-max-portrait.png
    ├── iphone-13-pro-max-landscape.png
    ├── iphone-13-pro-portrait.png
    ├── iphone-13-pro-landscape.png
    ├── iphone-13-portrait.png
    ├── iphone-13-landscape.png
    ├── iphone-13-mini-portrait.png
    ├── iphone-13-mini-landscape.png
    ├── iphone-11-pro-max-portrait.png
    ├── iphone-11-pro-max-landscape.png
    ├── iphone-11-pro-portrait.png
    ├── iphone-11-pro-landscape.png
    ├── iphone-11-portrait.png
    ├── iphone-11-landscape.png
    ├── iphone-8-plus-portrait.png
    ├── iphone-8-plus-landscape.png
    ├── iphone-8-portrait.png
    ├── iphone-8-landscape.png
    └── default.png
```

## 🔧 Outils recommandés

- **Figma** : Pour créer les designs avec des canvas aux bonnes dimensions
- **Photoshop** : Export en PNG avec fond transparent ou noir
- **ImageMagick** : Pour batch processing si vous créez une image de base
- **Online tools** : Utilisez des outils comme "PWA Asset Generator" qui peuvent créer automatiquement toutes les tailles à partir d'une image source

## ⚠️ Notes importantes

- Les dimensions sont en pixels logiques multipliés par le device-pixel-ratio
- Les images doivent être en PNG avec transparence ou fond noir
- Testez sur de vrais appareils iOS pour vérifier que les splash screens s'affichent correctement
- Le meta tag `viewport-fit=cover` dans le layout permet aux splash screens de couvrir tout l'écran, y compris les zones sûres


