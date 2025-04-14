/**
 * Script pour générer des images placeholder pour le développement
 * Ce script utilise la couleur Rose/Magenta (#FF00FF) comme identité visuelle de FloDrama
 */

const fs = require('fs');
const path = require('path');

// Liste des titres pour lesquels créer des images
const titles = {
  dramas: [
    'crash-landing-on-you',
    'itaewon-class',
    'goblin',
    'descendants-of-the-sun'
  ],
  movies: [
    'parasite',
    'train-to-busan',
    'the-handmaiden',
    'oldboy'
  ],
  bollywood: [
    '3-idiots'
  ],
  anime: [
    'your-name'
  ]
};

// Dossiers à créer
const folders = [
  'posters',
  'backdrops',
  'thumbnails',
  'trailers'
];

// Créer les dossiers s'ils n'existent pas
folders.forEach(folder => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Dossier créé: ${folderPath}`);
  }
});

// Modèle HTML pour les images
const htmlTemplate = (title, type) => `<!DOCTYPE html>
<html>
<head>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #FF00FF;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }
  </style>
</head>
<body>
  <div>
    <h2>${title.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}</h2>
    <p>${type}</p>
  </div>
</body>
</html>`;

// Créer les images pour chaque titre
Object.keys(titles).forEach(category => {
  titles[category].forEach(title => {
    // Créer poster
    fs.writeFileSync(
      path.join(__dirname, 'posters', `${title}.jpg`),
      htmlTemplate(title, 'Poster')
    );
    console.log(`Poster créé: ${title}.jpg`);
    
    // Créer backdrop
    fs.writeFileSync(
      path.join(__dirname, 'backdrops', `${title}.jpg`),
      htmlTemplate(title, 'Backdrop')
    );
    console.log(`Backdrop créé: ${title}.jpg`);
    
    // Pour les dramas, créer aussi des thumbnails d'épisodes
    if (category === 'dramas') {
      fs.writeFileSync(
        path.join(__dirname, 'thumbnails', `${title}-s01e01.jpg`),
        htmlTemplate(`${title} S01E01`, 'Thumbnail')
      );
      console.log(`Thumbnail créé: ${title}-s01e01.jpg`);
    }
  });
});

console.log('Génération des images terminée!');
