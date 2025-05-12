const KDramasService = require('../services/KDramasService');
const MyDramaListService = require('../services/MyDramaListService');
const StreamingSourcesService = require('../../core/services/StreamingSourcesService');
const StreamingProxyService = require('../../anime/services/StreamingProxyService');

/**
 * Contrôleur pour gérer les requêtes liées aux dramas
 * Utilise plusieurs services pour fournir des données complètes
 */
class DramaController {
  constructor() {
    this.kDramasService = new KDramasService();
    this.myDramaListService = new MyDramaListService();
    this.streamingSourcesService = new StreamingSourcesService();
    this.streamingProxyService = new StreamingProxyService();
  }

  /**
   * Récupère un drama par son ID
   * @param {string|number} id - L'ID du drama
   * @returns {Promise<Object>} - Le drama récupéré
   */
  async getDramaById(id) {
    try {
      // Essayer d'abord avec KDramas
      return await this.kDramasService.getDrama(id);
    } catch (error) {
      console.log(`Erreur KDramas pour le drama ${id}: ${error.message}`);
      
      // Fallback sur MyDramaList
      try {
        return await this.myDramaListService.getDrama(id);
      } catch (fallbackError) {
        console.log(`Erreur MyDramaList pour le drama ${id}: ${fallbackError.message}`);
        throw new Error(`Drama non trouvé: ${id}`);
      }
    }
  }

  /**
   * Récupère les épisodes d'un drama
   * @param {string|number} id - L'ID du drama
   * @returns {Promise<Object>} - Les épisodes récupérés
   */
  async getDramaEpisodes(id) {
    try {
      // Essayer avec KDramas
      return await this.kDramasService.getDramaEpisodes(id);
    } catch (error) {
      console.log(`Erreur KDramas pour les épisodes du drama ${id}: ${error.message}`);
      throw new Error(`Épisodes non trouvés pour le drama: ${id}`);
    }
  }

  /**
   * Récupère le casting d'un drama
   * @param {string|number} id - L'ID du drama
   * @returns {Promise<Object>} - Le casting récupéré
   */
  async getDramaCast(id) {
    try {
      // Essayer avec KDramas
      return await this.kDramasService.getDramaCast(id);
    } catch (error) {
      console.log(`Erreur KDramas pour le casting du drama ${id}: ${error.message}`);
      throw new Error(`Casting non trouvé pour le drama: ${id}`);
    }
  }

  /**
   * Recherche des dramas
   * @param {Object} params - Les paramètres de recherche
   * @returns {Promise<Object>} - Les résultats de la recherche
   */
  async searchDramas(params) {
    const { q, page = 1, limit = 20 } = params;
    
    try {
      // Si nous avons un terme de recherche, utiliser KDramas
      if (q) {
        return await this.kDramasService.searchDramas(q, page, limit);
      }
      
      // Sinon, retourner un tableau vide
      return { data: [] };
    } catch (error) {
      console.log(`Erreur KDramas pour la recherche: ${error.message}`);
      
      // Fallback sur MyDramaList si nous avons un terme de recherche
      if (q) {
        try {
          return await this.myDramaListService.searchDramas(q, page);
        } catch (fallbackError) {
          console.log(`Erreur MyDramaList pour la recherche: ${fallbackError.message}`);
        }
      }
      
      // En cas d'échec, retourner un tableau vide
      return { data: [] };
    }
  }

