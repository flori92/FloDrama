// Service de récupération des contenus depuis les données générées par GitHub Actions
import axios from 'axios'

// Définition de l'interface AxiosRequestConfig pour éviter les problèmes d'importation
interface AxiosRequestConfig {
  timeout?: number;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
  [key: string]: any;
}

// Importation des données statiques (générées par GitHub Actions)
import metadata from '../data/metadata.json'
import carousels from '../data/carousels.json'
import heroBanners from '../data/hero_banners.json'

// Types de contenu supportés
export type ContentType = 'drama' | 'anime' | 'bollywood' | 'film'

// Interface pour les éléments de contenu
export interface ContentItem {
  id: string
  title: string
  original_title?: string
  poster: string
  year: number
  rating: number
  language: string
  source?: string
  type?: ContentType
}

// Interface pour les détails complets d'un contenu
export interface ContentDetail extends ContentItem {
  url: string
  description: string
  synopsis: string
  genres: string[]
  tags: string[]
  actors: string[]
  director?: string
  episode_count?: number
  duration?: number
  status?: string
  release_date?: string
  streaming_urls: {
    quality: string
    url: string
    size: string
  }[]
  trailers: {
    title: string
    url: string
    thumbnail: string
  }[]
  images: {
    url: string
    type: string
    width: number
    height: number
  }[]
  subtitles: {
    language: string
    url: string
  }[]
  related_content?: string[]
  user_ratings?: {
    average: number
    count: number
  }
  popularity_score?: number
  is_premium?: boolean
}

// Interface pour les réponses de recherche
export interface SearchResponse {
  results: ContentItem[]
  message?: string
  requestId?: string
  status?: 'pending' | 'processing' | 'completed'
  resultsCount?: number
}

// Interface pour les requêtes de contenu
export interface ContentRequest {
  id: string
  userId?: string
  query?: string
  status?: 'pending' | 'processing' | 'completed'
  createdAt?: string
  updatedAt?: string
  resultsCount?: number
}

// Interface pour les carrousels
export interface Carousel {
  title: string
  type: string
  items: ContentItem[]
}

// Interface pour les bannières
export interface HeroBanner {
  banners: ContentItem[]
}

