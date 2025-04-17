/**
 * Service de gestion des données utilisateur pour FloDrama
 * 
 * Ce service gère toutes les données liées à l'utilisateur, y compris :
 * - Préférences et paramètres
 * - Historique de visionnage
 * - Liste personnelle
 * - Progression de visionnage
 * 
 * Il utilise IndexedDB pour le stockage local et la synchronisation
 * avec le serveur lorsque l'utilisateur est connecté.
 */

import indexedDBManager from '../utils/indexedDBManager';
import cacheManager from '../utils/cacheManager';

// Configuration
const CONFIG = {
  // Stores IndexedDB
  stores: {
    watchHistory: 'user',
    watchlist: 'user',
    watchProgress: 'user',
    preferences: 'settings'
  },
  
  // Préfixes des clés
  keyPrefix: {
    watchHistory: 'history_',
    watchlist: 'watchlist_',
    watchProgress: 'progress_',
    preferences: 'pref_'
  },
  
  // Limites
  limits: {
    watchHistoryMaxItems: 100,
    watchlistMaxItems: 500
  }
};

/**
 * Classe de gestion des données utilisateur
 */
class UserDataService {
  constructor() {
    this.initialized = false;
    this.userId = null;
    this.isLoggedIn = false;
    this.pendingSyncs = [];
    
    // Initialiser le service au chargement
    this.init();
  }
  
