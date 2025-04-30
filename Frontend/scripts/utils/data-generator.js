const fs = require('fs');
const path = require('path');
const config = require('./build-config');

const generateContentData = () => {
  const content = [];
  const categories = {};

  config.contentTypes.forEach(type => {
    const typeContent = [];
    for (let i = 1; i <= config.contentCount; i++) {
      const item = {
        id: `${type.toLowerCase()}-${i}`,
        title: `${type} ${i}`,
        description: `Description du ${type} ${i}`,
        type: type,
        image: `/static/placeholders/${type.toLowerCase()}/${i}.jpg`,
        rating: Math.floor(Math.random() * 5) + 1,
        year: 2020 + Math.floor(Math.random() * 4),
        duration: `${Math.floor(Math.random() * 120) + 60} min`
      };
      typeContent.push(item);
    }
    content.push(...typeContent);
    categories[type] = typeContent;
  });

  return { content, categories };
};

const generateMetadata = () => {
  return {
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
    contentCount: config.contentCount * config.contentTypes.length
  };
};

const generateData = () => {
  const data = generateContentData();
  const metadata = generateMetadata();

  // Créer le répertoire de données s'il n'existe pas
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }

  // Écrire les fichiers de données
  fs.writeFileSync(
    path.join(config.dataDir, 'content.json'),
    JSON.stringify(data.content, null, 2)
  );

  fs.writeFileSync(
    path.join(config.dataDir, 'categories.json'),
    JSON.stringify(data.categories, null, 2)
  );

  fs.writeFileSync(
    path.join(config.dataDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
};

module.exports = generateData; 