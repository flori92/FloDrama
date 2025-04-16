/**
 * Module d'authentification principal pour FloDrama
 * 
 * Ce module gère l'authentification des utilisateurs avec MongoDB Atlas
 * et fournit un fallback vers le stockage local en cas d'indisponibilité de l'API
 */

import authStorage from './auth-storage.js';
import authApi from './auth-api.js';

class Auth {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;
    
    // Initialiser l'état d'authentification
    this.init();
  }
  
  /**
   * Initialise le module d'authentification
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Tenter de récupérer l'utilisateur depuis l'API
      const user = await authApi.getCurrentUser();
      
      if (user) {
        this.currentUser = user;
        this.notifyAuthStateChanged(user);
      } else {
        // Fallback: récupérer l'utilisateur depuis le stockage local
        const localUser = authStorage.getUser();
        
        if (localUser) {
          this.currentUser = localUser;
          this.notifyAuthStateChanged(localUser);
        }
      }
    } catch (error) {
      console.warn('Erreur lors de l\'initialisation de l\'authentification avec l\'API, utilisation du stockage local', error);
      
      // Fallback: récupérer l'utilisateur depuis le stockage local
      const localUser = authStorage.getUser();
      
      if (localUser) {
        this.currentUser = localUser;
        this.notifyAuthStateChanged(localUser);
      }
    } finally {
      this.isInitialized = true;
    }
  }
  
  /**
   * Enregistre un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur (nom, email, mot de passe)
   * @returns {Promise<Object>} Utilisateur enregistré
   */
  async register(userData) {
    try {
      // Tenter d'enregistrer l'utilisateur via l'API
      const result = await authApi.register(userData);
      
      if (result && result.user) {
        this.currentUser = result.user;
        authStorage.saveUser(result.user);
        this.notifyAuthStateChanged(result.user);
        return result.user;
      }
    } catch (error) {
      console.warn('Erreur lors de l\'enregistrement avec l\'API, utilisation du stockage local', error);
      
      // Fallback: enregistrer l'utilisateur localement
      try {
        const user = authStorage.registerUser(userData);
        this.currentUser = user;
        this.notifyAuthStateChanged(user);
        return user;
      } catch (localError) {
        throw localError;
      }
    }
  }
  
  /**
   * Connecte un utilisateur existant
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} Utilisateur connecté
   */
  async login(email, password) {
    try {
      // Tenter de connecter l'utilisateur via l'API
      const result = await authApi.login({ email, password });
      
      if (result && result.user) {
        this.currentUser = result.user;
        authStorage.saveUser(result.user);
        this.notifyAuthStateChanged(result.user);
        return result.user;
      }
    } catch (error) {
      console.warn('Erreur lors de la connexion avec l\'API, utilisation du stockage local', error);
      
      // Fallback: connecter l'utilisateur localement
      try {
        const user = authStorage.loginUser(email, password);
        this.currentUser = user;
        this.notifyAuthStateChanged(user);
        return user;
      } catch (localError) {
        throw localError;
      }
    }
  }
  
  /**
   * Déconnecte l'utilisateur actuel
   */
  async logout() {
    try {
      // Tenter de déconnecter l'utilisateur via l'API
      await authApi.logout();
    } catch (error) {
      console.warn('Erreur lors de la déconnexion avec l\'API', error);
    } finally {
      // Toujours effacer les données locales
      authStorage.clearUser();
      this.currentUser = null;
      this.notifyAuthStateChanged(null);
    }
  }
  
  /**
   * Récupère l'utilisateur actuellement connecté
   * @returns {Object|null} Utilisateur connecté ou null
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Met à jour le profil de l'utilisateur
   * @param {Object} profileData - Données du profil à mettre à jour
   * @returns {Promise<Object>} Profil mis à jour
   */
  async updateProfile(profileData) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    try {
      // Tenter de mettre à jour le profil via l'API
      const updatedUser = await authApi.updateProfile(profileData);
      
      if (updatedUser) {
        this.currentUser = { ...this.currentUser, ...updatedUser };
        authStorage.updateUser(this.currentUser);
        this.notifyAuthStateChanged(this.currentUser);
        return this.currentUser;
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du profil avec l\'API, utilisation du stockage local', error);
      
      // Fallback: mettre à jour le profil localement
      const updatedUser = authStorage.updateUser({ ...this.currentUser, ...profileData });
      this.currentUser = updatedUser;
      this.notifyAuthStateChanged(updatedUser);
      return updatedUser;
    }
  }
  
  /**
   * Met à jour le mot de passe de l'utilisateur
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<boolean>} True si la mise à jour a réussi
   */
  async updatePassword(currentPassword, newPassword) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    try {
      // Tenter de mettre à jour le mot de passe via l'API
      const result = await authApi.updatePassword({
        currentPassword,
        newPassword
      });
      
      return !!result;
    } catch (error) {
      console.warn('Erreur lors de la mise à jour du mot de passe avec l\'API, utilisation du stockage local', error);
      
      // Fallback: mettre à jour le mot de passe localement
      return authStorage.updatePassword(currentPassword, newPassword);
    }
  }
  
  /**
   * Met à jour les préférences de l'utilisateur
   * @param {Object} preferences - Préférences à mettre à jour
   * @returns {Promise<Object>} Préférences mises à jour
   */
  async updatePreferences(preferences) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    // Mettre à jour les préférences dans le profil
    return this.updateProfile({ preferences });
  }
  
  /**
   * Ajoute un contenu aux favoris
   * @param {string|number} contentId - ID du contenu à ajouter
   * @returns {Promise<Array>} Liste des favoris mise à jour
   */
  async addToFavorites(contentId) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    try {
      // Tenter d'ajouter aux favoris via l'API
      const favorites = await authApi.manageFavorites(contentId, 'add');
      
      if (favorites) {
        this.currentUser.favorites = favorites;
        authStorage.updateUser(this.currentUser);
        this.notifyAuthStateChanged(this.currentUser);
        return favorites;
      }
    } catch (error) {
      console.warn('Erreur lors de l\'ajout aux favoris avec l\'API, utilisation du stockage local', error);
      
      // Fallback: ajouter aux favoris localement
      const favorites = authStorage.addToFavorites(contentId);
      this.currentUser.favorites = favorites;
      this.notifyAuthStateChanged(this.currentUser);
      return favorites;
    }
  }
  
  /**
   * Supprime un contenu des favoris
   * @param {string|number} contentId - ID du contenu à supprimer
   * @returns {Promise<Array>} Liste des favoris mise à jour
   */
  async removeFromFavorites(contentId) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    try {
      // Tenter de supprimer des favoris via l'API
      const favorites = await authApi.manageFavorites(contentId, 'remove');
      
      if (favorites) {
        this.currentUser.favorites = favorites;
        authStorage.updateUser(this.currentUser);
        this.notifyAuthStateChanged(this.currentUser);
        return favorites;
      }
    } catch (error) {
      console.warn('Erreur lors de la suppression des favoris avec l\'API, utilisation du stockage local', error);
      
      // Fallback: supprimer des favoris localement
      const favorites = authStorage.removeFromFavorites(contentId);
      this.currentUser.favorites = favorites;
      this.notifyAuthStateChanged(this.currentUser);
      return favorites;
    }
  }
  
  /**
   * Met à jour l'historique de visionnage
   * @param {string|number} contentId - ID du contenu
   * @param {number} progress - Progression du visionnage (0-100)
   * @returns {Promise<Array>} Historique de visionnage mis à jour
   */
  async updateWatchHistory(contentId, progress) {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }
    
    try {
      // Tenter de mettre à jour l'historique via l'API
      const watchHistory = await authApi.updateWatchHistory(contentId, progress);
      
      if (watchHistory) {
        this.currentUser.watchHistory = watchHistory;
        authStorage.updateUser(this.currentUser);
        this.notifyAuthStateChanged(this.currentUser);
        return watchHistory;
      }
    } catch (error) {
      console.warn('Erreur lors de la mise à jour de l\'historique avec l\'API, utilisation du stockage local', error);
      
      // Fallback: mettre à jour l'historique localement
      const watchHistory = authStorage.updateWatchHistory(contentId, progress);
      this.currentUser.watchHistory = watchHistory;
      this.notifyAuthStateChanged(this.currentUser);
      return watchHistory;
    }
  }
  
  /**
   * Ajoute un écouteur pour les changements d'état d'authentification
   * @param {Function} listener - Fonction à appeler lors d'un changement d'état
   */
  addAuthStateListener(listener) {
    if (typeof listener === 'function' && !this.authStateListeners.includes(listener)) {
      this.authStateListeners.push(listener);
    }
  }
  
  /**
   * Supprime un écouteur pour les changements d'état d'authentification
   * @param {Function} listener - Fonction à supprimer
   */
  removeAuthStateListener(listener) {
    this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
  }
  
  /**
   * Notifie tous les écouteurs d'un changement d'état d'authentification
   * @param {Object|null} user - Utilisateur connecté ou null
   */
  notifyAuthStateChanged(user) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Erreur dans un écouteur d\'authentification', error);
      }
    });
  }
}

// Exporter une instance unique du module d'authentification
const auth = new Auth();
export default auth;
