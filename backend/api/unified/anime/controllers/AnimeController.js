const JikanService = require('../services/JikanService');
const AnimeApiService = require('../services/AnimeApiService');

/**
 * Contrôleur pour gérer les requêtes liées aux animes
 * Utilise plusieurs services pour fournir des données complètes
 */
class AnimeController {
  constructor() {
    this.jikanService = new JikanService();
    this.animeApiService = new AnimeApiService();
  }

  /**
   * Récupère un anime par son ID
   * @param {string|number} id - L'ID de l'anime
   * @param {boolean} full - Si true, récupère les informations complètes
   * @returns {Promise<Object>} - L'anime récupéré
   */
  async getAnimeById(id, full = false) {
    try {
      // Essayer d'abord avec Jikan
      if (full) {
        return await this.jikanService.getAnimeFullById(id);
      } else {
        return await this.jikanService.getAnime(id);
      }
    } catch (error) {
      console.log(`Erreur Jikan pour l'anime ${id}: ${error.message}`);
      
      // Fallback sur anime-api
      try {
        return await this.animeApiService.getAnime(id);
      } catch (fallbackError) {
        console.log(`Erreur AnimeAPI pour l'anime ${id}: ${fallbackError.message}`);
        throw new Error(`Anime non trouvé: ${id}`);
      }
    }
  }

  /**
   * Récupère les épisodes d'un anime
   * @param {string|number} id - L'ID de l'anime
   * @param {number} page - Le numéro de page pour Jikan
   * @returns {Promise<Object>} - Les épisodes récupérés
   */
  async getAnimeEpisodes(id, page = 1) {
    try {
      // Essayer d'abord avec Jikan
      return await this.jikanService.getAnimeEpisodes(id, page);
    } catch (error) {
      console.log(`Erreur Jikan pour les épisodes de l'anime ${id}: ${error.message}`);
      
      // Fallback sur anime-api
      try {
        return await this.animeApiService.getAnimeEpisodes(id);
      } catch (fallbackError) {
        console.log(`Erreur AnimeAPI pour les épisodes de l'anime ${id}: ${fallbackError.message}`);
        throw new Error(`Épisodes non trouvés pour l'anime: ${id}`);
      }
    }
  }

  /**
   * Récupère les personnages d'un anime
   * @param {string|number} id - L'ID de l'anime
   * @returns {Promise<Object>} - Les personnages récupérés
   */
  async getAnimeCharacters(id) {
    try {
      // Essayer d'abord avec Jikan
      return await this.jikanService.getAnimeCharacters(id);
    } catch (error) {
      console.log(`Erreur Jikan pour les personnages de l'anime ${id}: ${error.message}`);
      
      // Fallback sur anime-api
      try {
        return await this.animeApiService.getAnimeCharacters(id);
      } catch (fallbackError) {
        console.log(`Erreur AnimeAPI pour les personnages de l'anime ${id}: ${fallbackError.message}`);
        throw new Error(`Personnages non trouvés pour l'anime: ${id}`);
      }
    }
  }

