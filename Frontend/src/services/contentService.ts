// Service de récupération des contenus depuis les données générées par GitHub Actions
import axios from 'axios'

// Définition de l'interface AxiosRequestConfig pour éviter les problèmes d'importation
interface AxiosRequestConfig {
  timeout?: number;
  validateStatus?: (status: number) => boolean;
  headers?: Record<string, string>;
  [key: string]: any;
}

// Importation des données locales générées par le workflow
import dramaData from '../data/content/drama/index.json';
import animeData from '../data/content/anime/index.json';
import filmData from '../data/content/film/index.json';
import bollywoodData from '../data/content/bollywood/index.json';
import carouselsData from '../data/carousels.json';
import heroBannersData from '../data/hero_banners.json';

// Importation des données statiques (générées par GitHub Actions)
import metadata from '../data/metadata.json'

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
  episodes?: number
  seasons?: number
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
  gallery?: string[]
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

// Constante pour le domaine CloudFront (définie en haut du fichier pour être réutilisée)
const CLOUDFRONT_DOMAIN = 'https://d11nnqvjfooahr.cloudfront.net';

// Fonction pour corriger les URLs des images
function fixImageUrls<T extends { image?: string; poster?: string }>(items: T[]): any[] {
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => {
    if (!item) return item;
    
    // Copier l'item pour éviter de modifier l'original
    const fixedItem = { ...item } as any;
    
    // Convertir l'objet au format ContentItem
    if (fixedItem.image && !fixedItem.poster) {
      fixedItem.poster = fixedItem.image;
    }
    
    // Corriger l'URL du poster si elle existe
    if (fixedItem.poster) {
      // Si l'URL est déjà une URL CloudFront, ne rien faire
      if (fixedItem.poster.includes(CLOUDFRONT_DOMAIN)) {
        // L'URL est déjà correcte, ne rien faire
      } 
      // Si l'URL est relative, la compléter avec le domaine CloudFront
      else if (fixedItem.poster.startsWith('/')) {
        fixedItem.poster = `${CLOUDFRONT_DOMAIN}${fixedItem.poster}`;
      }
      // Sinon, c'est une URL externe, la fonction download_and_upload_image du lambda_handler.py
      // devrait déjà avoir téléchargé cette image et remplacé l'URL par une URL CloudFront
      // Cette partie du code n'est plus nécessaire mais conservée pour compatibilité temporaire
    }
    
    // Ajouter les propriétés manquantes pour correspondre à l'interface ContentItem
    if (!fixedItem.title && fixedItem.titre) {
      fixedItem.title = fixedItem.titre;
    }
    
    if (!fixedItem.year && fixedItem.annee) {
      fixedItem.year = fixedItem.annee;
    }
    
    if (!fixedItem.rating) {
      fixedItem.rating = 7.5; // Valeur par défaut
    }
    
    if (!fixedItem.language) {
      fixedItem.language = 'fr'; // Valeur par défaut
    }
    
    return fixedItem as ContentItem;
  });
}

// Données locales structurées avec URLs d'images corrigées
const localData: Record<ContentType, ContentItem[]> = {
  drama: fixImageUrls(dramaData.items),
  anime: fixImageUrls(animeData.items),
  film: fixImageUrls(filmData.items),
  bollywood: fixImageUrls(bollywoodData.items)
};

// Logs de débogage pour vérifier les données locales
console.log('📊 Données locales chargées:');
console.log('Drama:', localData.drama ? `${localData.drama.length} éléments` : 'Aucun élément');
console.log('Anime:', localData.anime ? `${localData.anime.length} éléments` : 'Aucun élément');
console.log('Film:', localData.film ? `${localData.film.length} éléments` : 'Aucun élément');
console.log('Bollywood:', localData.bollywood ? `${localData.bollywood.length} éléments` : 'Aucun élément');

