/**
 * Service de distribution de contenu pour FloDrama
 * 
 * Ce service gère la récupération et l'optimisation des contenus depuis Cloudflare D1
 * pour les afficher dans l'interface utilisateur de FloDrama.
 */

import { ContentItem } from '../types/content';

// URL de l'API Cloudflare Workers
const API_BASE_URL = 'https://flodrama-api-prod.florifavi.workers.dev';
const API_TIMEOUT = 8000; // 8 secondes

// Interface pour le cache
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// Configuration du cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes en millisecondes
const cache: Record<string, CacheItem<any>> = {};

// Suivi des erreurs API
interface ApiError {
  endpoint: string;
  timestamp: number;
  error: string;
  params?: Record<string, any>;
}

const apiErrors: ApiError[] = [];
const MAX_ERROR_LOG = 50;

// Constantes pour les catégories
export const CONTENT_TYPES = {
  DRAMA: 'drama',
  ANIME: 'anime',
  MOVIE: 'movie',
  BOLLYWOOD: 'bollywood'
};

// Interface pour les paramètres de requête
export interface ContentQueryParams {
  page?: number;
  limit?: number;
  year?: number | string;
  genre?: string;
  language?: string;
  sort?: string;
  rating_min?: number;
  with_backdrop?: boolean;
  with_poster?: boolean;
}

// Interface pour les options de hero banner
export interface HeroBannerOptions {
  minRating?: number;
  withBackdrop?: boolean;
  withTrailer?: boolean;
  contentTypes?: string[];
  limit?: number;
}

// Interface pour les options de carrousel
export interface CarouselOptions {
  title: string;
  contentType?: string;
  genre?: string;
  year?: number | string;
  sortBy?: 'rating' | 'release_date' | 'popularity' | 'recently_added';
  limit?: number;
}

/**
 * Fonction utilitaire pour les requêtes avec timeout
 * @param url URL de la requête
 * @param options Options de la requête
 * @param timeout Délai avant timeout en millisecondes
 * @returns Réponse de la requête
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Récupère les données du cache
 * @param key Clé du cache
 * @returns Données en cache ou null si non trouvées ou expirées
 */
function getCachedData<T>(key: string): T | null {
  const item = cache[key];
  if (!item) {
    return null;
  }
  
  const now = Date.now();
  if (now - item.timestamp > CACHE_DURATION) {
    delete cache[key];
    return null;
  }
  
  return item.data;
}

/**
 * Stocke des données dans le cache
 * @param key Clé du cache
 * @param data Données à stocker
 */
function setCachedData<T>(key: string, data: T): void {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
}

/**
 * Enregistre une erreur API
 * @param endpoint Point d'API concerné
 * @param error Erreur survenue
 * @param params Paramètres de la requête
 */
function logApiError(endpoint: string, error: any, params?: Record<string, any>) {
  console.error(`Erreur API [${endpoint}]:`, error);
  
  // Message d'erreur en français
  let errorMessage = error.message || String(error);
  if (errorMessage.includes('HTTP')) {
    errorMessage = errorMessage.replace('Erreur HTTP', 'Erreur HTTP');
  }
  
  apiErrors.unshift({
    endpoint,
    timestamp: Date.now(),
    error: errorMessage,
    params
  });
  
  // Limiter la taille du log
  if (apiErrors.length > MAX_ERROR_LOG) {
    apiErrors.pop();
  }
}

/**
 * Récupère les contenus pour le hero banner
 * @param options Options de configuration du hero banner
 * @returns Liste des contenus pour le hero banner
 */
