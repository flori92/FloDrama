const path = require('path');

const config = {
  // Configuration des répertoires
  publicDir: path.join(__dirname, '../../public'),
  dataDir: path.join(__dirname, '../../public/data'),
  
  // Configuration des types de contenu
  contentTypes: ['Dramas', 'Films', 'Anime', 'Bollywood'],
  contentCount: 6,
  
  // Configuration des images
  imageConfig: {
    quality: 80,
    width: 400,
    height: 600
  },
  
  // Configuration des métadonnées
  metadata: {
    title: 'FloDrama',
    description: 'Votre plateforme de streaming de dramas, films et anime',
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  }
};

module.exports = config; 