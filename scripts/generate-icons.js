const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Créer aussi les icônes à la racine de public
const publicDir = path.join(__dirname, '..', 'public');

// Dimensions des icônes
const sizes = [
  { size: 192, name: 'icon-192.png', path: publicDir },
  { size: 512, name: 'icon-512.png', path: publicDir },
  { size: 180, name: 'apple-touch-icon.png', path: publicDir },
];

// Créer un SVG avec le logo FlagCheck (drapeau rouge sur fond dégradé)
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text 
    x="50%" 
    y="50%" 
    font-size="${size * 0.5}" 
    text-anchor="middle" 
    dominant-baseline="central"
    font-family="Arial, sans-serif"
    fill="#EF4444"
    font-weight="bold"
  >🚩</text>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA...\n');

  for (const { size, name, path: outputPath } of sizes) {
    try {
      const svg = createIconSVG(size);
      const outputFile = path.join(outputPath, name);
      
      await sharp(Buffer.from(svg))
        .png()
        .resize(size, size)
        .toFile(outputFile);
      
      console.log(`✅ ${name} (${size}x${size}) créé`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de ${name}:`, error.message);
    }
  }

  // Générer le favicon.ico (16x16 et 32x32)
  try {
    const faviconSvg = createIconSVG(32);
    const faviconPath = path.join(publicDir, 'favicon.ico');
    
    // Pour favicon.ico, on crée d'abord un PNG puis on le convertit
    // Note: sharp ne peut pas créer directement .ico, donc on crée un PNG
    // qui sera utilisé comme favicon
    await sharp(Buffer.from(faviconSvg))
      .png()
      .resize(32, 32)
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('✅ favicon.png créé (renommez en .ico si nécessaire)');
  } catch (error) {
    console.error('❌ Erreur lors de la création du favicon:', error.message);
  }

  console.log('\n✨ Génération terminée!');
  console.log('\n📝 Note: Pour favicon.ico, vous pouvez utiliser un convertisseur en ligne');
  console.log('   ou installer icon-gen: npm install -g icon-gen');
}

// Vérifier si sharp est installé
try {
  require.resolve('sharp');
  generateIcons().catch(console.error);
} catch (error) {
  console.error('❌ Le package "sharp" n\'est pas installé.');
  console.log('📦 Installez-le avec: npm install --save-dev sharp');
  console.log('   Puis relancez: node scripts/generate-icons.js');
  process.exit(1);
}

