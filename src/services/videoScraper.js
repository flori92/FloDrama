/**
 * Service de scraping pour récupérer les liens vidéos
 * Permet de récupérer les liens de streaming directement depuis les sources externes
 * sans stocker les vidéos sur nos infrastructures
 */

import axios from 'axios';
import { logError } from '../utils/logger';

// Configuration des sources de scraping
const SCRAPING_SOURCES = {
  DRAMA: [
    { name: 'Source 1', baseUrl: 'https://api.source1.com/drama' },
    { name: 'Source 2', baseUrl: 'https://api.source2.com/kdrama' },
    { name: 'Source 3', baseUrl: 'https://api.source3.com/series' }
  ],
  MOVIE: [
    { name: 'Source 1', baseUrl: 'https://api.source1.com/movie' },
    { name: 'Source 2', baseUrl: 'https://api.source2.com/film' },
    { name: 'Source 3', baseUrl: 'https://api.source3.com/cinema' }
  ]
};

// Cache pour stocker temporairement les résultats de scraping
const videoCache = new Map();
const CACHE_DURATION = 3600000; // 1 heure en millisecondes

/**
 * Récupère les liens vidéos pour un contenu spécifique
 * @param {string} contentId - ID du contenu (drama ou film)
 * @param {string} type - Type de contenu ('DRAMA' ou 'MOVIE')
 * @param {Object} options - Options supplémentaires (saison, épisode, qualité, etc.)
 * @returns {Promise<Array>} - Liste des liens vidéos disponibles
 */
export const fetchVideoLinks = async (contentId, type = 'DRAMA', options = {}) => {
  const cacheKey = generateCacheKey(contentId, type, options);
  
  // Vérifier si les données sont en cache et encore valides
  if (videoCache.has(cacheKey)) {
    const cachedData = videoCache.get(cacheKey);
    if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`[VideoScraper] Utilisation des données en cache pour ${contentId}`);
      return cachedData.links;
    }
  }
  
  console.log(`[VideoScraper] Récupération des liens pour ${contentId} (${type})`);
  
  // Sélectionner les sources appropriées en fonction du type
  const sources = SCRAPING_SOURCES[type] || SCRAPING_SOURCES.DRAMA;
  
  // Récupérer les liens depuis toutes les sources disponibles
  const linksPromises = sources.map(source => 
    fetchFromSource(source, contentId, options)
      .catch(error => {
        logError(`Erreur lors du scraping depuis ${source.name}`, error);
        return []; // Retourner un tableau vide en cas d'erreur
      })
  );
  
  // Attendre que toutes les requêtes soient terminées
  const results = await Promise.all(linksPromises);
  
  // Fusionner et filtrer les résultats
  const links = results
    .flat()
    .filter(link => link && link.url); // Filtrer les liens invalides
  
  // Mettre en cache les résultats
  if (links.length > 0) {
    videoCache.set(cacheKey, {
      links,
      timestamp: Date.now()
    });
  }
  
  return links;
};

/**
 * Récupère les liens vidéos depuis une source spécifique
 * @param {Object} source - Source de scraping
 * @param {string} contentId - ID du contenu
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<Array>} - Liste des liens vidéos de cette source
 */
const fetchFromSource = async (source, contentId, options) => {
  try {
    const { season = 1, episode = 1, quality = 'auto' } = options;
    
    // Construire l'URL de l'API en fonction de la source
    const url = `${source.baseUrl}/${contentId}`;
    const params = { season, episode, quality };
    
    // Effectuer la requête
    const response = await axios.get(url, { params });
    
    if (!response.data || !response.data.links) {
      return [];
    }
    
    // Transformer les données pour un format uniforme
    return response.data.links.map(link => ({
      url: link.url,
      quality: link.quality || quality,
      source: source.name,
      format: link.format || 'mp4',
      subtitles: link.subtitles || []
    }));
  } catch (error) {
    logError(`Erreur lors de la récupération depuis ${source.name}`, error);
    return [];
  }
};

/**
 * Génère une clé de cache unique pour un contenu
 * @param {string} contentId - ID du contenu
 * @param {string} type - Type de contenu
 * @param {Object} options - Options supplémentaires
 * @returns {string} - Clé de cache
 */
const generateCacheKey = (contentId, type, options) => {
  const { season = 1, episode = 1, quality = 'auto' } = options;
  return `${type}_${contentId}_S${season}E${episode}_${quality}`;
};

/**
 * Vérifie si un lien vidéo est toujours valide
 * @param {string} url - URL du lien vidéo
 * @returns {Promise<boolean>} - true si le lien est valide, false sinon
 */
export const checkLinkValidity = async (url) => {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
};

/**
 * Nettoie le cache des liens vidéos
 * Supprime les entrées expirées
 */
export const cleanVideoCache = () => {
  const now = Date.now();
  let expiredCount = 0;
  
  videoCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_DURATION) {
      videoCache.delete(key);
      expiredCount++;
    }
  });
  
  console.log(`[VideoScraper] Nettoyage du cache : ${expiredCount} entrées supprimées`);
};

// Nettoyer le cache toutes les heures
setInterval(cleanVideoCache, CACHE_DURATION);
