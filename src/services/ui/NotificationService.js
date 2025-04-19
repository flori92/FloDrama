// Service de notifications pour FloDrama
// Gère les notifications système et utilisateur avec différents niveaux de priorité

/**
 * Service de notifications
 * @class NotificationService
 */
export class NotificationService {
  /**
   * Constructeur du service de notifications
   * @param {StorageService} storageService - Service de stockage
   * @param {Object} config - Configuration du service
   * @param {string} config.notificationsKey - Clé pour les notifications (défaut: 'notifications')
   * @param {number} config.maxNotifications - Nombre maximum de notifications (défaut: 50)
   * @param {number} config.defaultDuration - Durée par défaut en ms (défaut: 5000)
   * @param {boolean} config.persistNotifications - Persister les notifications (défaut: true)
   */
  constructor(storageService = null, config = {}) {
    this.storageService = storageService;
    this.notificationsKey = config.notificationsKey || 'notifications';
    this.maxNotifications = config.maxNotifications || 50;
    this.defaultDuration = config.defaultDuration || 5000;
    this.persistNotifications = config.persistNotifications !== undefined ? config.persistNotifications : true;
    
    // Notifications
    this.notifications = [];
    this.activeNotifications = [];
    this.listeners = [];
    this.nextId = 1;
    
    // Charger les notifications
    this._loadNotifications();
    
    console.log('NotificationService initialisé');
  }
  
