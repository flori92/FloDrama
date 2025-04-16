/**
 * Service hybride de découverte de contenu pour FloDrama
 * Combine le scraping intelligent existant avec des API gratuites
 * pour des métadonnées complètes et à jour
 */

import SmartScrapingService from './SmartScrapingService';
import FreeAPIProvider from './api/FreeAPIProvider';
import { cacheManager } from '../utils/cacheManager';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

// Durées de cache (en minutes)
const CACHE_TTL = {
  TRENDING: 60,      // 1 heure
  CATEGORY: 240,     // 4 heures
  SEARCH: 120,       // 2 heures
  DETAILS: 1440      // 24 heures
};

/**
 * Classe principale pour la découverte de contenu hybride
 */
class HybridContentService {
  constructor() {
    // Initialisation du service
    this.initialize();
  }
  
  /**
   * Initialise le service et précharge certaines données
   */
  initialize() {
    console.log('Initialisation du service hybride de découverte de contenu...');
    
    // Précharger certaines catégories populaires
    this.getPopularContent();
    
    // Programme le rafraîchissement automatique du cache
    this.setupCacheRefresh();
  }
  
  /**
   * Configure le rafraîchissement automatique du cache
   */
  setupCacheRefresh() {
    // Rafraîchir le contenu populaire toutes les heures
    setInterval(() => {
      this.getPopularContent({ forceRefresh: true });
    }, CACHE_TTL.TRENDING * 60 * 1000);
  }
  
  /**
   * Récupère le contenu populaire en combinant sources de scraping et API
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Contenu populaire
   */
  async getPopularContent(options = {}) {
    const { limit = 20, forceRefresh = false } = options;
    const cacheKey = 'hybrid_popular_content';
    
    try {
      // Vérifier le cache si pas de forceRefresh
      if (!forceRefresh) {
        const cachedData = cacheManager.getCache(cacheKey, 'content');
        if (cachedData) return cachedData;
      }
      
      // Récupérer depuis le service de scraping
      const scrapedData = await SmartScrapingService.getTrends(limit);
      
      // Enrichir avec des données d'API
      const enrichedData = await this.enrichContentData(scrapedData);
      
      // Si nous n'avons pas suffisamment de contenu du scraping, compléter avec les API
      if (enrichedData.length < limit) {
        // Récupérer des animés populaires via Jikan
        const animeData = await FreeAPIProvider.getTopAiringAnime(
          Math.min(10, limit - enrichedData.length)
        );
        
        // Transformer les données d'anime au format standard
        const processedAnime = this.transformJikanResults(animeData);
        
        // Récupérer des films populaires via OMDb
        const moviesData = await FreeAPIProvider.searchMoviesAndShows(
          'popular', 
          { type: 'movie', limit: Math.min(10, limit - enrichedData.length - processedAnime.length) }
        );
        
        // Transformer les données de films au format standard
        const processedMovies = this.transformOMDbResults(moviesData);
        
        // Combiner les résultats
        const combinedResults = [
          ...enrichedData,
          ...processedAnime,
          ...processedMovies
        ];
        
        // Limiter au nombre demandé
        const finalResults = combinedResults.slice(0, limit);
        
        // Mettre en cache
        cacheManager.setCache(cacheKey, finalResults, 'content', CACHE_TTL.TRENDING);
        
        return finalResults;
      }
      
      // Mettre en cache
      cacheManager.setCache(cacheKey, enrichedData, 'content', CACHE_TTL.TRENDING);
      
      return enrichedData;
    } catch (error) {
      console.error('Erreur lors de la récupération du contenu populaire:', error);
      return [];
    }
  }
  
