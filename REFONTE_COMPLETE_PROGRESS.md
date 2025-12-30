# Progrès de la refonte complète FlagCheck

## ✅ Changements effectués

### 1. Nouveau système de pricing à deux tiers

- ✅ **lib/subscription.ts** : Mis à jour pour supporter `pro_monthly` et `pro_annual` au lieu de `pro` et `lifetime`
- ✅ **Fonction hasProAccess** : Créée pour vérifier l'accès Pro (prend en compte les plans et freeProUntil pour parrainage)
- ✅ **Fonction decrementFreeScans** : Créée pour décrémenter les scans gratuits dans Firestore
- ✅ **app/api/subscription/check/route.ts** : Mis à jour pour retourner le nouveau format
- ✅ **app/api/stripe/create-checkout/route.ts** : Mis à jour pour supporter `pro_monthly` et `pro_annual`
- ✅ **app/api/stripe/webhook/route.ts** : Mis à jour pour gérer les nouveaux plans et utiliser `subscription_plan` au lieu de `subscription_status`
- ✅ **app/(protected)/paywall/page.tsx** : Nouvel écran PaywallScreen avec toggle Monthly/Annual et les deux plans

### Structure de données Firestore mise à jour

Les champs utilisateurs doivent maintenant inclure :
- `subscription_plan` : "free" | "pro_monthly" | "pro_annual"
- `free_scans_remaining` : nombre (3 par défaut pour nouveaux users)
- `subscription_start_date` : timestamp ISO
- `next_billing_date` : timestamp ISO
- `free_pro_until` : timestamp ISO (pour parrainage)

## 🔄 Changements en cours / À compléter

### 2. Système freemium (3 scans totaux)

**Fichiers à modifier :**
- [ ] **app/api/analyze/route.ts** : Déjà partiellement modifié, mais doit décrémenter freeScansRemaining après un scan réussi
- [ ] **app/api/analyze-text/route.ts** : Même chose pour les scans textuels
- [ ] **app/(protected)/page.tsx** : Mettre à jour pour utiliser le nouveau système et afficher "X free scans remaining"
- [ ] **app/(protected)/me/page.tsx** : Bloquer l'accès au quiz pour les utilisateurs gratuits (afficher un écran locked)
- [ ] **app/(protected)/me/test/page.tsx** : Déjà modifié pour bloquer les gratuits, mais vérifier que ça fonctionne avec hasProAccess

**Logique à implémenter :**
- Nouveaux utilisateurs commencent avec `free_scans_remaining = 3`
- Chaque scan (image ou texte) décrémente ce compteur
- Quand il atteint 0, afficher le paywall
- Les utilisateurs Pro n'ont pas cette limitation

### 3. Système PWA install

**Fichiers à créer :**
- [ ] **lib/utils/pwaInstall.ts** : Gestionnaire du prompt d'installation
- [ ] **app/(protected)/welcome/page.tsx** : Écran de bienvenue avec installation
- [ ] **components/InstallBanner.tsx** : Banner de rappel pour installation
- [ ] **app/layout.tsx** : Intégrer init() de pwaInstall au démarrage

**Flow d'inscription :**
- [ ] Modifier le flow pour rediriger vers `/welcome` après création de compte
- [ ] Vérifier `hasSeenWelcome` dans Firestore
- [ ] Sauvegarder `hasInstalledApp` quand l'installation réussit

### 4. Fix de la splash screen

**Fichiers à modifier :**
- [ ] **public/manifest.json** : Vérifier/créer avec background_color="#000000" et tous les champs requis
- [ ] **app/layout.tsx** : Ajouter les meta tags iOS (apple-mobile-web-app-capable, etc.)
- [ ] **app/layout.tsx ou _document.tsx** : Ajouter le CSS inline dans le head pour éliminer le flash blanc
- [ ] **public/index.html** (si existe) ou créer un composant SplashScreen : Ajouter le HTML de splash screen
- [ ] **app/layout.tsx ou fichier principal** : Code pour cacher la splash screen après chargement

**Notes importantes :**
- `background_color` dans manifest.json doit être EXACTEMENT "#000000" pour matcher le fond
- Le CSS inline doit être dans le `<head>` AVANT tout autre CSS
- La splash screen HTML doit être dans le body AVANT le root div

### 5. Système de partage viral

**Fichiers à créer/modifier :**
- [ ] **components/ShareResultImage.tsx** : Composant React pour générer l'image de partage (1080x1920)
- [ ] **app/(protected)/me/test/page.tsx** : Ajouter la section "Share your results" après les résultats
- [ ] Utiliser `html-to-image` ou `dom-to-image` pour capturer le composant en image
- [ ] Utiliser `navigator.share` pour partager l'image
- [ ] Tracking des partages dans analytics et Firestore

**Design de l'image :**
- Fond dégradé noir vers violet foncé
- Logo FlagCheck en haut
- Score en très gros au centre avec emoji drapeau
- "Am I a red flag?" en dessous
- Watermark "flagcheck.app" en bas
- Optionnel : petits cercles/barres pour les 5 catégories

### 6. Programme de parrainage

**Fichiers à créer :**
- [ ] **app/(protected)/referral/page.tsx** : Écran de parrainage
- [ ] **lib/services/referralService.ts** : Logique de génération de codes et gestion des parrains
- [ ] **app/api/referral/[...]** : APIs pour gérer les codes de parrainage

**Structure Firestore :**
- `users.referral_code` : Code unique (6 caractères alphanumériques)
- `users.referred_by` : User ID du parrain (ou null)
- `users.referred_users` : Array des user IDs parrainés
- `users.free_pro_until` : Date jusqu'à laquelle l'utilisateur a Pro gratuit

**Logique :**
- Générer un code unique à la création de compte
- Détecter le paramètre `?ref=ABC123` dans l'URL d'inscription
- Sauvegarder `referred_by` lors de l'inscription
- Calculer le temps Pro gratuit : 1 semaine par tranche de 3 amis
- Mettre à jour `free_pro_until` quand nécessaire

## 📝 Notes importantes

### Variables d'environnement à ajouter

```env
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ANNUAL_PRICE_ID=price_yyy
```

### Migration des données existantes

Pour migrer les utilisateurs existants :
```sql
-- Migrer subscription_status vers subscription_plan
UPDATE users 
SET subscription_plan = CASE 
  WHEN subscription_status = 'pro' THEN 'pro_monthly'
  WHEN subscription_status = 'lifetime' THEN 'pro_monthly'  -- ou pro_annual selon choix
  ELSE 'free'
END,
free_scans_remaining = 3
WHERE subscription_plan IS NULL;
```

### Prochaines étapes prioritaires

1. **Compléter le système freemium** (scans gratuits et blocage quiz)
2. **Créer l'écran PaywallScreen complet** (actuellement basique, améliorer le design)
3. **Fixer la splash screen** (impact UX immédiat)
4. **PWA install** (améliore la rétention)
5. **Partage viral** (croissance organique)
6. **Parrainage** (croissance virale)

## 🐛 Points d'attention

- L'API subscription/check retourne encore `status` pour compatibilité, mais utilise `plan` en interne
- Les anciens webhooks Stripe doivent être mis à jour dans le dashboard Stripe pour les nouveaux price IDs
- Tester tous les flows de paiement avant déploiement
- Vérifier que `free_scans_remaining` est bien initialisé à 3 pour tous les nouveaux utilisateurs

