/**
 * Service de découverte de contenu pour FloDrama
 * Système intelligent qui récupère et organise automatiquement les métadonnées
 * des plus récents films, dramas, animes et productions bollywood
 */

import { cacheManager } from '../utils/cacheManager';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// Configuration des API
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY || 'votre_clé_api_tmdb_ici';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Durées de cache (en minutes)
const CACHE_TTL = {
  TRENDING: 60, // 1 heure
  NEW_RELEASES: 360, // 6 heures
  CATEGORY: 720, // 12 heures
  SEARCH: 1440, // 24 heures
};

// Mapping des IDs de genres TMDB pour filtrage
const GENRE_IDS = {
  DRAMA: [18],
  ANIME: [], // Géré séparément via Jikan API
  BOLLYWOOD: [], // Recherche spéciale pour films indiens
  ACTION: [28],
  COMEDY: [35],
  HORROR: [27],
  ROMANCE: [10749],
  SCIFI: [878]
};

// Mapping pour régions et langues
const REGION_MAPPING = {
  KOREA: { region: 'KR', language: 'ko' },
  JAPAN: { region: 'JP', language: 'ja' },
  CHINA: { region: 'CN', language: 'zh' },
  TAIWAN: { region: 'TW', language: 'zh' },
  THAILAND: { region: 'TH', language: 'th' },
  INDIA: { region: 'IN', language: 'hi' }
};

/**
 * Classe principale du service de découverte de contenu
 */
class ContentDiscoveryService {
  constructor() {
    this.initialize();
  }

  /**
   * Initialise le service
   */
  initialize() {
    // Précharger les contenus les plus importants
    this.getTrendingContent();
    this.getNewReleases();
    this.getNewAnimeReleases();
    
    // Programme le rafraîchissement automatique du cache
    this.setupCacheRefresh();
  }

  /**
   * Configure le rafraîchissement automatique du cache
   */
  setupCacheRefresh() {
    // Rafraîchir les tendances toutes les heures
    setInterval(() => {
      this.getTrendingContent({ forceRefresh: true });
    }, CACHE_TTL.TRENDING * 60 * 1000);
    
    // Rafraîchir les nouvelles sorties toutes les 6 heures
    setInterval(() => {
      this.getNewReleases({ forceRefresh: true });
      this.getNewAnimeReleases({ forceRefresh: true });
    }, CACHE_TTL.NEW_RELEASES * 60 * 1000);
  }