  /**
   * Recherche des animes
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchAnime(params) {
    const { q, page = 1, limit = 20 } = params;
    
    try {
      // Si nous avons un terme de recherche, utiliser Jikan
      if (q) {
        return await this.jikanService.searchAnime({
          q,
          page,
          limit,
          sfw: true,
          ...params
        });
      }
      
      // Sinon, utiliser les filtres avancés de Jikan
      return await this.jikanService.searchAnime({
        page,
        limit,
        sfw: true,
        ...params
      });
    } catch (error) {
      console.log(`Erreur Jikan pour la recherche: ${error.message}`);
      
      // Fallback sur anime-api si nous avons un terme de recherche
      if (q) {
        try {
          return await this.animeApiService.searchAnime(q);
        } catch (fallbackError) {
          console.log(`Erreur AnimeAPI pour la recherche: ${fallbackError.message}`);
        }
      }
      
      // En cas d'échec, retourner un tableau vide
      return { data: [] };
    }
  }

  /**
   * Récupère les animes en tendance
   * @param {number} limit - Le nombre d'animes à récupérer
   * @returns {Promise<Array>} - Les animes en tendance
   */
  async getTrendingAnime(limit = 15) {
    try {
      // Essayer d'abord avec anime-api car il a une meilleure sélection de tendances
      const trendingFromAnimeApi = await this.animeApiService.getTrendingAnime();
      
      if (trendingFromAnimeApi && trendingFromAnimeApi.length > 0) {
        return trendingFromAnimeApi.slice(0, limit);
      }
    } catch (error) {
      console.log(`Erreur AnimeAPI pour les tendances: ${error.message}`);
    }
    
    // Fallback sur Jikan
    try {
      const topAnime = await this.jikanService.getTopAnime('bypopularity', 1);
      
      if (topAnime && topAnime.data) {
        return topAnime.data.slice(0, limit);
      }
    } catch (error) {
      console.log(`Erreur Jikan pour les tendances: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère les animes récents
   * @param {number} limit - Le nombre d'animes à récupérer
   * @returns {Promise<Array>} - Les animes récents
   */
  async getRecentAnime(limit = 15) {
    try {
      // Essayer d'abord avec anime-api
      const recentFromAnimeApi = await this.animeApiService.getRecentAnime();
      
      if (recentFromAnimeApi && recentFromAnimeApi.length > 0) {
        return recentFromAnimeApi.slice(0, limit);
      }
    } catch (error) {
      console.log(`Erreur AnimeAPI pour les récents: ${error.message}`);
    }
    
    // Fallback sur Jikan (animes en cours de diffusion)
    try {
      const airingAnime = await this.jikanService.searchAnime({
        status: 'airing',
        order_by: 'start_date',
        sort: 'desc',
        limit
      });
      
      if (airingAnime && airingAnime.data) {
        return airingAnime.data;
      }
    } catch (error) {
      console.log(`Erreur Jikan pour les récents: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère un anime aléatoire
   * @returns {Promise<Object>} - Un anime aléatoire
   */
  async getRandomAnime() {
    try {
      return await this.jikanService.getRandomAnime();
    } catch (error) {
      console.log(`Erreur Jikan pour l'anime aléatoire: ${error.message}`);
      throw new Error('Impossible de récupérer un anime aléatoire');
    }
  }

  /**
   * Récupère les recommandations pour un anime
   * @param {string|number} id - L'ID de l'anime
   * @param {number} limit - Le nombre de recommandations à récupérer
   * @returns {Promise<Array>} - Les recommandations
   */
  async getAnimeRecommendations(id, limit = 10) {
    try {
      const recommendations = await this.jikanService.getAnimeRecommendations(id);
      
      if (recommendations && recommendations.data) {
        // Transformer les données pour correspondre à notre format
        const formattedRecommendations = recommendations.data.map(item => {
          const anime = item.entry;
          anime.score = item.votes || 0; // Utiliser les votes comme score
          return this.jikanService.source === 'jikan' ? 
            anime : // Si déjà transformé
            new Anime(anime, this.jikanService.source); // Sinon transformer
        });
        
        return formattedRecommendations.slice(0, limit);
      }
    } catch (error) {
      console.log(`Erreur pour les recommandations de l'anime ${id}: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère les informations de streaming d'un anime
   * @param {string|number} id - L'ID de l'anime
   * @param {number} episode - Le numéro de l'épisode
   * @returns {Promise<Object>} - Les informations de streaming
   */
  async getAnimeStreaming(id, episode) {
    try {
      return await this.animeApiService.getAnimeStreaming(id, episode);
    } catch (error) {
      console.log(`Erreur pour le streaming de l'anime ${id}, épisode ${episode}: ${error.message}`);
      throw new Error(`Informations de streaming non trouvées pour l'anime: ${id}, épisode: ${episode}`);
    }
  }
}

module.exports = AnimeController;
