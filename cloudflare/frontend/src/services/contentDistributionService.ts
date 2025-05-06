/**
 * Service de distribution de contenu pour FloDrama
 * 
 * Ce service gère la récupération et l'optimisation des contenus depuis Cloudflare D1
 * pour les afficher dans l'interface utilisateur de FloDrama.
 */

import { ContentItem } from '../types/content';

// URL de l'API Cloudflare Workers
const API_BASE_URL = 'https://flodrama-api.florifavi.workers.dev';

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
    
    // Faire la requête à l'API
    const response = await fetch(`${API_BASE_URL}/hero-banner?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    return optimizeContentItems(data);
  } catch (error) {
    console.error('Erreur lors de la récupération du hero banner:', error);
    return getFallbackHeroBannerContent();
  }
}

/**
 * Récupère les contenus pour un carrousel spécifique
 * @param options Options de configuration du carrousel
 * @returns Liste des contenus pour le carrousel
 */
export async function getCarouselContent(options: CarouselOptions): Promise<{title: string, items: ContentItem[]}> {
  const {
    title,
    contentType,
    genre,
    year,
    sortBy = 'rating',
    limit = 20
  } = options;

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
    
    // Convertir le tri en format API
    let sortParam = '';
    switch (sortBy) {
      case 'rating':
        sortParam = 'rating:desc';
        break;
      case 'release_date':
        sortParam = 'release_date:desc';
        break;
      case 'popularity':
        sortParam = 'popularity:desc';
        break;
      case 'recently_added':
        sortParam = 'created_at:desc';
        break;
      default:
        sortParam = 'rating:desc';
    }
    
    params.append('sort', sortParam);
    
    // Faire la requête à l'API
    const response = await fetch(`${API_BASE_URL}/content?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    return {
      title,
      items: optimizeContentItems(data)
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du carrousel "${title}":`, error);
    return {
      title,
      items: getFallbackCarouselContent(contentType ?? 'mixed', limit)
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
  try {
    // Récupérer le hero banner
    const heroBanner = await getHeroBannerContent();
    
    // Récupérer les carrousels en parallèle
    const carouselsPromises = [
      getCarouselContent({
        title: 'Tendances',
        sortBy: 'popularity',
        limit: 20
      }),
      getCarouselContent({
        title: 'Dramas Coréens',
        contentType: CONTENT_TYPES.DRAMA,
        genre: 'Korean',
        sortBy: 'rating',
        limit: 20
      }),
      getCarouselContent({
        title: 'Animes Populaires',
        contentType: CONTENT_TYPES.ANIME,
        sortBy: 'rating',
        limit: 20
      }),
      getCarouselContent({
        title: 'Films Récents',
        contentType: CONTENT_TYPES.MOVIE,
        sortBy: 'release_date',
        limit: 20
      }),
      getCarouselContent({
        title: 'Bollywood',
        contentType: CONTENT_TYPES.BOLLYWOOD,
        sortBy: 'rating',
        limit: 20
      }),
      getCarouselContent({
        title: 'Ajoutés Récemment',
        sortBy: 'recently_added',
        limit: 20
      })
    ];
    
    const carousels = await Promise.all(carouselsPromises);
    
    return {
      heroBanner,
      carousels
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu de la page d\'accueil:', error);
    
    // Retourner des données de secours
    return {
      heroBanner: getFallbackHeroBannerContent(),
      carousels: [
        {
          title: 'Tendances',
          items: getFallbackCarouselContent('mixed', 20)
        },
        {
          title: 'Dramas Coréens',
          items: getFallbackCarouselContent(CONTENT_TYPES.DRAMA, 20)
        },
        {
          title: 'Animes Populaires',
          items: getFallbackCarouselContent(CONTENT_TYPES.ANIME, 20)
        },
        {
          title: 'Films Récents',
          items: getFallbackCarouselContent(CONTENT_TYPES.MOVIE, 20)
        },
        {
          title: 'Bollywood',
          items: getFallbackCarouselContent(CONTENT_TYPES.BOLLYWOOD, 20)
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
  try {
    // Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    
    // Ajouter les paramètres de pagination
    queryParams.append('page', (params.page || 1).toString());
    queryParams.append('limit', (params.limit || 24).toString());
    
    // Ajouter les filtres
    if (params.year) {
      queryParams.append('year', params.year.toString());
    }
    
    if (params.genre) {
      queryParams.append('genre', params.genre);
    }
    
    if (params.language) {
      queryParams.append('language', params.language);
    }
    
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    
    if (params.rating_min) {
      queryParams.append('rating_min', params.rating_min.toString());
    }
    
    // Faire la requête à l'API
    const response = await fetch(`${API_BASE_URL}/content/${contentType}?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    return optimizeContentItems(data);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la catégorie ${contentType}:`, error);
    return getFallbackCarouselContent(contentType, params.limit || 24);
  }
}

/**
 * Récupère les détails d'un contenu spécifique
 * @param contentId Identifiant du contenu
 * @returns Détails du contenu
 */
export async function getContentDetails(contentId: string): Promise<ContentItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/content/details/${contentId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Optimiser les URLs des images
    return optimizeContentItem(data);
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du contenu ${contentId}:`, error);
    return null;
  }
}

