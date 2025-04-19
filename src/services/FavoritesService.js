// Service de gestion des favoris pour FloDrama
// Implémente un mécanisme persistant pour gérer les favoris des utilisateurs

export class FavoritesService {
  constructor() {
    this.storageKey = 'flodrama_favorites';
    this.favorites = this.loadFavorites();
    console.log('FavoritesService initialisé');
  }

  // Charger les favoris depuis le stockage local
  loadFavorites() {
    try {
      const storedFavorites = localStorage.getItem(this.storageKey);
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      return [];
    }
  }

  // Sauvegarder les favoris dans le stockage local
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
      console.log('Favoris sauvegardés');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des favoris:', error);
    }
  }

  // Ajouter un élément aux favoris
  addToFavorites(item) {
    // Vérifier si l'élément est déjà dans les favoris
    if (!this.isFavorite(item.id)) {
      this.favorites.push({
        id: item.id,
        title: item.title,
        type: item.type,
        image: item.image,
        addedAt: new Date().toISOString()
      });
      
      this.saveFavorites();
      console.log(`Ajouté aux favoris: ${item.title}`);
      return true;
    }
    
    console.log(`Déjà dans les favoris: ${item.title}`);
    return false;
  }

  // Supprimer un élément des favoris
  removeFromFavorites(itemId) {
    const initialLength = this.favorites.length;
    this.favorites = this.favorites.filter(item => item.id !== itemId);
    
    if (this.favorites.length !== initialLength) {
      this.saveFavorites();
      console.log(`Supprimé des favoris: ID ${itemId}`);
      return true;
    }
    
    console.log(`Non trouvé dans les favoris: ID ${itemId}`);
    return false;
  }

  // Vérifier si un élément est dans les favoris
  isFavorite(itemId) {
    return this.favorites.some(item => item.id === itemId);
  }

  // Obtenir tous les favoris
  getAllFavorites() {
    return [...this.favorites];
  }

  // Obtenir les favoris par type
  getFavoritesByType(type) {
    return this.favorites.filter(item => item.type === type);
  }

  // Obtenir les favoris récents
  getRecentFavorites(limit = 5) {
    return [...this.favorites]
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, limit);
  }

  // Basculer l'état favori d'un élément
  toggleFavorite(item) {
    if (this.isFavorite(item.id)) {
      return this.removeFromFavorites(item.id);
    } else {
      return this.addToFavorites(item);
    }
  }

  // Effacer tous les favoris
  clearAllFavorites() {
    this.favorites = [];
    this.saveFavorites();
    console.log('Tous les favoris ont été effacés');
  }
}
