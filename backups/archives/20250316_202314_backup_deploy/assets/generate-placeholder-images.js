/**
 * Script pour générer des images placeholder pour le développement
 * Ce script crée des images de base64 pour les posters, backdrops et thumbnails
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  posters: {
    dir: path.join(__dirname, 'posters'),
    width: 300,
    height: 450,
    titles: [
      'crash-landing-on-you',
      'itaewon-class',
      'goblin',
      'descendants-of-the-sun',
      'parasite',
      'train-to-busan',
      'the-handmaiden',
      'oldboy',
      '3-idiots',
      'your-name'
    ]
  },
  backdrops: {
    dir: path.join(__dirname, 'backdrops'),
    width: 1280,
    height: 720,
    titles: [
      'crash-landing-on-you',
      'itaewon-class',
      'goblin',
      'descendants-of-the-sun',
      'parasite',
      'train-to-busan',
      'the-handmaiden',
      'oldboy',
      '3-idiots',
      'your-name'
    ]
  },
  thumbnails: {
    dir: path.join(__dirname, 'thumbnails'),
    width: 640,
    height: 360,
    titles: [
      'crash-landing-on-you-s01e01',
      'itaewon-class-s01e01',
      'goblin-s01e01',
      'descendants-of-the-sun-s01e01'
    ]
  }
};

// Fonction pour générer une image SVG avec du texte
function generateSvgImage(width, height, title, bgColor = '#0066CC', textColor = '#FFFFFF') {
  const titleText = title.replace(/-/g, ' ').replace(/s\d+e\d+/i, '').trim();
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${width / 20}px" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${titleText}
      </text>
    </svg>
  `;
  return Buffer.from(svg).toString('base64');
}

// Fonction pour créer une image SVG et la sauvegarder comme fichier
function createImageFile(dir, filename, width, height, title) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const svgContent = generateSvgImage(width, height, title);
  const filePath = path.join(dir, `${filename}.jpg`);
  
  // Créer un fichier image avec le contenu SVG encodé en base64
  const htmlContent = `
    <html>
      <head>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
          img { width: 100%; height: 100%; object-fit: cover; }
        </style>
      </head>
      <body>
        <img src="data:image/svg+xml;base64,${svgContent}" alt="${title}" />
      </body>
    </html>
  `;
  
  fs.writeFileSync(filePath, htmlContent);
  console.log(`Créé: ${filePath}`);
}

// Générer toutes les images
Object.keys(config).forEach(type => {
  const { dir, width, height, titles } = config[type];
  
  titles.forEach(title => {
    createImageFile(dir, title, width, height, title);
  });
});

console.log('Génération des images terminée!');
