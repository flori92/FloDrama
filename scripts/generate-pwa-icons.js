// Script pour générer les icônes PWA à partir du SVG source
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Chemin vers le SVG source
const svgPath = path.join(__dirname, '../public/pwa-icon.svg');
const outputDir = path.join(__dirname, '../public');

// Tailles d'icônes à générer
const sizes = [
  { width: 192, height: 192, filename: 'pwa-192x192.png' },
  { width: 512, height: 512, filename: 'pwa-512x512.png' },
  { width: 180, height: 180, filename: 'apple-touch-icon.png' },
  { width: 32, height: 32, filename: 'favicon-32x32.png' },
  { width: 16, height: 16, filename: 'favicon-16x16.png' }
];

// Vérifier si le SVG source existe
if (!fs.existsSync(svgPath)) {
  console.error('Erreur: Le fichier SVG source n\'existe pas!');
  process.exit(1);
}

// Lire le contenu SVG
const svgBuffer = fs.readFileSync(svgPath);

// Générer les icônes pour chaque taille
async function generateIcons() {
  console.log('Génération des icônes PWA pour FloDrama...');
  
  try {
    // Créer une version masquable pour les PWA
    const maskableSvg = svgBuffer.toString().replace('<rect width="512" height="512" rx="128" fill="#121118"/>', '<rect width="512" height="512" fill="#121118"/>');
    fs.writeFileSync(path.join(outputDir, 'maskable-icon.svg'), maskableSvg);
    
    // Générer une icône maskable
    await sharp(Buffer.from(maskableSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'maskable-icon-512x512.png'));
    
    console.log('✓ Icône maskable générée');
    
    // Générer les icônes standards
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size.width, size.height)
        .png()
        .toFile(path.join(outputDir, size.filename));
      
      console.log(`✓ ${size.filename} généré (${size.width}x${size.height})`);
    }
    
    // Générer le favicon.ico (multi-taille)
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFormat('ico')
      .toFile(path.join(outputDir, 'favicon.ico'));
    
    console.log('✓ favicon.ico généré');
    
    console.log('\nToutes les icônes ont été générées avec succès!');
    console.log('Emplacement: ' + outputDir);
  } catch (error) {
    console.error('Erreur lors de la génération des icônes:', error);
    process.exit(1);
  }
}

// Exécuter la génération
generateIcons();