// Données de démonstration pour le développement
const mockData: Record<string, ContentItem[]> = {
  drama: [
    {
      id: 'viki-1001',
      title: 'Crash Landing on You',
      original_title: '사랑의 불시착',
      poster: 'https://via.placeholder.com/300x450?text=Crash+Landing+on+You',
      year: 2019,
      rating: 9.2,
      language: 'ko'
    },
    {
      id: 'viki-1002',
      title: 'Goblin',
      original_title: '도깨비',
      poster: 'https://via.placeholder.com/300x450?text=Goblin',
      year: 2016,
      rating: 8.9,
      language: 'ko'
    },
    {
      id: 'dramacool-1003',
      title: 'Itaewon Class',
      original_title: '이태원 클라쓰',
      poster: 'https://via.placeholder.com/300x450?text=Itaewon+Class',
      year: 2020,
      rating: 8.7,
      language: 'ko'
    }
  ],
  anime: [
    {
      id: 'crunchyroll-2001',
      title: 'Attack on Titan',
      original_title: '進撃の巨人',
      poster: 'https://via.placeholder.com/300x450?text=Attack+on+Titan',
      year: 2013,
      rating: 9.0,
      language: 'ja'
    },
    {
      id: 'crunchyroll-2002',
      title: 'Demon Slayer',
      original_title: '鬼滅の刃',
      poster: 'https://via.placeholder.com/300x450?text=Demon+Slayer',
      year: 2019,
      rating: 8.8,
      language: 'ja'
    },
    {
      id: 'crunchyroll-2003',
      title: 'My Hero Academia',
      original_title: '僕のヒーローアカデミア',
      poster: 'https://via.placeholder.com/300x450?text=My+Hero+Academia',
      year: 2016,
      rating: 8.5,
      language: 'ja'
    }
  ],
  bollywood: [
    {
      id: 'zee5-3001',
      title: '3 Idiots',
      original_title: '3 इडियट्स',
      poster: 'https://via.placeholder.com/300x450?text=3+Idiots',
      year: 2009,
      rating: 8.4,
      language: 'hi'
    },
    {
      id: 'hotstar-3002',
      title: 'Kabhi Khushi Kabhie Gham',
      original_title: 'कभी ख़ुशी कभी ग़म',
      poster: 'https://via.placeholder.com/300x450?text=K3G',
      year: 2001,
      rating: 7.9,
      language: 'hi'
    },
    {
      id: 'hotstar-3003',
      title: 'Dangal',
      original_title: 'दंगल',
      poster: 'https://via.placeholder.com/300x450?text=Dangal',
      year: 2016,
      rating: 8.3,
      language: 'hi'
    }
  ],
  film: [
    {
      id: 'imdb-4001',
      title: 'Inception',
      poster: 'https://via.placeholder.com/300x450?text=Inception',
      year: 2010,
      rating: 8.8,
      language: 'en'
    },
    {
      id: 'imdb-4002',
      title: 'The Shawshank Redemption',
      poster: 'https://via.placeholder.com/300x450?text=Shawshank+Redemption',
      year: 1994,
      rating: 9.3,
      language: 'en'
    },
    {
      id: 'allocine-4003',
      title: 'Amélie',
      original_title: 'Le Fabuleux Destin d\'Amélie Poulain',
      poster: 'https://via.placeholder.com/300x450?text=Amelie',
      year: 2001,
      rating: 8.3,
      language: 'fr'
    }
  ]
};

// Données de démonstration pour les détails de contenu
const getMockContentDetail = (contentId: string): ContentDetail | null => {
  const [source, id] = contentId.split('-');
  let mockItem: ContentItem | undefined;
  
  // Chercher l'élément dans les données de démonstration
  Object.values(mockData).forEach(items => {
    const found = items.find(item => item.id === contentId);
    if (found) mockItem = found;
  });
  
  if (!mockItem) return null;
  
  return {
    ...mockItem,
    url: `https://example.com/watch/${contentId}`,
    description: `Ceci est une description générée pour ${mockItem.title}`,
    synopsis: `Synopsis détaillé pour ${mockItem.title}. Ce contenu est disponible en streaming.`,
    genres: ['Action', 'Drame', 'Romance'],
    tags: ['Populaire', 'Tendance', '2020s'],
    actors: ['Acteur 1', 'Acteur 2', 'Acteur 3'],
    director: 'Réalisateur Célèbre',
    episode_count: Math.floor(Math.random() * 16) + 1,
    duration: Math.floor(Math.random() * 120) + 60,
    status: 'Terminé',
    release_date: `${mockItem.year}-01-01`,
    streaming_urls: [
      {
        quality: 'HD',
        url: `https://example.com/stream/${contentId}/hd`,
        size: '1.2 GB'
      },
      {
        quality: 'SD',
        url: `https://example.com/stream/${contentId}/sd`,
        size: '700 MB'
      }
    ],
    trailers: [
      {
        title: 'Bande-annonce officielle',
        url: `https://example.com/trailer/${contentId}`,
        thumbnail: `https://via.placeholder.com/640x360?text=Trailer+${mockItem.title}`
      }
    ],
    images: [
      {
        url: `https://via.placeholder.com/1280x720?text=Scene+${mockItem.title}+1`,
        type: 'scene',
        width: 1280,
        height: 720
      },
      {
        url: `https://via.placeholder.com/1280x720?text=Scene+${mockItem.title}+2`,
        type: 'scene',
        width: 1280,
        height: 720
      }
    ],
    subtitles: [
      {
        language: 'fr',
        url: `https://example.com/subtitles/${contentId}/fr`
      },
      {
        language: 'en',
        url: `https://example.com/subtitles/${contentId}/en`
      }
    ],
    related_content: [],
    user_ratings: {
      average: mockItem.rating,
      count: Math.floor(Math.random() * 10000) + 1000
    },
    popularity_score: Math.random() * 100,
    is_premium: Math.random() > 0.7
  };
};