export async function getHeroBannerContent(options: HeroBannerOptions = {}): Promise<ContentItem[]> {
  const {
    minRating = 7.5,
    withBackdrop = true,
    withTrailer = true,
    contentTypes = [CONTENT_TYPES.DRAMA, CONTENT_TYPES.MOVIE],
    limit = 5
  } = options;

  // Vérifier si les données sont en cache
  const cacheKey = `heroBanner_${JSON.stringify(options)}`;
  const cachedData = getCachedData<ContentItem[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('rating_min', minRating.toString());
    
    if (withBackdrop) {
      params.append('with_backdrop', 'true');
    }
    
    if (withTrailer) {
      params.append('with_trailer', 'true');
    }
    
    if (contentTypes.length > 0) {
      params.append('content_types', contentTypes.join(','));
    }
    
    params.append('sort', 'rating:desc');
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/hero?${params}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    const optimizedData = optimizeContentItems(data);
    
    // Mettre en cache les données
    setCachedData(cacheKey, optimizedData);
    
    return optimizedData;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/hero-banner', error, options);
    
    return getFallbackHeroBannerContent();
  }
}

/**
 * Récupère les contenus pour un carrousel
 * @param options Options de configuration du carrousel
 * @returns Objet contenant le titre et les éléments du carrousel
 */
export async function getCarouselContent(options: CarouselOptions): Promise<{ title: string, items: ContentItem[] }> {
  const {
    title,
    contentType,
    genre,
    year,
    sortBy = 'rating',
    limit = 10
  } = options;

  // Vérifier si les données sont en cache
  const cacheKey = `carousel_${JSON.stringify(options)}`;
  const cachedData = getCachedData<{ title: string, items: ContentItem[] }>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    if (genre) {
      params.append('genre', genre);
    }
    
    if (year) {
      params.append('year', year.toString());
    }
    
    // Mapper le tri
    let sort = 'rating:desc';
    switch (sortBy) {
      case 'release_date':
        sort = 'year:desc';
        break;
      case 'popularity':
        sort = 'popularity:desc';
        break;
      case 'recently_added':
        sort = 'created_at:desc';
        break;
    }
    params.append('sort', sort);
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/carousel?${params}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    const optimizedData = optimizeContentItems(data);
    
    // Créer l'objet de réponse
    const result = {
      title,
      items: optimizedData
    };
    
    // Mettre en cache les données
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/carousel', error, options);
    
    // Retourner les données de secours
    return {
      title,
      items: getFallbackCarouselContent(options)
    };
  }
}

/**
 * Récupère les contenus pour la page d'accueil
 * @returns Objet contenant le hero banner et les carrousels
 */
export async function getHomePageContent(): Promise<{
  heroBanner: ContentItem[],
  carousels: {title: string, items: ContentItem[]}[]
}> {
  // Vérifier si les données sont en cache
  const cacheKey = 'homePageContent';
  const cachedData = getCachedData<{
    heroBanner: ContentItem[],
    carousels: {title: string, items: ContentItem[]}[]
  }>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    // Récupérer le hero banner
    const heroBanner = await getHeroBannerContent();
    
    // Définir les carrousels à afficher
    const carouselConfigs: CarouselOptions[] = [
      {
        title: 'Tendances',
        sortBy: 'popularity',
        limit: 20
      },
      {
        title: 'Dramas coréens',
        contentType: CONTENT_TYPES.DRAMA,
        sortBy: 'rating',
        limit: 20
      },
      {
        title: 'Films récents',
        contentType: CONTENT_TYPES.MOVIE,
        sortBy: 'release_date',
        limit: 20
      },
      {
        title: 'Animés populaires',
        contentType: CONTENT_TYPES.ANIME,
        sortBy: 'popularity',
        limit: 20
      },
      {
        title: 'Bollywood',
        contentType: CONTENT_TYPES.BOLLYWOOD,
        sortBy: 'rating',
        limit: 20
      },
      {
        title: 'Ajoutés récemment',
        sortBy: 'recently_added',
        limit: 20
      }
    ];
    
    // Récupérer tous les carrousels en parallèle
    const carouselsPromises = carouselConfigs.map(config => getCarouselContent(config));
    const carousels = await Promise.all(carouselsPromises);
    
    const result = {
      heroBanner,
      carousels
    };
    
    // Mettre en cache les données
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/home-page-content', error);
    
    // Retourner des données de secours
    return {
      heroBanner: getFallbackHeroBannerContent(),
      carousels: [
        {
          title: 'Tendances',
          items: getFallbackCarouselContent('mixed', 20)
        },
        {
          title: 'Dramas coréens',
          items: getFallbackCarouselContent(CONTENT_TYPES.DRAMA, 20)
        },
        {
          title: 'Films récents',
          items: getFallbackCarouselContent(CONTENT_TYPES.MOVIE, 20)
        },
        {
          title: 'Animés populaires',
          items: getFallbackCarouselContent(CONTENT_TYPES.ANIME, 20)
        },
        {
          title: 'Bollywood',
          items: getFallbackCarouselContent(CONTENT_TYPES.BOLLYWOOD, 20)
        },
        {
          title: 'Ajoutés récemment',
          items: getFallbackCarouselContent('mixed', 20)
        }
      ]
    };
  }
}

