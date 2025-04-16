/**
 * FloDrama - Module de stockage pour l'authentification
 * 
 * Ce module gère le stockage et la récupération des données utilisateur
 * dans le localStorage du navigateur.
 */

class AuthStorage {
  constructor() {
    this.storageKey = 'flodrama_user';
    this.favoritesKey = 'flodrama_favorites';
    this.preferencesKey = 'flodrama_preferences';
  }

  /**
   * Sauvegarde les données utilisateur dans le localStorage
   * @param {Object} userData - Données de l'utilisateur à sauvegarder
   */
  saveUser(userData) {
    // Ne jamais stocker le mot de passe en clair
    const userToSave = { ...userData };
    if (userToSave.password) {
      // Dans une implémentation réelle, le mot de passe ne serait jamais stocké côté client
      // Ici, nous le hashons simplement pour la démonstration
      userToSave.hashedPassword = this.simpleHash(userToSave.password);
      delete userToSave.password;
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(userToSave));
    return userToSave;
  }

  /**
   * Récupère les données utilisateur depuis le localStorage
   * @returns {Object|null} Données utilisateur ou null si non connecté
   */
  getUser() {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Supprime les données utilisateur du localStorage (déconnexion)
   */
  removeUser() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Sauvegarde la liste des favoris de l'utilisateur
   * @param {Array} favorites - Liste des IDs des contenus favoris
   */
  saveFavorites(favorites) {
    localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
  }

  /**
   * Récupère la liste des favoris de l'utilisateur
   * @returns {Array} Liste des IDs des contenus favoris
   */
  getFavorites() {
    const favorites = localStorage.getItem(this.favoritesKey);
    return favorites ? JSON.parse(favorites) : [];
  }

  /**
   * Ajoute un contenu aux favoris
   * @param {number} contentId - ID du contenu à ajouter
   * @returns {Array} Nouvelle liste des favoris
   */
  addFavorite(contentId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(contentId)) {
      favorites.push(contentId);
      this.saveFavorites(favorites);
    }
    return favorites;
  }

  /**
   * Supprime un contenu des favoris
   * @param {number} contentId - ID du contenu à supprimer
   * @returns {Array} Nouvelle liste des favoris
   */
  removeFavorite(contentId) {
    let favorites = this.getFavorites();
    favorites = favorites.filter(id => id !== contentId);
    this.saveFavorites(favorites);
    return favorites;
  }

  /**
   * Sauvegarde les préférences utilisateur
   * @param {Object} preferences - Préférences utilisateur
   */
  savePreferences(preferences) {
    localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
  }

  /**
   * Récupère les préférences utilisateur
   * @returns {Object} Préférences utilisateur
   */
  getPreferences() {
    const preferences = localStorage.getItem(this.preferencesKey);
    return preferences ? JSON.parse(preferences) : {
      theme: 'dark',
      language: 'fr',
      notifications: true,
      contentFilters: {
        showAdult: false,
        genres: []
      }
    };
  }

  /**
   * Fonction simple de hashage pour démonstration
   * NE PAS UTILISER EN PRODUCTION - Utiliser des bibliothèques de cryptographie appropriées
   * @param {string} str - Chaîne à hasher
   * @returns {string} Chaîne hashée
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Conversion en 32bit integer
    }
    return hash.toString(16);
  }
}

// Exporter une instance unique du module de stockage
const authStorage = new AuthStorage();
export default authStorage;