// Fonction pour créer un objet ContentDetail vide
function createEmptyContentDetail(contentId: string): ContentDetail {
  return {
    id: contentId,
    title: 'Contenu non trouvé',
    original_title: '',
    poster: '/assets/images/placeholder.jpg',
    year: new Date().getFullYear(),
    rating: 0,
    language: 'fr',
    description: 'Ce contenu n\'est pas disponible actuellement.',
    synopsis: 'Aucune information disponible.',
    url: '',
    genres: [],
    tags: [],
    actors: [],
    director: '',
    episode_count: 0,
    episodes: 0,
    seasons: 0,
    duration: 0,
    status: '',
    release_date: '',
    source: 'unknown',
    streaming_urls: [],
    trailers: [],
    images: [],
    subtitles: [],
    related_content: []
  };
}

// Fonction pour récupérer les détails d'un contenu mockés
const getMockContentDetail = (contentId: string): ContentDetail | null => {
  const [source, id] = contentId.split('-');
  
  // Chercher dans les données mockées
  let mockItem: ContentItem | undefined;
  
  if (source === 'drama') {
    mockItem = mockData.drama.find(item => item.id === contentId);
  } else if (source === 'anime') {
    mockItem = mockData.anime.find(item => item.id === contentId);
  } else if (source === 'film') {
    mockItem = mockData.film.find(item => item.id === contentId);
  } else if (source === 'bollywood') {
    mockItem = mockData.bollywood.find(item => item.id === contentId);
  }
  
  if (!mockItem) {
    return null;
  }
  
  // Convertir ContentItem en ContentDetail
  return {
    ...mockItem,
    url: `https://example.com/watch/${contentId}`,
    description: `Description détaillée pour ${mockItem.title}. Ce contenu est généré automatiquement à des fins de démonstration.`,
    synopsis: `Synopsis détaillé pour ${mockItem.title}. Ce contenu est disponible en streaming.`,
    genres: ['Action', 'Drame', 'Romance'],
    tags: ['Populaire', 'Tendance'],
    actors: ['Acteur 1', 'Acteur 2', 'Acteur 3'],
    director: 'Réalisateur',
    episode_count: source === 'drama' || source === 'anime' ? Math.floor(Math.random() * 24) + 1 : 1,
    duration: Math.floor(Math.random() * 120) + 30,
    episodes: source === 'drama' || source === 'anime' ? Math.floor(Math.random() * 24) + 1 : 0,
    seasons: source === 'drama' || source === 'anime' ? Math.floor(Math.random() * 5) + 1 : 0,
    status: 'completed',
    release_date: `${mockItem.year}-01-01`,
    streaming_urls: [
      {
        quality: 'HD',
        url: `https://example.com/stream/${contentId}/hd`,
        size: '1.2 GB'
      }
    ],
    trailers: [
      {
        title: 'Bande-annonce',
        url: `https://example.com/trailer/${contentId}`,
        thumbnail: mockItem.poster
      }
    ],
    images: [
      {
        url: mockItem.poster,
        type: 'poster',
        width: 300,
        height: 450
      }
    ],
    subtitles: [
      {
        language: 'fr',
        url: `https://example.com/subtitles/${contentId}/fr`
      }
    ],
    related_content: [],
    gallery: [
      mockItem.poster,
      mockItem.poster.replace('.jpg', '-2.jpg'),
      mockItem.poster.replace('.jpg', '-3.jpg')
    ]
  };
};

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

// URL de l'API Gateway AWS
const API_URL = typeof window !== 'undefined' && window.location.hostname.endsWith('surge.sh')
  ? 'https://7la2pq33ej.execute-api.us-east-1.amazonaws.com/production'  // URL directe de l'API Gateway en production
  : 'http://localhost:8080';  // URL du proxy CORS local pour le développement
// Chemin de l'API (vide car nous utilisons désormais le proxy CORS)
const API_PATH = '';

// Variables pour le suivi des tentatives de connexion
let isBackendAvailable = true; // Activé par défaut pour récupérer les données réelles depuis AWS
let connectionAttempts = 0;
let lastConnectionCheck = 0;

// Vérifier si nous sommes en développement local ou en production
const isLocalDevelopment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Domaine de l'application en production
const APP_DOMAIN = 'flodrama.surge.sh';

/**
 * Vérifie si le backend est disponible
 * @returns Promise<boolean>
 */