/**
 * Récupère les contenus pour une catégorie spécifique
 * @param contentType Type de contenu (drama, anime, movie, bollywood)
 * @param params Paramètres de requête
 * @returns Liste des contenus pour la catégorie
 */
export async function getCategoryContent(
  contentType: string,
  params: ContentQueryParams = {}
): Promise<ContentItem[]> {
  // Vérifier si les données sont en cache
  const cacheKey = `category_${contentType}_${JSON.stringify(params)}`;
  const cachedData = getCachedData<ContentItem[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params.genre) {
      queryParams.append('genre', params.genre);
    }
    
    if (params.language) {
      queryParams.append('language', params.language);
    }
    
    if (params.year) {
      queryParams.append('year', params.year.toString());
    }
    
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    
    queryParams.append('content_type', contentType);
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/content?${queryParams}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    const optimizedData = optimizeContentItems(data);
    
    // Mettre en cache les données
    setCachedData(cacheKey, optimizedData);
    
    return optimizedData;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/content', error, { contentType, ...params });
    
    // Retourner les données de secours
    return getFallbackCarouselContent(contentType, params.limit || 20);
  }
}

/**
 * Optimise les URLs des images pour un élément de contenu
 * @param item Élément de contenu à optimiser
 * @returns Élément de contenu optimisé
 */
export function optimizeContentItem(item: ContentItem): ContentItem {
  // Copier l'élément pour éviter de modifier l'original
  const optimizedItem = { ...item };
  
  // Si l'URL de l'image est relative, ajouter le domaine R2 de Cloudflare
  if (optimizedItem.posterUrl && !optimizedItem.posterUrl.startsWith('http')) {
    optimizedItem.posterUrl = `https://flodrama-storage.florifavi.workers.dev${optimizedItem.posterUrl}`;
  }
  
  // Si l'URL du backdrop est relative, ajouter le domaine R2 de Cloudflare
  if (optimizedItem.backdrop && !optimizedItem.backdrop.startsWith('http')) {
    optimizedItem.backdrop = `https://flodrama-storage.florifavi.workers.dev${optimizedItem.backdrop}`;
  }
  
  // Vérifier et corriger les URLs des vidéos
  if (optimizedItem.trailerUrl && !optimizedItem.trailerUrl.startsWith('http')) {
    optimizedItem.trailerUrl = `https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch${optimizedItem.trailerUrl}`;
  }
  
  return optimizedItem;
}

/**
 * Optimise les URLs des images pour une liste d'éléments de contenu
 * @param items Liste d'éléments de contenu à optimiser
 * @returns Liste d'éléments de contenu optimisés
 */
function optimizeContentItems(items: ContentItem[]): ContentItem[] {
  return items.map(optimizeContentItem);
}

/**
 * Génère des données de secours pour le hero banner
 * @returns Liste de contenus pour le hero banner
 */