  /**
   * Enrichit les données de contenu avec des informations supplémentaires des API
   * @param {Array} contentItems - Éléments de contenu à enrichir
   * @returns {Promise<Array>} - Contenu enrichi
   */
  async enrichContentData(contentItems) {
    if (!contentItems || !Array.isArray(contentItems) || contentItems.length === 0) {
      return [];
    }
    
    // Traiter chaque élément pour l'enrichir
    const enrichPromises = contentItems.map(async (item) => {
      try {
        // Si l'élément a déjà toutes les données nécessaires, le retourner tel quel
        if (
          item.title && 
          item.description && 
          item.poster && 
          item.year && 
          item.rating
        ) {
          return item;
        }
        
        // Sinon, essayer de l'enrichir
        let enrichedItem = { ...item };
        
        // Déterminer le type de contenu pour choisir la bonne API
        const contentType = this.detectContentType(item);
        
        switch (contentType) {
          case 'anime':
            // Rechercher via Jikan
            const animeResults = await FreeAPIProvider.searchAnime(item.title, { limit: 1 });
            if (animeResults && animeResults.length > 0) {
              const animeData = animeResults[0];
              
              // Fusionner les données
              enrichedItem = {
                ...enrichedItem,
                description: enrichedItem.description || animeData.synopsis,
                poster: enrichedItem.poster || (animeData.images?.jpg?.image_url || ''),
                year: enrichedItem.year || (animeData.aired?.from ? new Date(animeData.aired.from).getFullYear() : ''),
                rating: enrichedItem.rating || (animeData.score ? (animeData.score / 2).toFixed(1) : '4.0'),
                genres: enrichedItem.genres || (animeData.genres ? animeData.genres.map(g => g.name) : []),
                episodes: enrichedItem.episodes || animeData.episodes,
                status: enrichedItem.status || animeData.status
              };
            }
            break;
            
          case 'drama':
            // Rechercher via TVMaze
            const dramaResults = await FreeAPIProvider.searchTVShows(item.title);
            if (dramaResults && dramaResults.length > 0) {
              const dramaData = dramaResults[0];
              
              // Fusionner les données
              enrichedItem = {
                ...enrichedItem,
                description: enrichedItem.description || this.stripHtmlTags(dramaData.summary || ''),
                poster: enrichedItem.poster || dramaData.image?.medium || '',
                year: enrichedItem.year || (dramaData.premiered ? dramaData.premiered.split('-')[0] : ''),
                rating: enrichedItem.rating || (dramaData.rating?.average ? (dramaData.rating.average / 2).toFixed(1) : '4.0'),
                genres: enrichedItem.genres || (dramaData.genres || []),
                status: enrichedItem.status || dramaData.status,
                network: enrichedItem.network || (dramaData.network?.name || '')
              };
            }
            break;
            
          default:
            // Rechercher via OMDb
            const movieData = await FreeAPIProvider.getMovieOrShowDetails(item.title, true);
            if (movieData) {
              // Fusionner les données
              enrichedItem = {
                ...enrichedItem,
                description: enrichedItem.description || movieData.Plot,
                poster: enrichedItem.poster || movieData.Poster,
                year: enrichedItem.year || movieData.Year,
                rating: enrichedItem.rating || (movieData.imdbRating ? (parseFloat(movieData.imdbRating) / 2).toFixed(1) : '4.0'),
                genres: enrichedItem.genres || (movieData.Genre ? movieData.Genre.split(', ') : []),
                director: enrichedItem.director || movieData.Director,
                actors: enrichedItem.actors || movieData.Actors
              };
            }
        }
        
        // Si nous n'avons toujours pas d'image, utiliser l'optimiseur d'image
        if (!enrichedItem.poster || enrichedItem.poster === 'N/A') {
          enrichedItem.poster = getOptimizedImageUrl(enrichedItem.title);
        }
        
        return enrichedItem;
      } catch (error) {
        console.error(`Erreur lors de l'enrichissement de l'élément ${item.title}:`, error);
        return item;
      }
    });
    
    // Attendre toutes les promesses
    const enrichedItems = await Promise.all(enrichPromises);
    
    return enrichedItems;
  }
  
  /**
   * Détecte le type de contenu basé sur les métadonnées disponibles
   * @param {Object} item - Élément de contenu
   * @returns {string} - Type de contenu (anime, drama, movie)
   */
  detectContentType(item) {
    if (!item) return 'movie';
    
    // Vérifier les attributs explicites
    if (item.type === 'anime' || item.contentType === 'anime') {
      return 'anime';
    }
    
    if (
      item.type === 'drama' || 
      item.contentType === 'drama' ||
      (item.genres && item.genres.includes('Drama'))
    ) {
      return 'drama';
    }
    
    // Heuristiques pour détection basée sur les attributs disponibles
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    // Mots-clés pour animé
    const animeKeywords = ['anime', 'manga', 'japonais', 'épisode', 'saison', 'japon'];
    for (const keyword of animeKeywords) {
      if (title.includes(keyword) || description.includes(keyword)) {
        return 'anime';
      }
    }
    
    // Mots-clés pour drama
    const dramaKeywords = ['k-drama', 'j-drama', 'c-drama', 'coréen', 'korean', 'chinois', 'drama'];
    for (const keyword of dramaKeywords) {
      if (title.includes(keyword) || description.includes(keyword)) {
        return 'drama';
      }
    }
    
    // Par défaut, c'est un film
    return 'movie';
  }
  
