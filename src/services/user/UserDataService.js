// Service de gestion des données utilisateur pour FloDrama
// Centralise l'accès et la persistance des données utilisateur

/**
 * Service de gestion des données utilisateur
 * @class UserDataService
 */
export class UserDataService {
  /**
   * Constructeur du service de données utilisateur
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.userDataKey - Clé pour les données utilisateur (défaut: 'user_data')
   * @param {string} config.preferencesKey - Clé pour les préférences (défaut: 'user_preferences')
   * @param {boolean} config.syncWithServer - Synchroniser avec le serveur (défaut: false)
   */
  constructor(apiService = null, storageService = null, config = {}) {
    this.apiService = apiService;
    this.storageService = storageService;
    this.userDataKey = config.userDataKey || 'user_data';
    this.preferencesKey = config.preferencesKey || 'user_preferences';
    this.syncWithServer = config.syncWithServer !== undefined ? config.syncWithServer : false;
    
    // Données utilisateur
    this.userData = {
      profile: {
        id: null,
        username: null,
        email: null,
        name: null,
        avatar: null,
        createdAt: null,
        lastLogin: null
      },
      preferences: {
        theme: 'dark',
        language: 'fr',
        subtitles: true,
        autoplay: false,
        notifications: true,
        quality: 'auto',
        contentFilters: {
          adult: false,
          violence: false
        }
      },
      subscription: {
        plan: null,
        status: null,
        expiresAt: null,
        features: []
      }
    };
    
    // Charger les données utilisateur
    this._loadUserData();
    
    console.log('UserDataService initialisé');
  }
  
  /**
   * Charger les données utilisateur
   * @private
   */
  async _loadUserData() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        const userData = await this.storageService.get(this.userDataKey);
        if (userData) {
          this.userData = this._mergeUserData(this.userData, userData);
        }
        