function getFallbackHeroBannerContent(): ContentItem[] {
  // Utiliser les données réelles de la base de données
  // Ces données seront remplacées par les données réelles de la base de données
  return [
    {
      id: 'drama_001',
      title: 'Crash Landing on You',
      description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
      posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/drama/crash_landing_on_you.jpg',
      backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/drama/crash_landing_on_you_backdrop.jpg',
      releaseDate: '2019-12-14',
      rating: 9.2,
      duration: 60,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/crash_landing_on_you_trailer.mp4',
      videoId: 'drama_001_video',
      category: 'drama',
      genres: ['Romance', 'Comédie', 'Action'],
      episodeCount: 16,
      language: 'Korean',
      country: 'South Korea',
      status: 'completed'
    },
    {
      id: 'anime_001',
      title: 'Demon Slayer',
      description: 'Tanjiro Kamado et ses amis du Demon Slayer Corps accompagnent Kyojuro Rengoku pour enquêter sur une mystérieuse série de disparitions.',
      posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/anime/demon_slayer.jpg',
      backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/anime/demon_slayer_backdrop.jpg',
      releaseDate: '2020-10-16',
      rating: 8.9,
      duration: 117,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/demon_slayer_trailer.mp4',
      videoId: 'anime_001_video',
      category: 'anime',
      genres: ['Action', 'Fantasy', 'Adventure'],
      language: 'Japanese',
      country: 'Japan',
      status: 'ongoing'
    },
    {
      id: 'movie_001',
      title: 'Parasite',
      description: 'Toute la famille de Ki-taek est au chômage. Elle s\'intéresse particulièrement au train de vie de la richissime famille Park.',
      posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/movie/parasite.jpg',
      backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/movie/parasite_backdrop.jpg',
      releaseDate: '2019-05-30',
      rating: 8.6,
      duration: 132,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/parasite_trailer.mp4',
      videoId: 'movie_001_video',
      category: 'movie',
      genres: ['Thriller', 'Drama', 'Comedy'],
      language: 'Korean',
      country: 'South Korea',
      status: 'completed'
    }
  ];
}

/**
 * Génère des données de secours pour un carrousel
 * @param options Options du carrousel ou type de contenu
 * @param limit Nombre d'éléments à générer (utilisé uniquement si options est une chaîne)
 * @returns Liste de contenus pour le carrousel
 */
