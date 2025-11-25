# Splash Screens iOS - FlagCheck

## Images nécessaires

Les images suivantes doivent être créées et placées dans ce dossier:

- `iphone-14-portrait.png` - 1170x2532px (iPhone 14/15/13/12)
- `iphone-14-landscape.png` - 2532x1170px (iPhone 14/15/13/12)
- `iphone-13-mini-portrait.png` - 1125x2436px (iPhone 13 mini/12 mini/11 Pro/XS/X)
- `iphone-13-mini-landscape.png` - 2436x1125px (iPhone 13 mini/12 mini/11 Pro/XS/X)
- `iphone-14-pro-portrait.png` - 1179x2556px (iPhone 14 Pro/15 Pro)
- `iphone-14-pro-landscape.png` - 2556x1179px (iPhone 14 Pro/15 Pro)
- `iphone-14-pro-max-portrait.png` - 1290x2796px (iPhone 14 Pro Max/15 Pro Max)
- `iphone-14-pro-max-landscape.png` - 2796x1290px (iPhone 14 Pro Max/15 Pro Max)
- `iphone-8-portrait.png` - 750x1334px (iPhone 8/7/6s/6)
- `iphone-8-landscape.png` - 1334x750px (iPhone 8/7/6s/6)
- `default.png` - 1170x2532px (Fallback)

## Comment créer les images

### Option 1: Utiliser un outil en ligne
1. Allez sur https://www.appicon.co/ ou https://www.pwabuilder.com/imageGenerator
2. Utilisez le logo FlagCheck comme source
3. Générez toutes les tailles

### Option 2: Utiliser Figma/Photoshop
1. Ouvrez `logo-template.svg` dans votre outil de design
2. Créez un canvas de chaque taille avec fond noir (#000000)
3. Centrez le logo FlagCheck
4. Exportez en PNG

### Option 3: Utiliser ImageMagick (si installé)
```bash
# Installer ImageMagick d'abord
# Puis créer une image de base logo.png (fond noir + logo centré)
for size in iphone-14-portrait iphone-14-landscape iphone-13-mini-portrait iphone-13-mini-landscape iphone-14-pro-portrait iphone-14-pro-landscape iphone-14-pro-max-portrait iphone-14-pro-max-landscape iphone-8-portrait iphone-8-landscape default; do
  # Convertir selon les dimensions
done
```

## Style des images

- **Fond**: Noir pur (#000000)
- **Logo**: Texte "FlagCheck" avec dégradé rose/violet (comme dans l'app)
- **Position**: Centré verticalement et horizontalement
- **Format**: PNG avec transparence ou fond noir
- **Taille du logo**: Environ 30-40% de la largeur de l'écran

Une fois les images créées, les meta tags dans `app/layout.tsx` les chargeront automatiquement.
