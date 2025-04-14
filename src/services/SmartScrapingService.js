/**
 * Service de scraping intelligent pour FloDrama
 * Permet de rechercher du contenu via Elasticsearch ou d'autres sources
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class SmartScrapingService {
  /**
   * Effectue une recherche rapide via Elasticsearch
   * @param {string} query - Terme de recherche
   * @param {string} type - Type de contenu (drama, anime, movie, all)
   * @param {Object} options - Options de recherche (taille, tri, etc.)
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async searchFast(query, type = 'all', options = {}) {
    try {
      // Paramètres par défaut
      const params = {
        q: query,
        type: type,
        size: options.size || 20,
        sort: options.sort || '_score',
        from: options.from || 0
      };

      // Appel à l'API de recherche
      const response = await axios.get(`${API_BASE_URL}/search`, { params });
      
      // Vérifier si la réponse est valide
      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche rapide:', error);
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }

  /**
   * Récupère les suggestions de recherche basées sur un terme partiel
   * @param {string} term - Terme partiel de recherche
   * @param {number} limit - Nombre maximum de suggestions
   * @returns {Promise<Array>} - Suggestions de recherche
   */
  static async getSuggestions(term, limit = 5) {
    try {
      if (!term || term.length < 2) {
        return [];
      }
      
      const response = await axios.get(`${API_BASE_URL}/suggestions`, {
        params: { term, limit }
      });
      
      if (response.data && Array.isArray(response.data.suggestions)) {
        return response.data.suggestions;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      return [];
    }
  }

  /**
   * Récupère les tendances de recherche actuelles
   * @param {number} limit - Nombre maximum de tendances
   * @returns {Promise<Array>} - Tendances de recherche
   */
  static async getTrends(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/trends`, {
        params: { limit }
      });
      
      if (response.data && Array.isArray(response.data.trends)) {
        return response.data.trends;
      }
      
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances:', error);
      return [];
    }
  }
}

export default SmartScrapingService;
