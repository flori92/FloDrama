/**
 * FloDrama - Module d'authentification
 * 
 * Ce module gère l'authentification des utilisateurs, y compris l'inscription,
 * la connexion, la déconnexion et la gestion de session.
 */

import authStorage from './auth-storage.js';

class Auth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    
    // Initialiser l'état de l'utilisateur au chargement
    this.init();
  }
  
  /**
   * Initialise le module d'authentification
   */
  init() {
    // Vérifier si un utilisateur est déjà connecté (session persistante)
    this.currentUser = authStorage.getUser();
    
    // Si un utilisateur est connecté, notifier les écouteurs
    if (this.currentUser) {
      this.notifyListeners();
    }
  }
  
  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données du nouvel utilisateur
   * @returns {Promise} Promesse résolue avec les données utilisateur ou rejetée avec une erreur
   */
  register(userData) {
    return new Promise((resolve, reject) => {
      // Vérifier si l'email est déjà utilisé
      // Dans une implémentation réelle, cela serait vérifié côté serveur
      const existingUsers = this.getRegisteredUsers();
      const userExists = existingUsers.some(user => user.email === userData.email);
      
      if (userExists) {
        return reject(new Error('Cet email est déjà utilisé.'));
      }
      
      // Valider les données utilisateur
      if (!this.validateUserData(userData)) {
        return reject(new Error('Données utilisateur invalides.'));
      }
      
      // Générer un ID utilisateur unique
      userData.id = Date.now().toString();
      userData.createdAt = new Date().toISOString();
      
      // Enregistrer l'utilisateur
      existingUsers.push(userData);
      localStorage.setItem('flodrama_registered_users', JSON.stringify(existingUsers));
      
      // Connecter automatiquement l'utilisateur après l'inscription
      this.login(userData.email, userData.password)
        .then(user => resolve(user))
        .catch(error => reject(error));
    });
  }
  
  /**
   * Connecte un utilisateur existant
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @returns {Promise} Promesse résolue avec les données utilisateur ou rejetée avec une erreur
   */
  login(email, password) {
    return new Promise((resolve, reject) => {
      // Dans une implémentation réelle, l'authentification serait gérée côté serveur
      const existingUsers = this.getRegisteredUsers();
      const user = existingUsers.find(user => user.email === email);
      
      if (!user) {
        return reject(new Error('Utilisateur non trouvé.'));
      }
      
      // Vérifier le mot de passe
      const hashedPassword = authStorage.simpleHash(password);
      if (user.hashedPassword && user.hashedPassword !== hashedPassword) {
        return reject(new Error('Mot de passe incorrect.'));
      }
      
      // Mettre à jour les informations de connexion
      user.lastLogin = new Date().toISOString();
      
      // Sauvegarder l'utilisateur dans le stockage local
      this.currentUser = authStorage.saveUser(user);
      
      // Notifier les écouteurs du changement d'état
      this.notifyListeners();
      
      resolve(this.currentUser);
    });
  }
  
  /**
   * Déconnecte l'utilisateur actuel
   */
  logout() {
    // Supprimer les données utilisateur du stockage local
    authStorage.removeUser();
    
    // Réinitialiser l'état de l'utilisateur
    this.currentUser = null;
    
    // Notifier les écouteurs du changement d'état
    this.notifyListeners();
  }
  
  /**
   * Vérifie si un utilisateur est actuellement connecté
   * @returns {boolean} True si un utilisateur est connecté, sinon false
   */
  isLoggedIn() {
    return !!this.currentUser;
  }
  
  /**
   * Récupère les données de l'utilisateur actuellement connecté
   * @returns {Object|null} Données utilisateur ou null si non connecté
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Met à jour les données de l'utilisateur actuellement connecté
   * @param {Object} userData - Nouvelles données utilisateur
   * @returns {Object} Données utilisateur mises à jour
   */
  updateCurrentUser(userData) {
    if (!this.isLoggedIn()) {
      throw new Error('Aucun utilisateur connecté.');
    }
    
    // Fusionner les données existantes avec les nouvelles données
    const updatedUser = { ...this.currentUser, ...userData };
    
    // Sauvegarder les données mises à jour
    this.currentUser = authStorage.saveUser(updatedUser);
    
    // Mettre à jour l'utilisateur dans la liste des utilisateurs enregistrés
    const existingUsers = this.getRegisteredUsers();
    const userIndex = existingUsers.findIndex(user => user.id === this.currentUser.id);
    
    if (userIndex !== -1) {
      existingUsers[userIndex] = { ...existingUsers[userIndex], ...userData };
      localStorage.setItem('flodrama_registered_users', JSON.stringify(existingUsers));
    }
    
    // Notifier les écouteurs du changement d'état
    this.notifyListeners();
    
    return this.currentUser;
  }
  
  /**
   * Ajoute un écouteur pour les changements d'état d'authentification
   * @param {Function} listener - Fonction à appeler lors des changements d'état
   */
  addAuthStateListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
      
      // Appeler immédiatement l'écouteur avec l'état actuel
      listener(this.currentUser);
    }
  }
  
  /**
   * Supprime un écouteur pour les changements d'état d'authentification
   * @param {Function} listener - Fonction à supprimer des écouteurs
   */
  removeAuthStateListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notifie tous les écouteurs d'un changement d'état d'authentification
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Erreur dans un écouteur d\'authentification:', error);
      }
    });
  }
  
  /**
   * Récupère la liste des utilisateurs enregistrés
   * @returns {Array} Liste des utilisateurs enregistrés
   */
  getRegisteredUsers() {
    const users = localStorage.getItem('flodrama_registered_users');
    return users ? JSON.parse(users) : [];
  }
  
  /**
   * Valide les données utilisateur
   * @param {Object} userData - Données utilisateur à valider
   * @returns {boolean} True si les données sont valides, sinon false
   */
  validateUserData(userData) {
    // Vérifier que les champs requis sont présents
    if (!userData.email || !userData.password || !userData.name) {
      return false;
    }
    
    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return false;
    }
    
    // Valider le mot de passe (au moins 6 caractères)
    if (userData.password.length < 6) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Ajoute un contenu aux favoris de l'utilisateur
   * @param {number} contentId - ID du contenu à ajouter
   * @returns {Array} Nouvelle liste des favoris
   */
  addToFavorites(contentId) {
    if (!this.isLoggedIn()) {
      throw new Error('Vous devez être connecté pour ajouter des favoris.');
    }
    
    return authStorage.addFavorite(contentId);
  }
  
  /**
   * Supprime un contenu des favoris de l'utilisateur
   * @param {number} contentId - ID du contenu à supprimer
   * @returns {Array} Nouvelle liste des favoris
   */
  removeFromFavorites(contentId) {
    if (!this.isLoggedIn()) {
      throw new Error('Vous devez être connecté pour gérer vos favoris.');
    }
    
    return authStorage.removeFavorite(contentId);
  }
  
  /**
   * Vérifie si un contenu est dans les favoris de l'utilisateur
   * @param {number} contentId - ID du contenu à vérifier
   * @returns {boolean} True si le contenu est dans les favoris, sinon false
   */
  isFavorite(contentId) {
    const favorites = authStorage.getFavorites();
    return favorites.includes(contentId);
  }
  
  /**
   * Récupère les favoris de l'utilisateur
   * @returns {Array} Liste des IDs des contenus favoris
   */
  getFavorites() {
    return authStorage.getFavorites();
  }
  
  /**
   * Met à jour les préférences de l'utilisateur
   * @param {Object} preferences - Nouvelles préférences
   * @returns {Object} Préférences mises à jour
   */
  updatePreferences(preferences) {
    const currentPreferences = authStorage.getPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    authStorage.savePreferences(updatedPreferences);
    return updatedPreferences;
  }
  
  /**
   * Récupère les préférences de l'utilisateur
   * @returns {Object} Préférences utilisateur
   */
  getPreferences() {
    return authStorage.getPreferences();
  }
}

// Exporter une instance unique du module d'authentification
const auth = new Auth();
export default auth;
