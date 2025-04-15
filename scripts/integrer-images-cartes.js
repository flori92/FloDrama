/**
 * Script pour intégrer les images téléchargées dans l'interface FloDrama
 * 
 * Ce script modifie les éléments HTML pour afficher correctement les images sur les cartes
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Configuration
const HTML_FILES = [
  path.join(__dirname, '../index.html'),
  path.join(__dirname, '../films.html'),
  path.join(__dirname, '../dramas.html'),
  path.join(__dirname, '../animes.html'),
  path.join(__dirname, '../ma-liste.html')
];
const METADATA_FILE = path.join(__dirname, '../public/assets/data/metadata.json');
const POSTERS_DIR = path.join(__dirname, '../public/assets/images/posters');

/**
 * Vérifie si les dépendances nécessaires sont installées
 */
function checkDependencies() {
  try {
    require('cheerio');
  } catch (error) {
    console.log('Installation de la dépendance cheerio...');
    require('child_process').execSync('npm install cheerio', { stdio: 'inherit' });
    console.log('Cheerio installé avec succès');
  }
}

/**
 * Charge les métadonnées depuis le fichier JSON
 * @returns {Object} - Métadonnées
 */
function loadMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const metadataContent = fs.readFileSync(METADATA_FILE, 'utf8');
      return JSON.parse(metadataContent);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des métadonnées:', error);
  }
  
  return { content: {} };
}

/**
 * Récupère la liste des images disponibles dans le dossier des posters
 * @returns {Array} - Liste des noms de fichiers d'images
 */
function getAvailableImages() {
  try {
    if (fs.existsSync(POSTERS_DIR)) {
      return fs.readdirSync(POSTERS_DIR)
        .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.svg'));
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier des posters:', error);
  }
  
  return [];
}

/**
 * Modifie un fichier HTML pour intégrer les images sur les cartes
 * @param {string} htmlFile - Chemin du fichier HTML
 * @param {Object} metadata - Métadonnées des contenus
 * @param {Array} availableImages - Liste des images disponibles
 */
function updateHtmlFile(htmlFile, metadata, availableImages) {
  try {
    if (!fs.existsSync(htmlFile)) {
      console.log(`Le fichier ${htmlFile} n'existe pas, il sera ignoré`);
      return;
    }
    
    console.log(`Mise à jour du fichier ${htmlFile}...`);
    
    // Lire le contenu du fichier HTML
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const $ = cheerio.load(htmlContent);
    
    // Récupérer toutes les cartes de contenu
    const contentCards = $('.content-card, .movie-card, .drama-card, .anime-card, .card');
    console.log(`${contentCards.length} cartes trouvées dans ${htmlFile}`);
    
    // Pour chaque carte, ajouter une image si elle n'en a pas déjà une
    contentCards.each((index, card) => {
      const $card = $(card);
      const $img = $card.find('img');
      
      // Si la carte a déjà une image avec une source valide, ne rien faire
      if ($img.length > 0 && $img.attr('src') && !$img.attr('src').includes('placeholder')) {
        return;
      }
      
      // Récupérer le titre de la carte (s'il existe)
      let title = $card.find('.title, h3, h4').first().text().trim();
      
      // Si pas de titre, utiliser un titre par défaut basé sur l'index
      if (!title) {
        // Déterminer le type de contenu en fonction du fichier HTML
        let contentType = 'content';
        if (htmlFile.includes('films')) contentType = 'movie';
        else if (htmlFile.includes('dramas')) contentType = 'drama';
        else if (htmlFile.includes('animes')) contentType = 'anime';
        
        title = `${contentType}-${index + 1}`;
      }
      
      // Chercher une image correspondante dans les métadonnées
      let imagePath = null;
      
      // Parcourir les métadonnées pour trouver une correspondance par titre
      for (const contentId in metadata.content) {
        const content = metadata.content[contentId];
        if (content.title.toLowerCase() === title.toLowerCase() || 
            content.original_title?.toLowerCase() === title.toLowerCase()) {
          imagePath = content.poster_path;
          break;
        }
      }
      
      // Si aucune image n'a été trouvée dans les métadonnées, utiliser une image aléatoire disponible
      if (!imagePath && availableImages.length > 0) {
        const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
        imagePath = `/assets/images/posters/${randomImage}`;
      }
      
      // Si une image a été trouvée, l'ajouter à la carte
      if (imagePath) {
        if ($img.length > 0) {
          // Mettre à jour l'image existante
          $img.attr('src', imagePath);
          $img.attr('alt', title);
        } else {
          // Créer une nouvelle image
          const $newImg = $('<img>').attr('src', imagePath).attr('alt', title);
          
          // Trouver l'emplacement approprié pour insérer l'image
          const $posterContainer = $card.find('.poster, .card-img, .card-image, .image-container').first();
          if ($posterContainer.length > 0) {
            $posterContainer.append($newImg);
          } else {
            // Si aucun conteneur d'image n'est trouvé, insérer l'image au début de la carte
            $card.prepend($newImg);
          }
        }
      }
    });
    
    // Enregistrer les modifications
    fs.writeFileSync(htmlFile, $.html(), 'utf8');
    console.log(`Fichier ${htmlFile} mis à jour avec succès`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du fichier ${htmlFile}:`, error);
  }
}

/**
 * Fonction principale pour intégrer les images dans l'interface
 */
async function integrerImages() {
  console.log('Début de l\'intégration des images dans l\'interface FloDrama...');
  
  // Vérifier les dépendances
  checkDependencies();
  
  // Charger les métadonnées
  const metadata = loadMetadata();
  console.log(`${Object.keys(metadata.content).length} éléments de contenu trouvés dans les métadonnées`);
  
  // Récupérer la liste des images disponibles
  const availableImages = getAvailableImages();
  console.log(`${availableImages.length} images disponibles dans le dossier des posters`);
  
  // Mettre à jour chaque fichier HTML
  for (const htmlFile of HTML_FILES) {
    updateHtmlFile(htmlFile, metadata, availableImages);
  }
  
  console.log('Intégration des images terminée');
}

// Exécuter la fonction principale
integrerImages().catch(console.error);
