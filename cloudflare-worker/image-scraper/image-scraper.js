/**
 * Scraper d'images pour FloDrama
 * Ce module permet de récupérer, traiter et stocker les images des contenus scrapés
 */

// Dépendances
const crypto = require('crypto');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const IMAGE_DELIVERY_URL = 'https://images.flodrama.com';

/**
 * Génère un ID unique pour une image basé sur son URL et son type
 * @param {string} url - URL de l'image source
 * @param {string} type - Type d'image (poster, backdrop, etc.)
 * @returns {string} - ID unique pour l'image
 */
function generateUniqueId(url, type) {
  // Créer un hash MD5 de l'URL
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return `${type}_${hash}`;
}

/**
 * Télécharge et stocke une image sur Cloudflare Images
 * @param {string} url - URL de l'image à télécharger
 * @param {string} type - Type d'image (poster, backdrop, etc.)
 * @returns {Promise<string|null>} - ID de l'image stockée ou null en cas d'erreur
 */
async function downloadAndStoreImage(url, type) {
  if (!url) return null;
  
  try {
    console.log(`Téléchargement de l'image ${type} depuis ${url}`);
    
    // Télécharger l'image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Générer un ID unique basé sur l'URL et le type
    const uniqueId = generateUniqueId(url, type);
    
    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append('file', Buffer.from(imageBuffer), {
      filename: `${uniqueId}.jpg`,
      contentType: 'image/jpeg'
    });
    formData.append('id', uniqueId);
    formData.append('metadata', JSON.stringify({
      source_url: url,
      type: type,
      content_type: 'movie'
    }));
    
    // Stocker sur Cloudflare Images
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: formData
      }
    );
    
    const result = await uploadResponse.json();
    
    if (!result.success) {
      console.error('Erreur lors du stockage de l\'image:', result.errors);
      return null;
    }
    
    console.log(`Image ${type} stockée avec succès, ID: ${uniqueId}`);
    
    // Retourner l'ID de l'image stockée
    return uniqueId;
  } catch (error) {
    console.error(`Erreur lors du téléchargement de l'image ${url}:`, error);
    return null;
  }
}

/**
 * Vérifie si une image existe déjà sur Cloudflare Images
 * @param {string} imageId - ID de l'image à vérifier
 * @returns {Promise<boolean>} - true si l'image existe, false sinon
 */
async function checkImageExists(imageId) {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        }
      }
    );
    
    // Si la réponse est 200, l'image existe
    return response.status === 200;
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'image ${imageId}:`, error);
    return false;
  }
}

/**
 * Construit l'URL d'une image stockée sur Cloudflare Images
 * @param {string} imageId - ID de l'image
 * @param {string} size - Taille de l'image (small, medium, large, original)
 * @returns {string} - URL complète de l'image
 */
function getImageUrl(imageId, size = 'medium') {
  if (!imageId) return '/default-image.png';
  
  const sizes = {
    small: 'w200',
    medium: 'w500',
    large: 'w1000',
    original: 'original'
  };
  
  const sizeParam = sizes[size] || sizes.medium;
  return `${IMAGE_DELIVERY_URL}/${sizeParam}/${imageId}`;
}

/**
 * Extrait et stocke les images d'un contenu
 * @param {Object} content - Objet contenant les données du contenu
 * @returns {Promise<Object>} - Objet contenant les IDs des images stockées
 */
async function processContentImages(content) {
  // Initialiser l'objet images
  const images = {
    poster: null,
    backdrop: null,
    thumbnail: null
  };
  
  // Extraire les URLs des images du contenu
  const posterUrl = content.poster_url || content.poster_path || content.image_url;
  const backdropUrl = content.backdrop_url || content.backdrop_path || content.banner_url || content.background_url;
  
  // Traiter les images en parallèle
  const [posterId, backdropId] = await Promise.all([
    posterUrl ? downloadAndStoreImage(posterUrl, 'poster') : null,
    backdropUrl ? downloadAndStoreImage(backdropUrl, 'backdrop') : null
  ]);
  
  // Mettre à jour l'objet images
  images.poster = posterId;
  images.backdrop = backdropId;
  
  // Générer une miniature à partir du poster si disponible
  if (posterId) {
    images.thumbnail = posterId; // Utiliser le même ID que le poster pour la miniature
  }
  
  return images;
}

// Exporter les fonctions
module.exports = {
  generateUniqueId,
  downloadAndStoreImage,
  checkImageExists,
  getImageUrl,
  processContentImages
};
