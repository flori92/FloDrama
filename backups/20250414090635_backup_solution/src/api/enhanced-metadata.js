/**
 * Service de métadonnées amélioré pour FloDrama
 * Utilise des données locales et implémente un système de cache local
 */

import { getPosterUrl, getBackdropUrl } from '../config/aws-config';
import mockData from './mock-data';

// Cache local pour éviter des appels répétés
const localCache = {
  items: new Map(),
  timestamp: Date.now(),
  ttl: 15 * 60 * 1000 // 15 minutes
};

// Initialiser le cache avec les données mockées au chargement du module
(function initializeCache() {
  try {
    console.log('Initialisation du cache avec les données mockées');
    const processedItems = mockData.items.map(item => ({
      ...item,
      posterUrl: item.posterUrl || getPosterUrl(item.id),
      backdropUrl: item.backdropUrl || getBackdropUrl(item.id)
    }));
    
    processedItems.forEach(item => {
      localCache.items.set(item.id, item);
    });
    
    console.log(`Cache initialisé avec ${processedItems.length} éléments`);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du cache:', error);
  }
})();

/**
 * Récupère tous les éléments
 * @returns {Promise<Array>} Liste des éléments
 */
export const fetchAllItems = async () => {
  // Vérifier si le cache local est valide
  if (localCache.items.size > 0 && (Date.now() - localCache.timestamp) < localCache.ttl) {
    console.log('Utilisation du cache local pour les métadonnées');
    return Array.from(localCache.items.values());
  }
  
  console.log('Récupération des métadonnées...');
  
  try {
    // TOUJOURS utiliser les données mockées pour éviter les erreurs
    const items = mockData.items;
    
    // Traiter les résultats
    const processedItems = items.map(item => {
      // S'assurer que les URLs des images sont correctes
      return {
        ...item,
        posterUrl: item.posterUrl || getPosterUrl(item.id),
        backdropUrl: item.backdropUrl || getBackdropUrl(item.id)
      };
    });
    
    // Mettre à jour le cache local
    localCache.items.clear();
    processedItems.forEach(item => {
      localCache.items.set(item.id, item);
    });
    localCache.timestamp = Date.now();
    
    return processedItems;
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    
    // En cas d'erreur, utiliser les données mockées comme fallback
    const fallbackItems = mockData.items.map(item => ({
      ...item,
      posterUrl: item.posterUrl || getPosterUrl(item.id),
      backdropUrl: item.backdropUrl || getBackdropUrl(item.id)
    }));
    
    return fallbackItems;
  }
};

/**
 * Récupère les éléments populaires
 * @param {number} limit Nombre maximum d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments populaires
 */
export const fetchPopularItems = async (limit = 20) => {
  const allItems = await fetchAllItems();
  
  // Trier par popularité (basée sur la note et le nombre de vues)
  return allItems
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * 0.6 + (a.views || 0) * 0.4;
      const scoreB = (b.rating || 0) * 0.6 + (b.views || 0) * 0.4;
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

/**
 * Récupère les éléments récemment ajoutés
 * @param {number} limit Nombre maximum d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments récents
 */
export const fetchRecentItems = async (limit = 20) => {
  const allItems = await fetchAllItems();
  
  // Trier par date d'ajout (du plus récent au plus ancien)
  return allItems
    .sort((a, b) => {
      const dateA = a.addedDate ? new Date(a.addedDate) : new Date(0);
      const dateB = b.addedDate ? new Date(b.addedDate) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, limit);
};

/**
 * Récupère les éléments par type
 * @param {string} type Type d'élément (drama, movie, anime, etc.)
 * @param {number} limit Nombre maximum d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments du type spécifié
 */
export const fetchItemsByType = async (type, limit = 20) => {
  const allItems = await fetchAllItems();
  
  // Filtrer par type
  return allItems
    .filter(item => item.type === type || item.category === type)
    .slice(0, limit);
};

/**
 * Récupère les éléments "Continuer à regarder" pour un utilisateur
 * @param {string} userId Identifiant de l'utilisateur
 * @param {number} limit Nombre maximum d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments en cours de visionnage
 */
export const fetchContinueWatching = async (userId, limit = 10) => {
  // Toujours utiliser des données mockées
  const allItems = await fetchAllItems();
  
  // Simuler des éléments en cours de visionnage (prendre quelques éléments aléatoires)
  const randomItems = allItems
    .sort(() => 0.5 - Math.random())
    .slice(0, limit);
  
  return randomItems.map(item => ({
    ...item,
    progress: Math.floor(Math.random() * 80) + 10, // Progrès entre 10% et 90%
    lastWatched: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() // Dans les 7 derniers jours
  }));
};

/**
 * Récupère un élément par son ID
 * @param {string} id - ID de l'élément
 * @returns {Promise<Object>} Élément trouvé
 */
export const fetchItemById = async (id) => {
  // Vérifier si l'élément est dans le cache local
  if (localCache.items.has(id) && (Date.now() - localCache.timestamp) < localCache.ttl) {
    console.log(`Utilisation du cache local pour l'élément ${id}`);
    return localCache.items.get(id);
  }
  
  console.log(`Récupération de l'élément ${id}...`);
  
  try {
    const allItems = await fetchAllItems();
    const item = allItems.find(item => item.id === id);
    
    if (!item) {
      throw new Error(`Élément ${id} non trouvé`);
    }
    
    return item;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'élément ${id}:`, error);
    throw error;
  }
};

/**
 * Recherche des éléments par titre
 * @param {string} query - Requête de recherche
 * @returns {Promise<Array>} Liste des éléments correspondants
 */
export const searchItems = async (query) => {
  const allItems = await fetchAllItems();
  
  if (!query || query.trim() === '') {
    return allItems;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return allItems.filter(item => {
    const title = item.title?.toLowerCase() || '';
    const originalTitle = item.originalTitle?.toLowerCase() || '';
    
    return title.includes(normalizedQuery) || 
           originalTitle.includes(normalizedQuery);
  });
};

// Exporter toutes les fonctions
export default {
  fetchAllItems,
  fetchItemById,
  fetchItemsByType,
  searchItems,
  fetchPopularItems,
  fetchRecentItems,
  fetchContinueWatching
};