  /**
   * Charger les notifications
   * @private
   */
  async _loadNotifications() {
    if (!this.persistNotifications) {
      return;
    }
    
    try {
      if (this.storageService) {
        const notifications = await this.storageService.get(this.notificationsKey);
        if (notifications && Array.isArray(notifications)) {
          this.notifications = notifications;
          
          // Trouver le prochain ID
          if (this.notifications.length > 0) {
            const maxId = Math.max(...this.notifications.map(n => n.id));
            this.nextId = maxId + 1;
          }
        }
      } else {
        // Fallback sur localStorage
        const storedNotifications = localStorage.getItem(`flodrama_${this.notificationsKey}`);
        if (storedNotifications) {
          this.notifications = JSON.parse(storedNotifications);
          
          // Trouver le prochain ID
          if (this.notifications.length > 0) {
            const maxId = Math.max(...this.notifications.map(n => n.id));
            this.nextId = maxId + 1;
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      this.notifications = [];
    }
  }
  
  /**
   * Sauvegarder les notifications
   * @private
   */
  async _saveNotifications() {
    if (!this.persistNotifications) {
      return;
    }
    
    try {
      if (this.storageService) {
        await this.storageService.set(this.notificationsKey, this.notifications);
      } else {
        // Fallback sur localStorage
        localStorage.setItem(
          `flodrama_${this.notificationsKey}`, 
          JSON.stringify(this.notifications)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notifications:', error);
    }
  }
  
  /**
   * Ajouter un écouteur de notifications
   * @param {Function} listener - Fonction appelée lors d'une notification
   * @returns {Function} - Fonction pour supprimer l'écouteur
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      console.error('L\'écouteur doit être une fonction');
      return () => { /* Fonction vide intentionnellement */ };
    }
    
    this.listeners.push(listener);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notifier les écouteurs
   * @param {Object} notification - Notification
   * @private
   */
  _notifyListeners(notification) {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Erreur dans un écouteur de notification:', error);
      }
    });
    
    // Émettre un événement personnalisé
    const event = new CustomEvent('notification', {
      detail: { notification }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Créer une notification
   * @param {string} message - Message de la notification
   * @param {Object} options - Options de la notification
   * @param {string} options.type - Type de notification (info, success, warning, error)
   * @param {string} options.title - Titre de la notification
   * @param {number} options.duration - Durée en ms (0 pour persistante)
   * @param {boolean} options.dismissible - Si la notification peut être fermée
   * @param {string} options.icon - Icône de la notification
   * @param {Function} options.onClick - Fonction appelée au clic
   * @param {Object} options.data - Données supplémentaires
   * @returns {Object} - Notification créée
   */
  notify(message, options = {}) {
    if (!message) {
      console.error('Message de notification non fourni');
      return null;
    }
    
    // Créer la notification
    const notification = {
      id: this.nextId++,
      message,
      type: options.type || 'info',
      title: options.title || '',
      timestamp: new Date().toISOString(),
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      dismissible: options.dismissible !== undefined ? options.dismissible : true,
      icon: options.icon || null,
      read: false,
      data: options.data || {}
    };
    
    // Ajouter aux notifications
    this.notifications.unshift(notification);
    
    // Limiter le nombre de notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
    
    // Sauvegarder les notifications
    this._saveNotifications();
    
    // Ajouter aux notifications actives
    this.activeNotifications.push(notification);
    
    // Notifier les écouteurs
    this._notifyListeners(notification);
    
    // Si la notification a une durée, la fermer automatiquement
    if (notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }
    
    // Si un gestionnaire de clic est fourni, l'attacher
    if (typeof options.onClick === 'function') {
      notification.onClick = options.onClick;
    }
    
    console.log(`Notification créée: ${notification.type} - ${notification.message}`);
    return notification;
  }
  
  /**
   * Créer une notification d'information
   * @param {string} message - Message de la notification
   * @param {Object} options - Options de la notification
   * @returns {Object} - Notification créée
   */
  info(message, options = {}) {
    return this.notify(message, { ...options, type: 'info' });
  }
  
  /**
   * Créer une notification de succès
   * @param {string} message - Message de la notification
   * @param {Object} options - Options de la notification
   * @returns {Object} - Notification créée
   */
  success(message, options = {}) {
    return this.notify(message, { ...options, type: 'success' });
  }
  
  /**
   * Créer une notification d'avertissement
   * @param {string} message - Message de la notification
   * @param {Object} options - Options de la notification
   * @returns {Object} - Notification créée
   */
  warning(message, options = {}) {
    return this.notify(message, { ...options, type: 'warning' });
  }
  
  /**
   * Créer une notification d'erreur
   * @param {string} message - Message de la notification
   * @param {Object} options - Options de la notification
   * @returns {Object} - Notification créée
   */
  error(message, options = {}) {
    return this.notify(message, { ...options, type: 'error' });
  }
  
  /**
   * Fermer une notification
   * @param {number} id - ID de la notification
   * @returns {boolean} - Succès de l'opération
   */
  dismiss(id) {
    // Supprimer des notifications actives
    this.activeNotifications = this.activeNotifications.filter(n => n.id !== id);
    
    // Émettre un événement de fermeture
    const event = new CustomEvent('notification-dismissed', {
      detail: { id }
    });
    document.dispatchEvent(event);
    
    return true;
  }
  
  /**
   * Marquer une notification comme lue
   * @param {number} id - ID de la notification
   * @returns {boolean} - Succès de l'opération
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this._saveNotifications();
      return true;
    }
    return false;
  }
  
  /**
   * Marquer toutes les notifications comme lues
   * @returns {boolean} - Succès de l'opération
   */
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this._saveNotifications();
    return true;
  }
  
  /**
   * Obtenir toutes les notifications
   * @param {Object} filters - Filtres
   * @param {boolean} filters.unreadOnly - Seulement les non lues
   * @param {string} filters.type - Type de notification
   * @param {number} limit - Limite de résultats
   * @returns {Array} - Notifications
   */
  getNotifications(filters = {}, limit = 0) {
    let results = [...this.notifications];
    
    // Filtrer par statut de lecture
    if (filters.unreadOnly) {
      results = results.filter(n => !n.read);
    }
    
    // Filtrer par type
    if (filters.type) {
      results = results.filter(n => n.type === filters.type);
    }
    
    // Limiter les résultats
    if (limit > 0 && results.length > limit) {
      results = results.slice(0, limit);
    }
    
    return results;
  }
  
  /**
   * Obtenir les notifications actives
   * @returns {Array} - Notifications actives
   */
  getActiveNotifications() {
    return [...this.activeNotifications];
  }
  
  /**
   * Obtenir le nombre de notifications non lues
   * @returns {number} - Nombre de notifications non lues
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
  
  /**
   * Supprimer une notification
   * @param {number} id - ID de la notification
   * @returns {boolean} - Succès de l'opération
   */
  removeNotification(id) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.activeNotifications = this.activeNotifications.filter(n => n.id !== id);
    
    if (this.notifications.length !== initialLength) {
      this._saveNotifications();
      return true;
    }
    
    return false;
  }
  
  /**
   * Supprimer toutes les notifications
   * @param {Object} filters - Filtres
   * @param {boolean} filters.readOnly - Seulement les lues
   * @param {string} filters.type - Type de notification
   * @returns {boolean} - Succès de l'opération
   */
  clearNotifications(filters = {}) {
    if (Object.keys(filters).length === 0) {
      // Supprimer toutes les notifications
      this.notifications = [];
      this.activeNotifications = [];
    } else {
      // Appliquer les filtres
      let shouldKeep = (_n) => true;
      
      if (filters.readOnly) {
        shouldKeep = (_n) => !_n.read;
      }
      
      if (filters.type) {
        const prevKeep = shouldKeep;
        shouldKeep = (_n) => prevKeep(_n) && _n.type !== filters.type;
      }
      
      this.notifications = this.notifications.filter(shouldKeep);
      this.activeNotifications = this.activeNotifications.filter(shouldKeep);
    }
    
    this._saveNotifications();
    return true;
  }
}

// Exporter une instance par défaut pour une utilisation simplifiée
export default NotificationService;
