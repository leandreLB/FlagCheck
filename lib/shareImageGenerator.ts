// QR code généré via API en ligne pour compatibilité mobile

export interface ShareImageData {
  score: number;
  redFlags: Array<{ flag: string; description: string }>;
  top3Flags: Array<{ flag: string; description: string }>;
  templateVariant?: number; // 0-3 pour varier les templates
}

type TemplateType = 'gradient' | 'neon' | 'minimal' | 'vibrant';

// Génère une image de partage stylée
export async function generateShareImage(data: ShareImageData): Promise<Blob> {
  // Vérifier que nous sommes dans un environnement navigateur
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('Cette fonction doit être appelée côté client');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const size = 1080;
  canvas.width = size;
  canvas.height = size;

  // Sélectionner un template selon le variant fourni ou aléatoire
  const templates: TemplateType[] = ['gradient', 'neon', 'minimal', 'vibrant'];
  const templateIndex = data.templateVariant !== undefined 
    ? data.templateVariant % templates.length 
    : Math.floor(Math.random() * templates.length);
  const template = templates[templateIndex];

  // Dessiner selon le template
  switch (template) {
    case 'gradient':
      await drawGradientTemplate(ctx, canvas, data);
      break;
    case 'neon':
      await drawNeonTemplate(ctx, canvas, data);
      break;
    case 'minimal':
      await drawMinimalTemplate(ctx, canvas, data);
      break;
    case 'vibrant':
      await drawVibrantTemplate(ctx, canvas, data);
      break;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate image'));
    }, 'image/png');
  });
}

// Template 1: Gradient (rose-violet-noir)
async function drawGradientTemplate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ShareImageData
) {
  const size = canvas.width;

  // Fond dégradé
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#EC4899'); // Rose
  gradient.addColorStop(0.5, '#8B5CF6'); // Violet
  gradient.addColorStop(1, '#000000'); // Noir
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Overlay sombre pour le contraste
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, size, size);

  await drawCommonElements(ctx, canvas, data, '#FFFFFF', '#EC4899');
}

// Template 2: Neon (effet néon cyberpunk)
async function drawNeonTemplate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ShareImageData
) {
  const size = canvas.width;

  // Fond noir avec effet néon
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Effets de lumière néon
  const neonGradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size);
  neonGradient.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
  neonGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
  neonGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = neonGradient;
  ctx.fillRect(0, 0, size, size);

  await drawCommonElements(ctx, canvas, data, '#EC4899', '#8B5CF6', true);
}

// Template 3: Minimal (design épuré)
async function drawMinimalTemplate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ShareImageData
) {
  const size = canvas.width;

  // Fond noir simple
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, size, size);

  // Lignes décoratives subtiles
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (size / 5) * i);
    ctx.lineTo(size, (size / 5) * i);
    ctx.stroke();
  }

  await drawCommonElements(ctx, canvas, data, '#FFFFFF', '#EC4899');
}