  /**
   * Transforme les résultats de l'API Jikan en format standard
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
   * Transforme les résultats de l'API OMDb en format standard
   * @param {Array} results - Résultats de l'API OMDb
   * @returns {Array} - Résultats transformés
   */
  transformOMDbResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    return results.map(item => {
      return {
        id: `omdb_${item.imdbID}`,
        title: item.Title,
        originalTitle: item.Title,
        description: '', // Nécessite une requête supplémentaire pour obtenir la description
        poster: item.Poster !== 'N/A' ? item.Poster : getOptimizedImageUrl(item.Title),
        backdrop: null,
        year: item.Year,
        rating: '4.0', // OMDb ne fournit pas de note dans les résultats de recherche
        genres: [],
        mediaType: item.Type === 'movie' ? 'movie' : 'tv',
        language: 'en',
        region: null
      };
    });
  }
  
  /**
   * Recherche de contenu via le service hybride
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async searchContent(query, options = {}) {
    const { type = 'all', limit = 20 } = options;
    
    try {
      // D'abord chercher via le service de scraping
      const scrapedResults = await SmartScrapingService.searchFast(query, type);
      
      // Enrichir les résultats du scraping
      const enrichedScrapedResults = await this.enrichContentData(scrapedResults);
      
      // Si nous avons suffisamment de résultats, les retourner
      if (enrichedScrapedResults.length >= limit) {
        return enrichedScrapedResults.slice(0, limit);
      }
      
      // Sinon, compléter avec les API gratuites
      let additionalResults = [];
      
      // Nombre de résultats additionnels nécessaires
      const additionalCount = limit - enrichedScrapedResults.length;
      
      // Rechercher en fonction du type
      switch (type) {
        case 'anime':
          const animeResults = await FreeAPIProvider.searchAnime(query, { limit: additionalCount });
          additionalResults = this.transformJikanResults(animeResults);
          break;
          
        case 'drama':
          const dramaResults = await FreeAPIProvider.searchTVShows(query);
          // Filtrer pour n'avoir que des dramas
          const filteredDramas = dramaResults.filter(show => {
            return show.genres && show.genres.includes('Drama');
          });
          additionalResults = this.transformTVMazeResults(filteredDramas.slice(0, additionalCount));
          break;
          
        default:
          // Rechercher films et séries
          const mediaResults = await FreeAPIProvider.searchMoviesAndShows(query);
          additionalResults = this.transformOMDbResults(mediaResults.slice(0, additionalCount));
      }
      
      // Combiner les résultats
      const combinedResults = [...enrichedScrapedResults, ...additionalResults];
      
      // Retourner les résultats limités
      return combinedResults.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la recherche hybride:', error);
      return [];
    }
  }
  
  /**
   * Récupère les dernières sorties par catégorie
   * @param {string} category - Catégorie (drama, anime, bollywood, movies)
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Contenu de la catégorie
   */
  async getLatestByCategory(category, options = {}) {
    const { limit = 20, forceRefresh = false } = options;
    const cacheKey = `hybrid_latest_${category}`;
    
    try {
      // Vérifier le cache si pas de forceRefresh
      if (!forceRefresh) {
        const cachedData = cacheManager.getCache(cacheKey, 'content');
        if (cachedData) return cachedData;
      }
      
      let results = [];
      
      // Récupérer en fonction de la catégorie
      switch (category.toLowerCase()) {
        case 'anime':
          // Récupérer les animés de la saison en cours
          const animeData = await FreeAPIProvider.getCurrentSeasonAnime(limit);
          results = this.transformJikanResults(animeData);
          break;
          
        case 'drama':
          // Pour les dramas, combiner différentes régions asiatiques
          const regions = ['kr', 'jp', 'cn', 'th'];
          const dramaPromises = regions.map(region => 
            FreeAPIProvider.searchAsianDramas(region)
          );
          
          const dramaResults = await Promise.all(dramaPromises);
          const combinedDramas = dramaResults.flat();
          
          // Transformer et limiter
          results = this.transformTVMazeResults(combinedDramas.slice(0, limit));
          break;
          
        case 'bollywood':
          // Rechercher avec le terme "bollywood"
          const bollywoodData = await FreeAPIProvider.searchMoviesAndShows('bollywood', { type: 'movie' });
          results = this.transformOMDbResults(bollywoodData.slice(0, limit));
          break;
          
        case 'movies':
        default:
          // Rechercher avec le terme "new movies"
          const moviesData = await FreeAPIProvider.searchMoviesAndShows('new', { type: 'movie' });
          results = this.transformOMDbResults(moviesData.slice(0, limit));
      }
      
      // Mettre en cache
      cacheManager.setCache(cacheKey, results, 'content', CACHE_TTL.CATEGORY);
      
      return results;
    } catch (error) {
      console.error(`Erreur lors de la récupération des dernières sorties ${category}:`, error);
      return [];
    }
  }
  
  /**
   * Génère des carousels pour la page d'accueil
   * @param {boolean} forceRefresh - Force le rafraîchissement du cache
   * @returns {Promise<Array>} - Carousels avec contenu
   */
  async generateHomeCarousels(forceRefresh = false) {
    const cacheKey = 'hybrid_home_carousels';
    
    try {
      // Vérifier le cache si pas de forceRefresh
      if (!forceRefresh) {
        const cachedData = cacheManager.getCache(cacheKey, 'content');
        if (cachedData) return cachedData;
      }
      
      // Récupérer diverses catégories de contenu
      const [
        trending,
        latestMovies,
        latestDramas,
        latestAnime,
        bollywood
      ] = await Promise.all([
        this.getPopularContent({ forceRefresh }),
        this.getLatestByCategory('movies', { forceRefresh }),
        this.getLatestByCategory('drama', { forceRefresh }),
        this.getLatestByCategory('anime', { forceRefresh }),
        this.getLatestByCategory('bollywood', { forceRefresh })
      ]);
      
      // Structurer les carousels
      const carousels = [
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
          items: latestMovies.slice(0, 10)
        },
        {
          id: 'new_dramas',
          title: 'Nouveaux Dramas',
          description: 'Dernières productions asiatiques',
          items: latestDramas.slice(0, 10)
        },
        {
          id: 'anime_seasonal',
          title: 'Animés de la saison',
          description: 'Les séries de la saison actuelle',
          items: latestAnime.slice(0, 10)
        },
        {
          id: 'bollywood',
          title: 'Bollywood',
          description: 'Films indiens populaires',
          items: bollywood.slice(0, 10)
        }
      ];
      
      // Mettre en cache
      cacheManager.setCache(cacheKey, carousels, 'content', CACHE_TTL.TRENDING);
      
      return carousels;
    } catch (error) {
      console.error('Erreur lors de la génération des carousels:', error);
      return [];
    }
  }
  
  /**
   * Transforme les résultats de l'API TVMaze en format standard
   * @param {Array} results - Résultats de l'API TVMaze
   * @returns {Array} - Résultats transformés
   */
  transformTVMazeResults(results) {
    if (!results || !Array.isArray(results)) return [];
    
    return results.map(item => {
      // Récupérer l'année à partir de la date de première diffusion
      const year = item.premiered ? item.premiered.split('-')[0] : '';
      
      return {
        id: `tvmaze_${item.id}`,
        title: item.name,
        originalTitle: item.name,
        description: this.stripHtmlTags(item.summary || ''),
        poster: item.image?.medium || getOptimizedImageUrl(item.name),
        backdrop: item.image?.original || null,
        year,
        rating: item.rating?.average ? (item.rating.average / 2).toFixed(1) : '4.0',
        genres: item.genres || [],
        mediaType: 'tv',
        language: item.language?.toLowerCase() || 'en',
        region: this.detectRegionFromShow(item),
        network: item.network?.name || '',
        status: item.status,
        showType: item.showType || (item.language === 'Korean' ? 'K-Drama' : item.language === 'Japanese' ? 'J-Drama' : 'Drama')
      };
    });
  }
  
  /**
   * Détecte la région d'une série basée sur les métadonnées
   * @param {Object} show - Données de la série
   * @returns {string} - Code de la région
   */
  detectRegionFromShow(show) {
    if (!show) return null;
    
    // Vérifier la langue
    switch (show.language) {
      case 'Korean':
        return 'KR';
      case 'Japanese':
        return 'JP';
      case 'Chinese':
        return 'CN';
      case 'Thai':
        return 'TH';
      default:
        // Pas de région détectée explicitement
        return null;
    }
  }
  
  /**
   * Supprime les balises HTML d'une chaîne
   * @param {string} html - Chaîne avec balises HTML
   * @returns {string} - Chaîne sans balises HTML
   */
  stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }
}

// Exporter une instance singleton du service
const hybridContentService = new HybridContentService();
export default hybridContentService;