// Fonction pour récupérer les contenus d'une catégorie
const getMockContentsByCategory = (category: ContentType): ContentItem[] => {
  return mockData[category] || [];
};

// Fonction pour récupérer les détails d'un contenu
const getMockContentDetails = (contentId: string): ContentDetail => {
  const contentDetail = getMockContentDetail(contentId);
  if (!contentDetail) {
    throw new Error(`Impossible de trouver les détails du contenu ${contentId}`);
  }
  return contentDetail;
};

// URL de l'API Gateway AWS
const API_URL = 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production';
// URL du proxy CORS (conservée pour compatibilité avec le code existant)
const PROXY_URL = '';
// Chemin de l'API (vide car nous utilisons directement l'API Gateway)
const API_PATH = '';

// Variables pour le suivi des tentatives de connexion
let isBackendAvailable = true; // Activé par défaut pour tenter de récupérer les données réelles
let connectionAttempts = 0;
let lastConnectionCheck = 0;

/**
 * Vérifie si le backend est disponible
 * @returns Promise<boolean>
 */
export async function checkBackendAvailability(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Tenter une requête simple vers le backend
    const response = await axios.get(`${API_URL}/content?category=drama`, { 
      timeout: 5000,  // Timeout de 5 secondes
      validateStatus: (status: number) => status >= 200 && status < 500 // Accepter les codes 2xx et 4xx, mais pas 5xx
    });
    
    // Si le statut est 404, l'endpoint n'existe pas mais le backend pourrait être disponible
    // Nous considérons que le backend est disponible pour tenter d'autres endpoints
    if (response.status === 404) {
      console.log('⚠️ Endpoint /content non trouvé, mais le backend est considéré comme disponible');
      isBackendAvailable = true;
      connectionAttempts = 0;
      return true;
    }
    
    // Vérifier si la réponse est valide (code 2xx)
    isBackendAvailable = response.status >= 200 && response.status < 300;
    connectionAttempts = 0;
    
    if (isBackendAvailable) {
      console.log('✅ Connexion au backend établie avec succès');
    } else {
      console.warn(`⚠️ Le backend a répondu avec le code ${response.status}`);
    }
    
    return isBackendAvailable;
  } catch (error: unknown) {
    connectionAttempts++;
    isBackendAvailable = false;
    console.warn(`❌ Échec de connexion au backend (tentative ${connectionAttempts}): ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return false;
  }
}

/**
 * Effectue une requête API avec gestion des erreurs et retry
 * @param url URL de la requête
 * @param options Options de la requête axios (optionnel)
 * @param retries Nombre de tentatives restantes
 * @returns Promise<any>
 */
async function apiRequest<T>(url: string, options: AxiosRequestConfig = {}, retries = 3): Promise<T> {
  try {
    // Si le backend est indisponible, ne pas tenter la requête
    if (!isBackendAvailable && retries === 3) {
      throw new Error('Backend indisponible');
    }

    // Effectuer la requête avec les options fournies
    const response = await axios.get<T>(url, { 
      timeout: options.timeout || 10000,
      validateStatus: options.validateStatus,
      headers: options.headers,
      ...options
    });
    
    return response.data;
  } catch (error: unknown) {
    console.error(`Erreur lors de la requête API: ${url}`, error);
    
    // Analyse détaillée de l'erreur pour le débogage
    if (error instanceof Error) {
      // Erreur avec réponse du serveur (4xx, 5xx)
      console.error(`Statut erreur: ${error.message}`);
      console.error('Données erreur:', error);
      console.error('Headers erreur:', error);
    } else if (axios.isAxiosError(error)) {
      // Erreur sans réponse (timeout, problème réseau)
      console.error('Erreur de connexion, pas de réponse reçue');
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur de configuration:', error);
    }
    
    if (retries > 0 && !(error instanceof Error && error.message.includes('ECONNABORTED'))) {
      // Attendre avant de réessayer (avec backoff exponentiel)
      const backoffTime = 1000 * Math.pow(2, 3 - retries);
      console.log(`Nouvelle tentative dans ${backoffTime}ms (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return apiRequest<T>(url, options, retries - 1);
    }
    
    // Si toutes les tentatives échouent, marquer le backend comme indisponible
    isBackendAvailable = false;
    throw error;
  }
}

