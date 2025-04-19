// Service d'authentification pour FloDrama
// Gère l'authentification des utilisateurs et les sessions

/**
 * Service de gestion de l'authentification des utilisateurs
 * @class AuthService
 */
export class AuthService {
  /**
   * Constructeur du service d'authentification
   * @param {ApiService} apiService - Service API pour les requêtes
   * @param {Object} config - Configuration du service
   * @param {string} config.tokenKey - Clé pour le token dans le stockage (défaut: 'auth_token')
   * @param {string} config.userKey - Clé pour les données utilisateur dans le stockage (défaut: 'user_data')
   * @param {number} config.sessionDuration - Durée de session en millisecondes (défaut: 24h)
   */
  constructor(apiService, config = {}) {
    this.apiService = apiService;
    this.tokenKey = config.tokenKey || 'auth_token';
    this.userKey = config.userKey || 'user_data';
    this.sessionDuration = config.sessionDuration || 24 * 60 * 60 * 1000; // 24h par défaut
    
    // État de l'authentification
    this.isAuthenticated = false;
    this.currentUser = null;
    this.authToken = null;
    
    // Initialiser l'état d'authentification
    this._loadAuthState();
    
    console.log('AuthService initialisé');
  }
  
  /**
   * Charger l'état d'authentification depuis le stockage local
   * @private
   */
  _loadAuthState() {
    try {
      // Récupérer le token
      const tokenData = localStorage.getItem(this.tokenKey);
      
      if (tokenData) {
        const { token, expiry } = JSON.parse(tokenData);
        
        // Vérifier si le token est encore valide
        if (expiry && expiry > Date.now()) {
          this.authToken = token;
          this.isAuthenticated = true;
          
          // Configurer le token dans l'API
          this.apiService.setAuthToken(token);
          
          // Récupérer les données utilisateur
          const userData = localStorage.getItem(this.userKey);
          if (userData) {
            this.currentUser = JSON.parse(userData);
          }
          
          console.log('Session utilisateur restaurée');
        } else {
          // Token expiré, nettoyer
          this._clearAuthState();
          console.log('Session expirée');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état d\'authentification:', error);
      this._clearAuthState();
    }
  }
  
  /**
   * Sauvegarder l'état d'authentification dans le stockage local
   * @param {string} token - Token d'authentification
   * @param {Object} user - Données utilisateur
   * @private
   */
  _saveAuthState(token, user) {
    try {
      // Calculer l'expiration
      const expiry = Date.now() + this.sessionDuration;
      
      // Sauvegarder le token
      localStorage.setItem(this.tokenKey, JSON.stringify({
        token,
        expiry
      }));
      
      // Sauvegarder les données utilisateur
      localStorage.setItem(this.userKey, JSON.stringify(user));
      
      // Mettre à jour l'état
      this.authToken = token;
      this.currentUser = user;
      this.isAuthenticated = true;
      
      // Configurer le token dans l'API
      this.apiService.setAuthToken(token);
      
      console.log('État d\'authentification sauvegardé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état d\'authentification:', error);
    }
  }
  
  /**
   * Effacer l'état d'authentification
   * @private
   */
  _clearAuthState() {
    // Supprimer du stockage local
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Réinitialiser l'état
    this.authToken = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    
    // Supprimer le token de l'API
    this.apiService.setAuthToken(null);
    
    console.log('État d\'authentification effacé');
  }
  
  /**
   * Connecter un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} - Données utilisateur
   */
  async login(email, password) {
    try {
      // Effectuer la requête d'authentification
      const response = await this.apiService.post('/auth/login', {
        email,
        password
      });
      
      // Vérifier la réponse
      if (response.token && response.user) {
        // Sauvegarder l'état d'authentification
        this._saveAuthState(response.token, response.user);
        
        console.log('Utilisateur connecté:', response.user.email);
        return response.user;
      } else {
        throw new Error('Réponse d\'authentification invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }
  
  /**
   * Déconnecter l'utilisateur actuel
   * @returns {Promise<boolean>} - Succès de la déconnexion
   */
  async logout() {
    try {
      // Si l'utilisateur est authentifié, notifier le serveur
      if (this.isAuthenticated) {
        await this.apiService.post('/auth/logout', {});
      }
      
      // Effacer l'état d'authentification
      this._clearAuthState();
      
      console.log('Utilisateur déconnecté');
      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Effacer l'état d'authentification même en cas d'erreur
      this._clearAuthState();
      
      return false;
    }
  }
  
  /**
   * Inscrire un nouvel utilisateur
   * @param {Object} userData - Données d'inscription
   * @param {string} userData.email - Email de l'utilisateur
   * @param {string} userData.password - Mot de passe de l'utilisateur
   * @param {string} userData.name - Nom de l'utilisateur
   * @returns {Promise<Object>} - Données utilisateur
   */
  async register(userData) {
    try {
      // Effectuer la requête d'inscription
      const response = await this.apiService.post('/auth/register', userData);
      
      // Vérifier la réponse
      if (response.token && response.user) {
        // Sauvegarder l'état d'authentification
        this._saveAuthState(response.token, response.user);
        
        console.log('Utilisateur inscrit:', response.user.email);
        return response.user;
      } else {
        throw new Error('Réponse d\'inscription invalide');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }
  
  /**
   * Vérifier si l'utilisateur est authentifié
   * @returns {boolean} - État d'authentification
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
  
  /**
   * Obtenir l'utilisateur actuel
   * @returns {Object|null} - Données utilisateur
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Obtenir le token d'authentification
   * @returns {string|null} - Token d'authentification
   */
  getAuthToken() {
    return this.authToken;
  }
  
  /**
   * Mettre à jour le profil de l'utilisateur
   * @param {Object} userData - Nouvelles données utilisateur
   * @returns {Promise<Object>} - Données utilisateur mises à jour
   */
  async updateProfile(userData) {
    if (!this.isAuthenticated) {
      throw new Error('Utilisateur non authentifié');
    }
    
    try {
      // Effectuer la requête de mise à jour
      const response = await this.apiService.put('/users/profile', userData);
      
      // Mettre à jour les données utilisateur
      this.currentUser = response.user;
      
      // Sauvegarder les nouvelles données
      localStorage.setItem(this.userKey, JSON.stringify(this.currentUser));
      
      console.log('Profil utilisateur mis à jour');
      return this.currentUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }
  
  /**
   * Réinitialiser le mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<boolean>} - Succès de la demande
   */
  async requestPasswordReset(email) {
    try {
      await this.apiService.post('/auth/reset-password', { email });
      console.log('Demande de réinitialisation envoyée');
      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      throw error;
    }
  }
  
  /**
   * Confirmer la réinitialisation du mot de passe
   * @param {string} token - Token de réinitialisation
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<boolean>} - Succès de la réinitialisation
   */
  async confirmPasswordReset(token, newPassword) {
    try {
      await this.apiService.post('/auth/reset-password/confirm', {
        token,
        password: newPassword
      });
      
      console.log('Mot de passe réinitialisé');
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }
  
  /**
   * Vérifier si un token de réinitialisation est valide
   * @param {string} token - Token de réinitialisation
   * @returns {Promise<boolean>} - Validité du token
   */
  async validateResetToken(token) {
    try {
      const response = await this.apiService.get('/auth/reset-password/validate', {
        params: { token }
      });
      
      return response.valid === true;
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return false;
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default AuthService;
