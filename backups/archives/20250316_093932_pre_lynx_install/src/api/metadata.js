/**
 * Configuration de l'API pour les métadonnées enrichies
 * Ce fichier gère l'accès aux métadonnées de FloDrama via CloudFront
 * avec intégration Bunny CDN pour les vidéos
 */

import { BUNNY_CDN_CONFIG } from '../utils/bunny-cdn-config';
// import { getBunnyVideoUrl } from '../utils/bunny-cdn-integration';

// URLs pour les métadonnées
const METADATA_URL = 'https://api.flodrama.com/metadata';
const FALLBACK_URL = 'https://d2ra390ol17u3n.cloudfront.net/data/metadata.json';
const LOCAL_FALLBACK_PATH = '/data/metadata.json';

// URL de base pour les assets (posters, bannières, etc.)
export const ASSETS_URL = 'https://flodrama.com/assets';

// URL de base pour les vidéos via Bunny CDN
export const VIDEOS_URL = BUNNY_CDN_CONFIG.baseUrl;

/**
 * Récupère les métadonnées depuis l'API ou le fallback
 * @returns {Promise<Object>} Les métadonnées
 */
export const fetchMetadata = async () => {
  try {
    // Utiliser d'abord le fichier local pour le développement
    console.log('Tentative de récupération des métadonnées depuis le fichier local...');
    const localResponse = await fetch(LOCAL_FALLBACK_PATH, { 
      headers: { 'Accept': 'application/json' }
    });
    
    if (localResponse.ok) {
      const data = await localResponse.json();
      console.log('Métadonnées récupérées avec succès depuis le fichier local');
      return data;
    }
    
    console.log('Fichier local non disponible, tentative de récupération depuis l\'API...');
    const response = await fetch(METADATA_URL, { 
      headers: { 'Accept': 'application/json' },
      timeout: 5000 // Timeout de 5 secondes
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Métadonnées récupérées avec succès depuis l\'API');
    return data;
  } catch (error) {
    console.warn(`Échec de récupération depuis l'API: ${error.message}`);
    
    try {
      console.log('Tentative de récupération depuis CloudFront...');
      const fallbackResponse = await fetch(FALLBACK_URL, { 
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`Erreur HTTP fallback: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      console.log('Métadonnées récupérées avec succès depuis CloudFront');
      return fallbackData;
    } catch (fallbackError) {
      console.warn(`Échec de récupération depuis CloudFront: ${fallbackError.message}`);
      
      try {
        console.log('Tentative de récupération depuis le fichier local...');
        const localResponse = await fetch(LOCAL_FALLBACK_PATH);
        
        if (!localResponse.ok) {
          throw new Error(`Erreur HTTP local: ${localResponse.status}`);
        }
        
        const localData = await localResponse.json();
        console.log('Métadonnées récupérées avec succès depuis le fichier local');
        return localData;
      } catch (localError) {
        console.error('Erreur de fallback:', localError);
        
        // Dernier recours : retourner des métadonnées minimales
        console.warn('Utilisation des métadonnées de secours minimales');
        return {
          dramas: [],
          movies: [],
          categories: [],
          featured: [],
          trending: [],
          _metadata: {
            version: 'fallback-minimal',
            timestamp: new Date().toISOString(),
            source: 'minimal-fallback'
          }
        };
      }
    }
  }
};

/**
 * Construit l'URL complète pour un asset
 * @param {string} path - Chemin relatif de l'asset
 * @returns {string} URL complète
 */
export const getAssetUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300x450?text=Image+non+disponible';
  
  // Si le chemin est déjà une URL complète, la retourner telle quelle
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Nettoyer le chemin pour éviter les doubles slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Si le chemin commence déjà par 'assets/', ne pas l'ajouter à nouveau
  if (cleanPath.startsWith('assets/')) {
    return `${ASSETS_URL}/${cleanPath.substring(7)}`;
  }
  
  // Construire l'URL complète
  return `${ASSETS_URL}/${cleanPath}`;
};

/**
 * Récupère l'URL d'une vidéo avec Bunny CDN
 * @param {Object} item - Élément média (drama, film, etc.)
 * @param {string} episode - Numéro d'épisode (optionnel)
 * @returns {string} URL de la vidéo
 */
export const getVideoUrl = (item, episode = null) => {
  if (!item) return '';
  
  // Si c'est un film, utiliser directement l'ID du film
  if (item.type === 'movie' || !episode) {
    return `${VIDEOS_URL}/${item.id}/play.mp4`;
  }
  
  // Pour un drama, construire l'URL avec l'épisode
  return `${VIDEOS_URL}/${item.id}/episodes/${episode}/play.mp4`;
};

/**
 * Récupère les informations d'un épisode
 * @param {string} dramaId - Identifiant du drama
 * @param {number} season - Numéro de saison
 * @param {number} episode - Numéro d'épisode
 * @param {Object} metadata - Métadonnées complètes
 * @returns {Object|null} Informations de l'épisode
 */
export const getEpisodeInfo = (dramaId, season, episode, metadata) => {
  try {
    if (!metadata || !metadata.dramas) {
      console.error('Métadonnées invalides');
      return null;
    }
    
    const drama = metadata.dramas.find(d => d.id === dramaId);
    
    if (!drama) {
      console.warn(`Drama non trouvé: ${dramaId}`);
      return null;
    }
    
    const seasonData = drama.seasons.find(s => s.number === parseInt(season));
    
    if (!seasonData) {
      console.warn(`Saison non trouvée: ${season} pour ${dramaId}`);
      return null;
    }
    
    const episodeData = seasonData.episodes.find(e => e.number === parseInt(episode));
    
    if (!episodeData) {
      console.warn(`Épisode non trouvé: ${episode} pour ${dramaId} saison ${season}`);
      return null;
    }
    
    return {
      ...episodeData,
      dramaTitle: drama.title,
      seasonNumber: seasonData.number,
      thumbnail: episodeData.thumbnail || drama.thumbnail,
      videoId: episodeData.videoId || `${dramaId}_s${season}_e${episode}`
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations d\'épisode:', error);
    return null;
  }
};

// Définir l'objet à exporter par défaut
const metadataAPI = {
  fetchMetadata,
  getVideoUrl,
  getEpisodeInfo,
  getAssetUrl
};

export default metadataAPI;
