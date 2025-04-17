/**
 * Service d'authentification pour FloDrama
 * Gère l'authentification des utilisateurs, les tokens et les sessions
 */
import { API_BASE_URL, ENDPOINTS } from '../config/api';

class AuthService {
  constructor() {
    // Singleton pattern
    if (AuthService.instance) {
      return AuthService.instance;
    }
    
    this.user = null;
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.tokenExpiry = localStorage.getItem('token_expiry');
    
    AuthService.instance = this;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} - True si l'utilisateur est authentifié
   */
  isAuthenticated() {
    // Vérifier si le token existe et n'est pas expiré
    if (!this.token) return false;
    
    if (this.tokenExpiry) {
      const expiryDate = new Date(this.tokenExpiry);
      if (expiryDate < new Date()) {
        // Token expiré, essayer de le rafraîchir
        this.refreshAuthToken();
        return false;
      }
    }
    
    return true;
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   * @returns {Object|null} - Informations sur l'utilisateur ou null si non connecté
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Récupère le token d'authentification
   * @returns {string|null} - Token d'authentification ou null
   */
  getAuthToken() {
    return this.token;
  }

  /**
   * Connecte un utilisateur avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} - Informations sur l'utilisateur connecté
   */
  async login(email, password) {
    try {
      // Simulation d'une requête API
      // Dans un environnement réel, cela ferait une requête vers le backend
      console.log(`[AuthService] Tentative de connexion pour ${email}`);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simuler une réponse réussie
      const response = {
        user: {
          id: 'user-123',
          email: email,
          name: 'Utilisateur Test',
          avatar: 'https://via.placeholder.com/150',
          preferences: {
            theme: 'dark',
            notifications: true
          }
        },
        token: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 3600 // 1 heure
      };
      
      // Stocker les informations d'authentification
      this.user = response.user;
      this.token = response.token;
      this.refreshToken = response.refreshToken;
      
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + response.expiresIn);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);
      localStorage.setItem('token_expiry', this.tokenExpiry);
      
      return response.user;
    } catch (error) {
      console.error('[AuthService] Erreur lors de la connexion:', error);
      throw new Error('Échec de la connexion: identifiants invalides');
    }
  }

  /**
   * Inscrit un nouvel utilisateur
   * @param {string} name - Nom de l'utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise<Object>} - Informations sur l'utilisateur inscrit
   */
  async register(name, email, password) {
    try {
      // Simulation d'une requête API
      console.log(`[AuthService] Tentative d'inscription pour ${email}`);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse réussie
      const response = {
        user: {
          id: 'user-' + Date.now(),
          email: email,
          name: name,
          avatar: 'https://via.placeholder.com/150',
          preferences: {
            theme: 'light',
            notifications: true
          }
        },
        token: 'fake-jwt-token-new-user',
        refreshToken: 'fake-refresh-token-new-user',
        expiresIn: 3600 // 1 heure
      };
      
      // Stocker les informations d'authentification
      this.user = response.user;
      this.token = response.token;
      this.refreshToken = response.refreshToken;
      
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + response.expiresIn);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('refresh_token', this.refreshToken);
      localStorage.setItem('token_expiry', this.tokenExpiry);
      
      return response.user;
    } catch (error) {
      console.error('[AuthService] Erreur lors de l\'inscription:', error);
      throw new Error('Échec de l\'inscription: veuillez réessayer');
    }
  }

  /**
   * Déconnecte l'utilisateur actuel
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Simulation d'une requête API pour la déconnexion
      console.log('[AuthService] Déconnexion de l\'utilisateur');
      
      // Nettoyer les données d'authentification
      this.user = null;
      this.token = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      
      // Supprimer du localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expiry');
      
      return true;
    } catch (error) {
      console.error('[AuthService] Erreur lors de la déconnexion:', error);
      throw new Error('Échec de la déconnexion');
    }
  }

  /**
   * Rafraîchit le token d'authentification
   * @returns {Promise<boolean>} - True si le token a été rafraîchi avec succès
   */
  async refreshAuthToken() {
    if (!this.refreshToken) return false;
    
    try {
      // Simulation d'une requête API pour rafraîchir le token
      console.log('[AuthService] Rafraîchissement du token');
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simuler une réponse réussie
      const response = {
        token: 'new-fake-jwt-token',
        expiresIn: 3600 // 1 heure
      };
      
      // Mettre à jour le token
      this.token = response.token;
      
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + response.expiresIn);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Sauvegarder dans le localStorage
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('token_expiry', this.tokenExpiry);
      
      return true;
    } catch (error) {
      console.error('[AuthService] Erreur lors du rafraîchissement du token:', error);
      
      // En cas d'échec, déconnecter l'utilisateur
      this.logout();
      return false;
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<boolean>} - True si la demande a été envoyée avec succès
   */
  async resetPassword(email) {
    try {
      // Simulation d'une requête API
      console.log(`[AuthService] Demande de réinitialisation de mot de passe pour ${email}`);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return true;
    } catch (error) {
      console.error('[AuthService] Erreur lors de la réinitialisation du mot de passe:', error);
      throw new Error('Échec de la demande de réinitialisation');
    }
  }

  /**
   * Vérifie l'adresse email d'un utilisateur
   * @param {string} token - Token de vérification
   * @returns {Promise<boolean>} - True si la vérification a réussi
   */
  async verifyEmail(token) {
    try {
      // Simulation d'une requête API
      console.log(`[AuthService] Vérification de l'email avec le token: ${token}`);
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return true;
    } catch (error) {
      console.error('[AuthService] Erreur lors de la vérification de l\'email:', error);
      throw new Error('Échec de la vérification de l\'email');
    }
  }
}

// Exporter une instance du service
export default new AuthService();