  /**
   * Initialise le service
   * @returns {Promise<boolean>} - true si l'initialisation a réussi
   */
  async init() {
    try {
      if (this.initialized) return true;
      
      console.log('Initialisation du service de données utilisateur...');
      
      // Vérifier si l'utilisateur est connecté
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      this.userId = localStorage.getItem('userId') || 'guest';
      
      // Charger les préférences utilisateur
      await this.loadPreferences();
      
      // Écouter les événements de connexion/déconnexion
      window.addEventListener('flodrama:user-login', this.handleUserLogin.bind(this));
      window.addEventListener('flodrama:user-logout', this.handleUserLogout.bind(this));
      
      // Écouter les événements de synchronisation
      window.addEventListener('online', this.syncWithServer.bind(this));
      
      this.initialized = true;
      console.log('Service de données utilisateur initialisé avec succès');
      
      // Émettre un événement d'initialisation
      window.dispatchEvent(new CustomEvent('flodrama:user-data-initialized', {
        detail: { userId: this.userId, isLoggedIn: this.isLoggedIn }
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service de données utilisateur:', error);
      return false;
    }
  }
  
  /**
   * Charge les préférences utilisateur
   * @private
   */
  async loadPreferences() {
    try {
      const key = `${CONFIG.keyPrefix.preferences}${this.userId}`;
      const store = CONFIG.stores.preferences;
      
      // Essayer de charger depuis IndexedDB
      let preferences = await indexedDBManager.getItem(store, key);
      
      // Si non trouvé, essayer le cache local
      if (!preferences) {
        preferences = cacheManager.getCache(key, 'user');
      }
      
      // Si toujours non trouvé, utiliser les valeurs par défaut
      if (!preferences) {
        preferences = this.getDefaultPreferences();
        
        // Sauvegarder les préférences par défaut
        await this.savePreferences(preferences);
      }
      
      this.preferences = preferences;
      
      return preferences;
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      this.preferences = this.getDefaultPreferences();
      return this.preferences;
    }
  }
  
  /**
   * Retourne les préférences par défaut
   * @returns {Object} - Préférences par défaut
   * @private
   */
  getDefaultPreferences() {
    return {
      theme: 'dark',
      language: 'fr',
      subtitlesEnabled: true,
      subtitlesLanguage: 'fr',
      autoplayEnabled: true,
      videoQuality: 'auto',
      notifications: {
        newEpisodes: true,
        recommendations: true
      },
      contentFilters: {
        hideExplicitContent: false,
        genrePreferences: []
      }
    };
  }
  
  /**
   * Gère l'événement de connexion utilisateur
   * @param {CustomEvent} event - Événement de connexion
   * @private
   */
  async handleUserLogin(event) {
    try {
      if (!event || !event.detail || !event.detail.userId) return;
      
      const newUserId = event.detail.userId;
      
      // Mettre à jour l'état
      this.isLoggedIn = true;
      this.userId = newUserId;
      
      // Stocker dans localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userId', newUserId);
      
      // Charger les préférences du nouvel utilisateur
      await this.loadPreferences();
      
      // Synchroniser avec le serveur
      this.syncWithServer();
      
      console.log(`Utilisateur connecté: ${newUserId}`);
    } catch (error) {
      console.error('Erreur lors de la gestion de la connexion utilisateur:', error);
    }
  }
  
  /**
   * Gère l'événement de déconnexion utilisateur
   * @private
   */
  async handleUserLogout() {
    try {
      // Mettre à jour l'état
      this.isLoggedIn = false;
      this.userId = 'guest';
      
      // Stocker dans localStorage
      localStorage.setItem('isLoggedIn', 'false');
      localStorage.setItem('userId', 'guest');
      
      // Charger les préférences invité
      await this.loadPreferences();
      
      console.log('Utilisateur déconnecté');
    } catch (error) {
      console.error('Erreur lors de la gestion de la déconnexion utilisateur:', error);
    }
  }
  
  /**
   * Synchronise les données avec le serveur
   * @returns {Promise<boolean>} - true si la synchronisation a réussi
   */
  async syncWithServer() {
    // Ne pas synchroniser si l'utilisateur n'est pas connecté
    if (!this.isLoggedIn) return false;
    
    // Ne pas synchroniser si hors ligne
    if (!navigator.onLine) {
      // Ajouter à la file d'attente pour synchronisation ultérieure
      this.pendingSyncs.push('all');
      return false;
    }
    
    try {
      console.log('Synchronisation des données utilisateur avec le serveur...');
      
      // Simuler une synchronisation réussie
      // Dans une vraie application, il faudrait appeler l'API
      
      // Vider la file d'attente
      this.pendingSyncs = [];
      
      console.log('Synchronisation terminée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec le serveur:', error);
      return false;
    }
  }
  
  // ===== PRÉFÉRENCES UTILISATEUR =====
  
  /**
   * Récupère les préférences utilisateur
   * @returns {Object} - Préférences utilisateur
   */
  async getPreferences() {
    if (!this.preferences) {
      await this.loadPreferences();
    }
    
    return this.preferences;
  }
  
  /**
   * Enregistre les préférences utilisateur
   * @param {Object} preferences - Préférences à enregistrer
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async savePreferences(preferences) {
    try {
      const key = `${CONFIG.keyPrefix.preferences}${this.userId}`;
      const store = CONFIG.stores.preferences;
      
      // Mettre à jour l'état local
      this.preferences = preferences;
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, preferences);
      
      // Enregistrer dans le cache local pour un accès rapide
      cacheManager.setCache(key, preferences, 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('preferences');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      // Émettre un événement de mise à jour
      window.dispatchEvent(new CustomEvent('flodrama:preferences-updated', {
        detail: { preferences }
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des préférences:', error);
      return false;
    }
  }
  
  /**
   * Met à jour une préférence spécifique
   * @param {string} key - Clé de la préférence
   * @param {any} value - Nouvelle valeur
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async updatePreference(key, value) {
    try {
      if (!this.preferences) {
        await this.loadPreferences();
      }
      
      // Mettre à jour la préférence
      const keys = key.split('.');
      let current = this.preferences;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Enregistrer les préférences
      return await this.savePreferences(this.preferences);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la préférence ${key}:`, error);
      return false;
    }
  }
  
  // ===== HISTORIQUE DE VISIONNAGE =====
  
  /**
   * Récupère l'historique de visionnage
   * @param {number} limit - Nombre maximum d'éléments à récupérer
   * @returns {Promise<Array>} - Historique de visionnage
   */
  async getWatchHistory(limit = 20) {
    try {
      const key = `${CONFIG.keyPrefix.watchHistory}${this.userId}`;
      const store = CONFIG.stores.watchHistory;
      
      // Récupérer depuis IndexedDB
      let history = await indexedDBManager.getItem(store, key);
      
      // Si non trouvé, essayer le cache local
      if (!history) {
        history = cacheManager.getCache(key, 'user');
      }
      
      // Si toujours non trouvé, retourner un tableau vide
      if (!history || !Array.isArray(history)) {
        history = [];
      }
      
      // Limiter le nombre d'éléments
      return history.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de visionnage:', error);
      return [];
    }
  }
  
  /**
   * Ajoute un élément à l'historique de visionnage
   * @param {string} contentId - ID du contenu
   * @param {string} episodeId - ID de l'épisode (optionnel)
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async addToWatchHistory(contentId, episodeId = null) {
    try {
      const key = `${CONFIG.keyPrefix.watchHistory}${this.userId}`;
      const store = CONFIG.stores.watchHistory;
      
      // Récupérer l'historique actuel
      let history = await indexedDBManager.getItem(store, key) || [];
      
      // Créer le nouvel élément
      const newItem = {
        contentId,
        episodeId,
        timestamp: Date.now()
      };
      
      // Vérifier si l'élément existe déjà
      const existingIndex = history.findIndex(item => 
        item.contentId === contentId && 
        (episodeId === null || item.episodeId === episodeId)
      );
      
      if (existingIndex !== -1) {
        // Mettre à jour l'élément existant
        history[existingIndex] = newItem;
      } else {
        // Ajouter le nouvel élément au début
        history.unshift(newItem);
      }
      
      // Limiter la taille de l'historique
      if (history.length > CONFIG.limits.watchHistoryMaxItems) {
        history = history.slice(0, CONFIG.limits.watchHistoryMaxItems);
      }
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, history);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, history, 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchHistory');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique de visionnage:', error);
      return false;
    }
  }
  
  /**
   * Supprime un élément de l'historique de visionnage
   * @param {string} contentId - ID du contenu
   * @param {string} episodeId - ID de l'épisode (optionnel)
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async removeFromWatchHistory(contentId, episodeId = null) {
    try {
      const key = `${CONFIG.keyPrefix.watchHistory}${this.userId}`;
      const store = CONFIG.stores.watchHistory;
      
      // Récupérer l'historique actuel
      let history = await indexedDBManager.getItem(store, key) || [];
      
      // Filtrer l'élément à supprimer
      history = history.filter(item => 
        item.contentId !== contentId || 
        (episodeId !== null && item.episodeId !== episodeId)
      );
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, history);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, history, 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchHistory');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique de visionnage:', error);
      return false;
    }
  }
  
  /**
   * Vide l'historique de visionnage
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async clearWatchHistory() {
    try {
      const key = `${CONFIG.keyPrefix.watchHistory}${this.userId}`;
      const store = CONFIG.stores.watchHistory;
      
      // Enregistrer un tableau vide dans IndexedDB
      await indexedDBManager.setItem(store, key, []);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, [], 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchHistory');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du vidage de l\'historique de visionnage:', error);
      return false;
    }
  }
  
  // ===== LISTE PERSONNELLE =====
  
  /**
   * Récupère la liste personnelle
   * @returns {Promise<Array>} - Liste personnelle
   */
  async getWatchlist() {
    try {
      const key = `${CONFIG.keyPrefix.watchlist}${this.userId}`;
      const store = CONFIG.stores.watchlist;
      
      // Récupérer depuis IndexedDB
      let watchlist = await indexedDBManager.getItem(store, key);
      
      // Si non trouvé, essayer le cache local
      if (!watchlist) {
        watchlist = cacheManager.getCache(key, 'user');
      }
      
      // Si toujours non trouvé, retourner un tableau vide
      if (!watchlist || !Array.isArray(watchlist)) {
        watchlist = [];
      }
      
      return watchlist;
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste personnelle:', error);
      return [];
    }
  }
  
  /**
   * Ajoute un élément à la liste personnelle
   * @param {Object} content - Élément à ajouter
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async addToWatchlist(content) {
    try {
      if (!content || !content.id) {
        console.error('Contenu invalide pour ajout à la liste personnelle');
        return false;
      }
      
      const key = `${CONFIG.keyPrefix.watchlist}${this.userId}`;
      const store = CONFIG.stores.watchlist;
      
      // Récupérer la liste actuelle
      let watchlist = await indexedDBManager.getItem(store, key) || [];
      
      // Vérifier si l'élément existe déjà
      const existingIndex = watchlist.findIndex(item => item.id === content.id);
      
      if (existingIndex !== -1) {
        // L'élément existe déjà
        return true;
      }
      
      // Ajouter le nouvel élément
      watchlist.push({
        ...content,
        addedAt: Date.now()
      });
      
      // Limiter la taille de la liste
      if (watchlist.length > CONFIG.limits.watchlistMaxItems) {
        watchlist = watchlist.slice(0, CONFIG.limits.watchlistMaxItems);
      }
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, watchlist);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, watchlist, 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchlist');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      // Émettre un événement
      window.dispatchEvent(new CustomEvent('flodrama:watchlist-updated', {
        detail: { action: 'add', content }
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste personnelle:', error);
      return false;
    }
  }
  
  /**
   * Supprime un élément de la liste personnelle
   * @param {string} contentId - ID du contenu à supprimer
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async removeFromWatchlist(contentId) {
    try {
      const key = `${CONFIG.keyPrefix.watchlist}${this.userId}`;
      const store = CONFIG.stores.watchlist;
      
      // Récupérer la liste actuelle
      let watchlist = await indexedDBManager.getItem(store, key) || [];
      
      // Trouver l'élément à supprimer
      const existingIndex = watchlist.findIndex(item => item.id === contentId);
      
      if (existingIndex === -1) {
        // L'élément n'existe pas
        return true;
      }
      
      // Supprimer l'élément
      const removedContent = watchlist[existingIndex];
      watchlist.splice(existingIndex, 1);
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, watchlist);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, watchlist, 'user');
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchlist');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      // Émettre un événement
      window.dispatchEvent(new CustomEvent('flodrama:watchlist-updated', {
        detail: { action: 'remove', content: removedContent }
      }));
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la liste personnelle:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si un contenu est dans la liste personnelle
   * @param {string} contentId - ID du contenu
   * @returns {Promise<boolean>} - true si le contenu est dans la liste
   */
  async isInWatchlist(contentId) {
    try {
      const watchlist = await this.getWatchlist();
      return watchlist.some(item => item.id === contentId);
    } catch (error) {
      console.error('Erreur lors de la vérification de la liste personnelle:', error);
      return false;
    }
  }
  
  // ===== PROGRESSION DE VISIONNAGE =====
  
  /**
   * Enregistre la progression de visionnage
   * @param {string} contentId - ID du contenu
   * @param {string} episodeId - ID de l'épisode (optionnel)
   * @param {number} position - Position en secondes
   * @param {number} duration - Durée totale en secondes
   * @returns {Promise<boolean>} - true si l'opération a réussi
   */
  async saveWatchProgress(contentId, episodeId, position, duration) {
    try {
      const key = `${CONFIG.keyPrefix.watchProgress}${this.userId}`;
      const store = CONFIG.stores.watchProgress;
      
      // Récupérer les progressions actuelles
      let progressData = await indexedDBManager.getItem(store, key) || {};
      
      // Créer l'identifiant unique pour ce contenu/épisode
      const itemKey = episodeId ? `${contentId}_${episodeId}` : contentId;
      
      // Mettre à jour la progression
      progressData[itemKey] = {
        contentId,
        episodeId,
        position,
        duration,
        percent: Math.round((position / duration) * 100),
        timestamp: Date.now(),
        completed: position >= duration * 0.9 // Considéré comme terminé si > 90%
      };
      
      // Enregistrer dans IndexedDB
      await indexedDBManager.setItem(store, key, progressData);
      
      // Enregistrer dans le cache local
      cacheManager.setCache(key, progressData, 'user');
      
      // Si terminé, ajouter à l'historique
      if (progressData[itemKey].completed) {
        await this.addToWatchHistory(contentId, episodeId);
      }
      
      // Ajouter à la file d'attente pour synchronisation
      if (this.isLoggedIn) {
        this.pendingSyncs.push('watchProgress');
        
        // Synchroniser si en ligne
        if (navigator.onLine) {
          this.syncWithServer();
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la progression:', error);
      return false;
    }
  }
  
  /**
   * Récupère la progression de visionnage
   * @param {string} contentId - ID du contenu
   * @param {string} episodeId - ID de l'épisode (optionnel)
   * @returns {Promise<Object|null>} - Données de progression ou null si non trouvé
   */
  async getWatchProgress(contentId, episodeId = null) {
    try {
      const key = `${CONFIG.keyPrefix.watchProgress}${this.userId}`;
      const store = CONFIG.stores.watchProgress;
      
      // Récupérer les progressions
      let progressData = await indexedDBManager.getItem(store, key);
      
      // Si non trouvé, essayer le cache local
      if (!progressData) {
        progressData = cacheManager.getCache(key, 'user');
      }
      
      // Si toujours non trouvé, retourner null
      if (!progressData) {
        return null;
      }
      
      // Créer l'identifiant unique pour ce contenu/épisode
      const itemKey = episodeId ? `${contentId}_${episodeId}` : contentId;
      
      // Retourner la progression
      return progressData[itemKey] || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
      return null;
    }
  }
  
  /**
   * Récupère toutes les progressions pour un contenu
   * @param {string} contentId - ID du contenu
   * @returns {Promise<Array>} - Liste des progressions
   */
  async getAllProgressForContent(contentId) {
    try {
      const key = `${CONFIG.keyPrefix.watchProgress}${this.userId}`;
      const store = CONFIG.stores.watchProgress;
      
      // Récupérer les progressions
      let progressData = await indexedDBManager.getItem(store, key);
      
      // Si non trouvé, essayer le cache local
      if (!progressData) {
        progressData = cacheManager.getCache(key, 'user');
      }
      
      // Si toujours non trouvé, retourner un tableau vide
      if (!progressData) {
        return [];
      }
      
      // Filtrer les progressions pour ce contenu
      const contentProgress = Object.values(progressData).filter(
        progress => progress.contentId === contentId
      );
      
      return contentProgress;
    } catch (error) {
      console.error('Erreur lors de la récupération des progressions:', error);
      return [];
    }
  }
}

// Créer et exporter l'instance unique
const userDataService = new UserDataService();
export default userDataService;
