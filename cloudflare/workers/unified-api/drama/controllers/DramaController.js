const KDramasService = require('../services/KDramasService');
const MyDramaListService = require('../services/MyDramaListService');
const DramaApiService = require('../services/DramaApiService');
const StreamingSourcesService = require('../../core/services/StreamingSourcesService');
const StreamingProxyService = require('../../anime/services/StreamingProxyService');

/**
 * Contrôleur pour gérer les requêtes liées aux dramas asiatiques
 * Utilise plusieurs services pour fournir des données complètes et robustes
 * Intègre des sources multiples avec système de fallback
 */
class DramaController {
  constructor() {
    this.kDramasService = new KDramasService();
    this.myDramaListService = new MyDramaListService();
    this.dramaApiService = new DramaApiService();
    this.streamingSourcesService = new StreamingSourcesService();
    this.streamingProxyService = new StreamingProxyService();
    
    // Ordre de priorité des services (pour les fallbacks)
    this.servicesPriority = ['kDramas', 'dramaApi', 'myDramaList'];
  }

  /**
   * Récupère un drama par son ID
   * @param {string|number} id - L'ID du drama
   * @returns {Promise<Object>} - Le drama récupéré
   */
  async getDramaById(id) {
    // Essayer tous les services dans l'ordre de priorité
    let lastError;
    
    // 1. KDramas
    try {
      return await this.kDramasService.getDrama(id);
    } catch (error) {
      console.log(`[DramaController] Erreur KDramas pour le drama ${id}: ${error.message}`);
      lastError = error;
    }
    
    // 2. DramaApi
    try {
      const result = await this.dramaApiService.getDramaById(id);
      if (result) {
        return result;
      }
    } catch (error) {
      console.log(`[DramaController] Erreur DramaApi pour le drama ${id}: ${error.message}`);
      lastError = error;
    }
    
    // 3. MyDramaList
    try {
      return await this.myDramaListService.getDrama(id);
    } catch (error) {
      console.log(`[DramaController] Erreur MyDramaList pour le drama ${id}: ${error.message}`);
      lastError = error;
    }
    
    // Si tous les services ont échoué
    throw new Error(lastError?.message || `Drama non trouvé: ${id}`);
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
    
    // Si pas de terme de recherche, retourner un tableau vide
    if (!q) {
      return { data: [] };
    }
    
    let lastError;
    
    // 1. KDramas
    try {
      const results = await this.kDramasService.searchDramas(q, page, limit);
      if (results && results.data && results.data.length > 0) {
        console.log(`[DramaController] Recherche "${q}" via KDramas: ${results.data.length} résultats`);
        return results;
      }
    } catch (error) {
      console.log(`[DramaController] Erreur KDramas pour la recherche "${q}": ${error.message}`);
      lastError = error;
    }
    
    // 2. DramaApi
    try {
      const results = await this.dramaApiService.searchDramas({ q, page, limit });
      if (results && results.length > 0) {
        console.log(`[DramaController] Recherche "${q}" via DramaApi: ${results.length} résultats`);
        return { 
          data: results,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(results.length / limit),
            total_results: results.length
          }
        };
      }
    } catch (error) {
      console.log(`[DramaController] Erreur DramaApi pour la recherche "${q}": ${error.message}`);
      lastError = error;
    }
    
    // 3. MyDramaList
    try {
      const results = await this.myDramaListService.searchDramas(q, page);
      if (results && results.data && results.data.length > 0) {
        console.log(`[DramaController] Recherche "${q}" via MyDramaList: ${results.data.length} résultats`);
        return results;
      }
    } catch (error) {
      console.log(`[DramaController] Erreur MyDramaList pour la recherche "${q}": ${error.message}`);
      lastError = error;
    }
    
