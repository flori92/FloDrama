// Service de gestion de l'historique de visionnage pour FloDrama
// Gère le suivi et la persistance de l'historique de visionnage des utilisateurs

/**
 * Service de gestion de l'historique de visionnage
 * @class WatchHistoryService
 */
export class WatchHistoryService {
  /**
   * Constructeur du service d'historique de visionnage
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.historyKey - Clé pour l'historique (défaut: 'watch_history')
   * @param {number} config.maxItems - Nombre maximum d'éléments dans l'historique (défaut: 100)
   */
  constructor(storageService = null, config = {}) {
    this.storageService = storageService;
    this.historyKey = config.historyKey || 'watch_history';
    this.maxItems = config.maxItems || 100;
    this.watchHistory = [];
    
    // Charger l'historique
    this._loadWatchHistory();
    
    console.log('WatchHistoryService initialisé');
  }
  
  /**
   * Charger l'historique de visionnage
   * @private
   */
  async _loadWatchHistory() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        this.watchHistory = await this.storageService.get(this.historyKey, { defaultValue: [] });
      } else {
        // Fallback sur localStorage
        const storedHistory = localStorage.getItem(`flodrama_${this.historyKey}`);
        this.watchHistory = storedHistory ? JSON.parse(storedHistory) : [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique de visionnage:', error);
      this.watchHistory = [];
    }
  }
  
  /**
   * Sauvegarder l'historique de visionnage
   * @private
   */
  async _saveWatchHistory() {
    try {
      if (this.storageService) {
        // Utiliser le service de stockage
        await this.storageService.set(this.historyKey, this.watchHistory);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.historyKey}`, 
          JSON.stringify(this.watchHistory)
        );
      }
      
      // Émettre un événement personnalisé
      const event = new CustomEvent('watch-history-updated', {
        detail: { history: this.watchHistory }
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'historique de visionnage:', error);
    }
  }
  
  /**
   * Ajouter un élément à l'historique de visionnage
   * @param {Object} contentItem - Élément de contenu
   * @param {Object} options - Options
   * @param {number} options.progress - Progression en pourcentage
   * @param {boolean} options.completed - Indique si le visionnage est terminé
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async addToHistory(contentItem, options = {}) {
    if (!contentItem || !contentItem.id) {
      console.error('Élément de contenu invalide pour addToHistory');
      return false;
    }
    
    try {
      // Vérifier si l'élément est déjà dans l'historique
      const existingIndex = this.watchHistory.findIndex(item => item.id === contentItem.id);
      
      // Déterminer la progression
      let progress = options.progress || 0;
      if (options.completed) {
        progress = 100;
      }
      
      // Créer l'entrée d'historique
      const historyEntry = {
        id: contentItem.id,
        title: contentItem.title || `Élément ${contentItem.id}`,
        type: contentItem.type || 'unknown',
        image: contentItem.image || null,
        watchedAt: new Date().toISOString(),
        progress: progress,
        duration: contentItem.duration || null,
        metadata: {
          category: contentItem.category || null,
          genre: contentItem.genre || null,
          year: contentItem.year || null
        }
      };
      
      // Mettre à jour ou ajouter l'entrée
      if (existingIndex !== -1) {
        // Ne mettre à jour que si la progression est supérieure
        if (progress > this.watchHistory[existingIndex].progress) {
          this.watchHistory[existingIndex] = {
            ...this.watchHistory[existingIndex],
            ...historyEntry
          };
        } else {
          // Mettre à jour uniquement la date de visionnage
          this.watchHistory[existingIndex].watchedAt = historyEntry.watchedAt;
          
          // Déplacer l'élément au début de l'historique
          const item = this.watchHistory.splice(existingIndex, 1)[0];
          this.watchHistory.unshift(item);
        }
      } else {
        // Ajouter une nouvelle entrée
        this.watchHistory.unshift(historyEntry);
      }
      
      // Limiter la taille de l'historique
      if (this.watchHistory.length > this.maxItems) {
        this.watchHistory = this.watchHistory.slice(0, this.maxItems);
      }
      
      // Sauvegarder l'historique
      await this._saveWatchHistory();
      
      console.log(`Élément ajouté à l'historique: ${historyEntry.title}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'historique:', error);
      return false;
    }
  }
  
  /**
   * Mettre à jour la progression d'un élément dans l'historique
   * @param {string|number} itemId - ID de l'élément
   * @param {number} progress - Progression en pourcentage
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async updateProgress(itemId, progress) {
    if (!itemId) {
      console.error('ID invalide pour updateProgress');
      return false;
    }
    
    try {
      const index = this.watchHistory.findIndex(item => item.id === itemId);
      
      if (index !== -1) {
        // Ne mettre à jour que si la progression est supérieure
        if (progress > this.watchHistory[index].progress) {
          this.watchHistory[index].progress = progress;
          this.watchHistory[index].watchedAt = new Date().toISOString();
          
          // Sauvegarder l'historique
          await this._saveWatchHistory();
          
          console.log(`Progression mise à jour pour ${this.watchHistory[index].title}: ${progress}%`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      return false;
    }
  }
  
  /**
   * Supprimer un élément de l'historique
   * @param {string|number} itemId - ID de l'élément
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async removeFromHistory(itemId) {
    if (!itemId) {
      console.error('ID invalide pour removeFromHistory');
      return false;
    }
    
    try {
      const initialLength = this.watchHistory.length;
      this.watchHistory = this.watchHistory.filter(item => item.id !== itemId);
      
      if (this.watchHistory.length !== initialLength) {
        // Sauvegarder l'historique
        await this._saveWatchHistory();
        
        console.log(`Élément supprimé de l'historique: ID ${itemId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      return false;
    }
  }
  
  /**
   * Effacer tout l'historique
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async clearHistory() {
    try {
      this.watchHistory = [];
      await this._saveWatchHistory();
      
      console.log('Historique de visionnage effacé');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement de l\'historique:', error);
      return false;
    }
  }
  
  /**
   * Obtenir tout l'historique
   * @param {number} limit - Limite
   * @returns {Array} - Historique de visionnage
   */
  getHistory(limit = 0) {
    return limit > 0 ? this.watchHistory.slice(0, limit) : [...this.watchHistory];
  }
  
  /**
   * Obtenir l'historique récent
   * @param {number} limit - Limite
   * @returns {Array} - Historique récent
   */
  getRecentHistory(limit = 10) {
    return this.watchHistory
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, limit);
  }
  
  /**
   * Obtenir les éléments en cours de visionnage
   * @param {number} limit - Limite
   * @returns {Array} - Éléments en cours
   */
  getContinueWatching(limit = 10) {
    return this.watchHistory
      .filter(item => item.progress > 0 && item.progress < 90)
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, limit);
  }
  
  /**
   * Obtenir les éléments terminés
   * @param {number} limit - Limite
   * @returns {Array} - Éléments terminés
   */
  getCompletedItems(limit = 10) {
    return this.watchHistory
      .filter(item => item.progress >= 90)
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, limit);
  }
  
  /**
   * Obtenir l'historique par type
   * @param {string} type - Type de contenu
   * @param {number} limit - Limite
   * @returns {Array} - Historique filtré
   */
  getHistoryByType(type, limit = 10) {
    if (!type) return [];
    
    return this.watchHistory
      .filter(item => item.type === type)
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, limit);
  }
  
  /**
   * Obtenir l'historique par genre
   * @param {string} genre - Genre
   * @param {number} limit - Limite
   * @returns {Array} - Historique filtré
   */
  getHistoryByGenre(genre, limit = 10) {
    if (!genre) return [];
    
    return this.watchHistory
      .filter(item => 
        item.metadata && 
        item.metadata.genre && 
        (Array.isArray(item.metadata.genre) 
          ? item.metadata.genre.includes(genre) 
          : item.metadata.genre === genre)
      )
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, limit);
  }
  
  /**
   * Vérifier si un élément est dans l'historique
   * @param {string|number} itemId - ID de l'élément
   * @returns {boolean} - Vrai si l'élément est dans l'historique
   */
  isInHistory(itemId) {
    if (!itemId) return false;
    return this.watchHistory.some(item => item.id === itemId);
  }
  
  /**
   * Obtenir la progression d'un élément
   * @param {string|number} itemId - ID de l'élément
   * @returns {number} - Progression en pourcentage
   */
  getItemProgress(itemId) {
    if (!itemId) return 0;
    
    const item = this.watchHistory.find(item => item.id === itemId);
    return item ? item.progress : 0;
  }
  
  /**
   * Vérifier si un élément a été terminé
   * @param {string|number} itemId - ID de l'élément
   * @returns {boolean} - Vrai si l'élément a été terminé
   */
  isItemCompleted(itemId) {
    return this.getItemProgress(itemId) >= 90;
  }
  
  /**
   * Exporter l'historique au format JSON
   * @returns {string} - JSON de l'historique
   */
  exportHistory() {
    return JSON.stringify(this.watchHistory, null, 2);
  }
  
  /**
   * Importer un historique depuis un JSON
   * @param {string} json - JSON de l'historique
   * @param {Object} options - Options d'import
   * @param {boolean} options.merge - Fusionner avec l'historique existant
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async importHistory(json, options = {}) {
    try {
      const importedHistory = JSON.parse(json);
      
      if (!Array.isArray(importedHistory)) {
        throw new Error('Format d\'historique invalide');
      }
      
      if (options.merge) {
        // Fusionner avec l'historique existant
        const existingIds = new Set(this.watchHistory.map(item => item.id));
        
        // Ajouter uniquement les nouveaux éléments
        importedHistory.forEach(item => {
          if (!existingIds.has(item.id)) {
            this.watchHistory.push(item);
          }
        });
        
        // Trier par date de visionnage
        this.watchHistory.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
      } else {
        // Remplacer l'historique existant
        this.watchHistory = importedHistory;
      }
      
      // Limiter la taille de l'historique
      if (this.watchHistory.length > this.maxItems) {
        this.watchHistory = this.watchHistory.slice(0, this.maxItems);
      }
      
      // Sauvegarder l'historique
      await this._saveWatchHistory();
      
      console.log(`${importedHistory.length} éléments d'historique importés`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'import de l\'historique:', error);
      return false;
    }
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default WatchHistoryService;