// Template 4: Vibrant (couleurs vives et énergiques)
async function drawVibrantTemplate(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ShareImageData
) {
  const size = canvas.width;

  // Fond avec dégradé vibrant
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#F43F5E'); // Rose vif
  gradient.addColorStop(0.33, '#EC4899'); // Rose
  gradient.addColorStop(0.66, '#A855F7'); // Violet
  gradient.addColorStop(1, '#6366F1'); // Indigo
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Overlay avec motifs
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(0, 0, size, size);

  // Cercles décoratifs
  ctx.fillStyle = 'rgba(236, 72, 153, 0.1)';
  ctx.beginPath();
  ctx.arc(size * 0.2, size * 0.3, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.8, size * 0.7, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  await drawCommonElements(ctx, canvas, data, '#FFFFFF', '#F43F5E');
}

// Éléments communs à tous les templates
async function drawCommonElements(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: ShareImageData,
  textColor: string,
  accentColor: string,
  neonEffect = false
) {
  const size = canvas.width;
  const padding = 80;

  // Logo FlagCheck en haut
  ctx.fillStyle = textColor;
  ctx.font = 'bold 48px "Inter", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('FlagCheck', size / 2, padding);

  // Score principal en GROS au centre
  const scoreY = size * 0.35;
  const scoreText = `${data.score}/10`;
  const flagEmojis = '🚩'.repeat(Math.min(data.score, 10));

  // Score avec effet
  if (neonEffect) {
    // Effet néon pour le score
    ctx.shadowBlur = 30;
    ctx.shadowColor = accentColor;
  }

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 180px "Inter", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(scoreText, size / 2, scoreY);

  // Réinitialiser l'ombre
  ctx.shadowBlur = 0;

  // Emojis de drapeaux
  ctx.font = '60px Arial';
  ctx.fillText(flagEmojis, size / 2, scoreY + 120);

  // Texte "RED FLAGS"
  ctx.fillStyle = textColor;
  ctx.font = 'bold 56px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillText('RED FLAGS', size / 2, scoreY + 200);

  // QR Code et texte en bas - définir d'abord pour calculer l'espace disponible
  const bottomY = size - 200;
  const qrSize = 120;
  const qrX = size / 2 - qrSize / 2;
  const qrY = bottomY - qrSize - 20;
  const textAboveQrY = qrY - 10;
  const minSpaceBeforeQr = 40; // Espace minimum avant le QR code
  const maxFlagsAreaEnd = textAboveQrY - minSpaceBeforeQr; // Zone maximale pour les flags

  // Phrases drôles selon le score
  const getFunnyPhrases = (score: number): string[] => {
    if (score >= 1 && score <= 3) {
      return [
        "This profile is cleaner than my browser history! 🧹",
        "Green flags everywhere! 🌱",
        "No red flags detected. Suspiciously clean... 🤔",
        "This person seems... normal? 🎯",
        "All clear! Proceed with caution anyway 😎"
      ];
    } else if (score >= 4 && score <= 6) {
      return [
        "Some red flags, but nothing a therapist can't fix 🚩",
        "Warning: Proceed with caution ⚠️",
        "Mixed signals detected 📡",
        "Not terrible, but not great either 🤷",
        "Yellow flags turning red... 🟡➡️🔴"
      ];
    } else if (score >= 7 && score <= 9) {
      return [
        "Run. Just run. 🏃💨",
        "More red flags than a bullfighting arena 🚩🚩🚩",
        "This profile is a walking red flag 🚩",
        "Warning: High risk of drama ahead ⚠️",
        "Multiple red flags detected. Abort mission! 🚨"
      ];
    } else {
      return [
        "10/10 red flags. This is a masterpiece of red flags 🎨🚩",
        "Maximum red flags achieved! 🏆🚩",
        "This profile broke the red flag counter 💥",
        "10/10 would not recommend ❌",
        "All red flags unlocked! Achievement unlocked 🎮🚩"
      ];
    }
  };

  // Décider aléatoirement : afficher les red flags ou une phrase drôle
  const showFunnyPhrase = Math.random() > 0.5; // 50% de chance
  const contentStartY = scoreY + 280;
  
  if (showFunnyPhrase && data.top3Flags.length > 0) {
    // Afficher une phrase drôle
    const phrases = getFunnyPhrases(data.score);
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Calculer l'espace disponible
    const availableHeight = maxFlagsAreaEnd - contentStartY;
    const maxFontSize = Math.min(36, Math.floor(availableHeight * 0.15));
    const fontSize = Math.max(24, maxFontSize);
    
    ctx.font = `bold ${fontSize}px "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Découper la phrase en plusieurs lignes si nécessaire
    const maxWidth = size - padding * 2;
    const words = randomPhrase.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Dessiner les lignes
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = contentStartY + (availableHeight - totalHeight) / 2;
    
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      if (y + fontSize <= maxFlagsAreaEnd) {
        ctx.fillText(line, size / 2, y);
      }
    });
  } else {
    // Afficher les top red flags (code original)
    const flagsStartY = contentStartY;
    const maxFlags = Math.min(3, data.top3Flags.length);
    
    // Calculer l'espace disponible pour les flags
    const availableHeight = maxFlagsAreaEnd - flagsStartY;
    const flagSpacing = Math.min(70, Math.floor(availableHeight / (maxFlags + 1))); // Espacement adaptatif
    const fontSize = Math.min(28, Math.floor(flagSpacing * 0.4)); // Taille de police adaptative

    ctx.font = `${fontSize}px "Inter", system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';

    for (let i = 0; i < maxFlags; i++) {
      const flag = data.top3Flags[i];
      const y = flagsStartY + i * flagSpacing;
      
      // Vérifier que le flag ne dépasse pas la zone réservée
      if (y + fontSize > maxFlagsAreaEnd) {
        break; // Arrêter si on dépasse
      }
      
      const x = size / 2 - 200;

      // Emoji drapeau
      ctx.font = `${fontSize - 2}px Arial`;
      ctx.fillText('🚩', x, y);

      // Texte du flag (tronqué si trop long)
      ctx.font = `bold ${fontSize}px "Inter", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = accentColor;
      const maxWidth = 380;
      let flagText = flag.flag;
      if (ctx.measureText(flagText).width > maxWidth) {
        while (ctx.measureText(flagText + '...').width > maxWidth && flagText.length > 0) {
          flagText = flagText.slice(0, -1);
        }
        flagText += '...';
      }
      ctx.fillText(flagText, x + 40, y);
    }
  }

  // Texte "Scanned with FlagCheck" (dessiné avant le QR code pour être en dessous)
  ctx.fillStyle = textColor;
  ctx.font = '24px "Inter", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Scanned with FlagCheck', size / 2, qrY - 10);

  // Générer le QR code via une API en ligne (plus fiable côté client)
  try {
    // Utiliser une API QR code en ligne qui fonctionne côté client
    // Utiliser une couleur blanche pour le QR code si textColor est sombre
    const qrColor = textColor === '#FFFFFF' || textColor === '#EC4899' || textColor === '#F43F5E' 
      ? 'FFFFFF' 
      : textColor.replace('#', '');
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent('https://flag-check.vercel.app')}&color=${qrColor}&bgcolor=000000&margin=1`;
    
    // Charger l'image du QR code avec timeout
    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        qrImage.onload = () => {
          try {
            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        qrImage.onerror = () => {
          reject(new Error('Failed to load QR code image'));
        };
        qrImage.src = qrUrl;
      }),
      new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('QR code load timeout')), 5000);
      })
    ]);
  } catch (error) {
    console.warn('QR code error (using fallback):', error);
    // Fallback élégant: dessiner un carré stylé avec le texte URL
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    
    // Dessiner un motif simple à l'intérieur
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1;
    const padding = 10;
    ctx.strokeRect(qrX + padding, qrY + padding, qrSize - padding * 2, qrSize - padding * 2);
    
    // Texte URL
    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px "Inter", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('flag-check.vercel.app', qrX + qrSize / 2, qrY + qrSize / 2);
  }

  // Watermark discret
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.font = '16px "Inter", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('flag-check.vercel.app', size - padding, size - padding);
}

