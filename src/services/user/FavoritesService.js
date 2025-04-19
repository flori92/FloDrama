// Service de gestion des favoris pour FloDrama
// Implémente un mécanisme persistant pour gérer les favoris des utilisateurs

/**
 * Service de gestion des favoris
 * @class FavoritesService
 */
export class FavoritesService {
  /**
   * Constructeur du service de favoris
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.storageKey - Clé de stockage (défaut: 'flodrama_favorites')
   */
  constructor(storageService = null, config = {}) {
    this.storageService = storageService;
    this.storageKey = config.storageKey || 'flodrama_favorites';
    this.favorites = [];
    
    // Charger les favoris
    this._loadFavorites();
    
    console.log('FavoritesService initialisé');
  }
  
  /**
   * Charger les favoris depuis le stockage
   * @private
   */
  async _loadFavorites() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        this.favorites = await this.storageService.get(this.storageKey, { defaultValue: [] });
      } else {
        // Fallback sur localStorage
        const storedFavorites = localStorage.getItem(this.storageKey);
        this.favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      this.favorites = [];
    }
  }
  
  /**
   * Sauvegarder les favoris dans le stockage
   * @private
   */
  async _saveFavorites() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.storageKey, this.favorites);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('favorites-updated', {
        detail: { favorites: this.favorites }
      });
      document.dispatchEvent(event);
      
      console.log('Favoris sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }
  
  /**
   * Ajouter un élément aux favoris
   * @param {Object} item - Élément à ajouter
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async addToFavorites(item) {
    if (!item || !item.id) {
      console.error('Élément invalide pour addToFavorites');
      return false;
    }
    
    // Vérifier si l'élément est déjà dans les favoris
    if (!this.isFavorite(item.id)) {
      // Créer une entrée de favori
      const favoriteItem = {
        id: item.id,
        title: item.title || `Élément ${item.id}`,
        type: item.type || 'unknown',
        image: item.image || null,
        addedAt: new Date().toISOString(),
        metadata: {
          category: item.category || null,
          genre: item.genre || null,
          year: item.year || null
        }
      };
      
      // Ajouter aux favoris
      this.favorites.push(favoriteItem);
      
      // Sauvegarder
      await this._saveFavorites();
      
      console.log(`Ajouté aux favoris: ${favoriteItem.title}`);
      return true;
    }
    
    console.log(`Déjà dans les favoris: ${item.title || item.id}`);
    return false;
  }
  
  /**
   * Supprimer un élément des favoris
   * @param {string|number} itemId - ID de l'élément
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async removeFromFavorites(itemId) {
    if (!itemId) {
      console.error('ID invalide pour removeFromFavorites');
      return false;
    }
    
    const initialLength = this.favorites.length;
    this.favorites = this.favorites.filter(item => item.id !== itemId);
    
    if (this.favorites.length !== initialLength) {
      // Sauvegarder
      await this._saveFavorites();
      
      console.log(`Supprimé des favoris: ID ${itemId}`);
      return true;
    }
    
    console.log(`Non trouvé dans les favoris: ID ${itemId}`);
    return false;
  }
  
  /**
   * Vérifier si un élément est dans les favoris
   * @param {string|number} itemId - ID de l'élément
   * @returns {boolean} - Vrai si l'élément est dans les favoris
   */
  isFavorite(itemId) {
    if (!itemId) return false;
    return this.favorites.some(item => item.id === itemId);
  }
  
  /**
   * Obtenir tous les favoris
   * @returns {Array} - Liste des favoris
   */
  getAllFavorites() {
    return [...this.favorites];
  }
  
  /**
   * Obtenir les favoris par type
   * @param {string} type - Type de contenu
   * @returns {Array} - Liste des favoris
   */
  getFavoritesByType(type) {
    if (!type) return [];
    return this.favorites.filter(item => item.type === type);
  }
  
  /**
   * Obtenir les favoris par catégorie
   * @param {string} category - Catégorie
   * @returns {Array} - Liste des favoris
   */
  getFavoritesByCategory(category) {
    if (!category) return [];
    return this.favorites.filter(item => 
      item.metadata && item.metadata.category === category
    );
  }
  
  /**
   * Obtenir les favoris récents
   * @param {number} limit - Limite
   * @returns {Array} - Liste des favoris
   */
  getRecentFavorites(limit = 5) {
    return [...this.favorites]
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, limit);
  }
  
  /**
   * Obtenir les favoris populaires
   * @param {number} limit - Limite
   * @returns {Array} - Liste des favoris
   */
  getPopularFavorites(limit = 5) {
    // Dans une version future, cela pourrait être basé sur des statistiques d'utilisation
    // Pour l'instant, retourner simplement les favoris les plus anciens
    return [...this.favorites]
      .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
      .slice(0, limit);
  }
  
  /**
   * Basculer l'état favori d'un élément
   * @param {Object} item - Élément
   * @returns {Promise<boolean>} - Nouvel état (true = ajouté, false = supprimé)
   */
  async toggleFavorite(item) {
    if (!item || !item.id) {
      console.error('Élément invalide pour toggleFavorite');
      return false;
    }
    
    if (this.isFavorite(item.id)) {
      await this.removeFromFavorites(item.id);
      return false;
    } else {
      await this.addToFavorites(item);
      return true;
    }
  }
  
  /**
   * Mettre à jour un favori
   * @param {string|number} itemId - ID de l'élément
   * @param {Object} updates - Mises à jour
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async updateFavorite(itemId, updates) {
    if (!itemId || !updates) {
      console.error('Paramètres invalides pour updateFavorite');
      return false;
    }
    
    const index = this.favorites.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      // Mettre à jour l'élément
      this.favorites[index] = {
        ...this.favorites[index],
        ...updates,
        // Préserver l'ID et la date d'ajout
        id: this.favorites[index].id,
        addedAt: this.favorites[index].addedAt
      };
      
      // Sauvegarder
      await this._saveFavorites();
      
      console.log(`Favori mis à jour: ID ${itemId}`);
      return true;
    }
    
    console.log(`Favori non trouvé pour mise à jour: ID ${itemId}`);
    return false;
  }
  
  /**
   * Effacer tous les favoris
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearAllFavorites() {
    this.favorites = [];
    await this._saveFavorites();
    console.log('Tous les favoris ont été effacés');
    return true;
  }
  
  /**
   * Exporter les favoris au format JSON
   * @returns {string} - JSON des favoris
   */
  exportFavorites() {
    return JSON.stringify(this.favorites, null, 2);
  }
  
  /**
   * Importer des favoris depuis un JSON
   * @param {string} json - JSON des favoris
   * @param {Object} options - Options d'import
   * @param {boolean} options.merge - Fusionner avec les favoris existants
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async importFavorites(json, options = {}) {
    try {
      const importedFavorites = JSON.parse(json);
      
      if (!Array.isArray(importedFavorites)) {
        throw new Error('Format de favoris invalide');
      }
      
      if (options.merge) {
        // Fusionner avec les favoris existants
        const existingIds = new Set(this.favorites.map(item => item.id));
        
        // Ajouter uniquement les nouveaux favoris
        importedFavorites.forEach(item => {
          if (!existingIds.has(item.id)) {
            this.favorites.push(item);
          }
        });
      } else {
        // Remplacer les favoris existants
        this.favorites = importedFavorites;
      }
      
      // Sauvegarder
      await this._saveFavorites();
      
      console.log(`${importedFavorites.length} favoris importés`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import des favoris:', error);
      return false;
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default FavoritesService;
