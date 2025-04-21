const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('./build-config');

const generatePlaceholderImages = async () => {
  const placeholderDir = path.join(config.publicDir, 'static', 'placeholders');
  
  // Créer les répertoires pour chaque type de contenu
  config.contentTypes.forEach(type => {
    const typeDir = path.join(placeholderDir, type.toLowerCase());
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
  });

  // Générer les images placeholder pour chaque type de contenu
  for (const type of config.contentTypes) {
    const typeDir = path.join(placeholderDir, type.toLowerCase());
    
    for (let i = 1; i <= config.contentCount; i++) {
      const outputPath = path.join(typeDir, `${i}.jpg`);
      
      // Créer une image placeholder avec sharp
      await sharp({
        create: {
          width: 400,
          height: 600,
          channels: 3,
          background: { r: 200, g: 200, b: 200 }
        }
      })
      .jpeg({ quality: config.imageConfig.quality })
      .toFile(outputPath);
    }
  }
};

module.exports = generatePlaceholderImages; 