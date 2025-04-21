const fs = require('fs');
const path = require('path');
const config = require('./utils/build-config');

// Créer le répertoire data s'il n'existe pas
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

// Générer les données de contenu
const contentData = config.contentTypes.map(type => ({
  id: type.toLowerCase(),
  title: type,
  items: Array.from({ length: config.contentCount }, (_, i) => ({
    id: `${type.toLowerCase()}-${i + 1}`,
    title: `${type} ${i + 1}`,
    image: `/static/placeholders/${type.toLowerCase()}/${i + 1}.jpg`,
    type: type
  }))
}));

// Sauvegarder les données
fs.writeFileSync(
  path.join(config.dataDir, 'content.json'),
  JSON.stringify(contentData, null, 2)
);

// Générer les catégories
const categories = config.contentTypes.map(type => ({
  id: type.toLowerCase(),
  name: type,
  count: config.contentCount
}));

fs.writeFileSync(
  path.join(config.dataDir, 'categories.json'),
  JSON.stringify(categories, null, 2)
);

// Générer les métadonnées
fs.writeFileSync(
  path.join(config.dataDir, 'metadata.json'),
  JSON.stringify(config.metadata, null, 2)
);

console.log('Données générées avec succès !'); 