# Configuration PWA - FlagCheck

L'application a été configurée pour être installable en tant que PWA (Progressive Web App) sur mobile.

## ✅ Ce qui a été fait

1. **next-pwa installé** dans `package.json`
2. **manifest.json créé** dans `public/manifest.json`
3. **next.config.ts configuré** avec next-pwa
4. **layout.tsx mis à jour** avec les meta tags PWA
5. **Structure d'icônes créée** dans `public/icons/`

## 📋 Prochaines étapes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Générer les icônes PWA

Vous devez créer les fichiers d'icônes dans `public/icons/` :

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Option rapide :** Utilisez https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator

1. Uploadez une image source (512x512px minimum)
2. Téléchargez le package généré
3. Extrayez les fichiers dans `public/icons/`

### 3. Build et test

```bash
# Build de production (le service worker est généré uniquement en production)
npm run build
npm start
```

### 4. Tester l'installation

**Sur mobile (Android Chrome) :**
1. Ouvrez l'app dans Chrome
2. Menu → "Ajouter à l'écran d'accueil"
3. L'app devrait s'installer

**Sur mobile (iOS Safari) :**
1. Ouvrez l'app dans Safari
2. Partage → "Sur l'écran d'accueil"
3. L'app devrait s'installer

**Sur desktop (Chrome/Edge) :**
1. Ouvrez l'app dans le navigateur
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. L'app devrait s'installer

## 🔧 Configuration

### Service Worker

Le service worker est automatiquement généré par next-pwa lors du build. Il est désactivé en développement pour faciliter le debugging.

### Cache Strategy

- **NetworkFirst** : Essaie le réseau d'abord, puis le cache si hors ligne
- **Max entries** : 200 entrées en cache maximum

### Personnalisation

Vous pouvez modifier la configuration dans `next.config.ts` :

```typescript
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // ... autres options
});
```

## 📱 Fonctionnalités PWA

- ✅ Installation sur mobile et desktop
- ✅ Mode standalone (sans barre d'adresse)
- ✅ Service worker pour le mode hors ligne
- ✅ Cache des ressources
- ✅ Thème color personnalisé
- ✅ Icônes adaptatives
- ✅ Raccourcis (shortcuts)

## 🐛 Dépannage

### Le service worker ne se charge pas

- Vérifiez que vous êtes en mode production (`npm run build && npm start`)
- Vérifiez la console du navigateur pour les erreurs
- Videz le cache du navigateur

### Les icônes ne s'affichent pas

- Vérifiez que tous les fichiers d'icônes existent dans `public/icons/`
- Vérifiez les chemins dans `manifest.json`
- Vérifiez que les fichiers sont accessibles via `/icons/icon-XXXxXXX.png`

### L'app ne s'installe pas

- Vérifiez que l'app est servie en HTTPS (requis pour PWA)
- Vérifiez que le manifest.json est valide
- Vérifiez que le service worker est enregistré

## 📚 Ressources

- [next-pwa documentation](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest](https://web.dev/add-manifest/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

