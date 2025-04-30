// Service de récupération des contenus depuis les différentes sources disponibles
// Version modernisée - Avril 2025
import axios, { AxiosRequestConfig } from 'axios';

// Importation des données locales générées par le workflow
import dramaData from '../data/content/drama/index.json';
import animeData from '../data/content/anime/index.json';
import filmData from '../data/content/film/index.json';
import bollywoodData from '../data/content/bollywood/index.json';
import carouselsData from '../data/carousels.json';
import heroBannersData from '../data/hero_banners.json';
import metadata from '../data/metadata.json';

// Types de contenu supportés
export type ContentType = 'drama' | 'anime' | 'bollywood' | 'film' | 'trending';

// Interface pour les éléments de contenu
export interface ContentItem {
  id: string;
  title: string;
  original_title?: string;
  poster: string;
  imageUrl?: string; // Support pour la compatibilité avec d'autres formats
  posterUrl?: string; // Support pour la compatibilité avec d'autres formats
  year: number | string;
  rating: number;
  language: string;
  source?: string;
  type?: ContentType;
  backdrop?: string;
  overview?: string;
}

// Interface pour les détails complets d'un contenu
export interface ContentDetail extends ContentItem {
  url: string;
  description: string;
  synopsis: string;
  genres: string[];
  tags: string[];
  actors: string[];
  director?: string;
  episode_count?: number;
  episodes?: number;
  seasons?: number;
  duration?: number;
  status?: string;
  release_date?: string;
  streaming_urls: {
    quality: string;
    url: string;
    size: string;
  }[];
  trailers: {
    title: string;
    url: string;
    thumbnail: string;
  }[];
  images: {
    url: string;
    type: string;
    width: number;
    height: number;
  }[];
  subtitles: {
    language: string;
    url: string;
  }[];
  language: string;
  related_content?: string[];
  user_ratings?: {
    average: number;
    count: number;
  };
  popularity_score?: number;
  is_premium?: boolean;
  gallery?: string[];
}

// Interface pour les réponses de recherche
export interface SearchResponse {
  results: ContentItem[];
  message?: string;
  requestId?: string;
  status?: 'pending' | 'processing' | 'completed';
  resultsCount?: number;
}

// Interface pour les requêtes de contenu
export interface ContentRequest {
  id: string;
  userId?: string;
  query?: string;
  status?: 'pending' | 'processing' | 'completed';
  createdAt?: string;
  updatedAt?: string;
  resultsCount?: number;
}

// Interface pour les carrousels
export interface Carousel {
  title: string;
  type: string;
  items: ContentItem[];
}

// Interface pour les bannières
export interface HeroBanner {
  banners: ContentItem[];
}

// Configuration des sources d'API
const API_CONFIG = {
  // Détection automatique de l'environnement
  API_URL: typeof window !== 'undefined' && window.location.hostname.endsWith('surge.sh')
    ? 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production'
    : 'http://localhost:8080',
  
  // Domaines pour les images
  CLOUDFRONT_DOMAIN: 'https://d11nnqvjfooahr.cloudfront.net',
  S3_DOMAIN: 'https://flodrama-assets.s3.amazonaws.com',
  
  // Timeouts et retries
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Cache
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  
  // Flags de fonctionnalités
  USE_LOCAL_CACHE: true,
  USE_BACKEND_API: true,
  ENABLE_LOGGING: true
};

// Classe pour gérer le cache local
class LocalCache {
  private static instance: LocalCache;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private constructor() {}

  public static getInstance(): LocalCache {
    if (!LocalCache.instance) {
      LocalCache.instance = new LocalCache();
    }
    return LocalCache.instance;
  }