/**
 * Optimise les URLs des images pour un élément de contenu
 * @param item Élément de contenu à optimiser
 * @returns Élément de contenu optimisé
 */
function optimizeContentItem(item: ContentItem): ContentItem {
  // Copier l'élément pour éviter de modifier l'original
  const optimizedItem = { ...item };
  
  // Vérifier et corriger les URLs des images
  if (optimizedItem.posterUrl && !optimizedItem.posterUrl.startsWith('http')) {
    optimizedItem.posterUrl = `https://d1gmx0yvfpqbgd.cloudfront.net${optimizedItem.posterUrl}`;
  }
  
  if (optimizedItem.backdrop && !optimizedItem.backdrop.startsWith('http')) {
    optimizedItem.backdrop = `https://d1gmx0yvfpqbgd.cloudfront.net${optimizedItem.backdrop}`;
  }
  
  // Vérifier et corriger les URLs des vidéos
  if (optimizedItem.trailerUrl && !optimizedItem.trailerUrl.startsWith('http')) {
    optimizedItem.trailerUrl = `https://customer-ehlynuge6dnzfnfd.cloudflarestream.com${optimizedItem.trailerUrl}`;
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
      posterUrl: 'https://d1gmx0yvfpqbgd.cloudfront.net/posters/drama/crash_landing_on_you.jpg',
      backdrop: 'https://d1gmx0yvfpqbgd.cloudfront.net/backdrops/drama/crash_landing_on_you_backdrop.jpg',
      releaseDate: '2019-12-14',
      rating: 9.2,
      duration: 60,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/trailers/crash_landing_on_you_trailer.mp4',
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
      posterUrl: 'https://d1gmx0yvfpqbgd.cloudfront.net/posters/anime/demon_slayer.jpg',
      backdrop: 'https://d1gmx0yvfpqbgd.cloudfront.net/backdrops/anime/demon_slayer_backdrop.jpg',
      releaseDate: '2020-10-16',
      rating: 8.9,
      duration: 117,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/trailers/demon_slayer_trailer.mp4',
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
      posterUrl: 'https://d1gmx0yvfpqbgd.cloudfront.net/posters/movie/parasite.jpg',
      backdrop: 'https://d1gmx0yvfpqbgd.cloudfront.net/backdrops/movie/parasite_backdrop.jpg',
      releaseDate: '2019-05-30',
      rating: 8.6,
      duration: 132,
      trailerUrl: 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com/trailers/parasite_trailer.mp4',
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
 * @param contentType Type de contenu (drama, anime, movie, bollywood, mixed)
 * @param limit Nombre d'éléments à générer
 * @returns Liste de contenus pour le carrousel
 */
function getFallbackCarouselContent(contentType: string, limit: number = 20): ContentItem[] {
  // Pour l'exemple, nous retournons un tableau vide
  // Dans une implémentation réelle, nous retournerions des données de secours
  return [];
}

/**
 * Récupère les genres disponibles pour un type de contenu
 * @param contentType Type de contenu (drama, anime, movie, bollywood)
 * @returns Liste des genres disponibles
 */
export async function getAvailableGenres(contentType?: string): Promise<string[]> {
  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    const response = await fetch(`${API_BASE_URL}/genres?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des genres:', error);
    
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
  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    const response = await fetch(`${API_BASE_URL}/languages?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des langues:', error);
    
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
  try {
    const params = new URLSearchParams();
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    const response = await fetch(`${API_BASE_URL}/years?${params}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des années:', error);
    
    // Retourner des années par défaut (de 2010 à l'année actuelle)
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2010 + 1 }, (_, i) => currentYear - i);
  }
}