export async function checkBackendAvailability(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  // Si la dernière vérification a été effectuée il y a moins de 5 minutes, utiliser le résultat précédent
  const now = Date.now();
  if (lastConnectionCheck > 0 && now - lastConnectionCheck < 5 * 60 * 1000) {
    return isBackendAvailable;
  }

  try {
    // Tenter une requête simple vers le backend
    console.log('🔄 Vérification de la disponibilité du backend...');
    console.log(`🔍 URL de l'API: ${API_URL}`);
    
    // Essayer plusieurs endpoints pour vérifier la disponibilité
    const testEndpoints = [
      '/health',
      '/status',
      '/content/drama',
      '/content/anime',
      '/content/film',
      '/content/bollywood',
      '/carousels'
    ];
    
    let apiAvailable = false;
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`🔍 Test de l'endpoint: ${API_URL}${endpoint}`);
        const response = await axios.get(`${API_URL}${endpoint}`, { 
          timeout: 5000,  // Timeout augmenté pour donner plus de temps à l'API
          validateStatus: (status: number) => true, // Accepter tous les codes de statut pour le diagnostic
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Referer': isLocalDevelopment ? 'http://localhost:3002' : `https://${APP_DOMAIN}`
          }
        });
        
        console.log(`📊 Réponse de l'API (${endpoint}): ${response.status}`);
        
        // Si on obtient une réponse 200, l'API est disponible
        if (response.status >= 200 && response.status < 300) {
          console.log('✅ Connexion au backend établie avec succès');
          isBackendAvailable = true;
          connectionAttempts = 0;
          lastConnectionCheck = now;
          return true;
        }
        
        // Si on obtient une réponse 403 ou 404, l'API est disponible mais l'endpoint n'existe pas
        if (response.status === 403 || response.status === 404) {
          console.log('✅ API Gateway détectée (mais endpoint non trouvé)');
          apiAvailable = true;
        }
      } catch (endpointError: any) {
        console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
      }
    }
    
    // Si au moins un endpoint a retourné 403 ou 404, considérer l'API comme disponible
    if (apiAvailable) {
      console.log('✅ API Gateway disponible (certains endpoints testés existent)');
      isBackendAvailable = true;
      connectionAttempts = 0;
      lastConnectionCheck = now;
      return true;
    }
    
    // Si aucun endpoint n'a fonctionné, marquer le backend comme indisponible
    console.error('❌ Aucun endpoint API valide trouvé');
    isBackendAvailable = false;
    connectionAttempts++;
    lastConnectionCheck = now;
    return false;
  } catch (error: unknown) {
    connectionAttempts++;
    isBackendAvailable = false;
    lastConnectionCheck = now;
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
    // Si le backend est indisponible, lancer une erreur
    if (!isBackendAvailable && retries === 3) {
      throw new Error('Backend indisponible');
    }

    console.log(`🔄 Requête API: ${url}`);
    
    // Configuration des en-têtes pour CORS
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Referer': isLocalDevelopment ? 'http://localhost:3002' : `https://${APP_DOMAIN}`
    };

    // Effectuer la requête avec les options fournies
    const response = await axios.get<T>(url, { 
      timeout: options.timeout || 8000,
      validateStatus: (status) => status >= 200 && status < 300, // N'accepter que les codes de succès
      headers: {
        ...headers,
        ...options.headers
      },
      withCredentials: false, // Ne pas envoyer de cookies pour les requêtes cross-origin
      ...options
    });
    
    // Vérifier si la réponse est valide
    if (response.data === null || response.data === undefined) {
      throw new Error('Réponse API vide ou invalide');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête API: ${url}`, error);
    
    // Analyse détaillée de l'erreur pour le débogage
    if (axios.isAxiosError(error) && error.response) {
      // Erreur avec réponse du serveur (4xx, 5xx)
      console.error(`Statut erreur: ${error.response.status}`);
      console.error('Données erreur:', error.response.data);
      console.error('Headers erreur:', error.response.headers);
      
      // Vérifier si c'est une erreur CORS
      if (error.response.status === 403 || error.message.includes('CORS')) {
        console.error('⚠️ Erreur CORS détectée. Vérifiez la configuration CORS de l\'API Gateway.');
        console.error('📝 Domaine de l\'application: ' + (isLocalDevelopment ? 'localhost:3002' : APP_DOMAIN));
        console.error('📝 URL de l\'API: ' + url);
        
        // Si c'est la première tentative, essayer avec une approche différente
        if (retries === 3) {
          console.log('🔄 Tentative avec une approche différente...');
          
          // Essayer sans les en-têtes personnalisés
          const newOptions = { ...options };
          delete newOptions.headers;
          
          // Attendre un court instant avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return apiRequest<T>(url, newOptions, retries - 1);
        }
      }
    } else if (axios.isAxiosError(error) && error.request) {
      // Erreur sans réponse (timeout, problème réseau)
      console.error('Erreur de connexion, pas de réponse reçue');
      console.error('Détails de la requête:', error.request);
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur de configuration:', error);
    }
    
    if (retries > 0 && !(axios.isAxiosError(error) && error.code === 'ECONNABORTED')) {
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
    // En production avec connexion, utiliser l'API
    const response = await apiRequest<SearchResponse>(`${API_URL}/search`, {}, 3);
    // Extraire le tableau de résultats de la réponse
    return response.results || [];
  } catch (apiError) {
    console.error(`Erreur API pour la recherche "${query}":`, apiError);
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
    // En production, utiliser l'API
    const response = await apiRequest<ContentRequest>(`${API_URL}/trigger-scraping?q=${encodeURIComponent(query)}`, {}, 3);
    return response.id;
  } catch (error) {
    console.error(`Erreur lors du déclenchement du scraping ciblé pour "${query}":`, error);
    return '';
  }
};

/**
 * Normalise une catégorie pour correspondre aux types d'API
 * @param category Catégorie à normaliser
 * @returns Catégorie normalisée
 */
function normalizeCategory(category: string): ContentType | string {
  const mapping: Record<string, ContentType> = {
    'movies': 'film',
    'movie': 'film',
    'films': 'film',
    'dramas': 'drama',
    'series': 'drama'
  };
  
  return mapping[category] || category;
}

/**
 * Récupère les contenus d'une catégorie spécifique
 * @param category Type de contenu (drama, anime, bollywood, film)
 * @returns Promise<ContentItem[]>
 */
export const getContentsByCategory = async (category: ContentType): Promise<ContentItem[]> => {
  try {
    // Vérifier si le backend est disponible
    await checkBackendAvailability();
    
    if (isBackendAvailable) {
      console.log(`🔄 Récupération des données pour ${category} depuis l'API...`);
      
      // Normaliser la catégorie pour l'API
      const normalizedCategory = normalizeCategory(category);
      
      // Essayer plusieurs variantes de chemins d'API possibles
      const possibleEndpoints = [
        `/content/${normalizedCategory}`,
        `/contents/${normalizedCategory}`,
        `/${normalizedCategory}`
      ];
      
      let response: ContentItem[] = [];
      let endpointFound = false;
      
      // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Tentative avec l'endpoint: ${endpoint}`);
          response = await apiRequest<ContentItem[]>(`${API_URL}${endpoint}`, {
            timeout: 5000
          });
          
          // Vérifier si les données reçues sont valides
          if (response && Array.isArray(response) && response.length > 0) {
            console.log(`✅ Endpoint trouvé: ${endpoint}`);
            console.log(`📊 Données reçues: ${response.length} éléments`);
            
            // Vérifier si les URLs des images sont complètes
            const firstItem = response[0];
            if (firstItem.poster && !firstItem.poster.startsWith('http')) {
              console.warn(`⚠️ URL d'image incomplète détectée: ${firstItem.poster}`);
              
              // Corriger les URLs des images
              response = fixImageUrls(response);
              
              console.log(`🔄 URLs d'images corrigées pour le contenu ${category}`);
            }
            
            endpointFound = true;
            return response;
          }
        } catch (endpointError: any) {
          console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
          continue;
        }
      }
      
      if (!endpointFound) {
        console.warn(`⚠️ Aucun endpoint API valide trouvé pour ${category}`);
        throw new Error(`Aucun endpoint API valide trouvé pour ${category}`);
      }
    }
    
    // Si le backend n'est pas disponible ou si aucun endpoint n'a fonctionné, utiliser les données locales
    throw new Error(`Backend indisponible pour récupérer les données de ${category}`);
  } catch (error) {
    console.error(`Erreur lors de la récupération des contenus pour ${category}:`, error);
    
    // Utiliser les données locales uniquement si elles existent
    if (localData[category] && localData[category].length > 0) {
      console.warn(`⚠️ Utilisation des données locales pour ${category} (solution de repli)`);
      return localData[category];
    }
    
    // Si aucune donnée locale n'est disponible, renvoyer un tableau vide
    console.error(`❌ Aucune donnée disponible pour ${category}`);
    return [];
  }
}