/**
 * Recherche des contenus
 * @param query Terme de recherche
 * @param userId ID de l'utilisateur (optionnel)
 * @returns Promise<ContentItem[]>
 */
export const searchContents = async (query: string, userId?: string): Promise<ContentItem[]> => {
  try {
    // En mode développement ou sans connexion, utiliser les données locales
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      const results: ContentItem[] = []
      const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
      
      // Rechercher dans les données de démonstration
      for (const type of types) {
        const typeResults = mockData[type].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.original_title && item.original_title.toLowerCase().includes(query.toLowerCase()))
        )
        results.push(...typeResults)
      }
      
      // Si aucun résultat n'est trouvé, simuler une demande de scraping ciblé
      if (results.length === 0 && userId) {
        // Retourner un tableau vide avec un message dans la console
        console.log(`Aucun résultat trouvé pour "${query}". Nous allons rechercher ce contenu pour vous.`);
        return [];
      }
      
      return results;
    }
    
    // En production avec connexion, utiliser l'API
    try {
      const response = await apiRequest<SearchResponse>(`${API_URL}/search`, 3);
      // Extraire le tableau de résultats de la réponse
      return response.results || [];
    } catch (apiError) {
      console.warn(`Erreur API pour la recherche "${query}", utilisation des données de démonstration.`)
      
      // Rechercher dans les données de démonstration
      const results: ContentItem[] = []
      const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
      
      for (const type of types) {
        const typeResults = mockData[type].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.original_title && item.original_title.toLowerCase().includes(query.toLowerCase()))
        )
        results.push(...typeResults)
      }
      
      return results;
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche de contenus:`, error)
    return [];
  }
}

/**
 * Déclenche un scraping ciblé pour une recherche spécifique
 * @param query Terme de recherche
 * @param userId ID de l'utilisateur (optionnel)
 * @returns Promise<string> ID de la requête de scraping
 */
export const triggerTargetedScraping = async (query: string, userId?: string): Promise<string> => {
  try {
    // En mode développement, simuler une réponse
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      // Simuler un délai pour le traitement
      const now = new Date();
      const createdAt = new Date(now.getTime() - 60000); // 1 minute plus tôt
      
      // Déterminer le statut en fonction du temps écoulé
      const timeDiff = now.getTime() - parseInt(query.split('-')[1]);
      let status: 'pending' | 'processing' | 'completed' = 'pending';
      let resultsCount = 0;
      
      if (timeDiff > 30000) { // Plus de 30 secondes
        status = 'completed';
        resultsCount = 3;
      } else if (timeDiff > 15000) { // Plus de 15 secondes
        status = 'processing';
      }
      
      // Retourner uniquement l'ID de la requête
      return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // En production, utiliser l'API
    const response = await apiRequest<ContentRequest>(`${API_URL}/trigger-scraping?q=${encodeURIComponent(query)}`, 3);
    return response.id;
  } catch (error) {
    console.error(`Erreur lors du déclenchement du scraping ciblé pour "${query}":`, error)
    return `mock-request-${Date.now()}`;
  }
}

/**
 * Récupère les contenus d'une catégorie spécifique
 * @param category Type de contenu (drama, anime, bollywood, film)
 * @returns Promise<ContentItem[]>
 */
export const getContentsByCategory = async (category: ContentType): Promise<ContentItem[]> => {
  try {
    // Vérifier d'abord s'il existe des données en cache
    try {
      const cachedData = localStorage.getItem(`content_${category}`);
      const cacheTimestamp = localStorage.getItem(`content_${category}_timestamp`);
      
      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 heures
        
        if (cacheAge < CACHE_MAX_AGE) {
          console.log(`📦 Utilisation du cache local pour la catégorie ${category} (âge: ${Math.round(cacheAge / 60000)}min)`);
          return JSON.parse(cachedData);
        } else {
          console.log(`🕒 Cache expiré pour la catégorie ${category}, rafraîchissement...`);
        }
      }
    } catch (cacheError) {
      console.warn('Impossible de lire le cache:', cacheError);
    }
    
    // Tenter de récupérer les données depuis l'API
    try {
      // Vérifier si le backend est disponible
      await checkBackendAvailability();
      
      if (isBackendAvailable) {
        console.log(`🔄 Récupération des données pour ${category} depuis l'API...`);
        
        // Essayer plusieurs variantes de chemins d'API possibles
        const possibleEndpoints = [
          `/content?category=${category}`,
          `/contents?category=${category}`,
          `/api/content?category=${category}`,
          `/api/contents?category=${category}`,
          `/${category}`
        ];
        
        let response: ContentItem[] = [];
        let endpointFound = false;
        
        // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
        for (const endpoint of possibleEndpoints) {
          try {
            console.log(`🔍 Tentative avec l'endpoint: ${endpoint}`);
            response = await apiRequest<ContentItem[]>(`${API_URL}${endpoint}`, {
              timeout: 3000,
              validateStatus: (status: number) => status >= 200 && status < 300
            });
            console.log(`✅ Endpoint trouvé: ${endpoint}`);
            endpointFound = true;
            break;
          } catch (endpointError: any) {
            console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
            continue;
          }
        }
        
        if (!endpointFound) {
          console.warn(`⚠️ Aucun endpoint n'a fonctionné pour ${category}, utilisation des données mockées`);
          return mockData[category] || [];
        }
        
        // Mettre en cache les données récupérées
        try {
          localStorage.setItem(`content_${category}`, JSON.stringify(response));
          localStorage.setItem(`content_${category}_timestamp`, Date.now().toString());
          console.log(`💾 Données pour ${category} mises en cache`);
        } catch (cacheError) {
          console.warn('Impossible de mettre en cache les données:', cacheError);
        }
        
        return response;
      } else {
        console.warn(`⚠️ Backend indisponible, utilisation des données mockées pour ${category}`);
        return mockData[category] || [];
      }
    } catch (apiError) {
      console.error(`Erreur lors de la récupération des données depuis l'API pour ${category}:`, apiError);
      console.warn(`⚠️ Utilisation des données mockées pour ${category} (solution de repli)`);
      return mockData[category] || [];
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des contenus pour ${category}:`, error);
    return mockData[category] || [];
  }
}

/**
 * Récupère les détails d'un contenu
 * @param contentId ID du contenu
 * @returns Promise<ContentDetail>
 */
export const getContentDetails = async (contentId: string): Promise<ContentDetail> => {
  try {
    // Vérifier si le backend est disponible
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      try {
        // Tenter de récupérer les données depuis l'API
        const item = await apiRequest<ContentDetail>(`${API_URL}/content/${contentId}`);
        console.log(`✅ Détails du contenu ${contentId} récupérés depuis l'API`);
        return item;
      } catch (error) {
        console.warn(`⚠️ Échec de récupération des détails depuis l'API pour ${contentId}, fallback sur les données mockées`, error);
        // Fallback sur les données mockées en cas d'erreur
        return getMockContentDetails(contentId);
      }
    } else {
      console.warn(`⚠️ Backend indisponible, utilisation des données mockées pour ${contentId}`);
      // Utiliser les données mockées si le backend est indisponible
      return getMockContentDetails(contentId);
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails pour ${contentId}:`, error);
    return getMockContentDetails(contentId);
  }
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels configurés
 */
export async function getCarousels(): Promise<Record<string, Carousel>> {
  try {
    // Vérifier si le backend est disponible
    await checkBackendAvailability();
    
    if (isBackendAvailable) {
      // Essayer plusieurs variantes de chemins d'API possibles
      const possibleEndpoints = [
        `/carousels`,
        `/carousel`,
        `/api/carousels`,
        `/api/carousel`,
        `/home/carousels`
      ];
      
      let response: Record<string, Carousel> = {};
      let endpointFound = false;
      
      // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Tentative avec l'endpoint: ${endpoint}`);
          response = await apiRequest<Record<string, Carousel>>(`${API_URL}${endpoint}`, {
            timeout: 3000,
            validateStatus: (status: number) => status >= 200 && status < 300
          });
          console.log(`✅ Endpoint trouvé: ${endpoint}`);
          endpointFound = true;
          break;
        } catch (endpointError: any) {
          console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
          continue;
        }
      }
      
      if (endpointFound) {
        console.log('✅ Carousels récupérés depuis l\'API');
        return response;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des carousels:', error);
  }
  
  console.warn('⚠️ Utilisation des données importées ou mockées pour les carousels (solution de repli)');
  
  // Si les données importées sont disponibles et ont le bon format, les utiliser
  if (carousels && Object.keys(carousels).length > 0) {
    return carousels;
  }
  
  // Sinon, utiliser les données mockées
  return {
    featured: {
      title: "À la une",
      type: "featured",
      items: mockData.drama
    },
    trending: {
      title: "Tendances",
      type: "trending",
      items: mockData.film
    },
    new_releases: {
      title: "Nouveautés",
      type: "new_releases",
      items: mockData.anime
    },
    popular: {
      title: "Populaires",
      type: "popular",
      items: mockData.bollywood
    }
  }
}

