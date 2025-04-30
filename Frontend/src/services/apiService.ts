import { API_BASE_URL, CDN_BASE_URL } from '../config';

// Mappage des catégories frontend vers les catégories backend
const CATEGORY_MAPPING: Record<string, string> = {
  'dramas': 'dramas',
  'movies': 'movies',
  'anime': 'anime',
  'bollywood': 'bollywood',
  'trending': 'popular', // Le backend utilise "popular" au lieu de "trending"
  'popular': 'popular',
  'recently': 'recently',
  'topRated': 'topRated'
};

// Types pour les données de l'API
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  image: string;
  streamUrl?: string;
  trailerUrl?: string;
  year?: number;
  rating?: string;
  duration?: string;
  categories: string[];
  actors?: string[];
  director?: string;
  match?: number; // Pourcentage de correspondance
}

export interface CategoryResponse {
  items: ContentItem[];
  total: number;
  category: string;
}

export interface FeaturedResponse {
  items: ContentItem[];
  total: number;
}

/**
 * Récupère les contenus par catégorie
 * @param category Catégorie à récupérer (frontend)
 * @param page Numéro de page (optionnel)
 * @param limit Nombre d'éléments par page (optionnel)
 * @returns Promesse contenant les données de la catégorie
 */
export const getContentByCategory = async (
  category: string,
  page: number = 1,
  limit: number = 20
): Promise<CategoryResponse> => {
  try {
    // Mappage de la catégorie frontend vers la catégorie backend
    const mappedCategory = CATEGORY_MAPPING[category] || category;
    
    const response = await fetch(
      `${API_BASE_URL}/api/content/?category=${mappedCategory}&page=${page}&limit=${limit}`
    );
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`API response not OK for category ${category} (mapped to ${mappedCategory}). Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-${category}-${i}`,
          title: `Contenu ${category} ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          image: `${CDN_BASE_URL}/static/placeholders/${category}-${i % 5 + 1}.jpg`,
          categories: [category],
          year: 2025,
          rating: "4.5"
        })),
        total: limit,
        category
      };
    }
    
    const data = await response.json();
    return {
      items: data.items || [],
      total: data.total || 0,
      category
    };
  } catch (error) {
    console.error(`Error fetching content for category ${category}:`, error);
    // Renvoyer un objet vide plutôt que de provoquer une erreur
    return { items: [], total: 0, category };
  }
};

/**
 * Récupère les contenus mis en avant
 * @param limit Nombre d'éléments à récupérer
 * @returns Promesse contenant les données mises en avant
 */
export const getFeaturedContent = async (limit: number = 6): Promise<FeaturedResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/?category=featured&limit=${limit}`);
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`API response not OK for featured content. Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-featured-${i}`,
          title: `Contenu à découvrir ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          image: `${CDN_BASE_URL}/static/placeholders/featured-${i % 5 + 1}.jpg`,
          categories: ["featured", i % 2 === 0 ? "dramas" : "movies"],
          year: 2025,
          rating: "4.8"
        })),
        total: limit
      };
    }
    
    const data = await response.json();
    return {
      items: data.items || [],
      total: data.total || 0
    };
  } catch (error) {
    console.error('Error fetching featured content:', error);
    return { items: [], total: 0 };
  }
};

/**
 * Récupère les détails d'un contenu spécifique
 * @param id ID du contenu à récupérer
 * @returns Promesse contenant les détails du contenu
 */
export const getContentDetails = async (id: string): Promise<ContentItem | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching content details for ID ${id}:`, error);
    return null;
  }
};

/**
 * Récupère l'URL de streaming d'un contenu
 * @param id ID du contenu
 * @returns Promesse contenant l'URL de streaming
 */
export const getStreamUrl = async (id: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content/${id}/stream`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.streamUrl || null;
  } catch (error) {
    console.error(`Error fetching stream URL for ID ${id}:`, error);
    return null;
  }
};

export default {
  getContentByCategory,
  getFeaturedContent,
  getContentDetails,
  getStreamUrl
};
