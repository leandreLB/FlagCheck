const fs = require('fs');
const path = require('path');

// Note: Ce script nécessite une bibliothèque d'images comme 'sharp' ou 'canvas'
// Pour l'instant, il crée juste la structure et liste les dimensions nécessaires

const splashSizes = [
  // iPhone 14 / 15 / 13 / 12
  { width: 1170, height: 2532, name: 'iphone-14-portrait.png', orientation: 'portrait' },
  { width: 2532, height: 1170, name: 'iphone-14-landscape.png', orientation: 'landscape' },
  
  // iPhone 13 mini / 12 mini / 11 Pro / XS / X
  { width: 1125, height: 2436, name: 'iphone-13-mini-portrait.png', orientation: 'portrait' },
  { width: 2436, height: 1125, name: 'iphone-13-mini-landscape.png', orientation: 'landscape' },
  
  // iPhone 14 Pro / 15 Pro
  { width: 1179, height: 2556, name: 'iphone-14-pro-portrait.png', orientation: 'portrait' },
  { width: 2556, height: 1179, name: 'iphone-14-pro-landscape.png', orientation: 'landscape' },
  
  // iPhone 14 Pro Max / 15 Pro Max
  { width: 1290, height: 2796, name: 'iphone-14-pro-max-portrait.png', orientation: 'portrait' },
  { width: 2796, height: 1290, name: 'iphone-14-pro-max-landscape.png', orientation: 'landscape' },
  
  // iPhone 8 / 7 / 6s / 6
  { width: 750, height: 1334, name: 'iphone-8-portrait.png', orientation: 'portrait' },
  { width: 1334, height: 750, name: 'iphone-8-landscape.png', orientation: 'landscape' },
  
  // Fallback
  { width: 1170, height: 2532, name: 'default.png', orientation: 'portrait' },
];

const splashDir = path.join(process.cwd(), 'public', 'splash');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
  console.log('✅ Dossier public/splash créé');
}

console.log('📱 Dimensions des splash screens nécessaires:\n');
splashSizes.forEach(size => {
  console.log(`  ${size.name.padEnd(35)} ${size.width}x${size.height}px (${size.orientation})`);
});

console.log('\n⚠️  Ce script liste seulement les dimensions nécessaires.');
console.log('📝 Pour générer les images, vous devez :');
console.log('   1. Installer sharp: npm install sharp --save-dev');
console.log('   2. Créer les images avec un outil graphique (Figma, Photoshop, etc.)');
console.log('   3. Ou utiliser un générateur PWA en ligne');
console.log('\n💡 Astuce: Créez une image de base avec le logo FlagCheck centré');
console.log('   puis utilisez un outil comme "PWA Asset Generator" pour toutes les tailles.');
