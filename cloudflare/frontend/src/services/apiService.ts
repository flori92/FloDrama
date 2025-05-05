/**
 * Service API pour FloDrama
 * 
 * Ce fichier contient les fonctions pour interagir avec l'API backend
 * de FloDrama hébergée sur Cloudflare Workers.
 */

// Constantes pour l'API
const API_BASE_URL = process.env.VITE_API_URL || 'https://flodrama-api.florifavi.workers.dev';
const CDN_BASE_URL = 'https://customer-ehlynuge6dnzfnfd.cloudflarestream.com';

// Types de contenu
export type ContentType = 'film' | 'drama' | 'anime' | 'bollywood';

// Interface pour les items de contenu
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  releaseDate: string;
  rating: number;
  duration: number;
  trailerUrl?: string;
  videoId?: string; // ID de la vidéo pour la lecture
  category?: string;
  genres?: string[];
  episodeCount?: number;
  seasonCount?: number;
  language?: string;
  country?: string;
  status?: 'ongoing' | 'completed' | 'upcoming';
}

// Fonction fetch avec gestion d'erreur
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
}

// Fonctions API pour les différentes catégories
export async function fetchDramas(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/dramas?${params}`);
}

export async function fetchFilms(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/films?${params}`);
}

export async function fetchAnimes(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/animes?${params}`);
}

export async function fetchBollywood(page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (year) {
    params.append('year', year);
  }
  
  return fetchWithErrorHandling(`${API_BASE_URL}/bollywood?${params}`);
}

// Fonction pour récupérer un contenu spécifique
export async function fetchContentById(id: string): Promise<ContentItem> {
  return fetchWithErrorHandling(`${API_BASE_URL}/content/${id}`);
}

// Fonction pour récupérer le contenu par catégorie
export async function fetchContentByCategory(category: ContentType, page = 1, limit = 20, year?: string): Promise<ContentItem[]> {
  switch (category) {
    case 'drama':
      return fetchDramas(page, limit, year);
    case 'film':
      return fetchFilms(page, limit, year);
    case 'anime':
      return fetchAnimes(page, limit, year);
    case 'bollywood':
      return fetchBollywood(page, limit, year);
    default:
      throw new Error(`Catégorie non supportée: ${category}`);
  }
}

// Fonction pour récupérer l'URL de streaming
export function getStreamUrl(videoId: string) {
  return `${CDN_BASE_URL}/${videoId}/manifest/video.m3u8`;
}

// Fonction pour récupérer l'URL de la miniature
export function getThumbnailUrl(videoId: string, time = '0s') {
  return `${CDN_BASE_URL}/${videoId}/thumbnails/thumbnail.jpg?time=${time}`;
}

// Fonction pour vérifier l'état de l'API
export async function checkApiStatus(): Promise<{ status: string; version: string; environment: string }> {
  return fetchWithErrorHandling(`${API_BASE_URL}/`);
}

/**
 * Récupère le contenu mis en avant pour le Hero Banner
 * @returns Liste des contenus mis en avant
 */
export async function fetchFeaturedContent(): Promise<ContentItem[]> {
  try {
    // Dans un environnement de production, vous feriez une requête API
    // Pour l'instant, nous simulons une réponse avec des données de démonstration
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'solo-leveling',
        title: 'Solo Leveling',
        description: 'Dans un monde où des chasseurs dotés de pouvoirs magiques combattent des monstres mortels, Sung Jinwoo, le chasseur le plus faible de l\'humanité, se trouve soudainement doté d\'un pouvoir mystérieux qui lui permet de monter en niveau sans limite.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1823/132329.jpg',
        releaseDate: '2024-01-06',
        rating: 8.7,
        duration: 24,
        genres: ['Action', 'Aventure', 'Fantastique'],
        trailerUrl: 'https://www.youtube.com/embed/jn1UH3U4Xz0?autoplay=1&controls=0&showinfo=0&mute=1',
        videoId: 'solo-leveling-ep1',
        category: 'anime'
      },
      {
        id: 'moving',
        title: 'Moving',
        description: 'Des lycéens dotés de superpouvoirs tentent de mener une vie normale tout en cachant leurs capacités au monde. Pendant ce temps, leurs parents, qui ont également des pouvoirs, font face à leur propre passé.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjRkMDEwYTQtNTcwMC00YzFiLWJiYmQtODM0MjE5YjBlNjYyXkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_.jpg',
        releaseDate: '2023-08-09',
        rating: 8.5,
        duration: 60,
        genres: ['Action', 'Drame', 'Fantastique'],
        trailerUrl: 'https://www.youtube.com/embed/oJP95ASe6G8?autoplay=1&controls=0&showinfo=0&mute=1',
        videoId: 'moving-ep1',
        category: 'drama'
      },
      {
        id: 'jujutsu-kaisen',
        title: 'Jujutsu Kaisen',
        description: 'Yuji Itadori, un lycéen ordinaire, se retrouve plongé dans un monde d\'exorcistes et de malédictions après avoir ingéré un doigt maudit.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        releaseDate: '2020-10-03',
        rating: 8.8,
        duration: 24,
        genres: ['Action', 'Surnaturel', 'École'],
        trailerUrl: 'https://www.youtube.com/embed/4A_X-Dvl0ws?autoplay=1&controls=0&showinfo=0&mute=1',
        videoId: 'jujutsu-kaisen-ep1',
        category: 'anime'
      },
      {
        id: 'queen-of-tears',
        title: 'Queen of Tears',
        description: 'L\'histoire d\'amour entre Baek Hyun-woo, directeur juridique du groupe Queens, et Hong Hae-in, héritière du conglomérat Queens et surnommée la "reine" du centre commercial.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTQxOGExZTQtMDcyOC00MmE1LWIyZGQtYzRhMjBiYjRmNDI2XkEyXkFqcGdeQXVyMTMxMTgyMzU4._V1_.jpg',
        releaseDate: '2024-03-09',
        rating: 8.9,
        duration: 70,
        genres: ['Romance', 'Drame', 'Comédie'],
        videoId: 'queen-of-tears-ep1',
        category: 'drama'
      }
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu mis en avant:', error);
    return [];
  }
}

/**
 * Récupère le contenu récent pour les grilles de contenu
 * @returns Liste des contenus récents
 */
export async function fetchRecentContent(): Promise<ContentItem[]> {
  try {
    // Dans un environnement de production, vous feriez une requête API
    // Pour l'instant, nous simulons une réponse avec des données de démonstration
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        id: 'solo-leveling',
        title: 'Solo Leveling',
        description: 'Dans un monde où des chasseurs dotés de pouvoirs magiques combattent des monstres mortels, Sung Jinwoo, le chasseur le plus faible de l\'humanité, se trouve soudainement doté d\'un pouvoir mystérieux qui lui permet de monter en niveau sans limite.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1823/132329.jpg',
        releaseDate: '2024-01-06',
        rating: 8.7,
        duration: 24,
        genres: ['Action', 'Aventure', 'Fantastique'],
        videoId: 'solo-leveling-ep1',
        category: 'anime'
      },
      {
        id: 'moving',
        title: 'Moving',
        description: 'Des lycéens dotés de superpouvoirs tentent de mener une vie normale tout en cachant leurs capacités au monde. Pendant ce temps, leurs parents, qui ont également des pouvoirs, font face à leur propre passé.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BZjRkMDEwYTQtNTcwMC00YzFiLWJiYmQtODM0MjE5YjBlNjYyXkEyXkFqcGdeQXVyMTEzMTI1Mjk3._V1_.jpg',
        releaseDate: '2023-08-09',
        rating: 8.5,
        duration: 60,
        genres: ['Action', 'Drame', 'Fantastique'],
        videoId: 'moving-ep1',
        category: 'drama'
      },
      {
        id: 'demon-slayer',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        description: 'Tanjiro Kamado et ses amis du Corps des Pourfendeurs de démons poursuivent leur mission de protection de l\'humanité contre les démons qui menacent de détruire la race humaine.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        releaseDate: '2019-04-06',
        rating: 8.9,
        duration: 24,
        genres: ['Action', 'Fantastique', 'Historique'],
        videoId: 'demon-slayer-ep1',
        category: 'anime'
      },
      {
        id: 'jujutsu-kaisen',
        title: 'Jujutsu Kaisen',
        description: 'Yuji Itadori, un lycéen ordinaire, se retrouve plongé dans un monde d\'exorcistes et de malédictions après avoir ingéré un doigt maudit.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        releaseDate: '2020-10-03',
        rating: 8.8,
        duration: 24,
        genres: ['Action', 'Surnaturel', 'École'],
        videoId: 'jujutsu-kaisen-ep1',
        category: 'anime'
      },
      {
        id: 'queen-of-tears',
        title: 'Queen of Tears',
        description: 'L\'histoire d\'amour entre Baek Hyun-woo, directeur juridique du groupe Queens, et Hong Hae-in, héritière du conglomérat Queens et surnommée la "reine" du centre commercial.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BYTQxOGExZTQtMDcyOC00MmE1LWIyZGQtYzRhMjBiYjRmNDI2XkEyXkFqcGdeQXVyMTMxMTgyMzU4._V1_.jpg',
        releaseDate: '2024-03-09',
        rating: 8.9,
        duration: 70,
        genres: ['Romance', 'Drame', 'Comédie'],
        videoId: 'queen-of-tears-ep1',
        category: 'drama'
      },
      {
        id: 'lovely-runner',
        title: 'Lovely Runner',
        description: 'Im Sol, une fan dévouée de l\'idole Ryu Sun-jae, voyage dans le temps pour empêcher sa mort tragique et changer son destin.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BOTc5MzlhMGEtNTI3ZS00NzRiLWI1MDAtZDdkMzRjM2VkMGE2XkEyXkFqcGdeQXVyMTMxMTgyMzU4._V1_.jpg',
        releaseDate: '2024-04-08',
        rating: 8.7,
        duration: 70,
        genres: ['Romance', 'Fantastique', 'Drame'],
        videoId: 'lovely-runner-ep1',
        category: 'drama'
      },
      {
        id: 'attack-on-titan',
        title: 'Attack on Titan',
        description: 'Dans un monde où l\'humanité vit entourée d\'immenses murs pour se protéger des Titans, des êtres gigantesques qui dévorent les humains, Eren Yeager jure de se venger après que sa ville natale ait été détruite et sa mère tuée.',
        posterUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
        releaseDate: '2013-04-07',
        rating: 9.0,
        duration: 24,
        genres: ['Action', 'Drame', 'Fantastique'],
        videoId: 'attack-on-titan-ep1',
        category: 'anime'
      },
      {
        id: 'crash-landing-on-you',
        title: 'Crash Landing on You',
        description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente et tombe amoureuse d\'un officier de l\'armée nord-coréenne.',
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzRiZWUyN2YtNDI4YS00NTg2LTg0OTgtMGI2ZjU4ODQ4Yjk3XkEyXkFqcGdeQXVyNTI5NjIyMw@@._V1_.jpg',
        releaseDate: '2019-12-14',
        rating: 8.8,
        duration: 70,
        genres: ['Romance', 'Comédie', 'Drame'],
        videoId: 'crash-landing-on-you-ep1',
        category: 'drama'
      }
    ];
  } catch (error) {
    console.error('Erreur lors de la récupération du contenu récent:', error);
    return [];
  }
}
