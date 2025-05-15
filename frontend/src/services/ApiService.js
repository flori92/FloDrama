/**
 * Service centralisé pour les appels API de FloDrama
 * Ce service gère tous les appels à l'API backend avec gestion d'erreur et fallback
 */

import axios from 'axios';
import { API_BASE_URL, FALLBACK_API_URL } from '../Cloudflare/CloudflareConfig';

// Création d'une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token JWT aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Gestion des erreurs 401 (non autorisé) - token expiré
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Tentative de rafraîchissement du token
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { 
            refreshToken 
          });
          
          if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
        
        // Si pas de refresh token ou échec du refresh, rediriger vers login
        window.location.href = '/signin';
        return Promise.reject(error);
      } catch (refreshError) {
        console.error('Échec du rafraîchissement du token:', refreshError);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }
    
    // Autres erreurs
    return Promise.reject(error);
  }
);

/**
 * Classe principale du service API
 */
class ApiService {
  /**
   * Récupère les contenus en tendance pour une catégorie spécifique
   * @param {string} category - anime, drama, film, bollywood ou all
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des contenus
   */
  async getTrending(category = 'all', limit = 24) {
    try {
      if (category === 'all') {
        // Agrégation de toutes les catégories
        const [animeRes, dramaRes, filmRes, bollywoodRes] = await Promise.allSettled([
          api.get('/api/anime/trending'),
          api.get('/api/drama/trending'),
          api.get('/api/film/trending'),
          api.get('/api/bollywood/trending')
        ]);
        
        // Récupérer les résultats réussis
        let results = [];
        if (animeRes.status === 'fulfilled') results = [...results, ...animeRes.value.data];
        if (dramaRes.status === 'fulfilled') results = [...results, ...dramaRes.value.data];
        if (filmRes.status === 'fulfilled') results = [...results, ...filmRes.value.data];
        if (bollywoodRes.status === 'fulfilled') results = [...results, ...bollywoodRes.value.data];
        
        // Déduplication et limitation
        return this._deduplicateAndLimit(results, limit);
      } else {
        // Catégorie spécifique
        const response = await api.get(`/api/${category}/trending`);
        return response.data.slice(0, limit);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des tendances ${category}:`, error);
      // Fallback vers l'API anime qui fonctionne
      if (category !== 'anime' && category !== 'all') {
        console.warn(`Fallback vers l'API anime pour ${category}`);
        return this.getTrending('anime', limit);
      }
      throw error;
    }
  }
  
  /**
   * Récupère les contenus récents pour une catégorie spécifique
   * @param {string} category - anime, drama, film, bollywood ou all
   * @param {number} limit - Nombre d'éléments à récupérer
   * @returns {Promise<Array>} - Liste des contenus
   */
  async getRecent(category = 'all', limit = 24) {
    try {
      if (category === 'all') {
        // Agrégation de toutes les catégories
        const [animeRes, dramaRes, filmRes, bollywoodRes] = await Promise.allSettled([
          api.get('/api/anime/recent'),
          api.get('/api/drama/recent'),
          api.get('/api/film/recent'),
          api.get('/api/bollywood/recent')
        ]);
        
        // Récupérer les résultats réussis
        let results = [];
        if (animeRes.status === 'fulfilled') results = [...results, ...animeRes.value.data];
        if (dramaRes.status === 'fulfilled') results = [...results, ...dramaRes.value.data];
        if (filmRes.status === 'fulfilled') results = [...results, ...filmRes.value.data];
        if (bollywoodRes.status === 'fulfilled') results = [...results, ...bollywoodRes.value.data];
        
        // Déduplication et limitation
        return this._deduplicateAndLimit(results, limit);
      } else {
        // Catégorie spécifique
        const response = await api.get(`/api/${category}/recent`);
        return response.data.slice(0, limit);
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des contenus récents ${category}:`, error);
      // Fallback vers l'API anime qui fonctionne
      if (category !== 'anime' && category !== 'all') {
        console.warn(`Fallback vers l'API anime pour ${category}`);
        return this.getRecent('anime', limit);
      }
      throw error;
    }
  }
  
  /**
   * Récupère les détails d'un contenu spécifique
   * @param {string} category - anime, drama, film, bollywood
   * @param {string} id - Identifiant du contenu
   * @returns {Promise<Object>} - Détails du contenu
   */
  async getContentDetails(category, id) {
    try {
      const response = await api.get(`/api/${category}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du contenu ${category}/${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique de visionnage d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} - Historique de visionnage
   */
  async getUserHistory(userId) {
    try {
      const response = await api.get(`/api/users/${userId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique de l'utilisateur ${userId}:`, error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }
  
  /**
   * Ajoute un contenu à l'historique de visionnage d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} content - Contenu à ajouter à l'historique
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async addToHistory(userId, content) {
    try {
      const response = await api.post(`/api/users/${userId}/history`, content);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout à l'historique de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Récupère la liste des favoris d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Array>} - Liste des favoris
   */
  async getUserFavorites(userId) {
    try {
      const response = await api.get(`/api/users/${userId}/favorites`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des favoris de l'utilisateur ${userId}:`, error);
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }
  
  /**
   * Ajoute un contenu aux favoris d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {Object} content - Contenu à ajouter aux favoris
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async addToFavorites(userId, content) {
    try {
      const response = await api.post(`/api/users/${userId}/favorites`, content);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout aux favoris de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Supprime un contenu des favoris d'un utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} contentId - Identifiant du contenu à supprimer
   * @returns {Promise<Object>} - Résultat de l'opération
   */
  async removeFromFavorites(userId, contentId) {
    try {
      const response = await api.delete(`/api/users/${userId}/favorites/${contentId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression des favoris de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Recherche des contenus
   * @param {string} query - Terme de recherche
   * @param {string} category - Catégorie de contenu (optionnel)
   * @returns {Promise<Array>} - Résultats de recherche
   */
  async search(query, category = null) {
    try {
      let endpoint = `/api/search?q=${encodeURIComponent(query)}`;
      if (category) {
        endpoint += `&category=${category}`;
      }
      
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la recherche "${query}":`, error);
      // Fallback vers l'API anime qui fonctionne
      if (category !== 'anime' && category !== null) {
        console.warn(`Fallback vers l'API anime pour la recherche`);
        return this.search(query, 'anime');
      }
      throw error;
    }
  }
  
  /**
   * Utilitaire pour dédupliquer et limiter les résultats
   * @private
   * @param {Array} results - Résultats à traiter
   * @param {number} limit - Limite de résultats
   * @returns {Array} - Résultats dédupliqués et limités
   */
  _deduplicateAndLimit(results, limit) {
    // Déduplication par id
    const seen = new Set();
    const deduplicated = results.filter(item => {
      const id = item.id || item._id || item.slug;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    
    // Limitation
    return deduplicated.slice(0, limit);
  }
}

// Exporter une instance unique du service
export default new ApiService();
