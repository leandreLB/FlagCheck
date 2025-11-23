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

// Créer un SVG professionnel avec drapeau stylisé sur fond dégradé rose-violet
const createIconSVG = (size) => {
  const padding = size * 0.15;
  const flagSize = size * 0.6;
  const flagX = size / 2 - flagSize / 2;
  const flagY = size / 2 - flagSize / 2;
  const poleWidth = size * 0.08;
  const poleX = flagX - poleWidth * 1.5;
  const poleHeight = flagSize * 1.1;
  const poleY = size / 2 - poleHeight / 2;
  
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dégradé rose-violet pour le fond -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF1493;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#C71585;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B008B;stop-opacity:1" />
    </linearGradient>
    
    <!-- Dégradé pour le drapeau rouge -->
    <linearGradient id="flagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF4444;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CC0000;stop-opacity:1" />
    </linearGradient>
    
    <!-- Ombre portée pour le drapeau -->
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="2" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Glow effect -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Fond avec coins arrondis -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" rx="${size * 0.25}"/>
  
  <!-- Pôle du drapeau -->
  <rect 
    x="${poleX}" 
    y="${poleY}" 
    width="${poleWidth}" 
    height="${poleHeight}" 
    fill="#8B4513" 
    rx="${poleWidth / 2}"
    filter="url(#shadow)"
  />
  
  <!-- Drapeau rouge stylisé -->
  <g filter="url(#glow)">
    <!-- Forme du drapeau (triangle) -->
    <path 
      d="M ${flagX} ${flagY} 
         L ${flagX + flagSize} ${flagY + flagSize * 0.3} 
         L ${flagX} ${flagY + flagSize * 0.6} 
         Z" 
      fill="url(#flagGrad)"
      filter="url(#shadow)"
    />
    
    <!-- Bordure blanche du drapeau pour le contraste -->
    <path 
      d="M ${flagX} ${flagY} 
         L ${flagX + flagSize} ${flagY + flagSize * 0.3} 
         L ${flagX} ${flagY + flagSize * 0.6} 
         Z" 
      fill="none"
      stroke="rgba(255,255,255,0.3)"
      stroke-width="${size * 0.01}"
    />
  </g>
  
  <!-- Ligne de séparation sur le drapeau pour plus de réalisme -->
  <line 
    x1="${flagX}" 
    y1="${flagY + flagSize * 0.2}" 
    x2="${flagX + flagSize * 0.7}" 
    y2="${flagY + flagSize * 0.35}" 
    stroke="rgba(255,255,255,0.2)" 
    stroke-width="${size * 0.008}"
  />
</svg>
`;
};

async function generateIcons() {
  console.log('🎨 Génération des icônes PWA professionnelles...\n');

  for (const { size, name, path: outputPath } of sizes) {
    try {
      const svg = createIconSVG(size);
      const outputFile = path.join(outputPath, name);
      
      await sharp(Buffer.from(svg))
        .png()
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
        })
        .toFile(outputFile);
      
      console.log(`✅ ${name} (${size}x${size}) créé`);
    } catch (error) {
      console.error(`❌ Erreur lors de la création de ${name}:`, error.message);
    }
  }

  // Générer le favicon.ico (32x32)
  try {
    const faviconSvg = createIconSVG(32);
    const faviconPath = path.join(publicDir, 'favicon.png');
    
    await sharp(Buffer.from(faviconSvg))
      .png()
      .resize(32, 32, {
        kernel: sharp.kernel.lanczos3,
      })
      .toFile(faviconPath);
    
    console.log('✅ favicon.png créé');
  } catch (error) {
    console.error('❌ Erreur lors de la création du favicon:', error.message);
  }

  console.log('\n✨ Génération terminée!');
  console.log('\n📝 Les icônes ont été créées avec un design professionnel:');
  console.log('   - Fond dégradé rose-violet (#FF1493 → #8B008B)');
  console.log('   - Drapeau rouge stylisé avec ombre et glow');
  console.log('   - Pôle en bois pour plus de réalisme');
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