        // Charger les préférences séparément si elles existent
        const preferences = await this.storageService.get(this.preferencesKey);
        if (preferences) {
          this.userData.preferences = { ...this.userData.preferences, ...preferences };
        }
      } else {
        // Fallback sur localStorage
        const storedUserData = localStorage.getItem(`flodrama_${this.userDataKey}`);
        if (storedUserData) {
          this.userData = this._mergeUserData(this.userData, JSON.parse(storedUserData));
        }
        
        // Charger les préférences séparément si elles existent
        const storedPreferences = localStorage.getItem(`flodrama_${this.preferencesKey}`);
        if (storedPreferences) {
          this.userData.preferences = { 
            ...this.userData.preferences, 
            ...JSON.parse(storedPreferences) 
          };
        }
      }
      
      // Synchroniser avec le serveur si demandé
      if (this.syncWithServer && this.apiService && this.userData.profile.id) {
        await this._syncUserData();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
    }
  }
  
  /**
   * Fusionner les données utilisateur
   * @param {Object} target - Objet cible
   * @param {Object} source - Objet source
   * @returns {Object} - Objet fusionné
   * @private
   */
  _mergeUserData(target, source) {
    // Créer une copie profonde
    const result = JSON.parse(JSON.stringify(target));
    
    // Fusionner les sections
    Object.keys(source).forEach(key => {
      if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
        result[key] = { ...result[key], ...source[key] };
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }
  
  /**
   * Sauvegarder les données utilisateur
   * @private
   */
  async _saveUserData() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.userDataKey, this.userData);
        
        // Sauvegarder les préférences séparément pour un accès plus facile
        await this.storageService.set(this.preferencesKey, this.userData.preferences);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.userDataKey}`, 
          JSON.stringify(this.userData)
        );
        
        // Sauvegarder les préférences séparément
        localStorage.setItem(
          `flodrama_${this.preferencesKey}`, 
          JSON.stringify(this.userData.preferences)
        );
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('user-data-updated', {
        detail: { userData: this.userData }
      });
      document.dispatchEvent(event);
      
      // Synchroniser avec le serveur si demandé
      if (this.syncWithServer && this.apiService && this.userData.profile.id) {
        await this._syncUserData();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données utilisateur:', error);
    }
  }
  
  /**
   * Synchroniser les données utilisateur avec le serveur
   * @private
   */
  async _syncUserData() {
    if (!this.apiService || !this.userData.profile.id) {
      return;
    }
    
    try {
      // Envoyer les préférences au serveur
      await this.apiService.put(`/users/${this.userData.profile.id}/preferences`, {
        preferences: this.userData.preferences
      });
      
      console.log('Données utilisateur synchronisées avec le serveur');
    } catch (error) {
      console.error('Erreur lors de la synchronisation des données utilisateur:', error);
    }
  }
  
  /**
   * Définir les données de profil utilisateur
   * @param {Object} profileData - Données de profil
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async setProfileData(profileData) {
    if (!profileData) {
      console.error('Données de profil non fournies');
      return false;
    }
    
    try {
      // Mettre à jour le profil
      this.userData.profile = {
        ...this.userData.profile,
        ...profileData,
        lastUpdated: new Date().toISOString()
      };
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log('Profil utilisateur mis à jour');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return false;
    }
  }
  
  /**
   * Définir les préférences utilisateur
   * @param {Object} preferences - Préférences
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async setPreferences(preferences) {
    if (!preferences) {
      console.error('Préférences non fournies');
      return false;
    }
    
    try {
      // Mettre à jour les préférences
      this.userData.preferences = {
        ...this.userData.preferences,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log('Préférences utilisateur mises à jour');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      return false;
    }
  }
  
  /**
   * Définir une préférence spécifique
   * @param {string} key - Clé de préférence
   * @param {*} value - Valeur de préférence
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async setPreference(key, value) {
    if (!key) {
      console.error('Clé de préférence non fournie');
      return false;
    }
    
    try {
      // Mettre à jour la préférence
      this.userData.preferences[key] = value;
      this.userData.preferences.lastUpdated = new Date().toISOString();
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log(`Préférence '${key}' mise à jour`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la préférence '${key}':`, error);
      return false;
    }
  }
  
  /**
   * Définir les données d'abonnement
   * @param {Object} subscriptionData - Données d'abonnement
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async setSubscriptionData(subscriptionData) {
    if (!subscriptionData) {
      console.error('Données d\'abonnement non fournies');
      return false;
    }
    
    try {
      // Mettre à jour l'abonnement
      this.userData.subscription = {
        ...this.userData.subscription,
        ...subscriptionData,
        lastUpdated: new Date().toISOString()
      };
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log('Données d\'abonnement mises à jour');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données d\'abonnement:', error);
      return false;
    }
  }
  
  /**
   * Obtenir les données utilisateur complètes
   * @returns {Object} - Données utilisateur
   */
  getUserData() {
    return { ...this.userData };
  }
  
  /**
   * Obtenir les données de profil
   * @returns {Object} - Données de profil
   */
  getProfileData() {
    return { ...this.userData.profile };
  }
  
  /**
   * Obtenir les préférences utilisateur
   * @returns {Object} - Préférences utilisateur
   */
  getPreferences() {
    return { ...this.userData.preferences };
  }
  
  /**
   * Obtenir une préférence spécifique
   * @param {string} key - Clé de préférence
   * @param {*} defaultValue - Valeur par défaut
   * @returns {*} - Valeur de préférence
   */
  getPreference(key, defaultValue = null) {
    return key in this.userData.preferences 
      ? this.userData.preferences[key] 
      : defaultValue;
  }
  
  /**
   * Obtenir les données d'abonnement
   * @returns {Object} - Données d'abonnement
   */
  getSubscriptionData() {
    return { ...this.userData.subscription };
  }
  
  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean} - Vrai si l'utilisateur est connecté
   */
  isLoggedIn() {
    return !!this.userData.profile.id;
  }
  
  /**
   * Vérifier si l'utilisateur a un abonnement actif
   * @returns {boolean} - Vrai si l'utilisateur a un abonnement actif
   */
  hasActiveSubscription() {
    const { subscription } = this.userData;
    
    if (!subscription.status || subscription.status !== 'active') {
      return false;
    }
    
    if (subscription.expiresAt) {
      const expiryDate = new Date(subscription.expiresAt);
      if (expiryDate < new Date()) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Vérifier si l'utilisateur a accès à une fonctionnalité
   * @param {string} feature - Fonctionnalité
   * @returns {boolean} - Vrai si l'utilisateur a accès
   */
  hasFeatureAccess(feature) {
    if (!feature) return false;
    
    // Vérifier si l'utilisateur a un abonnement actif
    if (!this.hasActiveSubscription()) {
      // Certaines fonctionnalités peuvent être disponibles sans abonnement
      const freeFeatures = ['basic_streaming', 'limited_search'];
      return freeFeatures.includes(feature);
    }
    
    // Vérifier si la fonctionnalité est incluse dans l'abonnement
    return this.userData.subscription.features.includes(feature);
  }
  
  /**
   * Déconnecter l'utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async logout() {
    try {
      // Réinitialiser les données de profil
      this.userData.profile = {
        id: null,
        username: null,
        email: null,
        name: null,
        avatar: null,
        createdAt: null,
        lastLogin: null
      };
      
      // Conserver les préférences mais réinitialiser les données d'abonnement
      this.userData.subscription = {
        plan: null,
        status: null,
        expiresAt: null,
        features: []
      };
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log('Utilisateur déconnecté');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    }
  }
  
  /**
   * Effacer toutes les données utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearUserData() {
    try {
      // Réinitialiser les données utilisateur
      this.userData = {
        profile: {
          id: null,
          username: null,
          email: null,
          name: null,
          avatar: null,
          createdAt: null,
          lastLogin: null
        },
        preferences: {
          theme: 'dark',
          language: 'fr',
          subtitles: true,
          autoplay: false,
          notifications: true,
          quality: 'auto',
          contentFilters: {
            adult: false,
            violence: false
          }
        },
        subscription: {
          plan: null,
          status: null,
          expiresAt: null,
          features: []
        }
      };
      
      // Supprimer du stockage
      if (this.storageService) {
        await this.storageService.remove(this.userDataKey);
        await this.storageService.remove(this.preferencesKey);
      } else {
        localStorage.removeItem(`flodrama_${this.userDataKey}`);
        localStorage.removeItem(`flodrama_${this.preferencesKey}`);
      }
      
      console.log('Données utilisateur effacées');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données utilisateur:', error);
      return false;
    }
  }
  
  /**
   * Exporter les données utilisateur
   * @returns {string} - JSON des données utilisateur
   */
  exportUserData() {
    return JSON.stringify(this.userData, null, 2);
  }
  
  /**
   * Importer des données utilisateur
   * @param {string} json - JSON des données utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async importUserData(json) {
    try {
      const importedData = JSON.parse(json);
      
      // Valider les données
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Format de données utilisateur invalide');
      }
      
      // Fusionner les données
      this.userData = this._mergeUserData(this.userData, importedData);
      
      // Sauvegarder les données
      await this._saveUserData();
      
      console.log('Données utilisateur importées');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import des données utilisateur:', error);
      return false;
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default UserDataService;
