// Service de récupération et mise en cache des métadonnées
import { getToken } from './authService';

const API_ENDPOINTS = {
  TRENDING: 'https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod/content/trending',
  CATALOG: 'https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod/content/catalog',
  RECOMMENDATIONS: 'https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod/recommendations',
  DETAIL: 'https://bijwwhvch9.execute-api.eu-west-3.amazonaws.com/prod/content/detail'
};

// Gestion du cache local avec expiration
const metadataCache = {
  data: {},
  timestamp: {},
  EXPIRATION: 15 * 60 * 1000 // 15 minutes
};

// Vérifier si les données en cache sont valides
const isCacheValid = (key) => {
  if (!metadataCache.data[key] || !metadataCache.timestamp[key]) return false;
  
  const now = Date.now();
  const age = now - metadataCache.timestamp[key];
  return age < metadataCache.EXPIRATION;
};

// Récupérer les données avec cache intelligent
export const fetchMetadata = async (endpoint, params = {}) => {
  // Construire une clé de cache unique basée sur l'endpoint et les paramètres
  const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
  
  // Vérifier si nous avons des données en cache valides
  if (isCacheValid(cacheKey)) {
    console.log('Utilisation des métadonnées en cache pour:', cacheKey);
    return metadataCache.data[cacheKey];
  }
  
  try {
    // Construire l'URL avec les paramètres
    const url = new URL(API_ENDPOINTS[endpoint]);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    // Récupérer le token d'authentification
    const token = await getToken();
    
    // Effectuer la requête avec le token
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    // Traiter et mettre en cache la réponse
    const data = await response.json();
    metadataCache.data[cacheKey] = data;
    metadataCache.timestamp[cacheKey] = Date.now();
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées:', error);
    
    // En cas d'erreur, utiliser les données en cache même expirées si disponibles
    if (metadataCache.data[cacheKey]) {
      console.warn('Utilisation des métadonnées en cache expirées');
      return metadataCache.data[cacheKey];
    }
    
    // Si pas de cache, utiliser les données de secours
    return getFallbackData(endpoint);
  }
};

// Données de secours en cas d'erreur API
const getFallbackData = (endpoint) => {
  // Données minimales locales pour assurer le fonctionnement de l'interface
  const fallbackData = {
    TRENDING: { items: [] },
    CATALOG: { items: [] },
    RECOMMENDATIONS: { items: [] },
    DETAIL: { item: {} }
  };
  
  // Ajouter quelques éléments locaux pour éviter une interface vide
  fallbackData.TRENDING.items = dramaData.slice(0, 5);
  fallbackData.CATALOG.items = dramaData;
  
  return fallbackData[endpoint] || { items: [] };
};

// Récupérer les tendances
export const getTrending = () => fetchMetadata('TRENDING');

// Récupérer le catalogue avec filtres
export const getCatalog = (filters = {}) => fetchMetadata('CATALOG', filters);

// Récupérer les recommandations personnalisées
export const getRecommendations = (userId) => fetchMetadata('RECOMMENDATIONS', { userId });

// Récupérer les détails d'un contenu
export const getContentDetail = (contentId) => fetchMetadata('DETAIL', { id: contentId }); 