function getFallbackCarouselContent(options: CarouselOptions | string, limit: number = 20): ContentItem[] {
  let contentType = typeof options === 'string' ? options : options.contentType || 'mixed';
  let itemLimit = typeof options === 'string' ? limit : options.limit || 20;
  
  // Données de secours par type de contenu
  const fallbackData: Record<string, ContentItem[]> = {
    'drama': [
      {
        id: 'drama_001',
        title: 'Crash Landing on You',
        description: 'Une héritière sud-coréenne fait un atterrissage forcé en Corée du Nord après un accident de parapente.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/drama/cloy.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/drama/cloy_backdrop.jpg',
        releaseDate: '2019-12-14',
        rating: 9.2,
        duration: 70,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/cloy_trailer.mp4',
        videoId: 'drama_001_video',
        category: 'drama',
        genres: ['Romance', 'Comedy', 'Drama'],
        language: 'Korean',
        country: 'South Korea',
        status: 'completed'
      },
      {
        id: 'drama_002',
        title: 'Goblin',
        description: 'Un gobelin immortel cherche sa fiancée pour mettre fin à sa vie éternelle.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/drama/goblin.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/drama/goblin_backdrop.jpg',
        releaseDate: '2016-12-02',
        rating: 8.9,
        duration: 70,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/goblin_trailer.mp4',
        videoId: 'drama_002_video',
        category: 'drama',
        genres: ['Fantasy', 'Romance', 'Drama'],
        language: 'Korean',
        country: 'South Korea',
        status: 'completed'
      },
      {
        id: 'drama_003',
        title: 'Itaewon Class',
        description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier branché d\'Itaewon.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/drama/itaewon.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/drama/itaewon_backdrop.jpg',
        releaseDate: '2020-01-31',
        rating: 8.7,
        duration: 70,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/itaewon_trailer.mp4',
        videoId: 'drama_003_video',
        category: 'drama',
        genres: ['Drama', 'Business', 'Revenge'],
        language: 'Korean',
        country: 'South Korea',
        status: 'completed'
      }
    ],
    'anime': [
      {
        id: 'anime_001',
        title: 'Attack on Titan',
        description: 'Dans un monde ravagé par des titans mangeurs d\'hommes, les derniers humains se battent pour leur survie.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/anime/aot.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/anime/aot_backdrop.jpg',
        releaseDate: '2013-04-07',
        rating: 9.0,
        duration: 24,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/aot_trailer.mp4',
        videoId: 'anime_001_video',
        category: 'anime',
        genres: ['Action', 'Drama', 'Fantasy'],
        language: 'Japanese',
        country: 'Japan',
        status: 'completed'
      },
      {
        id: 'anime_002',
        title: 'Demon Slayer',
        description: 'Tanjiro devient un chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/anime/demonslayer.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/anime/demonslayer_backdrop.jpg',
        releaseDate: '2019-04-06',
        rating: 8.8,
        duration: 24,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/demonslayer_trailer.mp4',
        videoId: 'anime_002_video',
        category: 'anime',
        genres: ['Action', 'Fantasy', 'Historical'],
        language: 'Japanese',
        country: 'Japan',
        status: 'ongoing'
      }
    ],
    'movie': [
      {
        id: 'movie_001',
        title: 'Parasite',
        description: 'Toute la famille de Ki-taek est au chômage. Elle s\'intéresse particulièrement au train de vie de la richissime famille Park.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/movie/parasite.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/movie/parasite_backdrop.jpg',
        releaseDate: '2019-05-30',
        rating: 8.6,
        duration: 132,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/parasite_trailer.mp4',
        videoId: 'movie_001_video',
        category: 'movie',
        genres: ['Thriller', 'Drama', 'Comedy'],
        language: 'Korean',
        country: 'South Korea',
        status: 'completed'
      },
      {
        id: 'movie_002',
        title: 'Train to Busan',
        description: 'Un virus zombie se propage en Corée du Sud, tandis que des passagers luttent pour leur survie dans un train à destination de Busan.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/movie/traintobusan.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/movie/traintobusan_backdrop.jpg',
        releaseDate: '2016-07-20',
        rating: 7.9,
        duration: 118,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/traintobusan_trailer.mp4',
        videoId: 'movie_002_video',
        category: 'movie',
        genres: ['Action', 'Horror', 'Thriller'],
        language: 'Korean',
        country: 'South Korea',
        status: 'completed'
      }
    ],
    'bollywood': [
      {
        id: 'bollywood_001',
        title: '3 Idiots',
        description: 'Deux amis partent à la recherche de leur camarade d\'université disparu.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/bollywood/3idiots.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/bollywood/3idiots_backdrop.jpg',
        releaseDate: '2009-12-25',
        rating: 8.4,
        duration: 170,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/3idiots_trailer.mp4',
        videoId: 'bollywood_001_video',
        category: 'bollywood',
        genres: ['Comedy', 'Drama'],
        language: 'Hindi',
        country: 'India',
        status: 'completed'
      },
      {
        id: 'bollywood_002',
        title: 'Dangal',
        description: 'L\'histoire vraie de Mahavir Singh Phogat, qui a entraîné ses filles à devenir des championnes de lutte.',
        posterUrl: 'https://flodrama-storage.florifavi.workers.dev/posters/bollywood/dangal.jpg',
        backdrop: 'https://flodrama-storage.florifavi.workers.dev/backdrops/bollywood/dangal_backdrop.jpg',
        releaseDate: '2016-12-21',
        rating: 8.3,
        duration: 161,
        trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/watch/dangal_trailer.mp4',
        videoId: 'bollywood_002_video',
        category: 'bollywood',
        genres: ['Biography', 'Drama', 'Sport'],
        language: 'Hindi',
        country: 'India',
        status: 'completed'
      }
    ],
    'mixed': [] // Sera rempli avec un mélange de tous les types
  };
  
  // Pour le type 'mixed', créer un mélange de tous les types
  fallbackData['mixed'] = [
    ...fallbackData['drama'],
    ...fallbackData['anime'],
    ...fallbackData['movie'],
    ...fallbackData['bollywood']
  ];
  
  // Si le type de contenu n'existe pas dans nos données de secours, utiliser 'mixed'
  const availableData = fallbackData[contentType] || fallbackData['mixed'];
  
  // Limiter le nombre d'éléments retournés
  return availableData.slice(0, itemLimit);
}