/**
 * Récupère les bannières pour le composant HeroBanner
 * @returns Liste des bannières à afficher
 */
export async function getHeroBanners(): Promise<HeroBanner> {
  try {
    // Vérifier si le backend est disponible
    await checkBackendAvailability();
    
    if (isBackendAvailable) {
      // Essayer plusieurs variantes de chemins d'API possibles
      const possibleEndpoints = [
        `/hero-banners`,
        `/hero_banners`,
        `/banners`,
        `/api/hero-banners`,
        `/api/banners`,
        `/home/banners`
      ];
      
      let response: HeroBanner;
      let endpointFound = false;
      
      // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Tentative avec l'endpoint: ${endpoint}`);
          response = await apiRequest<HeroBanner>(`${API_URL}${endpoint}`, {
            timeout: 3000,
            validateStatus: (status: number) => status >= 200 && status < 300
          });
          console.log(`✅ Endpoint trouvé: ${endpoint}`);
          endpointFound = true;
          return response;
        } catch (endpointError: any) {
          console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
          continue;
        }
      }
      
      if (!endpointFound) {
        console.warn('⚠️ Aucun endpoint n\'a fonctionné pour les bannières, utilisation des données importées ou mockées');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des bannières:', error);
  }
  
  console.warn('⚠️ Utilisation des données importées ou mockées pour les bannières (solution de repli)');
  
  // Si les données importées sont vides, générer des données de démonstration
  if (!heroBanners || !heroBanners.banners || heroBanners.banners.length === 0) {
    console.warn('⚠️ Utilisation des données mockées pour les bannières (solution de repli)');
    return {
      banners: [
        mockData.drama[0],
        mockData.anime[0],
        mockData.film[0]
      ]
    }
  }
  
  // Si les bannières importées n'ont pas le bon format, les adapter
  if (heroBanners.banners && heroBanners.banners.length > 0) {
    // Vérifier si les bannières ont le format attendu
    const firstBanner = heroBanners.banners[0];
    if (firstBanner && 'image' in firstBanner && !('poster' in firstBanner)) {
      // Convertir les bannières au format ContentItem
      const convertedBanners = heroBanners.banners.map((banner: any) => ({
        id: banner.id || `banner-${Math.random().toString(36).substring(2, 9)}`,
        title: banner.title || 'Bannière sans titre',
        poster: banner.image || 'https://via.placeholder.com/1280x720?text=Banner',
        year: banner.year || new Date().getFullYear(),
        rating: banner.rating || 8.0,
        language: banner.language || 'fr'
      }));
      
      return { banners: convertedBanners };
    }
  }
  
  return heroBanners as unknown as HeroBanner;
}

