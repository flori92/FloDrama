// Constantes pour l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flodrama-p1r0r7c2s-flodrama-projects.vercel.app/api';
const CDN_BASE_URL = 'https://fffgoqubrbgppcqqkyod.supabase.co/storage/v1/object/public/flodrama-content';

// Année courante et année précédente pour le filtre des contenus récents
const CURRENT_YEAR = new Date().getFullYear(); // 2025
const PREVIOUS_YEAR = CURRENT_YEAR - 1; // 2024

// Mappage des catégories frontend vers les catégories backend
const CATEGORY_MAPPING: Record<string, string> = {
  'trending': 'trending',
  'dramas': 'dramas',
  'movies': 'films',
  'anime': 'animes',
  'bollywood': 'bollywood',
  'popular': 'popular',
  'recently': 'recently',
  'topRated': 'topRated',
  'featured': 'featured'
};

// Types pour l'API
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  poster_path: string;
  backdrop_path: string;
  rating: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  items: ContentItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FeaturedResponse {
  items: ContentItem[];
  total?: number;
}

export interface ContentDetails extends ContentItem {
  genres: string[];
  duration: number;
  episodes_count?: number;
  status: string;
  trailer_url?: string;
}

export interface StreamInfo {
  url: string;
  quality: string;
  language: string;
}

// Log de debug pour diagnostic API
console.log('[API DEBUG] API_BASE_URL =', API_BASE_URL);
console.log('[API DEBUG] Utilisation de l\'API backend pour les données');

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
    
    // Construction de l'URL pour l'API backend
    const url = `${API_BASE_URL}/${mappedCategory}?limit=${limit}&offset=${(page - 1) * limit}&year=recent`;
    
    console.log(`[API DEBUG] Fetching category: ${category} (mapped: ${mappedCategory}) URL:`, url);
    
    // Utilisation de fetch pour récupérer les données
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`Aucune donnée trouvée pour la catégorie ${category} (mappée à ${mappedCategory}). Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-${category}-${i}`,
          title: `Contenu ${category} ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          category: category,
          poster_path: `${CDN_BASE_URL}/placeholders/${category}-${i % 5 + 1}.jpg`,
          backdrop_path: `${CDN_BASE_URL}/placeholders/${category}-${i % 5 + 1}.jpg`,
          rating: 4.5,
          year: CURRENT_YEAR,
          created_at: `${CURRENT_YEAR}-01-01T00:00:00.000Z`,
          updated_at: `${CURRENT_YEAR}-01-01T00:00:00.000Z`
        })),
        total: limit,
        page,
        totalPages: 1
      };
    }
    
    // Récupération des données
    const data = await response.json();
    
    // Transformation des données pour correspondre au format attendu par le frontend
    const items = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: mappedCategory,
      poster_path: item.poster || `${CDN_BASE_URL}/placeholders/${category}-1.jpg`,
      backdrop_path: item.backdrop || `${CDN_BASE_URL}/placeholders/${category}-1.jpg`,
      rating: item.rating,
      year: item.year,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    return {
      items,
      total: items.length,
      page,
      totalPages: Math.ceil(items.length / limit)
    };
  } catch (error) {
    console.error(`[API ERROR] Error fetching content for category ${category}:`, error);
    return { items: [], total: 0, page: 1, totalPages: 1 };
  }
};

/**
 * Récupère les contenus mis en avant pour le hero banner
 * @param limit Nombre d'éléments à récupérer (optionnel)
 * @returns Promesse contenant les données mises en avant
 */
export const getFeaturedContent = async (limit: number = 10): Promise<FeaturedResponse> => {
  try {
    // Construction de l'URL pour l'API backend
    const url = `${API_BASE_URL}/featured?limit=${limit}`;
    
    console.log(`[API DEBUG] Fetching featured content URL:`, url);
    
    // Utilisation de fetch pour récupérer les données
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Fallback de sécurité pour éviter les erreurs 404
      console.warn(`Aucun contenu mis en avant trouvé. Utilisation des données mockées.`);
      
      // Données mockées pour éviter les erreurs dans l'UI
      return { 
        items: Array(limit).fill(0).map((_, i) => ({
          id: `mock-featured-${i}`,
          title: `Contenu à découvrir ${i+1}`,
          description: "Description temporaire pendant la maintenance de l'API",
          category: "featured",
          poster_path: `${CDN_BASE_URL}/placeholders/featured-${i % 5 + 1}.jpg`,
          backdrop_path: `${CDN_BASE_URL}/placeholders/featured-${i % 5 + 1}.jpg`,
          rating: 4.8,
          year: CURRENT_YEAR,
          created_at: `${CURRENT_YEAR}-01-01T00:00:00.000Z`,
          updated_at: `${CURRENT_YEAR}-01-01T00:00:00.000Z`
        }))
      };
    }
    
    // Récupération des données
    const data = await response.json();
    
    // Transformation des données pour correspondre au format attendu par le frontend
    const items = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: 'featured',
      poster_path: item.poster || `${CDN_BASE_URL}/placeholders/featured-1.jpg`,
      backdrop_path: item.backdrop || `${CDN_BASE_URL}/placeholders/featured-1.jpg`,
      rating: item.rating,
      year: item.year,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
    
    return {
      items,
      total: items.length
    };
  } catch (error) {
    console.error('[API ERROR] Error fetching featured content:', error);
    return { items: [] };
  }
};

/**
 * Récupère les détails d'un contenu spécifique
 * @param id ID du contenu à récupérer
 * @returns Promesse contenant les détails du contenu
 */
export const getContentDetails = async (id: string): Promise<ContentDetails | null> => {
  try {
    // Construction de l'URL pour l'API backend
    const url = `${API_BASE_URL}/content/${id}`;
    
    console.log(`[API DEBUG] Fetching content details for ID ${id} URL:`, url);
    
    // Utilisation de fetch pour récupérer les données
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Aucun contenu trouvé avec l'ID ${id}. Utilisation des données mockées.`);
      return null;
    }
    
    // Récupération des données
    const item = await response.json();
    
    // Transformation des données pour correspondre au format attendu par le frontend
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: id.split('_')[0],
      poster_path: item.poster || `${CDN_BASE_URL}/placeholders/default.jpg`,
      backdrop_path: item.backdrop || `${CDN_BASE_URL}/placeholders/default.jpg`,
      rating: item.rating,
      year: item.year,
      created_at: item.created_at,
      updated_at: item.updated_at,
      genres: item.genres || [],
      duration: item.duration,
      episodes_count: item.episodes_count,
      status: item.status,
      trailer_url: item.trailer_url
    };
  } catch (error) {
    console.error(`[API ERROR] Error fetching content details for ID ${id}:`, error);
    return null;
  }
};