  public set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Sauvegarder dans localStorage si disponible
    if (typeof window !== 'undefined' && API_CONFIG.USE_LOCAL_CACHE) {
      try {
        localStorage.setItem(`flodrama_cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Impossible de sauvegarder dans localStorage:', error);
      }
    }
  }

  public get(key: string): any | null {
    // Vérifier d'abord dans la mémoire
    const memoryCache = this.cache.get(key);
    if (memoryCache && Date.now() - memoryCache.timestamp < API_CONFIG.CACHE_DURATION) {
      return memoryCache.data;
    }
    
    // Sinon vérifier dans localStorage
    if (typeof window !== 'undefined' && API_CONFIG.USE_LOCAL_CACHE) {
      try {
        const storedCache = localStorage.getItem(`flodrama_cache_${key}`);
        if (storedCache) {
          const parsedCache = JSON.parse(storedCache);
          if (Date.now() - parsedCache.timestamp < API_CONFIG.CACHE_DURATION) {
            // Mettre à jour le cache en mémoire
            this.cache.set(key, parsedCache);
            return parsedCache.data;
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération du cache:', error);
      }
    }
    
    return null;
  }

  public clear(): void {
    this.cache.clear();
    
    // Nettoyer localStorage si disponible
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('flodrama_cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Erreur lors du nettoyage du cache:', error);
      }
    }
  }
}

// Initialisation du cache
const cache = LocalCache.getInstance();

/**
 * Fonction pour corriger les URLs des images
 * @param items Tableau d'éléments contenant des URLs d'images
 * @returns Tableau avec les URLs corrigées
 */
function fixImageUrls<T extends { image?: string; poster?: string; imageUrl?: string; posterUrl?: string }>(items: T[]): any[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => {
    if (!item) return item;
    
    // Copier l'item pour éviter de modifier l'original
    const fixedItem = { ...item } as any;
    
    // Normaliser les champs d'image
    if (fixedItem.image && !fixedItem.poster) {
      fixedItem.poster = fixedItem.image;
    }
    
    if (fixedItem.imageUrl && !fixedItem.poster) {
      fixedItem.poster = fixedItem.imageUrl;
    }
    
    if (fixedItem.posterUrl && !fixedItem.poster) {
      fixedItem.poster = fixedItem.posterUrl;
    }
    
    // Corriger l'URL du poster si elle existe
    if (fixedItem.poster) {
      // Si l'URL est déjà une URL complète avec http/https, ne rien faire
      if (fixedItem.poster.startsWith('http')) {
        // Ne rien faire, l'URL est déjà complète
      } 
      // Si l'URL est relative, la compléter avec le domaine CloudFront
      else if (fixedItem.poster.startsWith('/')) {
        fixedItem.poster = `${API_CONFIG.CLOUDFRONT_DOMAIN}${fixedItem.poster}`;
      }
      // Si l'URL est un chemin sans slash, ajouter le slash
      else {
        fixedItem.poster = `${API_CONFIG.CLOUDFRONT_DOMAIN}/${fixedItem.poster}`;
      }
    } else {
      // Utiliser une image par défaut si aucune image n'est disponible
      fixedItem.poster = `${API_CONFIG.CLOUDFRONT_DOMAIN}/placeholders/default-poster.jpg`;
    }
    
    return fixedItem;
  });
}

// Données locales structurées avec URLs d'images corrigées
const localData: Record<ContentType, ContentItem[]> = {
  drama: fixImageUrls(dramaData.items),
  anime: fixImageUrls(animeData.items),
  film: fixImageUrls(filmData.items),
  bollywood: fixImageUrls(bollywoodData.items),
  trending: [] // Sera rempli dynamiquement
};

// Remplir les données trending avec un mix des autres catégories
localData.trending = [
  ...localData.drama.slice(0, 5),
  ...localData.anime.slice(0, 5),
  ...localData.film.slice(0, 5),
  ...localData.bollywood.slice(0, 5)
].sort(() => Math.random() - 0.5);

// Logging des données disponibles si activé
if (API_CONFIG.ENABLE_LOGGING) {
  console.log('Drama:', localData.drama ? `${localData.drama.length} éléments` : 'Aucun élément');
  console.log('Anime:', localData.anime ? `${localData.anime.length} éléments` : 'Aucun élément');
  console.log('Film:', localData.film ? `${localData.film.length} éléments` : 'Aucun élément');
  console.log('Bollywood:', localData.bollywood ? `${localData.bollywood.length} éléments` : 'Aucun élément');
  console.log('Trending:', localData.trending ? `${localData.trending.length} éléments` : 'Aucun élément');
}

/**
 * Fonction pour effectuer des requêtes API avec retry
 * @param url URL de la requête
 * @param options Options de la requête
 * @param retries Nombre de tentatives
 * @returns Données de la réponse
 */
async function apiRequest<T>(url: string, options: AxiosRequestConfig = {}, retries = API_CONFIG.MAX_RETRIES): Promise<T> {
  let lastError: any;
  
  // Configuration par défaut
  const defaultOptions: AxiosRequestConfig = {
    timeout: API_CONFIG.REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    validateStatus: (status) => status >= 200 && status < 300
  };
  
  // Fusionner les options
  const requestOptions = { ...defaultOptions, ...options };
  
  // Tentatives avec backoff exponentiel
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios(url, requestOptions);
      return response.data;
    } catch (error) {
      lastError = error;
      
      // Log de l'erreur si activé
      if (API_CONFIG.ENABLE_LOGGING) {
        console.error(`Tentative ${attempt + 1}/${retries} échouée pour ${url}:`, error);
      }
      
      // Attendre avant la prochaine tentative (backoff exponentiel)
      if (attempt < retries - 1) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Si toutes les tentatives échouent, lancer l'erreur
  throw lastError;
}

/**
 * Vérifie si le backend est disponible
 * @returns true si le backend est disponible, false sinon
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    // Vérifier si le backend est disponible avec un endpoint simple
    await apiRequest(`${API_CONFIG.API_URL}/health`, {
      timeout: 5000 // Timeout court pour cette vérification
    }, 1); // Une seule tentative
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Récupère les contenus d'une catégorie spécifique
 * @param category Catégorie de contenu
 * @param limit Limite de résultats
 * @param offset Offset pour la pagination
 * @returns Liste des contenus de la catégorie
 */
export async function getContentsByCategory(category: ContentType, limit = 20, offset = 0): Promise<ContentItem[]> {
  // Vérifier si les données sont dans le cache
  const cacheKey = `category_${category}_${limit}_${offset}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<ContentItem[]>(
          `${API_CONFIG.API_URL}/content/${category}?limit=${limit}&offset=${offset}`
        );
        
        // Corriger les URLs des images
        const fixedResponse = fixImageUrls(response);
        
        // Mettre en cache
        cache.set(cacheKey, fixedResponse);
        
        return fixedResponse;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des contenus ${category}:`, error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Fallback sur les données locales
  const items = localData[category] || [];
  const paginatedItems = items.slice(offset, offset + limit);
  
  // Mettre en cache
  cache.set(cacheKey, paginatedItems);
  
  return paginatedItems;
}

/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @returns Détails du contenu
 */
export async function getContentDetails(contentId: string): Promise<ContentDetail | null> {
  // Vérifier si les données sont dans le cache
  const cacheKey = `content_details_${contentId}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<ContentDetail>(
          `${API_CONFIG.API_URL}/content/details/${contentId}`
        );
        
        // Mettre en cache
        cache.set(cacheKey, response);
        
        return response;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du contenu ${contentId}:`, error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Chercher dans les données locales
  for (const category of Object.keys(localData) as ContentType[]) {
    const item = localData[category].find(item => item.id === contentId);
    
    if (item) {
      // Créer un objet ContentDetail à partir de l'item trouvé
      const details: ContentDetail = {
        ...item,
        url: `/${category}/${contentId}`,
        description: item.overview || 'Aucune description disponible',
        synopsis: item.overview || 'Aucun synopsis disponible',
        genres: [],
        tags: [],
        actors: [],
        streaming_urls: [],
        trailers: [],
        images: [],
        subtitles: []
      };
      
      // Mettre en cache
      cache.set(cacheKey, details);
      
      return details;
    }
  }
  
  // Si aucun contenu n'est trouvé, renvoyer null
  return null;
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels
 */
export async function getCarousels(): Promise<Carousel[]> {
  // Vérifier si les données sont dans le cache
  const cacheKey = 'carousels';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<Carousel[]>(`${API_CONFIG.API_URL}/carousels`);
        
        // Corriger les URLs des images pour chaque carrousel
        const fixedResponse = response.map(carousel => ({
          ...carousel,
          items: fixImageUrls(carousel.items)
        }));
        
        // Mettre en cache
        cache.set(cacheKey, fixedResponse);
        
        return fixedResponse;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des carrousels:', error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Fallback sur les données locales
  if (carouselsData && Array.isArray(carouselsData.carousels)) {
    const fixedCarousels = carouselsData.carousels.map((carousel: any) => ({
      ...carousel,
      items: fixImageUrls(carousel.items)
    }));
    
    // Mettre en cache
    cache.set(cacheKey, fixedCarousels);
    
    return fixedCarousels;
  }
  
  // Si aucune donnée locale n'est disponible, créer des carrousels à partir des données locales
  const categories: ContentType[] = ['drama', 'anime', 'film', 'bollywood', 'trending'];
  const defaultCarousels: Carousel[] = categories.map(category => ({
    title: `${category.charAt(0).toUpperCase()}${category.slice(1)}`,
    type: category,
    items: localData[category].slice(0, 10)
  }));
  
  // Mettre en cache
  cache.set(cacheKey, defaultCarousels);
  
  return defaultCarousels;
}

/**
 * Récupère les bannières pour le hero banner
 * @returns Bannières pour le hero banner
 */
export async function getHeroBanners(): Promise<HeroBanner> {
  // Vérifier si les données sont dans le cache
  const cacheKey = 'hero_banners';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<HeroBanner>(`${API_CONFIG.API_URL}/hero-banners`);
        
        // Corriger les URLs des images
        const fixedResponse = {
          ...response,
          banners: fixImageUrls(response.banners)
        };
        
        // Mettre en cache
        cache.set(cacheKey, fixedResponse);
        
        return fixedResponse;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des bannières:', error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Fallback sur les données locales
  if (heroBannersData && Array.isArray(heroBannersData.banners)) {
    const banners = fixImageUrls(heroBannersData.banners);
    const result = { banners } as HeroBanner;
    
    // Mettre en cache
    cache.set(cacheKey, result);
    
    return result;
  }
  
  // Si aucune donnée locale n'est disponible, créer des bannières à partir des données trending
  const defaultBanners: HeroBanner = {
    banners: localData.trending.slice(0, 5)
  };
  
  // Mettre en cache
  cache.set(cacheKey, defaultBanners);
  
  return defaultBanners;
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param userId Identifiant de l'utilisateur (pour les demandes de contenu)
 * @param token Token d'authentification (optionnel)
 * @returns Résultat de recherche
 */
export async function searchContent(query: string, userId?: string, token?: string): Promise<SearchResponse> {
  if (!query.trim()) return { results: [] };
  
  // Vérifier si les données sont dans le cache
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<SearchResponse>(
          `${API_CONFIG.API_URL}/search?query=${encodeURIComponent(query)}`
        );
        
        // Corriger les URLs des images
        const fixedResponse = {
          ...response,
          results: fixImageUrls(response.results)
        };
        
        // Mettre en cache
        cache.set(cacheKey, fixedResponse);
        
        return fixedResponse;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la recherche de contenus:', error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Recherche locale dans toutes les catégories
  const queryLower = query.toLowerCase().trim();
  const results: ContentItem[] = [];
  
  for (const category of Object.keys(localData) as ContentType[]) {
    const matchingItems = localData[category].filter(item => 
      item.title.toLowerCase().includes(queryLower) || 
      (item.original_title && item.original_title.toLowerCase().includes(queryLower))
    );
    
    results.push(...matchingItems);
  }
  
  const response: SearchResponse = {
    results,
    resultsCount: results.length,
    status: 'completed'
  };
  
  // Mettre en cache
  cache.set(cacheKey, response);
  
  return response;
}

/**
 * Récupère les contenus recommandés pour un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Liste des contenus recommandés
 */
export async function getRecommendedContent(userId: string, token: string): Promise<ContentItem[]> {
  try {
    // Si le backend est activé, essayer de récupérer les données depuis l'API
    if (API_CONFIG.USE_BACKEND_API) {
      const backendAvailable = await isBackendAvailable();
      
      if (backendAvailable) {
        const response = await apiRequest<ContentItem[]>(
          `${API_CONFIG.API_URL}/recommendations/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // Corriger les URLs des images
        return fixImageUrls(response);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    // Continuer avec les données locales en cas d'erreur
  }
  
  // Fallback sur les contenus populaires
  const popularItems: ContentItem[] = [];
  const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film'];
  
  // Récupérer quelques éléments populaires de chaque type
  for (const type of types) {
    popularItems.push(...localData[type].slice(0, 2));
  }
  
  // Mélanger les résultats pour plus de diversité
  return popularItems.sort(() => Math.random() - 0.5);
}

/**
 * Alias pour la compatibilité avec les composants existants
 */
export const getCategoryContent = getContentsByCategory;
export const getContentDetail = getContentDetails;

// Exporter la configuration pour permettre sa modification
export const config = API_CONFIG;

// Exporter le cache pour permettre sa manipulation
export const contentCache = cache;
