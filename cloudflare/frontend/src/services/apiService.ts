/**
 * Service API pour FloDrama
 * 
 * Ce fichier contient les fonctions pour interagir avec l'API backend
 * de FloDrama hébergée sur Cloudflare Workers.
 */

// Import des types et services nécessaires
import { ContentItem } from '../types/content';
import mockDataService from './mockDataService';

// Types exportés
export type ContentType = 'film' | 'drama' | 'anime' | 'bollywood';

// Configuration de l'API
const API_BASE_URL = 'https://flodrama-api.florifavi.workers.dev';
const USE_MOCK_DATA = false; // Utiliser l'API réelle maintenant que toutes les routes sont implémentées

// Fonction utilitaire pour gérer les erreurs de fetch
async function fetchWithErrorHandling(url: string, options: RequestInit = {}): Promise<any> {
  try {
    // Si les données de démonstration sont activées, utiliser les données mockées
    if (USE_MOCK_DATA) {
      console.log(`Utilisation des données de démonstration pour ${url}`);
      
      // Déterminer quel type de données mockées retourner en fonction de l'URL
      if (url.includes('/films')) {
        return mockDataService.getContentByType('film');
      } else if (url.includes('/dramas') || url.includes('/drama')) {
        return mockDataService.getContentByType('drama');
      } else if (url.includes('/animes')) {
        return mockDataService.getContentByType('anime');
      } else if (url.includes('/bollywood')) {
        return mockDataService.getContentByType('bollywood');
      } else if (url.includes('/featured')) {
        return mockDataService.getFeaturedContent();
      } else if (url.includes('/recent')) {
        return mockDataService.getRecentContent();
      } else if (url.includes('/recommendations')) {
        return mockDataService.getRecommendations();
      } else if (url.includes('/continue-watching')) {
        return mockDataService.getContinueWatching();
      } else if (url.match(/\/content\/[a-zA-Z0-9]+/)) {
        const id = url.split('/').pop() || '';
        return mockDataService.getContentById(id);
      } else if (url.includes('/search')) {
        // Extraire la requête de recherche de l'URL ou des options
        const query = options.body ? 
          JSON.parse(options.body as string).query : 
          new URL(url).searchParams.get('q') || '';
        return mockDataService.searchContent(query);
      } else if (url.includes('/similar')) {
        return mockDataService.getRecommendations();
      } else if (url.includes('/trending')) {
        return mockDataService.getRecommendations();
      }
      
      // Fallback pour les autres routes
      return [];
    }
    
    // Sinon, faire l'appel API réel
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Essayer de récupérer les détails de l'erreur depuis la réponse
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || '';
      } catch {
        // Si on ne peut pas parser la réponse, utiliser le statut HTTP
        errorDetails = `Statut HTTP: ${response.status}`;
      }
      
      throw new Error(`Erreur HTTP: ${response.status}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    
    // Si l'API échoue et que les données de démonstration sont activées, utiliser les données mockées comme fallback
    if (USE_MOCK_DATA) {
      console.log(`Utilisation des données de démonstration après erreur pour ${url}`);
      
      // Même logique que ci-dessus pour déterminer le type de données mockées
      if (url.includes('/films')) {
        return mockDataService.getContentByType('film');
      } else if (url.includes('/dramas') || url.includes('/drama')) {
        return mockDataService.getContentByType('drama');
      } else if (url.includes('/animes')) {
        return mockDataService.getContentByType('anime');
      } else if (url.includes('/bollywood')) {
        return mockDataService.getContentByType('bollywood');
      } else if (url.includes('/featured')) {
        return mockDataService.getFeaturedContent();
      } else if (url.includes('/recent')) {
        return mockDataService.getRecentContent();
      } else if (url.includes('/recommendations')) {
        return mockDataService.getRecommendations();
      } else if (url.includes('/continue-watching')) {
        return mockDataService.getContinueWatching();
      } else if (url.match(/\/content\/[a-zA-Z0-9]+/)) {
        const id = url.split('/').pop() || '';
        return mockDataService.getContentById(id);
      } else if (url.includes('/search')) {
        const query = options.body ? 
          JSON.parse(options.body as string).query : 
          new URL(url).searchParams.get('q') || '';
        return mockDataService.searchContent(query);
      } else if (url.includes('/similar')) {
        return mockDataService.getRecommendations();
      } else if (url.includes('/trending')) {
        return mockDataService.getRecommendations();
      }
      
      // Fallback pour les autres routes
      return [];
    }
    
    // Si les données de démonstration ne sont pas activées, propager l'erreur
    throw error;
  }
}

// Fonction pour vérifier l'état de l'API
export async function checkApiStatus(): Promise<{ status: string; version: string; environment: string }> {
  if (USE_MOCK_DATA) {
    return {
      status: 'ok',
      version: '1.0.0',
      environment: 'development'
    };
  } else {
    return fetchWithErrorHandling(`${API_BASE_URL}/`);
  }
}

// Fonction pour récupérer le contenu par catégorie
export async function fetchContentByCategory(
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<ContentItem[]> {
  return fetchWithErrorHandling(`${API_BASE_URL}/${category}?page=${page}&limit=${limit}`);
}

// Fonction pour récupérer un élément par ID
export async function fetchContentById(id: string): Promise<ContentItem> {
  return fetchWithErrorHandling(`${API_BASE_URL}/content/${id}`);
}

// Fonction pour récupérer le contenu mis en avant pour le Hero Banner
export async function fetchFeaturedContent(): Promise<ContentItem[]> {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/featured`);
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu mis en avant:', error);
    return [];
  }
}