/**
 * Récupère les détails d'un contenu
 * @param contentId ID du contenu
 * @returns Promise<ContentDetail>
 */
export const getContentDetails = async (contentId: string): Promise<ContentDetail> => {
  try {
    if (!contentId) {
      throw new Error('ID de contenu non spécifié');
    }

    // Vérifier si le backend est disponible
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      console.log(`🔍 Récupération des détails du contenu: ${contentId}`);
      
      // Récupérer les détails depuis l'API
      const item = await apiRequest<ContentDetail>(`${API_URL}/content/${contentId}`, {}, 3);
      
      // Corriger les URLs des images si nécessaires
      if (item && item.poster && !item.poster.startsWith('http')) {
        console.warn(`⚠️ URL d'image incomplète détectée: ${item.poster}`);
        
        // Corriger l'URL de l'image principale
        item.poster = item.poster.startsWith('/') 
          ? `${CLOUDFRONT_DOMAIN}${item.poster}`
          : `${CLOUDFRONT_DOMAIN}/${item.poster}`;
        
        // Corriger les URLs des images dans la galerie
        if (item.gallery && item.gallery.length > 0) {
          item.gallery = item.gallery.map(img => {
            if (img && !img.startsWith('http')) {
              return img.startsWith('/') 
                ? `${CLOUDFRONT_DOMAIN}${img}`
                : `${CLOUDFRONT_DOMAIN}/${img}`;
            }
            return img;
          });
        }
      }
      
      return item;
    } else {
      console.warn('⚠️ Backend indisponible, utilisation des données locales');
      
      // Déterminer le type de contenu à partir de l'ID
      const sourcePrefix = contentId.split('-')[0];
      const contentType = determineContentTypeFromSource(sourcePrefix);
      
      if (contentType) {
        // Rechercher dans les données locales
        const allItems = localData[contentType];
        const item = allItems.find(item => item.id === contentId);
        
        if (item) {
          // Créer un objet ContentDetail à partir de l'item trouvé
          return {
            ...item,
            description: `Description de ${item.title}`,
            synopsis: `Synopsis de ${item.title}`,
            genres: ['Genre 1', 'Genre 2'],
            tags: ['Tag 1', 'Tag 2'],
            actors: ['Acteur 1', 'Acteur 2'],
            streaming_urls: [],
            trailers: [],
            images: [],
            subtitles: [],
            url: `https://flodrama.surge.sh/content/${contentType}/${item.id}`
          };
        }
      }
      
      // Si aucun contenu local n'est trouvé, essayer les données mockées
      const mockDetail = getMockContentDetail(contentId);
      if (mockDetail) {
        return mockDetail;
      }
      
      // Si aucune donnée n'est disponible, créer un objet vide
      return createEmptyContentDetail(contentId);
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du contenu:`, error);
    
    // En cas d'erreur, créer un objet vide
    return createEmptyContentDetail(contentId);
  }
};

/**
 * Détermine le type de contenu à partir de la source
 * @param source Nom de la source (ex: 'dramacool', 'viki', etc.)
 * @returns ContentType ou undefined si la source n'est pas reconnue
 */
function determineContentTypeFromSource(source: string): ContentType | undefined {
  // Sources de dramas
  if (['dramacool', 'viki', 'kocowa', 'iqiyi', 'wetv', 'myasiantv', 'voirdrama', 'vostfree'].includes(source)) {
    return 'drama';
  }
  
  // Sources d'animes
  if (['gogoanime', 'neko-sama', 'voiranime'].includes(source)) {
    return 'anime';
  }
  
  // Sources de films
  if (['allocine', 'imdb', 'themoviedb', 'cinepulse', 'dpstream'].includes(source)) {
    return 'film';
  }
  
  // Sources de bollywood
  if (['bollywoodmdb', 'hotstar', 'zee5'].includes(source)) {
    return 'bollywood';
  }
  
  // Si la source n'est pas reconnue, essayer de deviner à partir du préfixe
  if (source.includes('drama')) return 'drama';
  if (source.includes('anime')) return 'anime';
  if (source.includes('film') || source.includes('movie')) return 'film';
  if (source.includes('bolly')) return 'bollywood';
  
  // Si impossible de déterminer, retourner undefined
  return undefined;
}

/**
 * Récupère les carrousels pour la page d'accueil
 * @returns Liste des carrousels configurés
 */
export async function getCarousels(): Promise<Record<string, Carousel>> {
  try {
    // Vérifier si le backend est disponible
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      console.log('🔍 Récupération des carrousels depuis l\'API');
      
      try {
        // Récupérer les carrousels depuis l'API
        const response = await axios.get(`${API_URL}/carousels`, {
          timeout: 5000,
          validateStatus: (status: number) => status === 200
        });
        
        if (response.status === 200 && response.data) {
          console.log('✅ Carrousels récupérés depuis l\'API');
          
          // Traiter les données reçues
          const carouselsData = response.data;
          const carousels: Record<string, Carousel> = {};
          
          // Parcourir les carrousels et corriger les URLs des images
          for (const key in carouselsData) {
            if (Object.prototype.hasOwnProperty.call(carouselsData, key)) {
              const carousel = carouselsData[key as keyof typeof carouselsData];
              
              // Créer un carousel correctement typé
              carousels[key] = {
                title: carousel.title,
                type: carousel.type,
                items: fixImageUrls(carousel.items)
              };
            }
          }
          
          return carousels;
        }
      } catch (apiError) {
        console.warn('⚠️ Erreur lors de la récupération des carrousels depuis l\'API:', apiError);
      }
    }
    
    // Si le backend est indisponible ou si la requête a échoué, utiliser les données locales
    console.warn('⚠️ Utilisation des données locales pour les carrousels (solution de repli)');
    
    // Créer les carrousels à partir des données locales
    const carousels: Record<string, Carousel> = {
      featured: createCarousel('À découvrir', 'featured', localData.drama.slice(0, 5)),
      trending: createCarousel('Tendances', 'trending', localData.anime.slice(0, 5)),
      new_releases: createCarousel('Nouveautés', 'new_releases', localData.film.slice(0, 5)),
      popular: createCarousel('Populaires', 'popular', localData.bollywood.slice(0, 5))
    };
    
    return carousels;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des carrousels:', error);
    
    // En cas d'erreur, renvoyer un objet vide
    return {};
  }
}

/**
 * Fonction helper pour créer un carousel correctement typé
 */
function createCarousel(title: string, type: string, items: any[]): Carousel {
  // S'assurer que les items sont au format ContentItem
  const contentItems = items.map(item => {
    // Vérifier si l'item a déjà le format ContentItem
    if (item.id && item.title && item.poster) {
      return item as ContentItem;
    }
    
    // Sinon, convertir l'item au format ContentItem
    return {
      id: item.id || `item-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title || 'Sans titre',
      original_title: item.original_title || '',
      poster: item.poster || item.image || 'https://via.placeholder.com/300x450?text=No+Image',
      year: item.year || new Date().getFullYear(),
      rating: item.rating || 0,
      language: item.language || 'fr',
      type: item.type || type
    } as ContentItem;
  });
  
  return {
    title,
    type,
    items: contentItems
  };
}