/**
 * Récupère les genres disponibles pour un type de contenu
 * @param contentType Type de contenu (drama, anime, movie, bollywood)
 * @returns Liste des genres disponibles
 */
/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @returns Détails du contenu
 */
export async function getContentDetails(contentId: string): Promise<ContentItem | null> {
  // Vérifier si les données sont en cache
  const cacheKey = `content_details_${contentId}`;
  const cachedData = getCachedData<ContentItem | null>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/content/${contentId}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    const optimizedData = optimizeContentItem(data);
    
    // Mettre en cache les données
    setCachedData(cacheKey, optimizedData);
    
    return optimizedData;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError(`/content/${contentId}`, error);
    
    return null;
  }
}

export async function getAvailableGenres(contentType?: string): Promise<string[]> {
  // Vérifier si les données sont en cache
  const cacheKey = `genres_${contentType || 'all'}`;
  const cachedData = getCachedData<string[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/genres?${params}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache les données
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/genres', error, { contentType });
    
    // Retourner des genres par défaut
    return [
      'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy',
      'Historical', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
    ];
  }
}

/**
 * Récupère les langues disponibles pour un type de contenu
 * @param contentType Type de contenu (drama, anime, movie, bollywood)
 * @returns Liste des langues disponibles
 */
export async function getAvailableLanguages(contentType?: string): Promise<string[]> {
  // Vérifier si les données sont en cache
  const cacheKey = `languages_${contentType || 'all'}`;
  const cachedData = getCachedData<string[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/languages?${params}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache les données
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/languages', error, { contentType });
    
    // Retourner des langues par défaut
    return [
      'Korean', 'Japanese', 'Chinese', 'English', 'Hindi', 'Thai', 'French'
    ];
  }
}

/**
 * Récupère les années disponibles pour un type de contenu
 * @param contentType Type de contenu (drama, anime, movie, bollywood)
 * @returns Liste des années disponibles
 */
export async function getAvailableYears(contentType?: string): Promise<number[]> {
  // Vérifier si les données sont en cache
  const cacheKey = `years_${contentType || 'all'}`;
  const cachedData = getCachedData<number[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    // Faire la requête à l'API avec timeout
    const endpoint = `/api/years?${params}`;
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mettre en cache les données
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    // Enregistrer l'erreur
    logApiError('/years', error, { contentType });
    
    // Retourner des années par défaut (de 2010 à l'année actuelle)
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);
  }
}

/**
 * Récupère les informations de diagnostic du service
 * @returns Informations de diagnostic (erreurs API, état du cache)
 */
export function getDiagnosticInfo() {
  // Calculer les statistiques du cache
  const cacheStats = {
    totalItems: Object.keys(cache).length,
    itemsByType: {} as Record<string, number>,
    oldestItem: null as null | { key: string, age: number },
    newestItem: null as null | { key: string, age: number },
    averageAge: 0
  };
  
  let totalAge = 0;
  const now = Date.now();
  
  // Analyser chaque élément du cache
  Object.entries(cache).forEach(([key, item]) => {
    // Compter par type
    const type = key.split('_')[0];
    cacheStats.itemsByType[type] = (cacheStats.itemsByType[type] || 0) + 1;
    
    // Calculer l'âge
    const age = now - item.timestamp;
    totalAge += age;
    
    // Trouver le plus ancien et le plus récent
    if (!cacheStats.oldestItem || age > cacheStats.oldestItem.age) {
      cacheStats.oldestItem = { key, age };
    }
    
    if (!cacheStats.newestItem || age < cacheStats.newestItem.age) {
      cacheStats.newestItem = { key, age };
    }
  });
  
  // Calculer l'âge moyen
  if (cacheStats.totalItems > 0) {
    cacheStats.averageAge = totalAge / cacheStats.totalItems;
  }
  
  return {
    apiBaseUrl: API_BASE_URL,
    apiTimeout: API_TIMEOUT,
    cacheDuration: CACHE_DURATION,
    cacheStats,
    apiErrors,
    lastApiError: apiErrors.length > 0 ? apiErrors[0] : null,
    errorCount: apiErrors.length
  };
}
