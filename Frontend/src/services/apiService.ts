import { API_BASE_URL, CDN_BASE_URL, apiConfig } from '../config.ts';

// Mappage des catégories frontend vers les catégories backend
const CATEGORY_MAPPING: Record<string, string> = {
  'dramas': 'drama',      // Correction : doit pointer vers la catégorie backend "drama"
  'movies': 'film',       // Correction : doit pointer vers la catégorie backend "film"
  'anime': 'anime',
  'bollywood': 'bollywood',
  'trending': 'popular',  // Le backend utilise "popular" au lieu de "trending"
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

// Log de debug pour diagnostic API
console.log('[API DEBUG] API_BASE_URL =', API_BASE_URL);
console.log('[API DEBUG] Utilisation de Supabase pour les données');

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
    let mappedCategory = CATEGORY_MAPPING[category];
    if (!mappedCategory) {
      console.warn(`Catégorie frontend "${category}" non mappée vers le backend. Fallback sur "popular".`);
      mappedCategory = 'popular';
    }
    
    // Calcul de l'offset pour la pagination
    const offset = (page - 1) * limit;
    
    // Construction de l'URL pour l'API Supabase
    const url = `${API_BASE_URL}/content?category=eq.${mappedCategory}&order=created_at.desc&limit=${limit}&offset=${offset}`;
    console.log(`[API DEBUG] Fetching category: ${category} (mapped: ${mappedCategory}) URL:`, url);
    
    // Ajout des en-têtes nécessaires pour Supabase
    const response = await fetch(url, {
      headers: {
        'apikey': apiConfig.supabaseKey,
        'Authorization': `Bearer ${apiConfig.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`API response not OK for category ${category} (mapped to ${mappedCategory}). Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-${category}-${i}`,
          title: `Contenu ${category} ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          image: `${CDN_BASE_URL}/placeholders/${category}-${i % 5 + 1}.jpg`,
          categories: [category],
          year: 2025,
          rating: "4.5"
        })),
        total: limit,
        category
      };
    }
    
    // Récupération du nombre total d'éléments depuis les en-têtes
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');
    
    const data = await response.json();
    console.log(`[API DEBUG] Response for ${category}:`, data);
    
    // Transformation des données Supabase au format attendu par le frontend
    const items = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      image: item.poster_url || `${CDN_BASE_URL}/placeholders/${category}-1.jpg`,
      streamUrl: item.stream_url,
      trailerUrl: item.trailer_url,
      year: item.year,
      rating: item.rating,
      duration: item.duration,
      categories: item.categories || [mappedCategory],
      actors: item.actors,
      director: item.director,
      match: item.match
    }));
    
    return {
      items,
      total: totalCount || items.length,
      category
    };
  } catch (error) {
    console.error(`[API ERROR] Error fetching content for category ${category}:`, error);
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
    // Construction de l'URL pour l'API Supabase avec filtre sur featured=true
    const url = `${API_BASE_URL}/content?featured=eq.true&order=created_at.desc&limit=${limit}`;
    console.log(`[API DEBUG] Fetching featured content URL:`, url);
    
    // Ajout des en-têtes nécessaires pour Supabase
    const response = await fetch(url, {
      headers: {
        'apikey': apiConfig.supabaseKey,
        'Authorization': `Bearer ${apiConfig.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`API response not OK for featured content. Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-featured-${i}`,
          title: `Contenu à découvrir ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          image: `${CDN_BASE_URL}/placeholders/featured-${i % 5 + 1}.jpg`,
          categories: ["featured", i % 2 === 0 ? "dramas" : "movies"],
          year: 2025,
          rating: "4.8"
        })),
        total: limit
      };
    }
    
    // Récupération du nombre total d'éléments depuis les en-têtes
    const totalCount = parseInt(response.headers.get('content-range')?.split('/')[1] || '0');
    
    const data = await response.json();
    
    // Transformation des données Supabase au format attendu par le frontend
    const items = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      image: item.poster_url || `${CDN_BASE_URL}/placeholders/featured-1.jpg`,
      streamUrl: item.stream_url,
      trailerUrl: item.trailer_url,
      year: item.year,
      rating: item.rating,
      duration: item.duration,
      categories: item.categories || ['featured'],
      actors: item.actors,
      director: item.director,
      match: item.match
    }));
    
    return {
      items,
      total: totalCount || items.length
    };
  } catch (error) {
    console.error('[API ERROR] Error fetching featured content:', error);
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
    // Construction de l'URL pour l'API Supabase
    const url = `${API_BASE_URL}/content?id=eq.${id}`;
    console.log(`[API DEBUG] Fetching content details URL:`, url);
    
    // Ajout des en-têtes nécessaires pour Supabase
    const response = await fetch(url, {
      headers: {
        'apikey': apiConfig.supabaseKey,
        'Authorization': `Bearer ${apiConfig.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Transformation des données Supabase au format attendu par le frontend
    const item = data[0];
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      image: item.poster_url || `${CDN_BASE_URL}/placeholders/default.jpg`,
      streamUrl: item.stream_url,
      trailerUrl: item.trailer_url,
      year: item.year,
      rating: item.rating,
      duration: item.duration,
      categories: item.categories || [],
      actors: item.actors,
      director: item.director,
      match: item.match
    };
  } catch (error) {
    console.error(`[API ERROR] Error fetching content details for ID ${id}:`, error);
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
    // Construction de l'URL pour l'API Supabase
    const url = `${API_BASE_URL}/content?id=eq.${id}&select=stream_url`;
    console.log(`[API DEBUG] Fetching stream URL:`, url);
    
    // Ajout des en-têtes nécessaires pour Supabase
    const response = await fetch(url, {
      headers: {
        'apikey': apiConfig.supabaseKey,
        'Authorization': `Bearer ${apiConfig.supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return data[0].stream_url || null;
  } catch (error) {
    console.error(`[API ERROR] Error fetching stream URL for ID ${id}:`, error);
    return null;
  }
};

export default {
  getContentByCategory,
  getFeaturedContent,
  getContentDetails,
  getStreamUrl
};