/**
 * Récupère les bannières pour le composant HeroBanner
 * @returns Liste des bannières à afficher
 */
export async function getHeroBanners(): Promise<HeroBanner> {
  try {
    // Vérifier si le backend est disponible
    const backendAvailable = await checkBackendAvailability();
    
    if (backendAvailable) {
      console.log('🔍 Récupération des bannières depuis l\'API...');
      
      // Essayer plusieurs variantes de chemins d'API possibles
      const possibleEndpoints = [
        '/hero_banners',
        '/hero-banners',
        '/banners'
      ];
      
      let response: any = null;
      let endpointFound = false;
      
      // Essayer chaque endpoint jusqu'à ce qu'un fonctionne
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Tentative avec l'endpoint: ${endpoint}`);
          response = await apiRequest<any>(`${API_URL}${endpoint}`, {
            timeout: 5000,
            validateStatus: (status: number) => status >= 200 && status < 300
          });
          
          // Vérifier si les données reçues sont valides
          if (response && response.banners && Array.isArray(response.banners)) {
            console.log(`✅ Endpoint trouvé: ${endpoint}`);
            console.log(`📊 Bannières reçues: ${response.banners.length} éléments`);
            
            // Vérifier si les URLs des images sont complètes
            if (response.banners.length > 0) {
              const firstItem = response.banners[0];
              if (firstItem.poster && !firstItem.poster.startsWith('http')) {
                console.warn(`⚠️ URL d'image incomplète détectée: ${firstItem.poster}`);
                
                // Corriger les URLs des images
                response.banners = fixImageUrls(response.banners);
                
                console.log('🔄 URLs d\'images corrigées pour les bannières');
              }
            }
            
            endpointFound = true;
            return response as HeroBanner;
          }
        } catch (endpointError: any) {
          console.warn(`⚠️ Échec avec l'endpoint ${endpoint}: ${endpointError.message || 'Erreur inconnue'}`);
          continue;
        }
      }
      
      if (!endpointFound) {
        console.warn('⚠️ Aucun endpoint API valide trouvé pour les bannières');
        throw new Error('Aucun endpoint API valide trouvé pour les bannières');
      }
    }
    
    // Si le backend n'est pas disponible, lancer une erreur
    throw new Error('Backend indisponible pour récupérer les bannières');
  } catch (error) {
    console.error('Erreur lors de la récupération des bannières:', error);
    
    // Utiliser les données locales uniquement si elles existent
    if (heroBannersData && heroBannersData.banners && heroBannersData.banners.length > 0) {
      console.warn('⚠️ Utilisation des données locales pour les bannières (solution de repli)');
      const banners = fixImageUrls(heroBannersData.banners);
      return { banners } as HeroBanner;
    }
    
    // Si aucune donnée locale n'est disponible, renvoyer un objet avec un tableau vide
    console.error('❌ Aucune donnée disponible pour les bannières');
    return { banners: [] };
  }
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
    // En production avec connexion, utiliser l'API
    const response = await apiRequest<SearchResponse>(`${API_URL}/search`, {}, 3);
    return response;
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
    // En production, utiliser l'API
    const response = await apiRequest<ContentRequest>(`${API_URL}/content-request/${requestId}`, {}, 3);
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
    // En production, utiliser l'API
    const response = await apiRequest<any[]>(`${API_URL}/notifications/${userId}`, {}, 3);
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
    // En production, utiliser l'API
    await apiRequest(`${API_URL}/notifications/${notificationId}/read`, {}, 3);
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
    // En production, utiliser l'API
    const response = await apiRequest<ContentItem[]>(`${API_URL}/recommendations/${userId}`, {}, 3);
    return response;
  } catch (error) {
    console.error(`Erreur lors de la récupération des recommandations:`, error)
    
    // Fallback sur les contenus populaires
    const popularItems: ContentItem[] = []
    const types: ContentType[] = ['drama', 'anime', 'bollywood', 'film']
    
    // Récupérer quelques éléments populaires de chaque type
    for (const type of types) {
      // Utiliser une assertion de type pour éviter l'erreur de typage
      const typeItems = mockData[type as keyof typeof mockData] || [];
      popularItems.push(...typeItems.slice(0, 1))
    }
    
    return popularItems
  }
}

/**
 * Alias pour la compatibilité avec les composants existants
 */
export const getCategoryContent = getContentsByCategory;
export const getContentDetail = getContentDetails;