    // En cas d'échec de tous les services
    console.log(`[DramaController] Aucun résultat trouvé pour la recherche "${q}"`);
    return { data: [] };
  }

  /**
   * Récupère les dramas en tendance
   * @param {number} limit - Le nombre de dramas à récupérer
   * @returns {Promise<Array>} - Les dramas en tendance
   */
  async getTrendingDramas(limit = 15) {
    let allResults = [];
    let errors = 0;
    
    // 1. KDramas
    try {
      const results = await this.kDramasService.getTrendingDramas(limit);
      if (results && results.length > 0) {
        allResults = allResults.concat(results);
        console.log(`[DramaController] Tendances via KDramas: ${results.length} dramas`);
      }
    } catch (error) {
      console.log(`[DramaController] Erreur KDramas pour les tendances: ${error.message}`);
      errors++;
    }
    
    // 2. DramaApi
    try {
      const results = await this.dramaApiService.getPopularDramas(limit);
      if (results && results.length > 0) {
        // Marquer comme tendance
        const enhancedResults = results.map(drama => {
          return { ...drama, is_trending: true };
        });
        allResults = allResults.concat(enhancedResults);
        console.log(`[DramaController] Tendances via DramaApi: ${results.length} dramas`);
      }
    } catch (error) {
      console.log(`[DramaController] Erreur DramaApi pour les tendances: ${error.message}`);
      errors++;
    }
    
    // 3. MyDramaList (seulement si nous avons peu de résultats)
    if (allResults.length < limit) {
      try {
        const results = await this.myDramaListService.getTrendingDramas(limit);
        if (results && results.length > 0) {
          allResults = allResults.concat(results);
          console.log(`[DramaController] Tendances via MyDramaList: ${results.length} dramas`);
        }
      } catch (error) {
        console.log(`[DramaController] Erreur MyDramaList pour les tendances: ${error.message}`);
        errors++;
      }
    }
    
    // Dédupliquer les résultats par ID
    const uniqueResults = this._deduplicateResults(allResults);
    
    // Si nous avons des résultats, les retourner (limités au nombre demandé)
    if (uniqueResults.length > 0) {
      return uniqueResults.slice(0, limit);
    }
    
    // Si tous les services ont échoué
    if (errors === 3) {
      console.log(`[DramaController] Tous les services ont échoué pour les tendances`);
    }
    
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
    let allResults = [];
    let errors = 0;
    
    // 1. KDramas
    try {
      const results = await this.kDramasService.getPopularDramas(limit);
      if (results && results.length > 0) {
        allResults = allResults.concat(results);
        console.log(`[DramaController] Populaires via KDramas: ${results.length} dramas`);
      }
    } catch (error) {
      console.log(`[DramaController] Erreur KDramas pour les populaires: ${error.message}`);
      errors++;
    }
    
    // 2. DramaApi (source prioritaire pour les contenus asiatiques)
    try {
      const results = await this.dramaApiService.getPopularDramas(limit);
      if (results && results.length > 0) {
        allResults = allResults.concat(results);
        console.log(`[DramaController] Populaires via DramaApi: ${results.length} dramas`);
      }
    } catch (error) {
      console.log(`[DramaController] Erreur DramaApi pour les populaires: ${error.message}`);
      errors++;
    }
    
    // 3. MyDramaList (seulement si nous avons peu de résultats)
    if (allResults.length < limit) {
      try {
        const results = await this.myDramaListService.getPopularDramas(limit);
        if (results && results.length > 0) {
          allResults = allResults.concat(results);
          console.log(`[DramaController] Populaires via MyDramaList: ${results.length} dramas`);
        }
      } catch (error) {
        console.log(`[DramaController] Erreur MyDramaList pour les populaires: ${error.message}`);
        errors++;
      }
    }
    
    // Dédupliquer les résultats par ID
    const uniqueResults = this._deduplicateResults(allResults);
    
    // Si nous avons des résultats, les retourner (limités au nombre demandé)
    if (uniqueResults.length > 0) {
      return uniqueResults.slice(0, limit);
    }
    
    // Si tous les services ont échoué
    if (errors === 3) {
      console.log(`[DramaController] Tous les services ont échoué pour les populaires`);
    }
    
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
  
  /**
   * Déduplique les résultats par ID
   * @param {Array} results - Les résultats à dédupliquer
   * @returns {Array} - Les résultats dédupliqués
   * @private
   */
  _deduplicateResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
      return [];
    }
    
    const uniqueMap = new Map();
    
    results.forEach(drama => {
      // Utiliser l'ID comme clé pour la déduplication
      const id = drama.id || drama.drama_id;
      if (id && !uniqueMap.has(id)) {
        uniqueMap.set(id, drama);
      }
    });
    
    return Array.from(uniqueMap.values());
  }
}

module.exports = DramaController;