/**
 * Recherche des contenus dans toutes les catégories
 * @param query Terme de recherche
 * @param userId Identifiant de l'utilisateur (pour les demandes de contenu)
 * @param token Token d'authentification (optionnel)
 * @returns Résultat de recherche avec possibilité de scraping intelligent
 */
export async function searchContent(query: string, userId?: string, token?: string): Promise<SearchResponse> {
  if (!query.trim()) return { results: [] }
  
  try {
    // En mode développement ou sans connexion, utiliser les données locales
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      const results: ContentItem[] = []
      const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
      
      // Rechercher dans les données de démonstration
      for (const type of types) {
        const typeResults = mockData[type].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.original_title && item.original_title.toLowerCase().includes(query.toLowerCase()))
        )
        results.push(...typeResults)
      }
      
      // Si aucun résultat n'est trouvé, simuler une demande de scraping ciblé
      if (results.length === 0 && userId) {
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        return {
          results: [],
          message: `Aucun résultat trouvé pour "${query}". Nous allons rechercher ce contenu pour vous.`,
          requestId,
          status: 'pending',
          resultsCount: 0
        }
      }
      
      return { results }
    }
    
    // En production avec connexion, utiliser l'API
    try {
      const response = await apiRequest<SearchResponse>(`${API_URL}/search`, 3);
      return response;
    } catch (apiError) {
      console.warn(`Erreur API pour la recherche "${query}", utilisation des données de démonstration.`)
      
      // Rechercher dans les données de démonstration
      const results: ContentItem[] = []
      const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
      
      for (const type of types) {
        const typeResults = mockData[type].filter(item => 
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          (item.original_title && item.original_title.toLowerCase().includes(query.toLowerCase()))
        )
        results.push(...typeResults)
      }
      
      return { results }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche de contenus:`, error)
    return { results: [] }
  }
}

/**
 * Récupère le statut d'une demande de contenu
 * @param requestId Identifiant de la demande
 * @param token Token d'authentification (optionnel)
 * @returns Statut de la demande
 */
export async function getContentRequestStatus(requestId: string, token?: string): Promise<ContentRequest | null> {
  try {
    // En mode développement, simuler une réponse
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      // Simuler un délai pour le traitement
      const now = new Date();
      const createdAt = new Date(now.getTime() - 60000); // 1 minute plus tôt
      
      // Déterminer le statut en fonction du temps écoulé
      const timeDiff = now.getTime() - parseInt(requestId.split('-')[1]);
      let status: 'pending' | 'processing' | 'completed' = 'pending';
      let resultsCount = 0;
      
      if (timeDiff > 30000) { // Plus de 30 secondes
        status = 'completed';
        resultsCount = 3;
      } else if (timeDiff > 15000) { // Plus de 15 secondes
        status = 'processing';
      }
      
      return {
        id: requestId,
        userId: 'user123',
        query: 'Requête simulée',
        status,
        createdAt: createdAt.toISOString(),
        updatedAt: now.toISOString(),
        resultsCount
      };
    }
    
    // En production, utiliser l'API
    const response = await apiRequest<ContentRequest>(`${API_URL}/content-request/${requestId}`, 3);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération du statut de la demande:`, error)
    return null
  }
}

