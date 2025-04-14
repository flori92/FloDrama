const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Fonction pour créer un logo avec dégradé
function createLogo(size) {
  // Créer un canvas avec la taille spécifiée
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Créer un dégradé linéaire (bleu signature → fuchsia accent)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3b82f6'); // Bleu signature
  gradient.addColorStop(1, '#d946ef'); // Fuchsia accent
  
  // Dessiner un rectangle arrondi avec le dégradé
  ctx.fillStyle = gradient;
  const radius = size * 0.067; // 8px pour un logo de 120px
  
  // Dessiner un rectangle arrondi
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // Ajouter le texte "FloDrama"
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.2}px 'SF Pro Display', -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FloDrama', size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Générer les logos de différentes tailles
const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

sizes.forEach(size => {
  const logoBuffer = createLogo(size);
  fs.writeFileSync(path.join(publicDir, `logo${size}.png`), logoBuffer);
  console.log(`Logo ${size}x${size} généré avec succès !`);
});

console.log('Génération des logos terminée !');