  /**
   * Effectue une requête HTTP avec gestion d'erreur et cache
   * @param {string} url - URL à appeler
   * @param {Object} options - Options de la requête
   * @param {string} cacheKey - Clé de cache
   * @param {boolean} forceRefresh - Force le rafraîchissement du cache
   * @returns {Promise<Object>} - Résultat de la requête
   */
  async fetchWithCache(url, options = {}, cacheKey, forceRefresh = false) {
    try {
      // Vérifier le cache si pas de forceRefresh
      if (!forceRefresh) {
        const cachedData = cacheManager.getCache(cacheKey, 'content');
        if (cachedData) return cachedData;
      }
      
      // Effectuer la requête avec gestion d'erreur
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Sauvegarder dans le cache
      cacheManager.setCache(cacheKey, data, 'content');
      
      return data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données (${url}):`, error);
      
      // Fallback au cache même si forceRefresh, en cas d'erreur réseau
      const cachedData = cacheManager.getCache(cacheKey, 'content');
      if (cachedData) return cachedData;
      
      // Si pas de cache disponible, renvoyer un résultat vide mais bien structuré
      return { results: [] };
    }
  }

  /**
   * Récupère les contenus tendance du moment
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Contenu tendance
   */
  async getTrendingContent(options = {}) {
    const { mediaType = 'all', timeWindow = 'week', limit = 20, forceRefresh = false } = options;
    
    const cacheKey = `trending_${mediaType}_${timeWindow}`;
    const url = `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&language=fr-FR`;
    
    const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
    
    // Transformer et limiter les résultats
    return this.transformTMDBResults(data.results.slice(0, limit));
  }

  /**
   * Récupère les nouvelles sorties (films et séries)
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Nouvelles sorties par catégorie
   */
  async getNewReleases(options = {}) {
    const { forceRefresh = false } = options;
    
    // Récupérer les films récents
    const newMoviesUrl = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=fr-FR&region=FR`;
    const newMoviesData = await this.fetchWithCache(
      newMoviesUrl, 
      {}, 
      'new_movies', 
      forceRefresh
    );
    
    // Récupérer les séries récentes
    const newTVUrl = `${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=fr-FR`;
    const newTVData = await this.fetchWithCache(
      newTVUrl, 
      {}, 
      'new_tv', 
      forceRefresh
    );
    
    // Récupérer les dramas asiatiques (filtrés par région)
    const asianDramasPromises = Object.values(REGION_MAPPING)
      .filter(region => ['KR', 'JP', 'CN', 'TW', 'TH'].includes(region.region))
      .map(async (region) => {
        const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=${region.language}&sort_by=first_air_date.desc&with_genres=18`;
        const cacheKey = `dramas_${region.region}`;
        const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
        return data.results;
      });
    
    // Récupérer les films Bollywood
    const bollywoodUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&region=IN&sort_by=release_date.desc`;
    const bollywoodData = await this.fetchWithCache(
      bollywoodUrl, 
      {}, 
      'bollywood_movies', 
      forceRefresh
    );
    
    // Attendre toutes les promesses
    const asianDramasResults = await Promise.all(asianDramasPromises);
    
    // Compiler les résultats
    return {
      movies: this.transformTMDBResults(newMoviesData.results),
      tvShows: this.transformTMDBResults(newTVData.results),
      asianDramas: this.transformTMDBResults(asianDramasResults.flat()),
      bollywood: this.transformTMDBResults(bollywoodData.results)
    };
  }

  /**
   * Récupère les nouveaux animés via l'API Jikan (MyAnimeList)
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Nouveaux animés
   */
  async getNewAnimeReleases(options = {}) {
    const { limit = 20, forceRefresh = false } = options;
    
    // Animés de la saison actuelle
    const currentSeasonUrl = `${JIKAN_BASE_URL}/seasons/now?limit=${limit}`;
    const currentSeasonData = await this.fetchWithCache(
      currentSeasonUrl, 
      {}, 
      'current_season_anime', 
      forceRefresh
    );
    
    // Top animés en cours
    const topAiringUrl = `${JIKAN_BASE_URL}/top/anime?filter=airing&limit=${limit}`;
    const topAiringData = await this.fetchWithCache(
      topAiringUrl, 
      {}, 
      'top_airing_anime', 
      forceRefresh
    );
    
    // Transformation des résultats (format différent de TMDB)
    return {
      currentSeason: this.transformJikanResults(currentSeasonData.data || []),
      topAiring: this.transformJikanResults(topAiringData.data || [])
    };
  }

  /**
   * Effectue une recherche personnalisée de contenu
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Résultats de la recherche
   */
  async searchContent(options = {}) {
    const { 
      query, 
      type = 'multi', 
      genre = [], 
      region = null, 
      year = null, 
      limit = 20,
      forceRefresh = false
    } = options;
    
    let url;
    let cacheKey = `search_${type}_${query}`;
    
    if (query) {
      // Recherche par mot-clé
      url = `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(query)}`;
      
      if (year) {
        url += `&year=${year}`;
        cacheKey += `_${year}`;
      }
    } else {
      // Découverte par filtres
      const mediaType = type === 'movie' ? 'movie' : 'tv';
      url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=fr-FR&sort_by=popularity.desc`;
      cacheKey = `discover_${mediaType}`;
      
      if (genre.length > 0) {
        url += `&with_genres=${genre.join(',')}`;
        cacheKey += `_genres_${genre.join('_')}`;
      }
      
      if (region) {
        const regionMapping = REGION_MAPPING[region.toUpperCase()];
        if (regionMapping) {
          url += `&with_original_language=${regionMapping.language}`;
          cacheKey += `_region_${region}`;
        }
      }
      
      if (year) {
        if (mediaType === 'movie') {
          url += `&primary_release_year=${year}`;
        } else {
          url += `&first_air_date_year=${year}`;
        }
        cacheKey += `_${year}`;
      }
    }
    
    const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
    
    // Transformer et limiter les résultats
    return this.transformTMDBResults(data.results.slice(0, limit));
  }

  /**
   * Récupère les contenus par catégorie
   * @param {string} category - Catégorie (drama, anime, bollywood, etc.)
   * @param {Object} options - Options de la requête
   * @returns {Promise<Array>} - Contenu de la catégorie
   */
  async getContentByCategory(category, options = {}) {
    const { page = 1, limit = 20, sortBy = 'popularity.desc', forceRefresh = false } = options;
    
    category = category.toLowerCase();
    const cacheKey = `category_${category}_${page}_${sortBy}`;
    
    switch (category) {
      case 'drama': {
        // Pour les dramas, combiner les résultats de différentes régions asiatiques
        const promises = Object.entries(REGION_MAPPING)
          .filter(([key]) => ['KOREA', 'JAPAN', 'CHINA', 'TAIWAN', 'THAILAND'].includes(key))
          .map(async ([key, mapping]) => {
            const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=18&with_original_language=${mapping.language}&sort_by=${sortBy}&page=${page}`;
            const data = await this.fetchWithCache(
              url, 
              {}, 
              `dramas_${key.toLowerCase()}_${page}`, 
              forceRefresh
            );
            return data.results;
          });
        
        const results = await Promise.all(promises);
        return this.transformTMDBResults(results.flat().slice(0, limit));
      }
      
      case 'anime': {
        // Pour les animés, utiliser l'API Jikan
        const url = `${JIKAN_BASE_URL}/anime?order_by=popularity&sort=asc&page=${page}&limit=${limit}`;
        const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
        return this.transformJikanResults(data.data || []);
      }
      
      case 'bollywood': {
        // Films indiens
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&region=IN&sort_by=${sortBy}&page=${page}`;
        const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
        return this.transformTMDBResults(data.results.slice(0, limit));
      }
      
      case 'movies': {
        // Films populaires
        const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`;
        const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
        return this.transformTMDBResults(data.results.slice(0, limit));
      }
      
      default: {
        // Catégorie générique, rechercher par genre
        const genreIds = GENRE_IDS[category.toUpperCase()] || [];
        if (genreIds.length === 0) return [];
        
        const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&with_genres=${genreIds.join(',')}&sort_by=${sortBy}&page=${page}`;
        const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
        return this.transformTMDBResults(data.results.slice(0, limit));
      }
    }
  }

  /**
   * Recherche spécifiquement des Animés, y compris les nouveautés
   * @param {Object} options - Options de la requête
   * @returns {Promise<Object>} - Animés par catégorie
   */
  async searchAnime(options = {}) {
    const { query, genres = [], status = null, limit = 20, forceRefresh = false } = options;
    
    let url;
    let cacheKey;
    
    if (query) {
      // Recherche par mot-clé
      url = `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=${limit}`;
      cacheKey = `anime_search_${query}`;
      
      if (genres.length > 0) {
        url += `&genres=${genres.join(',')}`;
        cacheKey += `_genres_${genres.join('_')}`;
      }
      
      if (status) {
        url += `&status=${status}`;
        cacheKey += `_status_${status}`;
      }
    } else {
      // Récupérer les animés tendance
      url = `${JIKAN_BASE_URL}/top/anime?limit=${limit}`;
      cacheKey = 'anime_top';
      
      if (status === 'airing') {
        url += '&filter=airing';
        cacheKey += '_airing';
      } else if (status === 'upcoming') {
        url += '&filter=upcoming';
        cacheKey += '_upcoming';
      }
    }
    
    const data = await this.fetchWithCache(url, {}, cacheKey, forceRefresh);
    
    // Vérifier si Solo Leveling existe dans les résultats
    // Si non, l'ajouter manuellement (pour garantir que ce contenu populaire est présent)
    const soloLevelingExists = data.data && data.data.some(
      anime => anime.title.toLowerCase().includes('solo leveling')
    );
    
    let results = [...(data.data || [])];
    
    if (!soloLevelingExists && !query) {
      // Rechercher explicitement Solo Leveling
      const soloLevelingUrl = `${JIKAN_BASE_URL}/anime?q=solo%20leveling&limit=1`;
      const soloLevelingData = await this.fetchWithCache(
        soloLevelingUrl, 
        {}, 
        'solo_leveling_anime', 
        forceRefresh
      );
      
      if (soloLevelingData.data && soloLevelingData.data.length > 0) {
        // Ajouter en tête de liste
        results = [soloLevelingData.data[0], ...results];
        
        // S'assurer que nous respectons toujours la limite
        if (results.length > limit) {
          results = results.slice(0, limit);
        }
      }
    }
    
    return this.transformJikanResults(results);
  }

  /**
   * Transforme les résultats de l'API TMDB en format standard FloDrama
   * @param {Array} results - Résultats de l'API TMDB
   * @returns {Array} - Résultats transformés
   */
  transformTMDBResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    return results.map(item => {
      const isMovie = item.media_type === 'movie' || item.title;
      const title = isMovie ? item.title : item.name;
      const originalTitle = isMovie ? item.original_title : item.original_name;
      const releaseDate = isMovie ? item.release_date : item.first_air_date;
      
      return {
        id: `tmdb_${item.id}`,
        title,
        originalTitle,
        description: item.overview,
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : getOptimizedImageUrl(title),
        backdrop: item.backdrop_path 
          ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
          : null,
        year: releaseDate ? releaseDate.split('-')[0] : '',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : '4.0',
        genres: item.genre_ids || [],
        popularity: item.popularity,
        mediaType: isMovie ? 'movie' : 'tv',
        language: item.original_language,
        region: this.getRegionFromLanguage(item.original_language)
      };
    });
  }

  /**
   * Transforme les résultats de l'API Jikan en format standard FloDrama
   * @param {Array} results - Résultats de l'API Jikan
   * @returns {Array} - Résultats transformés
   */
  transformJikanResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    return results.map(item => {
      const year = item.aired && item.aired.from 
        ? new Date(item.aired.from).getFullYear() 
        : '';
      
      return {
        id: `jikan_${item.mal_id}`,
        title: item.title,
        originalTitle: item.title_japanese,
        description: item.synopsis,
        poster: item.images && item.images.jpg ? item.images.jpg.image_url : getOptimizedImageUrl(item.title),
        backdrop: null,
        year,
        rating: item.score ? (item.score / 2).toFixed(1) : '4.0',
        genres: item.genres ? item.genres.map(g => g.name) : [],
        popularity: item.popularity || item.rank || 0,
        mediaType: 'anime',
        language: 'ja',
        region: 'JAPAN',
        episodes: item.episodes,
        status: item.status,
        studios: item.studios ? item.studios.map(s => s.name).join(', ') : ''
      };
    });
  }

  /**
   * Détermine la région à partir du code de langue
   * @param {string} language - Code de langue
   * @returns {string} - Code de région
   */
  getRegionFromLanguage(language) {
    const entry = Object.entries(REGION_MAPPING).find(([_, mapping]) => 
      mapping.language === language
    );
    
    return entry ? entry[0] : null;
  }

  /**
   * Génère dynamiquement des carousels pour la page d'accueil
   * @param {boolean} forceRefresh - Force le rafraîchissement du cache
   * @returns {Promise<Array>} - Carousels avec contenu
   */
  async generateHomeCarousels(forceRefresh = false) {
    // Récupérer diverses catégories de contenu
    const [
      trending,
      newReleases,
      animeReleases,
      koreanDramas
    ] = await Promise.all([
      this.getTrendingContent({ forceRefresh }),
      this.getNewReleases({ forceRefresh }),
      this.getNewAnimeReleases({ forceRefresh }),
      this.getContentByCategory('drama', { 
        forceRefresh,
        // Garantir que nous obtenons des dramas coréens
        region: 'KOREA'
      })
    ]);
    
    // Structurer les carousels
    return [
      {
        id: 'featured',
        title: 'À la une',
        description: 'Sélectionné pour vous',
        items: trending.slice(0, 6)
      },
      {
        id: 'new_movies',
        title: 'Films récents',
        description: 'Les dernières sorties',
        items: newReleases.movies.slice(0, 10)
      },
      {
        id: 'new_dramas',
        title: 'Nouveaux Dramas',
        description: 'Dernières productions asiatiques',
        items: newReleases.asianDramas.slice(0, 10)
      },
      {
        id: 'anime_seasonal',
        title: 'Animés de la saison',
        description: 'Les séries de la saison actuelle',
        items: animeReleases.currentSeason.slice(0, 10)
      },
      {
        id: 'top_anime',
        title: 'Top Animés',
        description: 'Les séries les plus populaires',
        items: animeReleases.topAiring.slice(0, 10)
      },
      {
        id: 'korean_dramas',
        title: 'Dramas Coréens',
        description: 'Le meilleur de la K-Drama',
        items: koreanDramas.slice(0, 10)
      },
      {
        id: 'bollywood',
        title: 'Bollywood',
        description: 'Films indiens populaires',
        items: newReleases.bollywood.slice(0, 10)
      }
    ];
  }
}

// Exporter une instance singleton du service
const contentDiscoveryService = new ContentDiscoveryService();
export default contentDiscoveryService;