/**
 * Récupère les notifications d'un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Liste des notifications
 */
export async function getUserNotifications(userId: string, token: string): Promise<any[]> {
  try {
    // En mode développement, simuler des notifications
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      const now = new Date();
      
      return [
        {
          id: `notif-${Date.now()}-1`,
          title: 'Nouveau contenu disponible',
          message: 'Le drama que vous avez demandé "Sweet Home" est maintenant disponible.',
          type: 'success',
          createdAt: new Date(now.getTime() - 3600000).toISOString(), // 1 heure plus tôt
          read: false,
          link: '/drama/viki-1005',
          contentId: 'viki-1005'
        },
        {
          id: `notif-${Date.now()}-2`,
          title: 'Recherche en cours',
          message: 'Nous recherchons "Squid Game" dans nos sources. Vous serez notifié dès que nous aurons des résultats.',
          type: 'info',
          createdAt: new Date(now.getTime() - 86400000).toISOString(), // 1 jour plus tôt
          read: true
        },
        {
          id: `notif-${Date.now()}-3`,
          title: 'Mise à jour de contenu',
          message: 'De nouveaux épisodes de "Attack on Titan" sont disponibles.',
          type: 'info',
          createdAt: new Date(now.getTime() - 259200000).toISOString(), // 3 jours plus tôt
          read: true,
          link: '/anime/crunchyroll-2001',
          contentId: 'crunchyroll-2001'
        }
      ];
    }
    
    // En production, utiliser l'API
    const response = await apiRequest<any[]>(`${API_URL}/notifications/${userId}`, 3);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération des notifications:`, error)
    return []
  }
}

/**
 * Marque une notification comme lue
 * @param notificationId Identifiant de la notification
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Statut de l'opération
 */
export async function markNotificationAsRead(notificationId: string, userId: string, token: string): Promise<boolean> {
  try {
    // En mode développement, simuler une réponse réussie
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      return true;
    }
    
    // En production, utiliser l'API
    await apiRequest(`${API_URL}/notifications/${notificationId}/read`, 3);
    return true
  } catch (error) {
    console.error(`Erreur lors du marquage de la notification comme lue:`, error)
    return false
  }
}

/**
 * Récupère les contenus recommandés pour un utilisateur
 * @param userId Identifiant de l'utilisateur
 * @param token Token d'authentification
 * @returns Liste des contenus recommandés
 */
export async function getRecommendedContent(userId: string, token: string): Promise<ContentItem[]> {
  try {
    // En mode développement, utiliser des données de démonstration
    if (process.env.NODE_ENV === 'development' || !navigator.onLine) {
      // Mélanger les contenus de différentes catégories pour simuler des recommandations
      const recommendations: ContentItem[] = [
        ...mockData.drama.slice(0, 1),
        ...mockData.anime.slice(0, 1),
        ...mockData.bollywood.slice(0, 1),
        ...mockData.film.slice(0, 1)
      ];
      
      // Ajouter un délai artificiel pour simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return recommendations;
    }
    
    // En production, utiliser l'API
    const response = await apiRequest<ContentItem[]>(`${API_URL}/recommendations/${userId}`, 3);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération des recommandations:`, error)
    
    // Fallback sur les contenus populaires
    const popularItems: ContentItem[] = []
    const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
    
    // Récupérer quelques éléments populaires de chaque type
    for (const type of types) {
      popularItems.push(...mockData[type].slice(0, 1))
    }
    
    return popularItems
  }
}

/**
 * Alias pour la compatibilité avec les composants existants
 */
export const getCategoryContent = getContentsByCategory;
export const getContentDetail = getContentDetails;
