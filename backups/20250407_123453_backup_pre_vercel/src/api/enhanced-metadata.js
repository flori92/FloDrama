/**
 * Service de métadonnées amélioré pour FloDrama
 * Utilise DynamoDB comme source principale et implémente un système de cache local
 */

import AWS from 'aws-sdk';
import AWS_CONFIG, { getPosterUrl, getBackdropUrl } from '../config/aws-config';

// Configuration AWS
AWS.config.update({
  region: AWS_CONFIG.dynamoDB.region
});

// Initialisation du client DynamoDB
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Cache local pour éviter des appels répétés à DynamoDB
const localCache = {
  items: new Map(),
  timestamp: Date.now(),
  ttl: 15 * 60 * 1000 // 15 minutes
};

/**
 * Récupère tous les éléments depuis DynamoDB
 * @returns {Promise<Array>} Liste des éléments
 */
export const fetchAllItems = async () => {
  // Vérifier si le cache local est valide
  if (localCache.items.size > 0 && (Date.now() - localCache.timestamp) < localCache.ttl) {
    console.log('Utilisation du cache local pour les métadonnées');
    return Array.from(localCache.items.values());
  }
  
  console.log('Récupération des métadonnées depuis DynamoDB...');
  
  try {
    const params = {
      TableName: AWS_CONFIG.dynamoDB.tables.cache
    };
    
    const result = await dynamoDB.scan(params).promise();
    
    // Traiter les résultats
    const items = result.Items.map(item => {
      // S'assurer que les URLs des images sont correctes
      return {
        ...item,
        posterUrl: item.posterUrl || getPosterUrl(item.id),
        backdropUrl: item.backdropUrl || getBackdropUrl(item.id)
      };
    });
    
    // Mettre à jour le cache local
    localCache.items.clear();
    items.forEach(item => {
      localCache.items.set(item.id, item);
    });
    localCache.timestamp = Date.now();
    
    console.log(`${items.length} éléments récupérés depuis DynamoDB`);
    return items;
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées depuis DynamoDB:', error);
    
    // En cas d'erreur, essayer de récupérer depuis le fichier local
    try {
      const response = await fetch('/data/metadata.json');
      if (response.ok) {
        const data = await response.json();
        console.log('Métadonnées récupérées depuis le fichier local');
        return data.items || [];
      }
    } catch (fallbackError) {
      console.error('Erreur lors de la récupération du fallback:', fallbackError);
    }
    
    throw error;
  }
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
  
  console.log(`Récupération de l'élément ${id} depuis DynamoDB...`);
  
  try {
    const params = {
      TableName: AWS_CONFIG.dynamoDB.tables.cache,
      Key: {
        id: id
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      throw new Error(`Élément ${id} non trouvé`);
    }
    
    // S'assurer que les URLs des images sont correctes
    const item = {
      ...result.Item,
      posterUrl: result.Item.posterUrl || getPosterUrl(result.Item.id),
      backdropUrl: result.Item.backdropUrl || getBackdropUrl(result.Item.id)
    };
    
    // Mettre à jour le cache local
    localCache.items.set(id, item);
    
    return item;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'élément ${id}:`, error);
    throw error;
  }
};

/**
 * Récupère les éléments par type
 * @param {string} type - Type d'élément (movie, drama, anime, etc.)
 * @returns {Promise<Array>} Liste des éléments du type spécifié
 */
export const fetchItemsByType = async (type) => {
  const allItems = await fetchAllItems();
  return allItems.filter(item => item.type === type);
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

/**
 * Récupère les éléments populaires
 * @param {number} limit - Nombre d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments populaires
 */
export const fetchPopularItems = async (limit = 10) => {
  const allItems = await fetchAllItems();
  
  // Trier par note (rating) décroissante
  return allItems
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
};

/**
 * Récupère les éléments récents
 * @param {number} limit - Nombre d'éléments à récupérer
 * @returns {Promise<Array>} Liste des éléments récents
 */
export const fetchRecentItems = async (limit = 10) => {
  const allItems = await fetchAllItems();
  
  // Trier par année décroissante
  return allItems
    .sort((a, b) => (b.year || 0) - (a.year || 0))
    .slice(0, limit);
};

// Exporter toutes les fonctions
export default {
  fetchAllItems,
  fetchItemById,
  fetchItemsByType,
  searchItems,
  fetchPopularItems,
  fetchRecentItems
};