/**
 * Récupère les URLs de streaming pour un contenu spécifique
 * @param contentId ID du contenu
 * @returns Promesse contenant les informations de streaming
 */
export const getStreamUrls = async (contentId: string): Promise<StreamInfo[]> => {
  try {
    // Construction de l'URL pour l'API backend
    const url = `${API_BASE_URL}/streams/${contentId}`;
    
    console.log(`[API DEBUG] Fetching stream URLs for content ${contentId} URL:`, url);
    
    // Utilisation de fetch pour récupérer les données
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Aucune URL de streaming trouvée pour le contenu ${contentId}. Utilisation des données mockées.`);
      
      // URL de streaming mockée
      return [
        {
          url: 'https://example.com/stream/mock-stream.mp4',
          quality: '720p',
          language: 'Français'
        }
      ];
    }
    
    // Récupération des données
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`Aucune URL de streaming trouvée pour le contenu ${contentId}. Utilisation des données mockées.`);
      
      // URL de streaming mockée
      return [
        {
          url: 'https://example.com/stream/mock-stream.mp4',
          quality: '720p',
          language: 'Français'
        }
      ];
    }
    
    // Transformation des données pour correspondre au format attendu par le frontend
    return data.map((stream: any) => ({
      url: stream.url,
      quality: stream.quality,
      language: stream.language
    }));
  } catch (error) {
    console.error(`[API ERROR] Error fetching stream URLs for content ${contentId}:`, error);
    return [];
  }
};

/**
 * Récupère l'URL de streaming d'un contenu
 * @param id ID du contenu
 * @returns Promesse contenant l'URL de streaming
 */
export const getStreamUrl = async (id: string): Promise<string | null> => {
  try {
    const streams = await getStreamUrls(id);
    if (streams.length > 0) {
      return streams[0].url;
    }
    return null;
  } catch (error) {
    console.error(`[API ERROR] Error fetching stream URL for content ${id}:`, error);
    return null;
  }
};

export default {
  getContentByCategory,
  getFeaturedContent,
  getContentDetails,
  getStreamUrl,
  getStreamUrls
};
