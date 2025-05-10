/**
 * Intégration du scraper d'images avec le scraper de contenu existant
 * Ce module permet d'enrichir les données scrapées avec des images optimisées
 */

const { processContentImages, getImageUrl } = require('./image-scraper');

/**
 * Transforme un objet contenu pour standardiser la structure des données
 * et ajouter les URLs d'images optimisées
 * @param {Object} content - Objet contenant les données du contenu
 * @param {Object} images - Objet contenant les IDs des images stockées
 * @returns {Object} - Objet contenu standardisé
 */
function transformContentObject(content, images) {
  // Créer un nouvel objet pour éviter de modifier l'original
  const transformedContent = { ...content };
  
  // Ajouter les IDs des images
  transformedContent.images = images;
  
  // Ajouter les URLs des images pour faciliter l'utilisation côté client
  transformedContent.image_urls = {
    poster: {
      small: getImageUrl(images.poster, 'small'),
      medium: getImageUrl(images.poster, 'medium'),
      large: getImageUrl(images.poster, 'large'),
      original: getImageUrl(images.poster, 'original')
    },
    backdrop: {
      small: getImageUrl(images.backdrop, 'small'),
      medium: getImageUrl(images.backdrop, 'medium'),
      large: getImageUrl(images.backdrop, 'large'),
      original: getImageUrl(images.backdrop, 'original')
    },
    thumbnail: getImageUrl(images.thumbnail, 'small')
  };
  
  // Supprimer les anciennes propriétés d'images pour éviter la duplication
  delete transformedContent.poster_url;
  delete transformedContent.poster_path;
  delete transformedContent.backdrop_url;
  delete transformedContent.backdrop_path;
  delete transformedContent.banner_url;
  delete transformedContent.background_url;
  delete transformedContent.image_url;
  
  return transformedContent;
}

/**
 * Enrichit un contenu avec des images optimisées
 * @param {Object} content - Objet contenant les données du contenu
 * @returns {Promise<Object>} - Objet contenu enrichi
 */
async function enrichContentWithImages(content) {
  // Traiter les images du contenu
  const images = await processContentImages(content);
  
  // Transformer l'objet contenu
  return transformContentObject(content, images);
}

/**
 * Enrichit une liste de contenus avec des images optimisées
 * @param {Array<Object>} contents - Liste d'objets contenant les données des contenus
 * @returns {Promise<Array<Object>>} - Liste d'objets contenus enrichis
 */
async function enrichContentsWithImages(contents) {
  // Traiter les contenus en parallèle pour optimiser les performances
  const enrichedContents = await Promise.all(
    contents.map(content => enrichContentWithImages(content))
  );
  
  return enrichedContents;
}

/**
 * Wrapper pour le scraper existant qui ajoute la gestion des images
 * @param {Function} originalScraper - Fonction de scraping originale
 * @returns {Function} - Nouvelle fonction de scraping avec gestion des images
 */
function createImageEnhancedScraper(originalScraper) {
  return async function(...args) {
    // Appeler le scraper original
    const scrapedData = await originalScraper(...args);
    
    // Si les données scrapées sont un tableau, enrichir chaque élément
    if (Array.isArray(scrapedData)) {
      return enrichContentsWithImages(scrapedData);
    }
    
    // Si les données scrapées sont un objet, l'enrichir
    return enrichContentWithImages(scrapedData);
  };
}

// Exporter les fonctions
module.exports = {
  enrichContentWithImages,
  enrichContentsWithImages,
  createImageEnhancedScraper
};