  /**
   * Récupère les dramas en tendance
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array>} - Les dramas en tendance
   */
  async getTrendingDramas(limit = 15) {
    try {
      // Essayer d'abord avec KDramas
      const trendingFromKDramas = await this.kDramasService.getTrendingDramas(limit);
      
      if (trendingFromKDramas && trendingFromKDramas.length > 0) {
        return trendingFromKDramas;
      }
    } catch (error) {
      console.log(`Erreur KDramas pour les tendances: ${error.message}`);
    }
    
    // Fallback sur MyDramaList
    try {
      return await this.myDramaListService.getTrendingDramas(limit);
    } catch (error) {
      console.log(`Erreur MyDramaList pour les tendances: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère les dramas récents
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array>} - Les dramas récents
   */
  async getRecentDramas(limit = 15) {
    try {
      // Essayer d'abord avec KDramas
      const recentFromKDramas = await this.kDramasService.getRecentDramas(limit);
      
      if (recentFromKDramas && recentFromKDramas.length > 0) {
        return recentFromKDramas;
      }
    } catch (error) {
      console.log(`Erreur KDramas pour les récents: ${error.message}`);
    }
    
    // Fallback sur MyDramaList
    try {
      return await this.myDramaListService.getRecentDramas(limit);
    } catch (error) {
      console.log(`Erreur MyDramaList pour les récents: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère les dramas populaires
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array>} - Les dramas populaires
   */
  async getPopularDramas(limit = 15) {
    try {
      // Essayer d'abord avec KDramas
      const popularFromKDramas = await this.kDramasService.getPopularDramas(limit);
      
      if (popularFromKDramas && popularFromKDramas.length > 0) {
        return popularFromKDramas;
      }
    } catch (error) {
      console.log(`Erreur KDramas pour les populaires: ${error.message}`);
    }
    
    // Fallback sur MyDramaList
    try {
      return await this.myDramaListService.getPopularDramas(limit);
    } catch (error) {
      console.log(`Erreur MyDramaList pour les populaires: ${error.message}`);
    }
    
    // En cas d'échec, retourner un tableau vide
    return [];
  }

  /**
   * Récupère les dramas par genre
   * @param {string} genre - Le genre
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les dramas du genre
   */
  async getDramasByGenre(genre, page = 1, limit = 20) {
    try {
      // Essayer d'abord avec KDramas
      return await this.kDramasService.getDramasByGenre(genre, page, limit);
    } catch (error) {
      console.log(`Erreur KDramas pour le genre ${genre}: ${error.message}`);
      
      // Fallback sur MyDramaList
      try {
        return await this.myDramaListService.getDramasByGenre(genre, page);
      } catch (fallbackError) {
        console.log(`Erreur MyDramaList pour le genre ${genre}: ${fallbackError.message}`);
      }
    }
    
    // En cas d'échec, retourner un tableau vide
    return { data: [] };
  }

  /**
   * Récupère les dramas par pays
   * @param {string} country - Le pays
   * @param {number} page - Le numéro de page
   * @param {number} limit - Le nombre de résultats par page
   * @returns {Promise<Object>} - Les dramas du pays
   */
  async getDramasByCountry(country, page = 1, limit = 20) {
    try {
      // Essayer d'abord avec KDramas
      return await this.kDramasService.getDramasByCountry(country, page, limit);
    } catch (error) {
      console.log(`Erreur KDramas pour le pays ${country}: ${error.message}`);
      
      // Fallback sur MyDramaList
      try {
        return await this.myDramaListService.getDramasByCountry(country, page);
      } catch (fallbackError) {
        console.log(`Erreur MyDramaList pour le pays ${country}: ${fallbackError.message}`);
      }
    }
    
    // En cas d'échec, retourner un tableau vide
    return { data: [] };
  }

  /**
   * Récupère les informations de streaming d'un drama
   * @param {string|number} id - L'ID du drama
   * @param {number} episode - Le numéro de l'épisode
   * @returns {Promise<Object>} - Les informations de streaming
   */
  async getDramaStreaming(id, episode = 1) {
    try {
      // Récupérer les informations du drama
      const drama = await this.getDramaById(id);
      
      // Rechercher les sources de streaming
      const streamingInfo = await this.streamingSourcesService.findDramaStreamingSources(drama, episode);
      
      // Optimiser les sources avec le proxy
      if (streamingInfo && streamingInfo.sources) {
        streamingInfo.sources = this.streamingProxyService.optimizeSources(
          streamingInfo.sources, 
          streamingInfo.referer || `https://api.flodrama.com/api/drama/${id}`
        );
      }
      
      return streamingInfo;
    } catch (error) {
      console.log(`Erreur pour le streaming du drama ${id}, épisode ${episode}: ${error.message}`);
      throw new Error(`Informations de streaming non trouvées pour le drama: ${id}, épisode: ${episode}`);
    }
  }
}

module.exports = DramaController;