// Fonction pour récupérer le contenu récent pour les grilles de contenu
export async function fetchRecentContent(): Promise<ContentItem[]> {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/recent`);
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu récent:', error);
    return [];
  }
}

// Fonction pour récupérer les recommandations
export async function fetchRecommendations(): Promise<ContentItem[]> {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/recommendations`);
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    return [];
  }
}

// Fonction pour récupérer la liste de lecture en cours
export async function fetchContinueWatching(): Promise<ContentItem[]> {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/continue-watching`);
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste de lecture en cours:', error);
    return [];
  }
}

// Fonction pour rechercher du contenu
export async function searchContent(query: string): Promise<ContentItem[]> {
  try {
    return await fetchWithErrorHandling(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de contenu:', error);
    return [];
  }
}

// Fonctions d'API avec données de démonstration
// Ces fonctions sont utilisées par les composants pour récupérer les données
export const apiService = {
  // Récupérer le contenu par type
  getContentByType: async (type: ContentType, page: number = 1, limit: number = 20): Promise<ContentItem[]> => {
    if (USE_MOCK_DATA) {
      return mockDataService.getContentByType(type) as unknown as ContentItem[];
    } else {
      return fetchContentByCategory(type, page, limit);
    }
  },
  
  // Récupérer le contenu en vedette
  getFeaturedContent: async (): Promise<ContentItem[]> => {
    if (USE_MOCK_DATA) {
      return mockDataService.getFeaturedContent() as unknown as ContentItem[];
    } else {
      return fetchFeaturedContent();
    }
  },
  
  // Récupérer le contenu récent
  getRecentContent: async (): Promise<ContentItem[]> => {
    if (USE_MOCK_DATA) {
      return mockDataService.getRecentContent() as unknown as ContentItem[];
    } else {
      return fetchRecentContent();
    }
  },
  
  // Récupérer un élément par ID
  getContentById: async (id: string): Promise<ContentItem> => {
    if (USE_MOCK_DATA) {
      const content = await mockDataService.getContentById(id);
      return content as unknown as ContentItem;
    } else {
      return fetchContentById(id);
    }
  },
  
  // Rechercher du contenu
  searchContent: async (query: string): Promise<ContentItem[]> => {
    if (USE_MOCK_DATA) {
      return mockDataService.searchContent(query) as unknown as ContentItem[];
    } else {
      return searchContent(query);
    }
  }
};

export default apiService;
